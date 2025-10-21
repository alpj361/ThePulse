import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  MoreVertical,
  ExternalLink,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Folder,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react';
import Checkbox from '@mui/material/Checkbox';
import { Collapse } from '@mui/material';
import { MagicTweetCard } from '@/components/ui/MagicTweetCard';

// Platform logos as SVG components
const XLogo = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const InstagramLogo = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

interface CodexItem {
  id: string;
  tipo: string;
  titulo: string;
  descripcion?: string;
  etiquetas: string[];
  proyecto: string;
  created_at: string;
  fecha: string;
  original_type?: string;
  source_url?: string;
  content?: string;
  recent_scrape?: any;
  recent_scrape_id?: string;
}

interface MonitoringCardProps {
  item: CodexItem;
  selectionMode?: boolean;
  selectedIds?: string[];
  toggleSelectItem?: (id: string) => void;
  onView?: (item: CodexItem) => void;
  onEdit?: (item: CodexItem) => void;
  onDelete?: (item: CodexItem) => void;
  onOpenLinks?: (item: CodexItem) => void;
}

const MonitoringCard: React.FC<MonitoringCardProps> = ({
  item,
  selectionMode = false,
  selectedIds = [],
  toggleSelectItem,
  onView,
  onEdit,
  onDelete,
  onOpenLinks
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tweets, setTweets] = useState<any[]>([]);
  const [loadingTweets, setLoadingTweets] = useState(false);

  // Determinar la plataforma del contenido
  const getPlatform = (): 'x' | 'instagram' | 'other' => {
    // Verificar recent_scrapes (puede venir como recent_scrape o recent_scrapes)
    const scrapeData = (item as any).recent_scrapes || item.recent_scrape;
    
    if (scrapeData?.herramienta) {
      if (scrapeData.herramienta === 'instagram') return 'instagram';
      if (scrapeData.herramienta === 'twitter' || scrapeData.herramienta === 'x') return 'x';
    }
    if (item.etiquetas?.includes('instagram')) return 'instagram';
    if (item.etiquetas?.includes('twitter') || item.etiquetas?.includes('x')) return 'x';
    return 'other';
  };

  const platform = getPlatform();

  // Obtener logo de plataforma
  const PlatformLogo = () => {
    const iconClass = platform === 'x' || platform === 'instagram' ? 'h-5 w-5 text-white' : 'h-5 w-5 text-slate-500';
    
    switch (platform) {
      case 'x':
        return <XLogo className={iconClass} />;
      case 'instagram':
        return <InstagramLogo className={iconClass} />;
      default:
        return <ExternalLink className={iconClass} />;
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Determinar cantidad de tweets
  const getTweetCount = () => {
    if (tweets.length > 0) return tweets.length;
    if (item.recent_scrape?.tweet_count) return item.recent_scrape.tweet_count;
    if (item.recent_scrape?.tweets?.length) return item.recent_scrape.tweets.length;
    
    const tweetCountTag = item.etiquetas?.find(tag => tag.includes('tweet'));
    if (tweetCountTag) {
      const match = tweetCountTag.match(/(\d+)/);
      if (match) return parseInt(match[1]);
    }
    
    if (item.descripcion) {
      const match = item.descripcion.match(/Análisis de (\d+) tweets/i);
      if (match) return parseInt(match[1]);
    }
    
    return 0;
  };

  const tweetCount = getTweetCount();
  const isCollection = tweetCount > 1;

  // Cargar tweets cuando se expande
  useEffect(() => {
    const loadTweets = async () => {
      if (!isExpanded || tweets.length > 0) return;
      
      setLoadingTweets(true);
      try {
        // Opción 1: Verificar si recent_scrape tiene tweets
        if (item.recent_scrape?.tweets && Array.isArray(item.recent_scrape.tweets)) {
          setTweets(item.recent_scrape.tweets);
          setLoadingTweets(false);
          return;
        }

        // Opción 2: Cargar desde child links
        if (item.original_type === 'monitor') {
          const { getLinksForParentItem } = await import('@/services/supabase');
          const links = await getLinksForParentItem(item.id);
          
          if (links && links.length > 0) {
            const tweetData = links.map((link: any) => ({
              text: link.child?.descripcion || link.child?.transcripcion || '',
              url: link.child?.source_url || '',
              tweet_id: link.child?.id,
              created_at: link.child?.created_at,
              user: { name: 'Usuario', screen_name: 'usuario' },
              likes: 0,
              retweets: 0,
              replies: 0
            }));
            setTweets(tweetData);
          }
        }
      } catch (error) {
        console.error('Error loading tweets:', error);
      } finally {
        setLoadingTweets(false);
      }
    };

    loadTweets();
  }, [isExpanded, item.id, item.original_type, item.recent_scrape, tweets.length]);

  return (
    <Card className="relative bg-white shadow-md hover:shadow-lg transition-all duration-300 rounded-lg overflow-hidden flex flex-col">
      {selectionMode && toggleSelectItem && (
        <Checkbox
          checked={selectedIds.includes(item.id)}
          onChange={() => toggleSelectItem(item.id)}
          className="absolute top-2 left-2 z-20 bg-white rounded"
        />
      )}

      <CardHeader className="p-4 border-b border-slate-200">
        <div className="flex items-start justify-between gap-2">
          {/* Platform Logo & Title */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`p-2.5 rounded-xl flex-shrink-0 mt-1 ${
              platform === 'x' ? 'bg-slate-900' :
              platform === 'instagram' ? 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400' :
              'bg-slate-100'
            }`}>
              <PlatformLogo />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold text-slate-900 truncate" title={item.titulo}>
                {item.titulo}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge 
                  variant="secondary" 
                  className={`text-xs font-medium ${
                    platform === 'x' ? 'bg-slate-900 text-white hover:bg-slate-800' :
                    platform === 'instagram' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600' :
                    'bg-slate-100 text-slate-600'
                  }`}
                >
                  {isCollection ? `${tweetCount} posts` : 'Post individual'}
                </Badge>
                {platform !== 'other' && (
                  <Badge 
                    variant="outline" 
                    className={`text-xs capitalize border-2 ${
                      platform === 'x' ? 'border-slate-900 text-slate-900' :
                      'border-pink-500 text-pink-600'
                    }`}
                  >
                    {platform === 'x' ? '𝕏 Twitter' : '📷 Instagram'}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="-mr-2 -mt-2">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onView && (
                <DropdownMenuItem onClick={() => onView(item)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Ver detalles
                </DropdownMenuItem>
              )}
              {onOpenLinks && (
                <DropdownMenuItem onClick={() => onOpenLinks(item)}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver contenido
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(item)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem onClick={() => onDelete(item)} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="p-4 flex-1 flex flex-col">
        {/* Description */}
        {item.descripcion && !isExpanded && (
          <p className="text-sm text-slate-500 mb-3 line-clamp-2">
            {item.descripcion}
          </p>
        )}

        {/* Project & Tags */}
        <div className="space-y-2 mt-auto">
          {item.proyecto && item.proyecto !== 'Sin proyecto' && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Folder className="h-4 w-4" />
              <span className="truncate">{item.proyecto}</span>
            </div>
          )}

          {item.etiquetas && item.etiquetas.length > 0 && !isExpanded && (
            <div className="flex flex-wrap gap-1">
              {item.etiquetas.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {item.etiquetas.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{item.etiquetas.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Date */}
          {!isExpanded && (
            <div className="flex items-center gap-2 text-xs text-slate-400 pt-2 border-t border-slate-100">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(item.created_at)}</span>
            </div>
          )}
        </div>

        {/* Expand/Collapse Button for Collections */}
        {isCollection && (
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            variant={isExpanded ? "secondary" : "outline"}
            size="sm"
            className="w-full mt-3"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Ocultar posts
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Ver {tweetCount} posts
              </>
            )}
          </Button>
        )}

        {/* Expanded Tweets Section */}
        {isCollection && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
              {loadingTweets ? (
                <div className="flex items-center justify-center gap-2 py-8 text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Cargando posts...</span>
                </div>
              ) : tweets.length > 0 ? (
                tweets.slice(0, 10).map((tweet, index) => (
                  <div key={tweet.tweet_id || tweet.id || index} className="border-b border-slate-100 last:border-0 pb-3 last:pb-0">
                    <MagicTweetCard tweet={tweet} layout="compact" />
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <p className="text-sm">No se encontraron posts</p>
                </div>
              )}
              
              {tweets.length > 10 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => onOpenLinks && onOpenLinks(item)}
                >
                  Ver todos los {tweetCount} posts
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </Collapse>
        )}
      </CardContent>
    </Card>
  );
};

export default MonitoringCard;
