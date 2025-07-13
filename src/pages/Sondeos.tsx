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
  MenuItem
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
  Timeline
} from '@mui/icons-material';
import { getLatestNews, getCodexItemsByUser, getSondeosByUser } from '../services/supabase.ts';
import { sendSondeoToExtractorW, getLatestTrends } from '../services/api';
import { sondearTema as sondearTemaService } from '../services/sondeos';
import { useAuth } from '../context/AuthContext';
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
import SentimentAreaChart from '../components/ui/SentimentAreaChart';
import MultiContextSelector from '../components/ui/MultiContextSelector';
import AIResponseDisplay from '../components/ui/AIResponseDisplay';
import SondeoConfigModal from '../components/ui/SondeoConfigModal';
import SondeoProgressIndicator from '../components/ui/SondeoProgressIndicator';
import { useSondeoConfig } from '../hooks/useSondeoConfig';
import { useSondeoForm } from '../hooks/useSondeoForm';
import { useI18n } from '../hooks/useI18n';
import { useLogRocketEvents } from '../hooks/useLogRocketEvents';
import CardSondeo from '../components/sondeos/CardSondeo';
import AnalisisGenerado from '../components/sondeos/AnalisisGenerado';

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

// Utilidad mejorada para buscar relevancia por palabras clave del input
function filtrarPorRelevancia(texto: string, input: string) {
  if (!texto || !input) return false;
  // Extraer palabras del input (ignorando signos y mayúsculas, y palabras cortas)
  const palabrasInput = input
    .toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .split(/\W+/)
    .filter(p => p.length >= 3); // Solo palabras de 3+ letras
  if (palabrasInput.length === 0) return false;
  const textoLower = texto.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  // Coincidencia: al menos una palabra del input está en el texto
  return palabrasInput.some(palabra => textoLower.includes(palabra));
}

function resumirTexto(texto: string, maxLen = 220) {
  if (!texto) return '';
  return texto.length > maxLen ? texto.slice(0, maxLen) + '...' : texto;
}

