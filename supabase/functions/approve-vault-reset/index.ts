import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { create } from "https://deno.land/x/djwt@v3.0.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Use service role key as secret for signing reset tokens (always available)
const JWT_SECRET = new TextEncoder().encode(
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ No Authorization header provided');
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    // Create client with user's auth header for validation
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Validate the token and get user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error('❌ Invalid token:', userError?.message);
      return new Response(
        JSON.stringify({ error: 'Token inválido o expirado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const userId = user.id;
    console.log('✅ User authenticated:', userId);

    // Create admin client for DB operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar que es Refugi Lead
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.error('❌ Error fetching profile:', profileError);
      throw new Error('Error al verificar perfil');
    }

    if (!profile || profile.role !== 'refugi_lead') {
      console.error('❌ User is not a refugi_lead:', profile?.role);
      throw new Error('Solo Refugi Leads pueden aprobar solicitudes');
    }

    console.log('✅ User is refugi_lead');

    const { requestId, notes, reviewerNotes } = await req.json();
    const finalNotes = notes || reviewerNotes;
    console.log('📝 Processing request:', requestId);

    // Obtener la solicitud (user_id ya está en vault_reset_requests)
    const { data: request, error: fetchError } = await supabaseAdmin
      .from('vault_reset_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !request) {
      console.error('❌ Request not found:', fetchError);
      throw new Error('Solicitud no encontrada');
    }

    console.log('📝 Found request for user:', request.user_id);

    // Verificar que el employee está asignado a este Refugi Lead
    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from('employee_assignments')
      .select('employee_id')
      .eq('refugi_lead_id', userId)
      .eq('employee_id', request.user_id)
      .single();

    if (assignmentError && assignmentError.code !== 'PGRST116') {
      console.error('❌ Error checking assignment:', assignmentError);
    }

    if (!assignment) {
      console.error('❌ Employee not assigned to this lead');
      throw new Error('No tienes permiso para aprobar esta solicitud');
    }

    console.log('✅ Assignment verified');

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

    console.log('🔑 Reset token generated');

    // Actualizar solicitud con reset_token
    const { error: updateError } = await supabaseAdmin
      .from('vault_reset_requests')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: userId,
        notes: finalNotes || null,
        reset_token: resetToken,
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('❌ Error updating request:', updateError);
      throw updateError;
    }

    console.log('✅ Request updated to approved');

    // Enviar notificación al employee
    const { error: messageError } = await supabaseAdmin
      .from('internal_messages')
      .insert({
        sender_id: userId,
        recipient_id: request.user_id,
        message: `Tu solicitud de reseteo de Caja Fuerte ha sido aprobada. Tienes 30 minutos para establecer una nueva contraseña.`,
      });

    if (messageError) {
      console.warn('⚠️ Could not send notification:', messageError);
    }

    console.log('✅ Vault reset approved:', requestId, 'by:', userId);

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
    console.error('❌ Error in approve-vault-reset:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
