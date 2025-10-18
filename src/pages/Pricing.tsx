import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Card,
  CardContent,
  Alert
} from '@mui/material';
import {
  Check as CheckIcon,
  Star as StarIcon,
  CreditCard as CreditCardIcon,
  Security as SecurityIcon,
  Info as InfoIcon
} from '@mui/icons-material';

export default function Pricing() {
  const navigate = useNavigate();

  const features = [
    'Apoyas el desarrollo continuo del proyecto',
    'Ayudas a mantener la infraestructura',
    'Contribuyes a nuevas funcionalidades',
    'Impulsar mejoras en la plataforma',
    'Fomentar la innovación en periodismo digital',
    'Apoyar el equipo de desarrollo',
    'Ser parte de la comunidad Alpha',
    'Reconocimiento como Supporter en la plataforma'
  ];

  const platformFeatures = [
    'Acceso completo a Vista de Tendencias',
    'Análisis de contenidos de X (Twitter)',
    'Gestión ilimitada de proyectos',
    'Captura inteligente de datos',
    'Tablas con exportación CSV',
    'Vizta: agente investigativo con IA',
    'Vizta App para marcadores de Instagram y X',
    'Análisis y visualización de datos',
    'Integración con Google Drive',
    'Soporte por correo electrónico',
    'Acceso a nuevas funcionalidades Beta'
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography
          variant="h2"
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
          Plan Alpha Supporter
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
          Únete al desarrollo de Pulse Journal
        </Typography>
        <Chip 
          label="Fase Alpha - Acceso Anticipado" 
          color="warning" 
          icon={<StarIcon />}
          sx={{ fontSize: '1rem', py: 3 }}
        />
      </Box>

      {/* Alert de fase Alpha */}
      <Alert severity="warning" icon={<InfoIcon />} sx={{ mb: 4 }}>
        <Typography variant="body1" fontWeight="bold">
          ⚠️ Acceso Alpha por Invitación
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          El acceso a Pulse Journal está <strong>limitado por invitación</strong>. 
          El plan Supporter es <strong>completamente opcional</strong> y está diseñado únicamente para quienes deseen apoyar económicamente el desarrollo del proyecto.
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          <strong>Todas las funcionalidades están disponibles para usuarios invitados sin costo.</strong> El plan Supporter es una forma de contribuir al crecimiento de la plataforma.
        </Typography>
      </Alert>

      {/* Plan Card */}
      <Card 
        elevation={8}
        sx={{ 
          maxWidth: 800, 
          mx: 'auto',
          borderRadius: 4,
          overflow: 'visible',
          position: 'relative',
          border: '2px solid',
          borderColor: 'primary.main',
          boxShadow: '0 8px 32px rgba(59, 130, 246, 0.2)'
        }}
      >
        {/* Badge */}
        <Box
          sx={{
            position: 'absolute',
            top: -20,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1
          }}
        >
          <Chip
            label="PLAN RECOMENDADO"
            color="primary"
            sx={{
              fontWeight: 'bold',
              px: 3,
              py: 2.5,
              fontSize: '0.9rem',
              boxShadow: 3
            }}
          />
        </Box>

        <CardContent sx={{ p: 5, pt: 6 }}>
          {/* Plan Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h3" component="h2" fontWeight="bold" gutterBottom>
              Supporter
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
              Plan opcional de apoyo al proyecto
            </Typography>
            <Alert severity="info" sx={{ mb: 2, textAlign: 'left' }}>
              <Typography variant="body2">
                <strong>Nota importante:</strong> Este plan es 100% voluntario. El acceso a Pulse Journal es por invitación 
                y todas las funcionalidades están disponibles sin costo para usuarios invitados.
              </Typography>
            </Alert>

            {/* Pricing */}
            <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 1 }}>
              <Typography variant="h2" component="span" fontWeight="bold" color="primary.main">
                $10
              </Typography>
              <Typography variant="h5" component="span" color="text.secondary">
                USD
              </Typography>
              <Typography variant="h6" component="span" color="text.secondary">
                / mes
              </Typography>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              También disponible en GTQ
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Features */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
              💚 Con tu apoyo voluntario:
            </Typography>
            <List>
              {features.map((feature, index) => (
                <ListItem key={index} sx={{ py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CheckIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={feature}
                    primaryTypographyProps={{
                      fontSize: '1rem',
                      color: 'text.primary'
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>

          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              ✅ Funcionalidades de la plataforma (disponibles para todos los usuarios invitados sin costo):
            </Typography>
            <List dense>
              {platformFeatures.map((feature, index) => (
                <ListItem key={index} sx={{ py: 0.5, pl: 2 }}>
                  <ListItemText 
                    primary={`• ${feature}`}
                    primaryTypographyProps={{
                      fontSize: '0.9rem',
                      color: 'text.primary'
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Alert>

          <Divider sx={{ my: 3 }} />

          {/* CTA Button */}
          <Button
            variant="contained"
            size="large"
            fullWidth
            component="a"
            href="mailto:soporte@standatpd.com?subject=Solicitud de Invitación - Pulse Journal Alpha"
            sx={{
              py: 2,
              fontSize: '1.1rem',
              fontWeight: 'bold',
              borderRadius: 2,
              textTransform: 'none',
              boxShadow: 4,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 6
              },
              transition: 'all 0.2s'
            }}
          >
            Solicitar Invitación
          </Button>

          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
            El acceso es por invitación. Una vez invitado, puedes elegir convertirte en Supporter de forma opcional.
          </Typography>
          
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1, fontSize: '0.85rem' }}>
            Los Supporters pueden cancelar en cualquier momento desde su panel de control.
          </Typography>
        </CardContent>
      </Card>

      {/* Payment Info */}
      <Paper elevation={2} sx={{ p: 4, mt: 6, maxWidth: 800, mx: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <CreditCardIcon sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h5" fontWeight="bold">
            💳 Información de Pago
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" paragraph>
            <strong>Procesamiento seguro con Paddle</strong>
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <CheckIcon fontSize="small" color="success" />
              </ListItemIcon>
              <ListItemText primary="Merchant of Record: Paddle (Vendedor ID: 243336)" />
            </ListItem>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <CheckIcon fontSize="small" color="success" />
              </ListItemIcon>
              <ListItemText primary="Métodos de pago: Tarjeta de crédito y PayPal" />
            </ListItem>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <CheckIcon fontSize="small" color="success" />
              </ListItemIcon>
              <ListItemText primary="Monedas aceptadas: USD y GTQ" />
            </ListItem>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <CheckIcon fontSize="small" color="success" />
              </ListItemIcon>
              <ListItemText primary="Facturación mensual con renovación automática" />
            </ListItem>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <CheckIcon fontSize="small" color="success" />
              </ListItemIcon>
              <ListItemText primary="Cumplimiento PCI DSS para máxima seguridad" />
            </ListItem>
          </List>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <SecurityIcon sx={{ mr: 2, color: 'success.main' }} />
          <Typography variant="body1" fontWeight="medium">
            Cancelación y Reembolsos
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" paragraph>
          Puedes cancelar tu suscripción en cualquier momento. La cancelación surte efecto al final del período de facturación.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Debido a la naturaleza experimental del proyecto Alpha, no se ofrecen reembolsos durante esta fase. 
          Consulta nuestra{' '}
          <Button
            variant="text"
            size="small"
            onClick={() => navigate('/refunds')}
            sx={{ 
              p: 0,
              minWidth: 'auto',
              textDecoration: 'underline',
              textTransform: 'none',
              verticalAlign: 'baseline'
            }}
          >
            Política de Reembolsos
          </Button>
          {' '}para más detalles.
        </Typography>
      </Paper>

      {/* FAQ Section */}
      <Paper elevation={2} sx={{ p: 4, mt: 4, maxWidth: 800, mx: 'auto' }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          ❓ Preguntas Frecuentes
        </Typography>
        
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            ¿Cómo funciona el acceso por invitación?
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            El acceso a Pulse Journal está limitado a usuarios invitados durante la fase Alpha. 
            Para solicitar una invitación, contáctanos en{' '}
            <Button
              variant="text"
              size="small"
              component="a"
              href="mailto:soporte@standatpd.com"
              sx={{ 
                p: 0,
                minWidth: 'auto',
                textDecoration: 'underline',
                textTransform: 'none',
                verticalAlign: 'baseline'
              }}
            >
              soporte@standatpd.com
            </Button>
            . Una vez aprobada tu solicitud, recibirás acceso completo a la plataforma sin costo.
          </Typography>

          <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mt: 3 }}>
            ¿Es obligatorio pagar para usar Pulse Journal?
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            <strong>No.</strong> Todas las funcionalidades de Pulse Journal están disponibles <strong>sin costo</strong> para usuarios invitados. 
            El plan Supporter de $10 USD/mes es <strong>completamente opcional</strong> y está diseñado únicamente para quienes deseen 
            apoyar económicamente el desarrollo del proyecto.
          </Typography>

          <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mt: 3 }}>
            ¿Qué obtengo como Supporter?
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Como Supporter, contribuyes directamente al desarrollo y mantenimiento de la plataforma. No hay funcionalidades exclusivas, 
            pero tu apoyo nos permite seguir innovando y mejorando el servicio para todos. Además, recibes reconocimiento como Supporter 
            dentro de la plataforma y el agradecimiento de toda la comunidad.
          </Typography>

          <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mt: 3 }}>
            ¿Qué significa "Fase Alpha"?
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Significa que la plataforma está en desarrollo activo. Las funcionalidades pueden cambiar y mejorar continuamente. 
            Tu feedback como usuario Alpha es invaluable para nosotros y ayuda a dar forma al futuro de la plataforma.
          </Typography>

          <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mt: 3 }}>
            ¿Puedo cancelar mi plan Supporter en cualquier momento?
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Sí, puedes cancelar en cualquier momento desde tu panel de control. La cancelación surte efecto al final del período de facturación. 
            Si cancelas, seguirás teniendo acceso completo a la plataforma como usuario invitado.
          </Typography>
        </Box>
      </Paper>

      {/* Contact Section */}
      <Paper elevation={2} sx={{ p: 4, mt: 4, textAlign: 'center', maxWidth: 800, mx: 'auto' }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          ¿Tienes preguntas?
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Estamos aquí para ayudarte
        </Typography>
        <Button
          variant="outlined"
          size="large"
          component="a"
          href="mailto:soporte@standatpd.com"
          sx={{ 
            textTransform: 'none',
            px: 4
          }}
        >
          Contactar Soporte
        </Button>
      </Paper>

      {/* Links Section */}
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="text"
            size="small"
            onClick={() => navigate('/terms')}
            sx={{ textTransform: 'none', textDecoration: 'underline' }}
          >
            Términos y Condiciones
          </Button>
          <Typography variant="body2" color="text.disabled">•</Typography>
          <Button
            variant="text"
            size="small"
            onClick={() => navigate('/privacy')}
            sx={{ textTransform: 'none', textDecoration: 'underline' }}
          >
            Política de Privacidad
          </Button>
          <Typography variant="body2" color="text.disabled">•</Typography>
          <Button
            variant="text"
            size="small"
            onClick={() => navigate('/refunds')}
            sx={{ textTransform: 'none', textDecoration: 'underline' }}
          >
            Política de Reembolsos
          </Button>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          © 2025 Stand At Platform Development - Pulse Journal
        </Typography>
      </Box>
    </Container>
  );
}