const Sondeos: React.FC = () => {
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
  const [loading, setLoading] = useState(false); // loading de datos iniciales
  const [loadingSondeo, setLoadingSondeo] = useState(false); // loading solo para el botón Sondear
  const [error, setError] = useState('');
  const [input, setInput] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);
  const [contexto, setContexto] = useState<any>(null);
  const [showContext, setShowContext] = useState(false);
  const [llmResponse, setLlmResponse] = useState<string | null>(null);
  const [llmSources, setLlmSources] = useState<any>(null);
  const [sondeos, setSondeos] = useState<SondeoHistorial[]>([]);
  const [loadingSondeos, setLoadingSondeos] = useState(false);
  const [selectedMonitoreos, setSelectedMonitoreos] = useState<string[]>([]);
  const [selectedTrends, setSelectedTrends] = useState<string[]>([]);
  
  // Nuevo estado para datos de visualización
  const [datosAnalisis, setDatosAnalisis] = useState<any>(null);
  
  // Estado para el modal de configuración
  const [configModalOpen, setConfigModalOpen] = useState(false);
  
  // Estados para el indicador de progreso
  const [currentStep, setCurrentStep] = useState<string>('preparing');
  const [progress, setProgress] = useState<number>(0);

  // Estados para la UI moderna
  const [selectedChartType, setSelectedChartType] = useState<'bar' | 'line' | 'pie'>('bar');
  const [selectedPeriod, setSelectedPeriod] = useState('last-7-days');

  // Opciones para el dropdown de contexto
  const opcionesContexto = [
    { value: 'tendencias', label: 'Tendencias actuales' },
    { value: 'noticias', label: 'Noticias recientes' },
    { value: 'codex', label: 'Documentos del Codex' },
  ];

  const questions = [
    {
      id: 1,
      title: '¿Qué temas preocupan más a las personas hoy?',
      icon: <TrendingUp />,
      description: 'Análisis de tendencias emergentes y preocupaciones ciudadanas',
      color: 'primary'
    },
    {
      id: 2,
      title: '¿Hay coherencia entre lo que se cubre y lo que se opina?',
      icon: <Assessment />,
      description: 'Comparación entre cobertura mediática y opinión pública',
      color: 'secondary'
    },
    {
      id: 3,
      title: '¿Dónde se están generando los focos de atención?',
      icon: <LocationOn />,
      description: 'Mapeo geográfico de tendencias y puntos de interés',
      color: 'success'
    },
    {
      id: 4,
      title: '¿Qué tan alineadas están las tendencias mediáticas con la agenda ciudadana?',
      icon: <BarChart />,
      description: 'Medición de sincronía entre medios y ciudadanía',
      color: 'warning'
    }
  ];

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
    
    // Función para obtener la conclusión y metodología
    const getInsights = (dataKey: string) => {
      const conclusiones = datosAnalisis.conclusiones || {};
      const metodologia = datosAnalisis.metodologia || {};
      
      return {
        conclusion: conclusiones[dataKey] || "Análisis completado exitosamente.",
        methodology: metodologia[dataKey] || "Datos procesados usando algoritmos de análisis avanzado."
      };
    };
    
    let chartComponent = null;
    let insights = null;
    
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
          insights = getInsights('temas_relevantes');
          break;
          
        case 2: // Distribución por categorías
          chartComponent = (
            <ModernPieChart
              data={data.map((item: any) => ({ name: item.categoria, value: item.valor }))}
              height={280}
              showLegend={true}
            />
          );
          insights = getInsights('distribucion_categorias');
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
          insights = getInsights('mapa_menciones');
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
          insights = getInsights('subtemas_relacionados');
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
          insights = getInsights('noticias_relevantes');
          break;
          
        case 2: // Distribución por categorías de noticias
          chartComponent = (
            <ModernPieChart
              data={data.map((item: any) => ({ name: item.categoria, value: item.valor }))}
              height={280}
              showLegend={true}
            />
          );
          insights = getInsights('categorias_noticias');
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
          insights = getInsights('mapa_cobertura');
          break;
          
        case 4: // Análisis de sentimiento
          chartComponent = (
            <ModernLineChart 
              data={data.map((item: any) => ({ name: item.fecha, value: item.sentimiento }))}
              height={280}
            />
          );
          insights = getInsights('analisis_sentimiento');
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
      insights = getInsights('documentos_codex');
    } else if (primaryContext === 'monitoreos') {
      switch (question.id) {
        case 1: // Análisis de sentimiento
          if (datosAnalisis.analisis_sentimiento) {
            chartComponent = (
              <ModernPieChart
                data={datosAnalisis.analisis_sentimiento.map((item: any) => ({ 
                  name: item.sentimiento, 
                  value: item.valor,
                  color: item.color 
                }))}
                height={280}
                showLegend={true}
              />
            );
          }
          insights = getInsights('analisis_sentimiento');
          break;
          
        case 2: // Evolución del sentimiento
          if (datosAnalisis.evolucion_sentimiento) {
            chartComponent = (
              <SentimentAreaChart
                data={datosAnalisis.evolucion_sentimiento}
                height={280}
                title="Evolución del Sentimiento a lo Largo del Tiempo"
              />
            );
          }
          insights = getInsights('evolucion_sentimiento');
          break;
          
        case 3: // Emociones detectadas
          if (datosAnalisis.emociones_detectadas) {
            chartComponent = (
              <ModernBarChart 
                data={datosAnalisis.emociones_detectadas.map((item: any) => ({ 
                  name: item.emocion, 
                  value: item.valor 
                }))} 
                height={280} 
                gradient={true}
                glassmorphism={true}
              />
            );
          }
          insights = getInsights('emociones_detectadas');
          break;
          
        case 4: // Intenciones comunicativas
          if (datosAnalisis.intenciones_comunicativas) {
            chartComponent = (
              <ModernPieChart
                data={datosAnalisis.intenciones_comunicativas.map((item: any) => ({ 
                  name: item.intencion, 
                  value: item.valor 
                }))}
                height={280}
                showLegend={true}
              />
            );
          }
          insights = getInsights('intenciones_comunicativas');
          break;
          
        case 5: // Engagement temporal
          if (datosAnalisis.engagement_temporal) {
            chartComponent = (
              <ModernLineChart 
                data={datosAnalisis.engagement_temporal.map((item: any) => ({ 
                  name: item.hora, 
                  value: item.engagement 
                }))}
                height={280}
                showArea={true}
              />
            );
          }
          insights = getInsights('engagement_temporal');
          break;
          
        default:
          // Fallback para monitoreos
          if (datosAnalisis.monitoreos_relevantes) {
            chartComponent = (
              <ModernBarChart 
                data={datosAnalisis.monitoreos_relevantes.map((item: any) => ({ 
                  name: item.titulo, 
                  value: item.relevancia 
                }))} 
                height={280} 
                gradient={true}
                glassmorphism={true}
              />
            );
          }
          insights = getInsights('monitoreos_relevantes');
          break;
      }
    }

    return chartComponent;
  };

  // Función para sondear tema usando el servicio
  const sondearTema = async () => {
    if (!user) return;
    
    // Obtener valores actuales del hook de validación
    const formValues = getValues();
    const currentInput = input || formValues.input;
    const currentContexts = selectedContexts.length > 0 ? selectedContexts : formValues.selectedContexts;
    
    // Validar antes de proceder
    const validationMessage = getValidationMessage();
    if (validationMessage || !currentInput || currentInput.trim().length < 3 || currentContexts.length === 0) {
      setError(validationMessage || 'Complete todos los campos requeridos');
      trackError('Validation Error', validationMessage || 'Complete todos los campos requeridos', 'sondeos');
      return;
    }
    
    // Track inicio de sondeo
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
      // Paso 1: Preparando contexto
      setCurrentStep('preparing');
      setProgress(25);
      
      // Paso 2: Obteniendo datos
      setCurrentStep('fetching');
      setProgress(50);
      
      const result = await sondearTemaService(
        currentInput,
        currentContexts,
        user.id,
        session?.access_token
      );
      
      // Paso 3: Analizando con IA
      setCurrentStep('analyzing');
      setProgress(75);
      
      // Paso 4: Generando visualizaciones
      setCurrentStep('generating');
      setProgress(100);
      
      setContexto(result.contexto);
      setLlmResponse(result.llmResponse);
      setLlmSources(result.llmSources);
      setDatosAnalisis(result.datosAnalisis);
      
      // Track sondeo exitoso
      trackSondeoAction('sondeo_completed', currentContexts, currentInput, {
        hasResponse: !!result.llmResponse,
        hasAnalysis: !!result.datosAnalisis,
        responseDuration: Date.now() - Date.now() // Esto se podría mejorar con timestamp real
      });
      
    } catch (e: any) {
      console.error('❌ Error en sondearTema:', e);
      const errorMessage = e.message || e.toString() || getErrorMessage('sondeo');
      setError(errorMessage);
      
      // Track error en sondeo
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

  // Función para actualizar input y sincronizar con el hook
  const handleInputChange = (value: string) => {
    setInput(value);
    updateInput(value);
  };

  // Función para actualizar contextos y sincronizar con el hook
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
    // Generar datos de prueba basados en el tipo de contexto y consulta
    const datos: any = {
      conclusiones: {},
      metodologia: {},
      // ... resto de datos simulados
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
        { fecha: 'Ene', sentimiento: 65 },
        { fecha: 'Feb', sentimiento: 72 },
        { fecha: 'Mar', sentimiento: 58 },
        { fecha: 'Abr', sentimiento: 68 },
        { fecha: 'May', sentimiento: 75 },
        { fecha: 'Jun', sentimiento: 82 }
      ];
    }

    // Agregar metadatos adicionales
    datos.metadata = {
      tipo_analisis: tipo,
      consulta_original: consulta,
      contextos_utilizados: selectedContexts,
      timestamp: new Date().toISOString(),
      total_elementos: Object.keys(datos).length - 3, // Excluir conclusiones, metodologia y metadata
      confiabilidad: Math.floor(Math.random() * 30) + 70, // 70-100%
      fuentes_consultadas: selectedContexts.length * Math.floor(Math.random() * 5) + 10,
      tiempo_procesamiento: Math.floor(Math.random() * 3000) + 1000, // 1-4 segundos
    };

    // Generar conclusiones específicas por contexto
    if (selectedContexts.includes('tendencias')) {
      datos.conclusiones.temas_relevantes = `El análisis revela que ${consulta} está fuertemente correlacionado con las tendencias actuales, mostrando un 85% de relevancia en discusiones públicas.`;
      datos.metodologia.temas_relevantes = "Análisis de frecuencia de menciones y engagement en plataformas digitales durante los últimos 30 días.";
    }

    if (selectedContexts.includes('noticias')) {
      datos.conclusiones.noticias_relevantes = `La cobertura mediática de ${consulta} muestra un incremento del 45% en los últimos 7 días, con énfasis en aspectos económicos y sociales.`;
      datos.metodologia.noticias_relevantes = "Procesamiento de titulares y contenido de 15 medios nacionales usando análisis de sentimiento y relevancia semántica.";
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

  // Cargar datos iniciales
  useEffect(() => {
    if (!user?.email) return;
    
    setLoading(true);
    
    Promise.all([
      getLatestNews(20),
      getCodexItemsByUser(user.email, 10)
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
        // Mapear los datos de Supabase para mostrar el historial
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

  // Métricas calculadas
  const metrics = {
    totalSondeos: sondeos.length,
    creditosUsados: sondeos.reduce((sum, s) => sum + (s.creditos_utilizados || 0), 0),
    temasMasAnalizados: selectedContexts.length || 3,
    efectividad: Math.round((sondeos.filter(s => s.respuesta_llm).length / Math.max(sondeos.length, 1)) * 100)
  };

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
      <section className="max-w-7xl mx-auto w-full grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Sondeos Realizados */}
        <article className="rounded-xl bg-gray-900/70 ring-1 ring-white/10 p-5 flex flex-col gap-3 backdrop-blur-lg shadow-md hover:shadow-lg hover:ring-indigo-400/30 transition focus-within:ring-indigo-400 outline-none animate-entry opacity-0 translate-y-8" tabIndex={0}>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">Sondeos</p>
            <Assessment className="w-5 h-5 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">{metrics.totalSondeos}</h2>
          <p className="text-xs text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            +{Math.max(0, metrics.totalSondeos - 3)} este mes
          </p>
        </article>

        {/* Contextos Activos */}
        <article className="rounded-xl bg-gray-900/70 ring-1 ring-white/10 p-5 flex flex-col gap-3 backdrop-blur-lg shadow-md hover:shadow-lg hover:ring-indigo-400/30 transition focus-within:ring-indigo-400 outline-none animate-entry opacity-0 translate-y-8" tabIndex={0}>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">Contextos</p>
            <People className="w-5 h-5 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">{metrics.temasMasAnalizados}</h2>
          <p className="text-xs text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            +2 nuevos disponibles
          </p>
        </article>

        {/* Efectividad */}
        <article className="rounded-xl bg-gray-900/70 ring-1 ring-white/10 p-5 flex flex-col gap-3 backdrop-blur-lg shadow-md hover:shadow-lg hover:ring-indigo-400/30 transition focus-within:ring-indigo-400 outline-none animate-entry opacity-0 translate-y-8" tabIndex={0}>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">Efectividad</p>
            <Percent className="w-5 h-5 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">{metrics.efectividad}%</h2>
          <p className="text-xs text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            +5.1% este mes
          </p>
        </article>

        {/* Créditos Utilizados */}
        <article className="rounded-xl bg-gray-900/70 ring-1 ring-white/10 p-5 flex flex-col gap-3 backdrop-blur-lg shadow-md hover:shadow-lg hover:ring-indigo-400/30 transition focus-within:ring-indigo-400 outline-none animate-entry opacity-0 translate-y-8" tabIndex={0}>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">Créditos</p>
            <AttachMoney className="w-5 h-5 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">{metrics.creditosUsados}</h2>
          <p className="text-xs text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Optimizado este mes
          </p>
        </article>
      </section>

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
          <div className="relative aspect-video">
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

export default Sondeos; 