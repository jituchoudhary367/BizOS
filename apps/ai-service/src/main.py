from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
import asyncio
import json
import os
from contextlib import asynccontextmanager

from .brain import BrainAgent
from .whatsapp_parser import WhatsAppParser
from .graph_builder import build_agent_graph
from .supabase_client import get_supabase

app = FastAPI(title="BizOS AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

brain_agent = BrainAgent()
wa_parser = WhatsAppParser()


# ─── Models ────────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str
    business_id: str
    context: Optional[dict] = {}


class WhatsAppParseRequest(BaseModel):
    message_id: str
    business_id: str
    customer_id: Optional[str] = None
    customer_name: Optional[str] = "Unknown"
    text: str
    phone: Optional[str] = None


class AgentTriggerRequest(BaseModel):
    agent_name: str
    action: str
    input: dict
    business_id: str


class ForecastRequest(BaseModel):
    business_id: str
    product_id: str
    horizon_days: int = 7
    lookback_days: int = 30


class BrainConfirmRequest(BaseModel):
    business_id: str
    confirmation_id: str
    approved: bool
    payload: Optional[dict] = None


# ─── GET /health ───────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "service": "BizOS AI Service"}


# ─── POST /api/brain/chat (streaming) ─────────────────────
@app.post("/api/brain/chat")
async def brain_chat(req: ChatRequest):
    """Stream AI response token by token."""
    async def generate():
        async for chunk in brain_agent.stream_response(
            message=req.message,
            business_id=req.business_id,
            context=req.context,
        ):
            yield f"data: {json.dumps({'text': chunk})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ─── POST /api/whatsapp/parse ──────────────────────────────
@app.post("/api/whatsapp/parse")
async def parse_whatsapp(req: WhatsAppParseRequest):
    """Parse WhatsApp message into structured order intent."""
    try:
        result = await wa_parser.parse(
            text=req.text,
            business_id=req.business_id,
            customer_id=req.customer_id,
            customer_name=req.customer_name,
            phone=req.phone,
            message_id=req.message_id,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── POST /api/agents/trigger ─────────────────────────────
@app.post("/api/agents/trigger")
async def trigger_agent(req: AgentTriggerRequest):
    """Trigger a named agent to perform an action."""
    graph = build_agent_graph(req.agent_name, req.business_id)
    result = await graph.ainvoke({
        "action": req.action,
        "input": req.input,
        "business_id": req.business_id,
    })
    return result


# ─── POST /api/ai/agents/:agent_name ─────────────────────
@app.post("/api/ai/agents/{agent_name}")
async def run_named_agent(agent_name: str, req: AgentTriggerRequest):
    """Run a named agent endpoint used by edge functions/integrations."""
    graph = build_agent_graph(agent_name, req.business_id)
    result = await graph.ainvoke({
        "action": req.action,
        "input": req.input,
        "business_id": req.business_id,
    })
    return result


# ─── POST /api/ai/forecast/product ────────────────────────
@app.post("/api/ai/forecast/product")
async def forecast_product(req: ForecastRequest):
    """Simple demand forecast based on recent order velocity."""
    supabase = get_supabase()
    horizon_days = max(1, min(req.horizon_days, 90))
    lookback_days = max(7, min(req.lookback_days, 180))

    try:
      since = (__import__('datetime').datetime.utcnow() - __import__('datetime').timedelta(days=lookback_days)).isoformat()
      resp = supabase.from_("order_items") \
          .select("quantity, order_id, orders!inner(business_id, created_at)") \
          .eq("product_id", req.product_id) \
          .eq("orders.business_id", req.business_id) \
          .gte("orders.created_at", since) \
          .execute()

      rows = resp.data or []
      total_qty = sum(float(r.get("quantity") or 0) for r in rows)
      daily_rate = total_qty / float(lookback_days)
      forecast_qty = max(0.0, round(daily_rate * horizon_days, 2))

      return {
          "business_id": req.business_id,
          "product_id": req.product_id,
          "lookback_days": lookback_days,
          "horizon_days": horizon_days,
          "daily_rate": round(daily_rate, 4),
          "forecast_quantity": forecast_qty,
          "sample_size": len(rows),
      }
    except Exception as e:
      raise HTTPException(status_code=500, detail=str(e))


# ─── POST /api/ai/brain/confirm ───────────────────────────
@app.post("/api/ai/brain/confirm")
async def brain_confirm(req: BrainConfirmRequest):
    """Persist a confirmation decision for client-driven action cards."""
    supabase = get_supabase()
    try:
        record = {
            "business_id": req.business_id,
            "type": "confirmation",
            "title": f"Action {'approved' if req.approved else 'rejected'}",
            "description": f"Confirmation {req.confirmation_id}",
            "priority": "medium",
            "status": "new",
            "metadata": {
                "confirmation_id": req.confirmation_id,
                "approved": req.approved,
                "payload": req.payload or {},
            },
        }
        supabase.from_("ai_insights").insert(record).execute()
        return {"ok": True, "confirmation_id": req.confirmation_id, "approved": req.approved}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── GET /api/insights/:business_id ───────────────────────
@app.get("/api/insights/{business_id}")
async def get_insights(business_id: str):
    """Get AI-generated business insights."""
    supabase = get_supabase()
    try:
        response = supabase.from_("ai_insights") \
            .select("*") \
            .eq("business_id", business_id) \
            .eq("is_dismissed", False) \
            .order("created_at", desc=True) \
            .limit(10) \
            .execute()
        return {"insights": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
