import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-razorpay-signature",
};

const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET")!;

async function hmacSha256(key: string, message: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    const messageData = encoder.encode(message);

    const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
    return Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        const body = await req.text();
        const signature = req.headers.get("x-razorpay-signature");

        // Verify webhook signature
        if (signature) {
            const expectedSignature = await hmacSha256(RAZORPAY_KEY_SECRET, body);

            if (signature !== expectedSignature) {
                console.error("Invalid signature");
                return new Response(JSON.stringify({ error: "Invalid signature" }), {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }
        }

        const payload = JSON.parse(body);
        const event = payload.event;
        const paymentEntity = payload.payload?.payment?.entity;
        const subscriptionEntity = payload.payload?.subscription?.entity;

        console.log("Razorpay webhook event:", event);

        if (event === "payment.captured" || event === "payment.authorized") {
            const orderId = paymentEntity?.order_id;
            const paymentId = paymentEntity?.id;
            const notes = paymentEntity?.notes;
            const userId = notes?.user_id;

            if (!userId) {
                console.error("No user_id in payment notes");
                return new Response(JSON.stringify({ error: "No user_id" }), {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }

            // Update payment record
            // NOTE: Ensure 'payments' table exists or update this to 'subscriptions' if that's the intention
            const { error: paymentError } = await supabaseClient
                .from("payments")
                .update({
                    status: "completed",
                    gateway_transaction_id: paymentId,
                    updated_at: new Date().toISOString(),
                })
                .eq("gateway_order_id", orderId);

            // Update user subscription profile
            await supabaseClient
                .from("profiles")
                .update({
                    is_subscribed: true,
                    subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
                    updated_at: new Date().toISOString(),
                })
                .eq("id", userId);

            // Create notification
            await supabaseClient.from("notifications").insert({
                user_id: userId,
                type: "subscription",
                title: "Subscription Activated! 🎉",
                body: `Your premium subscription is now active!`,
            });
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error: any) {
        console.error("Webhook error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
