import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdmin } from '../hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../context/AuthContext';
import ExtractionViewer from '@/components/ui/ExtractionViewer';
import AgentEditor from '@/components/ui/AgentEditor';
import { LearningTab } from '../components/learning-tab';
import { 
  getPublicKnowledgeDocuments, 
  PublicKnowledgeDocument, 
  uploadPublicKnowledgeDocument,
  // Knowledge helpers (Vizta)
  downloadViztaPoliciesMd,
  saveViztaPoliciesMd,
  getViztaExamples,
  saveViztaExamples,
  ViztaExample,
  // Site Maps & Agents
  SiteMap,
  SiteAgent,
  AgentExtraction,
  saveSiteMap,
  getUserSiteMaps,
  getUserAgents,
  createSiteAgent,
  updateSiteAgent,
  executeAgentExtraction,
  getAgentExtractions,
  deleteSiteMap,
  deleteSiteAgent,
  saveToAgentDynamicTable,
  checkAgentDynamicTable,

} from '../services/supabase.ts';
import { EXTRACTORW_API_URL } from '../services/api.ts';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card as UICard } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

export default function Knowledge() {
  const { isAdmin, loading } = useAdmin();
  const { user } = useAuth();
  const [docs, setDocs] = useState<PublicKnowledgeDocument[]>([]);
  const [fetching, setFetching] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState<FileList | null>(null);
  const [title, setTitle] = useState('');
  const [project, setProject] = useState('');
  const [tags, setTags] = useState('');
  const [description, setDescription] = useState('');
  // Pinned local knowledge (Vizta policies)
  const [viztaMd, setViztaMd] = useState<string>('');
  const [viztaMdSaving, setViztaMdSaving] = useState<boolean>(false);
  // Vizta Examples
  const [viztaExamples, setViztaExamples] = useState<ViztaExample[]>([]);
  const [exUser, setExUser] = useState('');
  const [exAssistant, setExAssistant] = useState('');
  const [exSaving, setExSaving] = useState(false);
  
  // Learning tab state
  const [learnedItems, setLearnedItems] = useState<any[]>([]);
  const [queryLog, setQueryLog] = useState<any[]>([]);
  const [rssFeeds, setRssFeeds] = useState<any[]>([]);
  const [loadingLearning, setLoadingLearning] = useState(false);

  // Explorer state
  const [targetUrl, setTargetUrl] = useState('');
  const [goal, setGoal] = useState('Explorar la página y describir navegación principal');
  const [exploring, setExploring] = useState(false);
  const [summary, setSummary] = useState<string>('');
  
  // Site Maps & Agents state
  const [siteMaps, setSiteMaps] = useState<SiteMap[]>([]);
  const [agents, setAgents] = useState<SiteAgent[]>([]);
  const [loadingMaps, setLoadingMaps] = useState(false);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [showSaveMapButton, setShowSaveMapButton] = useState(false);
  const [exploredSiteName, setExploredSiteName] = useState('');
  
  // Agent creation modal state
  const [showCreateAgent, setShowCreateAgent] = useState(false);
  const [showEditAgent, setShowEditAgent] = useState(false);
  const [selectedMapForAgent, setSelectedMapForAgent] = useState<SiteMap | null>(null);
  const [selectedAgentForEdit, setSelectedAgentForEdit] = useState<SiteAgent | null>(null);
  
  // Estados para vista de extracciones
  const [viewingExtractions, setViewingExtractions] = useState<string | null>(null);
  const [currentExtractions, setCurrentExtractions] = useState<AgentExtraction[]>([]);
  const [loadingExtractions, setLoadingExtractions] = useState(false);
  
  // Extraction state
  const [executingAgents, setExecutingAgents] = useState<Set<string>>(new Set());
  const [agentExtractions, setAgentExtractions] = useState<Record<string, AgentExtraction[]>>({});

  useEffect(() => {
    const run = async () => {
      if (!user?.id) return; // solo admins ven esta página
      setFetching(true);
      try {
        const rows = await getPublicKnowledgeDocuments(24);
        setDocs(rows || []);
      } catch (e) {
        setDocs([]);
      } finally {
        setFetching(false);
      }
    };
    run();
  }, [user?.id]);

  // Cargar documento local: Vizta policies (public/knowledge)
  useEffect(() => {
    const loadVizta = async () => {
      try {
        // 1) Intentar cargar desde Supabase (pk_documents)
        const md = await downloadViztaPoliciesMd();
        if (md) {
          setViztaMd(md);
          return;
        }
        // 2) Fallback a asset local
        const res = await fetch('/knowledge/vizta_policies.md');
        if (res.ok) setViztaMd(await res.text());
      } catch (e) {
        // ignore
      }
    };
    loadVizta();
  }, []);

  // Cargar ejemplos de Vizta
  useEffect(() => {
    const loadExamples = async () => {
      try {
        const rows = await getViztaExamples();
        setViztaExamples(rows || []);
      } catch (e) {
        setViztaExamples([]);
      }
    };
    loadExamples();
  }, []);
  
  // Cargar datos de Learning
  useEffect(() => {
    const loadLearningData = async () => {
      if (!user?.id) return;
      
      setLoadingLearning(true);
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY
        );

        // Cargar learned items (últimos 50)
        const { data: items } = await supabase
          .from('vizta_learned_items')
          .select('*')
          .order('learned_at', { ascending: false })
          .limit(50);

        // Cargar query log (últimos 30 días)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: logs } = await supabase
          .from('vizta_query_log')
          .select('*')
          .gte('created_at', thirtyDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(100);

        // Cargar RSS feeds
        const { data: feeds } = await supabase
          .from('rss_feeds')
          .select('*')
          .order('created_at', { ascending: false });

        setLearnedItems(items || []);
        setQueryLog(logs || []);
        setRssFeeds(feeds || []);

      } catch (e) {
        console.error('Error loading learning data:', e);
      } finally {
        setLoadingLearning(false);
      }
    };
    
    loadLearningData();
  }, [user?.id]);

  // Load site maps and agents
  useEffect(() => {
    const loadMapsAndAgents = async () => {
      if (!user?.id) return;
      
      setLoadingMaps(true);
      setLoadingAgents(true);
      
      try {
        const [mapsData, agentsData] = await Promise.all([
          getUserSiteMaps(),
          getUserAgents()
        ]);
        
        setSiteMaps(mapsData);
        setAgents(agentsData);
      } catch (error) {
        console.error('Error loading maps and agents:', error);
      } finally {
        setLoadingMaps(false);
        setLoadingAgents(false);
      }
    };
    
    loadMapsAndAgents();
  }, [user?.id]);

  // Helper functions
  const extractSiteName = (url: string): string => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain.charAt(0).toUpperCase() + domain.slice(1);
    } catch {
      return 'Sitio Web';
    }
  };

  const handleExploration = async () => {
    setExploring(true);
    setSummary('');
    setShowSaveMapButton(false);

    try {
      // Use AI-enhanced exploration for better site analysis
      const res = await fetch(`${EXTRACTORW_API_URL}/webagent/explore-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: targetUrl,
          goal,
          maxSteps: 6,
          screenshot: true
        })
      });
      
      const json = await res.json();

      if (json?.success && json?.data) {
        // Build enhanced summary with AI analysis
        let enhancedSummary = json.data.summary || json.data.data?.summary || '';

        // Add AI analysis if available
        if (json.aiAnalysis) {
          enhancedSummary += `\n\n## 🤖 Análisis de IA\n\n`;

          if (json.aiAnalysis.siteAnalysis) {
            enhancedSummary += `**Tipo de sitio**: ${json.aiAnalysis.siteAnalysis.type}\n`;
            enhancedSummary += `**Complejidad**: ${json.aiAnalysis.siteAnalysis.complexity}\n`;
            enhancedSummary += `**Estructura**: ${json.aiAnalysis.siteAnalysis.structure}\n\n`;
          }

          if (json.aiAnalysis.extractableElements && json.aiAnalysis.extractableElements.length > 0) {
            enhancedSummary += `**Elementos extraíbles detectados**:\n`;
            json.aiAnalysis.extractableElements.forEach((element: any, index: number) => {
              enhancedSummary += `${index + 1}. **${element.name}** (${element.dataType}) - ${element.description}\n`;
              if (element.suggestedSelectors && element.suggestedSelectors.length > 0) {
                enhancedSummary += `   - Selectores sugeridos: \`${element.suggestedSelectors.join('`, `')}\`\n`;
              }
            });
            enhancedSummary += '\n';
          }

          if (json.aiAnalysis.scrapingStrategies && json.aiAnalysis.scrapingStrategies.length > 0) {
            enhancedSummary += `**Estrategias de extracción recomendadas**:\n`;
            json.aiAnalysis.scrapingStrategies.forEach((strategy: any, index: number) => {
              enhancedSummary += `${index + 1}. **${strategy.strategy}** (${strategy.difficulty})\n`;
              enhancedSummary += `   - ${strategy.description}\n`;
              if (strategy.steps && strategy.steps.length > 0) {
                enhancedSummary += `   - Pasos: ${strategy.steps.join(' → ')}\n`;
              }
            });
            enhancedSummary += '\n';
          }

          if (json.aiAnalysis.recommendations && json.aiAnalysis.recommendations.length > 0) {
            enhancedSummary += `**Recomendaciones**:\n`;
            json.aiAnalysis.recommendations.forEach((rec: string) => {
              enhancedSummary += `- ${rec}\n`;
            });
            enhancedSummary += '\n';
          }

          if (json.aiAnalysis.insights) {
            enhancedSummary += `**Insights adicionales**: ${json.aiAnalysis.insights}\n`;
          }

          enhancedSummary += `\n*Confianza del análisis: ${(json.aiAnalysis.confidence * 100).toFixed(0)}%*`;

          // Store AI analysis for use when saving site map
          sessionStorage.setItem('lastAiAnalysis', JSON.stringify(json.aiAnalysis));
        }

        setSummary(enhancedSummary);
        setExploredSiteName(extractSiteName(targetUrl));
        setShowSaveMapButton(true);
      } else if (json?.error) {
        setSummary(`### Error\n- **Tipo**: ${json.error}\n- **Mensaje**: ${json.message || 'Sin detalle'}`);
      } else {
        setSummary(`### Error\n- **Respuesta inesperada del servidor**`);
      }
    } catch (e: any) {
      setSummary(`### Error de red\n- ${e?.message || String(e)}`);
    } finally {
      setExploring(false);
    }
  };

  const handleSaveMap = async () => {
    if (!summary || !targetUrl) return;

    try {
      // Extract AI analysis from the latest exploration if available
      let aiAnalysisData = null;
      try {
        // We need to store the AI analysis separately for use in agent creation
        const lastExplorationResult = sessionStorage.getItem('lastAiAnalysis');
        if (lastExplorationResult) {
          aiAnalysisData = JSON.parse(lastExplorationResult);
        }
      } catch (e) {
        console.warn('Could not parse stored AI analysis:', e);
      }

      const mapData = {
        site_name: exploredSiteName,
        base_url: targetUrl,
        exploration_goal: goal,
        site_structure: {
          summary,
          aiAnalysis: aiAnalysisData // Include AI analysis for agent creation
        },
        navigation_summary: summary
      };
      
      const savedMap = await saveSiteMap(mapData);
      setSiteMaps(prev => [savedMap, ...prev]);
      setShowSaveMapButton(false);
      
      // Clear exploration data
      setTargetUrl('');
      setGoal('Explorar la página y describir navegación principal');
      setSummary('');
    } catch (error) {
      console.error('Error saving site map:', error);
    }
  };

  const handleCreateAgent = async (agentData: any) => {
    if (!selectedMapForAgent) return;

    try {
      console.log('🆕 Creating new agent with data:', agentData);
      const newAgent = await createSiteAgent(agentData);
      console.log('✅ Agent created successfully:', newAgent);

      setAgents(prev => [newAgent, ...prev]);

      // Reset form
      setShowCreateAgent(false);
      setSelectedMapForAgent(null);
    } catch (error) {
      console.error('❌ Error creating agent:', error);
      // You might want to show this error to the user
      alert(`Error al crear el agente: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const handleEditAgent = async (agentData: any) => {
    if (!selectedAgentForEdit) return;

    try {
      console.log('✏️ Updating agent with data:', agentData);
      console.log('🆔 Agent ID:', selectedAgentForEdit.id);

      // Pass all the agent data fields for complete update
      const updatedAgent = await updateSiteAgent(selectedAgentForEdit.id, {
        agent_name: agentData.agent_name,
        extraction_target: agentData.extraction_target,
        extraction_config: agentData.extraction_config,
        dynamic_table_name: agentData.dynamic_table_name,
        data_description: agentData.data_description
      });

      console.log('✅ Agent updated successfully:', updatedAgent);

      setAgents(prev => prev.map(agent =>
        agent.id === selectedAgentForEdit.id ? updatedAgent : agent
      ));

      // Reset form
      setShowEditAgent(false);
      setSelectedAgentForEdit(null);
    } catch (error) {
      console.error('❌ Error updating agent:', error);
      // You might want to show this error to the user
      alert(`Error al actualizar el agente: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const handleExecuteAgent = async (agent: SiteAgent) => {
    const agentId = agent.id;
    setExecutingAgents(prev => new Set([...prev, agentId]));
    
    try {
      const extraction = await executeAgentExtraction(agentId);
      
      // Guardar en tabla dinámica si el agente tiene una
      if (extraction.success && extraction.extracted_data) {
        try {
          const tableCheck = await checkAgentDynamicTable(agentId);
          if (tableCheck.hasTable) {
            await saveToAgentDynamicTable(
              agentId,
              extraction.id,
              extraction.extracted_data,
              extraction.extracted_data, // raw_data
              {
                extraction_summary: extraction.extraction_summary,
                success: extraction.success,
                executed_at: extraction.executed_at
              }
            );
            console.log(`✅ Datos guardados en tabla dinámica: ${tableCheck.tableName}`);
          }
        } catch (dynamicError) {
          console.warn('Error guardando en tabla dinámica:', dynamicError);
          // No fallar la ejecución por esto
        }
      }
      
      // Update agent list with new last_execution
      setAgents(prev => prev.map(a => 
        a.id === agentId 
          ? { ...a, last_execution: new Date().toISOString() }
          : a
      ));
      
      // Store extraction result
      setAgentExtractions(prev => ({
        ...prev,
        [agentId]: [extraction, ...(prev[agentId] || [])]
      }));
      
    } catch (error) {
      console.error('Error executing agent:', error);
    } finally {
      setExecutingAgents(prev => {
        const newSet = new Set(prev);
        newSet.delete(agentId);
        return newSet;
      });
    }
  };

  const handleDeleteMap = async (mapId: string) => {
    try {
      await deleteSiteMap(mapId);
      setSiteMaps(prev => prev.filter(m => m.id !== mapId));
      
      // Also remove any agents using this map
      setAgents(prev => prev.filter(a => a.site_map_id !== mapId));
    } catch (error) {
      console.error('Error deleting site map:', error);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    try {
      await deleteSiteAgent(agentId);
      setAgents(prev => prev.filter(a => a.id !== agentId));
      
      // Remove extractions from local state
      setAgentExtractions(prev => {
        const newExtractions = { ...prev };
        delete newExtractions[agentId];
        return newExtractions;
      });
    } catch (error) {
      console.error('Error deleting agent:', error);
    }
  };

  const handleViewExtractions = async (agentId: string) => {
    setLoadingExtractions(true);
    setViewingExtractions(agentId);
    
    try {
      const extractions = await getAgentExtractions(agentId);
      setCurrentExtractions(extractions);
    } catch (error) {
      console.error('Error loading extractions:', error);
      setCurrentExtractions([]);
    } finally {
      setLoadingExtractions(false);
    }
  };

  const handleReExplore = async (siteMap: SiteMap) => {
    setTargetUrl(siteMap.base_url);
    setGoal(siteMap.exploration_goal || 'Re-explorar la página y actualizar navegación');
    
    // Trigger exploration
    setTimeout(() => {
      handleExploration();
    }, 100);
  };

  if (!loading && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Knowledge</h1>
        <p className="text-slate-600">Sección de conocimiento interno y monitoreos globales. Solo para administradores.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Centro de Conocimiento</CardTitle>
          <CardDescription>Gestiona conocimiento base y define monitoreos universales.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="base" className="space-y-6">
            <TabsList>
              <TabsTrigger value="base">Base</TabsTrigger>
              <TabsTrigger value="learning">Learning</TabsTrigger>
              <TabsTrigger value="monitoreos">Monitoreos Universales</TabsTrigger>
            </TabsList>

            {/* Base: mini codex para conocimiento público */}
            <TabsContent value="base" className="space-y-4">
              {/* Pinned: Vizta policies */}
              {viztaMd && (
                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-lg">📌 Vizta: Prompt y Tool Calling</CardTitle>
                    <CardDescription>Documento interno fijo visible en Knowledge.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-slate max-w-none bg-white p-4 rounded border border-slate-200">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{viztaMd}</ReactMarkdown>
                    </div>
                    <div className="mt-4 space-y-2">
                      <h4 className="text-sm font-medium text-slate-700">Editar prompt (Markdown)</h4>
                      <Textarea
                        value={viztaMd}
                        onChange={(e) => setViztaMd(e.target.value)}
                        rows={12}
                      />
                      <div className="flex gap-2">
                        <Button
                          className="bg-blue-600 text-white"
                          disabled={viztaMdSaving || !viztaMd.trim()}
                          onClick={async () => {
                            setViztaMdSaving(true);
                            try {
                              const saved = await saveViztaPoliciesMd(viztaMd);
                              if (saved) {
                                // noop; keep md in state
                              }
                            } catch (e) {
                              console.error('Error saving Vizta policies:', e);
                            } finally {
                              setViztaMdSaving(false);
                            }
                          }}
                        >
                          {viztaMdSaving ? 'Guardando…' : 'Guardar Prompt'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Vizta Examples */}
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">🧪 Vizta: Examples (Few-shot)</CardTitle>
                  <CardDescription>Agrega ejemplos de interacción (usuario → asistente) para mejorar el comportamiento.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm text-slate-700">Entrada del usuario</label>
                      <Textarea value={exUser} onChange={(e) => setExUser(e.target.value)} rows={5} placeholder="Ej: Dame un resumen de mis proyectos activos" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-slate-700">Respuesta esperada</label>
                      <Textarea value={exAssistant} onChange={(e) => setExAssistant(e.target.value)} rows={5} placeholder="Ej: Un listado conciso, tono Vizta, etc." />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="bg-blue-600 text-white"
                      disabled={exSaving || !exUser.trim() || !exAssistant.trim()}
                      onClick={async () => {
                        setExSaving(true);
                        try {
                          const updated: ViztaExample[] = [
                            ...viztaExamples,
                            { user: exUser.trim(), assistant: exAssistant.trim(), tags: ['knowledge'], notes: 'Added from Knowledge UI' }
                          ];
                          const saved = await saveViztaExamples(updated);
                          if (saved) {
                            setViztaExamples(updated);
                            setExUser('');
                            setExAssistant('');
                          }
                        } catch (e) {
                          console.error('Error saving Vizta example:', e);
                        } finally {
                          setExSaving(false);
                        }
                      }}
                    >
                      {exSaving ? 'Guardando…' : 'Agregar Ejemplo'}
                    </Button>
                  </div>

                  {/* Lista de ejemplos actuales */}
                  <div className="mt-2">
                    {viztaExamples.length === 0 ? (
                      <p className="text-slate-500 text-sm">No hay ejemplos aún.</p>
                    ) : (
                      <div className="space-y-2">
                        {viztaExamples.slice(0, 10).map((ex, idx) => (
                          <div key={idx} className="border border-slate-200 rounded p-3 bg-white">
                            <div className="text-xs text-slate-500">Ejemplo #{idx + 1}</div>
                            <div className="mt-1 text-sm"><span className="font-medium">Usuario:</span> {ex.user}</div>
                            <div className="mt-1 text-sm"><span className="font-medium">Asistente:</span> {ex.assistant}</div>
                          </div>
                        ))}
                        {viztaExamples.length > 10 && (
                          <div className="text-xs text-slate-500">Mostrando 10 de {viztaExamples.length}…</div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-lg">Subir archivo</CardTitle>
                    <CardDescription>PDFs, documentos e información pública que Vizta podrá referenciar.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Input type="file" multiple className="cursor-pointer" onChange={(e) => setFileList(e.target.files)} />
                    <Input placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
                    <Input placeholder="Proyecto (opcional)" value={project} onChange={(e) => setProject(e.target.value)} />
                    <Input placeholder="Etiquetas separadas por coma" value={tags} onChange={(e) => setTags(e.target.value)} />
                    <Textarea placeholder="Descripción breve" value={description} onChange={(e) => setDescription(e.target.value)} />
                    <div className="flex gap-2">
                      <Button className="bg-blue-600 text-white" disabled={uploading || !fileList || !fileList[0] || !title}
                        onClick={async () => {
                          if (!fileList || !fileList[0]) return;
                          setUploading(true);
                          try {
                            const tagsArr = tags.split(',').map(t => t.trim()).filter(Boolean);
                            const doc = await uploadPublicKnowledgeDocument({
                              file: fileList[0],
                              title,
                              tags: tagsArr,
                              notes: description,
                              source_url: ''
                            });
                            if (doc) setDocs((prev) => [doc, ...prev]);
                            setTitle(''); setProject(''); setTags(''); setDescription(''); setFileList(null);
                          } catch (e) {
                            console.error('Upload failed', e);
                          } finally {
                            setUploading(false);
                          }
                        }}>
                        {uploading ? 'Subiendo…' : 'Subir'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-lg">Agregar texto base</CardTitle>
                    <CardDescription>Hardcode visual de conocimiento estructurado.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Input placeholder="Título" />
                    <Textarea placeholder="Contenido" rows={8} />
                    <Input placeholder="Etiquetas (coma)" />
                    <div className="flex gap-2">
                      <Button className="bg-blue-600 text-white" disabled>
                        Guardar (próximamente)
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Listado de elementos ya subidos (mini-codex) */}
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Documentos públicos</h3>
                {fetching ? (
                  <p className="text-slate-500">Cargando…</p>
                ) : docs.length === 0 ? (
                  <p className="text-slate-500">No hay documentos aún.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {docs.map((d) => (
                      <UICard key={d.id} className="p-4 border-slate-200">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-medium truncate" title={d.title}>{d.title}</div>
                          <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600">{d.mimetype || 'documento'}</Badge>
                        </div>
                        <div className="mt-2 space-y-1 text-xs text-slate-500">
                          {d.language && (
                            <div className="flex items-center gap-1"><span className="h-3 w-3">🌐</span> <span>{d.language}</span></div>
                          )}
                          {typeof d.pages === 'number' && (
                            <div className="flex items-center gap-1"><span className="h-3 w-3">📄</span> <span>{d.pages} páginas</span></div>
                          )}
                          {d.created_at && (
                            <div className="flex items-center gap-1"><Calendar className="h-3 w-3" /> <span>{new Date(d.created_at).toLocaleDateString()}</span></div>
                          )}
                        </div>
                        {Array.isArray(d.tags) && d.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {d.tags.slice(0, 2).map((tag: string, idx: number) => (
                              <Badge key={idx} variant="secondary" className="text-xs bg-slate-100 text-slate-600">{tag}</Badge>
                            ))}
                            {d.tags.length > 2 && (
                              <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600">+{d.tags.length - 2}</Badge>
                            )}
                          </div>
                        )}
                        {d.source_url && (
                          <a href={d.source_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-blue-600 hover:underline break-all">{d.source_url}</a>
                        )}
                      </UICard>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Learning: Lo que Vizta ha aprendido */}
            <TabsContent value="learning" className="space-y-6">
              <LearningTab 
                learnedItems={learnedItems}
                queryLog={queryLog}
                rssFeeds={rssFeeds}
                loading={loadingLearning}
              />
            </TabsContent>

            {/* Monitoreos Universales: Explorer + Mapas + Agentes */}
            <TabsContent value="monitoreos" className="space-y-6">
              {/* 1. EXPLORER - Exploración Inicial */}
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    🗺️ Explorer - Exploración Inicial
                    <Badge variant="outline" className="text-purple-600 border-purple-300">
                      🤖 IA Mejorada
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Explora una URL con análisis inteligente usando Gemini IA. Detecta automáticamente elementos extraíbles,
                    sugiere selectores CSS y recomienda estrategias de scraping optimizadas.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    <Input 
                      placeholder="https://ejemplo.com" 
                      value={targetUrl} 
                      onChange={(e) => setTargetUrl(e.target.value)} 
                    />
                    <Input 
                      placeholder='Objetivo (p. ej. Necesito buscar "iniciativas")' 
                      value={goal} 
                      onChange={(e) => setGoal(e.target.value)} 
                    />
                    <Button 
                      className="bg-blue-600 text-white" 
                      disabled={exploring || !targetUrl}
                      onClick={handleExploration}
                    >
                      {exploring ? 'Explorando…' : 'Explorar'}
                    </Button>
                  </div>
                  
                  <div className="prose prose-slate max-w-none border rounded-md p-4 bg-white">
                    {summary ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
                    ) : (
                      <p className="text-slate-500">Sin resultados todavía.</p>
                    )}
                  </div>

                  {/* Botón para guardar mapa (solo aparece después de exploración exitosa) */}
                  {showSaveMapButton && (
                    <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-md">
                      <div>
                        <h4 className="font-medium text-green-900">¡Exploración exitosa!</h4>
                        <p className="text-sm text-green-700">¿Quieres guardar este mapa del sitio para crear agentes después?</p>
                      </div>
                      <Button 
                        onClick={handleSaveMap}
                        className="bg-green-600 text-white hover:bg-green-700"
                      >
                        Guardar Mapa del Sitio
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 2. MAPAS DE SITIOS GUARDADOS */}
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    📁 Mapas de Sitios Guardados
                  </CardTitle>
                  <CardDescription>Sitios web ya explorados y mapeados, listos para crear agentes de extracción.</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingMaps ? (
                    <p className="text-slate-500">Cargando mapas...</p>
                  ) : siteMaps.length === 0 ? (
                    <p className="text-slate-500">No hay mapas guardados aún. Explora un sitio web primero.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {siteMaps.map((siteMap) => (
                        <UICard key={siteMap.id} className="p-4 border-slate-200">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <h4 className="font-medium truncate" title={siteMap.site_name}>
                              {siteMap.site_name}
                            </h4>
                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-600">
                              {siteMap.status}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2 text-sm text-slate-600">
                            <p className="truncate" title={siteMap.base_url}>
                              🌐 {siteMap.base_url}
                            </p>
                            <p className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(siteMap.exploration_date).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedMapForAgent(siteMap);
                                setShowCreateAgent(true);
                              }}
                            >
                              🤖 Crear Agente
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleReExplore(siteMap)}
                            >
                              👁️ Re-explorar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDeleteMap(siteMap.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              🗑️
                            </Button>
                          </div>
                        </UICard>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 3. AGENTES DE EXTRACCIÓN */}
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    🤖 Agentes de Extracción
                  </CardTitle>
                  <CardDescription>Agentes configurados para extraer información específica de los sitios mapeados.</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingAgents ? (
                    <p className="text-slate-500">Cargando agentes...</p>
                  ) : agents.length === 0 ? (
                    <p className="text-slate-500">No hay agentes creados aún. Crea uno desde un mapa de sitio guardado.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {agents.map((agent) => (
                        <UICard key={agent.id} className="p-4 border-slate-200">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <h4 className="font-medium truncate" title={agent.agent_name}>
                              {agent.agent_name}
                            </h4>
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${
                                agent.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {agent.status}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2 text-sm text-slate-600 mb-3">
                            <p className="font-medium">
                              🌐 {agent.site_map?.site_name || 'Sitio desconocido'}
                            </p>
                            <p className="italic">
                              📋 "{agent.extraction_target.substring(0, 60)}..."
                            </p>
                            {agent.last_execution && (
                              <p className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Última ejecución: {new Date(agent.last_execution).toLocaleDateString()}
                              </p>
                            )}
                          </div>

                          <div className="flex gap-2 flex-wrap">
                            <Button 
                              size="sm"
                              onClick={() => handleExecuteAgent(agent)}
                              disabled={executingAgents.has(agent.id)}
                              className="bg-blue-600 text-white hover:bg-blue-700"
                            >
                              {executingAgents.has(agent.id) ? (
                                'Ejecutando...'
                              ) : (
                                <>
                                  ▶️ Ejecutar
                                </>
                              )}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewExtractions(agent.id)}
                              disabled={loadingExtractions && viewingExtractions === agent.id}
                            >
                              {loadingExtractions && viewingExtractions === agent.id ? (
                                'Cargando...'
                              ) : (
                                '👁️ Ver Extracciones'
                              )}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedAgentForEdit(agent);
                                setShowEditAgent(true);
                              }}
                            >
                              ✏️ Editar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDeleteAgent(agent.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              🗑️
                            </Button>
                          </div>

                          {/* Mostrar extracciones si están cargadas */}
                          {agentExtractions[agent.id] && agentExtractions[agent.id].length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-200">
                              <h5 className="text-sm font-medium mb-2">Últimas extracciones:</h5>
                              <div className="space-y-2 max-h-32 overflow-y-auto">
                                {agentExtractions[agent.id].slice(0, 3).map((extraction) => (
                                  <div 
                                    key={extraction.id} 
                                    className={`text-xs p-2 rounded ${
                                      extraction.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                    }`}
                                  >
                                    <p className="font-medium">
                                      {new Date(extraction.executed_at).toLocaleString()}
                                    </p>
                                    <p className="truncate">
                                      {extraction.success ? extraction.extraction_summary : extraction.error_message}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </UICard>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Modal para crear agente */}
              {showCreateAgent && selectedMapForAgent && (
                <AgentEditor
                  siteMap={selectedMapForAgent}
                  onSave={handleCreateAgent}
                  onCancel={() => {
                    setShowCreateAgent(false);
                    setSelectedMapForAgent(null);
                  }}
                  isCreating={true}
                />
              )}

              {/* Modal para editar agente */}
              {showEditAgent && selectedAgentForEdit && (
                <AgentEditor
                  agent={selectedAgentForEdit}
                  siteMap={selectedAgentForEdit.site_map!}
                  onSave={handleEditAgent}
                  onCancel={() => {
                    setShowEditAgent(false);
                    setSelectedAgentForEdit(null);
                  }}
                  isCreating={false}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modal para Ver Extracciones */}
      {viewingExtractions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">
                  Extracciones del Agente
                </h3>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setViewingExtractions(null);
                    setCurrentExtractions([]);
                  }}
                >
                  ✕ Cerrar
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <ExtractionViewer 
                extractions={currentExtractions}
                isLoading={loadingExtractions}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
