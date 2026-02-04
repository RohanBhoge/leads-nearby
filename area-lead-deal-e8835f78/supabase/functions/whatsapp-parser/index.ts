import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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
        // Note: Verify webhook signature here in production

        const payload = await req.json()
        const { message, sender, msgId } = payload // Adapting to your webhook payload structure

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Use Service Role for Admin tasks
        )

        // 1. Log the incoming message
        const { data: entry, error: logError } = await supabaseAdmin
            .from('whatsapp_messages')
            .insert({
                new_msg: message,
                sender_phone: sender,
                whatsapp_msg_id: msgId,
                status: 'processing'
            })
            .select()
            .single()

        if (logError) console.error('Error logging message:', logError)

        // 2. Call AI Service (Mock/Placeholder for Lovables AI)
        // const aiResponse = await fetch('https://api.lovables.ai/parse', { ... })
        // Mock response:
        const aiResult = {
            confidence: 0.85,
            data: { intent: 'service_request', category: 'Plumber', location: 'Pune' }
        }

        // 3. Update DB with AI Result
        if (entry) {
            await supabaseAdmin
                .from('whatsapp_messages')
                .update({
                    confidence_score: aiResult.confidence,
                    personal_data: aiResult.data,
                    status: 'analyzed'
                })
                .eq('id', entry.id)
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
