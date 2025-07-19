import React, { useState } from 'react';

interface StoryEvent {
  id: string;
  fecha: string;
  titulo: string;
  descripcion: string;
  impacto: 'alto' | 'medio' | 'bajo';
  categoria: 'politica' | 'economia' | 'social' | 'tecnologia';
  fuentes?: string[];
  keywords?: string[];
  sentimiento?: 'positivo' | 'neutral' | 'negativo';
}

interface StorytellingChartProps {
  events: StoryEvent[];
  title?: string;
  contextType?: 'politica' | 'economia' | 'social' | 'tecnologia' | 'general';
  maxEvents?: number;
}

const StorytellingChart: React.FC<StorytellingChartProps> = ({
  events,
  title = "Cronología de Eventos",
  contextType = 'general',
  maxEvents = 5
}) => {
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  // Configuración de iconos y colores según contexto
  const getContextConfig = () => {
    const configs = {
      politica: { 
        icon: '🏛️', 
        color: 'blue',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-900'
      },
      economia: { 
        icon: '💰', 
        color: 'green',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-900'
      },
      social: { 
        icon: '👥', 
        color: 'purple',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        textColor: 'text-purple-900'
      },
      tecnologia: { 
        icon: '💻', 
        color: 'indigo',
        bgColor: 'bg-indigo-50',
        borderColor: 'border-indigo-200',
        textColor: 'text-indigo-900'
      },
      general: { 
        icon: '📊', 
        color: 'gray',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        textColor: 'text-gray-900'
      }
    };
    return configs[contextType] || configs.general;
  };

  const config = getContextConfig();

  // Limitar eventos mostrados
  const displayEvents = events.slice(0, maxEvents);

  // Función para obtener color de impacto
  const getImpactColor = (impacto: string) => {
    switch (impacto) {
      case 'alto': return 'bg-red-500';
      case 'medio': return 'bg-yellow-500';
      case 'bajo': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  // Función para obtener emoji de sentimiento
  const getSentimentEmoji = (sentimiento?: string) => {
    switch (sentimiento) {
      case 'positivo': return '😊';
      case 'negativo': return '😞';
      case 'neutral': return '😐';
      default: return '📰';
    }
  };

  // Función para formatear fecha
  const formatDate = (fecha: string) => {
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-GT', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return fecha;
    }
  };

  const toggleExpanded = (eventId: string) => {
    setExpandedEvent(expandedEvent === eventId ? null : eventId);
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <span className="text-2xl">{config.icon}</span>
          {title}
        </h3>
        <p className="text-sm text-gray-600">
          Narrativa cronológica de eventos relevantes
        </p>
      </div>

      <div className="relative">
        {/* Línea temporal principal */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-blue-400 to-blue-200"></div>

        {/* Eventos */}
        <div className="space-y-6">
          {displayEvents.map((event, index) => {
            const isExpanded = expandedEvent === event.id;
            const isFirst = index === 0;
            const isLast = index === displayEvents.length - 1;

            return (
              <div key={event.id} className="relative">
                {/* Punto en la línea temporal */}
                <div className={`absolute left-6 w-4 h-4 rounded-full border-2 border-white shadow-lg ${getImpactColor(event.impacto)} z-10`}>
                  <div className="absolute inset-0.5 rounded-full bg-white opacity-50"></div>
                </div>

                {/* Card del evento */}
                <div className="ml-16 group">
                  <div 
                    className={`${config.bgColor} ${config.borderColor} border-2 rounded-xl p-4 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02]`}
                    onClick={() => toggleExpanded(event.id)}
                  >
                    {/* Header del evento */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{getSentimentEmoji(event.sentimiento)}</span>
                          <span className="text-xs font-medium text-gray-500 bg-white/70 px-2 py-1 rounded-full">
                            {formatDate(event.fecha)}
                          </span>
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            event.impacto === 'alto' ? 'bg-red-100 text-red-700' :
                            event.impacto === 'medio' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {event.impacto.toUpperCase()}
                          </span>
                        </div>
                        
                        <h4 className={`font-semibold text-sm mb-1 ${config.textColor}`}>
                          {event.titulo}
                        </h4>
                        
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {event.descripcion}
                        </p>
                      </div>

                      {/* Toggle button */}
                      <button className="flex-shrink-0 ml-2 p-1 rounded-full hover:bg-white/50 transition-colors">
                        {isExpanded ? (
                          <span className="text-gray-600 text-lg">▼</span>
                        ) : (
                          <span className="text-gray-600 text-lg">▶</span>
                        )}
                      </button>
                    </div>

                    {/* Contenido expandido */}
                    {isExpanded && (
                      <div className="mt-4 space-y-3 border-t border-white/50 pt-3">
                        {/* Descripción completa */}
                        <div>
                          <h5 className="font-medium text-sm text-gray-900 mb-1">📖 Detalles</h5>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {event.descripcion}
                          </p>
                        </div>

                        {/* Keywords */}
                        {event.keywords && event.keywords.length > 0 && (
                          <div>
                            <h5 className="font-medium text-sm text-gray-900 mb-2">🏷️ Palabras Clave</h5>
                            <div className="flex flex-wrap gap-1">
                              {event.keywords.map((keyword, idx) => (
                                <span key={idx} className="text-xs bg-white/70 text-gray-700 px-2 py-1 rounded-full">
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Fuentes */}
                        {event.fuentes && event.fuentes.length > 0 && (
                          <div>
                            <h5 className="font-medium text-sm text-gray-900 mb-2">📚 Fuentes</h5>
                            <div className="space-y-1">
                              {event.fuentes.slice(0, 3).map((fuente, idx) => (
                                <p key={idx} className="text-xs text-gray-600 truncate">
                                  • {fuente}
                                </p>
                              ))}
                              {event.fuentes.length > 3 && (
                                <p className="text-xs text-gray-500">
                                  +{event.fuentes.length - 3} más...
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Conectores visuales */}
                {!isLast && (
                  <div className="absolute left-7 bottom-0 w-2 h-6 bg-gradient-to-b from-transparent to-blue-200 opacity-50"></div>
                )}
              </div>
            );
          })}
        </div>

        {/* Indicador de más eventos */}
        {events.length > maxEvents && (
          <div className="mt-6 ml-16">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-600">
                📚 <strong>{events.length - maxEvents}</strong> eventos adicionales disponibles
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Amplía tu consulta para ver la cronología completa
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Resumen estadístico */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-gray-900">{displayEvents.length}</div>
          <div className="text-xs text-gray-600">Eventos</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-red-600">
            {displayEvents.filter(e => e.impacto === 'alto').length}
          </div>
          <div className="text-xs text-gray-600">Alto Impacto</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-green-600">
            {displayEvents.filter(e => e.sentimiento === 'positivo').length}
          </div>
          <div className="text-xs text-gray-600">Positivos</div>
        </div>
      </div>
    </div>
  );
};

export default StorytellingChart; 