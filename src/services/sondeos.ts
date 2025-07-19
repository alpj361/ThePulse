import { getLatestTrends, sendSondeoToExtractorW } from './api';
import { getLatestNews, getCodexItemsByUser } from './supabase.ts';
import { getRecentScrapes, getRecentScrapeById, RecentScrape } from './recentScrapes';
import type { NewsItem } from '../types';
import { supabase } from './supabase';

// Utilidad para filtrar por relevancia
function filtrarPorRelevancia(texto: string, input: string): boolean {
  if (!texto || !input) return false;
  const palabrasInput = input
    .toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .split(/\W+/)
    .filter(p => p.length >= 3);
  if (palabrasInput.length === 0) return false;
  const textoLower = texto.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  return palabrasInput.some(palabra => textoLower.includes(palabra));
}

// Utilidad para resumir texto
function resumirTexto(texto: string, maxLen = 220): string {
  if (!texto) return '';
  return texto.length > maxLen ? texto.slice(0, maxLen) + '...' : texto;
}

// Generar datos de prueba para visualizaciones
export function generarDatosPrueba(tipo: string, consulta: string) {
  console.log('🎨 Generando datos de prueba para:', { tipo, consulta });
  
  // Datos mejorados para tendencias con etiquetas más cortas y respuestas conclusivas
  if (tipo === 'tendencias') {
    const datosGenerados = {
      temas_relevantes: [
        { tema: "Política", valor: 85, descripcion: "Impacto en políticas públicas nacionales" },
        { tema: "Economía", valor: 67, descripcion: "Efectos en el desarrollo económico regional" },
        { tema: "Internacional", valor: 54, descripcion: "Relaciones y cooperación internacional" },
        { tema: "Tecnología", valor: 42, descripcion: "Innovación y transformación digital" },
        { tema: "Cultura", valor: 38, descripcion: "Expresiones culturales y sociales" }
      ],
      distribucion_categorias: [
        { categoria: 'Política', valor: 35 },
        { categoria: 'Economía', valor: 28 },
        { categoria: 'Internacional', valor: 17 },
        { categoria: 'Tecnología', valor: 12 },
        { categoria: 'Cultura', valor: 8 }
      ],
      mapa_menciones: [
        { region: 'Guatemala', valor: 48 },
        { region: 'Zona Metro', valor: 35 },
        { region: 'Occidente', valor: 25 },
        { region: 'Oriente', valor: 18 },
        { region: 'Norte', valor: 12 }
      ],
      subtemas_relacionados: [
        { subtema: 'Financiamiento', relacion: 85 },
        { subtema: 'Regulación', relacion: 72 },
        { subtema: 'Sostenibilidad', relacion: 64 },
        { subtema: 'Impacto Social', relacion: 53 },
        { subtema: 'Inversión', relacion: 47 }
      ],
      // Nuevos datos para gráfico de sentimientos
      evolucion_sentimiento: [
        { tiempo: 'Lun', positivo: 45, neutral: 30, negativo: 25, fecha: '2024-01-01', evento: 'Inicio de análisis' },
        { tiempo: 'Mar', positivo: 38, neutral: 35, negativo: 27, fecha: '2024-01-02' },
        { tiempo: 'Mié', positivo: 52, neutral: 28, negativo: 20, fecha: '2024-01-03', evento: 'Anuncio oficial' },
        { tiempo: 'Jue', positivo: 48, neutral: 32, negativo: 20, fecha: '2024-01-04' },
        { tiempo: 'Vie', positivo: 55, neutral: 25, negativo: 20, fecha: '2024-01-05' },
        { tiempo: 'Sab', positivo: 42, neutral: 33, negativo: 25, fecha: '2024-01-06' },
        { tiempo: 'Dom', positivo: 40, neutral: 35, negativo: 25, fecha: '2024-01-07' }
      ],
      // Nuevos datos para storytelling
      cronologia_eventos: [
        {
          id: '1',
          fecha: '2024-01-03',
          titulo: `Anuncio oficial sobre ${consulta}`,
          descripcion: `Las autoridades competentes realizaron un anuncio oficial sobre ${consulta}, estableciendo las bases para las próximas acciones gubernamentales en esta materia.`,
          impacto: 'alto' as const,
          categoria: 'politica' as const,
          sentimiento: 'positivo' as const,
          keywords: ['anuncio', 'oficial', 'gobierno', consulta],
          fuentes: ['Presidencia de la República', 'Diario de Centro América', 'Prensa Libre']
        },
        {
          id: '2',
          fecha: '2024-01-05',
          titulo: `Reacciones ciudadanas a ${consulta}`,
          descripcion: `La ciudadanía guatemalteca ha expresado diversas opiniones sobre ${consulta} en redes sociales y medios de comunicación, mostrando un interés creciente en el tema.`,
          impacto: 'medio' as const,
          categoria: 'social' as const,
          sentimiento: 'neutral' as const,
          keywords: ['ciudadanía', 'opiniones', 'redes sociales', consulta],
          fuentes: ['Twitter Guatemala', 'Facebook público', 'Encuestas locales']
        },
        {
          id: '3',
          fecha: '2024-01-07',
          titulo: `Análisis económico de ${consulta}`,
          descripcion: `Expertos económicos han evaluado el impacto potencial de ${consulta} en la economía nacional, proyectando efectos a mediano y largo plazo.`,
          impacto: 'alto' as const,
          categoria: 'economia' as const,
          sentimiento: 'positivo' as const,
          keywords: ['economía', 'impacto', 'expertos', 'proyecciones', consulta],
          fuentes: ['BANGUAT', 'CACIF', 'Universidad del Valle']
        }
      ],
      // Respuestas conclusivas para cada gráfico
      conclusiones: {
        temas_relevantes: `Los temas relacionados con ${consulta} muestran mayor relevancia en el ámbito político (85%) y económico (67%), indicando que este tema tiene un impacto significativo en las decisiones gubernamentales y el desarrollo económico del país.`,
        distribucion_categorias: `La distribución por categorías revela que ${consulta} se concentra principalmente en Política (35%) y Economía (28%), representando el 63% de toda la conversación, lo que sugiere una alta prioridad en la agenda nacional.`,
        mapa_menciones: `Geográficamente, ${consulta} tiene mayor resonancia en Guatemala capital (48%) y la Zona Metropolitana (35%), concentrando el 83% de las menciones en el área central del país.`,
        subtemas_relacionados: `Los subtemas más relacionados son Financiamiento (85%) y Regulación (72%), indicando que ${consulta} requiere principalmente atención en aspectos económicos y marco normativo.`,
        evolucion_sentimiento: `El análisis de sentimiento muestra una tendencia positiva hacia ${consulta}, con un pico de aprobación (55%) el viernes tras el anuncio oficial, manteniendo un balance favorable en la opinión pública.`,
        cronologia_eventos: `La cronología de eventos sobre ${consulta} revela una secuencia coherente: anuncio oficial (impacto alto), reacciones ciudadanas (engagement medio) y análisis especializado (validación económica), mostrando un desarrollo orgánico del tema.`
      },
      // Información sobre cómo se obtuvo cada gráfica
      metodologia: {
        temas_relevantes: "Análisis de tendencias actuales filtradas por relevancia semántica y frecuencia de mención",
        distribucion_categorias: "Clasificación automática de contenido usando categorías predefinidas del sistema",
        mapa_menciones: "Geolocalización de menciones basada en datos de ubicación y referencias geográficas",
        subtemas_relacionados: "Análisis de co-ocurrencia y correlación semántica entre términos relacionados",
        evolucion_sentimiento: "Procesamiento de lenguaje natural para clasificación de sentimientos en tiempo real",
        cronologia_eventos: "Extracción y ordenamiento cronológico de eventos relevantes con análisis de impacto"
      }
    };
    
    console.log('✅ Datos de tendencias generados con keys:', Object.keys(datosGenerados));
    console.log('📊 Evolucion sentimiento incluido:', !!datosGenerados.evolucion_sentimiento);
    console.log('📖 Cronologia eventos incluida:', !!datosGenerados.cronologia_eventos);
    return datosGenerados;
  } 
  // Datos mejorados para noticias con etiquetas más cortas
  else if (tipo === 'noticias') {
    return {
      noticias_relevantes: [
        { titulo: `${consulta} - Impacto Nacional`, relevancia: 92, descripcion: "Análisis del impacto en desarrollo económico" },
        { titulo: `${consulta} - Políticas Nuevas`, relevancia: 87, descripcion: "Anuncio de nuevas políticas gubernamentales" },
        { titulo: `${consulta} - Comunidades`, relevancia: 76, descripcion: "Organización de comunidades rurales" },
        { titulo: `${consulta} - Perspectiva Internacional`, relevancia: 68, descripcion: "Debate de especialistas internacionales" },
        { titulo: `${consulta} - Futuro Guatemala`, relevancia: 61, descripcion: "Perspectivas a mediano y largo plazo" }
      ],
      fuentes_cobertura: [
        { fuente: 'Prensa Libre', cobertura: 32 },
        { fuente: 'Nuestro Diario', cobertura: 27 },
        { fuente: 'El Periódico', cobertura: 21 },
        { fuente: 'La Hora', cobertura: 15 },
        { fuente: 'Otros', cobertura: 5 }
      ],
      evolucion_cobertura: [
        { fecha: 'Ene', valor: 15 },
        { fecha: 'Feb', valor: 25 },
        { fecha: 'Mar', valor: 42 },
        { fecha: 'Abr', valor: 38 },
        { fecha: 'May', valor: 55 }
      ],
      aspectos_cubiertos: [
        { aspecto: 'Económico', cobertura: 65 },
        { aspecto: 'Político', cobertura: 58 },
        { aspecto: 'Social', cobertura: 47 },
        { aspecto: 'Legal', cobertura: 41 },
        { aspecto: 'Tecnológico', cobertura: 35 }
      ],
      conclusiones: {
        noticias_relevantes: `Las noticias sobre ${consulta} se enfocan principalmente en el impacto nacional (92%) y nuevas políticas (87%), mostrando alta cobertura mediática en temas de política pública.`,
        fuentes_cobertura: `Prensa Libre lidera la cobertura con 32%, seguido por Nuestro Diario (27%), concentrando el 59% de la información en estos dos medios principales.`,
        evolucion_cobertura: `La cobertura de ${consulta} ha mostrado un crecimiento sostenido, alcanzando su pico en mayo (55 menciones), indicando un interés mediático creciente.`,
        aspectos_cubiertos: `Los aspectos económicos dominan la cobertura (65%), seguidos por los políticos (58%), representando el enfoque principal de los medios en estos temas.`
      },
      metodologia: {
        noticias_relevantes: "Análisis de relevancia basado en frecuencia de mención, engagement y autoridad de la fuente",
        fuentes_cobertura: "Conteo de artículos por fuente mediática durante el período analizado",
        evolucion_cobertura: "Seguimiento temporal de menciones en medios digitales e impresos",
        aspectos_cubiertos: "Clasificación temática automática del contenido de las noticias"
      }
    };
  }
  else if (tipo === 'codex') {
    return {
      documentos_relevantes: [
        { titulo: `${consulta} - Análisis Estratégico`, relevancia: 95, descripcion: "Análisis integral para Guatemala" },
        { titulo: `${consulta} - Estudio Sectorial`, relevancia: 88, descripcion: "Estudio comparativo sectorial" },
        { titulo: `${consulta} - Marco Legal`, relevancia: 82, descripcion: "Políticas públicas y normativa" },
        { titulo: `${consulta} - Aspectos Institucionales`, relevancia: 75, descripcion: "Marco institucional guatemalteco" },
        { titulo: `${consulta} - Impacto Social`, relevancia: 68, descripcion: "Casos de estudio nacionales" }
      ],
      conceptos_relacionados: [
        { concepto: 'Desarrollo Sostenible', relacion: 78 },
        { concepto: 'Política Pública', relacion: 65 },
        { concepto: 'Participación Ciudadana', relacion: 59 },
        { concepto: 'Marco Regulatorio', relacion: 52 },
        { concepto: 'Innovación', relacion: 45 }
      ],
      evolucion_analisis: [
        { fecha: 'Q1', valor: 22 },
        { fecha: 'Q2', valor: 35 },
        { fecha: 'Q3', valor: 48 },
        { fecha: 'Q4', valor: 55 }
      ],
      aspectos_documentados: [
        { aspecto: 'Conceptual', profundidad: 82 },
        { aspecto: 'Casos de Estudio', profundidad: 75 },
        { aspecto: 'Comparativo', profundidad: 68 },
        { aspecto: 'Proyecciones', profundidad: 62 },
        { aspecto: 'Legal', profundidad: 55 }
      ],
      conclusiones: {
        documentos_relevantes: `Los documentos del codex sobre ${consulta} muestran alta relevancia en análisis estratégicos (95%) y estudios sectoriales (88%), indicando una base sólida de conocimiento especializado.`,
        conceptos_relacionados: `El concepto más relacionado es Desarrollo Sostenible (78%), seguido por Política Pública (65%), mostrando la orientación hacia sostenibilidad y gobernanza.`,
        evolucion_analisis: `El análisis ha evolucionado positivamente, creciendo de 22 a 55 documentos por trimestre, mostrando un interés académico y técnico creciente.`,
        aspectos_documentados: `Los aspectos conceptuales tienen mayor profundidad (82%), seguidos por casos de estudio (75%), indicando un enfoque teórico-práctico balanceado.`
      },
      metodologia: {
        documentos_relevantes: "Ranking basado en citaciones, autoridad del autor y relevancia temática",
        conceptos_relacionados: "Análisis de co-ocurrencia y proximidad semántica en el corpus documental",
        evolucion_analisis: "Conteo temporal de documentos agregados al codex por trimestre",
        aspectos_documentados: "Evaluación de profundidad basada en extensión y detalle del contenido"
      }
    };
  }
  
  return {
    datos_genericos: [
      { etiqueta: 'Categoría 1', valor: 85 },
      { etiqueta: 'Categoría 2', valor: 65 },
      { etiqueta: 'Categoría 3', valor: 45 },
      { etiqueta: 'Categoría 4', valor: 25 }
    ]
  };
}

// Función principal para sondear tema
export async function sondearTema(
  input: string,
  selectedContexts: string[],
  userId: string,
  accessToken?: string,
  selectedMonitoreos?: string[],
  selectedTrends?: string[],
  selectedNoticias?: string[],
  selectedCodex?: string[]
) {
  console.log('🎯 Iniciando sondearTema:', { input, selectedContexts, userId, hasToken: !!accessToken, monitoreosCount: selectedMonitoreos?.length });
  
  let contextoArmado: any = { 
    input,
    contextos_seleccionados: selectedContexts,
    tipo_contexto: selectedContexts.join('+')
  };
  
  try {
    // Obtener datos según los contextos seleccionados
    if (selectedContexts.includes('tendencias')) {
      let tendencias: string[] = [];
      let wordcloud: any[] = [];
      let about: any[] = [];

      if (selectedTrends && selectedTrends.length > 0) {
        tendencias = selectedTrends;
        console.log('📊 Usando tendencias seleccionadas por el usuario:', tendencias.length);
      } else {
        console.log('📊 Obteniendo tendencias automáticamente...');
        const tendenciasResp = await getLatestTrends();
        tendencias = tendenciasResp?.topKeywords?.map(k => k.keyword) || [];
        wordcloud = tendenciasResp?.wordCloudData || [];
        about = tendenciasResp?.about || [];
      }

      contextoArmado = {
        ...contextoArmado,
        tipo: 'tendencias',
        tema_consulta: input,
        tendencias,
        wordcloud,
        about
      };
    }
    
    // Obtener noticias si se seleccionó ese contexto
    if (selectedContexts.includes('noticias')) {
      console.log('📰 Obteniendo noticias...');
      const newsData = await getLatestNews();
      if (newsData && newsData.length > 0) {
        console.log('✅ Noticias obtenidas:', newsData.length);
        
        // Filtrar por relevancia y resumir contenido
        const noticiasRelevantes = newsData
          .filter(n => filtrarPorRelevancia(n.title + ' ' + (n.excerpt || ''), input))
          .map(n => ({
            titulo: n.title,
            contenido: resumirTexto(n.excerpt || '', 300),
            fuente: n.source,
            url: n.url,
            fecha: n.date
          }));
        
        contextoArmado = {
          ...contextoArmado,
          tipo: 'noticias',
          tema_consulta: input,
          noticias: noticiasRelevantes.slice(0, 5)
        };
      }
    }
    
    // Obtener documentos de codex si se seleccionó ese contexto
    if (selectedContexts.includes('codex')) {
      console.log('📚 Obteniendo documentos de codex...');
      const codexData = await getCodexItemsByUser(userId);
      if (codexData && codexData.length > 0) {
        console.log('✅ Documentos de codex obtenidos:', codexData.length);
        
        // Filtrar por relevancia y resumir contenido
        const documentosRelevantes = codexData
          .filter(d => filtrarPorRelevancia(d.title + ' ' + (d.content || ''), input))
          .map(d => ({
            titulo: d.title,
            contenido: resumirTexto(d.content || '', 300),
            tags: d.tags,
            fecha: d.created_at
          }));
        
        contextoArmado = {
          ...contextoArmado,
          tipo: 'codex',
          tema_consulta: input,
          documentos: documentosRelevantes.slice(0, 5)
        };
      }
    }
    
    // Obtener monitoreos si se seleccionó ese contexto
    if (selectedContexts.includes('monitoreos') && selectedMonitoreos && selectedMonitoreos.length > 0) {
      console.log('🔍 Obteniendo monitoreos seleccionados...');
      
      // Obtener detalles de los monitoreos seleccionados
      const monitoreosData: RecentScrape[] = [];
      for (const monitoreoId of selectedMonitoreos) {
        try {
          const monitoreoData = await getRecentScrapeById(monitoreoId);
          if (monitoreoData) {
            monitoreosData.push(monitoreoData);
          }
        } catch (error) {
          console.error(`Error obteniendo monitoreo ${monitoreoId}:`, error);
        }
      }
      
      if (monitoreosData.length > 0) {
        console.log('✅ Monitoreos obtenidos:', monitoreosData.length);
        
        // Preparar datos de monitoreos para el contexto
        const monitoreosFormateados = monitoreosData.map(m => ({
          id: m.id,
          titulo: m.generated_title || m.query_clean || m.query_original,
          consulta: m.query_original,
          herramienta: m.herramienta,
          categoria: m.categoria || 'General',
          fecha: m.created_at,
          tweet_count: m.tweet_count || 0
        }));
        
        contextoArmado = {
          ...contextoArmado,
          monitoreos: monitoreosFormateados
        };
      }
    }
    
    // Preparar contexto original con selecciones específicas
    const contextoOriginal = {
      ...contextoArmado,
      tendencias: selectedTrends || [],
      noticias: selectedNoticias || [],
      codex: selectedCodex || [],
      monitoreos: selectedMonitoreos || []
    };

    // Enviar sondeo a ExtractorW
    console.log('🚀 Enviando sondeo a ExtractorW con contexto:', Object.keys(contextoOriginal));
    console.log('📋 Selecciones específicas:', {
      tendencias: selectedTrends?.length || 0,
      noticias: selectedNoticias?.length || 0,
      codex: selectedCodex?.length || 0,
      monitoreos: selectedMonitoreos?.length || 0
    });
    const result = await sendSondeoToExtractorW(contextoOriginal, input, accessToken);
    
    // Procesar resultado
    // Log para debug
    console.log('🔍 Debug - Resultado de ExtractorW:', {
      tieneResultado: !!result?.resultado,
      tieneDatosVisualizacion: !!result?.resultado?.datos_visualizacion,
      tieneDatosAnalisisEnResultado: !!result?.resultado?.datos_analisis,
      tieneDatosAnalisis: !!result?.datos_analisis,
      keys: result ? Object.keys(result) : 'sin result',
      resultadoKeys: result?.resultado ? Object.keys(result.resultado) : 'sin resultado'
    });

    // Usar datos de prueba mejorados como fallback que incluyen los nuevos gráficos
    // El backend envía los datos de visualización en resultado.datos_analisis
    const datosAnalisisFinal = result?.resultado?.datos_analisis || 
                                result?.resultado?.datos_visualizacion || 
                                result?.datos_analisis || 
                                generarDatosPrueba(selectedContexts[0] || 'tendencias', input);

    console.log('📊 Datos de análisis finales:', {
      tieneEvolucionSentimiento: !!datosAnalisisFinal?.evolucion_sentimiento,
      tieneCronologiaEventos: !!datosAnalisisFinal?.cronologia_eventos,
      keys: datosAnalisisFinal ? Object.keys(datosAnalisisFinal) : 'sin datos'
    });

    return {
      contexto: contextoArmado,
      llmResponse: result?.resultado?.respuesta || result?.respuesta || 'No se obtuvo respuesta del servicio.',
      llmSources: result?.resultado?.fuentes || result?.fuentes || null,
      datosAnalisis: datosAnalisisFinal
    };
    
  } catch (error) {
    console.error('❌ Error en sondearTema:', error);
    throw error;
  }
}

