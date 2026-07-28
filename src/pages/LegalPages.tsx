import { ArrowLeft } from "lucide-react";

const SUPPORT_EMAIL = "soporte@refugi.app";

interface LegalPageProps {
  onNavigate?: (path: string) => void;
}

const LegalLayout = ({
  title,
  updatedAt,
  onNavigate,
  children,
}: {
  title: string;
  updatedAt: string;
  onNavigate?: (path: string) => void;
  children: React.ReactNode;
}) => (
  <div className="min-h-screen bg-background">
    <div className="mx-auto w-full max-w-3xl px-5 py-8">
      {onNavigate && (
        <button
          onClick={() => onNavigate("/")}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={16} />
          Volver
        </button>
      )}
      <h1 className="text-3xl font-semibold text-foreground">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Última actualización: {updatedAt}
      </p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground/90 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1">
        {children}
      </div>
      <p className="mt-10 text-xs text-muted-foreground">
        Contacto: <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
      </p>
    </div>
  </div>
);

export const PrivacyPolicyPage = ({ onNavigate }: LegalPageProps) => (
  <LegalLayout title="Política de Privacidad" updatedAt="28 de julio de 2026" onNavigate={onNavigate}>
    <section>
      <h2>1. Responsable del tratamiento</h2>
      <p>
        Refugi es una aplicación de acompañamiento emocional y seguridad personal. El
        responsable del tratamiento de los datos es el titular de la aplicación, con
        contacto en {SUPPORT_EMAIL}.
      </p>
    </section>
    <section>
      <h2>2. Datos que recogemos</h2>
      <ul>
        <li>Datos de cuenta: nombre, correo electrónico y, opcionalmente, teléfono.</li>
        <li>Registros de bienestar: estados de ánimo y check-ins que la usuaria introduce.</li>
        <li>Notas privadas: se guardan cifradas y protegidas por una contraseña propia (caja fuerte).</li>
        <li>Ubicación aproximada o precisa: únicamente cuando la usuaria activa una alerta de emergencia y concede el permiso.</li>
        <li>Contactos de confianza: los datos que la propia usuaria introduce manualmente.</li>
        <li>Datos técnicos mínimos: identificador de dispositivo, idioma y registros de sesión para seguridad.</li>
      </ul>
    </section>
    <section>
      <h2>3. Para qué usamos los datos</h2>
      <ul>
        <li>Prestar el servicio: seguimiento emocional, contenido terapéutico y caja fuerte.</li>
        <li>Enviar alertas de emergencia a los contactos de confianza elegidos por la usuaria.</li>
        <li>Permitir a la organización responsable (Refugi Lead) atender casos de riesgo, cuando la usuaria pertenece a una empresa u organización.</li>
        <li>Gestionar suscripciones y facturación.</li>
        <li>Garantizar la seguridad de las cuentas y prevenir usos fraudulentos.</li>
      </ul>
    </section>
    <section>
      <h2>4. Base legal</h2>
      <p>
        Tratamos los datos con base en el consentimiento de la usuaria, la ejecución del
        contrato de servicio y el interés legítimo en la seguridad de la plataforma. Los
        datos de salud emocional y ubicación se tratan exclusivamente con consentimiento
        explícito y pueden retirarse en cualquier momento.
      </p>
    </section>
    <section>
      <h2>5. Con quién compartimos datos</h2>
      <ul>
        <li>Proveedor de infraestructura y base de datos (Supabase), con cifrado en tránsito y en reposo.</li>
        <li>Proveedor de pagos (Stripe), que trata los datos de facturación.</li>
        <li>Proveedor de envío de correo transaccional (Resend).</li>
        <li>Contactos de confianza designados por la usuaria, únicamente al activar una alerta.</li>
      </ul>
      <p>No vendemos datos personales ni los usamos para publicidad.</p>
    </section>
    <section>
      <h2>6. Conservación</h2>
      <p>
        Conservamos los datos mientras la cuenta esté activa. Tras la solicitud de
        eliminación, se borran en un plazo máximo de 30 días, salvo obligaciones legales
        de conservación fiscal.
      </p>
    </section>
    <section>
      <h2>7. Derechos de la usuaria</h2>
      <p>
        Puedes ejercer los derechos de acceso, rectificación, supresión, oposición,
        limitación y portabilidad escribiendo a {SUPPORT_EMAIL}. También puedes solicitar
        la eliminación de la cuenta desde la página "Eliminar cuenta".
      </p>
    </section>
    <section>
      <h2>8. Menores</h2>
      <p>La aplicación está dirigida a personas mayores de 16 años.</p>
    </section>
    <section>
      <h2>9. Seguridad</h2>
      <p>
        Aplicamos cifrado, control de acceso por roles y políticas de seguridad a nivel de
        base de datos. Las notas de la caja fuerte están protegidas por una contraseña que
        solo conoce la usuaria; no podemos leer su contenido.
      </p>
    </section>
    <section>
      <h2>10. Aviso importante</h2>
      <p>
        Refugi no sustituye a los servicios de emergencia. En caso de peligro inmediato,
        contacta con el 112 o el teléfono de emergencias de tu país.
      </p>
    </section>
  </LegalLayout>
);

