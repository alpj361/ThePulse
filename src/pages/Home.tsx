import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Container,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import { ArrowForward, TrendingUp, FolderOpen, MenuBook, Satellite, BarChart } from '@mui/icons-material';
import { motion } from 'framer-motion';
import Logo from '../components/common/Logo';

// Importar GIFs
import sondeosGif from '../assets/gifs/Sondeos.gif';
import projectsGif from '../assets/gifs/Projects.gif';
import trendsGif from '../assets/gifs/Trends.gif';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const features = [
    {
      icon: <TrendingUp sx={{ fontSize: 40 }} />,
      title: 'Monitoreo de Tendencias',
      description: 'Detecta temas en auge y analiza coyunturas relevantes en tiempo real.',
    },
    {
      icon: <FolderOpen sx={{ fontSize: 40 }} />,
      title: 'Gestión de Proyectos',
      description: 'Organiza investigaciones con metodología de capas y seguimiento detallado.',
    },
    {
      icon: <MenuBook sx={{ fontSize: 40 }} />,
      title: 'Códex y Librería',
      description: 'Base de conocimiento con recursos, referencias y conceptos clave.',
    },
    {
      icon: <Satellite sx={{ fontSize: 40 }} />,
      title: 'Monitoreo de Medios',
      description: 'Rastrea contenido de X (Twitter) para análisis político, deportivo y más.',
    },
    {
      icon: <BarChart sx={{ fontSize: 40 }} />,
      title: 'Sondeos y Análisis',
      description: 'Análisis inteligente con múltiples fuentes para interpretación de datos.',
    },
  ];

  const showcaseItems = [
    {
      title: 'Sondeos Inteligentes',
      description: 'Análisis detallado de datos con IA',
      image: sondeosGif,
      href: '/sondeos',
    },
    {
      title: 'Gestión de Proyectos',
      description: 'Metodología de capas para organizar investigaciones',
      image: projectsGif,
      href: '/projects',
    },
    {
      title: 'Monitoreo de Tendencias',
      description: 'Detecta tendencias emergentes en tiempo real',
      image: trendsGif,
      href: '/dashboard',
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
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                variant="text" 
                size="small"
                onClick={() => navigate('/pricing')}
                sx={{ 
                  textTransform: 'none',
                  color: '#666',
                  '&:hover': { color: '#000' }
                }}
              >
                Precios
              </Button>
              <Button 
                variant="outlined"
                size="small"
                onClick={() => navigate('/login')}
                sx={{ 
                  textTransform: 'none',
                  borderColor: '#000',
                  color: '#000',
                  '&:hover': {
                    borderColor: '#000',
                    bgcolor: '#000',
                    color: '#fff'
                  }
                }}
              >
                Iniciar Sesión
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box component="main" sx={{ py: { xs: 8, md: 12 }, bgcolor: 'white' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', maxWidth: 800, mx: 'auto' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Typography 
                variant={isMobile ? "h3" : "h2"} 
                fontWeight="700" 
                color="#000" 
                sx={{ mb: 3, lineHeight: 1.2 }}
              >
                La plataforma integral para periodistas y analistas
              </Typography>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Typography 
                variant={isMobile ? "body1" : "h6"} 
                color="#666" 
                sx={{ mb: 6, maxWidth: 600, mx: 'auto', lineHeight: 1.6, fontWeight: 400 }}
              >
                Conecta tu Google Drive, analiza tendencias y gestiona tu contenido en un solo lugar.
              </Typography>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Button
                component="a"
                href="mailto:soporte@standatpd.com?subject=Solicitud de Invitación - Pulse Journal Alpha"
                variant="contained"
                size="large"
                endIcon={<ArrowForward />}
                sx={{
                  py: 2,
                  px: 4,
                  fontSize: '1rem',
                  fontWeight: '600',
                  borderRadius: 2,
                  textTransform: 'none',
                  bgcolor: '#000',
                  color: '#fff',
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: '#333',
                    boxShadow: 'none'
                  }
                }}
              >
                Solicitar Invitación
              </Button>
              <Typography variant="caption" color="#999" sx={{ display: 'block', mt: 2 }}>
                Acceso Alpha por invitación • Completamente gratuito
              </Typography>
            </motion.div>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: '#fafafa' }}>
        <Container maxWidth="lg">
          <Typography 
            variant="h4" 
            fontWeight="700" 
            textAlign="center" 
            color="#000" 
            sx={{ mb: 6 }}
          >
            Características
          </Typography>
          
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Box sx={{ textAlign: 'center' }}>
                    <Box sx={{ color: '#000', mb: 2 }}>
                      {feature.icon}
                    </Box>
                    <Typography variant="h6" fontWeight="600" color="#000" sx={{ mb: 1 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="#666" sx={{ lineHeight: 1.6 }}>
                      {feature.description}
                    </Typography>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Showcase Section */}
      <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: 'white' }}>
        <Container maxWidth="lg">
          <Typography 
            variant="h4" 
            fontWeight="700" 
            textAlign="center" 
            color="#000" 
            sx={{ mb: 2 }}
          >
            Funcionalidades en acción
          </Typography>
          <Typography 
            variant="body1" 
            textAlign="center" 
            color="#666" 
            sx={{ mb: 8, maxWidth: 700, mx: 'auto' }}
          >
            Descubre cómo Pulse Journal transforma el análisis de datos y la gestión de información.
          </Typography>

          <Grid container spacing={6}>
            {showcaseItems.map((item, index) => (
              <Grid item xs={12} md={4} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      boxShadow: 'none',
                      border: '1px solid #e0e0e0',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
                      }
                    }}
                    onClick={() => navigate(item.href)}
                  >
                    <Box sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                      <img
                        src={item.image}
                        alt={item.title}
                        style={{ 
                          width: '100%', 
                          height: '200px', 
                          objectFit: 'cover',
                          borderRadius: '4px'
                        }}
                      />
                    </Box>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" fontWeight="600" color="#000" sx={{ mb: 1 }}>
                        {item.title}
                      </Typography>
                      <Typography variant="body2" color="#666">
                        {item.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <Box 
        component="footer" 
        sx={{ 
          py: 6, 
          px: 4, 
          bgcolor: 'white',
          borderTop: '1px solid #e0e0e0'
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between', 
            alignItems: { xs: 'center', md: 'flex-start' },
            gap: 4,
            mb: 4
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Logo size={24} variant="icon" />
              <Box>
                <Typography variant="h6" fontWeight="700" color="#000">
                  pulse
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1.5 }}>
                  JOURNAL
                </Typography>
              </Box>
            </Box>

            <Box sx={{ 
              display: 'flex', 
              gap: 4,
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}>
              <Button
                variant="text"
                size="small"
                onClick={() => navigate('/pricing')}
                sx={{ 
                  textTransform: 'none',
                  color: '#666',
                  '&:hover': { color: '#000', bgcolor: 'transparent' }
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
                  color: '#666',
                  '&:hover': { color: '#000', bgcolor: 'transparent' }
                }}
              >
                Privacidad
              </Button>
              <Button
                variant="text"
                size="small"
                onClick={() => navigate('/terms')}
                sx={{ 
                  textTransform: 'none',
                  color: '#666',
                  '&:hover': { color: '#000', bgcolor: 'transparent' }
                }}
              >
                Términos
              </Button>
              <Button
                variant="text"
                size="small"
                onClick={() => navigate('/refunds')}
                sx={{ 
                  textTransform: 'none',
                  color: '#666',
                  '&:hover': { color: '#000', bgcolor: 'transparent' }
                }}
              >
                Reembolsos
              </Button>
            </Box>
          </Box>

          <Box sx={{ 
            pt: 4, 
            borderTop: '1px solid #e0e0e0',
            textAlign: 'center'
          }}>
            <Typography variant="body2" color="#999">
              © {new Date().getFullYear()} Pulse Journal · standatpd · Todos los derechos reservados
            </Typography>
            <Typography variant="caption" color="#ccc" sx={{ display: 'block', mt: 1 }}>
              contacto@standatpd.com
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;