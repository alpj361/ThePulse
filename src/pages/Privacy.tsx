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

export default function Privacy() {
  const navigate = useNavigate();

  const sections = [
    {
      title: '1. Sobre este proyecto',
      content: (
        <Box>
          <Typography paragraph color="#666">
            <strong>Proyecto:</strong> Stand At Platform Development<br />
            <strong>Contacto:</strong> soporte@standatpd.com<br />
            <strong>Ámbito:</strong> Centroamérica, con foco en Guatemala
          </Typography>
        </Box>
      ),
    },
    {
      title: '2. Datos que recopilamos',
      content: (
        <Box>
          <Typography paragraph color="#666">
            Recolectamos la información necesaria para brindarte el mejor servicio:
          </Typography>
          <Typography component="div" color="#666">
            <ul style={{ paddingLeft: '20px' }}>
              <li>Identificadores: nombre, correo, teléfono</li>
              <li>Datos de pago (gestionados por Paddle)</li>
              <li>Datos de uso y analíticas</li>
              <li>Contenido que gestionas en el servicio</li>
            </ul>
          </Typography>
        </Box>
      ),
    },
    {
      title: '3. Cómo recopilamos los datos',
      content: (
        <Typography component="div" color="#666">
          <ul style={{ paddingLeft: '20px' }}>
            <li>Aportados directamente por el usuario</li>
            <li>Cookies y tecnologías de análisis</li>
            <li>Integraciones de terceros</li>
          </ul>
        </Typography>
      ),
    },
    {
      title: '4. Finalidades del tratamiento',
      content: (
        <Typography component="div" color="#666">
          <ul style={{ paddingLeft: '20px' }}>
            <li>Gestión de cuenta y prestación del servicio</li>
            <li>Facturación y cobros mediante Paddle</li>
            <li>Analítica y mejora del producto</li>
          </ul>
        </Typography>
      ),
    },
    {
      title: '5. Terceros con los que compartimos datos',
      content: (
        <Box>
          <Typography paragraph color="#666">
            <strong>No vendemos ni alquilamos tu información personal.</strong>
          </Typography>
          <Typography component="div" color="#666">
            Solo compartimos datos con:
            <ul style={{ paddingLeft: '20px' }}>
              <li>Paddle: procesamiento de pagos</li>
              <li>Supabase: alojamiento y base de datos</li>
              <li>Proveedores de IA: OpenAI, Anthropic, DeepSeek</li>
            </ul>
          </Typography>
        </Box>
      ),
    },
    {
      title: '6. Retención y eliminación',
      content: (
        <Typography paragraph color="#666">
          Conservamos datos por hasta 2 meses después del cierre de la cuenta. 
          Atendemos solicitudes de eliminación en un plazo aproximado de 2 meses.
        </Typography>
      ),
    },
    {
      title: '7. Derechos de los usuarios',
      content: (
        <Typography paragraph color="#666">
          Tienes derecho a acceso, rectificación, eliminación, oposición y portabilidad. 
          Solicitudes: soporte@standatpd.com
        </Typography>
      ),
    },
    {
      title: '8. Seguridad',
      content: (
        <Typography paragraph color="#666">
          Aplicamos medidas técnicas y organizativas razonables, incluyendo cifrado en tránsito 
          y controles de acceso. Estamos mejorando continuamente nuestras prácticas de seguridad.
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
                <Typography variant="h5" fontWeight="700" color="#000">
                  pulse
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1.5 }}>
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
                '&:hover': { color: '#000', bgcolor: 'transparent' }
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
          <Typography variant="h3" fontWeight="700" color="#000" gutterBottom>
            Política de Privacidad
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
                expandIcon={<ExpandMore />}
                sx={{
                  px: 4,
                  py: 2,
                  '&:hover': { bgcolor: '#fafafa' }
                }}
              >
                <Typography variant="h6" fontWeight="600" color="#000">
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
            <a href="mailto:soporte@standatpd.com" style={{ color: '#000', textDecoration: 'none' }}>
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