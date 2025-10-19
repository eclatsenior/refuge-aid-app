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

    const { requestType, idDocumentFile } = await req.json();

    // Obtener perfil del usuario
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('managed_by_lead')
      .eq('user_id', user.id)
      .single();

    let idDocumentUrl = null;

    // Si es plan individual, subir documento de identidad
    if (requestType === 'id_verification' && idDocumentFile) {
      const fileExt = idDocumentFile.name.split('.').pop();
      const fileName = `${user.id}/id-${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabaseClient
        .storage
        .from('vault-reset-ids')
        .upload(fileName, idDocumentFile);

      if (uploadError) {
        console.error('Error al subir documento:', uploadError);
        throw new Error('Error al subir documento de identidad');
      }

      idDocumentUrl = fileName;
    }

    // Crear solicitud de reset
    const { data: request, error: insertError } = await supabaseClient
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
      console.error('Error al crear solicitud:', insertError);
      throw insertError;
    }

    console.log('Solicitud de reset creada:', request.id, 'para usuario:', user.id);

    // Si es plan empresarial, notificar al Refugi Lead
    if (requestType === 'lead_approved') {
      const { data: assignment } = await supabaseClient
        .from('employee_assignments')
        .select('refugi_lead_id')
        .eq('employee_id', user.id)
        .single();

      if (assignment) {
        // Crear mensaje interno para el Refugi Lead
        await supabaseClient
          .from('internal_messages')
          .insert({
            sender_id: user.id,
            recipient_id: assignment.refugi_lead_id,
            message: 'Solicitud de reseteo de Caja Fuerte',
            related_alert_id: null,
          });

        console.log('Notificación enviada al Refugi Lead:', assignment.refugi_lead_id);
      }
    }

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
    console.error('Error en request-vault-reset:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
