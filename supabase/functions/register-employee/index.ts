import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // SECURITY: Verify JWT and that caller is a refugi_lead
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, message: 'No autorizado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: callerUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !callerUser) {
      return new Response(
        JSON.stringify({ success: false, message: 'Token inválido' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const { email, fullName, password, phone, refugiLeadId } = await req.json();

    // SECURITY: Verify that the caller IS the refugiLeadId they claim to be
    if (callerUser.id !== refugiLeadId) {
      console.error('❌ Caller mismatch: caller', callerUser.id, 'claimed', refugiLeadId);
      return new Response(
        JSON.stringify({ success: false, message: 'No autorizado para esta acción' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    console.log('📝 Registration request from:', callerUser.email, '| employee:', email);

    // Input validation
    if (!email || !fullName || !password || !refugiLeadId) {
      throw new Error('Todos los campos son requeridos');
    }

    // Validate email format and length
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof email !== 'string' || email.length > 255 || !emailRegex.test(email)) {
      throw new Error('Formato de email inválido');
    }

    // Validate fullName length and content
    const trimmedName = String(fullName).trim();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      throw new Error('El nombre debe tener entre 2 y 100 caracteres');
    }

    // Validate password
    if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
      throw new Error('La contraseña debe tener entre 8 y 128 caracteres');
    }

    // Validate phone format if provided
    if (phone && (typeof phone !== 'string' || phone.length > 20)) {
      throw new Error('Formato de teléfono inválido');
    }

    // Validate refugiLeadId is UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(refugiLeadId)) {
      throw new Error('ID de Refugi Lead inválido');
    }

    // Verify that refugiLeadId is actually a refugi_lead
    const { data: refugiProfile, error: refugiError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('user_id', refugiLeadId)
      .single();

    if (refugiError || !refugiProfile || refugiProfile.role !== 'refugi_lead') {
      throw new Error('No tienes permisos para registrar empleadas');
    }

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('email', email.trim().toLowerCase())
      .single();

    if (existingUser) {
      throw new Error('Este email ya está registrado en el sistema');
    }

    console.log('✅ Validations passed, creating user...');

    // Create user in auth with email pre-confirmed
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        full_name: trimmedName,
        role: 'employee'
      }
    });

    if (createError) {
      console.error('❌ Auth error:', createError);
      throw new Error(`Error al crear usuario: ${createError.message}`);
    }

    if (!authData.user) {
      throw new Error('No se pudo crear el usuario');
    }

    const userId = authData.user.id;
    console.log('✅ User created:', userId);

    // Verify/create profile
    const { data: profileData } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!profileData) {
      await supabaseAdmin.from('profiles').insert({
        user_id: userId,
        email: email.trim().toLowerCase(),
        full_name: trimmedName,
        phone: phone || null,
        role: 'employee'
      });
    } else if (phone) {
      await supabaseAdmin.from('profiles').update({ phone }).eq('user_id', userId);
    }

    // Verify/create employee_status
    const { data: statusData } = await supabaseAdmin
      .from('employee_status')
      .select('id')
      .eq('employee_id', userId)
      .single();

    if (!statusData) {
      await supabaseAdmin.from('employee_status').insert({
        employee_id: userId,
        mood_level: null,
        therapy_progress: 0,
        is_online: false,
        emergency_alert: false
      });
    }

    // Create assignment
    const { error: assignmentError } = await supabaseAdmin
      .from('employee_assignments')
      .insert({ refugi_lead_id: refugiLeadId, employee_id: userId });

    if (assignmentError) {
      throw new Error(`Error al asignar empleada: ${assignmentError.message}`);
    }

    console.log('✅ Employee registered and assigned successfully');

    return new Response(
      JSON.stringify({ success: true, employee_id: userId, message: 'Empleada registrada exitosamente' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return new Response(
      JSON.stringify({ success: false, message: error.message || 'Error al registrar empleada' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
