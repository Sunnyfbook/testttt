import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, password, action } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (action === 'login') {
      // Simple hash comparison (you should use proper password hashing in production)
      const passwordHash = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(password + 'salt')
      );
      const hashArray = Array.from(new Uint8Array(passwordHash));
      const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Check if admin user exists with matching credentials
      const { data: adminUser, error } = await supabaseClient
        .from('admin_users')
        .select('*')
        .eq('username', username)
        .eq('password_hash', hashedPassword)
        .eq('is_active', true)
        .single();

      if (error || !adminUser) {
        return new Response(
          JSON.stringify({ success: false, message: 'Invalid credentials' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401,
          }
        );
      }

      // Update last login
      await supabaseClient
        .from('admin_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', adminUser.id);

      return new Response(
        JSON.stringify({
          success: true,
          user: {
            id: adminUser.id,
            username: adminUser.username,
            email: adminUser.email,
            role: adminUser.role
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (action === 'create') {
      const { email, role = 'admin' } = await req.json();

      const passwordHash = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(password + 'salt')
      );
      const hashArray = Array.from(new Uint8Array(passwordHash));
      const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const { data, error } = await supabaseClient
        .from('admin_users')
        .insert([
          {
            username,
            password_hash: hashedPassword,
            email,
            role,
            is_active: true
          }
        ])
        .select()
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ success: false, message: error.message }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, user: data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: false, message: 'Invalid action' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );

  } catch (error) {
    console.error('Admin auth error:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Internal server error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});