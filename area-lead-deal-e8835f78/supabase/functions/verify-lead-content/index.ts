import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";

function getCorsHeaders(req: Request) {
    const origin = req.headers.get("origin") || "";
    const isLocalhost = origin.includes("localhost") || origin.includes("127.0.0.1");
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    };
}

serve(async (req) => {
    const corsHeaders = getCorsHeaders(req);

    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { description, category, sub_category, location, price } = await req.json();

        if (!description || description.length < 10) {
            return new Response(JSON.stringify({
                is_matches: true,
                score: 100,
                reason: "Description is too short to analyze."
            }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // MOCK FALLBACK if no API Key (PoC Mode)
        if (!GEMINI_API_KEY) {
            console.log("No GEMINI_API_KEY found. Running in MOCK mode.");
            // Simple keyword heuristic for PoC
            const desc = description.toLowerCase();
            const cat = category.toLowerCase();

            let mockScore = 85;
            let mockReason = "Mock Analysis: Looks okay.";
            let isMatches = true;

            // Simple spam detector
            if (desc.includes("casino") || desc.includes("lottery") || desc.includes("click here")) {
                mockScore = 10;
                mockReason = "Mock Analysis: Detected spam keywords.";
                isMatches = false;
            }
            // Simple mismatch detector (e.g. "plumber" vs "web design")
            else if (cat.includes("plumber") && (desc.includes("web design") || desc.includes("java"))) {
                mockScore = 30;
                mockReason = "Mock Analysis: Description mentions coding but category is Plumbing.";
                isMatches = false;
            }

            return new Response(JSON.stringify({
                is_matches: isMatches,
                score: mockScore,
                reason: mockReason + " (Add GEMINI_API_KEY to enable Real AI)"
            }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }



        // --- REAL AI IMPLEMENTATION ---
        const model = "gemini-2.5-flash"; // Correcting 2.5 to 1.5-flash as 2.5 is not available yet
        const prompt = `
        You are a Content Moderation AI for a service marketplace.
        verify if the following "Lead Description" matches the selected "Category", "Subcategory" and "Location".
        
        Context:
        - Category: ${category}
        - Subcategory: ${sub_category}
        - Location: ${location}
        - Price/Budget: ${price}
        
        Lead Description:
        "${description}"

        Task:
        1. Does the description describe a service relevant to the Category and Subcategory?
        2. Is it spam, scam, or abusive?
        3. Does it contradict the location significantly?

        Output pure JSON only:
        {
          "is_matches": boolean, // true if valid and safe, false if mismatch or spam
          "score": number, // 0-100 (confidence score)
          "reason": "A very simple message for the user explaining why it doesn't match. Example: 'Your description talks about cleaning but you selected Web Design category.' Keep it under 15 words."
        }
        `;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            const data = await response.json();

            if (!response.ok) {
                console.error("Gemini API Error:", data);
                throw new Error(data.error?.message || "Gemini API Error");
            }

            // Parse Gemini Response
            const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
            const jsonStr = textResponse.replace(/^```json\s*/, "").replace(/\s*```$/, "");
            const result = JSON.parse(jsonStr);

            return new Response(JSON.stringify(result), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });

        } catch (aiError) {
            console.error("AI Generation Failed, falling back to MOCK:", aiError);
            // Fallback to Mock Response on AI Error so we don't block the user
            return new Response(JSON.stringify({
                is_matches: true,
                score: 100,
                reason: "AI Verification unavailable, skipping check. (System Warning)"
            }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

    } catch (error) {
        console.error("General Error:", error);
        return new Response(JSON.stringify({
            error: error.message,
            is_matches: true,
            score: 100
        }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});