"""
LangGraph Agent Orchestration — Business agents as stateful graphs
"""
from langgraph.graph import StateGraph, END
from typing import TypedDict, Optional, Any
from .supabase_client import get_supabase
import google.generativeai as genai
import os

genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))


class AgentState(TypedDict):
    action: str
    input: dict
    business_id: str
    result: Optional[Any]
    error: Optional[str]
    approved: bool


def build_agent_graph(agent_name: str, business_id: str) -> StateGraph:
    """Build a LangGraph agent graph for the given agent."""
    workflow = StateGraph(AgentState)

    if agent_name == "collections":
        workflow.add_node("fetch_overdue", fetch_overdue_invoices)
        workflow.add_node("risk_score", compute_risk_scores)
        workflow.add_node("send_reminders", send_whatsapp_reminders)
        workflow.set_entry_point("fetch_overdue")
        workflow.add_edge("fetch_overdue", "risk_score")
        workflow.add_conditional_edges("risk_score", should_send_reminder, {"yes": "send_reminders", "no": END})
        workflow.add_edge("send_reminders", END)

    elif agent_name == "inventory_monitor":
        workflow.add_node("check_stock", check_stock_levels)
        workflow.add_node("generate_alerts", generate_stock_alerts)
        workflow.add_node("create_po", create_purchase_order)
        workflow.set_entry_point("check_stock")
        workflow.add_edge("check_stock", "generate_alerts")
        workflow.add_conditional_edges("generate_alerts", needs_po, {"yes": "create_po", "no": END})
        workflow.add_edge("create_po", END)

    elif agent_name == "order_intake":
        workflow.add_node("parse_message", parse_order_message)
        workflow.add_node("create_order", create_order_node)
        workflow.add_node("send_confirmation", send_confirmation)
        workflow.set_entry_point("parse_message")
        workflow.add_edge("parse_message", "create_order")
        workflow.add_edge("create_order", "send_confirmation")
        workflow.add_edge("send_confirmation", END)

    else:
        # Generic agent
        workflow.add_node("execute", generic_execute)
        workflow.set_entry_point("execute")
        workflow.add_edge("execute", END)

    return workflow.compile()


# ─── Node implementations ──────────────────────────────────

async def fetch_overdue_invoices(state: AgentState) -> AgentState:
    supabase = get_supabase()
    from datetime import datetime
    today = datetime.now().date().isoformat()
    result = supabase.from_("invoices") \
        .select("*, customers(name, phone)") \
        .eq("business_id", state["business_id"]) \
        .in_("status", ["sent"]) \
        .lt("due_date", today) \
        .execute()
    return {**state, "result": result.data}


async def compute_risk_scores(state: AgentState) -> AgentState:
    from datetime import datetime
    invoices = state.get("result", [])
    today = datetime.now()
    scored = []
    for inv in invoices:
        due = datetime.fromisoformat(inv["due_date"])
        days_overdue = (today - due).days
        risk = min(1.0, days_overdue / 30.0)
        scored.append({**inv, "days_overdue": days_overdue, "risk_score": risk})

    # Update overdue status
    supabase = get_supabase()
    for inv in scored:
        supabase.from_("invoices").update({"status": "overdue"}).eq("id", inv["id"]).execute()

    return {**state, "result": scored}


def should_send_reminder(state: AgentState) -> str:
    invoices = state.get("result", [])
    high_risk = [i for i in invoices if i.get("risk_score", 0) >= 0.3]
    return "yes" if high_risk else "no"


async def send_whatsapp_reminders(state: AgentState) -> AgentState:
    invoices = state.get("result", [])
    sent = []
    for inv in invoices:
        if inv.get("risk_score", 0) >= 0.3 and inv.get("customers", {}).get("phone"):
            # Call WhatsApp service
            import httpx
            try:
                async with httpx.AsyncClient() as client:
                    await client.post(
                        f"{os.getenv('WHATSAPP_SERVICE_URL', 'http://localhost:3004')}/send",
                        json={
                            "to": inv["customers"]["phone"].replace("+", ""),
                            "business_id": inv["business_id"],
                            "message": f"Dear {inv['customers']['name']}, your invoice {inv['invoice_number']} of ₹{inv['total_amount']:,.0f} is {inv['days_overdue']} days overdue. Please arrange payment. Thank you — BizOS",
                        },
                        timeout=10,
                    )
                    sent.append(inv["invoice_number"])
            except Exception as e:
                print(f"Reminder failed for {inv['invoice_number']}: {e}")
    return {**state, "result": {"reminded": sent}}


async def check_stock_levels(state: AgentState) -> AgentState:
    supabase = get_supabase()
    result = supabase.from_("inventory_stock") \
        .select("*, products!inner(name, sku)") \
        .eq("business_id", state["business_id"]) \
        .execute()
    low = [r for r in (result.data or []) if r.get("quantity", 0) <= r.get("reorder_level", 0)]
    return {**state, "result": low}


async def generate_stock_alerts(state: AgentState) -> AgentState:
    supabase = get_supabase()
    low_items = state.get("result", [])
    for item in low_items:
        qty = item.get('quantity', 0)
        supabase.from_("ai_insights").upsert({
            "business_id": state["business_id"],
            "type": "stock_alert",
            "severity": "critical" if qty == 0 else "warning",
            "title": f"{item['products']['name']} is running low",
            "body": f"Current stock: {qty} {item.get('unit', 'units')}. Reorder level: {item.get('reorder_level')}.",
            "metadata": {"product_id": item["product_id"], "stock": qty},
        }).execute()
    return state


def needs_po(state: AgentState) -> str:
    return "yes" if state.get("result") else "no"


async def create_purchase_order(state: AgentState) -> AgentState:
    # Draft PO — requires human approval
    return {**state, "approved": False, "result": {"po_drafts": len(state.get("result", []))}}


async def parse_order_message(state: AgentState) -> AgentState:
    return state


async def create_order_node(state: AgentState) -> AgentState:
    return state


async def send_confirmation(state: AgentState) -> AgentState:
    return state


async def generic_execute(state: AgentState) -> AgentState:
    return {**state, "result": {"message": "Action executed"}}
