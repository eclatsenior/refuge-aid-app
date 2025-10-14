import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RegisterEmployeeRequest {
  email: string;
  fullName: string;
  password: string;
  phone?: string;
  refugiLeadId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { email, fullName, password, phone, refugiLeadId }: RegisterEmployeeRequest = await req.json();

    console.log('📝 Registration request:', { email, fullName, phone, refugiLeadId });

    // Validate input
    if (!email || !fullName || !password || !refugiLeadId) {
      throw new Error('Todos los campos son requeridos');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Formato de email inválido');
    }

    // Validate password length
    if (password.length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres');
    }

    // Verify that refugiLeadId is actually a refugi_lead
    const { data: refugiProfile, error: refugiError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('user_id', refugiLeadId)
      .single();

    if (refugiError || !refugiProfile) {
      throw new Error('Refugi Lead no encontrado');
    }

    if (refugiProfile.role !== 'refugi_lead') {
      throw new Error('No tienes permisos para registrar empleadas');
    }

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      throw new Error('Este email ya está registrado en el sistema');
    }

    console.log('✅ Validations passed, creating user...');

    // Step 1: Create user in auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName,
        role: 'employee'
      }
    });

    if (authError) {
      console.error('❌ Auth error:', authError);
      throw new Error(`Error al crear usuario: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('No se pudo crear el usuario');
    }

    const userId = authData.user.id;
    console.log('✅ User created in auth:', userId);

    // Step 2: Create profile (should be auto-created by trigger, but we verify)
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (profileError || !profileData) {
      console.log('⚠️ Profile not auto-created, creating manually...');
      
      const { error: manualProfileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          user_id: userId,
          email: email,
          full_name: fullName,
          phone: phone,
          role: 'employee'
        });

      if (manualProfileError) {
        console.error('❌ Profile creation error:', manualProfileError);
        throw new Error(`Error al crear perfil: ${manualProfileError.message}`);
      }
    } else if (phone) {
      // If profile exists but phone was provided, update it
      console.log('📞 Updating phone number...');
      const { error: updatePhoneError } = await supabaseAdmin
        .from('profiles')
        .update({ phone: phone })
        .eq('user_id', userId);
      
      if (updatePhoneError) {
        console.error('⚠️ Could not update phone:', updatePhoneError);
      }
    }

    console.log('✅ Profile confirmed');

    // Step 3: Create employee_status (should be auto-created by trigger, but we verify)
    const { data: statusData, error: statusError } = await supabaseAdmin
      .from('employee_status')
      .select('id')
      .eq('employee_id', userId)
      .single();

    if (statusError || !statusData) {
      console.log('⚠️ Employee status not auto-created, creating manually...');
      
      const { error: manualStatusError } = await supabaseAdmin
        .from('employee_status')
        .insert({
          employee_id: userId,
          mood_level: null, // No ha reportado aún
          therapy_progress: 0,
          is_online: false,
          emergency_alert: false
        });

      if (manualStatusError) {
        console.error('❌ Employee status creation error:', manualStatusError);
        throw new Error(`Error al crear estado de empleada: ${manualStatusError.message}`);
      }
    }

    console.log('✅ Employee status confirmed');

    // Step 4: Create assignment to refugi_lead
    const { error: assignmentError } = await supabaseAdmin
      .from('employee_assignments')
      .insert({
        refugi_lead_id: refugiLeadId,
        employee_id: userId
      });

    if (assignmentError) {
      console.error('❌ Assignment error:', assignmentError);
      throw new Error(`Error al asignar empleada: ${assignmentError.message}`);
    }

    console.log('✅ Employee assigned to refugi_lead');

    return new Response(
      JSON.stringify({
        success: true,
        employee_id: userId,
        message: 'Empleada registrada exitosamente'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('❌ Error in register-employee function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || 'Error al registrar empleada'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