export function generarDatosMejorados(tipo: string, consulta: string) {
  console.log(`📊 Generando datos mejorados para: ${consulta} (tipo: ${tipo})`);
  
  // Datos mejorados para tendencias con etiquetas más cortas y respuestas conclusivas
  if (tipo === 'tendencias') {
    return {
      temas_relevantes: [
        { tema: "Política", valor: 85, descripcion: "Impacto en políticas públicas nacionales" },
        { tema: "Economía", valor: 67, descripcion: "Efectos en el desarrollo económico regional" },
        { tema: "Internacional", valor: 54, descripcion: "Relaciones y cooperación internacional" },
        { tema: "Tecnología", valor: 42, descripcion: "Innovación y transformación digital" },
        { tema: "Cultura", valor: 38, descripcion: "Expresiones culturales y sociales" }
      ],
      distribucion_categorias: [
        { categoria: 'Política', valor: 35 },
        { categoria: 'Economía', valor: 28 },
        { categoria: 'Internacional', valor: 17 },
        { categoria: 'Tecnología', valor: 12 },
        { categoria: 'Cultura', valor: 8 }
      ],
      mapa_menciones: [
        { region: 'Guatemala', valor: 48 },
        { region: 'Zona Metro', valor: 35 },
        { region: 'Occidente', valor: 25 },
        { region: 'Oriente', valor: 18 },
        { region: 'Norte', valor: 12 }
      ],
      subtemas_relacionados: [
        { subtema: 'Financiamiento', relacion: 85 },
        { subtema: 'Regulación', relacion: 72 },
        { subtema: 'Sostenibilidad', relacion: 64 },
        { subtema: 'Impacto Social', relacion: 53 },
        { subtema: 'Inversión', relacion: 47 }
      ],
      // Datos de sentimiento para tendencias
      evolucion_sentimiento: [
        { tiempo: 'Lun', positivo: 45, neutral: 30, negativo: 25, fecha: '2024-01-01', evento: 'Inicio de tendencia' },
        { tiempo: 'Mar', positivo: 38, neutral: 35, negativo: 27, fecha: '2024-01-02' },
        { tiempo: 'Mié', positivo: 52, neutral: 28, negativo: 20, fecha: '2024-01-03', evento: 'Pico de popularidad' },
        { tiempo: 'Jue', positivo: 48, neutral: 32, negativo: 20, fecha: '2024-01-04' },
        { tiempo: 'Vie', positivo: 55, neutral: 25, negativo: 20, fecha: '2024-01-05' },
        { tiempo: 'Sab', positivo: 42, neutral: 33, negativo: 25, fecha: '2024-01-06' },
        { tiempo: 'Dom', positivo: 40, neutral: 35, negativo: 25, fecha: '2024-01-07' }
      ],
      // Cronología para tendencias
      cronologia_eventos: [
        {
          id: '1',
          fecha: '2024-01-03',
          titulo: `Emergencia de ${consulta} como tendencia`,
          descripcion: `La tendencia sobre ${consulta} comenzó a ganar tracción en redes sociales y medios digitales, alcanzando un nivel significativo de engagement ciudadano.`,
          impacto: 'alto' as const,
          categoria: 'social' as const,
          sentimiento: 'positivo' as const,
          keywords: ['tendencia', 'emergencia', 'digital', consulta],
          fuentes: ['Redes sociales', 'Medios digitales', 'Análisis de hashtags']
        },
        {
          id: '2',
          fecha: '2024-01-05',
          titulo: `Impacto mediático de ${consulta}`,
          descripcion: `Los medios tradicionales comenzaron a cubrir ${consulta}, amplificando su alcance y generando debate público sobre sus implicaciones.`,
          impacto: 'medio' as const,
          categoria: 'politica' as const,
          sentimiento: 'neutral' as const,
          keywords: ['medios', 'cobertura', 'debate', consulta],
          fuentes: ['Prensa nacional', 'Televisión', 'Radio']
        }
      ],
      // Respuestas conclusivas para cada gráfico
      conclusiones: {
        temas_relevantes: `Los temas relacionados con ${consulta} muestran mayor relevancia en el ámbito político (85%) y económico (67%), indicando que este tema tiene un impacto significativo en las decisiones gubernamentales y el desarrollo económico del país.`,
        distribucion_categorias: `La distribución por categorías revela que ${consulta} se concentra principalmente en Política (35%) y Economía (28%), representando el 63% de toda la conversación, lo que sugiere una alta prioridad en la agenda nacional.`,
        mapa_menciones: `Geográficamente, ${consulta} tiene mayor resonancia en Guatemala capital (48%) y la Zona Metropolitana (35%), concentrando el 83% de las menciones en el área central del país.`,
        subtemas_relacionados: `Los subtemas más relacionados son Financiamiento (85%) y Regulación (72%), indicando que ${consulta} requiere principalmente atención en aspectos económicos y marco normativo.`,
        evolucion_sentimiento: `El análisis de sentimiento sobre ${consulta} muestra una evolución positiva, con picos el miércoles (52%) y viernes (55%), indicando una recepción favorable en el desarrollo de la tendencia.`,
        cronologia_eventos: `La cronología revela que ${consulta} emergió como tendencia social antes de recibir cobertura mediática, mostrando un patrón orgánico de adopción que comenzó en redes sociales.`
      },
      metodologia: {
        temas_relevantes: "Análisis de tendencias actuales filtradas por relevancia semántica y frecuencia de mención",
        distribucion_categorias: "Clasificación automática de contenido usando categorías predefinidas del sistema",
        mapa_menciones: "Geolocalización de menciones basada en datos de ubicación y referencias geográficas",
        subtemas_relacionados: "Análisis de co-ocurrencia y correlación semántica entre términos relacionados",
        evolucion_sentimiento: "Procesamiento de lenguaje natural para clasificación de sentimientos en tiempo real",
        cronologia_eventos: "Extracción y ordenamiento cronológico de eventos relevantes con análisis de impacto"
      }
    };
  } 
  // Datos mejorados para noticias con etiquetas más cortas
  else if (tipo === 'noticias') {
    return {
      noticias_relevantes: [
        { titulo: `Impacto Nacional`, relevancia: 92, descripcion: "Análisis del impacto en desarrollo económico" },
        { titulo: `Políticas Nuevas`, relevancia: 87, descripcion: "Anuncio de nuevas políticas gubernamentales" },
        { titulo: `Comunidades`, relevancia: 76, descripcion: "Organización de comunidades rurales" },
        { titulo: `Perspectiva Internacional`, relevancia: 68, descripcion: "Debate de especialistas internacionales" },
        { titulo: `Futuro Guatemala`, relevancia: 61, descripcion: "Perspectivas a mediano y largo plazo" }
      ],
      fuentes_cobertura: [
        { fuente: 'Prensa Libre', cobertura: 32 },
        { fuente: 'Nuestro Diario', cobertura: 27 },
        { fuente: 'El Periódico', cobertura: 21 },
        { fuente: 'La Hora', cobertura: 15 },
        { fuente: 'Otros', cobertura: 5 }
      ],
      evolucion_cobertura: [
        { fecha: 'Ene', valor: 15 },
        { fecha: 'Feb', valor: 25 },
        { fecha: 'Mar', valor: 42 },
        { fecha: 'Abr', valor: 38 },
        { fecha: 'May', valor: 55 }
      ],
      aspectos_cubiertos: [
        { aspecto: 'Económico', cobertura: 65 },
        { aspecto: 'Político', cobertura: 58 },
        { aspecto: 'Social', cobertura: 47 },
        { aspecto: 'Legal', cobertura: 41 },
        { aspecto: 'Tecnológico', cobertura: 35 }
      ],
      conclusiones: {
        noticias_relevantes: `Las noticias sobre ${consulta} se enfocan principalmente en el impacto nacional (92%) y nuevas políticas (87%), mostrando alta cobertura mediática en temas de política pública.`,
        fuentes_cobertura: `Prensa Libre lidera la cobertura con 32%, seguido por Nuestro Diario (27%), concentrando el 59% de la información en estos dos medios principales.`,
        evolucion_cobertura: `La cobertura de ${consulta} ha mostrado un crecimiento sostenido, alcanzando su pico en mayo (55 menciones), indicando un interés mediático creciente.`,
        aspectos_cubiertos: `Los aspectos económicos dominan la cobertura (65%), seguidos por los políticos (58%), representando el enfoque principal de los medios en estos temas.`
      },
      metodologia: {
        noticias_relevantes: "Análisis de relevancia basado en frecuencia de mención, engagement y autoridad de la fuente",
        fuentes_cobertura: "Conteo de artículos por fuente mediática durante el período analizado",
        evolucion_cobertura: "Seguimiento temporal de menciones en medios digitales e impresos",
        aspectos_cubiertos: "Clasificación temática automática del contenido de las noticias"
      }
    };
  }
  else if (tipo === 'codex') {
    return {
      documentos_relevantes: [
        { titulo: `Análisis Estratégico`, relevancia: 95, descripcion: "Análisis integral para Guatemala" },
        { titulo: `Estudio Sectorial`, relevancia: 88, descripcion: "Estudio comparativo sectorial" },
        { titulo: `Marco Legal`, relevancia: 82, descripcion: "Políticas públicas y normativa" },
        { titulo: `Aspectos Institucionales`, relevancia: 75, descripcion: "Marco institucional guatemalteco" },
        { titulo: `Impacto Social`, relevancia: 68, descripcion: "Casos de estudio nacionales" }
      ],
      conceptos_relacionados: [
        { concepto: 'Desarrollo Sostenible', relacion: 78 },
        { concepto: 'Política Pública', relacion: 65 },
        { concepto: 'Participación Ciudadana', relacion: 59 },
        { concepto: 'Marco Regulatorio', relacion: 52 },
        { concepto: 'Innovación', relacion: 45 }
      ],
      evolucion_analisis: [
        { fecha: 'Q1', valor: 22 },
        { fecha: 'Q2', valor: 35 },
        { fecha: 'Q3', valor: 48 },
        { fecha: 'Q4', valor: 55 }
      ],
      aspectos_documentados: [
        { aspecto: 'Conceptual', profundidad: 82 },
        { aspecto: 'Casos de Estudio', profundidad: 75 },
        { aspecto: 'Comparativo', profundidad: 68 },
        { aspecto: 'Proyecciones', profundidad: 62 },
        { aspecto: 'Legal', profundidad: 55 }
      ],
      conclusiones: {
        documentos_relevantes: `Los documentos del codex sobre ${consulta} muestran alta relevancia en análisis estratégicos (95%) y estudios sectoriales (88%), indicando una base sólida de conocimiento especializado.`,
        conceptos_relacionados: `El concepto más relacionado es Desarrollo Sostenible (78%), seguido por Política Pública (65%), mostrando la orientación hacia sostenibilidad y gobernanza.`,
        evolucion_analisis: `El análisis ha evolucionado positivamente, creciendo de 22 a 55 documentos por trimestre, mostrando un interés académico y técnico creciente.`,
        aspectos_documentados: `Los aspectos conceptuales tienen mayor profundidad (82%), seguidos por casos de estudio (75%), indicando un enfoque teórico-práctico balanceado.`
      },
      metodologia: {
        documentos_relevantes: "Ranking basado en citaciones, autoridad del autor y relevancia temática",
        conceptos_relacionados: "Análisis de co-ocurrencia y proximidad semántica en el corpus documental",
        evolucion_analisis: "Conteo temporal de documentos agregados al codex por trimestre",
        aspectos_documentados: "Evaluación de profundidad basada en extensión y detalle del contenido"
      }
    };
  }
  // Datos mejorados para monitoreos de actividad reciente
  else if (tipo === 'monitoreos') {
    return {
      monitores_relevantes: [
        { nombre: `Análisis de ${consulta}`, valor: 92, descripcion: "Monitoreo completo de redes sociales" },
        { nombre: `Conversación sobre ${consulta}`, valor: 85, descripcion: "Análisis de conversación en Twitter" },
        { nombre: `Tendencias en ${consulta}`, valor: 78, descripcion: "Seguimiento de hashtags relacionados" },
        { nombre: `Menciones de ${consulta}`, valor: 72, descripcion: "Menciones en cuentas verificadas" },
        { nombre: `Impacto de ${consulta}`, valor: 65, descripcion: "Análisis de engagement y alcance" }
      ],
      distribucion_plataformas: [
        { plataforma: 'Twitter', valor: 45 },
        { plataforma: 'Facebook', valor: 28 },
        { plataforma: 'Instagram', valor: 15 },
        { plataforma: 'TikTok', valor: 12 }
      ],
      evolucion_menciones: [
        { fecha: 'Lun', valor: 35 },
        { fecha: 'Mar', valor: 42 },
        { fecha: 'Mie', valor: 38 },
        { fecha: 'Jue', valor: 65 },
        { fecha: 'Vie', valor: 78 },
        { fecha: 'Sab', valor: 52 },
        { fecha: 'Dom', valor: 45 }
      ],
      analisis_sentimiento: [
        { sentimiento: 'Positivo', valor: 38 },
        { sentimiento: 'Neutral', valor: 45 },
        { sentimiento: 'Negativo', valor: 17 }
      ],
      conclusiones: {
        monitores_relevantes: `Los monitoreos más relevantes sobre ${consulta} muestran un análisis completo (92%) y una conversación activa (85%), indicando un alto nivel de interés en el tema en redes sociales.`,
        distribucion_plataformas: `Twitter es la plataforma dominante (45%) para la conversación sobre ${consulta}, seguida por Facebook (28%), concentrando el 73% de las menciones en estas dos plataformas.`,
        evolucion_menciones: `Las menciones de ${consulta} alcanzaron su pico el viernes (78), mostrando un patrón de incremento hacia el fin de semana laboral y descenso durante el fin de semana.`,
        analisis_sentimiento: `El sentimiento predominante es neutral (45%), seguido por positivo (38%), con solo 17% de menciones negativas, indicando una recepción generalmente favorable del tema.`
      },
      metodologia: {
        monitores_relevantes: "Ranking basado en relevancia temática, engagement y alcance de los monitoreos",
        distribucion_plataformas: "Análisis de la distribución de menciones por plataforma de redes sociales",
        evolucion_menciones: "Seguimiento temporal de menciones durante la última semana",
        analisis_sentimiento: "Clasificación automática de sentimiento mediante procesamiento de lenguaje natural"
      }
    };
  }
  
  return {
    datos_genericos: [
      { etiqueta: 'Categoría 1', valor: 85 },
      { etiqueta: 'Categoría 2', valor: 65 },
      { etiqueta: 'Categoría 3', valor: 45 },
      { etiqueta: 'Categoría 4', valor: 25 }
    ]
  };
} 

