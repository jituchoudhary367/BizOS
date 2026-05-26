import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const payload = await req.json()
    const { message_id, business_id, customer_id, customer_name, from_number, text } = payload

    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')

    // Call AI service to parse intent
    const aiUrl = Deno.env.get('AI_SERVICE_URL') || 'http://localhost:8000'
    const parsedResp = await fetch(`${aiUrl}/api/whatsapp/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message_id,
        business_id,
        customer_id,
        customer_name,
        phone: from_number,
        text,
      }),
    })

    if (!parsedResp.ok) {
      console.warn('AI parse failed', await parsedResp.text())
      return new Response(JSON.stringify({ ok: false }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    const parsed = await parsedResp.json()

    // Parser now creates order directly and returns order_id.
    if (parsed?.order_id) {
      const functionsUrl = Deno.env.get('SUPABASE_FUNCTIONS_URL') || ''
      const destination = from_number || payload.phone || ''

      if (functionsUrl && destination) {
        await fetch(`${functionsUrl}/send-whatsapp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: destination,
            message: `Your order ${parsed.order_id} has been created successfully.`,
            business_id,
          }),
        }).catch(() => null)
      }

      // Update whatsapp_messages with linked order (row id or external message_id)
      await supabase
        .from('whatsapp_messages')
        .update({ linked_order_id: parsed.order_id })
        .or(`id.eq.${message_id},message_id.eq.${message_id}`)
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    console.error('process-whatsapp-message error', error)
    return new Response(JSON.stringify({ error: String(error) }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
  }
})
