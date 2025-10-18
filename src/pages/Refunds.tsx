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
  Money as MoneyIcon,
  CreditCard as CreditCardIcon,
  Email as EmailIcon
} from '@mui/icons-material';

export default function Refunds() {
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
          Política de Reembolsos
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
          <Chip 
            label="Versión Alpha" 
            color="warning" 
            variant="outlined"
            icon={<MoneyIcon />}
          />
          <Chip 
            label="Última actualización: 18 de octubre de 2025" 
            color="info" 
            variant="outlined"
          />
        </Box>
        <Typography variant="h6" color="text.secondary">
          Pulse Journal - Política de Reembolsos y Cancelaciones
        </Typography>
      </Box>

      {/* Política de Reembolsos */}
      <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <CreditCardIcon sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h4" component="h2" fontWeight="bold">
            💳 Política de Reembolsos
          </Typography>
        </Box>

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">1. Alcance</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              Esta política aplica a suscripciones pagadas del plan Alpha "Supporter/Soporte". 
            </Typography>
            <Typography paragraph>
              Los pagos son procesados por <strong>Paddle (Merchant of Record)</strong>.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">2. Régimen de reembolsos en fase experimental</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography fontWeight="bold">Importante: Fase Experimental</Typography>
            </Alert>
            <Typography component="div">
              <ul>
                <li>Debido a la naturaleza experimental del proyecto y a que el acceso Alpha es principalmente para pruebas y soporte al desarrollo, 
                    <strong> no se ofrecen reembolsos durante esta fase</strong></li>
                <li>No aplican reembolsos prorrateados por cancelación durante el período facturado</li>
              </ul>
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">3. Cancelaciones</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography component="div">
              <ul>
                <li>La cancelación se gestiona a través de Paddle</li>
                <li>El efecto de cancelación ocurre al final del ciclo de facturación vigente</li>
              </ul>
            </Typography>
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Podrás seguir usando el servicio hasta el final del período que ya pagaste.
              </Typography>
            </Alert>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">4. Consideraciones legales</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              Si la legislación aplicable requiere reembolsos en circunstancias específicas, evaluaremos cada situación de manera individual 
              a través de Paddle, siempre buscando un equilibrio justo para un proyecto en desarrollo temprano.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">5. Disputas de pago y contracargos</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              Las disputas y contracargos se tramitan conforme a los procedimientos de Paddle y de los emisores de pago correspondientes. 
            </Typography>
            <Typography paragraph>
              Podemos solicitar información adicional para su evaluación.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">6. Contacto</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              Para preguntas sobre esta política: <Link href="mailto:soporte@standatpd.com">soporte@standatpd.com</Link>
            </Typography>
          </AccordionDetails>
        </Accordion>
      </Paper>

      {/* Información Adicional */}
      <Paper elevation={2} sx={{ p: 4, mb: 4, bgcolor: 'background.default' }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          ℹ️ Información Importante
        </Typography>
        <Typography paragraph>
          Al participar en la fase Alpha de Pulse Journal, reconoces y aceptas que:
        </Typography>
        <Typography component="div">
          <ul>
            <li>El servicio está en desarrollo temprano y puede presentar inestabilidades</li>
            <li>Tu aporte como "Supporter/Soporte" ayuda al desarrollo continuo del proyecto</li>
            <li>Las funcionalidades pueden cambiar, mejorar o ajustarse sin previo aviso</li>
            <li>Estás contribuyendo al crecimiento de una plataforma en fase experimental</li>
          </ul>
        </Typography>
        
        <Alert severity="success" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>¡Gracias por ser parte de nuestro proyecto Alpha!</strong> Tu apoyo es fundamental para el desarrollo de Pulse Journal.
          </Typography>
        </Alert>
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
          Para preguntas sobre pagos, suscripciones y reembolsos
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

