"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Container
} from '@mui/material';
import {
  BarChart,
  TrendingUp,
  LocationOn,
  Assessment,
  Search as SearchIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
  People,
  Percent,
  AttachMoney,
  Tune,
  ExpandMore,
  PieChart,
  ShowChart,
  Timeline,
  Analytics,
  Insights
} from '@mui/icons-material';
import { getLatestNews, getCodexItemsByUser, getSondeosByUser } from '../services/supabase.ts';
import { sendSondeoToExtractorW, getLatestTrends } from '../services/api';
import { sondearTema as sondearTemaService } from '../services/sondeos';
import { getRecentScrapes, RecentScrape } from '../services/recentScrapes';
import { useAuth } from '../context/AuthContext';
import { useSondeoConfig } from '../hooks/useSondeoConfig';
import { useSondeoForm } from '../hooks/useSondeoForm';
import { NewsItem } from '../types';
import type { TrendResponse } from '../services/api';
import SondeosMap, { Sondeo } from '../components/SondeosMap';
import BarChartVisual from '../components/ui/BarChartVisual';
import LineChartVisual from '../components/ui/LineChartVisual';
import AreaChartVisual from '../components/ui/AreaChartVisual';
import PieChartVisual from '../components/ui/PieChartVisual';
import ModernBarChart from '../components/ui/ModernBarChart';
import ModernLineChart from '../components/ui/ModernLineChart';
import ModernPieChart from '../components/ui/ModernPieChart';
import MultiContextSelector from '../components/ui/MultiContextSelector';
import AIResponseDisplay from '../components/ui/AIResponseDisplay';
import SondeoConfigModal from '../components/ui/SondeoConfigModal';
import SondeoProgressIndicator from '../components/ui/SondeoProgressIndicator';
import CardSondeo from '../components/sondeos/CardSondeo';
import AnalisisGenerado from '../components/sondeos/AnalisisGenerado';
// Import new chart components
import SentimentAreaChart from '../components/ui/SentimentAreaChart';
import StorytellingChart from '../components/ui/StorytellingChart';

// Tipo para el historial de sondeos
interface SondeoHistorial {
  id: string;
  pregunta: string;
  respuesta_llm: string;
  datos_analisis: any;
  contextos_utilizados: string[];
  created_at: string;
  creditos_utilizados: number;
  modelo_ia: string;
  tokens_utilizados: number;
}

function resumirTexto(texto: string, maxLen = 220) {
  if (!texto || typeof texto !== 'string') return '';
  return texto.length > maxLen ? texto.substring(0, maxLen) + '...' : texto;
}

