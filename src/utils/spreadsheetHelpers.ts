import { RecentScrape } from '../services/recentScrapes';

export interface SpreadsheetTweetData {
  id: string;
  contenido: string;
  sentimiento: string;
  es_promocional: string;
  likes: number;
  retweets: number;
  replies: number;
  views: number;
  enlace: string;
  usuario: string;
  fecha: string;
  categoria: string;
  engagement_total: number;
}

export interface SpreadsheetColumnConfig {
  id: string;
  title: string;
  type: 'text' | 'number' | 'integer' | 'checkbox' | 'date' | 'float';
  minWidth?: number;
}

// Configuración predefinida para datos de tweets
export const TWEET_SPREADSHEET_COLUMNS: SpreadsheetColumnConfig[] = [
  { id: 'contenido', title: 'Contenido del Tweet', type: 'text', minWidth: 300 },
  { id: 'sentimiento', title: 'Sentimiento', type: 'text', minWidth: 120 },
  { id: 'es_promocional', title: 'Es Promocional', type: 'text', minWidth: 120 },
  { id: 'likes', title: 'Likes', type: 'integer', minWidth: 80 },
  { id: 'retweets', title: 'Retweets', type: 'integer', minWidth: 80 },
  { id: 'replies', title: 'Replies', type: 'integer', minWidth: 80 },
  { id: 'views', title: 'Views', type: 'integer', minWidth: 80 },
  { id: 'engagement_total', title: 'Engagement Total', type: 'integer', minWidth: 130 },
  { id: 'usuario', title: 'Usuario', type: 'text', minWidth: 150 },
  { id: 'fecha', title: 'Fecha', type: 'text', minWidth: 150 },
  { id: 'categoria', title: 'Categoría', type: 'text', minWidth: 120 },
  { id: 'enlace', title: 'Enlace al Tweet', type: 'text', minWidth: 200 }
];

// Función para procesar datos de scrape y convertirlos para el spreadsheet
export const processScrapeForSpreadsheet = (scrape: RecentScrape): SpreadsheetTweetData[] => {
  if (!scrape.tweets || !Array.isArray(scrape.tweets)) {
    return [];
  }

  return scrape.tweets.map((tweet: any, index: number) => {
    // Extraer métricas de engagement
    const likes = tweet.metrics?.likes || tweet.engagement?.likes || tweet.likes || 0;
    const retweets = tweet.metrics?.retweets || tweet.engagement?.retweets || tweet.retweets || 0;
    const replies = tweet.metrics?.replies || tweet.engagement?.replies || tweet.replies || 0;
    const views = tweet.metrics?.views || tweet.engagement?.views || tweet.views || 0;

    // Calcular engagement total
    const engagement_total = Number(likes) + Number(retweets) + Number(replies);

    // Determinar sentimiento
    let sentimiento = tweet.sentiment || tweet.sentimiento || 'neutral';
    if (sentimiento === 'positive') sentimiento = 'positivo';
    if (sentimiento === 'negative') sentimiento = 'negativo';

    // Determinar si es promocional basado en contenido
    const contenido = tweet.contenido || tweet.texto || tweet.text || '';
    const esPromocional = detectarContenidoPromocional(contenido);

    // Construir enlace al tweet
    const enlace = construirEnlaceTweet(tweet);

    // Formatear fecha
    const fecha = formatearFecha(tweet.created_at || tweet.fecha || new Date().toISOString());

    // Extraer usuario
    const usuario = tweet.user?.username || tweet.usuario || 
                   tweet.user?.name || tweet.author || 'Usuario desconocido';

    return {
      id: tweet.tweet_id || tweet.id || `tweet_${index}`,
      contenido: contenido,
      sentimiento: sentimiento,
      es_promocional: esPromocional,
      likes: Number(likes) || 0,
      retweets: Number(retweets) || 0,
      replies: Number(replies) || 0,
      views: Number(views) || 0,
      engagement_total: engagement_total,
      usuario: usuario,
      fecha: fecha,
      categoria: scrape.categoria || 'General',
      enlace: enlace
    };
  });
};

// Función para detectar contenido promocional
const detectarContenidoPromocional = (contenido: string): string => {
  if (!contenido) return 'No';
  
  const palabrasPromocionales = [
    'comprar', 'venta', 'oferta', 'descuento', 'promoción', 'gratis',
    'free', 'sale', 'buy', 'offer', 'discount', 'promo', 'ad', 'sponsored',
    'publicidad', 'anuncio', 'precio', 'ofrecemos', 'disponible', 'llamanos',
    'contacta', 'visite', 'website', 'link', 'enlace'
  ];

  const contenidoLower = contenido.toLowerCase();
  const esPromocional = palabrasPromocionales.some(palabra => 
    contenidoLower.includes(palabra)
  );

  return esPromocional ? 'Sí' : 'No';
};

// Función para construir enlace al tweet
const construirEnlaceTweet = (tweet: any): string => {
  // Si ya tiene un enlace directo, convertir twitter.com a x.com si es necesario
  if (tweet.enlace) {
    return tweet.enlace.replace('twitter.com', 'x.com');
  }
  if (tweet.url) {
    return tweet.url.replace('twitter.com', 'x.com');
  }
  if (tweet.link) {
    return tweet.link.replace('twitter.com', 'x.com');
  }

  // Construir enlace basado en ID y usuario usando x.com
  const tweetId = tweet.tweet_id || tweet.id;
  const username = tweet.user?.username || tweet.usuario;

  if (tweetId && username) {
    return `https://x.com/${username}/status/${tweetId}`;
  }

  if (tweetId) {
    return `https://x.com/i/status/${tweetId}`;
  }

  return 'Enlace no disponible';
};

// Función para formatear fecha
const formatearFecha = (fechaString: string): string => {
  try {
    const fecha = new Date(fechaString);
    return fecha.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return fechaString || 'Fecha no disponible';
  }
};

// Función para obtener nombre de display de herramienta
const getHerramientaDisplayName = (herramienta: string): string => {
  const nombres = {
    'nitter_context': 'Nitter Context',
    'nitter_profile': 'Nitter Profile',
    'twitter_search': 'Twitter Search',
    'news_search': 'News Search',
    'web_search': 'Web Search'
  };
  return nombres[herramienta as keyof typeof nombres] || herramienta || 'Desconocida';
};

// Función para generar resumen de datos procesados
export const generarResumenProcesamiento = (data: SpreadsheetTweetData[]): string => {
  if (data.length === 0) return 'No se procesaron tweets';

  const totalEngagement = data.reduce((sum, tweet) => sum + tweet.engagement_total, 0);
  const tweetsPromocionales = data.filter(tweet => tweet.es_promocional === 'Sí').length;
  const sentimientoPositivo = data.filter(tweet => tweet.sentimiento === 'positivo').length;
  const sentimientoNegativo = data.filter(tweet => tweet.sentimiento === 'negativo').length;

  return `${data.length} tweets procesados • ${totalEngagement.toLocaleString()} engagement total • ${tweetsPromocionales} promocionales • ${sentimientoPositivo} positivos • ${sentimientoNegativo} negativos`;
}; 