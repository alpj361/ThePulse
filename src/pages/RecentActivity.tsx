import React, { useEffect, useState, useContext } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { LanguageContext } from '../context/LanguageContext';
import ActivityCard from '../components/ui/ActivityCard';
import DocumentGeneratorCard from '../components/ui/DocumentGeneratorCard';
import RecentScrapesSection from '../components/ui/RecentScrapesSection';
import { 
  Grid, 
  Box, 
  Typography, 
  CircularProgress, 
  Button, 
  Chip,
  Paper, 
  Container,
  Link,
  useTheme,
  alpha,
  Divider
} from '@mui/material';
import { 
  WhatsApp as WhatsAppIcon,
  Timeline as TimelineIcon,
  History as HistoryIcon,
  Tag as TagIcon,
  Person as PersonIcon,
  Newspaper as NewspaperIcon,
  TrendingUp as TrendingUpIcon,
  DataUsage as DataUsageIcon
} from '@mui/icons-material';

const translations = {
  es: {
    title: 'Actividad Reciente',
    scrapesTitle: 'Scrapes Recientes con Vizta Chat',
    loading: 'Cargando actividad...',
    noActivity: 'No tienes actividad reciente.',
    whatsappBot: 'WhatsApp Bot',
    chatWithBot: 'Chatea',
    yourNumber: 'Tu número:',
    error: 'No se pudo cargar tu actividad reciente.',
    presentations: 'Presentaciones',
    comparisons: 'Comparativas',
    comingSoon: 'Próximamente',
    statistics: 'Estadísticas de Extracción',
    hashtags: 'Hashtags',
    users: 'Usuarios',
    profiles: 'Perfiles',
    news: 'Noticias',
    commonThemes: 'Temas Comunes',
    noThemes: 'No hay temas comunes aún',
    legacyActivity: 'Actividad Anterior (WhatsApp)',
    viztaChatActivity: 'Actividad de Vizta Chat',
    pageDescription: 'Aquí puedes ver tu actividad reciente con Vizta Chat.'
  },
  en: {
    title: 'Recent Activity',
    scrapesTitle: 'Recent Scrapes with Vizta Chat',
    loading: 'Loading activity...',
    noActivity: 'You have no recent activity.',
    whatsappBot: 'WhatsApp Bot',
    chatWithBot: 'Chat',
    yourNumber: 'Your number:',
    error: 'Could not load your recent activity.',
    presentations: 'Presentations',
    comparisons: 'Comparisons',
    comingSoon: 'Coming Soon',
    statistics: 'Extraction Statistics',
    hashtags: 'Hashtags',
    users: 'Users',
    profiles: 'Profiles',
    news: 'News',
    commonThemes: 'Common Themes',
    noThemes: 'No common themes yet',
    legacyActivity: 'Legacy Activity (WhatsApp)',
    viztaChatActivity: 'Vizta Chat Activity',
    pageDescription: 'Here you can see your recent activity with Vizta Chat.'
  },
};

const WHATSAPP_BOT_NUMBER = '50252725024';

interface Activity {
  id: string;
  created_at: string;
  type: 'Hashtag' | 'Usuario' | 'Perfil' | 'News' | 'General';
  value: string;
  sentimiento: 'positivo' | 'negativo' | 'neutral';
  herramienta?: string;
  categoria?: string;
  tweet_count?: number;
  smart_grouping?: string;
  profile?: string;
  contexto_perfil?: string;
}

interface ThemeCount {
  theme: string;
  count: number;
}

