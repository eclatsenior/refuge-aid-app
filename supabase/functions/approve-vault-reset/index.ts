import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { create } from "https://deno.land/x/djwt@v3.0.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const JWT_SECRET = new TextEncoder().encode(
  Deno.env.get('SUPABASE_JWT_SECRET') || 'your-secret-key'
);

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

    // Verificar que es Refugi Lead
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.role !== 'refugi_lead') {
      throw new Error('Solo Refugi Leads pueden aprobar solicitudes');
    }

    const { requestId, notes } = await req.json();

    // Obtener la solicitud
    const { data: request, error: fetchError } = await supabaseClient
      .from('vault_reset_requests')
      .select('*, profiles!vault_reset_requests_user_id_fkey(user_id)')
      .eq('id', requestId)
      .single();

    if (fetchError || !request) {
      throw new Error('Solicitud no encontrada');
    }

    // Verificar que el employee está asignado a este Refugi Lead
    const { data: assignment } = await supabaseClient
      .from('employee_assignments')
      .select('employee_id')
      .eq('refugi_lead_id', user.id)
      .eq('employee_id', request.user_id)
      .single();

    if (!assignment) {
      throw new Error('No tienes permiso para aprobar esta solicitud');
    }

    // Generar token temporal de reset (válido 30 minutos)
    const resetToken = await create(
      { alg: "HS256", typ: "JWT" },
      {
        sub: request.user_id,
        exp: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutos
        iat: Math.floor(Date.now() / 1000),
        vault_reset: true,
        request_id: requestId,
      },
      JWT_SECRET
    );

    // Actualizar solicitud con reset_token
    const { error: updateError } = await supabaseClient
      .from('vault_reset_requests')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        notes: notes || null,
        reset_token: resetToken,
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error al actualizar solicitud:', updateError);
      throw updateError;
    }

    // Enviar notificación al employee
    await supabaseClient
      .from('internal_messages')
      .insert({
        sender_id: user.id,
        recipient_id: request.user_id,
        message: `Tu solicitud de reseteo de Caja Fuerte ha sido aprobada. Tienes 30 minutos para establecer una nueva contraseña.`,
      });

    console.log('Solicitud aprobada:', requestId, 'por:', user.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        resetToken,
        message: 'Solicitud aprobada. El empleado ha sido notificado.' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error en approve-vault-reset:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
