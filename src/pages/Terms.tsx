import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Alert,
  Link
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Description as DescriptionIcon,
  Email as EmailIcon,
  Gavel as GavelIcon
} from '@mui/icons-material';

export default function Terms() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography
          variant="h3"
          component="h1"
          fontWeight="bold"
          gutterBottom
          sx={{ 
            background: 'linear-gradient(45deg, #3b82f6, #4f46e5)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif'
          }}
        >
          Términos y Condiciones de Uso
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
          <Chip 
            label="Versión Alpha" 
            color="warning" 
            variant="outlined"
            icon={<DescriptionIcon />}
          />
          <Chip 
            label="Última actualización: 18 de octubre de 2025" 
            color="info" 
            variant="outlined"
          />
        </Box>
        <Typography variant="h6" color="text.secondary">
          Pulse Journal - Stand At Platform Development
        </Typography>
      </Box>

      {/* Términos y Condiciones */}
      <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <DescriptionIcon sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h4" component="h2" fontWeight="bold">
            📄 Términos y Condiciones
          </Typography>
        </Box>

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">1. Sobre el proyecto</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography component="div">
              <ul>
                <li><strong>Proyecto:</strong> Stand At Platform Development</li>
                <li><strong>Ubicación:</strong> Guatemala</li>
                <li><strong>Contacto oficial:</strong> <Link href="mailto:soporte@standatpd.com">soporte@standatpd.com</Link></li>
              </ul>
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">2. Descripción del servicio</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              Pulse Journal es un servicio agéntico para investigación, organización y gestión de datos orientado a periodistas y otras personas profesionales, 
              impulsado por IA con capacidades para extraer, automatizar y visualizar información. 
            </Typography>
            <Typography paragraph>
              Funcionalidades actuales incluyen, entre otras: Vista de Tendencias, últimos contenidos de X, gestión de proyectos, 
              captura inteligente de datos, tablas con exportación CSV, Vizta (agente investigativo y visualización), 
              y Vizta App para marcadores de contenido desde Instagram y X.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">3. Acceso Alpha por invitación</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Alert severity="warning" sx={{ mb: 2 }}>
              La plataforma se encuentra en <strong>fase de desarrollo (Alpha)</strong>
            </Alert>
            <Typography component="div">
              <ul>
                <li>Acceso restringido mediante códigos de invitación</li>
                <li>Las funcionalidades pueden cambiar sin previo aviso, con errores o inestabilidad</li>
                <li>No se garantiza disponibilidad, rendimiento ni continuidad del servicio</li>
              </ul>
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">4. Cuentas y requisitos</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              Para crear una cuenta se solicita: nombre completo, correo electrónico y número de teléfono (para funciones con WhatsApp). 
            </Typography>
            <Typography paragraph>
              La persona usuaria es responsable de mantener la confidencialidad de sus credenciales y de toda actividad realizada con su cuenta.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">5. Uso aceptable</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>Queda prohibido utilizar el servicio para:</Typography>
            <Typography component="div">
              <ul>
                <li>Contenidos o actividades ilegales</li>
                <li>Acoso, spam o abuso de la plataforma</li>
              </ul>
            </Typography>
            <Typography paragraph>
              Durante esta fase Alpha, nos reservamos el derecho de suspender o terminar cuentas ante incumplimientos, 
              siempre buscando resolver situaciones mediante diálogo previo cuando sea posible.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">6. Propiedad de contenidos</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              La propiedad de la información creada o almacenada en Pulse Journal corresponde a la persona usuaria que la generó. 
              El contenido original extraído pertenece a su creador o titular de derechos correspondiente.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">7. Planes, pagos y Paddle (Merchant of Record)</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography component="div">
              <ul>
                <li>Procesamiento de pagos mediante Paddle, quien actúa como Merchant of Record y gestiona cobros, impuestos y cumplimiento PCI DSS</li>
                <li><strong>Vendedor en Paddle:</strong> ID 243336</li>
                <li><strong>Plan Alpha "Supporter/Soporte":</strong> USD $10 mensuales</li>
                <li><strong>Monedas admitidas:</strong> GTQ y USD</li>
                <li><strong>Métodos de pago:</strong> tarjeta de crédito y PayPal</li>
                <li><strong>Facturación:</strong> mensual con renovación automática, hasta que se cancele</li>
                <li>Paddle es responsable del procesamiento del pago y de la gestión de impuestos aplicables</li>
              </ul>
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">8. Renovación y cancelación</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography component="div">
              <ul>
                <li>La suscripción se renueva automáticamente cada período mensual</li>
                <li>La cancelación puede realizarse a través de Paddle y surtirá efecto al final del período de facturación en curso</li>
              </ul>
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">9. Disponibilidad del servicio y mantenimiento</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              El servicio se ofrece "tal cual" y "según disponibilidad", sin garantías de uptime. 
              Podemos realizar mantenimiento programado y notificaremos por correo cuando sea posible.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">10. Limitación de responsabilidad</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              Dado que este es un proyecto en desarrollo temprano (fase Alpha), el servicio se ofrece en su estado actual con limitaciones inherentes. 
              En la máxima medida permitida por la ley aplicable, Stand At Platform Development no será responsable por daños indirectos, 
              incidentales, especiales, consecuenciales ni pérdida de datos o beneficios derivados del uso del servicio.
            </Typography>
            <Alert severity="info" sx={{ mt: 2 }}>
              Recomendamos encarecidamente respaldar tu información importante de manera regular. 
              El uso del proyecto Alpha es bajo responsabilidad de quien participa en las pruebas.
            </Alert>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">11. Indemnización</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              Como proyecto en fase experimental, solicitamos que quienes participan en las pruebas acepten indemnizar y mantener 
              indemne a Stand At Platform Development frente a reclamaciones derivadas del uso del servicio o incumplimiento de estos Términos.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">12. Terminación</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              Podemos suspender o terminar cuentas en cualquier circunstancia, incluyendo violaciones a estos Términos. 
              La persona usuaria puede cerrar su cuenta en cualquier momento. 
              Tras la terminación, el acceso cesa y la información se conserva conforme a la Política de Privacidad hasta su eliminación.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">13. Ley aplicable y resolución de disputas</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              Estos Términos se rigen por las leyes de Guatemala. Te invitamos a contactarnos primero a{' '}
              <Link href="mailto:soporte@standatpd.com">soporte@standatpd.com</Link> si tienes alguna inquietud.
            </Typography>
            <Typography paragraph>
              Como proyecto en fase temprana, priorizamos el diálogo directo para resolver cualquier problema. 
              Si una disputa no puede resolverse de forma amistosa, estará sujeta a la legislación guatemalteca de protección al consumidor.
            </Typography>
            <Typography paragraph>
              Los usuarios pueden presentar quejas ante las autoridades de protección al consumidor en Guatemala si así lo consideran necesario.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">14. Cambios a los Términos</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              Podemos actualizar estos Términos. Notificaremos cambios relevantes por medios razonables. El uso continuado implica aceptación.
            </Typography>
          </AccordionDetails>
        </Accordion>
      </Paper>

      {/* Resolución de Disputas */}
      <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <GavelIcon sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h4" component="h2" fontWeight="bold">
            ⚖️ Resolución de Disputas
          </Typography>
        </Box>

        <Typography paragraph>
          Te alentamos a contactarnos primero al{' '}
          <Link href="mailto:soporte@standatpd.com">soporte@standatpd.com</Link>{' '}
          si tienes alguna inquietud o disputa con respecto a Pulse Journal. 
          Estamos comprometidos a resolver los problemas de manera oportuna y justa.
        </Typography>

        <Typography paragraph>
          Si no podemos resolver una disputa a través de comunicación directa dentro de 30 días, 
          las disputas estarán sujetas a las disposiciones de la Ley de Protección al Consumidor y Usuario de Guatemala (Decreto 006-2003).
        </Typography>

        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Recursos de protección al consumidor en Guatemala:
          </Typography>
          <Typography component="div">
            Como proyecto guatemalteco, reconocemos la legislación de protección al consumidor (Decreto 006-2003). 
            Si bien estamos en fase experimental, los usuarios cuentan con el derecho de presentar quejas ante las autoridades competentes si lo consideran necesario.
            <br/><br/>
            <ul>
              <li><strong>Contacto de autoridades de protección al consumidor:</strong>{' '}
                <Link href="mailto:diacoquejasweb@mineco.gob.gt">diacoquejasweb@mineco.gob.gt</Link>
              </li>
              <li><strong>Autoridad:</strong> Ministerio de Economía de Guatemala</li>
            </ul>
          </Typography>
        </Alert>

        <Typography paragraph>
          Sin embargo, como proyecto en desarrollo temprano, te invitamos primero a dialogar directamente con nosotros en{' '}
          <Link href="mailto:soporte@standatpd.com">soporte@standatpd.com</Link>{' '}
          para resolver cualquier inquietud de manera ágil y constructiva.
        </Typography>
      </Paper>

      {/* Contacto */}
      <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
          <EmailIcon sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h5" component="h3" fontWeight="bold">
            📬 Contacto
          </Typography>
        </Box>
        <Typography variant="h6" color="primary.main">
          soporte@standatpd.com
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Para consultas, soporte técnico o ejercicio de derechos sobre tus datos
        </Typography>
      </Paper>

      <Divider sx={{ my: 4 }} />

      {/* Footer */}
      <Box sx={{ textAlign: 'center', py: 2 }}>
        <Typography variant="body2" color="text.secondary">
          © 2025 Stand At Platform Development - Pulse Journal. Todos los derechos reservados.
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Versión Alpha - Documento actualizado el 18 de octubre de 2025
        </Typography>
      </Box>
    </Container>
  );
}
