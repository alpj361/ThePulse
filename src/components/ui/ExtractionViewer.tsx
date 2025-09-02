import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/Badge';
import { Calendar, Clock, FileText, Link, Image, Video, Hash, MapPin, User, Heart, MessageCircle, Share, AlertCircle } from 'lucide-react';
import { AgentExtraction } from '../../services/supabase';

interface ExtractionViewerProps {
  extractions: AgentExtraction[];
  isLoading?: boolean;
}

// Utilidades para renderizar valores potencialmente no-texto
const truncateText = (value: any, maxLen: number): string => {
  if (value === null || value === undefined) return '';
  const base = typeof value === 'string'
    ? value
    : (typeof value === 'object' ? (value.text ?? JSON.stringify(value)) : String(value));
  return base.length > maxLen ? base.slice(0, maxLen) + '...' : base;
};

const toDisplayString = (value: any): string => {
  if (value === null || value === undefined) return '';
  return typeof value === 'string' ? value : (typeof value === 'object' ? (value.text ?? JSON.stringify(value)) : String(value));
};

// Función para detectar y formatear diferentes tipos de datos extraídos
const formatExtractedData = (data: any): React.ReactNode => {
  if (!data || typeof data !== 'object') {
    return <span className="text-gray-500">{String(data) || 'Sin datos'}</span>;
  }

  // Detectar si es un array de elementos
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return <span className="text-gray-500">Lista vacía</span>;
    }

    return (
      <div className="space-y-3">
        {data.slice(0, 10).map((item, index) => (
          <div key={index} className="bg-slate-50 border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                #{index + 1}
              </Badge>
            </div>
            {formatSingleItem(item)}
          </div>
        ))}
        {data.length > 10 && (
          <div className="text-center py-2">
            <Badge variant="secondary" className="text-xs">
              +{data.length - 10} elementos más
            </Badge>
          </div>
        )}
      </div>
    );
  }

  // Detectar si es un objeto con estructura conocida
  return formatSingleItem(data);
};

// Función para formatear un elemento individual
const formatSingleItem = (item: any): React.ReactNode => {
  if (!item || typeof item !== 'object') {
    return <span>{String(item)}</span>;
  }

  // Detectar artículos/noticias
  if (item.title || item.headline || item.titulo) {
    return formatNewsArticle(item);
  }

  // Detectar tweets/posts sociales
  if (item.tweet_text || item.text || item.content || item.usuario || item.username) {
    return formatSocialPost(item);
  }

  // Detectar productos/comercio
  if (item.price || item.precio || item.cost || item.product_name || item.nombre_producto) {
    return formatProduct(item);
  }

  // Detectar eventos
  if (item.event_name || item.evento || item.date || item.fecha || item.location || item.ubicacion) {
    return formatEvent(item);
  }

  // Detectar perfiles/usuarios
  if (item.profile_name || item.perfil || item.followers || item.seguidores || item.bio) {
    return formatProfile(item);
  }

  // Formato genérico para otros objetos
  return formatGenericObject(item);
};

// Formateadores específicos por tipo de contenido
const formatNewsArticle = (article: any) => (
  <div className="space-y-2">
    <div className="flex items-start gap-2">
      <FileText className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
      <div className="flex-1">
        <h4 className="font-medium text-slate-900 leading-tight">
          {article.title || article.headline || article.titulo || 'Artículo sin título'}
        </h4>
        {(article.source || article.fuente) && (
          <div className="flex items-center gap-1 mt-1">
            <Badge variant="outline" className="text-xs">
              {article.source || article.fuente}
            </Badge>
          </div>
        )}
      </div>
    </div>
    
    {(article.excerpt || article.summary || article.resumen || article.description) && (
      <p className="text-sm text-slate-600 leading-relaxed pl-6">
        {truncateText((article.excerpt || article.summary || article.resumen || article.description), 200)}
      </p>
    )}
    
    <div className="flex items-center gap-4 pl-6 text-xs text-slate-500">
      {(article.date || article.fecha || article.published_date) && (
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>{new Date(article.date || article.fecha || article.published_date).toLocaleDateString()}</span>
        </div>
      )}
      {(article.url || article.link || article.enlace) && (
        <div className="flex items-center gap-1">
          <Link className="h-3 w-3" />
          <a 
            href={article.url || article.link || article.enlace} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline truncate max-w-[200px]"
          >
            Ver artículo
          </a>
        </div>
      )}
      {(article.category || article.categoria) && (
        <Badge variant="secondary" className="text-xs">
          {article.category || article.categoria}
        </Badge>
      )}
    </div>
  </div>
);

