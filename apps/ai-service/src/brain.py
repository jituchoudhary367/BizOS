"""
BizOS Brain Agent — Streaming Gemini 1.5 Pro + Groq/LLaMA3 fallback
"""
import os
import asyncio
from typing import AsyncGenerator, Optional
import google.generativeai as genai
from groq import AsyncGroq
from .supabase_client import get_supabase

genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))
groq_client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY", ""))


SYSTEM_PROMPT = """You are BizOS Brain — the AI operating system for Indian small businesses.
You understand business operations, inventory management, GST, invoicing, collections, and cash flow.
You speak in clear business language. You can understand Hinglish (Hindi + English) seamlessly.

You have real-time access to this business's data including:
- Orders, customers, inventory, invoices, payments, staff

When responding:
1. Be concise and action-oriented
2. Format financial data in INR (₹)
3. Use tables for structured data
4. Always suggest next actions
5. Never execute writes without confirmation (unless agent has auto mode)
6. If a user asks to create/update something, show a confirmation card

Current business context will be injected at runtime."""


class BrainAgent:
    def __init__(self):
        self.has_gemini = bool(os.getenv("GEMINI_API_KEY", ""))
        self.model = None
        if self.has_gemini:
            self.model = genai.GenerativeModel(
                model_name="gemini-1.5-pro",
                generation_config={
                    "temperature": 0.7,
                    "top_p": 0.95,
                    "max_output_tokens": 2048,
                },
            )

    async def get_business_context(self, business_id: str) -> str:
        """Fetch relevant business context to inject into prompt."""
        supabase = get_supabase()
        try:
            # Fetch key metrics
            business = supabase.from_("businesses").select("name, type, plan").eq("id", business_id).single().execute()
            pending = supabase.from_("orders").select("id", count="exact").eq("business_id", business_id).eq("status", "pending").execute()
            low_stock = supabase.from_("inventory_stock").select("*", count="exact").eq("business_id", business_id).lt("quantity", "reorder_level").execute()

            return f"""
Business: {business.data.get('name', 'Unknown')} ({business.data.get('type', 'retail')})
Pending orders: {pending.count or 0}
Low stock alerts: {low_stock.count or 0}
Date: {__import__('datetime').datetime.now().strftime('%d %B %Y')}"""
        except Exception:
            return "Business context unavailable."

    async def stream_response(
        self,
        message: str,
        business_id: str,
        context: Optional[dict] = None,
    ) -> AsyncGenerator[str, None]:
        """Stream response using Gemini 1.5 Pro with Groq fallback."""
        business_context = await self.get_business_context(business_id)
        full_prompt = f"{SYSTEM_PROMPT}\n\n{business_context}\n\nUser: {message}"

        if not self.model and not os.getenv("GROQ_API_KEY", ""):
            yield f"I can help with that. Context: {business_context}. Next step: connect Gemini or Groq keys for richer answers."
            return

        try:
            # Try Gemini 1.5 Pro first
            if self.model:
                response = await asyncio.to_thread(self._stream_gemini, full_prompt)
                async for chunk in response:
                    yield chunk
                return
        except Exception as e:
            print(f"Gemini failed ({e}), falling back to Groq/LLaMA3...")

        if os.getenv("GROQ_API_KEY", ""):
            async for chunk in self._stream_groq(message, business_context):
                yield chunk
            return

        yield f"I can help with that. Context: {business_context}."

    def _stream_gemini(self, prompt: str):
        """Sync Gemini streaming (run in executor)."""
        response = self.model.generate_content(prompt, stream=True)
        for chunk in response:
            if chunk.text:
                yield chunk.text

    async def _stream_groq(self, message: str, context: str) -> AsyncGenerator[str, None]:
        """Groq/LLaMA3 streaming fallback."""
        stream = await groq_client.chat.completions.create(
            model="llama3-70b-8192",
            messages=[
                {"role": "system", "content": f"{SYSTEM_PROMPT}\n\n{context}"},
                {"role": "user", "content": message},
            ],
            stream=True,
            max_tokens=2048,
        )
        async for chunk in stream:
            content = chunk.choices[0].delta.content
            if content:
                yield content
