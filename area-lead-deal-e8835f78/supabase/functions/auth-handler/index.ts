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
        // Use SERVICE_ROLE_KEY to bypass "Allow Signups" and "Confirm Email" settings
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Use Service Role Key here
        )
        if (!supabaseAdmin) {
            throw new Error('Failed to create Supabase Admin client')
        }

        const payload = await req.json()
        const { action, email, phone, password, name, category_id, sub_category_id, role, location_lat, location_long, service_radius_km } = payload

        // --- REGISTER ---
        if (action === 'register') {
            if (!email || !password || !name) {
                throw new Error('Missing required fields: email, password, name')
            }

            // Using Admin API to create user
            // 1. autoConfirm: true (Skips email verification step)
            // 2. user_metadata: Stores our custom fields
            const { data, error } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true, // Bypass email confirmation
                user_metadata: {
                    name,
                    phone,
                    category_id,
                    sub_category_id,
                    role: role || 'user',
                    location_lat,
                    location_long,
                    service_radius_km
                }
            })


            if (error) throw error

            return new Response(JSON.stringify({ success: true, data }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        // --- LOGIN ---
        if (action === 'login') {

            const supabaseClient = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_ANON_KEY') ?? ''
            )

            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password,
            })

            if (error) throw error

            return new Response(JSON.stringify({ success: true, data }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        throw new Error('Invalid action')

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