const SondeosFullPage: React.FC = () => {
  const { user, session } = useAuth();
  const { selectedContexts, setSelectedContexts } = useSondeoConfig();
  const { updateSelectedContexts } = useSondeoForm();
  
  const [news, setNews] = useState<NewsItem[]>([]);
  const [codex, setCodex] = useState<any[]>([]);
  const [monitoreos, setMonitoreos] = useState<RecentScrape[]>([]);
  const [selectedMonitoreos, setSelectedMonitoreos] = useState<string[]>([]);
  const [selectedTrends, setSelectedTrends] = useState<string[]>([]);
  const [selectedNoticias, setSelectedNoticias] = useState<string[]>([]);
  const [selectedCodex, setSelectedCodex] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSondeo, setLoadingSondeo] = useState(false);
  const [error, setError] = useState('');
  const [input, setInput] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);
  const [contexto, setContexto] = useState<any>(null);
  const [showContext, setShowContext] = useState(false);
  const [llmResponse, setLlmResponse] = useState<string | null>(null);
  const [llmSources, setLlmSources] = useState<any>(null);
  const [sondeos, setSondeos] = useState<SondeoHistorial[]>([]);
  const [loadingSondeos, setLoadingSondeos] = useState(false);
  const [datosAnalisis, setDatosAnalisis] = useState<any>(null);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('preparing');
  const [progress, setProgress] = useState<number>(0);
  const [selectedChartType, setSelectedChartType] = useState<'bar' | 'line' | 'pie'>('bar');
  const [selectedPeriod, setSelectedPeriod] = useState('last-7-days');



  // Utility function to map context to chart context types
  const getContextType = (context: string): 'politica' | 'economia' | 'social' | 'tecnologia' | 'general' => {
    const contextMap: Record<string, 'politica' | 'economia' | 'social' | 'tecnologia' | 'general'> = {
      'tendencias': 'general',
      'noticias': 'politica',
      'codex': 'social',
      'monitoreos': 'social',
      'politica': 'politica',
      'economia': 'economia',
      'social': 'social',
      'tecnologia': 'tecnologia'
    };
    return contextMap[context] || 'general';
  };

  // Cargar datos iniciales
  useEffect(() => {
    if (user) {
      cargarDatos();
    }
  }, [user]);

  const cargarDatos = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Cargar noticias recientes
      const newsData = await getLatestNews();
      setNews(newsData || []);
      
      // Cargar documentos de codex
      const codexData = await getCodexItemsByUser(user.id);
      setCodex(codexData || []);
      
      // Cargar monitoreos recientes
      const monitoreosData = await getRecentScrapes(user.id, { limit: 200 });
      setMonitoreos(monitoreosData || []);
      
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para procesar el sondeo
  const procesarSondeo = async () => {
    if (!isFormValid() || !user) return;
    
    setLoadingSondeo(true);
    setError('');
    
    try {
      // Preparar contexto de monitoreos si está seleccionado
      let contextoMonitoreos = {};
      if (selectedContexts.includes('monitoreos') && selectedMonitoreos.length > 0) {
        const monitoreosSeleccionados = monitoreos.filter(m => selectedMonitoreos.includes(m.id));
        contextoMonitoreos = {
          monitoreos_seleccionados: monitoreosSeleccionados.map(m => ({
            id: m.id,
            titulo: m.generated_title || m.query_clean,
            herramienta: m.herramienta,
            categoria: m.categoria
          }))
        };
      }
      
      // Llamar al servicio de sondeo con todos los contextos
      const response = await sondearTemaService(
        input,
        selectedContexts,
        user.id,
        session?.access_token,
        selectedMonitoreos,
        selectedTrends,
        selectedNoticias,
        selectedCodex
      );
      
      // Procesar respuesta
      if (response) {
        setLlmResponse(response.llmResponse || 'No se obtuvo respuesta');
        setDatosAnalisis(response.datosAnalisis || null);
        setShowContext(true);
      }
    } catch (error) {
      console.error('Error en sondeo:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoadingSondeo(false);
    }
  };

  // Actualizar el componente MultiContextSelector para manejar la selección de monitoreos
  const handleContextChange = (contexts: string[]) => {
    setSelectedContexts(contexts);
    updateSelectedContexts(contexts);
  };
  
  const handleMonitoreosChange = (monitoreosIds: string[]) => {
    setSelectedMonitoreos(monitoreosIds);
  };

  const handleTrendsChange = (trends: string[]) => {
    setSelectedTrends(trends);
  };

  const renderVisualization = (question: any) => {
    if (!datosAnalisis) return null;

    // Transformar datos al formato esperado por los componentes
    const transformData = (rawData: any[]) => {
      if (!rawData || !Array.isArray(rawData)) return [];
      
      return rawData.map(item => ({
        name: item.tema || item.categoria || item.periodo || item.region || item.name,
        value: item.valor || item.value || 0
      }));
    };

    let data: Array<{ name: string; value: number }> = [];
    
    // Seleccionar datos según el contexto y tipo de gráfico
    if (selectedChartType === 'line' && datosAnalisis.evolucion_temporal) {
      data = transformData(datosAnalisis.evolucion_temporal);
    } else if (selectedChartType === 'pie' && datosAnalisis.distribucion_categorias) {
      data = transformData(datosAnalisis.distribucion_categorias);
    } else if (datosAnalisis.temas_relevantes) {
      data = transformData(datosAnalisis.temas_relevantes);
    } else if (datosAnalisis.distribucion_categorias) {
      data = transformData(datosAnalisis.distribucion_categorias);
    } else {
      data = [];
    }
    
    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <BarChart className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No hay datos disponibles para visualizar</p>
          </div>
        </div>
      );
    }
    
    switch (selectedChartType) {
      case 'bar':
        return <ModernBarChart data={data} height={300} gradient={true} glassmorphism={true} />;
      case 'line':
        return <ModernLineChart data={data} height={300} />;
      case 'pie':
        return <ModernPieChart data={data} height={300} showLegend={true} />;
      default:
        return <ModernBarChart data={data} height={300} gradient={true} glassmorphism={true} />;
    }
  };

  const isFormValid = () => {
    return input.trim().length >= 3 && selectedContexts.length > 0;
  };

  // Función específica para probar las gráficas de radar con mock data
  const cargarGraficasEjemplo = () => {
    const consulta = input || "análisis emocional de temas políticos";
    
    const datosRadar = {
      temas_relevantes: [
        { tema: 'Política Nacional', valor: 85 },
        { tema: 'Economía Local', valor: 72 },
        { tema: 'Educación', valor: 68 },
        { tema: 'Salud Pública', valor: 64 },
        { tema: 'Seguridad', valor: 58 }
      ],
      
      distribucion_categorias: [
        { categoria: 'Política', valor: 35 },
        { categoria: 'Economía', valor: 28 },
        { categoria: 'Social', valor: 22 },
        { categoria: 'Tecnología', valor: 15 }
      ],
      
      // Datos específicos para el radar chart de emociones y discurso
      evolucion_sentimiento: [
        {
          categoria: "Política",
          positivo: 35,
          neutral: 45,
          negativo: 20,
          discurso_informativo: 60,
          discurso_opinativo: 75,
          discurso_emocional: 45
        },
        {
          categoria: "Economía",
          positivo: 55,
          neutral: 30,
          negativo: 15,
          discurso_informativo: 80,
          discurso_opinativo: 40,
          discurso_emocional: 25
        },
        {
          categoria: "Social",
          positivo: 40,
          neutral: 35,
          negativo: 25,
          discurso_informativo: 50,
          discurso_opinativo: 60,
          discurso_emocional: 70
        },
        {
          categoria: "Tecnología",
          positivo: 65,
          neutral: 25,
          negativo: 10,
          discurso_informativo: 85,
          discurso_opinativo: 30,
          discurso_emocional: 20
        }
      ],
      
      cronologia_eventos: [
        { fecha: '2024-01-15', evento: 'Debate presidencial', impacto: 'Alto' },
        { fecha: '2024-01-10', evento: 'Reforma económica', impacto: 'Medio' },
        { fecha: '2024-01-05', evento: 'Protesta social', impacto: 'Alto' }
      ]
    };
    
    setDatosAnalisis(datosRadar);
    setLlmResponse(`🎯 Análisis Emocional y Tipos de Discurso - "${consulta}"\n\n📊 **Análisis completado con datos de ejemplo para radar chart**\n\nEste análisis multidimensional evalúa tanto las emociones como los tipos de discurso presentes en el contenido analizado:\n\n**Dimensiones Emocionales:**\n• Positivo (49%): Contenido optimista y propositivo\n• Neutral (34%): Información objetiva y balanceada\n• Negativo (17%): Críticas constructivas y preocupaciones\n\n**Tipos de Discurso:**\n• Informativo (69%): Basado en hechos y datos verificables\n• Opinativo (51%): Análisis y perspectivas personales\n• Emocional (40%): Contenido con carga emocional intensa\n\n**Insights por Categoría:**\n🏛️ **Política**: Alto componente opinativo, discurso emocional moderado\n💰 **Economía**: Predomina lo informativo, baja carga emocional\n👥 **Social**: Balance entre opiniones y emociones\n💻 **Tecnología**: Altamente informativo, mínima carga emocional\n\n**Recomendaciones:**\n1. Mantener el equilibrio entre información y emoción\n2. Aprovechar el tono positivo predominante\n3. Diversificar los tipos de expresión por tema\n4. Monitorear la evolución emocional por categorías`);
    setShowContext(true);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-900 to-blue-800 text-white border-b border-blue-700">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-grid-16" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-600/20 to-transparent" />
        
        <div className="relative py-16 px-6 lg:px-12">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
                <BarChart className="w-6 h-6 text-blue-200" />
                <span className="text-sm font-medium text-blue-100">Análisis Inteligente</span>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight flex items-center justify-center gap-4">
              Sondeos
              <span className="text-sm font-medium text-green-200 bg-green-800/30 border border-green-400/30 px-3 py-1 rounded-full">
                Experimental
              </span>
            </h1>
            
            <p className="text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
              Analiza tendencias, noticias y documentos con IA avanzada para obtener insights profundos y tomar decisiones informadas
            </p>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-blue-200">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-white" />
                <span>Análisis en tiempo real</span>
              </div>
              <div className="flex items-center gap-2">
                <Assessment className="w-4 h-4 text-white" />
                <span>Múltiples fuentes de datos</span>
              </div>
              <div className="flex items-center gap-2">
                <Analytics className="w-4 h-4 text-white" />
                <span>Visualizaciones dinámicas</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="py-12 px-6 lg:px-12 bg-gradient-to-b from-blue-50 to-white">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Column - Form & Controls */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Input Section */}
            <div className="bg-white rounded-2xl p-6 border border-blue-200 shadow-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                <SearchIcon className="w-5 h-5 text-blue-600" />
                Consulta de Análisis
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-2">
                    ¿Qué quieres analizar?
                  </label>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Escribe tu pregunta o tema de interés..."
                    className="w-full h-32 px-4 py-3 bg-blue-50/50 border border-blue-200 rounded-xl text-blue-900 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <div className="mt-2 text-xs text-blue-600">
                    {input.length}/500 caracteres
                  </div>
                </div>
              </div>
            </div>

            {/* Context Selector */}
            <div className="bg-white rounded-2xl p-6 border border-blue-200 shadow-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                <Tune className="w-5 h-5 text-blue-600" />
                Fuentes de Contexto
              </h3>
              
              <MultiContextSelector
                selectedContexts={selectedContexts}
                onContextChange={handleContextChange}
                onMonitoreosChange={handleMonitoreosChange}
                onTrendsChange={handleTrendsChange}
                onNoticiasChange={setSelectedNoticias}
                onCodexChange={setSelectedCodex}
                selectedMonitoreos={selectedMonitoreos}
                selectedTrends={selectedTrends}
                selectedNoticias={selectedNoticias}
                selectedCodex={selectedCodex}
                disabled={loadingSondeo}
              />
            </div>

            {/* Chart Controls */}
            <div className="bg-white rounded-2xl p-6 border border-blue-200 shadow-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-blue-600" />
                Configuración Visual
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-2">
                    Tipo de visualización
                  </label>
                  <select 
                    value={selectedChartType}
                    onChange={(e) => setSelectedChartType(e.target.value as 'bar' | 'line' | 'pie')}
                    className="w-full px-3 py-2 bg-blue-50/50 border border-blue-200 rounded-lg text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="bar">Gráfico de Barras</option>
                    <option value="line">Gráfico de Líneas</option>
                    <option value="pie">Gráfico Circular</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-2">
                    Período de análisis
                  </label>
                  <select 
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="w-full px-3 py-2 bg-blue-50/50 border border-blue-200 rounded-lg text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="last-7-days">Últimos 7 días</option>
                    <option value="last-30-days">Últimos 30 días</option>
                    <option value="last-90-days">Últimos 90 días</option>
                    <option value="custom">Período personalizado</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Progress Indicator */}
            {loadingSondeo && (
              <div className="bg-white rounded-2xl p-6 border border-blue-200 shadow-lg">
                <SondeoProgressIndicator
                  isLoading={loadingSondeo}
                  currentStep={currentStep}
                  progress={progress}
                  selectedContexts={selectedContexts}
                  error={error}
                  variant="steps"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={procesarSondeo}
                disabled={loading || loadingSondeo || !isFormValid()}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-300 disabled:to-blue-400 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50"
              >
                <SearchIcon className="w-5 h-5" />
                {loadingSondeo ? 'Analizando...' : 'Iniciar Análisis'}
              </button>
              
              {/* Botón de Radar Chart */}
              <button
                onClick={cargarGraficasEjemplo}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-medium py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/25"
              >
                <Assessment className="w-5 h-5" />
                🎯 Prueba Radar Chart
              </button>
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* AI Response */}
            {llmResponse && (
              <div className="bg-white rounded-2xl p-6 border border-blue-200 shadow-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                  <Insights className="w-5 h-5 text-blue-600" />
                  Análisis de IA
                </h3>
                
                <AIResponseDisplay
                  response={llmResponse}
                  contexts={selectedContexts}
                  contextData={contexto}
                  onContextToggle={() => setShowContext(v => !v)}
                  showContext={showContext}
                  sources={llmSources}
                  loading={loadingSondeo}
                />
              </div>
            )}

            {/* Main Chart */}
            <div className="bg-white rounded-2xl p-6 border border-blue-200 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                  <BarChart className="w-5 h-5 text-blue-600" />
                  Visualización Principal
                </h3>
                <button className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors border border-blue-200">
                  <DownloadIcon className="w-4 h-4" />
                  Exportar
                </button>
              </div>

              <div className="h-80 bg-blue-50/30 rounded-xl border border-blue-200 flex items-center justify-center">
                {datosAnalisis ? (
                  renderVisualization(null)
                ) : (
                  <div className="text-center text-blue-600">
                    <BarChart className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">Esperando análisis</p>
                    <p className="text-sm">Configure su consulta y presione "Iniciar Análisis"</p>
                  </div>
                )}
              </div>
            </div>

            {/* Secondary Charts Grid */}
            {datosAnalisis && (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-blue-200 shadow-lg">
                  <h4 className="text-md font-semibold text-blue-900 mb-4 flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-blue-600" />
                    Distribución por Categorías
                  </h4>
                  <div className="h-64">
                    <ModernPieChart 
                      data={(() => {
                        const rawData = datosAnalisis.distribucion_categorias || datosAnalisis.temas_relevantes || [];
                        return rawData.map((item: any) => ({
                          name: item.categoria || item.tema || item.name,
                          value: item.valor || item.value || 0
                        }));
                      })()} 
                      height={240} 
                      showLegend={true} 
                    />
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-blue-200 shadow-lg">
                  <h4 className="text-md font-semibold text-blue-900 mb-4 flex items-center gap-2">
                    <Timeline className="w-4 h-4 text-blue-600" />
                    Evolución Temporal
                  </h4>
                  <div className="h-64">
                    <ModernLineChart 
                      data={(() => {
                        const rawData = datosAnalisis.evolucion_temporal || datosAnalisis.temas_relevantes || [];
                        return rawData.map((item: any) => ({
                          name: item.periodo || item.tema || item.name,
                          value: item.valor || item.value || 0
                        }));
                      })()} 
                      height={240} 
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Advanced Analytics Section */}
        {datosAnalisis && (() => {
          console.log('🎯 Debug SondeosFullPage - Advanced Analytics:', {
            tieneEvolucionSentimiento: !!datosAnalisis.evolucion_sentimiento,
            tieneCronologiaEventos: !!datosAnalisis.cronologia_eventos,
            contextType: getContextType(selectedContexts[0]),
            todasLasKeys: Object.keys(datosAnalisis)
          });
          return (
            <div className="mt-12 grid lg:grid-cols-2 gap-8">
              {/* Radar Chart - Análisis Emocional y Tipos de Discurso */}
              {datosAnalisis.evolucion_sentimiento ? (
                <div className="bg-white rounded-2xl p-6 border border-blue-200 shadow-lg">
                  <SentimentAreaChart
                    data={datosAnalisis.evolucion_sentimiento}
                    height={400}
                    title="Análisis Emocional y Tipos de Discurso"
                    contextType={getContextType(selectedContexts[0])}
                  />
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-6 border border-blue-200 shadow-lg">
                  <div className="text-center text-gray-400 py-12">
                    🎯 Gráfico radar no disponible
                    <br />
                    <small>Usa el botón "🎯 Prueba Radar Chart" para ver un ejemplo</small>
                  </div>
                </div>
              )}

              {/* Storytelling Timeline */}
              {datosAnalisis.cronologia_eventos ? (
                <div className="bg-white rounded-2xl p-6 border border-blue-200 shadow-lg">
                  <StorytellingChart
                    events={datosAnalisis.cronologia_eventos}
                    title="Cronología de Eventos"
                    contextType={getContextType(selectedContexts[0])}
                    maxEvents={3}
                  />
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-6 border border-blue-200 shadow-lg">
                  <div className="text-center text-gray-400 py-12">
                    📖 Cronología de eventos no disponible
                    <br />
                    <small>Datos cronológicos aparecerán aquí cuando estén disponibles</small>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Historial de Sondeos */}
        {sondeos.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-blue-900">Historial de Análisis</h2>
              <span className="text-blue-700">{sondeos.length} análisis realizados</span>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sondeos.slice(0, 6).map((sondeo) => (
                <div key={sondeo.id} className="bg-white rounded-2xl p-6 border border-blue-200 hover:border-blue-400 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 shadow-lg">
                  <h4 className="font-semibold text-blue-900 mb-3 line-clamp-2">{sondeo.pregunta}</h4>
                  
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {sondeo.contextos_utilizados?.map((contexto, idx) => (
                      <span key={idx} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-md border border-blue-200">
                        {contexto}
                      </span>
                    ))}
                  </div>
                  
                  <p className="text-sm text-blue-700 mb-4 line-clamp-3">
                    {resumirTexto(sondeo.respuesta_llm, 120)}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-blue-600">
                    <span>{new Date(sondeo.created_at).toLocaleDateString('es-GT')}</span>
                    <button 
                      onClick={() => {
                        setInput(sondeo.pregunta);
                        setLlmResponse(sondeo.respuesta_llm);
                        setDatosAnalisis(sondeo.datos_analisis);
                        setSelectedContexts(sondeo.contextos_utilizados || []);
                        setShowContext(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 transition-colors font-medium"
                    >
                      Ver análisis →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Configuración */}
      <SondeoConfigModal
        open={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        selectedContexts={selectedContexts}
      />
    </div>
  );
};

export default SondeosFullPage; 