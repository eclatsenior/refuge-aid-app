import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error('No autorizado');
    }

    const { password } = await req.json();

    if (!password || password.length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres');
    }

    // Generar salt y hash
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Verificar si ya existe una contraseña
    const { data: existing } = await supabaseClient
      .from('vault_passwords')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existing) {
      throw new Error('Ya existe una contraseña de caja fuerte configurada');
    }

    // Insertar nueva contraseña
    const { error: insertError } = await supabaseClient
      .from('vault_passwords')
      .insert({
        user_id: user.id,
        password_hash: passwordHash,
        salt: salt,
      });

    if (insertError) {
      console.error('Error al guardar contraseña:', insertError);
      throw insertError;
    }

    console.log('Contraseña de caja fuerte configurada para usuario:', user.id);

    return new Response(
      JSON.stringify({ success: true, message: 'Contraseña configurada correctamente' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error en set-vault-password:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
