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
  Shield as PrivacyIcon,
  Security as SecurityIcon,
  DataUsage as DataUsageIcon,
  Email as EmailIcon
} from '@mui/icons-material';

export default function Privacy() {
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
          Política de Privacidad
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
          <Chip 
            label="Versión Alpha" 
            color="warning" 
            variant="outlined"
            icon={<PrivacyIcon />}
          />
          <Chip 
            label="Última actualización: 18 de octubre de 2025" 
            color="info" 
            variant="outlined"
          />
        </Box>
        <Typography variant="h6" color="text.secondary">
          Pulse Journal - Protección de Datos Personales
        </Typography>
      </Box>

      {/* Política de Privacidad */}
      <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <PrivacyIcon sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h4" component="h2" fontWeight="bold">
            🔒 Política de Privacidad
          </Typography>
        </Box>

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">1. Sobre este proyecto y contacto</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography component="div">
              <ul>
                <li><strong>Proyecto:</strong> Stand At Platform Development</li>
                <li><strong>Contacto:</strong> <Link href="mailto:soporte@standatpd.com">soporte@standatpd.com</Link></li>
                <li><strong>Ámbito:</strong> usuarios en Centroamérica, con foco inicial en Guatemala</li>
              </ul>
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">2. Datos personales que recopilamos</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Alert severity="info" sx={{ mb: 2 }}>
              Solo recolectamos la información necesaria para brindarte el mejor servicio
            </Alert>
            <Typography component="div">
              <ul>
                <li><strong>Identificadores:</strong> nombre, correo electrónico, número de teléfono</li>
                <li><strong>Datos de pago</strong> (si corresponde al plan de soporte): gestionados por Paddle</li>
                <li><strong>Datos de uso y analíticas,</strong> incluyendo categorizaciones de uso</li>
                <li><strong>Contenido</strong> que subes o gestionas en el servicio</li>
              </ul>
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">3. Cómo recopilamos los datos</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography component="div">
              <ul>
                <li>Aportados directamente por la persona usuaria</li>
                <li>Cookies y tecnologías de análisis</li>
                <li>Integraciones de terceros</li>
              </ul>
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">4. Finalidades del tratamiento</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography component="div">
              <ul>
                <li>Gestión de cuenta y prestación del servicio</li>
                <li>Facturación y cobros del plan de soporte mediante Paddle</li>
                <li>Analítica y mejora del producto</li>
              </ul>
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">5. Bases legales</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography component="div">
              <ul>
                <li>Ejecución de contrato para la prestación del servicio y facturación</li>
                <li>Interés legítimo para analítica y mejora del servicio</li>
                <li>Cuando corresponda, cumplimiento de obligaciones legales</li>
              </ul>
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">6. Terceros con los que compartimos datos</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <strong>No vendemos ni alquilamos tu información personal a terceros</strong>
            </Alert>
            <Typography component="div">
              Solo compartimos datos con:
              <ul>
                <li><strong>Paddle:</strong> procesamiento de pagos y gestión de impuestos</li>
                <li><strong>Supabase:</strong> alojamiento y base de datos de la plataforma</li>
                <li><strong>Proveedores de IA y análisis:</strong> OpenAI, Anthropic (Claude) y DeepSeek, para funcionalidades agénticas y de análisis</li>
              </ul>
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">7. Cookies</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              Usamos cookies de analítica. Puedes gestionar preferencias desde la configuración de tu navegador y, 
              cuando corresponda, a través de controles de consentimiento.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">8. Transferencias internacionales y ubicación de datos</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              Los datos se alojan en Supabase, en Estados Unidos. Pueden realizarse transferencias internacionales sujetas a garantías adecuadas. 
              Paddle y otros terceros pueden procesar datos en sus propias jurisdicciones.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">9. Retención y eliminación</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography component="div">
              <ul>
                <li>Conservamos datos por hasta 2 meses después del cierre de la cuenta, salvo obligación legal distinta</li>
                <li><strong>Eliminación a petición:</strong> atendemos solicitudes en un plazo aproximado de 2 meses</li>
              </ul>
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">10. Derechos de las personas usuarias</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              Tienes derecho a: <strong>acceso, rectificación, eliminación, oposición y portabilidad,</strong> conforme a la normativa aplicable.
            </Typography>
            <Typography paragraph>
              <strong>Solicitudes:</strong> por correo a <Link href="mailto:soporte@standatpd.com">soporte@standatpd.com</Link>. 
              Podemos requerir verificación de identidad.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">11. Seguridad</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SecurityIcon sx={{ mr: 1, color: 'success.main' }} />
              <Typography fontWeight="bold">Medidas de seguridad implementadas</Typography>
            </Box>
            <Typography paragraph>
              Como proyecto en fase Alpha, aplicamos medidas técnicas y organizativas razonables, incluyendo cifrado en tránsito y controles de acceso. 
              Estamos mejorando continuamente nuestras prácticas de seguridad conforme el proyecto madura.
            </Typography>
            <Alert severity="info">
              No obstante, ningún sistema es 100% seguro, por lo que recomendamos precaución con información sensible.
            </Alert>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">12. Menores de edad</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              El servicio está dirigido únicamente a personas mayores de edad. No recopilamos intencionalmente datos de menores de 16 años.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">13. Naturaleza experimental del proyecto y cambios en la Política</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              Al ser un proyecto en fase Alpha, las funcionalidades y prácticas pueden evolucionar rápidamente conforme aprendemos y mejoramos. 
              Podemos actualizar esta Política y te notificaremos los cambios importantes por medios razonables, generalmente por correo electrónico.
            </Typography>
          </AccordionDetails>
        </Accordion>
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
          Para consultas sobre privacidad y protección de datos
        </Typography>
        <Alert severity="success" sx={{ mt: 2, maxWidth: 600, mx: 'auto' }}>
          <Typography variant="body2">
            <strong>Respuesta garantizada en 72 horas</strong> para consultas sobre privacidad y protección de datos.
          </Typography>
        </Alert>
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
