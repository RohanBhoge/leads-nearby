import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Razorpay from "npm:razorpay"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { amount, currency = "INR", receipt } = await req.json()

        const instance = new Razorpay({
            key_id: Deno.env.get("RAZORPAY_KEY_ID") || "",
            key_secret: Deno.env.get("RAZORPAY_KEY_SECRET") || "",
        })

        const options = {
            amount: amount * 100, // Razorpay works in smallest currency unit (paise)
            currency,
            receipt,
        }

        const order = await instance.orders.create(options)

        return new Response(JSON.stringify(order), {
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