export const TermsPage = ({ onNavigate }: LegalPageProps) => (
  <LegalLayout title="Términos y Condiciones" updatedAt="28 de julio de 2026" onNavigate={onNavigate}>
    <section>
      <h2>1. Objeto</h2>
      <p>
        Estos términos regulan el uso de la aplicación Refugi, que ofrece acompañamiento
        emocional, registro de bienestar, contenido terapéutico y funciones de seguridad
        personal.
      </p>
    </section>
    <section>
      <h2>2. Uso del servicio</h2>
      <ul>
        <li>La cuenta es personal e intransferible.</li>
        <li>Está prohibido usar la app para acosar, suplantar o dañar a terceros.</li>
        <li>Las alertas de emergencia deben usarse de buena fe.</li>
      </ul>
    </section>
    <section>
      <h2>3. Limitación de responsabilidad</h2>
      <p>
        Refugi es una herramienta de apoyo y no constituye asistencia médica, psicológica
        profesional ni un servicio de emergencias. No garantizamos la entrega de alertas
        cuando falle la conectividad del dispositivo o de terceros.
      </p>
    </section>
    <section>
      <h2>4. Suscripciones</h2>
      <p>
        Las suscripciones son mensuales y se renuevan automáticamente hasta su
        cancelación. Las usuarias registradas por una empresa acceden mediante la
        suscripción de dicha organización.
      </p>
    </section>
    <section>
      <h2>5. Cancelación</h2>
      <p>
        Puedes cancelar en cualquier momento desde los ajustes de la cuenta o escribiendo
        a {SUPPORT_EMAIL}. El acceso se mantiene hasta el fin del período pagado.
      </p>
    </section>
    <section>
      <h2>6. Propiedad intelectual</h2>
      <p>
        El contenido terapéutico, los vídeos y el software son propiedad de Refugi y no
        pueden reproducirse ni redistribuirse sin autorización.
      </p>
    </section>
    <section>
      <h2>7. Legislación aplicable</h2>
      <p>Estos términos se rigen por la legislación española y la normativa europea aplicable.</p>
    </section>
  </LegalLayout>
);

export const DeleteAccountPage = ({ onNavigate }: LegalPageProps) => (
  <LegalLayout title="Eliminar cuenta y datos" updatedAt="28 de julio de 2026" onNavigate={onNavigate}>
    <section>
      <h2>Cómo solicitar la eliminación</h2>
      <p>
        Puedes pedir la eliminación completa de tu cuenta Refugi y de todos tus datos
        enviando un correo desde la dirección asociada a tu cuenta a{" "}
        <a className="underline" href={`mailto:${SUPPORT_EMAIL}?subject=Solicitud%20de%20eliminaci%C3%B3n%20de%20cuenta`}>
          {SUPPORT_EMAIL}
        </a>{" "}
        con el asunto "Solicitud de eliminación de cuenta".
      </p>
    </section>
    <section>
      <h2>Qué datos se eliminan</h2>
      <ul>
        <li>Perfil y credenciales de acceso.</li>
        <li>Registros de estado de ánimo y seguimiento.</li>
        <li>Notas cifradas de la caja fuerte.</li>
        <li>Contactos de confianza y mensajes internos.</li>
        <li>Progreso del camino terapéutico.</li>
      </ul>
    </section>
    <section>
      <h2>Qué datos se conservan y durante cuánto tiempo</h2>
      <p>
        Los registros de facturación se conservan durante el plazo exigido por la
        normativa fiscal (hasta 5 años). El resto de datos se elimina en un plazo máximo
        de 30 días desde la solicitud.
      </p>
    </section>
    <section>
      <h2>Usuarias registradas por una empresa</h2>
      <p>
        Si tu cuenta fue creada por una organización, también puedes solicitar la baja a
        la coordinadora responsable (Refugi Lead) desde el panel de la empresa.
      </p>
    </section>
  </LegalLayout>
);
