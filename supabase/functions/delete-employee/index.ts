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

    const { employeeId, refugiLeadId } = await req.json();

    console.log('[DELETE-EMPLOYEE] Request from:', user.id, 'for employee:', employeeId);

    // Validación 1: Verificar que el caller es el refugi_lead
    const { data: callerProfile, error: callerError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (callerError || !callerProfile || callerProfile.role !== 'refugi_lead') {
      console.error('[DELETE-EMPLOYEE] Caller is not refugi_lead:', user.id);
      throw new Error('Access denied');
    }

    // Validación 2: Verificar que el empleado está asignado a este refugi_lead
    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from('employee_assignments')
      .select('id')
      .eq('refugi_lead_id', user.id)
      .eq('employee_id', employeeId)
      .maybeSingle();

    if (assignmentError || !assignment) {
      console.error('[DELETE-EMPLOYEE] Employee not assigned to this lead:', employeeId);
      throw new Error('Access denied');
    }

    // Validación 3: Verificar que el empleado existe y tiene rol 'employee'
    const { data: employeeProfile, error: employeeError } = await supabaseAdmin
      .from('profiles')
      .select('role, full_name')
      .eq('user_id', employeeId)
      .single();

    if (employeeError || !employeeProfile || employeeProfile.role !== 'employee') {
      console.error('[DELETE-EMPLOYEE] Employee not found or invalid role:', employeeId);
      throw new Error('Empleada no encontrada');
    }

    // Validación 4: Verificar que no hay casos abiertos
    const { data: openCases, error: casesError } = await supabaseAdmin
      .from('cases')
      .select('id')
      .eq('employee_id', employeeId)
      .in('state', ['nuevo', 'en_proceso'])
      .limit(1);

    if (casesError) {
      console.error('[DELETE-EMPLOYEE] Error checking cases:', casesError);
    }

    if (openCases && openCases.length > 0) {
      throw new Error('No se puede eliminar esta empleada porque tiene casos abiertos. Por favor cierra los casos primero.');
    }

    // Validación 5: Verificar que no hay incidentes abiertos
    const { data: openIncidents, error: incidentsError } = await supabaseAdmin
      .from('incidents')
      .select('id')
      .eq('employee_id', employeeId)
      .in('status', ['open', 'in_progress'])
      .limit(1);

    if (incidentsError) {
      console.error('[DELETE-EMPLOYEE] Error checking incidents:', incidentsError);
    }

    if (openIncidents && openIncidents.length > 0) {
      throw new Error('No se puede eliminar esta empleada porque tiene incidentes abiertos. Por favor cierra los incidentes primero.');
    }

    console.log('[DELETE-EMPLOYEE] All validations passed, starting deletion...');

    // Orden de eliminación (importante para evitar errores de FK)

    // 1. Eliminar mensajes internos (sender y recipient)
    console.log('[DELETE-EMPLOYEE] Deleting internal messages...');
    await supabaseAdmin
      .from('internal_messages')
      .delete()
      .or(`sender_id.eq.${employeeId},recipient_id.eq.${employeeId}`);

    // 2. Eliminar alertas de emergencia
    console.log('[DELETE-EMPLOYEE] Deleting emergency alerts...');
    await supabaseAdmin
      .from('emergency_alerts')
      .delete()
      .eq('employee_id', employeeId);

    // 3. Eliminar check-ins de mood
    console.log('[DELETE-EMPLOYEE] Deleting mood check-ins...');
    await supabaseAdmin
      .from('mood_check_ins')
      .delete()
      .eq('employee_id', employeeId);

    // 4. Eliminar vault reset requests
    console.log('[DELETE-EMPLOYEE] Deleting vault reset requests...');
    await supabaseAdmin
      .from('vault_reset_requests')
      .delete()
      .eq('user_id', employeeId);

    // 5. Eliminar vault passwords
    console.log('[DELETE-EMPLOYEE] Deleting vault passwords...');
    await supabaseAdmin
      .from('vault_passwords')
      .delete()
      .eq('user_id', employeeId);

    // 6. Eliminar asignación de empleada
    console.log('[DELETE-EMPLOYEE] Deleting employee assignment...');
    await supabaseAdmin
      .from('employee_assignments')
      .delete()
      .eq('employee_id', employeeId);

    // 7. Eliminar estado de empleada
    console.log('[DELETE-EMPLOYEE] Deleting employee status...');
    await supabaseAdmin
      .from('employee_status')
      .delete()
      .eq('employee_id', employeeId);

    // 8. Eliminar perfil
    console.log('[DELETE-EMPLOYEE] Deleting profile...');
    const { error: profileDeleteError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('user_id', employeeId);

    if (profileDeleteError) {
      console.error('[DELETE-EMPLOYEE] Error deleting profile:', profileDeleteError);
      throw new Error('Error al eliminar el perfil de la empleada');
    }

    // 9. ÚLTIMO: Eliminar usuario de auth.users
    console.log('[DELETE-EMPLOYEE] Deleting auth user...');
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(employeeId);

    if (authDeleteError) {
      console.error('[DELETE-EMPLOYEE] Error deleting auth user:', authDeleteError);
      throw new Error('Error al eliminar la cuenta de la empleada');
    }

    console.log('[DELETE-EMPLOYEE] Employee deleted successfully:', employeeId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Empleada eliminada correctamente',
        employeeId,
        employeeName: employeeProfile.full_name
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('[DELETE-EMPLOYEE] Fatal error:', error.message);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Error al eliminar empleada' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
