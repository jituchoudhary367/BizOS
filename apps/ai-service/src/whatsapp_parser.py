"""
WhatsApp Order Parser — Gemini-powered NLU for Hindi/Hinglish order messages
"""
import os
import json
import asyncio
import re
from typing import Optional
import google.generativeai as genai
from .supabase_client import get_supabase

genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))

PARSE_PROMPT = """You are an order parser for an Indian hardware/wholesale business.
Parse this WhatsApp message into a structured order JSON.

Rules:
1. Extract product names, quantities, and units
2. Handle Hindi/English/Hinglish mix
3. Map product names to the closest match from the product catalog below
4. Return ONLY valid JSON, no markdown

Product catalog:
{product_catalog}

Customer: {customer_name}
Message: "{message}"

Return JSON in this exact format:
{{
  "intent": "order" | "inquiry" | "complaint" | "payment" | "other",
  "confidence": 0.0-1.0,
  "items": [
    {{
      "raw_text": "original mention",
      "product_id": "uuid or null",
      "product_name": "matched name",
      "quantity": number,
      "unit": "kg/bag/piece/litre/etc"
    }}
  ],
  "delivery_note": "any delivery instructions",
  "urgency": "normal" | "urgent" | "scheduled"
}}"""


class WhatsAppParser:
    def __init__(self):
        self.has_model = bool(os.getenv("GEMINI_API_KEY", ""))
        self.model = None
        if self.has_model:
            self.model = genai.GenerativeModel(
                model_name="gemini-1.5-flash",
                generation_config={"temperature": 0.1, "max_output_tokens": 1024},
            )

    async def parse(
        self,
        text: str,
        business_id: str,
        customer_id: Optional[str],
        customer_name: Optional[str],
        phone: Optional[str],
        message_id: str,
    ) -> dict:
        """Parse WhatsApp message and create order if intent is 'order'."""
        supabase = get_supabase()

        # Fetch product catalog
        products = supabase.from_("products") \
            .select("id, name, sku, unit, selling_price") \
            .eq("business_id", business_id) \
            .eq("is_active", True) \
            .limit(100) \
            .execute()

        product_catalog = "\n".join([
            f"- {p['name']} (ID: {p['id']}, SKU: {p['sku']}, Unit: {p['unit']}, Price: ₹{p['selling_price']})"
            for p in (products.data or [])
        ])

        prompt = PARSE_PROMPT.format(
            product_catalog=product_catalog or "No products in catalog",
            customer_name=customer_name or "Unknown",
            message=text,
        )

        parsed = None
        response = None

        if self.model:
            try:
                response = await asyncio.to_thread(
                    lambda: self.model.generate_content(prompt).text
                )

                # Extract JSON from response
                parsed = json.loads(response.strip())

            except (json.JSONDecodeError, Exception) as e:
                print(f"Parse error: {e}, response: {response if response is not None else 'N/A'}")

        if parsed is None:
            parsed = self._fallback_parse(text, product_catalog, customer_name)

        # Update message with parse result
        supabase.from_("whatsapp_messages") \
            .update({"parsed_intent": parsed, "ai_processed": True}) \
            .eq("id", message_id) \
            .execute()

        # Auto-create order if intent is 'order' and confidence > 0.7
        if parsed.get("intent") == "order" and parsed.get("confidence", 0) >= 0.7:
            order_id = await self._create_order(parsed, business_id, customer_id, message_id, supabase)
            if order_id:
                parsed["order_id"] = order_id

        return parsed

    def _fallback_parse(self, text: str, product_catalog: str, customer_name: Optional[str]) -> dict:
        """Deterministic parser for dev/offline use when LLMs are unavailable."""
        quantity_match = re.search(r"(\d+(?:\.\d+)?)", text)
        quantity = float(quantity_match.group(1)) if quantity_match else 1.0
        lowered = text.lower()

        product_name = None
        product_id = None
        for line in product_catalog.splitlines():
            if not line.startswith("-"):
                continue
            name_part = line[2:].split(" (ID:", 1)[0].strip()
            if name_part.lower() in lowered:
                product_name = name_part
                id_match = re.search(r"ID:\s*([^,]+)", line)
                product_id = id_match.group(1) if id_match else None
                break

        if not product_name and product_catalog:
            first_line = next((line for line in product_catalog.splitlines() if line.startswith("-")), None)
            if first_line:
                product_name = first_line[2:].split(" (ID:", 1)[0].strip()
                id_match = re.search(r"ID:\s*([^,]+)", first_line)
                product_id = id_match.group(1) if id_match else None

        intent = "order" if any(token in lowered for token in ["order", "need", "chahiye", "bhejo", "send", "supply", "bag", "piece", "pcs"]) else "inquiry"

        return {
            "intent": intent,
            "confidence": 0.72 if intent == "order" else 0.45,
            "items": [
                {
                    "raw_text": text,
                    "product_id": product_id,
                    "product_name": product_name or text.split()[0] if text.split() else "Unknown",
                    "quantity": quantity,
                    "unit": "piece",
                }
            ] if intent == "order" else [],
            "delivery_note": f"Parsed for {customer_name or 'Unknown'}",
            "urgency": "normal",
        }

    async def _create_order(self, parsed: dict, business_id: str, customer_id: Optional[str], message_id: str, supabase):
        """Create order from parsed WhatsApp message."""
        if not customer_id or not parsed.get("items"):
            return None

        # Compute order total
        total = 0
        order_items = []
        for item in parsed["items"]:
            if item.get("product_id"):
                product = supabase.from_("products").select("selling_price, tax_rate").eq("id", item["product_id"]).single().execute()
                if product.data:
                    line = product.data["selling_price"] * item["quantity"]
                    total += line * (1 + product.data.get("tax_rate", 18) / 100)
                    order_items.append({
                        "product_id": item["product_id"],
                        "quantity": item["quantity"],
                        "unit_price": product.data["selling_price"],
                        "line_total": line,
                    })

        if not order_items:
            return None

        # Create order
        count_resp = supabase.from_("orders").select("id", count="exact").eq("business_id", business_id).execute()
        order_num = f"ORD-{__import__('datetime').datetime.now().year}-{str((count_resp.count or 0) + 1).zfill(4)}"

        order = supabase.from_("orders").insert({
            "business_id": business_id,
            "customer_id": customer_id,
            "order_number": order_num,
            "status": "pending",
            "source": "whatsapp",
            "total_amount": total,
            "tax_amount": total * 0.18,
            "notes": parsed.get("delivery_note"),
            "whatsapp_message_id": message_id,
        }).select().single().execute()

        if order.data:
            supabase.from_("order_items").insert([
                {**item, "order_id": order.data["id"]}
                for item in order_items
            ]).execute()
            return order.data["id"]

        return None
