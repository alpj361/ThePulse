import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
} from '@mui/material';
import { ExpandMore, ArrowBack, Info } from '@mui/icons-material';
import Logo from '../components/common/Logo';

export default function TermsThePulse() {
  const navigate = useNavigate();

  const sections = [
    {
      title: '1. DEFINICIONES',
      content: (
        <Box>
          <Typography paragraph color="#666">
            <strong>1.1. StandAtPD:</strong> Stand At Platform Development, entidad legal guatemalteca responsable de la operación, desarrollo y prestación de todos los servicios descritos en estos Términos.<br /><br />
            <strong>1.2. Plataforma o Servicio:</strong> Pulse Journal, herramienta tecnológica desarrollada y operada por StandAtPD, que incluye funcionalidades de creación de contenido, investigación, análisis de información, inteligencia artificial y colaboración.<br /><br />
            <strong>1.3. Usuario:</strong> Toda persona física mayor de edad que acceda, se registre o utilice los servicios de la Plataforma.<br /><br />
            <strong>1.4. Cuenta:</strong> El perfil individual creado por el Usuario para acceder a los servicios, protegido mediante credenciales de autenticación.<br /><br />
            <strong>1.5. Contenido del Usuario:</strong> Toda información, datos, textos, archivos, materiales o contenidos que el Usuario cree, cargue, transmita o almacene mediante el uso de la Plataforma.<br /><br />
            <strong>1.6. Fase Alpha:</strong> Etapa de desarrollo experimental en la cual las herramientas se encuentran en proceso de prueba y optimización.<br /><br />
            <strong>1.7. Plan de Suscripción:</strong> Modalidad de contratación de servicios con facturación periódica (mensual o anual) según la herramienta específica contratada.
          </Typography>
        </Box>
      ),
    },
    {
      title: '2. NATURALEZA Y ALCANCE DEL SERVICIO',
      content: (
        <Box>
          <Typography paragraph color="#666">
            <strong>2.1. Descripción del Servicio</strong><br />
            StandAtPD opera y desarrolla Pulse Journal, una herramienta tecnológica diseñada para profesionales del periodismo y la comunicación, ofreciendo funcionalidades de creación, edición, investigación, análisis y colaboración, con integración de tecnologías de inteligencia artificial.<br /><br />
            <strong>2.2. Estado de Desarrollo</strong><br />
            El Usuario reconoce y acepta expresamente que la mayoría de las herramientas se encuentran en <strong>Fase Alpha de desarrollo</strong>. En consecuencia:<br />
            a) Las funcionalidades pueden experimentar modificaciones, adiciones o eliminaciones sin previo aviso;<br />
            b) El Servicio puede presentar errores técnicos, interrupciones temporales o pérdida de funcionalidad;<br />
            c) No se garantiza disponibilidad continua e ininterrumpida del Servicio;<br />
            d) Las actualizaciones y mantenimientos pueden requerir suspensión temporal del acceso.
          </Typography>
        </Box>
      ),
    },
    {
      title: '3. REQUISITOS Y USO DEL SERVICIO',
      content: (
        <Box>
          <Typography paragraph color="#666">
            <strong>3.1. Capacidad Legal</strong><br />
            El Usuario declara ser mayor de dieciocho (18) años y contar con plena capacidad legal para contratar y obligarse conforme a estos Términos.<br /><br />
            <strong>3.2. Registro y Cuenta</strong><br />
            El Usuario se compromete a proporcionar información verídica, exacta y actualizada durante el proceso de registro; mantener la confidencialidad de sus credenciales de acceso; notificar inmediatamente cualquier uso no autorizado; y asumir la responsabilidad exclusiva por todas las actividades realizadas bajo su Cuenta.<br /><br />
            <strong>3.3. Uso Permitido</strong><br />
            El Servicio está destinado exclusivamente a actividades periodísticas y de comunicación profesional, investigación de diversos ámbitos y análisis de información, creación y edición de contenidos, y colaboración profesional.<br /><br />
            <strong>3.4. Uso Prohibido</strong><br />
            Queda estrictamente prohibido utilizar el Servicio para actividades ilícitas o contrarias a la ley; distribuir spam, contenido engañoso, difamatorio o discriminatorio; infringir derechos de propiedad intelectual de terceros; intentar acceder, interferir o comprometer la seguridad de la Plataforma; realizar ingeniería inversa o acceso no autorizado al código fuente; o utilizar el Servicio de manera que pueda dañar, deshabilitar o sobrecargar la infraestructura.<br /><br />
            <strong>3.5. Consecuencias del Incumplimiento</strong><br />
            El incumplimiento de las obligaciones establecidas faculta a StandAtPD para suspender o cancelar la Cuenta del Usuario sin previo aviso y sin derecho a reembolso.
          </Typography>
        </Box>
      ),
    },
    {
      title: '4. INTELIGENCIA ARTIFICIAL',
      content: (
        <Box>
          <Typography paragraph color="#666">
            <strong>4.1. Uso de Tecnología IA</strong><br />
            La Plataforma integra tecnologías de inteligencia artificial para optimizar funcionalidades de creación, análisis y procesamiento de contenidos.<br /><br />
            <strong>4.2. Limitaciones y Responsabilidades</strong><br />
            El Usuario reconoce expresamente que los sistemas de inteligencia artificial pueden generar resultados inexactos, incompletos o erróneos; el contenido generado por IA requiere verificación humana antes de su publicación o uso profesional; la responsabilidad exclusiva por el contenido publicado o utilizado recae en el Usuario; y StandAtPD no asume responsabilidad por decisiones editoriales o profesionales basadas en resultados generados por IA.<br /><br />
            <strong>4.3. Estándares Profesionales</strong><br />
            En actividades periodísticas, el Usuario mantiene la obligación de verificar hechos, contrastar fuentes y cumplir con los estándares éticos y deontológicos de la profesión.
          </Typography>
        </Box>
      ),
    },
    {
      title: '5. PRIVACIDAD Y PROTECCIÓN DE DATOS',
      content: (
        <Box>
          <Typography paragraph color="#666">
            <strong>5.1. Propiedad del Contenido</strong><br />
            El Usuario conserva todos los derechos de propiedad intelectual sobre el Contenido del Usuario creado mediante la Plataforma.<br /><br />
            <strong>5.2. Tratamiento de Datos</strong><br />
            StandAtPD recopila y procesa información de registro, datos de uso y actividad en la Plataforma, contenido del Usuario, información técnica y de dispositivos, y datos de facturación y pago.<br /><br />
            <strong>5.3. Finalidades del Tratamiento</strong><br />
            Los datos se utilizan exclusivamente para prestación y mejora del Servicio, procesamiento mediante inteligencia artificial cuando el Usuario utilice dichas funcionalidades, respaldo y seguridad de la información, facturación y gestión de pagos, y cumplimiento de obligaciones legales.<br /><br />
            <strong>5.4. No Comercialización de Datos</strong><br />
            StandAtPD no vende, alquila ni comercializa datos personales de los Usuarios a terceros.<br /><br />
            <strong>5.5. Derechos del Usuario</strong><br />
            El Usuario tiene derecho a acceder, rectificar, exportar o solicitar la eliminación de sus datos personales mediante comunicación a{' '}
            <a href="mailto:contacto@standatpd.com" style={{ color: '#3b82f6', textDecoration: 'none' }}>
              contacto@standatpd.com
            </a>.
          </Typography>
        </Box>
      ),
    },
    {
      title: '6. CONDICIONES COMERCIALES Y PAGOS',
      content: (
        <Box>
          <Typography paragraph color="#666">
            <strong>6.1. Procesador de Pagos</strong><br />
            StandAtPD utiliza Paddle como procesador de pagos autorizado. El Usuario acepta las condiciones de servicio de Paddle al realizar transacciones.<br /><br />
            <strong>6.2. Métodos de Pago</strong><br />
            Se aceptan tarjetas de crédito y débito según disponibilidad en la plataforma de pago.<br /><br />
            <strong>6.3. Suscripciones</strong><br />
            Las suscripciones se facturan automáticamente según la periodicidad contratada (mensual o anual). La renovación es automática salvo cancelación expresa por parte del Usuario.<br /><br />
            <strong>6.4. Modificaciones de Precio</strong><br />
            StandAtPD se reserva el derecho de modificar tarifas con notificación previa de treinta (30) días al Usuario. Los cambios no afectan períodos de facturación ya pagados.
          </Typography>
        </Box>
      ),
    },
    {
      title: '7. POLÍTICA DE REEMBOLSOS',
      content: (
        <Box>
          <Typography paragraph color="#666">
            <strong>7.1. Plazo de Garantía</strong><br />
            El Usuario tiene derecho a solicitar reembolso total dentro de los primeros catorce (14) días calendario desde la fecha de compra inicial, siempre que sea la primera adquisición del Usuario en la herramienta específica, la solicitud se presente dentro del plazo establecido, y no exista violación a estos Términos por parte del Usuario.<br /><br />
            <strong>7.2. Procedimiento</strong><br />
            Las solicitudes de reembolso deben dirigirse a{' '}
            <a href="mailto:contacto@standatpd.com" style={{ color: '#3b82f6', textDecoration: 'none' }}>
              contacto@standatpd.com
            </a>, incluyendo nombre del Usuario y correo electrónico registrado, fecha de compra, herramienta o servicio contratado, y motivo de la solicitud.<br /><br />
            <strong>7.3. Procesamiento</strong><br />
            Los reembolsos autorizados se procesan a través de Paddle en un plazo de cinco (5) a diez (10) días hábiles.<br /><br />
            <strong>7.4. Exclusión de Reembolsos</strong><br />
            Transcurrido el plazo de catorce (14) días desde la compra, no procederán reembolsos, salvo disposición legal en contrario o decisión discrecional de StandAtPD.
          </Typography>
        </Box>
      ),
    },
    {
      title: '8. CANCELACIÓN Y TERMINACIÓN',
      content: (
        <Box>
          <Typography paragraph color="#666">
            <strong>8.1. Cancelación por el Usuario</strong><br />
            El Usuario puede cancelar su suscripción en cualquier momento desde la configuración de su Cuenta. El acceso permanecerá activo hasta la finalización del período de facturación pagado.<br /><br />
            <strong>8.2. Terminación por StandAtPD</strong><br />
            StandAtPD se reserva el derecho de suspender o cancelar cuentas en casos de incumplimiento de estos Términos, actividades fraudulentas o ilegales, impago de servicios contratados, o uso indebido que comprometa la seguridad o funcionamiento de la Plataforma.<br /><br />
            <strong>8.3. Efectos de la Terminación</strong><br />
            Tras la cancelación o terminación, el Usuario debe exportar su Contenido antes de la fecha efectiva de terminación. StandAtPD conservará el Contenido del Usuario durante treinta (30) días adicionales. Transcurrido dicho plazo, el contenido será eliminado permanentemente sin posibilidad de recuperación.
          </Typography>
        </Box>
      ),
    },
    {
      title: '9. LIMITACIÓN DE RESPONSABILIDAD',
      content: (
        <Box>
          <Typography paragraph color="#666">
            <strong>9.1. Exclusión de Garantías</strong><br />
            El Servicio se proporciona "TAL CUAL" y "SEGÚN DISPONIBILIDAD", sin garantías de ningún tipo, expresas o implícitas.<br /><br />
            <strong>9.2. Exclusión de Daños</strong><br />
            En la máxima medida permitida por la ley aplicable, StandAtPD no será responsable por daños indirectos, incidentales, especiales, consecuentes o punitivos; pérdida de beneficios, ingresos, datos, uso u oportunidades de negocio; daños derivados del uso o imposibilidad de uso del Servicio; errores o inexactitudes en contenido generado por inteligencia artificial; acceso no autorizado a cuentas o datos del Usuario; o interrupciones, errores o fallas técnicas.<br /><br />
            <strong>9.3. Limitación Cuantitativa</strong><br />
            La responsabilidad total agregada de StandAtPD bajo estos Términos no excederá del mayor entre: (i) las cantidades pagadas por el Usuario en los últimos doce (12) meses, o (ii) mil dólares estadounidenses (USD $1,000).<br /><br />
            <strong>9.4. Responsabilidad del Usuario</strong><br />
            El Usuario es exclusivamente responsable por el Contenido del Usuario que cree, publique o distribuya; las decisiones profesionales o editoriales basadas en el uso del Servicio; el cumplimiento de estándares éticos y deontológicos profesionales; la verificación de información antes de su publicación; y el cumplimiento de las leyes aplicables en su jurisdicción.
          </Typography>
        </Box>
      ),
    },
    {
      title: '10. PROPIEDAD INTELECTUAL',
      content: (
        <Box>
          <Typography paragraph color="#666">
            <strong>10.1. Derechos de StandAtPD</strong><br />
            Todos los derechos de propiedad intelectual sobre la Plataforma, incluyendo diseño, código, marcas, logotipos y materiales, son propiedad exclusiva de StandAtPD.<br /><br />
            <strong>10.2. Licencia de Uso</strong><br />
            StandAtPD otorga al Usuario una licencia limitada, no exclusiva, no transferible y revocable para utilizar el Servicio conforme a estos Términos.<br /><br />
            <strong>10.3. Licencia sobre Contenido del Usuario</strong><br />
            El Usuario otorga a StandAtPD una licencia mundial, libre de regalías para utilizar, reproducir, procesar y almacenar el Contenido del Usuario exclusivamente para la prestación del Servicio.
          </Typography>
        </Box>
      ),
    },
    {
      title: '11. MODIFICACIONES A LOS TÉRMINOS',
      content: (
        <Box>
          <Typography paragraph color="#666">
            <strong>11.1. Derecho de Modificación</strong><br />
            StandAtPD se reserva el derecho de modificar estos Términos en cualquier momento.<br /><br />
            <strong>11.2. Notificación</strong><br />
            Las modificaciones sustanciales serán notificadas al Usuario con treinta (30) días de anticipación mediante correo electrónico a la dirección registrada.<br /><br />
            <strong>11.3. Aceptación</strong><br />
            El uso continuado del Servicio tras la entrada en vigor de las modificaciones constituye aceptación de los nuevos Términos.
          </Typography>
        </Box>
      ),
    },
    {
      title: '12. DISPOSICIONES GENERALES',
      content: (
        <Box>
          <Typography paragraph color="#666">
            <strong>12.1. Ley Aplicable y Jurisdicción</strong><br />
            Estos Términos se rigen por las leyes de Guatemala. Cualquier controversia derivada de estos Términos se someterá a la jurisdicción exclusiva de los tribunales competentes de Guatemala.<br /><br />
            <strong>12.2. Independencia de Cláusulas</strong><br />
            Si alguna disposición de estos Términos fuere declarada inválida o inaplicable, las demás disposiciones mantendrán plena vigencia y efectos.<br /><br />
            <strong>12.3. Integridad del Acuerdo</strong><br />
            Estos Términos, junto con la Política de Privacidad, constituyen el acuerdo completo entre las partes respecto al objeto de los mismos.<br /><br />
            <strong>12.4. No Renuncia</strong><br />
            La falta de ejercicio o retraso en el ejercicio de cualquier derecho bajo estos Términos no constituirá renuncia al mismo.<br /><br />
            <strong>12.5. Cesión</strong><br />
            El Usuario no podrá ceder sus derechos u obligaciones bajo estos Términos sin consentimiento previo y escrito de StandAtPD.
          </Typography>
        </Box>
      ),
    },
    {
      title: '13. CONTACTO',
      content: (
        <Box>
          <Typography paragraph color="#666">
            Para consultas, solicitudes o notificaciones relacionadas con estos Términos, contactar a:<br /><br />
            <strong>Entidad Legal:</strong> StandAtPD (Stand At Platform Development)<br />
            <strong>Correo electrónico:</strong>{' '}
            <a href="mailto:contacto@standatpd.com" style={{ color: '#3b82f6', textDecoration: 'none' }}>
              contacto@standatpd.com
            </a><br />
            <strong>Herramienta:</strong> Pulse Journal<br />
            <strong>Jurisdicción:</strong> Guatemala
          </Typography>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa' }}>
      {/* Header */}
      <Box component="header" sx={{ py: 3, px: 4, bgcolor: 'white', borderBottom: '1px solid #e0e0e0' }}>
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' }} onClick={() => navigate('/')}>
              <Logo size={32} variant="icon" />
              <Box>
                <Typography variant="h5" fontWeight="700" color="#1a1a1a">
                  PULSE JOURNAL
                </Typography>
                <Typography variant="caption" color="#666" sx={{ letterSpacing: 1.5 }}>
                  by StandAtPD
                </Typography>
              </Box>
            </Box>
            
            <Button 
              variant="text"
              startIcon={<ArrowBack />}
              onClick={() => navigate('/')}
              sx={{ 
                textTransform: 'none',
                color: '#666',
                '&:hover': { color: '#3b82f6', bgcolor: 'transparent' }
              }}
            >
              Volver
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Content */}
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" fontWeight="700" color="#1a1a1a" gutterBottom>
            Términos y Condiciones
          </Typography>
          <Typography variant="body1" color="#666">
            Versión 1.0 - Formal Legal · Última actualización: Noviembre 2025
          </Typography>
          <Typography variant="body2" color="#999" sx={{ mt: 1 }}>
            Documento legal vinculante
          </Typography>
        </Box>

        {/* Legal Entity Notice */}
        <Alert 
          icon={<Info />} 
          severity="info" 
          sx={{ mb: 4, bgcolor: '#e3f2fd', border: '1px solid #90caf9' }}
        >
          <Typography variant="body2" color="#1565c0">
            <strong>StandAtPD</strong> (Stand At Platform Development) es la entidad legal guatemalteca responsable de la operación, desarrollo y prestación de servicios de <strong>Pulse Journal</strong> y otras herramientas tecnológicas.
          </Typography>
        </Alert>

        <Box sx={{ bgcolor: 'white', borderRadius: 2, border: '1px solid #e0e0e0', overflow: 'hidden' }}>
          {sections.map((section, index) => (
            <Accordion 
              key={index}
              disableGutters
              elevation={0}
              sx={{
                '&:before': { display: 'none' },
                borderBottom: index !== sections.length - 1 ? '1px solid #e0e0e0' : 'none'
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMore sx={{ color: '#3b82f6' }} />}
                sx={{
                  px: 4,
                  py: 2,
                  '&:hover': { bgcolor: '#fafafa' }
                }}
              >
                <Typography variant="h6" fontWeight="600" color="#1a1a1a">
                  {section.title}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 4, pb: 3 }}>
                {section.content}
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>

        <Box sx={{ mt: 6, p: 4, bgcolor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
          <Typography variant="h6" fontWeight="600" color="#1a1a1a" gutterBottom>
            ACEPTACIÓN
          </Typography>
          <Typography paragraph color="#666">
            Al registrarse, acceder o utilizar los servicios de Pulse Journal, el Usuario declara haber leído, comprendido y aceptado en su totalidad los presentes Términos y Condiciones, obligándose a su cumplimiento.
          </Typography>
          <Typography variant="body2" color="#999" sx={{ mt: 2, fontStyle: 'italic' }}>
            StandAtPD (Stand At Platform Development) · Operador Legal de Pulse Journal
          </Typography>
        </Box>

        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Typography variant="body2" color="#999">
            ¿Preguntas? Contáctanos en{' '}
            <a href="mailto:contacto@standatpd.com" style={{ color: '#3b82f6', textDecoration: 'none' }}>
              contacto@standatpd.com
            </a>
          </Typography>
        </Box>
      </Container>

      {/* Footer */}
      <Box 
        component="footer" 
        sx={{ 
          py: 4, 
          px: 4, 
          bgcolor: 'white',
          borderTop: '1px solid #e0e0e0',
          mt: 8
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" color="#999" textAlign="center">
            © {new Date().getFullYear()} StandAtPD · Todos los derechos reservados
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
