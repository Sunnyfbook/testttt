// Supabase Edge Function: get-client-ip
// Returns the caller's public IP address

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const headers = req.headers;
    const xff = headers.get("x-forwarded-for") || "";
    const cf = headers.get("cf-connecting-ip") || "";
    const xReal = headers.get("x-real-ip") || "";

    // x-forwarded-for may contain multiple IPs, take the first one
    const ipFromXff = xff.split(",")[0].trim();

    const ip = ipFromXff || cf || xReal || "0.0.0.0";

    return new Response(JSON.stringify({ ip }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 500,
    });
  }
});