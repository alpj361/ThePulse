import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import { ArrowBack, CheckCircle, Bolt } from '@mui/icons-material';
import Logo from '../components/common/Logo';

export default function Pricing() {
  const navigate = useNavigate();

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
            Planes y Créditos
          </Typography>
          <Typography variant="body1" color="#666">
            Elige el plan que mejor se adapte a tus necesidades
          </Typography>
        </Box>

        {/* Plan de Soporte con Créditos */}
        <Card sx={{ mb: 4, border: '2px solid #3b82f6', boxShadow: 'none', position: 'relative' }}>
          <Chip 
            label="Recomendado" 
            color="primary" 
            size="small"
            sx={{ 
              position: 'absolute', 
              top: 16, 
              right: 16,
              fontWeight: 600
            }} 
          />
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h4" fontWeight="700" color="#1a1a1a" gutterBottom>
                Plan Soporte
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

            <Box sx={{ bgcolor: '#f0f7ff', p: 3, borderRadius: 2, mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Bolt sx={{ color: '#3b82f6', fontSize: 24 }} />
                <Typography variant="h6" fontWeight="600" color="#1a1a1a">
                  Incluye 50 Créditos Mensuales
                </Typography>
              </Box>
              <Typography variant="body2" color="#666" sx={{ mb: 3 }}>
                Los créditos se utilizan para funcionalidades IA como análisis, transcripciones y generación de contenido.
              </Typography>
              
              <Typography variant="body2" color="#666" sx={{ mb: 2 }}>
                <strong>Además, tu apoyo nos ayuda a:</strong>
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
               disabled
               sx={{
                 py: 2,
                 fontSize: '1rem',
                 fontWeight: '600',
                 borderRadius: 2,
                 textTransform: 'none',
                 bgcolor: '#9ca3af',
                 color: '#fff',
                 boxShadow: 'none',
                 cursor: 'not-allowed',
                 '&:hover': {
                   bgcolor: '#9ca3af',
                   boxShadow: 'none'
                 }
               }}
             >
               Pronto Disponible
             </Button>

            <Typography variant="caption" color="#999" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
              Procesamiento seguro mediante Paddle
            </Typography>
          </CardContent>
        </Card>

        {/* Compra de Créditos Adicionales */}
        <Card sx={{ mb: 4, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h5" fontWeight="600" color="#1a1a1a" gutterBottom>
                Créditos Adicionales
              </Typography>
              <Typography variant="body2" color="#666">
                Compra créditos adicionales cuando los necesites
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Paquete 1 */}
              <Box sx={{ 
                p: 3, 
                border: '1px solid #e0e0e0', 
                borderRadius: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Box>
                  <Typography variant="h6" fontWeight="600" color="#1a1a1a">
                    50 Créditos
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h6" fontWeight="700" color="#3b82f6">
                    $10 USD
                  </Typography>
                  <Typography variant="caption" color="#999">
                    $0.20 por crédito
                  </Typography>
                </Box>
              </Box>

              {/* Paquete 2 */}
              <Box sx={{ 
                p: 3, 
                border: '2px solid #3b82f6', 
                borderRadius: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                bgcolor: '#f0f7ff'
              }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" fontWeight="600" color="#1a1a1a">
                      100 Créditos
                    </Typography>
                    <Chip label="Recomendado" size="small" color="primary" sx={{ fontSize: '0.7rem' }} />
                  </Box>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h6" fontWeight="700" color="#3b82f6">
                    $18 USD
                  </Typography>
                  <Typography variant="caption" color="#999">
                    $0.18 por crédito
                  </Typography>
                </Box>
              </Box>

              {/* Paquete 3 */}
              <Box sx={{ 
                p: 3, 
                border: '1px solid #e0e0e0', 
                borderRadius: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Box>
                  <Typography variant="h6" fontWeight="600" color="#1a1a1a">
                    200 Créditos
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h6" fontWeight="700" color="#3b82f6">
                    $35 USD
                  </Typography>
                  <Typography variant="caption" color="#999">
                    $0.175 por crédito
                  </Typography>
                </Box>
              </Box>

              {/* Paquete 4 */}
              <Box sx={{ 
                p: 3, 
                border: '1px solid #e0e0e0', 
                borderRadius: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Box>
                  <Typography variant="h6" fontWeight="600" color="#1a1a1a">
                    500 Créditos
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h6" fontWeight="700" color="#3b82f6">
                    $50 USD
                  </Typography>
                  <Typography variant="caption" color="#999">
                    $0.10 por crédito
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Button
              variant="outlined"
              size="large"
              fullWidth
              disabled
              sx={{
                mt: 3,
                py: 2,
                fontSize: '1rem',
                fontWeight: '600',
                borderRadius: 2,
                textTransform: 'none',
                borderColor: '#e0e0e0',
                color: '#9ca3af',
                cursor: 'not-allowed',
                '&:hover': {
                  borderColor: '#e0e0e0',
                  bgcolor: 'transparent'
                }
              }}
            >
              Pronto Disponible
            </Button>

            <Typography variant="caption" color="#999" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
              Los créditos no expiran y se acumulan
            </Typography>
          </CardContent>
        </Card>

        {/* Nota */}
        <Box sx={{ mt: 6, p: 3, bgcolor: '#f5f5f5', borderRadius: 2, border: '1px solid #e0e0e0' }}>
          <Typography variant="body2" color="#666" textAlign="center">
            <strong>Nota:</strong> Todas las funcionalidades básicas de ALAB están disponibles sin costo. 
            Los créditos solo se utilizan para funcionalidades avanzadas con IA.
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