const formatSocialPost = (post: any) => (
  <div className="space-y-2">
    <div className="flex items-start gap-2">
      <MessageCircle className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0" />
      <div className="flex-1">
        {(post.usuario || post.username || post.author) && (
          <div className="flex items-center gap-2 mb-1">
            <User className="h-3 w-3" />
            <span className="font-medium text-sm">@{post.usuario || post.username || post.author}</span>
            {post.verified && (
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-600">✓</Badge>
            )}
          </div>
        )}
        <p className="text-sm text-slate-900 leading-relaxed">
          {toDisplayString(post.tweet_text || post.text || post.content || post.texto || 'Sin contenido')}
        </p>
      </div>
    </div>
    
    <div className="flex items-center gap-4 pl-6 text-xs text-slate-500">
      {(post.fecha_tweet || post.date || post.timestamp) && (
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>{new Date(post.fecha_tweet || post.date || post.timestamp).toLocaleDateString()}</span>
        </div>
      )}
      {typeof post.likes === 'number' && (
        <div className="flex items-center gap-1">
          <Heart className="h-3 w-3" />
          <span>{post.likes.toLocaleString()}</span>
        </div>
      )}
      {typeof post.retweets === 'number' && (
        <div className="flex items-center gap-1">
          <Share className="h-3 w-3" />
          <span>{post.retweets.toLocaleString()}</span>
        </div>
      )}
      {typeof post.replies === 'number' && (
        <div className="flex items-center gap-1">
          <MessageCircle className="h-3 w-3" />
          <span>{post.replies.toLocaleString()}</span>
        </div>
      )}
      {post.location && (
        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          <span>{String(post.location)}</span>
        </div>
      )}
    </div>
    
    {(post.sentimiento || post.sentiment) && (
      <div className="pl-6">
        <Badge 
          variant="outline" 
          className={`text-xs ${
            (post.sentimiento || post.sentiment) === 'positive' ? 'text-green-600 border-green-200' :
            (post.sentimiento || post.sentiment) === 'negative' ? 'text-red-600 border-red-200' :
            'text-gray-600 border-gray-200'
          }`}
        >
          {post.sentimiento || post.sentiment}
        </Badge>
      </div>
    )}
  </div>
);

