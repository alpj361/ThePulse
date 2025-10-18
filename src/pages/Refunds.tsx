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
} from '@mui/material';
import { ExpandMore, ArrowBack } from '@mui/icons-material';
import Logo from '../components/common/Logo';

export default function Refunds() {
  const navigate = useNavigate();

  const sections = [
    {
      title: '1. Alcance',
      content: (
        <Typography paragraph color="#666">
          Esta política aplica a suscripciones pagadas del plan Alpha "Supporter/Soporte". 
          Los pagos son procesados por Paddle (Merchant of Record).
        </Typography>
      ),
    },
    {
      title: '2. Fase experimental',
      content: (
        <Typography paragraph color="#666">
          Debido a la naturaleza experimental del proyecto y a que el acceso Alpha es principalmente 
          para pruebas y soporte al desarrollo, <strong>no se ofrecen reembolsos durante esta fase</strong>.
        </Typography>
      ),
    },
    {
      title: '3. Cancelaciones',
      content: (
        <Box>
          <Typography paragraph color="#666">
            La cancelación se gestiona a través de Paddle y surte efecto al final del ciclo 
            de facturación vigente. Podrás seguir usando el servicio hasta el final del período que ya pagaste.
          </Typography>
        </Box>
      ),
    },
    {
      title: '4. Consideraciones legales',
      content: (
        <Typography paragraph color="#666">
          Si la legislación aplicable requiere reembolsos en circunstancias específicas, 
          evaluaremos cada situación de manera individual a través de Paddle.
        </Typography>
      ),
    },
    {
      title: '5. Disputas de pago',
      content: (
        <Typography paragraph color="#666">
          Las disputas y contracargos se tramitan conforme a los procedimientos de Paddle 
          y de los emisores de pago correspondientes.
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
            Versión Alpha · Última actualización: 18 de octubre de 2025
          </Typography>
        </Box>

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
            Gracias por apoyar Pulse Journal
          </Typography>
          <Typography variant="body2" color="#666">
            Tu aporte como "Supporter" ayuda al desarrollo continuo del proyecto. 
            Reconoces que el servicio está en fase experimental y puede presentar inestabilidades.
          </Typography>
        </Box>

        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Typography variant="body2" color="#999">
            ¿Preguntas? Contáctanos en{' '}
            <a href="mailto:soporte@standatpd.com" style={{ color: '#3b82f6', textDecoration: 'none' }}>
              soporte@standatpd.com
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
            © {new Date().getFullYear()} Pulse Journal · Todos los derechos reservados
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}