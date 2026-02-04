import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LeadNotificationPayload {
    lead_id: string;
    lead_lat: number;
    lead_long: number;
    category_id: string;      // NEW: Filter by Category
    sub_category_id?: string; // NEW: Optional Filter by SubCategory
    service_name: string;     // Display name (e.g. "Plumber")
    location_address: string;
}

// Calculate distance between two points in kilometers (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Send WhatsApp message via MSG91
async function sendWhatsAppMessage(
    phone: string,
    templateName: string,
    integratedNumber: string,
    authKey: string,
    bodyParams: string[],
    buttonSuffix?: string
): Promise<boolean> {
    try {
        // Format phone number for MSG91 (ensure 91 prefix for India)
        const formattedPhone = phone.startsWith("91") ? phone : `91${phone.replace(/^0+/, "")}`;

        // Build components object for MSG91 template
        const componentsObj: Record<string, { type: string; value: string }> = {};

        // Add body parameters
        bodyParams.forEach((value, index) => {
            componentsObj[`body_${index + 1}`] = { type: "text", value };
        });

        const payload = {
            integrated_number: integratedNumber,
            content_type: "template",
            payload: {
                messaging_product: "whatsapp",
                type: "template",
                template: {
                    name: templateName,
                    language: { code: "en", policy: "deterministic" },
                    namespace: "3b05c3f3_e623_4398_b62b_92c05599164a",
                    to_and_components: [
                        {
                            to: [formattedPhone],
                            components: componentsObj
                        }
                    ]
                }
            },
        };

        console.log("Sending WhatsApp notification to:", formattedPhone);

        const response = await fetch(
            "https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/",
            {
                method: "POST",
                headers: { "Content-Type": "application/json", authkey: authKey },
                body: JSON.stringify(payload),
            }
        );

        const result = await response.json();
        return response.ok && result.status !== "fail";
    } catch (error) {
        console.error("Error sending WhatsApp message:", error);
        return false;
    }
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const MSG91_AUTH_KEY = Deno.env.get("MSG91_AUTH_KEY");
    const MSG91_INTEGRATED_NUMBER = Deno.env.get("MSG91_INTEGRATED_NUMBER");
    const MSG91_NEW_LEAD_TEMPLATE = Deno.env.get("MSG91_NEW_LEAD_TEMPLATE");

    if (!MSG91_AUTH_KEY || !MSG91_INTEGRATED_NUMBER || !MSG91_NEW_LEAD_TEMPLATE) {
        return new Response(JSON.stringify({ error: "MSG91 not configured" }), { status: 500, headers: corsHeaders });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    try {
        const payload: LeadNotificationPayload = await req.json();
        const { lead_id, lead_lat, lead_long, category_id, sub_category_id, service_name, location_address } = payload;

        if (!lead_id || !lead_lat || !lead_long || !category_id) {
            return new Response(JSON.stringify({ error: "Missing required fields (lead_id, location, category_id)" }), { status: 400, headers: corsHeaders });
        }

        // --- QUERY UPDATED TO USE CATEGORY/SUB_CATEGORY ---
        let query = supabase
            .from("profiles")
            .select("id, name, phone, location_lat, location_long, service_radius_km")
            .eq('role', 'provider') // Only providers
            .eq('category_id', category_id) // Must match Category
            .not("phone", "is", null)
            .not("location_lat", "is", null);

        // If sub_category is specified, filter by it too (strict matching)
        // Or you might want to allow "General" providers of that category? 
        // For now, let's implement strict matching if provided.
        if (sub_category_id) {
            query = query.eq('sub_category_id', sub_category_id);
        }

        const { data: users, error: usersError } = await query;

        if (usersError) {
            console.error("Error fetching users:", usersError);
            throw usersError;
        }

        console.log(`Found ${users?.length || 0} providers matching category`);

        // Filter users within their service radius
        const eligibleUsers = (users || []).filter((user) => {
            const distance = calculateDistance(lead_lat, lead_long, user.location_lat!, user.location_long!);
            const serviceRadius = user.service_radius_km || 10;
            return distance <= serviceRadius;
        });

        console.log(`${eligibleUsers.length} providers within range`);

        const shortAddress = location_address && location_address.length > 50
            ? location_address.substring(0, 47) + "..."
            : location_address || "Unknown location";

        const claimUrl = `https://leads-nearby.com/lead/${lead_id}`; // Updated URL placeholder

        // Send Notifications
        const notificationResults = await Promise.allSettled(
            eligibleUsers.map(async (user) => {
                // MSG91 Body Params: [Service Name]
                const sent = await sendWhatsAppMessage(
                    user.phone!,
                    MSG91_NEW_LEAD_TEMPLATE,
                    MSG91_INTEGRATED_NUMBER,
                    MSG91_AUTH_KEY,
                    [service_name || "New Service"],
                    lead_id
                );

                // In-App Notification
                await supabase.from("notifications").insert({
                    user_id: user.id,
                    type: "new_lead",
                    title: `New ${service_name} Lead`,
                    body: `New lead available near you: ${shortAddress}`,
                    data: { lead_id, claim_url: claimUrl },
                });

                return { sent, phone: user.phone };
            })
        );

        const successCount = notificationResults.filter(r => r.status === 'fulfilled' && r.value.sent).length;

        return new Response(JSON.stringify({
            success: true,
            matched: eligibleUsers.length,
            sent: successCount
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }
});
