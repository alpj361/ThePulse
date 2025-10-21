import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Eye, Edit, Trash2, Building2, Globe, MapPin, ExternalLink } from 'lucide-react';
import type { WikiItem } from '@/services/wikiService';

interface OrganizationCardProps {
  item: WikiItem;
  onView?: (item: WikiItem) => void;
  onEdit?: (item: WikiItem) => void;
  onDelete?: (item: WikiItem) => void;
}

const OrganizationCard: React.FC<OrganizationCardProps> = ({ item, onView, onEdit, onDelete }) => {
  const orgType = item.metadata?.type || 'Organización';
  const website = item.metadata?.website;
  const location = item.metadata?.location;

  const getRelevanceBadge = (score: number) => {
    if (score >= 70) return { color: 'bg-green-600', label: 'Alta' };
    if (score >= 40) return { color: 'bg-yellow-600', label: 'Media' };
    return { color: 'bg-gray-600', label: 'Baja' };
  };

  const relevance = getRelevanceBadge(item.relevance_score);

  return (
    <Card className="relative bg-white shadow-md hover:shadow-lg transition-all duration-300 rounded-lg overflow-hidden flex flex-col">
      <CardHeader className="p-4 border-b border-slate-200 bg-gradient-to-r from-green-50 to-green-100">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-2.5 rounded-xl bg-green-600 flex-shrink-0 mt-1">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold text-slate-900 truncate" title={item.name}>
                {item.name}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="secondary" className="text-xs bg-green-600 text-white">
                  🏢 Organización
                </Badge>
                <Badge variant="secondary" className={`text-xs text-white ${relevance.color}`}>
                  {relevance.label} ({item.relevance_score})
                </Badge>
              </div>
            </div>
          </div>
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
        {item.description && (
          <p className="text-sm text-slate-600 mb-3 line-clamp-2">
            {item.description}
          </p>
        )}

        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <Building2 className="h-4 w-4 text-slate-500" />
            <span className="font-medium">Tipo:</span>
            <span>{orgType}</span>
          </div>

          {location && (
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <MapPin className="h-4 w-4 text-slate-500" />
              <span className="font-medium">Ubicación:</span>
              <span>{location}</span>
            </div>
          )}

          {website && (
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <Globe className="h-4 w-4 text-slate-500" />
              <a 
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1 truncate"
              >
                {website.replace(/^https?:\/\/(www\.)?/, '')}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>

        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto pt-3 border-t border-slate-100">
            {item.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {item.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{item.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrganizationCard;