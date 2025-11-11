import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { employeeId, fullName, email, phone, refugiLeadId } = await req.json();

    console.log('[UPDATE-EMPLOYEE] Request from:', user.id, 'for employee:', employeeId);

    // Validación 1: Verificar que el caller es el refugi_lead
    const { data: callerProfile, error: callerError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (callerError || !callerProfile || callerProfile.role !== 'refugi_lead') {
      console.error('[UPDATE-EMPLOYEE] Caller is not refugi_lead:', user.id);
      throw new Error('Solo los Refugi Leads pueden editar empleadas');
    }

    // Validación 2: Verificar que el empleado está asignado a este refugi_lead
    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from('employee_assignments')
      .select('id')
      .eq('refugi_lead_id', user.id)
      .eq('employee_id', employeeId)
      .maybeSingle();

    if (assignmentError || !assignment) {
      console.error('[UPDATE-EMPLOYEE] Employee not assigned to this lead:', employeeId);
      throw new Error('Esta empleada no está asignada a ti');
    }

    // Validación 3: Verificar que el empleado existe y tiene rol 'employee'
    const { data: employeeProfile, error: employeeError } = await supabaseAdmin
      .from('profiles')
      .select('role, email')
      .eq('user_id', employeeId)
      .single();

    if (employeeError || !employeeProfile || employeeProfile.role !== 'employee') {
      console.error('[UPDATE-EMPLOYEE] Employee not found or invalid role:', employeeId);
      throw new Error('Empleada no encontrada');
    }

    // Validación 4: Si se cambia el email, verificar que no esté en uso
    if (email && email !== employeeProfile.email) {
      const { data: existingUser } = await supabaseAdmin
        .from('profiles')
        .select('user_id')
        .eq('email', email)
        .neq('user_id', employeeId)
        .maybeSingle();

      if (existingUser) {
        console.error('[UPDATE-EMPLOYEE] Email already in use:', email);
        throw new Error('Este email ya está en uso por otra usuaria');
      }
    }

    // Validación 5: Validar formato de email
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Formato de email inválido');
    }

    // Validación 6: Validar formato de teléfono español
    if (phone && !/^(\+34|0034|34)?[6789]\d{8}$/.test(phone)) {
      throw new Error('Formato de teléfono inválido. Debe ser un número español válido');
    }

    // Validación 7: Validar longitud de nombre
    if (fullName && (fullName.trim().length < 3 || fullName.trim().length > 100)) {
      throw new Error('El nombre debe tener entre 3 y 100 caracteres');
    }

    console.log('[UPDATE-EMPLOYEE] All validations passed, updating profile...');

    // Actualizar perfil
    const updateData: any = {};
    if (fullName) updateData.full_name = fullName.trim();
    if (email) updateData.email = email.trim();
    if (phone !== undefined) updateData.phone = phone || null;

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('user_id', employeeId);

    if (updateError) {
      console.error('[UPDATE-EMPLOYEE] Error updating profile:', updateError);
      throw new Error('Error al actualizar el perfil');
    }

    // Si se cambió el email, actualizar también en auth.users
    if (email && email !== employeeProfile.email) {
      console.log('[UPDATE-EMPLOYEE] Updating email in auth.users...');
      const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
        employeeId,
        { email: email.trim() }
      );

      if (authUpdateError) {
        console.error('[UPDATE-EMPLOYEE] Error updating auth email:', authUpdateError);
        // Revertir cambio en profiles
        await supabaseAdmin
          .from('profiles')
          .update({ email: employeeProfile.email })
          .eq('user_id', employeeId);
        throw new Error('Error al actualizar el email');
      }
    }

    console.log('[UPDATE-EMPLOYEE] Employee updated successfully:', employeeId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Empleada actualizada correctamente',
        employeeId 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('[UPDATE-EMPLOYEE] Fatal error:', error.message);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Error al actualizar empleada' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