// ================= PREVIEW DEL PROMPT =================
/**
 * Genera una vista previa del prompt y el contexto SIN llamar a GPT-4o.
 * Sólo funcionará si el usuario autenticado es admin. Devuelve los primeros caracteres del prompt
 * y estadísticas básicas del contexto para mostrar en un modal.
 */
export async function previewPrompt(
  input: string,
  selectedContexts: string[],
  userId: string,
  options: {
    selectedMonitoreos?: string[];
    selectedTrends?: string[];
    selectedNoticias?: string[];
    selectedCodex?: string[];
  } = {}
) {
  console.log('👁️  Solicitando vista previa de prompt:', { input, selectedContexts });

  // Obtener el token de autenticación
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;

  if (!token) {
    console.error('❌ No se encontró token de autenticación');
    throw new Error('No autorizado: Inicia sesión nuevamente');
  }

  const body: any = {
    pregunta: input,
    selectedContexts,
    configuracion: {
      revisar_contexto: true, // Flag que activa el modo preview en el backend
      detalle_nivel: 'alto',
      include_visualizaciones: false,
      ...options
    }
  };

  if (options.selectedMonitoreos?.length) {
    body.configuracion.contexto_original = {
      monitoreos: options.selectedMonitoreos
    };
  }
  if (options.selectedTrends?.length) {
    body.configuracion.contexto_original = {
      ...(body.configuracion.contexto_original || {}),
      tendencias: options.selectedTrends
    };
  }
  if (options.selectedNoticias?.length) {
    body.configuracion.contexto_original = {
      ...(body.configuracion.contexto_original || {}),
      noticias: options.selectedNoticias
    };
  }
  if (options.selectedCodex?.length) {
    body.configuracion.contexto_original = {
      ...(body.configuracion.contexto_original || {}),
      codex: options.selectedCodex
    };
  }

  try {
    const resp = await fetch('/api/sondeo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`  // Agregar token de autorización
      },
      body: JSON.stringify(body)
    });

    const responseText = await resp.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Error parseando respuesta:', responseText);
      throw new Error('Respuesta del servidor no es un JSON válido');
    }

    if (!resp.ok) {
      console.error('❌ Error solicitando preview:', data);
      
      // Manejar específicamente errores de autorización
      if (resp.status === 403 || resp.status === 401) {
        throw new Error('No tienes permisos para ver el preview. Requiere rol de administrador.');
      }
      
      // Usar mensaje de error del servidor si está disponible
      const errorMessage = data.message || 'Error solicitando vista previa de contexto';
      throw new Error(errorMessage);
    }

    // Validar que la respuesta contenga preview
    if (!data.preview) {
      console.warn('⚠️  La respuesta no contiene preview; podría no ser usuario admin');
      throw new Error('No se pudo generar el preview. Verifica tus permisos de administrador.');
    }
    
    return data;
  } catch (error) {
    console.error('Error en previewPrompt:', error);
    throw error;  // Re-lanzar para que el llamador pueda manejar el error
  }
} 