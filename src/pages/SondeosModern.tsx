"use client";

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  TrendingUp,
  LocationOn,
  Assessment,
  Search as SearchIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
  People,
  Percent,
  AttachMoney,
  Tune,
  ExpandMore,
  PieChart,
  ShowChart,
  Timeline
} from '@mui/icons-material';
import { getLatestNews, getCodexItemsByUser, getSondeosByUser } from '../services/supabase.ts';
import { sondearTema as sondearTemaService } from '../services/sondeos';
import { useAuth } from '../context/AuthContext';
import { NewsItem } from '../types';
import ModernBarChart from '../components/ui/ModernBarChart';
import ModernLineChart from '../components/ui/ModernLineChart';
import ModernPieChart from '../components/ui/ModernPieChart';
import SentimentAreaChart from '../components/ui/SentimentAreaChart'; // Radar chart
import MultiContextSelector from '../components/ui/MultiContextSelector';
import AIResponseDisplay from '../components/ui/AIResponseDisplay';
import SondeoConfigModal from '../components/ui/SondeoConfigModal';
import SondeoProgressIndicator from '../components/ui/SondeoProgressIndicator';
import { useSondeoConfig } from '../hooks/useSondeoConfig';
import { useSondeoForm } from '../hooks/useSondeoForm';
import { useI18n } from '../hooks/useI18n';
import { useLogRocketEvents } from '../hooks/useLogRocketEvents';

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
  if (!texto) return '';
  return texto.length > maxLen ? texto.slice(0, maxLen) + '...' : texto;
}