const formatProduct = (product: any) => (
  <div className="space-y-2">
    <div className="flex items-start gap-2">
      <Hash className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
      <div className="flex-1">
        <h4 className="font-medium text-slate-900">
          {product.product_name || product.nombre_producto || product.name || product.title || 'Producto'}
        </h4>
        {(product.price || product.precio || product.cost) && (
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-green-600 border-green-200">
              {product.currency || '$'} {product.price || product.precio || product.cost}
            </Badge>
            {(product.original_price || product.precio_original) && (
              <Badge variant="outline" className="text-red-600 border-red-200 line-through">
                {product.currency || '$'} {product.original_price || product.precio_original}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
    
    {(product.description || product.descripcion) && (
      <p className="text-sm text-slate-600 pl-6">
        {truncateText((product.description || product.descripcion), 150)}
      </p>
    )}
    
    <div className="flex items-center gap-4 pl-6 text-xs text-slate-500">
      {(product.brand || product.marca) && (
        <Badge variant="secondary" className="text-xs">
          {product.brand || product.marca}
        </Badge>
      )}
      {(product.category || product.categoria) && (
        <Badge variant="secondary" className="text-xs">
          {product.category || product.categoria}
        </Badge>
      )}
      {(product.availability || product.disponibilidad) && (
        <Badge 
          variant="outline" 
          className={`text-xs ${
            (product.availability || product.disponibilidad).toLowerCase().includes('disponible') ||
            (product.availability || product.disponibilidad).toLowerCase().includes('available') ?
            'text-green-600 border-green-200' : 'text-red-600 border-red-200'
          }`}
        >
          {product.availability || product.disponibilidad}
        </Badge>
      )}
      {(product.url || product.link) && (
        <a 
          href={product.url || product.link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline flex items-center gap-1"
        >
          <Link className="h-3 w-3" />
          Ver producto
        </a>
      )}
    </div>
  </div>
);

const formatEvent = (event: any) => (
  <div className="space-y-2">
    <div className="flex items-start gap-2">
      <Calendar className="h-4 w-4 text-purple-600 mt-1 flex-shrink-0" />
      <div className="flex-1">
        <h4 className="font-medium text-slate-900">
          {event.event_name || event.evento || event.name || event.title || 'Evento'}
        </h4>
      </div>
    </div>
    
    {(event.description || event.descripcion) && (
      <p className="text-sm text-slate-600 pl-6">
        {truncateText((event.description || event.descripcion), 150)}
      </p>
    )}
    
    <div className="flex flex-wrap items-center gap-3 pl-6 text-xs text-slate-500">
      {(event.date || event.fecha || event.start_date) && (
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>{new Date(event.date || event.fecha || event.start_date).toLocaleDateString()}</span>
        </div>
      )}
      {(event.time || event.hora) && (
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{event.time || event.hora}</span>
        </div>
      )}
      {(event.location || event.ubicacion || event.venue) && (
        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          <span>{String(event.location || event.ubicacion || event.venue)}</span>
        </div>
      )}
      {(event.organizer || event.organizador) && (
        <Badge variant="secondary" className="text-xs">
          {event.organizer || event.organizador}
        </Badge>
      )}
    </div>
  </div>
);

const formatProfile = (profile: any) => (
  <div className="space-y-2">
    <div className="flex items-start gap-2">
      <User className="h-4 w-4 text-indigo-600 mt-1 flex-shrink-0" />
      <div className="flex-1">
        <h4 className="font-medium text-slate-900">
          {profile.profile_name || profile.perfil || profile.name || profile.username || 'Perfil'}
        </h4>
        {(profile.bio || profile.description || profile.descripcion) && (
          <p className="text-sm text-slate-600 mt-1">
            {(profile.bio || profile.description || profile.descripcion).substring(0, 100)}
            {(profile.bio || profile.description || profile.descripcion).length > 100 && '...'}
          </p>
        )}
      </div>
    </div>
    
    <div className="flex items-center gap-4 pl-6 text-xs text-slate-500">
      {typeof profile.followers === 'number' && (
        <div className="flex items-center gap-1">
          <User className="h-3 w-3" />
          <span>{profile.followers.toLocaleString()} seguidores</span>
        </div>
      )}
      {typeof profile.following === 'number' && (
        <span>{profile.following.toLocaleString()} siguiendo</span>
      )}
      {(profile.location || profile.ubicacion) && (
        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          <span>{profile.location || profile.ubicacion}</span>
        </div>
      )}
      {profile.verified && (
        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-600">
          Verificado ✓
        </Badge>
      )}
    </div>
  </div>
);

const formatGenericObject = (obj: any) => (
  <div className="space-y-2">
    <div className="grid grid-cols-1 gap-2">
      {Object.entries(obj).slice(0, 8).map(([key, value]) => (
        <div key={key} className="flex">
          <span className="text-xs font-medium text-slate-600 w-24 flex-shrink-0 capitalize">
            {key.replace(/_/g, ' ')}:
          </span>
          <span className="text-xs text-slate-900 flex-1">
            {typeof value === 'object' ? 
              JSON.stringify(value).substring(0, 100) + (JSON.stringify(value).length > 100 ? '...' : '') :
              String(value || 'N/A')
            }
          </span>
        </div>
      ))}
      {Object.keys(obj).length > 8 && (
        <div className="text-xs text-slate-500 italic">
          +{Object.keys(obj).length - 8} campos más...
        </div>
      )}
    </div>
  </div>
);

export default function ExtractionViewer({ extractions, isLoading }: ExtractionViewerProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p>Cargando extracciones...</p>
        </div>
      </div>
    );
  }

  if (extractions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
        <p className="text-lg font-medium">No hay extracciones disponibles</p>
        <p className="text-sm mt-2">Ejecuta el agente para generar datos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {extractions.map((extraction, index) => (
        <Card key={extraction.id} className="border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span>Extracción #{index + 1}</span>
                  <Badge 
                    variant={extraction.success ? "default" : "destructive"}
                    className={
                      extraction.success 
                        ? "bg-green-100 text-green-800 hover:bg-green-200" 
                        : "bg-red-100 text-red-800 hover:bg-red-200"
                    }
                  >
                    {extraction.success ? '✅ Exitosa' : '❌ Error'}
                  </Badge>
                </CardTitle>
                <div className="flex items-center gap-4 text-sm text-slate-600 mt-1">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(extraction.executed_at).toLocaleString()}</span>
                  </div>
                  {extraction.execution_duration_ms && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{extraction.execution_duration_ms}ms</span>
                    </div>
                  )}
                  {extraction.data_size_bytes && (
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      <span>{(extraction.data_size_bytes / 1024).toFixed(1)}KB</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {extraction.extraction_summary && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h5 className="font-medium text-blue-900 mb-1 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Resumen de la extracción
                </h5>
                <p className="text-sm text-blue-800">{extraction.extraction_summary}</p>
              </div>
            )}

            {extraction.error_message && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <h5 className="font-medium text-red-900 mb-1 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Error
                </h5>
                <p className="text-sm text-red-800">{extraction.error_message}</p>
              </div>
            )}

            {extraction.extracted_data && Object.keys(extraction.extracted_data).length > 0 && (
              <div>
                <h5 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Datos extraídos ({Object.keys(extraction.extracted_data).length} campo{Object.keys(extraction.extracted_data).length !== 1 ? 's' : ''})
                </h5>
                <div className="bg-white border rounded-lg p-4 max-h-96 overflow-y-auto">
                  {formatExtractedData(extraction.extracted_data)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
