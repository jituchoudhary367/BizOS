import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { invoice_id, amount, currency = 'INR' } = await req.json()
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')

    // Resolve invoice
    const { data: invoice } = await supabase.from('invoices').select('*').eq('id', invoice_id).single()
    if (!invoice) throw new Error('Invoice not found')

    // Create Razorpay payment link (requires keys)
    const key = Deno.env.get('RAZORPAY_KEY_ID')
    const secret = Deno.env.get('RAZORPAY_KEY_SECRET')
    if (!key || !secret) throw new Error('Razorpay not configured')

    const resp = await fetch('https://api.razorpay.com/v1/payment_links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${btoa(key + ':' + secret)}` },
      body: JSON.stringify({ amount: Math.round((amount || invoice.total_amount) * 100), currency, reference_id: String(invoice_id), description: `Payment for invoice ${invoice.invoice_number}`, customer: { name: invoice.customer_name || '', contact: invoice.customer_phone || '' }, notify: { sms: true, email: true } })
    })

    const json = await resp.json()
    if (!resp.ok) throw new Error(JSON.stringify(json))

    // Update invoice with payment link
    await supabase.from('invoices').update({ payment_link: json.short_url }).eq('id', invoice_id)

    return new Response(JSON.stringify({ ok: true, link: json.short_url }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
  }
})
