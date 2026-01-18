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

export default function Terms() {
  const navigate = useNavigate();

  const sections = [
    {
      title: '1. Sobre el proyecto',
      content: (
        <Box>
          <Typography paragraph color="#666">
            <strong>Proyecto:</strong> Stand At Platform Development<br />
            <strong>Ubicación:</strong> Guatemala<br />
            <strong>Contacto:</strong> soporte@standatpd.com
          </Typography>
        </Box>
      ),
    },
    {
      title: '2. Descripción del servicio',
      content: (
        <Typography paragraph color="#666">
          ALAB es un servicio agéntico para investigación, organización y gestión de datos 
          orientado a periodistas y otras personas profesionales, impulsado por IA con capacidades 
          para extraer, automatizar y visualizar información.
        </Typography>
      ),
    },
    {
      title: '3. Acceso Alpha por invitación',
      content: (
        <Box>
          <Typography paragraph color="#666">
            La plataforma se encuentra en <strong>fase de desarrollo (Alpha)</strong>. 
            Acceso restringido mediante códigos de invitación. Las funcionalidades pueden 
            cambiar sin previo aviso. No se garantiza disponibilidad ni continuidad del servicio.
          </Typography>
        </Box>
      ),
    },
    {
      title: '4. Cuentas y requisitos',
      content: (
        <Typography paragraph color="#666">
          Para crear una cuenta se solicita: nombre completo, correo electrónico y número de teléfono. 
          La persona usuaria es responsable de mantener la confidencialidad de sus credenciales.
        </Typography>
      ),
    },
    {
      title: '5. Uso aceptable',
      content: (
        <Typography paragraph color="#666">
          Queda prohibido utilizar el servicio para contenidos o actividades ilegales, 
          acoso, spam o abuso de la plataforma. Nos reservamos el derecho de suspender 
          o terminar cuentas ante incumplimientos.
        </Typography>
      ),
    },
    {
      title: '6. Propiedad de contenidos',
      content: (
        <Typography paragraph color="#666">
          La propiedad de la información creada o almacenada en ALAB corresponde 
          a la persona usuaria que la generó.
        </Typography>
      ),
    },
    {
      title: '7. Planes y pagos',
      content: (
        <Box>
          <Typography paragraph color="#666">
            Procesamiento de pagos mediante Paddle (Merchant of Record).<br />
            <strong>Plan Alpha "Supporter":</strong> USD $10 mensuales<br />
            <strong>Métodos de pago:</strong> tarjeta de crédito y PayPal<br />
            Renovación automática mensual hasta que se cancele.
          </Typography>
        </Box>
      ),
    },
    {
      title: '8. Limitación de responsabilidad',
      content: (
        <Typography paragraph color="#666">
          El servicio se ofrece en su estado actual con limitaciones inherentes. 
          Stand At Platform Development no será responsable por daños indirectos, 
          incidentales o pérdida de datos derivados del uso del servicio.
        </Typography>
      ),
    },
    {
      title: '9. Ley aplicable',
      content: (
        <Typography paragraph color="#666">
          Estos Términos se rigen por las leyes de Guatemala. Priorizamos el diálogo directo 
          para resolver cualquier problema. Contacto: soporte@standatpd.com
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
            Términos y Condiciones
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
            © {new Date().getFullYear()} ALAB · Todos los derechos reservados
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}