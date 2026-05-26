import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const { order_id } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch order with items
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, order_items(*, products(*)), customers(*)')
      .eq('id', order_id)
      .single()

    if (orderError) throw orderError

    // Fetch business for GST details
    const { data: business } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', order.business_id)
      .single()

    // Generate invoice number
    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', order.business_id)

    const invoiceNumber = `INV-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, '0')}`

    // Compute GST (intra-state: CGST+SGST, inter-state: IGST)
    const isIntraState = order.customers?.state === business?.address?.includes(order.customers?.state)
    const taxAmount = order.tax_amount || 0
    const cgst = isIntraState ? taxAmount / 2 : 0
    const sgst = isIntraState ? taxAmount / 2 : 0
    const igst = isIntraState ? 0 : taxAmount

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        business_id: order.business_id,
        order_id: order.id,
        customer_id: order.customer_id,
        invoice_number: invoiceNumber,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + (order.customers?.payment_terms_days || 30) * 86400000).toISOString().split('T')[0],
        status: 'draft',
        subtotal: order.total_amount - order.tax_amount,
        tax_amount: taxAmount,
        cgst_amount: cgst,
        sgst_amount: sgst,
        igst_amount: igst,
        discount_amount: order.discount_amount || 0,
        total_amount: order.total_amount,
      })
      .select()
      .single()

    if (invoiceError) throw invoiceError

    return new Response(JSON.stringify({ invoice }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
