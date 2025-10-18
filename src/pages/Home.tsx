import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Container,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { ArrowForward } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { BackgroundPaths } from '@/components/ui/BackgroundPaths';
import Logo from '../components/common/Logo';
import { FeaturesSectionWithHoverEffects } from '../components/ui/feature-section-with-hover-effects';
import { Gallery4 } from '../components/ui/gallery4';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleStart = () => {
    navigate('/login');
  };

  return (
    <BackgroundPaths>
      <Box sx={{ minHeight: '100vh' }}>
        {/* Header */}
        <Box component="header" sx={{ py: 3, px: 4 }}>
          <Container maxWidth="xl">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Logo size={32} variant="icon" />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight="bold" color="text.primary">
                    pulse
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 2 }}>
                    JOURNAL
                  </Typography>
                </Box>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                style={{ display: 'flex', gap: 12 }}
              >
                <Button 
                  variant="text" 
                  size="small"
                  onClick={() => navigate('/pricing')}
                  sx={{ textTransform: 'none' }}
                >
                  Precios
                </Button>
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => navigate('/login')}
                  sx={{ textTransform: 'none' }}
                >
                  Iniciar Sesión
                </Button>
              </motion.div>
            </Box>
          </Container>
        </Box>

        {/* Hero Section */}
        <Box component="main" sx={{ py: { xs: 8, md: 12 } }}>
          <Container maxWidth="lg">
            <Box sx={{ textAlign: 'center', maxWidth: 900, mx: 'auto' }}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <Typography 
                  variant={isMobile ? "h2" : "h1"} 
                  fontWeight="bold" 
                  color="text.primary" 
                  sx={{ mb: 3, lineHeight: 1.2 }}
                >
                  Analiza tendencias.
                  <br />
                  <Box component="span" sx={{ color: 'primary.main' }}>
                    Organiza contenido.
                  </Box>
                  <br />
                  Descubre insights.
                </Typography>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <Typography 
                  variant={isMobile ? "body1" : "h6"} 
                  color="text.secondary" 
                  sx={{ mb: 2, maxWidth: 700, mx: 'auto', lineHeight: 1.6 }}
                >
                  La plataforma integral para periodistas y analistas que transforma datos en historias poderosas. 
                  Conecta tu Google Drive, analiza tendencias y gestiona tu contenido en un solo lugar.
                </Typography>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <Typography 
                  variant="body2" 
                  color="primary.main" 
                  fontWeight="medium" 
                  sx={{ mb: 8, fontStyle: 'italic' }}
                >
                  Know the pulse, shape the story.
                </Typography>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.1 }}
              >
                <FeaturesSectionWithHoverEffects />
              </motion.div>

              {/* GIF Gallery */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.2 }}
              >
                <Gallery4 />
              </motion.div>

              {/* CTA Section */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.3 }}
              >
                <Box 
                  sx={{ 
                    p: 4, 
                    maxWidth: 400, 
                    mx: 'auto',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 4,
                    boxShadow: theme.shadows[8]
                  }}
                >
                  <Button
                    component="a"
                    href="mailto:soporte@standatpd.com?subject=Solicitud de Invitación - Pulse Journal Alpha"
                    variant="contained"
                    size="large"
                    fullWidth
                    endIcon={<ArrowForward />}
                    sx={{
                      py: 2,
                      fontSize: '1.1rem',
                      fontWeight: 'semibold',
                      borderRadius: 3,
                      textTransform: 'none',
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: theme.shadows[12]
                      }
                    }}
                  >
                    Solicitar Invitación
                  </Button>

                  <Box sx={{ mt: 3, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, fontStyle: 'italic' }}>
                      📧 Acceso Alpha por invitación • Completamente gratuito
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      ¿Ya tienes una cuenta?{' '}
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => navigate('/login')}
                        sx={{ 
                          p: 0, 
                          minWidth: 'auto', 
                          fontWeight: 'medium',
                          textTransform: 'none'
                        }}
                      >
                        Inicia sesión aquí
                      </Button>
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => navigate('/terms')}
                        sx={{ 
                          fontSize: '0.75rem',
                          textDecoration: 'underline',
                          textTransform: 'none',
                          color: 'text.secondary'
                        }}
                      >
                        Términos y Condiciones
                      </Button>
                      <Typography variant="body2" color="text.disabled" sx={{ fontSize: '0.75rem' }}>
                        •
                      </Typography>
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => navigate('/refunds')}
                        sx={{ 
                          fontSize: '0.75rem',
                          textDecoration: 'underline',
                          textTransform: 'none',
                          color: 'text.secondary'
                        }}
                      >
                        Política de Reembolsos
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </motion.div>
            </Box>
          </Container>
        </Box>

        {/* Footer */}
        <Box 
          component="footer" 
          sx={{ 
            py: 6, 
            px: 4, 
            borderTop: 1, 
            borderColor: 'rgba(0, 0, 0, 0.05)',
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Container maxWidth="lg">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.5 }}
            >
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', md: 'row' },
                justifyContent: 'space-between', 
                alignItems: 'center',
                gap: 2
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Logo size={24} variant="icon" />
                  </Box>
                  <Typography variant="h6" fontWeight="bold" color="text.primary">
                    pulse
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 2 }}>
                    JOURNAL
                  </Typography>
                </Box>

                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 3,
                  flexWrap: 'wrap',
                  justifyContent: 'center'
                }}>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => navigate('/pricing')}
                    sx={{ 
                      textTransform: 'none',
                      color: 'text.secondary',
                      '&:hover': { color: 'text.primary' }
                    }}
                  >
                    Precios
                  </Button>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => navigate('/privacy')}
                    sx={{ 
                      textTransform: 'none',
                      color: 'text.secondary',
                      '&:hover': { color: 'text.primary' }
                    }}
                  >
                    Política de Privacidad
                  </Button>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => navigate('/terms')}
                    sx={{ 
                      textTransform: 'none',
                      color: 'text.secondary',
                      '&:hover': { color: 'text.primary' }
                    }}
                  >
                    Términos de Servicio
                  </Button>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => navigate('/refunds')}
                    sx={{ 
                      textTransform: 'none',
                      color: 'text.secondary',
                      '&:hover': { color: 'text.primary' }
                    }}
                  >
                    Reembolsos
                  </Button>
                  <Button
                    variant="text"
                    size="small"
                    component="a"
                    href="mailto:contacto@standatpd.com"
                    sx={{ 
                      textTransform: 'none',
                      color: 'text.secondary',
                      '&:hover': { color: 'text.primary' }
                    }}
                  >
                    contacto@standatpd.com
                  </Button>
                </Box>
              </Box>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.7 }}
            >
              <Box sx={{ 
                mt: 4, 
                pt: 4, 
                borderTop: 1, 
                borderColor: 'rgba(0, 0, 0, 0.05)',
                textAlign: 'center'
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', md: 'row' },
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: { xs: 1, md: 2 }
                }}>
                  <Typography variant="body2" color="text.secondary">
                    © {new Date().getFullYear()} Pulse Journal. Todos los derechos reservados.
                  </Typography>
                  <Typography variant="body2" color="text.disabled" sx={{ display: { xs: 'none', md: 'block' } }}>
                    •
                  </Typography>
                  <Typography variant="body2" fontWeight="medium" color="text.secondary">
                    standatpd
                  </Typography>
                </Box>
              </Box>
            </motion.div>
          </Container>
        </Box>
      </Box>
    </BackgroundPaths>
  );
};

export default Home; 