const SondeosModern: React.FC = () => {
  const { user, session } = useAuth();
  const { selectedContexts, setSelectedContexts, questions: dynamicQuestions } = useSondeoConfig();
  const { 
    validateSondeoReady, 
    getValidationMessage, 
    updateSelectedContexts, 
    updateInput,
    getValues 
  } = useSondeoForm();
  const { t, getErrorMessage } = useI18n();
  const { trackSondeoAction, trackError } = useLogRocketEvents();
  
  const [news, setNews] = useState<NewsItem[]>([]);
  const [codex, setCodex] = useState<any[]>([]);
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
  const [selectedMonitoreos, setSelectedMonitoreos] = useState<string[]>([]);
  const [selectedTrends, setSelectedTrends] = useState<string[]>([]);
  const [selectedNoticias, setSelectedNoticias] = useState<string[]>([]);
  const [selectedCodex, setSelectedCodex] = useState<string[]>([]);

  // Estados para la UI moderna
  const [selectedChartType, setSelectedChartType] = useState<'bar' | 'line' | 'pie'>('bar');
  const [selectedPeriod, setSelectedPeriod] = useState('last-7-days');

  // Las preguntas dinámicas ahora vienen del hook useSondeoConfig
  const currentQuestions = dynamicQuestions;
  
  // Función auxiliar para renderizar visualizaciones según la pregunta
  const renderVisualization = (question: any) => {
    if (!datosAnalisis || !question.dataKey || !datosAnalisis[question.dataKey]) {
      return (
        <div className="relative aspect-video flex items-center justify-center text-gray-400 text-sm">
          📊 Sondee un tema para ver análisis
        </div>
      );
    }

    const data = datosAnalisis[question.dataKey];
    const primaryContext = selectedContexts[0] || 'tendencias';
    
    let chartComponent = null;
    
    // Visualizaciones específicas según el tipo de contexto y pregunta
    if (primaryContext === 'tendencias') {
      switch (question.id) {
        case 1: // Temas relevantes
          chartComponent = (
            <ModernBarChart 
              data={data.map((item: any) => ({ name: item.tema, value: item.valor }))} 
              height={280} 
              gradient={true}
              glassmorphism={true}
            />
          );
          break;
          
        case 2: // Distribución por categorías
          chartComponent = (
            <ModernPieChart
              data={data.map((item: any) => ({ name: item.categoria, value: item.valor }))}
              height={280}
              showLegend={true}
            />
          );
          break;
          
        case 3: // Mapa de menciones
          chartComponent = (
            <ModernBarChart 
              data={data.map((item: any) => ({ name: item.region, value: item.valor }))}
              height={280}
              gradient={true}
              glassmorphism={true}
            />
          );
          break;
          
        case 4: // Subtemas relacionados
          chartComponent = (
            <ModernBarChart 
              data={data.map((item: any) => ({ name: item.subtema, value: item.relacion }))}
              height={280}
              gradient={true}
              glassmorphism={true}
            />
          );
          break;
      }
    } else if (primaryContext === 'noticias') {
      switch (question.id) {
        case 1: // Noticias más relevantes
          chartComponent = (
            <ModernBarChart 
              data={data.map((item: any) => ({ name: item.titulo, value: item.relevancia }))} 
              height={280} 
              gradient={true}
              glassmorphism={true}
            />
          );
          break;
          
        case 2: // Distribución por categorías de noticias
          chartComponent = (
            <ModernPieChart
              data={data.map((item: any) => ({ name: item.categoria, value: item.valor }))}
              height={280}
              showLegend={true}
            />
          );
          break;
          
        case 3: // Mapa de cobertura
          chartComponent = (
            <ModernBarChart 
              data={data.map((item: any) => ({ name: item.ubicacion, value: item.cobertura }))}
              height={280}
              gradient={true}
              glassmorphism={true}
            />
          );
          break;
          
        case 4: // Análisis emocional y tipos de discurso
          chartComponent = (
            <SentimentAreaChart 
              data={data}
              height={320}
              title="Análisis Emocional y Tipos de Discurso"
              contextType={primaryContext as any}
            />
          );
          break;
      }
    } else if (primaryContext === 'codex') {
      // Similar estructura para documentos del codex
      chartComponent = (
        <ModernBarChart 
          data={data.map((item: any) => ({ name: item.documento || item.name, value: item.relevancia || item.value }))} 
          height={280} 
          gradient={true}
          glassmorphism={true}
        />
      );
    }

    return chartComponent;
  };

  // Función para sondear tema usando el servicio
  const sondearTema = async () => {
    if (!user) return;
    
    const formValues = getValues();
    const currentInput = input || formValues.input;
    const currentContexts = selectedContexts.length > 0 ? selectedContexts : formValues.selectedContexts;
    
    const validationMessage = getValidationMessage();
    if (validationMessage || !currentInput || currentInput.trim().length < 3 || currentContexts.length === 0) {
      setError(validationMessage || 'Complete todos los campos requeridos');
      trackError('Validation Error', validationMessage || 'Complete todos los campos requeridos', 'sondeos');
      return;
    }
    
    trackSondeoAction('sondeo_started', currentContexts, currentInput, {
      questionLength: currentInput.length,
      contextsCount: currentContexts.length
    });
    
    setLlmResponse(null);
    setLlmSources(null);
    setDatosAnalisis(null);
    setShowContext(true);
    setLoadingSondeo(true);
    setError('');
    setProgress(0);
    
    try {
      setCurrentStep('preparing');
      setProgress(25);
      
      setCurrentStep('fetching');
      setProgress(50);
      
      const result = await sondearTemaService(
        currentInput,
        currentContexts,
        user.id,
        session?.access_token,
        selectedMonitoreos,
        selectedTrends,
        selectedNoticias,
        selectedCodex
      );
      
      setCurrentStep('analyzing');
      setProgress(75);
      
      setCurrentStep('generating');
      setProgress(100);
      
      setContexto(result.contexto);
      setLlmResponse(result.llmResponse);
      setLlmSources(result.llmSources);
      setDatosAnalisis(result.datosAnalisis);
      
      trackSondeoAction('sondeo_completed', currentContexts, currentInput, {
        hasResponse: !!result.llmResponse,
        hasAnalysis: !!result.datosAnalisis,
        responseDuration: Date.now() - Date.now()
      });
      
    } catch (e: any) {
      console.error('❌ Error en sondearTema:', e);
      const errorMessage = e.message || e.toString() || getErrorMessage('sondeo');
      setError(errorMessage);
      
      trackError('Sondeo Error', errorMessage, 'sondeos', {
        contexts: currentContexts,
        questionLength: currentInput.length
      });
    } finally {
      setLoadingSondeo(false);
      setProgress(0);
      setCurrentStep('preparing');
    }
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    updateInput(value);
  };

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

  const isFormValid = () => {
    return input.trim().length >= 3 && selectedContexts.length > 0;
  };

  const generarDatosPrueba = (tipo: string, consulta: string) => {
    const datos: any = {
      conclusiones: {},
      metodologia: {},
    };

    // Simular diferentes tipos de datos según el contexto
    if (selectedContexts.includes('tendencias')) {
      datos.temas_relevantes = [
        { tema: 'Desarrollo económico', valor: 85 },
        { tema: 'Educación', valor: 72 },
        { tema: 'Salud pública', valor: 68 },
        { tema: 'Seguridad ciudadana', valor: 64 },
        { tema: 'Infraestructura', valor: 58 }
      ];
      
      datos.distribucion_categorias = [
        { categoria: 'Política', valor: 35 },
        { categoria: 'Economía', valor: 28 },
        { categoria: 'Social', valor: 22 },
        { categoria: 'Tecnología', valor: 15 }
      ];
      
      datos.mapa_menciones = [
        { region: 'Guatemala', valor: 45 },
        { region: 'Quetzaltenango', valor: 23 },
        { region: 'Escuintla', valor: 18 },
        { region: 'Huehuetenango', valor: 14 }
      ];
      
      datos.subtemas_relacionados = [
        { subtema: 'Inversión extranjera', relacion: 78 },
        { subtema: 'Emprendimiento local', relacion: 65 },
        { subtema: 'Turismo sostenible', relacion: 52 },
        { subtema: 'Agricultura tecnificada', relacion: 48 }
      ];
    }

    if (selectedContexts.includes('noticias')) {
      datos.noticias_relevantes = [
        { titulo: 'Nueva política económica', relevancia: 92 },
        { titulo: 'Inversión en infraestructura', relevancia: 78 },
        { titulo: 'Programas sociales', relevancia: 65 },
        { titulo: 'Reforma educativa', relevancia: 58 }
      ];
      
      datos.categorias_noticias = [
        { categoria: 'Economía', valor: 40 },
        { categoria: 'Política', valor: 30 },
        { categoria: 'Social', valor: 20 },
        { categoria: 'Internacional', valor: 10 }
      ];
      
      datos.mapa_cobertura = [
        { ubicacion: 'Ciudad de Guatemala', cobertura: 68 },
        { ubicacion: 'Antigua Guatemala', cobertura: 45 },
        { ubicacion: 'Xela', cobertura: 32 },
        { ubicacion: 'Cobán', cobertura: 28 }
      ];
      
      datos.analisis_sentimiento = [
        {
          categoria: "Tendencias Actuales",
          positivo: 45,
          neutral: 35,
          negativo: 20,
          discurso_informativo: 65,
          discurso_opinativo: 30,
          discurso_emocional: 40
        },
        {
          categoria: "Noticias Relevantes",
          positivo: 55,
          neutral: 30,
          negativo: 15,
          discurso_informativo: 80,
          discurso_opinativo: 40,
          discurso_emocional: 25
        },
        {
          categoria: "Análisis de Codex",
          positivo: 40,
          neutral: 40,
          negativo: 20,
          discurso_informativo: 75,
          discurso_opinativo: 60,
          discurso_emocional: 30
        }
      ];
    }

    return datos;
  };

  const cargarDatosDemostracion = () => {
    const consulta = input || "desarrollo económico sostenible";
    const datosPrueba = generarDatosPrueba("demostración", consulta);
    setDatosAnalisis(datosPrueba);
    setLlmResponse(`Análisis completado para: "${consulta}"\n\nBasado en el contexto seleccionado (${selectedContexts.join(', ')}), se identificaron patrones relevantes en los datos disponibles. Los resultados muestran tendencias significativas que pueden informar la toma de decisiones estratégicas.\n\nPuntos clave:\n• Alta correlación con temas de interés público\n• Distribución geográfica concentrada en áreas urbanas\n• Evolución temporal positiva en los últimos meses\n• Oportunidades de mejora en cobertura rural\n\nRecomendaciones:\n1. Fortalecer iniciativas en regiones con menor cobertura\n2. Aprovechar el momentum actual en tendencias\n3. Integrar perspectivas multi-sectoriales\n4. Monitorear evolución a mediano plazo`);
    setShowContext(true);
  };

  // Función específica para probar las gráficas de radar con mock data (ADMIN ONLY)
  const cargarGraficasEjemplo = () => {
    const consulta = input || "análisis emocional de temas políticos";
    
    const datosRadar = {
      ...generarDatosPrueba("radar_demo", consulta),
      
      // Datos específicos para el radar chart con más variación
      analisis_sentimiento: [
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
      ]
    };
    
    setDatosAnalisis(datosRadar);
    setLlmResponse(`🎯 Análisis Emocional y Tipos de Discurso - "${consulta}"\n\n📊 **Análisis completado con datos de ejemplo para radar chart**\n\nEste análisis multidimensional evalúa tanto las emociones como los tipos de discurso presentes en el contenido analizado:\n\n**Dimensiones Emocionales:**\n• Positivo (49%): Contenido optimista y propositivo\n• Neutral (34%): Información objetiva y balanceada\n• Negativo (17%): Críticas constructivas y preocupaciones\n\n**Tipos de Discurso:**\n• Informativo (69%): Basado en hechos y datos verificables\n• Opinativo (51%): Análisis y perspectivas personales\n• Emocional (40%): Contenido con carga emocional intensa\n\n**Insights por Categoría:**\n🏛️ **Política**: Alto componente opinativo, discurso emocional moderado\n💰 **Economía**: Predomina lo informativo, baja carga emocional\n👥 **Social**: Balance entre opiniones y emociones\n💻 **Tecnología**: Altamente informativo, mínima carga emocional\n\n**Recomendaciones:**\n1. Mantener el equilibrio entre información y emoción\n2. Aprovechar el tono positivo predominante\n3. Diversificar los tipos de expresión por tema\n4. Monitorear la evolución emocional por categorías`);
    setShowContext(true);
  };

  // Cargar datos iniciales
  useEffect(() => {
    if (!user?.email) return;
    
    setLoading(true);
    
    Promise.all([
      getLatestNews(),
      getCodexItemsByUser(user.id)
    ])
      .then(([newsData, codexData]) => {
        console.log('📊 Datos cargados:', { news: newsData?.length || 0, codex: codexData?.length || 0 });
        setNews(newsData || []);
        setCodex(codexData || []);
      })
      .catch((error) => {
        console.error('❌ Error cargando datos:', error);
        setNews([]);
        setCodex([]);
      })
      .finally(() => setLoading(false));
  }, [user]);

  // Cargar historial de sondeos del usuario
  useEffect(() => {
    if (!user?.email) return;
    setLoadingSondeos(true);
    getSondeosByUser(user.email)
      .then((data) => {
        console.log('📊 Sondeos cargados:', data?.length || 0);
        const mapped = (data || []).map((s: any) => ({
          id: s.id,
          pregunta: s.pregunta,
          respuesta_llm: s.respuesta_llm,
          datos_analisis: s.datos_analisis,
          contextos_utilizados: s.contextos_utilizados,
          created_at: s.created_at,
          creditos_utilizados: s.creditos_utilizados,
          modelo_ia: s.modelo_ia,
          tokens_utilizados: s.tokens_utilizados
        }));
        setSondeos(mapped);
      })
      .catch((error) => {
        console.error('❌ Error cargando sondeos:', error);
        setSondeos([]);
      })
      .finally(() => setLoadingSondeos(false));
  }, [user]);

  // Animaciones de entrada
  useEffect(() => {
    const elements = document.querySelectorAll('.animate-entry');
    elements.forEach((el, idx) => {
      setTimeout(() => {
        el.classList.remove('opacity-0', 'translate-y-8');
      }, 200 + idx * 120);
    });
  }, []);



  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 antialiased flex flex-col gap-16 py-12 px-6">
      
      {/* Header */}
      <header className="flex items-center justify-between max-w-7xl mx-auto w-full opacity-0 translate-y-8 transition-all duration-700 animate-entry">
        <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-3">
          <BarChart className="w-7 h-7 text-indigo-400" />
          Sondeos Inteligentes
        </h1>
        <button 
          onClick={() => setConfigModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 transition"
        >
          <ShareIcon className="w-4 h-4" />
          Configurar
        </button>
      </header>

      {/* Metric Cards */}


      {/* Editor & Charts */}
      <main className="max-w-7xl mx-auto w-full grid lg:grid-cols-5 gap-8">
        
        {/* Controls Sidebar */}
        <aside className="lg:col-span-2 flex flex-col gap-6 bg-gray-900/70 ring-1 ring-white/10 p-6 rounded-2xl backdrop-blur-lg shadow-lg animate-entry opacity-0 translate-y-8">
          <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2 mb-2">
            <Tune className="w-5 h-5 text-indigo-400" />
            Configuración de Sondeo
          </h2>

          {/* Search Input */}
          <div>
            <label htmlFor="searchInput" className="block text-sm text-gray-400 mb-2">Tema a sondear</label>
            <input
              id="searchInput"
              type="text"
              placeholder='Buscar tema (ej. "desarrollo económico")'
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              className="w-full rounded-lg bg-gray-800/60 py-2 px-3 text-sm font-medium ring-1 ring-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            />
            <p className="mt-1 text-xs text-gray-500">Describe el tema que quieres analizar en detalle.</p>
          </div>

          {/* Context Selector */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Contextos de análisis</label>
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
              disabled={loading || loadingSondeo}
            />
            <p className="mt-1 text-xs text-gray-500">Selecciona las fuentes de datos para el análisis.</p>
          </div>

          {/* Chart Type */}
          <div>
            <label htmlFor="chartType" className="block text-sm text-gray-400 mb-2">Tipo de visualización</label>
            <div className="relative">
              <select 
                id="chartType" 
                value={selectedChartType}
                onChange={(e) => setSelectedChartType(e.target.value as 'bar' | 'line' | 'pie')}
                className="w-full rounded-lg bg-gray-800/60 py-2 pl-3 pr-10 text-sm font-medium ring-1 ring-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 appearance-none"
              >
                <option value="bar">Gráfico de Barras</option>
                <option value="line">Gráfico de Líneas</option>
                <option value="pie">Gráfico Circular</option>
              </select>
              <ExpandMore className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
            </div>
          </div>

          {/* Period Selector */}
          <div>
            <label htmlFor="periodSelect" className="block text-sm text-gray-400 mb-2">Período de análisis</label>
            <div className="relative">
              <select 
                id="periodSelect"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full rounded-lg bg-gray-800/60 py-2 pl-3 pr-10 text-sm font-medium ring-1 ring-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 appearance-none"
              >
                <option value="last-7-days">Últimos 7 días</option>
                <option value="last-30-days">Últimos 30 días</option>
                <option value="last-90-days">Últimos 90 días</option>
                <option value="custom">Período personalizado</option>
              </select>
              <ExpandMore className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
            </div>
          </div>

          {/* Progress Indicator */}
          {loadingSondeo && (
            <div className="bg-gray-800/60 rounded-lg p-4 ring-1 ring-white/10">
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
              onClick={sondearTema}
              disabled={loading || loadingSondeo || !isFormValid()}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600/90 hover:bg-indigo-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              <SearchIcon className="w-4 h-4" />
              {loadingSondeo ? 'Sondeando...' : 'Sondear Tema'}
            </button>
            
            <button
              onClick={cargarDatosDemostracion}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 transition"
            >
              <RefreshIcon className="w-4 h-4" />
              Datos Demo
            </button>
            
            {/* Botón de Radar Chart - Público */}
            <button
              onClick={cargarGraficasEjemplo}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium hover:bg-emerald-500/20 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 transition text-emerald-200"
            >
              <Assessment className="w-4 h-4" />
              🎯 Radar Chart
            </button>
          </div>
        </aside>

        {/* Main Chart Preview */}
        <section className="lg:col-span-3 flex flex-col gap-6 bg-gray-900/70 ring-1 ring-white/10 p-6 rounded-2xl backdrop-blur-lg shadow-lg animate-entry opacity-0 translate-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
              <PieChart className="w-5 h-5 text-indigo-400" />
              Análisis Principal
            </h2>
            <button className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium hover:bg-white/10 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 transition">
              <DownloadIcon className="w-4 h-4" />
              Exportar
            </button>
          </div>

          {/* AI Response Display */}
          {llmResponse && (
            <div className="bg-gray-800/60 rounded-lg p-4 ring-1 ring-white/10 mb-4">
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

          {/* Chart Container */}
          <div className="relative aspect-video" id="main-chart">
            {datosAnalisis && currentQuestions.length > 0 ? (
              renderVisualization(currentQuestions[0])
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                <div className="text-center">
                  <PieChart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Configure un sondeo y presione "Sondear Tema" para ver resultados</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Extra Charts */}
      <section className="max-w-7xl mx-auto w-full grid lg:grid-cols-3 gap-8 animate-entry opacity-0 translate-y-8">
        {currentQuestions.slice(1, 4).map((question, index) => (
          <div key={question.id} className="flex flex-col gap-4 bg-gray-900/70 ring-1 ring-white/10 p-6 rounded-2xl backdrop-blur-lg shadow-lg">
            <h3 className="text-base font-semibold tracking-tight flex items-center gap-2">
              {index === 0 && <PieChart className="w-4 h-4 text-indigo-400" />}
              {index === 1 && <ShowChart className="w-4 h-4 text-indigo-400" />}
              {index === 2 && <Timeline className="w-4 h-4 text-indigo-400" />}
              Pregunta {question.id}
            </h3>
            <p className="text-xs text-gray-400 mb-2">{question.title}</p>
            <div className="relative aspect-square">
              {datosAnalisis ? (
                renderVisualization(question)
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 text-xs">
                  Esperando análisis...
                </div>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* Historial de Sondeos */}
      {sondeos.length > 0 && (
        <section className="max-w-7xl mx-auto w-full animate-entry opacity-0 translate-y-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold tracking-tight text-gray-100">Historial de Sondeos</h2>
            <span className="text-sm text-gray-400">{sondeos.length} sondeos realizados</span>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-6">
            {sondeos.slice(0, 6).map((sondeo) => (
              <div key={sondeo.id} className="bg-gray-900/70 ring-1 ring-white/10 p-4 rounded-xl backdrop-blur-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:ring-indigo-400/30">
                <h4 className="font-medium text-gray-100 mb-2 line-clamp-2">{sondeo.pregunta}</h4>
                
                <div className="flex gap-1 mb-3 flex-wrap">
                  {sondeo.contextos_utilizados?.map((contexto, idx) => (
                    <span key={idx} className="text-xs px-2 py-1 bg-indigo-600/20 text-indigo-300 rounded-md">
                      {contexto}
                    </span>
                  ))}
                </div>
                
                <p className="text-sm text-gray-400 mb-3 line-clamp-3">
                  {resumirTexto(sondeo.respuesta_llm, 120)}
                </p>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{new Date(sondeo.created_at).toLocaleDateString('es-GT')}</span>
                  <button 
                    onClick={() => {
                      setInput(sondeo.pregunta);
                      setLlmResponse(sondeo.respuesta_llm);
                      setDatosAnalisis(sondeo.datos_analisis);
                      setSelectedContexts(sondeo.contextos_utilizados || []);
                      setShowContext(true);
                    }}
                    className="text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Ver detalles →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Modal de Configuración */}
      <SondeoConfigModal
        open={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        selectedContexts={selectedContexts}
      />

      {/* Skip Link for Accessibility */}
      <a href="#main-chart" className="absolute -top-full left-4 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white focus:top-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 transition">
        Saltar al gráfico principal
      </a>
    </div>
  );
};

export default SondeosModern; 