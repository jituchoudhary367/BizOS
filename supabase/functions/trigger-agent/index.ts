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
    const { agent_name, action, input, business_id } = await req.json()

    const aiServiceUrl = Deno.env.get('AI_SERVICE_URL') || 'http://localhost:8000'

    const start = Date.now()
    let response = await fetch(`${aiServiceUrl}/api/ai/agents/${agent_name}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent_name, action, input, business_id }),
    })

    // Backward-compatible fallback route.
    if (!response.ok && response.status === 404) {
      response = await fetch(`${aiServiceUrl}/api/agents/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_name, action, input, business_id }),
      })
    }

    const result = await response.json()
    const duration = Date.now() - start

    // Log execution to agent_logs table
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    await supabase.from('agent_logs').insert({
      business_id,
      agent_name,
      action,
      input,
      output: result,
      duration_ms: duration,
      success: response.ok,
    })

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: response.ok ? 200 : 400,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
