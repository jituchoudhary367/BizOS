import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, message, template, parameters, business_id } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') ?? ''
    const accessToken = Deno.env.get('META_ACCESS_TOKEN') ?? Deno.env.get('WHATSAPP_ACCESS_TOKEN') ?? ''

    if (!phoneNumberId || !accessToken) {
      throw new Error('WhatsApp API not configured')
    }

    let body: Record<string, unknown>
    if (template) {
      body = {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: template,
          language: { code: 'en' },
          components: parameters ? [{
            type: 'body',
            parameters: parameters.map((p: string) => ({ type: 'text', text: p }))
          }] : [],
        },
      }
    } else {
      body = {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: message, preview_url: false },
      }
    }

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    )

    const data = await response.json()

    // Store outbound message in database
    if (data.messages?.[0]?.id && business_id) {
      const { data: biz } = await supabase
        .from('businesses')
        .select('whatsapp_number')
        .eq('id', business_id)
        .single()

      await supabase.from('whatsapp_messages').insert({
        business_id,
        message_id: data.messages[0].id,
        from_number: biz?.whatsapp_number || 'business',
        to_number: to?.startsWith('+') ? to : `+${to}`,
        direction: 'outbound',
        message_type: template ? 'template' : 'text',
        body: message || template,
        status: 'sent',
      })
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: response.ok ? 200 : 400,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
