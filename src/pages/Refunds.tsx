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
import { ExpandMore, ArrowBack, CheckCircle } from '@mui/icons-material';
import Logo from '../components/common/Logo';

export default function Refunds() {
  const navigate = useNavigate();

  const sections = [
    {
      title: '1. Alcance',
      content: (
        <Typography paragraph color="#666">
          Esta política aplica a todas las compras realizadas en ALAB, incluyendo el Plan Soporte 
          y la compra de créditos adicionales. Los pagos son procesados por Paddle (Merchant of Record).
        </Typography>
      ),
    },
    {
      title: '2. Plazo de Garantía - 14 Días',
      content: (
        <Box>
          <Typography paragraph color="#666">
            El Usuario tiene derecho a solicitar reembolso total dentro de los primeros <strong>catorce (14) días calendario</strong> desde 
            la fecha de compra inicial, siempre que:
          </Typography>
          <Box sx={{ pl: 2, mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1.5 }}>
              <CheckCircle sx={{ color: '#3b82f6', fontSize: 20, mt: 0.3 }} />
              <Typography variant="body2" color="#666">
                Sea la primera adquisición del Usuario en la herramienta específica
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1.5 }}>
              <CheckCircle sx={{ color: '#3b82f6', fontSize: 20, mt: 0.3 }} />
              <Typography variant="body2" color="#666">
                La solicitud se presente dentro del plazo de 14 días establecido
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <CheckCircle sx={{ color: '#3b82f6', fontSize: 20, mt: 0.3 }} />
              <Typography variant="body2" color="#666">
                No exista violación a los Términos y Condiciones por parte del Usuario
              </Typography>
            </Box>
          </Box>
        </Box>
      ),
    },
    {
      title: '3. Procedimiento de Solicitud',
      content: (
        <Box>
          <Typography paragraph color="#666">
            Las solicitudes de reembolso deben dirigirse a{' '}
            <a href="mailto:contacto@standatpd.com" style={{ color: '#3b82f6', textDecoration: 'none' }}>
              contacto@standatpd.com
            </a>
            , incluyendo la siguiente información:
          </Typography>
          <Box sx={{ pl: 2, mt: 2 }}>
            <Typography variant="body2" color="#666" sx={{ mb: 1 }}>
              • Nombre del Usuario y correo electrónico registrado
            </Typography>
            <Typography variant="body2" color="#666" sx={{ mb: 1 }}>
              • Fecha de compra
            </Typography>
            <Typography variant="body2" color="#666" sx={{ mb: 1 }}>
              • Herramienta o servicio contratado (Plan Soporte o Créditos)
            </Typography>
            <Typography variant="body2" color="#666">
              • Motivo de la solicitud
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      title: '4. Procesamiento del Reembolso',
      content: (
        <Typography paragraph color="#666">
          Los reembolsos autorizados se procesan a través de Paddle en un plazo de <strong>cinco (5) a diez (10) días hábiles</strong>. 
          El tiempo puede variar según el método de pago utilizado.
        </Typography>
      ),
    },
    {
      title: '5. Exclusión de Reembolsos',
      content: (
        <Box>
          <Typography paragraph color="#666">
            Transcurrido el plazo de catorce (14) días desde la compra, <strong>no procederán reembolsos</strong>, 
            salvo disposición legal en contrario o decisión discrecional de StandAtPD.
          </Typography>
          <Typography variant="body2" color="#666" sx={{ mt: 2 }}>
            <strong>Nota:</strong> Los créditos comprados no son reembolsables después del período de 14 días, 
            pero tampoco expiran y permanecen disponibles en tu cuenta.
          </Typography>
        </Box>
      ),
    },
    {
      title: '6. Cancelaciones de Suscripción',
      content: (
        <Box>
          <Typography paragraph color="#666">
            La cancelación del Plan Soporte se gestiona a través de Paddle y surte efecto al final del ciclo 
            de facturación vigente. Podrás seguir usando el servicio hasta el final del período que ya pagaste.
          </Typography>
          <Typography variant="body2" color="#666" sx={{ mt: 2 }}>
            La cancelación no genera reembolso del período en curso, pero los 50 créditos mensuales incluidos 
            permanecerán disponibles en tu cuenta.
          </Typography>
        </Box>
      ),
    },
    {
      title: '7. Disputas de Pago',
      content: (
        <Typography paragraph color="#666">
          Las disputas y contracargos se tramitan conforme a los procedimientos de Paddle 
          y de los emisores de pago correspondientes. Podemos solicitar información adicional para su evaluación.
        </Typography>
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
                  pulse
                </Typography>
                <Typography variant="caption" color="#666" sx={{ letterSpacing: 1.5 }}>
                  JOURNAL
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
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" fontWeight="700" color="#1a1a1a" gutterBottom>
            Política de Reembolsos
          </Typography>
          <Typography variant="body1" color="#666">
            Última actualización: Noviembre 2025
          </Typography>
        </Box>

        {/* Alert destacado */}
        <Alert severity="info" sx={{ mb: 4 }}>
          <Typography variant="body2">
            <strong>Garantía de 14 días:</strong> Ofrecemos reembolso completo dentro de los primeros 14 días 
            calendario desde tu compra inicial.
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

        {/* Recordatorio importante */}
        <Box sx={{ mt: 6, p: 4, bgcolor: '#fff3cd', borderRadius: 2, border: '1px solid #ffc107' }}>
          <Typography variant="h6" fontWeight="600" color="#1a1a1a" gutterBottom>
            Recordatorio Importante
          </Typography>
          <Typography variant="body2" color="#666" paragraph>
            • Los reembolsos solo están disponibles dentro de los primeros <strong>14 días</strong> de tu compra inicial
          </Typography>
          <Typography variant="body2" color="#666" paragraph>
            • Los créditos no expiran y permanecen en tu cuenta incluso si cancelas tu suscripción
          </Typography>
          <Typography variant="body2" color="#666">
            • Para solicitar un reembolso, contáctanos a{' '}
            <a href="mailto:contacto@standatpd.com" style={{ color: '#3b82f6', textDecoration: 'none' }}>
              contacto@standatpd.com
            </a>
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
