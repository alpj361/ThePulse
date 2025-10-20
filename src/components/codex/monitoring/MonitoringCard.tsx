import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  MoreVertical,
  ExternalLink,
  Eye,
  Edit,
  Trash2,
  Heart,
  MessageCircle,
  Repeat2,
  Calendar,
  Folder,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Checkbox from '@mui/material/Checkbox';

// Platform logos as SVG components
const XLogo = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const InstagramLogo = ({ className = "h-4 w-4" }: { className?: string }) => (
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
  likes?: number;
  comments?: number;
  shares?: number;
  views?: number;
  recent_scrape?: any;
  is_child_link?: boolean;
  parent_item_id?: string;
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

  // Determinar la plataforma del contenido
  const getPlatform = (): 'x' | 'instagram' | 'other' => {
    if (item.original_type === 'instagram' || item.source_url?.includes('instagram.com')) {
      return 'instagram';
    }
    if (item.original_type === 'twitter' || item.original_type === 'x' || item.source_url?.includes('twitter.com') || item.source_url?.includes('x.com')) {
      return 'x';
    }
    return 'other';
  };

  const platform = getPlatform();

  // Obtener logo de plataforma
  const PlatformLogo = () => {
    switch (platform) {
      case 'x':
        return <XLogo className="h-5 w-5 text-slate-700" />;
      case 'instagram':
        return <InstagramLogo className="h-5 w-5 text-pink-600" />;
      default:
        return <ExternalLink className="h-5 w-5 text-slate-500" />;
    }
  };

  // Formatear números
  const formatNumber = (num?: number) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
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

  // Determinar si es colección o post individual
  const isCollection = item.recent_scrape?.tweet_count > 1 || false;

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
            <div className="bg-slate-100 p-2 rounded-lg flex-shrink-0 mt-1">
              <PlatformLogo />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold text-slate-900 truncate" title={item.titulo}>
                {item.titulo}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {isCollection ? `${item.recent_scrape?.tweet_count || 0} posts` : 'Post individual'}
                </Badge>
                {platform !== 'other' && (
                  <Badge variant="outline" className="text-xs capitalize">
                    {platform === 'x' ? 'X (Twitter)' : 'Instagram'}
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
        {/* Content Preview */}
        {item.content && (
          <div className="mb-3">
            <p className={`text-sm text-slate-600 ${!isExpanded ? 'line-clamp-3' : ''}`}>
              {item.content}
            </p>
            {item.content.length > 150 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-1 h-auto p-0 text-blue-600 hover:text-blue-700"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Ver menos
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Ver más
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Engagement Metrics */}
        {(item.likes || item.comments || item.shares || item.views) && (
          <div className="flex items-center gap-4 mb-3 pb-3 border-b border-slate-100">
            {item.likes > 0 && (
              <div className="flex items-center gap-1 text-sm text-slate-600">
                <Heart className="h-4 w-4 text-red-500" />
                <span>{formatNumber(item.likes)}</span>
              </div>
            )}
            {item.comments > 0 && (
              <div className="flex items-center gap-1 text-sm text-slate-600">
                <MessageCircle className="h-4 w-4 text-blue-500" />
                <span>{formatNumber(item.comments)}</span>
              </div>
            )}
            {item.shares > 0 && (
              <div className="flex items-center gap-1 text-sm text-slate-600">
                <Repeat2 className="h-4 w-4 text-green-500" />
                <span>{formatNumber(item.shares)}</span>
              </div>
            )}
            {item.views > 0 && (
              <div className="flex items-center gap-1 text-sm text-slate-600">
                <Eye className="h-4 w-4 text-purple-500" />
                <span>{formatNumber(item.views)}</span>
              </div>
            )}
          </div>
        )}

        {/* Description */}
        {item.descripcion && (
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

          {item.etiquetas && item.etiquetas.length > 0 && (
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
          <div className="flex items-center gap-2 text-xs text-slate-400 pt-2 border-t border-slate-100">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(item.created_at)}</span>
          </div>
        </div>

        {/* Open Collection Button */}
        {isCollection && onOpenLinks && (
          <Button
            onClick={() => onOpenLinks(item)}
            variant="outline"
            size="sm"
            className="w-full mt-3"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Ver {item.recent_scrape?.tweet_count || 0} posts
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default MonitoringCard;