export default function RecentActivity() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { language } = useContext(LanguageContext);
  const t = translations[language];
  const theme = useTheme();

  // Calculate statistics from activities
  const getStatistics = () => {
    const hashtagCount = activities.filter(a => a.type === 'Hashtag').length;
    const userCount = activities.filter(a => a.type === 'Usuario').length;
    const profileCount = activities.filter(a => a.type === 'Perfil').length;
    const newsCount = activities.filter(a => a.type === 'News').length;
    
    // Extract common themes (based on queries and categories)
    const valueFrequency: Record<string, number> = {};
    activities.forEach(activity => {
      // Use categoria if available, otherwise use query
      let theme = activity.categoria || activity.value || '';
      
      // Clean hashtag symbols and @ symbols
      theme = theme.replace(/^[#@]/, '').toLowerCase();
      
      // Skip empty themes
      if (!theme.trim()) return;
      
      if (valueFrequency[theme]) {
        valueFrequency[theme]++;
      } else {
        valueFrequency[theme] = 1;
      }
      
      // Also add smart_grouping if available
      if (activity.smart_grouping) {
        const grouping = activity.smart_grouping.toLowerCase();
        if (valueFrequency[grouping]) {
          valueFrequency[grouping]++;
        } else {
          valueFrequency[grouping] = 1;
        }
      }
    });
    
    // Sort by frequency and get top 5
    const commonThemes: ThemeCount[] = Object.entries(valueFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([theme, count]) => ({ 
        theme, 
        count 
      }));
    
    return {
      hashtagCount,
      userCount,
      profileCount,
      newsCount,
      commonThemes
    };
  };

  useEffect(() => {
    const fetchRecentActivity = async () => {
      if (!user) return;
      setLoading(true);
      setError('');
      // Ya no necesitamos el número de teléfono para recent_scrapes
      console.log('🔍 DEBUG: User ID:', user.id);
      
      // Obtener la actividad reciente desde recent_scrapes
      const { data, error: activityError } = await supabase
        .from('recent_scrapes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      console.log('📊 DEBUG: Recent scrapes data:', data);
      console.log('❌ DEBUG: Activity error:', activityError);
      
      if (activityError) {
        setError(t.error);
      } else {
        // Process the data from recent_scrapes table
        const processedActivities = (data || []).map((scrape: any) => {
          console.log('🔍 DEBUG: Processing recent scrape:', scrape.id, scrape.herramienta, scrape.query_original);
          
          // Determine type based on herramienta and query
          let processedType: 'Hashtag' | 'Usuario' | 'Perfil' | 'News' | 'General' = 'General';
          let processedSentimiento: 'positivo' | 'negativo' | 'neutral' = 'neutral';
          
          // Map herramienta to type
          if (scrape.herramienta === 'nitter_profile') {
            processedType = 'Perfil';
          } else if (scrape.herramienta === 'nitter_context' || scrape.query_original?.includes('#')) {
            processedType = 'Hashtag';
          } else if (scrape.query_original?.includes('@')) {
            processedType = 'Usuario';
          } else if (scrape.herramienta === 'news_search') {
            processedType = 'News';
          }
          
          // Try to get sentiment from nitter_context if available
          if (scrape.nitter_context) {
            try {
              const contextData = typeof scrape.nitter_context === 'string' 
                ? JSON.parse(scrape.nitter_context) 
                : scrape.nitter_context;
              
              if (contextData.meta && contextData.meta.sentiment_summary) {
                const sentiment = contextData.meta.sentiment_summary;
                if (sentiment.positivo > sentiment.negativo && sentiment.positivo > sentiment.neutral) {
                  processedSentimiento = 'positivo';
                } else if (sentiment.negativo > sentiment.positivo && sentiment.negativo > sentiment.neutral) {
                  processedSentimiento = 'negativo';
                } else {
                  processedSentimiento = 'neutral';
                }
              }
            } catch (e) {
              console.log('❌ DEBUG: Error parsing nitter_context:', e);
            }
          }
          
          const processed = {
            id: scrape.id,
            created_at: scrape.created_at,
            type: processedType,
            value: scrape.query_original || scrape.query_clean || scrape.profile || '',
            sentimiento: processedSentimiento,
            herramienta: scrape.herramienta,
            categoria: scrape.categoria,
            tweet_count: scrape.tweet_count,
            smart_grouping: scrape.smart_grouping,
            profile: scrape.profile,
            contexto_perfil: scrape.contexto_perfil
          };
          
          console.log('✅ DEBUG: Processed result:', processed.id, processed.type, processed.sentimiento);
          return processed;
        });
        
        console.log('📊 DEBUG: Final processed activities:', processedActivities.length);
        setActivities(processedActivities);
      }
      setLoading(false);
    };
    fetchRecentActivity();
  }, [user, t.error]);

  const statistics = getStatistics();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Recent Tweets Extraction Section */}
      <RecentScrapesSection />

      <Box mt={6}>
        <DocumentGeneratorCard 
          onDocumentGenerated={(document) => {
            // Opcional: hacer algo cuando se genera un documento
            console.log('Documento generado:', document);
          }}
        />
      </Box>

      {/* WhatsApp Bot Section - ELIMINADO */}
      {/*
      <Paper ...>
        ...
      </Paper>
      */}

      {/* Opciones futuras - ELIMINADO */}
      {/* ... */}
    </Container>
  );
}