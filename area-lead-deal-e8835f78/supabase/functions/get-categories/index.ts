import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UPSTASH_URL = Deno.env.get("UPSTASH_REDIS_REST_URL");
const UPSTASH_TOKEN = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

const CACHE_KEY = "categories_data";
const CACHE_TTL_SECONDS = 86400; // 24 hours

async function redisGet(key: string) {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return null;
  try {
    const res = await fetch(`${UPSTASH_URL}/get/${key}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
    });
    const data = await res.json();
    return data.result ? JSON.parse(data.result) : null;
  } catch (err) {
    console.error("Redis GET Error:", err);
    return null; // Fallback to DB on Redis failure
  }
}

async function redisSet(key: string, value: any, ttlSeconds: number) {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return;
  try {
    await fetch(`${UPSTASH_URL}/set/${key}?EX=${ttlSeconds}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(value)
    });
  } catch (err) {
    console.error("Redis SET Error:", err);
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Checking Redis cache for categories...");
    const cachedData = await redisGet(CACHE_KEY);

    if (cachedData) {
      console.log("Cache HIT! Returning categories from Redis.");
      return new Response(JSON.stringify({ data: cachedData, source: 'cache' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Cache MISS! Fetching from Postgres database...");

    // Initialize Supabase Client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

    // Fetch categories and subcategories
    const [catsResponse, subCatsResponse] = await Promise.all([
      supabase.from("categories").select("*").order("name"),
      supabase.from("sub_categories").select("*").order("name")
    ]);

    if (catsResponse.error) throw new Error(catsResponse.error.message);
    if (subCatsResponse.error) throw new Error(subCatsResponse.error.message);

    const resultData = {
      categories: catsResponse.data || [],
      subCategories: subCatsResponse.data || []
    };

    // Save to Redis Cache (fire and forget)
    console.log("Saving new data to Redis cache...");
    redisSet(CACHE_KEY, resultData, CACHE_TTL_SECONDS);

    return new Response(JSON.stringify({ data: resultData, source: 'database' }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in get-categories:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
