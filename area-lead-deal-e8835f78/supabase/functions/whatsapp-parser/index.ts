import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || '';

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const payload = await req.json()
        const { message, sender, msgId } = payload

        if (!message) {
            throw new Error('Message content is required')
        }

        // Initialize Supabase Admin Client
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Log the incoming message (Async, don't await blocking)
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

        if (logError) console.error('Supabase Log Error:', logError)

        // 2. Prepare Prompt for Gemini
        // We instruct Gemini to return strictly JSON
        const systemPrompt = `
You are an AI assistant for "Leads Nearby". Parse the following WhatsApp message into structured data.
Taxonomy:
- Categories: Home Repairs, Electronic, Academic, Events, Logistics, Personal Care, Cleaning, Professional, IT, Urgent, Hospitality.
- JSON Format:
{
  "intent": "service_request" | "general_query" | "spam",
  "category": "String" (Best match from taxonomy or null),
  "sub_category": "String" (Specific service or null),
  "location": "String" (City/Area or null),
  "urgency": "high" | "medium" | "low",
  "summary": "Short title"
}
Return ONLY the JSON.
Message: "${message}"
        `;

        // 3. Call Gemini API
        let aiResult = null;
        if (GEMINI_API_KEY) {
            const geminiResponse = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: systemPrompt }] }]
                    })
                }
            );

            const geminiData = await geminiResponse.json();

            if (geminiData.candidates && geminiData.candidates[0]?.content?.parts[0]?.text) {
                const rawText = geminiData.candidates[0].content.parts[0].text;
                // Clean up markdown code blocks if Gemini sends them
                const jsonText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
                try {
                    aiResult = JSON.parse(jsonText);
                } catch (e) {
                    console.error('Failed to parse Gemini JSON:', rawText);
                    aiResult = { error: 'Failed to parse AI response' };
                }
            } else {
                console.error('Invalid Gemini Response:', geminiData);
            }
        } else {
            console.warn('GEMINI_API_KEY is missing');
        }

        // 4. Update Database with Result
        if (entry && aiResult) {
            await supabaseAdmin
                .from('whatsapp_messages')
                .update({
                    confidence_score: aiResult.category ? 0.9 : 0.5,
                    personal_data: aiResult, // Storing the analysis in JSONB column
                    status: 'analyzed'
                })
                .eq('id', entry.id)
        }

        return new Response(JSON.stringify({ success: true, analysis: aiResult }), {
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
