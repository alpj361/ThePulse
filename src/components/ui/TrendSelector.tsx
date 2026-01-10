import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Chip, 
  CircularProgress, 
  Button, 
  Tabs, 
  Tab, 
  Card, 
  CardContent,
  Switch,
  FormControlLabel,
  Divider,
  Tooltip,
  IconButton
} from '@mui/material';
import { 
  SelectAll as SelectAllIcon,
  Clear as ClearIcon,
  TrendingUp as TrendingUpIcon,
  Twitter as TwitterIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { supabase } from '../../services/supabase';

interface TrendSelectorProps {
  selectedTrends: string[];
  onTrendChange: (trends: string[]) => void;
}

interface TrendItem {
  name?: string;
  query?: string;
  keyword?: string;
  count?: number;
}

interface TweetItem {
  id: string;
  texto: string;
  usuario: string;
  trend_clean: string;
  trend_original: string;
  likes: number;
  retweets: number;
  sentimiento: string;
  fecha_tweet: string;
}

// Using shared Supabase client from services/supabase.ts

const TrendSelector: React.FC<TrendSelectorProps> = ({ selectedTrends, onTrendChange }) => {
  const [tabValue, setTabValue] = useState(0);
  const [trends, setTrends] = useState<string[]>([]);
  const [tweets, setTweets] = useState<TweetItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAllTrends, setShowAllTrends] = useState<boolean>(false);
  const [showAllTweets, setShowAllTweets] = useState<boolean>(false);

  // Helper function to extract trend name for display
  const getTrendDisplayName = (trendValue: string): string => {
    // If it's in format "trend_UUID_TrendName", extract just the TrendName
    if (trendValue.startsWith('trend_')) {
      const parts = trendValue.split('_');
      if (parts.length >= 3) {
        return parts.slice(2).join('_'); // Everything after the second underscore
      }
    }
    return trendValue; // Return as-is if not in expected format
  };

  // Obtener tendencias de la tabla trends
  const fetchTrends = async () => {
    try {
      console.log('🔍 Obteniendo tendencias de Supabase...');
      const { data, error } = await supabase
        .from('trends')
        .select('id, top_keywords, word_cloud_data')
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching trends:', error);
        throw error;
      }

      // Extraer tendencias de top_keywords y word_cloud_data con formato que incluya ID
      let allTrends: string[] = [];
      
      if (data?.top_keywords) {
        const keywordTrends = data.top_keywords
          .map((item: TrendItem) => {
            const trendName = item.keyword || item.name || item.query || '';
            return trendName ? `trend_${data.id}_${trendName}` : '';
          })
          .filter(Boolean);
        allTrends = [...allTrends, ...keywordTrends];
      }

      if (data?.word_cloud_data) {
        const cloudTrends = data.word_cloud_data
          .map((item: any) => {
            const trendName = item.keyword || item.text || item.name || '';
            return trendName ? `trend_${data.id}_${trendName}` : '';
          })
          .filter(Boolean);
        allTrends = [...allTrends, ...cloudTrends];
      }

      // Filtrar únicos y ordenar por popularidad
      const uniqueTrends = Array.from(new Set(allTrends));
      console.log(`✅ ${uniqueTrends.length} tendencias únicas obtenidas con ID ${data.id}`);
      setTrends(uniqueTrends);
      
    } catch (error) {
      console.error('Error fetching trends:', error);
      setTrends([]);
    }
  };

  // Obtener tweets de tendencias (últimos 50)
  const fetchTrendingTweets = async () => {
    try {
      console.log('🐦 Obteniendo tweets de tendencias (últimos 50)...');
      const { data, error } = await supabase
        .from('trending_tweets')
        .select('id, texto, usuario, trend_clean, trend_original, likes, retweets, sentimiento, fecha_tweet')
        .order('fecha_captura', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching trending tweets:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} tweets de tendencias obtenidos`);
      setTweets(data || []);
      
    } catch (error) {
      console.error('Error fetching trending tweets:', error);
      setTweets([]);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchTrends(), fetchTrendingTweets()]);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const handleTrendToggle = (trend: string) => {
    if (selectedTrends.includes(trend)) {
      onTrendChange(selectedTrends.filter(t => t !== trend));
    } else {
      onTrendChange([...selectedTrends, trend]);
    }
  };

  const handleSelectAllTrends = () => {
    const trendsToShow = showAllTrends ? trends : trends.slice(0, 20);
    onTrendChange(trendsToShow);
  };

  const handleClearAll = () => {
    onTrendChange([]);
  };

  const handleSelectAllTweetTopics = () => {
    // Extraer todos los topics únicos de los tweets
    const tweetTopics = Array.from(new Set([
      ...tweets.map(t => t.trend_clean).filter(Boolean),
      ...tweets.map(t => t.trend_original).filter(Boolean)
    ]));
    onTrendChange([...selectedTrends, ...tweetTopics]);
  };

  const handleSelectAllTweets = () => {
    // Seleccionar todos los tweets individuales (por ID)
    const tweetIds = tweets.map(t => `tweet_${t.id}`);
    onTrendChange([...selectedTrends, ...tweetIds]);
  };

  const handleTweetToggle = (tweetId: string) => {
    const tweetIdKey = `tweet_${tweetId}`;
    if (selectedTrends.includes(tweetIdKey)) {
      onTrendChange(selectedTrends.filter(t => t !== tweetIdKey));
    } else {
      onTrendChange([...selectedTrends, tweetIdKey]);
    }
  };

  const isTweetSelected = (tweetId: string) => {
    return selectedTrends.includes(`tweet_${tweetId}`);
  };

  const renderTrendsTab = () => {
    const trendsToShow = showAllTrends ? trends : trends.slice(0, 20);
    
    return (
      <Box>
        {/* Controles */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<SelectAllIcon />}
              onClick={handleSelectAllTrends}
              sx={{ fontSize: '0.75rem' }}
            >
              Seleccionar todas ({trendsToShow.length})
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={handleClearAll}
              sx={{ fontSize: '0.75rem' }}
            >
              Limpiar
            </Button>
          </Box>
          
          <FormControlLabel
            control={
              <Switch
                checked={showAllTrends}
                onChange={(e) => setShowAllTrends(e.target.checked)}
                size="small"
              />
            }
            label={<Typography variant="caption">Mostrar todas ({trends.length})</Typography>}
          />
        </Box>

        {/* Lista de tendencias */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, maxHeight: '300px', overflowY: 'auto' }}>
          {trendsToShow.map((trend, index) => (
            <Chip
              key={`${trend}-${index}`}
              label={getTrendDisplayName(trend)}
              variant={selectedTrends.includes(trend) ? 'filled' : 'outlined'}
              color={selectedTrends.includes(trend) ? 'primary' : 'default'}
              onClick={() => handleTrendToggle(trend)}
              sx={{ 
                cursor: 'pointer',
                fontSize: '0.75rem',
                height: '28px'
              }}
            />
          ))}
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Tendencias extraídas de datos recientes • {selectedTrends.length} seleccionadas
        </Typography>
      </Box>
    );
  };

  const renderTweetsTab = () => {
    const tweetsToShow = showAllTweets ? tweets : tweets.slice(0, 20);
    
    // Extraer topics únicos de los tweets
    const tweetTopics = Array.from(new Set([
      ...tweetsToShow.map(t => t.trend_clean).filter(Boolean),
      ...tweetsToShow.map(t => t.trend_original).filter(Boolean)
    ]));

    return (
      <Box>
        {/* Controles */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<SelectAllIcon />}
              onClick={handleSelectAllTweetTopics}
              sx={{ fontSize: '0.75rem' }}
            >
              Seleccionar topics ({tweetTopics.length})
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<SelectAllIcon />}
              onClick={handleSelectAllTweets}
              sx={{ fontSize: '0.75rem' }}
            >
              Seleccionar tweets ({tweetsToShow.length})
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={handleClearAll}
              sx={{ fontSize: '0.75rem' }}
            >
              Limpiar
            </Button>
          </Box>
          
          <FormControlLabel
            control={
              <Switch
                checked={showAllTweets}
                onChange={(e) => setShowAllTweets(e.target.checked)}
                size="small"
              />
            }
            label={<Typography variant="caption">Mostrar todos ({tweets.length})</Typography>}
          />
        </Box>

        {/* Topics de tweets */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {tweetTopics.map((topic, index) => (
            <Chip
              key={`${topic}-${index}`}
              label={getTrendDisplayName(topic)}
              variant={selectedTrends.includes(topic) ? 'filled' : 'outlined'}
              color={selectedTrends.includes(topic) ? 'secondary' : 'default'}
              onClick={() => handleTrendToggle(topic)}
              sx={{ 
                cursor: 'pointer',
                fontSize: '0.75rem',
                height: '28px'
              }}
            />
          ))}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Preview de tweets */}
        <Box sx={{ maxHeight: '200px', overflowY: 'auto' }}>
          {tweetsToShow.slice(0, 5).map((tweet) => (
            <Card 
              key={tweet.id} 
              sx={{ 
                mb: 1, 
                bgcolor: isTweetSelected(tweet.id) ? 'primary.50' : 'grey.50',
                border: isTweetSelected(tweet.id) ? '2px solid' : '1px solid',
                borderColor: isTweetSelected(tweet.id) ? 'primary.main' : 'grey.300',
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: isTweetSelected(tweet.id) ? 'primary.100' : 'grey.100'
                }
              }}
              onClick={() => handleTweetToggle(tweet.id)}
            >
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="caption" color="primary" sx={{ fontWeight: 'bold' }}>
                    @{tweet.usuario} • {tweet.likes} likes • {tweet.retweets} RTs
                  </Typography>
                  {isTweetSelected(tweet.id) && (
                    <Chip 
                      label="Seleccionado" 
                      size="small" 
                      color="primary" 
                      sx={{ fontSize: '0.6rem', height: '20px' }}
                    />
                  )}
                </Box>
                <Typography variant="body2" sx={{ fontSize: '0.8rem', mt: 0.5 }}>
                  {tweet.texto.length > 100 ? `${tweet.texto.slice(0, 100)}...` : tweet.texto}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Topic: {tweet.trend_clean || tweet.trend_original} • {tweet.sentimiento}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Últimos {tweets.length} tweets de tendencias • Clic en tweets para seleccionar • {selectedTrends.filter(t => t.startsWith('tweet_')).length} tweets seleccionados
        </Typography>
      </Box>
    );
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Typography variant="h6">
          Configuración de Tendencias
        </Typography>
        <Tooltip title="Selecciona tendencias específicas o topics de tweets para análisis detallado">
          <IconButton size="small">
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress size={24} />
          <Typography variant="body2" sx={{ ml: 2 }}>
            Cargando datos de tendencias...
          </Typography>
        </Box>
      ) : (
        <>
          <Tabs 
            value={tabValue} 
            onChange={(_, newValue) => setTabValue(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
          >
            <Tab 
              icon={<TrendingUpIcon />} 
              label={`Tendencias (${trends.length})`}
              sx={{ fontSize: '0.8rem', minHeight: '40px' }}
            />
            <Tab 
              icon={<TwitterIcon />} 
              label={`Tweets (${tweets.length})`}
              sx={{ fontSize: '0.8rem', minHeight: '40px' }}
            />
          </Tabs>

          {tabValue === 0 && renderTrendsTab()}
          {tabValue === 1 && renderTweetsTab()}
        </>
      )}
    </Box>
  );
};

export default TrendSelector; 