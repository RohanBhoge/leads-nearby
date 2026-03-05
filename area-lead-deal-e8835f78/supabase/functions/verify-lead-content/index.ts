import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Ratelimit } from "https://esm.sh/@upstash/ratelimit@1.0.1";
import { Redis } from "https://esm.sh/@upstash/redis@1.28.3";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Initialize Upstash Redis & Rate Limiter
// Limit to 10 requests per 1 hour per IP
const redisUrl = Deno.env.get("UPSTASH_REDIS_REST_URL");
const redisToken = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");
let ratelimit: Ratelimit | null = null;

if (redisUrl && redisToken) {
    ratelimit = new Ratelimit({
        redis: new Redis({ url: redisUrl, token: redisToken }),
        limiter: Ratelimit.slidingWindow(10, "1 h"),
        ephemeralCache: new Map(),
    });
}

// Safely extract JSON from Gemini text response (handles markdown code blocks)
function extractJson(text: string): any {
    try {
        // Remove markdown code fences if present
        const cleaned = text
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();
        return JSON.parse(cleaned);
    } catch (e) {
        console.error("JSON parse failed, raw text:", text);
        // Try to extract JSON object from anywhere in the string
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
            try { return JSON.parse(match[0]); } catch (_) { }
        }
        return null;
    }
}

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // Enforce Rate Limiting Early
        if (ratelimit) {
            const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "anonymous";
            const { success } = await ratelimit.limit(`ai_extract_${ip}`);
            if (!success) {
                console.warn(`Rate limit exceeded for IP: ${ip}`);
                return new Response(JSON.stringify({
                    error: "You have reached your hourly limit for AI extraction. Please try again later.",
                    extract_error: true
                }), {
                    status: 429,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }
        }

        const body = await req.json();
        const { mode } = body;

        console.log("Request mode:", mode, "Has API Key:", !!GEMINI_API_KEY);

        // ============================================================
        // MODE 1: EXTRACT — OCR from image screenshot
        // ============================================================
        if (mode === "extract") {
            const { image_base64, image_mime_type, available_categories } = body;

            if (!image_base64) {
                return new Response(JSON.stringify({ error: "No image provided" }), {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            // MOCK fallback if no API key
            if (!GEMINI_API_KEY) {
                console.log("No GEMINI_API_KEY — returning mock extraction data");
                return new Response(JSON.stringify({
                    customer_name: "Sample Customer",
                    customer_phone: "9876543210",
                    service_description: "Mock: Need plumbing work at home. Pipe leaking urgently.",
                    location: "Pune, Maharashtra",
                    suggested_category: "Plumbing",
                    suggested_sub_category: "Pipe Repair",
                    estimated_price: null,
                    mock: true
                }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }

            const categoryListStr = available_categories ? JSON.stringify(available_categories) : "Plumbing, Electrical, Cleaning, Carpentry, Painting, Construction, AC Repair, Appliance Repair, Pest Control, Gardening, IT Services, Education, Healthcare, Finance, Transport, Photography, Other";

            const extractPrompt = `You are an OCR and lead extraction AI for a service marketplace in India.

Analyze this screenshot carefully. It could be a WhatsApp chat, SMS, or any service request message.

Extract these fields:
1. customer_name: Person's name who needs service (from greetings, sign-offs, or contact info)
2. customer_phone: 10-digit Indian mobile number (digits only, no spaces or dashes)
3. service_description: What service is needed? Write 1-2 clear sentences
4. location: Any city, area, or address mentioned
5. suggested_category: Best fit from this exact list: ${categoryListStr}
6. suggested_sub_category: Specific type of work needed
7. estimated_price: Number in INR if mentioned, otherwise null

IMPORTANT: Return ONLY a valid JSON object. No markdown, no explanation. If you cannot find a field, use null.

Example output format:
{"customer_name":"Rahul","customer_phone":"9876543210","service_description":"Need plumbing repair for leaking pipe","location":"Pune","suggested_category":"Plumbing","suggested_sub_category":"Pipe Repair","estimated_price":null}`;

            // Try with gemini-2.0-flash first, fallback to 1.5-pro and 1.5-flash
            const models = ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"];
            let lastError = null;

            for (const model of models) {
                try {
                    console.log(`Trying model: ${model}`);
                    const response = await fetch(
                        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                contents: [{
                                    parts: [
                                        { text: extractPrompt },
                                        { inline_data: { mime_type: image_mime_type || "image/jpeg", data: image_base64 } }
                                    ]
                                }],
                                generationConfig: {
                                    temperature: 0.1,
                                    responseMimeType: "application/json"
                                }
                            })
                        }
                    );

                    const data = await response.json();
                    console.log(`${model} response status:`, response.status);

                    if (!response.ok) {
                        lastError = data.error?.message || `API Error ${response.status}`;
                        console.error(`${model} error:`, lastError);
                        continue;
                    }

                    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
                    console.log("Raw AI text response:", textResponse.substring(0, 500));

                    const result = extractJson(textResponse);
                    if (!result) {
                        lastError = "Failed to parse AI response as JSON";
                        continue;
                    }

                    console.log("Parsed extraction result:", JSON.stringify(result));
                    return new Response(JSON.stringify(result), {
                        headers: { ...corsHeaders, "Content-Type": "application/json" }
                    });

                } catch (modelErr) {
                    lastError = modelErr.message;
                    console.error(`${model} threw:`, modelErr);
                    continue;
                }
            }

            // All models failed
            throw new Error(lastError || "All Gemini models failed");
        }

        // ============================================================
        // MODE 2: VALIDATE — Check if description matches category
        // ============================================================
        const { description, category, sub_category, location, price } = body;

        if (!description || description.length < 10) {
            return new Response(JSON.stringify({ is_matches: true, score: 100, reason: "Description too short." }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        if (!GEMINI_API_KEY) {
            return new Response(JSON.stringify({ is_matches: true, score: 85, reason: "Mock: Looks good. (Add GEMINI_API_KEY for real AI)" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        const validatePrompt = `You are a Content Moderation AI for a service marketplace.
Verify if the following "Lead Description" matches the "Category" and "Subcategory".

Category: ${category}
Subcategory: ${sub_category}
Location: ${location}
Price: ${price}
Description: "${description}"

Output ONLY valid JSON:
{"is_matches": boolean, "score": number, "reason": "Short explanation under 15 words if mismatch"}`;

        const validateResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: validatePrompt }] }],
                    generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
                })
            }
        );

        const validateData = await validateResponse.json();
        if (!validateResponse.ok) throw new Error(validateData.error?.message || "Validation API Error");

        const validateText = validateData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        const validateResult = extractJson(validateText);

        return new Response(JSON.stringify(validateResult || { is_matches: true, score: 90 }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (error: any) {
        console.error("General Error:", error.message);

        // Try to read body again or use a flag to know if it was extract
        // Since we already read body above, let's just return a generic error that the frontend can handle
        return new Response(JSON.stringify({
            error: error.message,
            // Provide these so the validation frontend doesn't break if it was a validate call
            is_matches: true,
            score: 100,
            extract_error: true // Flag for extract mode to know it failed
        }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});