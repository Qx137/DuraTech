import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // User client to get the authenticated user
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { role, business_name, description } = await req.json();

    // Only allow switching between buyer and seller
    if (!["buyer", "seller"].includes(role)) {
      return new Response(JSON.stringify({ error: "Invalid role. Only 'buyer' and 'seller' are allowed." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If switching to seller, require business_name
    if (role === "seller" && (!business_name || business_name.trim().length < 2)) {
      return new Response(JSON.stringify({ error: "Business name is required for seller accounts" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role client for privileged operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Update user_roles table
    const { error: roleError } = await adminClient
      .from("user_roles")
      .update({ role })
      .eq("user_id", user.id);

    if (roleError) throw roleError;

    // Update profiles table
    const profileUpdate: Record<string, string | null> = { user_type: role };
    if (role === "seller") {
      profileUpdate.business_name = business_name.trim();
      profileUpdate.description = description?.trim() || null;
    }

    const { error: profileError } = await adminClient
      .from("profiles")
      .update(profileUpdate)
      .eq("id", user.id);

    if (profileError) throw profileError;

    return new Response(JSON.stringify({ success: true, role }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating role:", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to update role" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
