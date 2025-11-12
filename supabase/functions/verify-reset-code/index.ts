import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return new Response(
        JSON.stringify({ error: 'Email y código son requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = code.trim();

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Get all valid codes for this email
    const { data: codes, error: fetchError } = await supabaseAdmin
      .from('password_reset_codes')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching reset codes:', fetchError);
      throw fetchError;
    }

    if (!codes || codes.length === 0) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Código inválido o expirado' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify using sha256 scheme (no bcrypt)
    const toHex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    let validCode = null as any;
    for (const dbCode of codes as any[]) {
      const parts = String(dbCode.code_hash || '').split(':');
      if (parts.length === 3 && parts[0] === 'sha256') {
        const [, saltHex, storedHash] = parts;
        const data = new TextEncoder().encode(`${saltHex}:${normalizedCode}`);
        const digest = await crypto.subtle.digest('SHA-256', data);
        const computed = toHex(digest);
        if (computed.length === storedHash.length) {
          let diff = 0;
          for (let i = 0; i < computed.length; i++) {
            diff |= computed.charCodeAt(i) ^ storedHash.charCodeAt(i);
          }
          if (diff === 0) {
            validCode = dbCode;
            break;
          }
        }
      }
    }

    if (!validCode) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Código inválido o expirado' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Code is valid
    return new Response(
      JSON.stringify({ valid: true, message: 'Código verificado correctamente' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in verify-reset-code:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Error al verificar código' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
