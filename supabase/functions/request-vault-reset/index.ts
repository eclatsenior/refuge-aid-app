import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[REQUEST-VAULT-RESET] Iniciando solicitud...');
    
    // Verificar cabecera de autorización
    const authHeader = req.headers.get('Authorization');
    console.log('[REQUEST-VAULT-RESET] Auth header:', authHeader ? 'presente' : 'ausente');
    
    if (!authHeader) {
      throw new Error('No autorizado - falta cabecera de autorización');
    }

    // Crear cliente admin con SERVICE_ROLE_KEY
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Verificar token manualmente
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error('[REQUEST-VAULT-RESET] Error de autenticación:', authError?.message);
      throw new Error('No autorizado - token inválido');
    }

    console.log('[REQUEST-VAULT-RESET] Usuario autenticado:', user.id);

    const { requestType, idDocumentFile, fileName, fileType } = await req.json();
    console.log('[REQUEST-VAULT-RESET] Tipo de solicitud:', requestType);

    // Obtener perfil del usuario
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('managed_by_lead, full_name')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('[REQUEST-VAULT-RESET] Error al obtener perfil:', profileError.message);
    } else {
      console.log('[REQUEST-VAULT-RESET] Perfil:', profile?.full_name, '| managed_by_lead:', profile?.managed_by_lead);
    }

    let idDocumentUrl = null;

    // Si es plan individual, subir documento de identidad
    if (requestType === 'id_verification' && idDocumentFile) {
      console.log('[REQUEST-VAULT-RESET] Subiendo documento de identidad...');
      
      // Decodificar base64
      const base64Data = idDocumentFile.includes(',') 
        ? idDocumentFile.split(',')[1] 
        : idDocumentFile;
      
      const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      
      const fileExt = fileName.split('.').pop();
      const storagePath = `${user.id}/id-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabaseAdmin
        .storage
        .from('vault-reset-ids')
        .upload(storagePath, buffer, {
          contentType: fileType,
          upsert: false
        });

      if (uploadError) {
        console.error('[REQUEST-VAULT-RESET] Error al subir documento:', uploadError.message);
        throw new Error('Error al subir documento de identidad');
      }

      idDocumentUrl = storagePath;
      console.log('[REQUEST-VAULT-RESET] Documento subido:', storagePath);
    }

    // Crear solicitud de reset
    console.log('[REQUEST-VAULT-RESET] Creando solicitud en base de datos...');
    const { data: request, error: insertError } = await supabaseAdmin
      .from('vault_reset_requests')
      .insert({
        user_id: user.id,
        request_type: requestType,
        id_document_url: idDocumentUrl,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('[REQUEST-VAULT-RESET] Error al crear solicitud:', insertError.message);
      throw insertError;
    }

    console.log('[REQUEST-VAULT-RESET] Solicitud creada:', request.id, 'para usuario:', user.id);

    // Si es plan empresarial, notificar al Refugi Lead
    if (requestType === 'lead_approved') {
      console.log('[REQUEST-VAULT-RESET] Buscando asignación de empleado...');
      
      const { data: assignment, error: assignmentError } = await supabaseAdmin
        .from('employee_assignments')
        .select('refugi_lead_id')
        .eq('employee_id', user.id)
        .single();

      if (assignmentError) {
        console.error('[REQUEST-VAULT-RESET] Error al buscar asignación:', assignmentError.message);
      }

      if (assignment) {
        console.log('[REQUEST-VAULT-RESET] Lead encontrado:', assignment.refugi_lead_id);
        
        // Crear mensaje interno para el Refugi Lead
        const { error: messageError } = await supabaseAdmin
          .from('internal_messages')
          .insert({
            sender_id: user.id,
            recipient_id: assignment.refugi_lead_id,
            message: `Solicitud de reseteo de Caja Fuerte de ${profile?.full_name || 'empleado'}`,
            related_alert_id: null,
          });

        if (messageError) {
          console.error('[REQUEST-VAULT-RESET] Error al enviar mensaje:', messageError.message);
        } else {
          console.log('[REQUEST-VAULT-RESET] Notificación enviada al Refugi Lead:', assignment.refugi_lead_id);
        }
      } else {
        console.log('[REQUEST-VAULT-RESET] No se encontró asignación para el empleado');
      }
    }

    console.log('[REQUEST-VAULT-RESET] Solicitud completada exitosamente');

    return new Response(
      JSON.stringify({ 
        success: true, 
        requestId: request.id,
        message: requestType === 'lead_approved' 
          ? 'Solicitud enviada a tu Refugi Lead'
          : 'Solicitud en revisión. Te notificaremos cuando sea aprobada (24-48h)'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[REQUEST-VAULT-RESET] Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
