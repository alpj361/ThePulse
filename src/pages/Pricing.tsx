import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
} from '@mui/material';
import { ArrowBack, CheckCircle } from '@mui/icons-material';
import Logo from '../components/common/Logo';

export default function Pricing() {
  const navigate = useNavigate();

  useEffect(() => {
    // Cargar el script de Buy Me a Coffee
    const script = document.createElement('script');
    script.src = 'https://cdnjs.buymeacoffee.com/1.0.0/button.prod.min.js';
    script.setAttribute('data-name', 'bmc-button');
    script.setAttribute('data-slug', 'pulsejornal');
    script.setAttribute('data-color', '#5F7FFF');
    script.setAttribute('data-emoji', '☕');
    script.setAttribute('data-font', 'Inter');
    script.setAttribute('data-text', 'Buy me a coffee');
    script.setAttribute('data-outline-color', '#000000');
    script.setAttribute('data-font-color', '#ffffff');
    script.setAttribute('data-coffee-color', '#FFDD00');
    script.async = true;
    
    document.body.appendChild(script);

    return () => {
      // Limpiar el script cuando el componente se desmonte
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

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
            Soporte Oficial
          </Typography>
          <Typography variant="body1" color="#666">
            Apoya el desarrollo de Pulse Journal
          </Typography>
        </Box>

        {/* Plan de Soporte */}
        <Card sx={{ mb: 6, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h4" fontWeight="700" color="#1a1a1a" gutterBottom>
                Plan Supporter
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 1, mb: 2 }}>
                <Typography variant="h3" component="span" fontWeight="700" color="#3b82f6">
                  $10
                </Typography>
                <Typography variant="h6" component="span" color="#666">
                  USD / mes
                </Typography>
              </Box>
              <Typography variant="body2" color="#999">
                También disponible en GTQ
              </Typography>
            </Box>

            <Box sx={{ bgcolor: '#f5f5f5', p: 3, borderRadius: 2, mb: 4 }}>
              <Typography variant="body1" color="#666" sx={{ mb: 2 }}>
                Tu apoyo nos ayuda a:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle sx={{ color: '#3b82f6', fontSize: 20 }} />
                  <Typography variant="body2" color="#666">Mantener la infraestructura</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle sx={{ color: '#3b82f6', fontSize: 20 }} />
                  <Typography variant="body2" color="#666">Desarrollar nuevas funcionalidades</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle sx={{ color: '#3b82f6', fontSize: 20 }} />
                  <Typography variant="body2" color="#666">Mejorar continuamente la plataforma</Typography>
                </Box>
              </Box>
            </Box>

            <Button
              variant="contained"
              size="large"
              fullWidth
              component="a"
              href="mailto:soporte@standatpd.com?subject=Suscripción Plan Supporter - Pulse Journal"
              sx={{
                py: 2,
                fontSize: '1rem',
                fontWeight: '600',
                borderRadius: 2,
                textTransform: 'none',
                bgcolor: '#3b82f6',
                color: '#fff',
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: '#2563eb',
                  boxShadow: 'none'
                }
              }}
            >
              Suscribirse como Supporter
            </Button>

            <Typography variant="caption" color="#999" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
              Procesamiento seguro mediante Paddle
            </Typography>
          </CardContent>
        </Card>

        {/* Apoyo Voluntario */}
        <Card sx={{ border: '1px solid #e0e0e0', boxShadow: 'none' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="h5" fontWeight="600" color="#1a1a1a" gutterBottom>
                Apoyo Voluntario
              </Typography>
              <Typography variant="body2" color="#666" sx={{ mb: 3 }}>
                ¿Quieres hacer una contribución única? Puedes apoyarnos con un café ☕
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <div id="bmc-button-container"></div>
            </Box>

            <Typography variant="caption" color="#999" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
              Cualquier monto ayuda a mantener Pulse Journal activo
            </Typography>
          </CardContent>
        </Card>

        {/* Nota */}
        <Box sx={{ mt: 6, p: 3, bgcolor: '#f5f5f5', borderRadius: 2, border: '1px solid #e0e0e0' }}>
          <Typography variant="body2" color="#666" textAlign="center">
            <strong>Nota:</strong> Todas las funcionalidades de Pulse Journal están disponibles sin costo. 
            El plan Supporter y las contribuciones son completamente opcionales y ayudan al desarrollo continuo.
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