import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log("Admin Users Function Invoked (v3 - Auth Debug)");

    // 1. Get Authorization Header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error("Missing Authorization header");
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    console.log("Auth Header present (length):", authHeader.length);

    // 2. Validate JWT & Check Admin Role (Securely via Supabase Auth)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { 
        global: { headers: { Authorization: authHeader } },
        auth: {
          persistSession: false // Critical for Edge environment
        }
      }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      console.error("User validation failed:", userError);
      return new Response(JSON.stringify({ error: 'Unauthorized', details: userError?.message }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log("User validated:", user.email, "Role:", user.app_metadata?.role);

    // Check admin role in app_metadata
    if (user.app_metadata?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Initialize Admin Client (Service Role)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    // 4. List ALL users (using Service Role)
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000
    })

    if (listError) throw listError

    // 5. Fetch profiles (using Service Role)
    const ids = users.map(u => u.id)
    let profiles = []
    
    if (ids.length > 0) {
        const { data: p, error: profilesError } = await supabaseAdmin
          .from("profiles")
          .select("*")
          .in("id", ids)
        
        if (!profilesError) profiles = p;
    }

    // 6. Merge data
    const result = users.map(user => ({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      role: user.app_metadata?.role,
      nome: profiles?.find(p => p.id === user.id)?.nome || null,
      telefone: profiles?.find(p => p.id === user.id)?.telefone || null,
      plano: profiles?.find(p => p.id === user.id)?.plano || null,
    }))

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
