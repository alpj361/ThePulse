import React, { useId } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface SentimentRadarData {
  categoria: string;
  positivo: number;
  neutral: number;
  negativo: number;
  discurso_informativo: number;
  discurso_opinativo: number;
  discurso_emocional: number;
}

interface SentimentRadarChartProps {
  data: SentimentRadarData[] | any[]; // Permitir también el formato anterior por compatibilidad
  height?: number;
  title?: string;
  contextType?: 'politica' | 'economia' | 'social' | 'tecnologia' | 'general';
}

const SentimentRadarChart: React.FC<SentimentRadarChartProps> = ({
  data,
  height = 400,
  title = "Análisis Emocional y Tipos de Discurso",
  contextType = 'general'
}) => {
  // Unique id for gradient to avoid DOM collisions when multiple charts are rendered
  const gradientId = useId();
  // Transformar datos para el radar chart
  const transformDataForRadar = () => {
    if (!data || data.length === 0) {
      // Datos de prueba si no hay datos disponibles
      return [
        { aspecto: 'Positivo', valor: 45, fullMark: 100 },
        { aspecto: 'Neutral', valor: 35, fullMark: 100 },
        { aspecto: 'Negativo', valor: 20, fullMark: 100 },
        { aspecto: 'Informativo', valor: 65, fullMark: 100 },
        { aspecto: 'Opinativo', valor: 30, fullMark: 100 },
        { aspecto: 'Emocional', valor: 40, fullMark: 100 }
      ];
    }

    // Verificar si los datos ya tienen la estructura nueva (SentimentRadarData)
    const firstItem = data[0];
    const hasNewFormat = firstItem && 
      typeof firstItem.discurso_informativo !== 'undefined' &&
      typeof firstItem.discurso_opinativo !== 'undefined' &&
      typeof firstItem.discurso_emocional !== 'undefined';

    if (hasNewFormat) {
      // Usar datos en formato nuevo
      const typedData = data as SentimentRadarData[];
      const totals = typedData.reduce((acc, item) => {
        acc.positivo += item.positivo || 0;
        acc.neutral += item.neutral || 0;
        acc.negativo += item.negativo || 0;
        acc.discurso_informativo += item.discurso_informativo || 0;
        acc.discurso_opinativo += item.discurso_opinativo || 0;
        acc.discurso_emocional += item.discurso_emocional || 0;
        return acc;
      }, {
        positivo: 0,
        neutral: 0,
        negativo: 0,
        discurso_informativo: 0,
        discurso_opinativo: 0,
        discurso_emocional: 0
      });

      const count = typedData.length;
      
      return [
        { aspecto: 'Positivo', valor: Math.round(totals.positivo / count), fullMark: 100 },
        { aspecto: 'Neutral', valor: Math.round(totals.neutral / count), fullMark: 100 },
        { aspecto: 'Negativo', valor: Math.round(totals.negativo / count), fullMark: 100 },
        { aspecto: 'Informativo', valor: Math.round(totals.discurso_informativo / count), fullMark: 100 },
        { aspecto: 'Opinativo', valor: Math.round(totals.discurso_opinativo / count), fullMark: 100 },
        { aspecto: 'Emocional', valor: Math.round(totals.discurso_emocional / count), fullMark: 100 }
      ];
    } else {
      // Adaptador para el formato anterior (tiempo, positivo, neutral, negativo)
      const oldFormatData = data.filter(item => item.positivo !== undefined || item.neutral !== undefined || item.negativo !== undefined);
      
      if (oldFormatData.length === 0) {
        // Datos de prueba si el formato anterior tampoco tiene datos válidos
        return [
          { aspecto: 'Positivo', valor: 45, fullMark: 100 },
          { aspecto: 'Neutral', valor: 35, fullMark: 100 },
          { aspecto: 'Negativo', valor: 20, fullMark: 100 },
          { aspecto: 'Informativo', valor: 65, fullMark: 100 },
          { aspecto: 'Opinativo', valor: 30, fullMark: 100 },
          { aspecto: 'Emocional', valor: 40, fullMark: 100 }
        ];
      }

      const totals = oldFormatData.reduce((acc, item) => {
        acc.positivo += item.positivo || 0;
        acc.neutral += item.neutral || 0;
        acc.negativo += item.negativo || 0;
        return acc;
      }, { positivo: 0, neutral: 0, negativo: 0 });

      const count = oldFormatData.length;
      
      // Para el formato anterior, simular tipos de discurso basados en los datos de sentimiento
      const avgPositivo = Math.round(totals.positivo / count);
      const avgNeutral = Math.round(totals.neutral / count);
      const avgNegativo = Math.round(totals.negativo / count);
      
      return [
        { aspecto: 'Positivo', valor: avgPositivo, fullMark: 100 },
        { aspecto: 'Neutral', valor: avgNeutral, fullMark: 100 },
        { aspecto: 'Negativo', valor: avgNegativo, fullMark: 100 },
        { aspecto: 'Informativo', valor: Math.round(avgNeutral * 1.5), fullMark: 100 }, // Simulado: neutral tiende a ser más informativo
        { aspecto: 'Opinativo', valor: Math.round((avgPositivo + avgNegativo) * 0.7), fullMark: 100 }, // Simulado: opiniones tienden a ser más emotivas
        { aspecto: 'Emocional', valor: Math.round(Math.max(avgPositivo, avgNegativo) * 1.2), fullMark: 100 } // Simulado: emocional basado en extremos
      ];
    }
  };

  const radarData = transformDataForRadar();

  // Configuración de colores según contexto
  const getRadarColors = () => {
    const contextColors = {
      politica: { stroke: '#3b82f6', fill: 'rgba(59, 130, 246, 0.2)' },
      economia: { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.2)' },
      social: { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.2)' },
      tecnologia: { stroke: '#8b5cf6', fill: 'rgba(139, 92, 246, 0.2)' },
      general: { stroke: '#6366f1', fill: 'rgba(99, 102, 241, 0.2)' }
    };
    return contextColors[contextType] || contextColors.general;
  };

  const colors = getRadarColors();

  // Tooltip personalizado para radar chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      const getAspectIcon = (aspecto: string) => {
        const icons = {
          'Positivo': '😊',
          'Neutral': '😐',
          'Negativo': '😞',
          'Informativo': '📋',
          'Opinativo': '💭',
          'Emocional': '❤️'
        };
        return icons[aspecto as keyof typeof icons] || '📊';
      };

      const getAspectDescription = (aspecto: string) => {
        const descriptions = {
          'Positivo': 'Contenido con tono positivo y optimista',
          'Neutral': 'Contenido con tono neutral y objetivo',
          'Negativo': 'Contenido con tono negativo o crítico',
          'Informativo': 'Discurso basado en hechos y datos',
          'Opinativo': 'Discurso basado en opiniones y análisis',
          'Emocional': 'Discurso con carga emocional intensa'
        };
        return descriptions[aspecto as keyof typeof descriptions] || 'Análisis del contenido';
      };
      
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-xl p-4 shadow-xl max-w-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{getAspectIcon(data.aspecto)}</span>
            <h4 className="font-semibold text-gray-900">{data.aspecto}</h4>
          </div>
          <p className="text-xs text-gray-600 mb-3">{getAspectDescription(data.aspecto)}</p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Intensidad:</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg" style={{ color: colors.stroke }}>
                {data.valor}%
              </span>
              <div className="w-12 h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-full rounded-full transition-all duration-300"
                  style={{ 
                    width: `${data.valor}%`, 
                    backgroundColor: colors.stroke 
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full" aria-label="Gráfico radar de análisis emocional y tipos de discurso">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-600">
          Análisis multidimensional de emociones y tipos de discurso
        </p>
      </div>
      
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <ResponsiveContainer width="100%" height={height}>
          <RadarChart data={radarData} margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
            {/* Gradient definition for smoother fill */}
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.stroke} stopOpacity={0.6} />
                <stop offset="100%" stopColor={colors.stroke} stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <PolarGrid 
              stroke="rgba(0,0,0,0.1)" 
              strokeDasharray="2 2"
            />
            <PolarAngleAxis 
              dataKey="aspecto" 
              tick={{ fontSize: 12, fill: 'rgba(55, 65, 81, 0.8)' }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: 'rgba(107, 114, 128, 0.7)' }}
              tickCount={6}
            />
            <Radar
              name="Intensidad"
              dataKey="valor"
              stroke={colors.stroke}
              fill={`url(#${gradientId})`}
              fillOpacity={0.8}
              strokeWidth={2}
              isAnimationActive={true}
              animationDuration={800}
              dot={{ 
                fill: colors.stroke, 
                strokeWidth: 2, 
                stroke: '#fff',
                r: 4 
              }}
              activeDot={{ 
                r: 6, 
                stroke: colors.stroke,
                strokeWidth: 3,
                fill: '#fff'
              }}
            />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
        
        {/* Leyenda explicativa rediseñada */}
        <div className="mt-4 pt-4 border-t border-gray-200/80">
          <div className="grid grid-cols-3 gap-x-6 gap-y-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-base">😊</span>
              <span className="text-gray-700">Positivo</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base">😐</span>
              <span className="text-gray-700">Neutral</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base">😞</span>
              <span className="text-gray-700">Negativo</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base">📋</span>
              <span className="text-gray-700">Informativo</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base">💭</span>
              <span className="text-gray-700">Opinativo</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base">❤️</span>
              <span className="text-gray-700">Emocional</span>
            </div>
          </div>
          <div className="flex items-center gap-2 justify-center mt-4">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.stroke }}></div>
              <span className="text-gray-600 text-xs">Intensidad promedio (%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SentimentRadarChart; 