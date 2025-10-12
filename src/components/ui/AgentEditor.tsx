import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Code, 
  Wand2, 
  Save, 
  Play, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Lightbulb,
  FileCode,
  Settings,
  MapPin,
  Target,
  Cog,
  Eye,
  Zap,
  Info,
  Bug,
  Terminal,
  Wrench,
  Clock,
  Activity,
  Globe,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { SiteAgent, SiteMap } from '../../services/supabase';
import { EXTRACTORW_API_URL } from '../../services/api';
import CodeEditor from './CodeEditor';

interface AgentEditorProps {
  agent?: SiteAgent | null;
  siteMap: SiteMap;
  onSave: (agentData: any) => Promise<void>;
  onCancel: () => void;
  isCreating?: boolean;
}

interface GeneratedCode {
  extractionLogic: string | null; // null si webagent
  selectors: string[];
  workflow: string[];
  confidence: number;
  reasoning: string;
  execution_mode?: 'sandbox' | 'webagent'; // Modo de ejecución
  requires_browser?: boolean; // Si requiere navegador real
}

export default function AgentEditor({ 
  agent, 
  siteMap, 
  onSave, 
  onCancel, 
  isCreating = false 
}: AgentEditorProps) {
  // Estado del formulario básico
  const [agentName, setAgentName] = useState(agent?.agent_name || '');
  const [extractionTarget, setExtractionTarget] = useState(agent?.extraction_target || '');
  const [dynamicTableName, setDynamicTableName] = useState(agent?.dynamic_table_name || '');
  const [dataDescription, setDataDescription] = useState(agent?.data_description || '');

  // Advanced database configuration state
  const [databaseEnabled, setDatabaseEnabled] = useState(!!agent?.database_config?.enabled || false);

  // Estado del editor inteligente
  const [naturalInstructions, setNaturalInstructions] = useState(
    agent?.extraction_config?.instructions || ''
  );
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(
    agent?.extraction_config?.generated ? {
      extractionLogic: agent.extraction_config.extractionLogic || agent.extraction_target,
      selectors: agent.extraction_config.selectors || [],
      workflow: agent.extraction_config.workflow || [],
      confidence: agent.extraction_config.confidence || 0.8,
      reasoning: agent.extraction_config.reasoning || ''
    } : null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Guided prompt builder state
  const [wizardStep, setWizardStep] = useState(1);
  const [dataType, setDataType] = useState('');
  const [targetElements, setTargetElements] = useState<string[]>([]);
  const [outputFormat, setOutputFormat] = useState('');
  const [extractionFrequency, setExtractionFrequency] = useState('');
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [customElement, setCustomElement] = useState('');

  // Explorer insights state - declare first
  const explorerInsights = siteMap?.site_structure?.aiAnalysis || null;
  
  // ✅ Estado para selección múltiple de elementos del Explorer
  const [selectedElements, setSelectedElements] = useState<any[]>([]);

  // Estado de las pestañas - start with explorer if insights available
  const [activeTab, setActiveTab] = useState(explorerInsights && isCreating ? 'explorer' : 'basic');
  const [selectedExplorerElement, setSelectedExplorerElement] = useState<any>(null);
  const [showExplorerInsights, setShowExplorerInsights] = useState(!!explorerInsights);
  const [suggestedElements, setSuggestedElements] = useState<any[]>([]);

  // Debug mode state
  const [debugMode, setDebugMode] = useState(false);
  const [debugScript, setDebugScript] = useState('');
  const [debugUrl, setDebugUrl] = useState(siteMap?.base_url || '');
  const [debugResults, setDebugResults] = useState<any>(null);
  const [isDebugging, setIsDebugging] = useState(false);
  const [debugHistory, setDebugHistory] = useState<any[]>([]);
  const [debugCodeSource, setDebugCodeSource] = useState<'manual' | 'agent' | 'generated'>('manual');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showApplySuccess, setShowApplySuccess] = useState(false);
  const [isLoadingDebugCode, setIsLoadingDebugCode] = useState(false);
  const [forceReloadKey, setForceReloadKey] = useState(0);
  const [previousDebugResults, setPreviousDebugResults] = useState<any>(null);
  const [showResultsComparison, setShowResultsComparison] = useState(false);
  const [codeValidation, setCodeValidation] = useState<{valid: boolean, errors: string[], warnings: string[]}>({
    valid: true,
    errors: [],
    warnings: []
  });
  const [autoTestEnabled, setAutoTestEnabled] = useState(false);
  const [autoTestTimer, setAutoTestTimer] = useState<NodeJS.Timeout | null>(null);
  const [splitViewEnabled, setSplitViewEnabled] = useState(false);
  
  // ✅ Diagnostic state
  const [pageInfo, setPageInfo] = useState<any>(null);
  const [diagnosticIssues, setDiagnosticIssues] = useState<any[]>([]);

  // Process Explorer insights on component load
  useEffect(() => {
    if (explorerInsights && isCreating) {
      // Analyze and rank extractable elements
      const rankedElements = rankExtractableElements(explorerInsights);
      setSuggestedElements(rankedElements);

      // Auto-suggest the best element if user hasn't started configuring
      if (rankedElements.length > 0 && !agentName && !extractionTarget) {
        const bestElement = rankedElements[0];
        // Optionally auto-apply the best element
        // applyExplorerElement(bestElement);
      }
    }
  }, [explorerInsights, isCreating]);

  // Simplified debug code loading - priority: agent code first, then generated code
  useEffect(() => {
    // Only operate when debug tab is active
    if (activeTab !== 'debug') return;

    console.log('🔄 Debug code loading check:', {
      hasDebugScript: !!debugScript.trim(),
      hasGeneratedCode: !!generatedCode?.extractionLogic,
      hasAgent: !!agent,
      isCreating
    });

    // Skip loading if user has made manual changes
    if (hasUnsavedChanges && debugCodeSource === 'manual') {
      console.log('ℹ️ Skipping auto-load due to manual changes');
      return;
    }

    // Skip if we already have debug script loaded
    if (debugScript.trim() && !hasUnsavedChanges) {
      console.log('ℹ️ Debug script already loaded');
      return;
    }

    let codeToLoad = '';
    let sourceType: 'manual' | 'agent' | 'generated' = 'manual';
    let reason = '';

    // Priority 1: Load actual agent's generated JavaScript code (for editing existing agents)
    if (agent?.extraction_config?.extractionLogic) {
      const agentCode = agent.extraction_config.extractionLogic;
      const isJavaScript = agentCode.includes('document.') ||
                          agentCode.includes('querySelector') ||
                          agentCode.includes('return ');

      if (isJavaScript) {
        codeToLoad = agentCode;
        sourceType = 'agent';
        reason = 'Loaded actual agent JavaScript code for debugging';
      } else {
        // Convert description to executable code
        codeToLoad = generateExecutableCode(agentCode);
        sourceType = 'generated';
        reason = 'Generated JavaScript from agent description';
      }
    }
    // Priority 2: Use current generated code (for new agents being created)
    else if (generatedCode?.extractionLogic) {
      const genCode = generatedCode.extractionLogic;
      const isJavaScript = genCode.includes('document.') ||
                          genCode.includes('querySelector') ||
                          genCode.includes('return ');

      if (isJavaScript) {
        codeToLoad = genCode;
        sourceType = 'generated';
        reason = 'Loaded current generated JavaScript code';
      } else {
        // Convert description to executable code
        codeToLoad = generateExecutableCode(genCode);
        sourceType = 'generated';
        reason = 'Generated JavaScript from description';
      }
    }
    // Priority 3: Generate from extraction target
    else if (extractionTarget || agent?.extraction_target) {
      const target = extractionTarget || agent?.extraction_target || '';
      codeToLoad = generateExecutableCode(target);
      sourceType = 'agent';
      reason = 'Generated JavaScript from extraction target';
    }

    // Load the code if we have something to load
    if (codeToLoad.trim()) {
      console.log(`✅ ${reason}`);
      setDebugScript(codeToLoad);
      setDebugCodeSource(sourceType);
      setHasUnsavedChanges(false);
      console.log(`🔄 Loaded ${sourceType} code (${codeToLoad.length} chars)`);
    } else {
      console.log('ℹ️ No code available to load, using template');
      loadAgentCodeToDebug();
    }
  }, [activeTab, generatedCode?.extractionLogic, agent, extractionTarget, debugScript, hasUnsavedChanges, forceReloadKey]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoTestTimer) {
        clearTimeout(autoTestTimer);
      }
    };
  }, [autoTestTimer]);

  // ✅ Limpiar diagnóstico cuando cambia la URL (nuevo sitio = nuevo contexto)
  useEffect(() => {
    const currentUrl = debugUrl || siteMap?.base_url || '';
    const previousUrl = pageInfo?.url || '';
    
    if (currentUrl && previousUrl && currentUrl !== previousUrl) {
      console.log('🔄 URL cambió - limpiando diagnóstico anterior');
      console.log(`   De: ${previousUrl}`);
      console.log(`   A: ${currentUrl}`);
      setPageInfo(null);
      setDiagnosticIssues([]);
      setDebugResults(null);
    }
  }, [debugUrl, siteMap?.base_url]);

  // Sync extraction target changes with debug script
  useEffect(() => {
    if (extractionTarget && debugCodeSource === 'agent' && activeTab === 'debug') {
      // Check if extraction_target has been updated and contains JavaScript
      if (extractionTarget.includes('document.querySelector') ||
          extractionTarget.includes('querySelectorAll') ||
          extractionTarget.includes('return ')) {

        if (extractionTarget !== debugScript && !hasUnsavedChanges) {
          setDebugScript(extractionTarget);
          setDebugCodeSource('agent');
          console.log('🔄 Synced debug script with updated extraction target');
        }
      }
    }
  }, [extractionTarget, debugCodeSource, activeTab, hasUnsavedChanges]);

  // Rank extractable elements by priority and quality
  const rankExtractableElements = (insights: any): any[] => {
    if (!insights.extractableElements || insights.extractableElements.length === 0) {
      return [];
    }

    return insights.extractableElements
      .map((element: any) => ({
        ...element,
        priority: calculateElementPriority(element)
      }))
      .sort((a: any, b: any) => b.priority - a.priority);
  };

  // Calculate priority score for an extractable element
  const calculateElementPriority = (element: any): number => {
    let score = 0;

    // Data type priority
    const dataTypePriority: Record<string, number> = {
      'productos': 10,
      'noticias': 9,
      'precios': 8,
      'contactos': 7,
      'eventos': 6,
      'reviews': 5,
      'inmuebles': 8,
      'categorías': 4,
      'enlaces': 3,
      'texto': 2
    };
    score += dataTypePriority[element.dataType?.toLowerCase()] || 1;

    // Selector quality (more selectors = better)
    if (element.suggestedSelectors && element.suggestedSelectors.length > 0) {
      score += Math.min(element.suggestedSelectors.length * 2, 10);
    }

    // Description quality
    if (element.description && element.description.length > 20) {
      score += 3;
    }

    // Name quality
    if (element.name && element.name.length > 3) {
      score += 2;
    }

    return score;
  };

  // Helper functions for guided wizard
  const addTargetElement = (element: string) => {
    if (element && !targetElements.includes(element)) {
      setTargetElements([...targetElements, element]);
    }
  };

  const removeTargetElement = (index: number) => {
    setTargetElements(targetElements.filter((_, i) => i !== index));
  };

  const addCustomElement = () => {
    if (customElement.trim()) {
      addTargetElement(customElement.trim());
      setCustomElement('');
    }
  };

  const buildInstructionsFromWizard = () => {
    let instructions = `Necesito extraer información de tipo: ${dataType}\n\n`;

    if (targetElements.length > 0) {
      instructions += `Elementos específicos que quiero extraer:\n`;
      targetElements.forEach((element, index) => {
        instructions += `${index + 1}. ${element}\n`;
      });
      instructions += '\n';
    }

    if (outputFormat) {
      instructions += `Formato de salida deseado: ${outputFormat}\n\n`;
    }

    if (extractionFrequency) {
      instructions += `Frecuencia de extracción: ${extractionFrequency}\n\n`;
    }

    if (specialRequirements) {
      instructions += `Requisitos especiales:\n${specialRequirements}\n\n`;
    }

    instructions += `Sitio web objetivo: ${siteMap?.site_name || 'No especificado'} (${siteMap?.base_url || 'No especificado'})`;

    return instructions;
  };

  const applyWizardInstructions = () => {
    const instructions = buildInstructionsFromWizard();
    setNaturalInstructions(instructions);
    setActiveTab('intelligent');
  };

  // Explorer insights helper functions
  // ✅ Toggle selección de elemento
  const toggleElementSelection = (element: any) => {
    const isSelected = selectedElements.some(el => el.name === element.name);
    if (isSelected) {
      setSelectedElements(selectedElements.filter(el => el.name !== element.name));
    } else {
      setSelectedElements([...selectedElements, element]);
    }
  };

  // ✅ Aplicar elementos seleccionados
  const applySelectedElements = async () => {
    if (selectedElements.length === 0) return;
    
    applyMultipleElements(selectedElements);
    setSelectedElements([]); // Limpiar selección
    // ✅ La generación de código ya se maneja en applyMultipleElements
  };

  // ✅ Aplicar múltiples elementos a la vez
  const applyMultipleElements = (elements: any[]) => {
    if (elements.length === 0) return;

    console.log('🔧 Aplicando múltiples elementos:', elements);

    // Combinar nombres para el agente
    if (!agentName) {
      const names = elements.map(el => el.name).join(', ');
      setAgentName(`Extractor de ${names.substring(0, 50)}${names.length > 50 ? '...' : ''}`);
    }

    // Combinar descripciones para extraction target
    if (!extractionTarget) {
      const descriptions = elements.map(el => 
        `- ${el.name}: ${el.description || 'Extraer ' + el.dataType}`
      ).join('\n');
      setExtractionTarget(`Extraer los siguientes elementos:\n${descriptions}`);
    }

    // Generar tabla dinámica
    if (!dynamicTableName) {
      const tableName = generateSmartTableName(elements[0], siteMap);
      setDynamicTableName(tableName);
      setDatabaseEnabled(true);
    }

    // Descripción combinada
    if (!dataDescription) {
      const elementNames = elements.map(el => el.name.toLowerCase()).join(', ');
      setDataDescription(`Extracción de ${elementNames} desde ${siteMap?.site_name || 'sitio web'}`);
    }

    // Construir instrucciones combinadas con selectores
    let instructions = `Necesito extraer información sobre múltiples elementos:\n\n`;
    
    elements.forEach((element, idx) => {
      instructions += `${idx + 1}. **${element.name}** (${element.dataType}):\n`;
      instructions += `   ${element.description}\n`;
      if (element.suggestedSelectors && element.suggestedSelectors.length > 0) {
        instructions += `   Selectores: ${element.suggestedSelectors.join(', ')}\n`;
      }
      instructions += '\n';
    });

    console.log('📝 Instrucciones generadas:', instructions);
    setNaturalInstructions(instructions);
    setActiveTab('ia');
    
    // ✅ Generar código inmediatamente con las instrucciones directas
    setTimeout(async () => {
      console.log('🤖 Generando código después de aplicar elementos múltiples...');
      console.log('📝 Usando instrucciones generadas:', instructions);
      await generateAgentCodeWithInstructions(instructions);
    }, 100);
  };

  // ✅ Generar código del agente con IA usando instrucciones específicas
  const generateAgentCodeWithInstructions = async (instructions: string) => {
    if (!instructions.trim() || !siteMap?.base_url) {
      console.log('❌ Faltan instrucciones o URL base');
      console.log('📝 Instrucciones recibidas:', instructions);
      console.log('🌐 SiteMap:', siteMap);
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      console.log('🤖 Generando código del agente con instrucciones específicas...');
      console.log('📝 Instrucciones:', instructions);
      console.log('🌐 SiteMap:', siteMap);
      console.log('🔍 ExplorerInsights:', explorerInsights);
      
      const requestBody = {
        instructions: instructions,
        siteMap: siteMap,
        existingAgent: agent,
        explorerInsights: explorerInsights
      };
      
      console.log('📤 Request body:', requestBody);
      
      const response = await fetch(`${EXTRACTORW_API_URL}/agents/generate-agent-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Código generado:', result);

      if (result.success && result.data) {
        // ✅ Mapear la respuesta del backend al formato esperado
        const generatedCode = {
          extractionLogic: result.data.extractionLogic || result.data.extraction_target,
          selectors: result.data.selectors || [],
          workflow: result.data.workflow || [],
          confidence: result.data.confidence || 0.8,
          reasoning: result.data.reasoning || '',
          execution_mode: result.data.execution_mode,
          requires_browser: result.data.requires_browser
        };
        
        setGeneratedCode(generatedCode);
        console.log('🎯 Estado generatedCode actualizado:', generatedCode);
        
        // ✅ Cambiar automáticamente a la pestaña "Código Generado"
        setActiveTab('generated');
        
        // ✅ Actualizar campos del agente con la información generada
        if (result.data.suggestedName && !agentName) {
          setAgentName(result.data.suggestedName);
        }
        if (result.data.suggestedTarget && !extractionTarget) {
          setExtractionTarget(result.data.suggestedTarget);
        }
        if (result.data.suggestedDescription && !dataDescription) {
          setDataDescription(result.data.suggestedDescription);
        }
        
        console.log('✅ Código del agente generado exitosamente');
      } else {
        throw new Error(result.error || 'Error generando código');
      }
    } catch (error) {
      console.error('❌ Error generando código:', error);
      setGenerationError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsGenerating(false);
    }
  };

  // ✅ Generar código del agente con IA
  const generateAgentCode = async () => {
    if (!naturalInstructions.trim() || !siteMap?.base_url) {
      console.log('❌ Faltan instrucciones o URL base');
      console.log('📝 Instrucciones:', naturalInstructions);
      console.log('🌐 SiteMap:', siteMap);
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      console.log('🤖 Generando código del agente...');
      console.log('📝 Instrucciones:', naturalInstructions);
      console.log('🌐 SiteMap:', siteMap);
      console.log('🔍 ExplorerInsights:', explorerInsights);
      
      const requestBody = {
        instructions: naturalInstructions,
        siteMap: siteMap,
        existingAgent: agent,
        explorerInsights: explorerInsights
      };
      
      console.log('📤 Request body:', requestBody);
      
      const response = await fetch(`${EXTRACTORW_API_URL}/agents/generate-agent-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Código generado:', result);

      if (result.success && result.data) {
        // ✅ Mapear la respuesta del backend al formato esperado
        const generatedCode = {
          extractionLogic: result.data.extractionLogic || result.data.extraction_target,
          selectors: result.data.selectors || [],
          workflow: result.data.workflow || [],
          confidence: result.data.confidence || 0.8,
          reasoning: result.data.reasoning || '',
          execution_mode: result.data.execution_mode,
          requires_browser: result.data.requires_browser
        };
        
        setGeneratedCode(generatedCode);
        console.log('🎯 Estado generatedCode actualizado:', generatedCode);
        
        // ✅ Cambiar automáticamente a la pestaña "Código Generado"
        setActiveTab('generated');
        
        // ✅ Actualizar campos del agente con la información generada
        if (result.data.suggestedName && !agentName) {
          setAgentName(result.data.suggestedName);
        }
        if (result.data.suggestedTarget && !extractionTarget) {
          setExtractionTarget(result.data.suggestedTarget);
        }
        if (result.data.suggestedDescription && !dataDescription) {
          setDataDescription(result.data.suggestedDescription);
        }
        
        console.log('✅ Código del agente generado exitosamente');
      } else {
        throw new Error(result.error || 'Error generando código');
      }
    } catch (error) {
      console.error('❌ Error generando código:', error);
      setGenerationError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsGenerating(false);
    }
  };

  // ✅ Aplicar estrategia completa
  const applyStrategy = async (strategy: any) => {
    if (!strategy) return;

    console.log('🎯 Aplicando estrategia:', strategy);

    // Encontrar elementos relacionados con esta estrategia
    const strategyElements = explorerInsights?.extractableElements?.filter((el: any) => {
      // Intentar emparejar elementos basados en selectores mencionados en los pasos
      const stepsText = strategy.steps?.join(' ') || '';
      return el.suggestedSelectors?.some((selector: string) => stepsText.includes(selector));
    }) || [];

    console.log('🔍 Elementos encontrados para la estrategia:', strategyElements);

    // Si encontramos elementos, aplicarlos
    if (strategyElements.length > 0) {
      console.log('✅ Aplicando elementos múltiples');
      applyMultipleElements(strategyElements);
      
      // ✅ Generar código automáticamente
      setTimeout(async () => {
        console.log('🤖 Generando código después de aplicar elementos...');
        await generateAgentCode();
      }, 1000); // Aumentar tiempo para que se establezcan las instrucciones
    } else {
      // Si no, usar la descripción de la estrategia directamente
      const strategyInstructions = `${strategy.strategy}\n\n${strategy.description}\n\nPasos:\n${strategy.steps?.join('\n') || ''}`;
      console.log('📝 Estableciendo instrucciones de estrategia:', strategyInstructions);
      
      setNaturalInstructions(strategyInstructions);
      setAgentName(strategy.strategy.substring(0, 50));
      setActiveTab('ia');
      
      // ✅ Generar código automáticamente con la estrategia usando las instrucciones directamente
      setTimeout(async () => {
        console.log('🤖 Generando código después de establecer instrucciones...');
        console.log('📝 Usando instrucciones directas:', strategyInstructions);
        await generateAgentCodeWithInstructions(strategyInstructions);
      }, 1000); // Aumentar tiempo para que se establezcan las instrucciones
    }
  };

  const applyExplorerElement = (element: any) => {
    // Auto-fill fields based on Explorer detected element
    if (element.name && !agentName) {
      setAgentName(`Extractor de ${element.name}`);
    }

    if (element.description && !extractionTarget) {
      setExtractionTarget(element.description);
    }

    // Smart table name generation
    if (!dynamicTableName) {
      const tableName = generateSmartTableName(element, siteMap);
      setDynamicTableName(tableName);
      setDatabaseEnabled(true);
    }

    // Auto-generate data description based on element and site
    if (!dataDescription) {
      let description = `Extracción de ${element.name.toLowerCase()} desde ${siteMap?.site_name || 'sitio web'}`;
      if (element.dataType) {
        description += ` (${element.dataType})`;
      }
      if (element.description) {
        description += `. ${element.description}`;
      }
      setDataDescription(description);
    }

    // Build natural instructions incorporating Explorer insights
    let instructions = `Necesito extraer información sobre: ${element.name}\n\n`;
    instructions += `Descripción: ${element.description}\n\n`;

    if (element.dataType) {
      instructions += `Tipo de datos: ${element.dataType}\n\n`;
    }

    if (element.suggestedSelectors && element.suggestedSelectors.length > 0) {
      instructions += `Selectores CSS sugeridos por Explorer:\n`;
      element.suggestedSelectors.forEach((selector: string, index: number) => {
        instructions += `${index + 1}. ${selector}\n`;
      });
      instructions += '\n';
    }

    instructions += `Sitio web: ${siteMap?.site_name} (${siteMap?.base_url})`;

    // Add site-specific insights if available
    if (explorerInsights?.siteAnalysis) {
      instructions += `\n\nAnálisis del sitio:\n`;
      instructions += `- Tipo: ${explorerInsights.siteAnalysis.type}\n`;
      instructions += `- Complejidad: ${explorerInsights.siteAnalysis.complexity}\n`;
      instructions += `- Estructura: ${explorerInsights.siteAnalysis.structure}\n`;
    }

    setNaturalInstructions(instructions);
    setSelectedExplorerElement(element);
    setActiveTab('intelligent');
  };

  const getExplorerRecommendations = () => {
    if (!explorerInsights) return [];

    return explorerInsights.recommendations || [];
  };

  const getExplorerStrategies = () => {
    if (!explorerInsights?.scrapingStrategies) return [];

    return explorerInsights.scrapingStrategies;
  };

  // Smart table name generation based on element and site
  const generateSmartTableName = (element: any, siteMap: SiteMap): string => {
    // Clean site name for table naming
    const siteName = siteMap?.site_name
      ? siteMap.site_name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '')
      : 'site';

    // Clean element name for table naming
    const elementName = element.name
      ? element.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '')
      : 'data';

    // Data type mapping for better table names
    const typeMapping: Record<string, string> = {
      'productos': 'products',
      'noticias': 'articles',
      'precios': 'prices',
      'contactos': 'contacts',
      'eventos': 'events',
      'reviews': 'reviews',
      'inmuebles': 'properties',
      'categorías': 'categories'
    };

    const mappedType = typeMapping[element.dataType?.toLowerCase()] || elementName;

    return `${siteName}_${mappedType}`;
  };

  // Helper function to get common elements based on data type
  const getCommonElementsForType = (type: string): string[] => {
    const elementMap: Record<string, string[]> = {
      productos: [
        'Nombre del producto', 'Precio', 'Descripción', 'Imagen', 'Stock disponible',
        'Categoría', 'Marca', 'SKU/Código', 'Descuentos', 'Puntuación/Rating'
      ],
      noticias: [
        'Título', 'Fecha de publicación', 'Autor', 'Contenido/Resumen', 'Imagen principal',
        'Categoría', 'Tags/Etiquetas', 'URL del artículo', 'Número de comentarios', 'Tiempo de lectura'
      ],
      contactos: [
        'Nombre completo', 'Email', 'Teléfono', 'Empresa/Organización', 'Cargo/Posición',
        'Dirección', 'Redes sociales', 'Foto/Avatar', 'Biografía', 'Sitio web'
      ],
      precios: [
        'Precio base', 'Precio con descuento', 'Moneda', 'Fecha de actualización', 'Tipo de precio',
        'Periodo (mensual/anual)', 'Impuestos incluidos', 'Precio de envío', 'Ofertas especiales', 'Comparación'
      ],
      eventos: [
        'Título del evento', 'Fecha y hora', 'Ubicación', 'Descripción', 'Organizador',
        'Precio/Entrada', 'Categoría', 'Estado (confirmado/cancelado)', 'Duración', 'Requisitos'
      ],
      reviews: [
        'Puntuación/Rating', 'Texto de la reseña', 'Autor', 'Fecha', 'Título de la reseña',
        'Producto/Servicio', 'Pros y contras', 'Recomendación', 'Verificado', 'Respuesta del negocio'
      ],
      inmuebles: [
        'Precio', 'Tipo (casa/apartamento)', 'Metros cuadrados', 'Habitaciones', 'Baños',
        'Ubicación/Dirección', 'Fotos', 'Descripción', 'Antigüedad', 'Estado de conservación'
      ],
      otros: [
        'Título', 'Descripción', 'Fecha', 'Categoría', 'Precio/Valor',
        'Imagen', 'URL/Enlace', 'Estado', 'Ubicación', 'Contacto'
      ]
    };

    return elementMap[type] || elementMap.otros;
  };

  // Función para generar código usando GPT-5
  const generateExtractionCode = async () => {
    if (!naturalInstructions.trim()) {
      setGenerationError('Por favor, describe qué quieres extraer');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      // Llamar al servicio de generación de código inteligente (base normalizada)
      const response = await fetch(`${EXTRACTORW_API_URL}/agents/generate-agent-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instructions: naturalInstructions,
          siteMap: {
            site_name: siteMap?.site_name || 'No especificado',
            base_url: siteMap?.base_url || 'No especificado',
            site_structure: siteMap?.site_structure || {},
            navigation_summary: siteMap?.navigation_summary || 'No disponible'
          },
          // Include Explorer insights for better AI generation
          explorerInsights: explorerInsights,
          selectedElement: selectedExplorerElement,
          existingAgent: agent ? {
            name: agent.agent_name,
            target: agent.extraction_target,
            config: agent.extraction_config
          } : null
        })
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        setGeneratedCode({
          extractionLogic: result.data.extractionLogic,
          selectors: result.data.selectors || [],
          workflow: result.data.workflow || [],
          confidence: result.data.confidence || 0.8,
          reasoning: result.data.reasoning || ''
        });

        // Auto-completar campos básicos si están vacíos
        if (!agentName && result.data.suggestedName) {
          setAgentName(result.data.suggestedName);
        }
        if (!extractionTarget && result.data.suggestedTarget) {
          setExtractionTarget(result.data.suggestedTarget);
        }
        if (!dataDescription && result.data.suggestedDescription) {
          setDataDescription(result.data.suggestedDescription);
        }

        // Cambiar a la pestaña de código generado
        setActiveTab('generated');
      } else {
        throw new Error(result.error || 'Error al generar código');
      }
    } catch (error) {
      console.error('Error generating extraction code:', error);
      setGenerationError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsGenerating(false);
    }
  };

  // Función para aplicar el código generado
  const applyGeneratedCode = () => {
    if (!generatedCode) return;

    const newConfig = {
      ...agent?.extraction_config,
      generated: true,
      instructions: naturalInstructions,
      extractionLogic: generatedCode.extractionLogic,
      selectors: generatedCode.selectors,
      workflow: generatedCode.workflow,
      confidence: generatedCode.confidence,
      reasoning: generatedCode.reasoning,
      generatedAt: new Date().toISOString()
    };

    // Actualizar el target de extracción si se generó
    if (generatedCode.extractionLogic) {
      setExtractionTarget(generatedCode.extractionLogic);
    }

    // Cambiar a la pestaña de configuración para revisar
    setActiveTab('config');
  };

  // Generate executable JavaScript from extraction target description
  const generateExecutableCode = (description: string): string => {
    if (!description) return '';

    // If it's already JavaScript, return as-is
    if (description.includes('document.querySelector') ||
        description.includes('querySelectorAll') ||
        description.includes('return ')) {
      return description;
    }

    // Handle descriptive/instructional text by generating appropriate code
    if (description.length > 200 ||
        description.toLowerCase().includes('cualquier información') ||
        description.toLowerCase().includes('si no está') ||
        description.toLowerCase().includes('debe retornar') ||
        description.toLowerCase().includes('escribe javascript')) {

      console.log('🔄 Converting descriptive text to executable code:', description.substring(0, 100));

      // For Congreso Guatemala, generate specific template
      if (description.toLowerCase().includes('congreso') ||
          description.toLowerCase().includes('iniciativa') ||
          description.toLowerCase().includes('pdf') ||
          description.toLowerCase().includes('legislativ')) {
        return generateCongresoTemplate();
      }

      // For general cases, generate basic template
      return generateGenericTemplate();
    }

    // Generate basic JavaScript template from description
    let code = `// Auto-generated code from: ${description.substring(0, 100)}${description.length > 100 ? '...' : ''}
const items = [];

try {
  // TODO: Replace these selectors with actual ones from the page
  const elements = document.querySelectorAll('article, .item, .product, .news-item, .card');

  console.log(\`Found \${elements.length} potential elements\`);

  elements.forEach((element, index) => {
    try {
      // Extract common fields - customize these selectors based on the page structure
      const title = element.querySelector('h1, h2, h3, .title, [data-title]')?.textContent?.trim();
      const link = element.querySelector('a')?.href || element.closest('a')?.href;
      const description = element.querySelector('p, .description, .excerpt, .summary')?.textContent?.trim();
      const image = element.querySelector('img')?.src;
      const date = element.querySelector('[datetime], .date, time')?.textContent?.trim();

      // Create item object
      const item = {
        index: index + 1,
        title: title || 'No title found',
        link: link || null,
        description: description || null,
        image: image || null,
        date: date || null,
        extracted_at: new Date().toISOString()
      };

      // Only add if we found at least a title
      if (title && title !== 'No title found') {
        items.push(item);
        console.log(\`Item \${index + 1}:\`, item);
      }

    } catch (itemError) {
      console.warn(\`Error processing item \${index + 1}:\`, itemError);
    }
  });

} catch (error) {
  console.error('Extraction error:', error);
}

console.log(\`Successfully extracted \${items.length} items\`);
return items;`;

    // Try to make it more specific based on description keywords
    if (description.toLowerCase().includes('noticia')) {
      code = code.replace('article, .item, .product', 'article, .news-item, .noticia, .articulo');
    } else if (description.toLowerCase().includes('producto')) {
      code = code.replace('article, .item, .product', '.product, .producto, .item, [data-product]');
    } else if (description.toLowerCase().includes('evento')) {
      code = code.replace('article, .item, .product', '.event, .evento, .card, [data-event]');
    }

    return code;
  };

  // Generate specialized template for Congreso Guatemala
  const generateCongresoTemplate = (): string => {
    return `// Template específico para Congreso de Guatemala
const items = [];

try {
  // Buscar elementos de iniciativas en el congreso
  const initiatives = document.querySelectorAll('.initiative-item, .document-item, [class*="iniciativa"]');

  if (initiatives.length === 0) {
    console.log('No se encontraron elementos con selectores específicos, intentando selectores generales...');

    // Fallback a selectores más generales
    const fallbackElements = document.querySelectorAll('article, .card, .item, [class*="document"], [class*="pdf"]');
    console.log(\`Encontrados \${fallbackElements.length} elementos con selectores generales\`);

    fallbackElements.forEach((element, index) => {
      const title = element.querySelector('h1, h2, h3, .title, .nombre')?.textContent?.trim() ||
                   element.textContent?.trim()?.substring(0, 100) ||
                   \`Elemento \${index + 1}\`;

      const link = element.querySelector('a')?.href || element.closest('a')?.href;
      const pdfLink = element.querySelector('a[href*=".pdf"]')?.href;

      items.push({
        index: index + 1,
        titulo: title,
        enlace: link || pdfLink,
        tipo: 'documento',
        fecha_extraccion: new Date().toISOString()
      });
    });
  } else {
    console.log(\`Encontradas \${initiatives.length} iniciativas\`);

    initiatives.forEach((element, index) => {
      const numero = element.querySelector('.numero, [class*="number"]')?.textContent?.trim();
      const titulo = element.querySelector('.titulo, .title, h1, h2, h3')?.textContent?.trim();
      const fecha = element.querySelector('.fecha, .date, [datetime]')?.textContent?.trim();
      const estado = element.querySelector('.estado, .status')?.textContent?.trim();
      const autores = element.querySelector('.autores, .authors')?.textContent?.trim();
      const link = element.querySelector('a')?.href || element.closest('a')?.href;
      const pdfLink = element.querySelector('a[href*=".pdf"]')?.href;

      items.push({
        index: index + 1,
        numero_iniciativa: numero,
        titulo: titulo || \`Iniciativa \${index + 1}\`,
        fecha_presentacion: fecha,
        estado: estado,
        autores: autores,
        enlace_documento: link,
        enlace_pdf: pdfLink,
        fecha_extraccion: new Date().toISOString()
      });
    });
  }
} catch (error) {
  console.error('Error extrayendo datos del congreso:', error);
  items.push({
    error: true,
    mensaje: 'Error durante la extracción: ' + error.message,
    fecha_error: new Date().toISOString()
  });
}

console.log(\`Extracción completada: \${items.length} elementos encontrados\`);
return items;`;
  };

  // Generate generic template
  const generateGenericTemplate = (): string => {
    return `// Template genérico para extracción de datos
const items = [];

try {
  // Intentar encontrar elementos comunes en páginas web
  const elements = document.querySelectorAll('article, .card, .item, .post, .product, .news-item, [class*="item"]');

  console.log(\`Encontrados \${elements.length} elementos potenciales\`);

  if (elements.length === 0) {
    console.log('No se encontraron elementos con selectores comunes, buscando cualquier contenido...');

    // Fallback para páginas sin estructura clara
    const textNodes = document.querySelectorAll('h1, h2, h3, h4, p, div, span');
    const relevantElements = Array.from(textNodes).filter(el =>
      el.textContent && el.textContent.trim().length > 10
    ).slice(0, 10);

    relevantElements.forEach((element, index) => {
      items.push({
        index: index + 1,
        contenido: element.textContent?.trim()?.substring(0, 200),
        tag: element.tagName.toLowerCase(),
        fecha_extraccion: new Date().toISOString()
      });
    });
  } else {
    elements.forEach((element, index) => {
      const title = element.querySelector('h1, h2, h3, .title, [data-title]')?.textContent?.trim();
      const link = element.querySelector('a')?.href || element.closest('a')?.href;
      const description = element.querySelector('p, .description, .excerpt, .summary')?.textContent?.trim();
      const image = element.querySelector('img')?.src;
      const date = element.querySelector('[datetime], .date, time')?.textContent?.trim();

      items.push({
        index: index + 1,
        titulo: title || \`Elemento \${index + 1}\`,
        enlace: link,
        descripcion: description,
        imagen: image,
        fecha: date,
        fecha_extraccion: new Date().toISOString()
      });
    });
  }
} catch (error) {
  console.error('Error durante la extracción:', error);
  items.push({
    error: true,
    mensaje: 'Error durante la extracción: ' + error.message,
    fecha_error: new Date().toISOString()
  });
}

console.log(\`Extracción completada: \${items.length} elementos encontrados\`);
return items;`;
  };

  // Function to load agent code into debug mode
  const loadAgentCodeToDebug = () => {
    setIsLoadingDebugCode(true);

    try {
      let existingCode = '';
      let codeSource: 'manual' | 'agent' | 'generated' = 'manual';

      // Debug logging to understand what's available
      console.log('🔍 Debug loading check:', {
        'generatedCode?.extractionLogic': generatedCode?.extractionLogic ? 'EXISTS' : 'MISSING',
        'agent?.extraction_config?.extractionLogic': agent?.extraction_config?.extractionLogic ? 'EXISTS' : 'MISSING',
        'agent?.extraction_target': agent?.extraction_target ? 'EXISTS' : 'MISSING',
        'extractionTarget': extractionTarget ? 'EXISTS' : 'MISSING'
      });

    // Priority: Generated code > Extraction target > Generated code from current session
    if (generatedCode?.extractionLogic) {
      // Check if it's actual JavaScript code or just instructions
      const isActualCode = generatedCode.extractionLogic.includes('document.querySelector') ||
                          generatedCode.extractionLogic.includes('querySelectorAll') ||
                          generatedCode.extractionLogic.includes('return') ||
                          generatedCode.extractionLogic.includes('const ') ||
                          generatedCode.extractionLogic.includes('let ') ||
                          generatedCode.extractionLogic.includes('var ');

      if (isActualCode) {
        existingCode = generatedCode.extractionLogic;
        codeSource = 'generated';
        console.log('🎯 Using generatedCode.extractionLogic (actual JavaScript)');
      } else {
        // Generate code from the description
        console.log('🎯 generatedCode.extractionLogic is descriptive text, generating JavaScript...');
        existingCode = generateExecutableCode(generatedCode.extractionLogic);
        codeSource = 'generated';
        console.log('🎯 Generated JavaScript from description');
      }
    } else if (agent?.extraction_config?.extractionLogic && agent.extraction_config?.generated) {
      existingCode = agent.extraction_config.extractionLogic;
      codeSource = 'generated';
      console.log('🎯 Using agent.extraction_config.extractionLogic');
    } else if (agent?.extraction_target) {
      // Generate executable JavaScript from the extraction target
      existingCode = generateExecutableCode(agent.extraction_target);
      codeSource = 'agent';
      console.log('🎯 Using agent.extraction_target, generating code');
    } else if (extractionTarget) {
      // Use current extraction target if available
      existingCode = generateExecutableCode(extractionTarget);
      codeSource = 'agent';
      console.log('🎯 Using extractionTarget, generating code');
    }

    if (existingCode && existingCode.trim()) {
      setDebugScript(existingCode);
      setDebugCodeSource(codeSource);
      setHasUnsavedChanges(false);
      setDebugResults(null); // Clear previous results
      console.log(`🔄 Loaded ${codeSource} code for debug mode (${existingCode.length} characters)`);
    } else {
      // Generate a specific template based on the URL/domain
      let templateCode = '';
      if (debugUrl || agent?.url) {
        const url = debugUrl || agent?.url || '';
        if (url.includes('congreso.gob.gt')) {
          templateCode = generateCongresoTemplate();
        } else {
          templateCode = generateGenericTemplate();
        }
      } else {
        templateCode = generateGenericTemplate();
      }

      setDebugScript(templateCode);
      setDebugCodeSource('manual');
      setHasUnsavedChanges(false);
      console.log('🔄 Generated specialized template for debug mode');
    }
    } finally {
      setIsLoadingDebugCode(false);
    }
  };

  // Force reload debug code (ignores all conditions)
  const forceReloadDebugCode = () => {
    console.log('🔄 Force reloading debug code...');
    setDebugScript(''); // Clear current script
    setHasUnsavedChanges(false);
    setForceReloadKey(prev => prev + 1); // Trigger useEffect
  };

  // Function to detect if debug script has been modified
  const handleDebugScriptChange = (newScript: string) => {
    setDebugScript(newScript);

    // Auto-save to localStorage for persistence
    const saveKey = `debug_script_${agent?.id || 'new'}`;
    localStorage.setItem(saveKey, newScript);

    // Simple syntax validation
    validateCode(newScript);

    // Check if this differs from the original agent code
    let originalCode = '';
    if (generatedCode?.extractionLogic) {
      originalCode = generatedCode.extractionLogic;
    } else if (agent?.extraction_config?.extractionLogic) {
      originalCode = agent.extraction_config.extractionLogic;
    } else if (agent?.extraction_target) {
      originalCode = agent.extraction_target;
    }

    const hasChanges = newScript.trim() !== originalCode.trim();
    setHasUnsavedChanges(hasChanges);

    if (hasChanges && debugCodeSource !== 'manual') {
      setDebugCodeSource('manual'); // Mark as manually edited
    }
  };

  // Load saved debug script from localStorage
  const loadSavedDebugScript = () => {
    const saveKey = `debug_script_${agent?.id || 'new'}`;
    const saved = localStorage.getItem(saveKey);
    if (saved && saved.trim()) {
      setDebugScript(saved);
      setDebugCodeSource('manual');
      setHasUnsavedChanges(true);
      console.log('🔄 Loaded saved debug script from localStorage');
      return true;
    }
    return false;
  };

  // Simple JavaScript syntax validation
  const validateCode = (code: string) => {
    const errors: string[] = [];

    if (!code.trim()) {
      setCodeValidation({ valid: true, errors: [], warnings: [] });
      return;
    }

    try {
      // Basic syntax check by trying to create a function
      new Function(code);

      // Only check for critical blocking issues
      if (code.includes('alert(') || code.includes('confirm(') || code.includes('prompt(')) {
        errors.push('No uses alert(), confirm(), o prompt() - bloquean la ejecución');
      }

      if (code.includes('document.write')) {
        errors.push('No uses document.write() - interfiere con la extracción');
      }

    } catch (syntaxError: any) {
      errors.push(`Error de sintaxis: ${syntaxError.message}`);
    }

    setCodeValidation({
      valid: errors.length === 0,
      errors,
      warnings: [] // Remove warnings for simplicity
    });
  };

  // Apply successful debug script changes back to agent configuration
  const applyDebugToAgent = () => {
    if (!debugScript.trim()) {
      setGenerationError('No hay script para aplicar');
      return;
    }

    if (!debugResults?.success) {
      setGenerationError('Solo se pueden aplicar scripts que se ejecutaron exitosamente');
      return;
    }

    // Update extraction target with debug script
    setExtractionTarget(debugScript);

    // If we have generated code structure, update it too
    if (generatedCode) {
      setGeneratedCode({
        ...generatedCode,
        extractionLogic: debugScript,
        confidence: Math.min(generatedCode.confidence + 0.1, 1.0), // Boost confidence slightly for tested code
        reasoning: generatedCode.reasoning + ' (Código refinado y probado en modo Debug)'
      });
    }

    // Mark as saved and update source
    setHasUnsavedChanges(false);
    setDebugCodeSource(generatedCode ? 'generated' : 'agent');

    // Show success feedback
    setShowApplySuccess(true);
    setTimeout(() => setShowApplySuccess(false), 3000); // Hide after 3 seconds

    // Navigate to config tab to see changes
    setActiveTab('config');

    console.log('✅ Applied debug script to agent configuration');
  };

  // Quick test function for existing agent
  const quickTestAgent = async () => {
    setIsDebugging(true);
    setGenerationError(null);

    try {
      // If we have an existing agent ID, use the streamlined test-existing endpoint
      // ✅ Si hay código en el editor, usarlo en lugar del agente guardado
      if (debugScript.trim()) {
        console.log('🚀 Ejecutando código del editor (mejorado/modificado)');
        await runDebugScript();
        return; // ✅ Salir temprano
      }
      
      if (agent?.id && !isCreating) {
        console.log(`🚀 Quick testing existing agent: ${agent.id}`);

        const response = await fetch(`${EXTRACTORW_API_URL}/agents/test-existing`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            agent_id: agent.id,
            url: debugUrl,
            config: {
              maxItems: 10,
              timeout: 30000
            }
          })
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        setDebugResults(result);
        
        // ✅ Capturar información de diagnóstico
        if (result.page_info) {
          setPageInfo(result.page_info);
        }
        if (result.diagnostic?.issues) {
          setDiagnosticIssues(result.diagnostic.issues);
        }

        // Add to history with agent metadata
        const historyEntry = {
          timestamp: new Date().toISOString(),
          script: result.agent_metadata?.code_source === 'generated' ? 'Código generado por IA' : 'Código del agente',
          url: debugUrl,
          result: result,
          success: result.success,
          agent_test: true,
          agent_name: result.agent_metadata?.agent_name
        };
        setDebugHistory(prev => [historyEntry, ...prev.slice(0, 9)]);

        // Auto-load the agent code if not already loaded
        if (!debugScript.trim() && result.success) {
          loadAgentCodeToDebug();
        }

      } else {
        // Fallback to regular debug script execution
        if (!debugScript.trim()) {
          loadAgentCodeToDebug();
          // Wait a bit for state to update, then run
          setTimeout(() => runDebugScript(), 100);
        } else {
          await runDebugScript();
        }
      }

    } catch (error) {
      console.error('Error in quick test:', error);
      setGenerationError(error instanceof Error ? error.message : 'Error ejecutando quick test');
      setDebugResults({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    } finally {
      setIsDebugging(false);
    }
  };

  // Debug execution - Use exact same path as main "🚀 Probar Agente" button
  const runDebugScript = async () => {
    if (!debugScript.trim() || !debugUrl.trim()) {
      setGenerationError('Script de debug y URL son requeridos');
      return;
    }

    setIsDebugging(true);
    setGenerationError(null);

    console.log('🔄 Debug: Executing script directly...');

    try {
      // Use the debug-script endpoint for direct JavaScript execution
      const response = await fetch(`${EXTRACTORW_API_URL}/agents/debug-script`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: debugScript,
          url: debugUrl,
          config: {
            maxItems: 20,
            timeout: 30000
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setDebugResults(result);
      
      // ✅ Capturar información de diagnóstico
      if (result.page_info) {
        setPageInfo(result.page_info);
      }
      if (result.diagnostic?.issues) {
        setDiagnosticIssues(result.diagnostic.issues);
      }

      // Add to debug history
      const historyEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        script: debugScript,
        url: debugUrl,
        result: result,
        agent_test: false,
        agent_name: agentName || 'Debug Test'
      };
      setDebugHistory(prev => [historyEntry, ...prev.slice(0, 9)]);

      console.log('✅ Debug script executed successfully');

    } catch (error: any) {
      console.error('Error in debug execution:', error);
      setGenerationError(error.message || 'Error ejecutando debug');
      setDebugResults({
        success: false,
        error: error.message || 'Error desconocido'
      });
    } finally {
      setIsDebugging(false);
    }
  };

  const loadScriptFromHistory = (historyEntry: any) => {
    if (historyEntry.agent_test) {
      // For agent tests, just show the results without loading script
      setDebugResults(historyEntry.result);
      setDebugUrl(historyEntry.url);
      // Optionally load the agent code if available
      if (!debugScript.trim()) {
        loadAgentCodeToDebug();
      }
    } else {
      // For manual tests, load the actual script
      setDebugScript(historyEntry.script);
      setDebugUrl(historyEntry.url);
      setDebugResults(historyEntry.result);
      setDebugCodeSource('manual');
      setHasUnsavedChanges(false);
    }
  };

  // AI-powered code improvement
  const improveCodeWithAI = async () => {
    if (!debugScript.trim()) {
      setGenerationError('No hay código para mejorar');
      return;
    }

    // ✅ NUNCA bloquear - siempre dejar que el backend intente mejorar
    // El backend es lo suficientemente inteligente para dar el siguiente paso correcto

    setIsGenerating(true);
    setGenerationError(null);

    try {
      console.log('🤖 Mejorando código con IA...');
      
      // ✅ Incluir diagnóstico completo para mejor contexto
      const diagnosticContext = {
        page_info: pageInfo,
        issues: diagnosticIssues,
        has_antibot: diagnosticIssues.some((i: any) => i.type === 'antibot'),
        has_spa: diagnosticIssues.some((i: any) => i.type === 'spa_dynamic_content'),
        has_empty_page: diagnosticIssues.some((i: any) => i.type === 'empty_page')
      };

      console.log('📊 Contexto de diagnóstico:', diagnosticContext);
      
      // ✅ Log si hay anti-bot (backend genera template directo)
      if (diagnosticContext.has_antibot) {
        const antibotIssue = diagnosticIssues.find((i: any) => i.type === 'antibot');
        console.warn('🔒 Anti-bot detectado:', antibotIssue?.title);
        console.log('💡 Backend generará código template directo (sin IA para evitar errores).');
      }

      const response = await fetch(`${EXTRACTORW_API_URL}/agents/improve-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: debugScript,
          results: debugResults,
          url: debugUrl,
          error_message: debugResults?.success === false ? debugResults.error : null,
          improvement_type: debugResults?.success === false ? 'fix_errors' : 'optimize',
          // ✅ Agregar contexto de diagnóstico
          diagnostic: diagnosticContext
        })
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📥 Respuesta del backend:', result);
      
      if (result.success && result.data?.improved_code) {
        const improvedCode = result.data.improved_code;
        console.log('✅ Código mejorado recibido:', improvedCode.substring(0, 100) + '...');
        
        // Update state
        setDebugScript(improvedCode);
        setDebugCodeSource('manual'); // ✅ Marcar como manual para prevenir auto-reload
        setHasUnsavedChanges(true);  // ✅ Marcar como modificado para mostrar "Aplicar"

        // Show improvement explanation
        console.log('💡 Explicación:', result.data.explanation);
        console.log('📋 Cambios realizados:', result.data.changes);
        
        if (result.data.suggestions?.length > 0) {
          console.log('💬 Sugerencias:', result.data.suggestions);
        }

        // Clear previous results to encourage re-testing
        setDebugResults(null);
        // ✅ NO limpiar diagnóstico - mantener pageInfo y diagnosticIssues para contexto
        // setPageInfo(null);
        // setDiagnosticIssues([]);
        
        // ✅ Silencioso - sin pop-ups molestos
        console.log('✅ Código actualizado en el editor - listo para probar');
        console.log('🔍 Diagnóstico mantenido:', { pageInfo, diagnosticIssues });
      } else {
        throw new Error(result.error || 'Error mejorando código: no se recibió código mejorado');
      }
    } catch (error) {
      console.error('❌ Error improving code:', error);
      setGenerationError(error instanceof Error ? error.message : 'Error mejorando código');
    } finally {
      setIsGenerating(false);
    }
  };

  // AI-powered error explanation
  const explainErrorWithAI = async () => {
    if (!debugResults || debugResults.success) {
      setGenerationError('No hay errores para explicar');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      console.log('🤖 Explicando error con IA...');

      const response = await fetch(`${EXTRACTORW_API_URL}/agents/explain-error`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: debugScript,
          error_message: debugResults.error,
          url: debugUrl,
          logs: debugResults.logs || []
        })
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success) {
        // Create a custom result to show the AI explanation
        const explainedResult = {
          ...debugResults,
          ai_explanation: result.data,
          timestamp: new Date().toISOString()
        };
        setDebugResults(explainedResult);

        // Apply fixed code if available
        if (result.data.fixed_code) {
          setDebugScript(result.data.fixed_code);
          setDebugCodeSource('generated');
          setHasUnsavedChanges(true);
          console.log('✅ Código corregido aplicado automáticamente');
        }
      } else {
        throw new Error(result.error || 'Error explicando error');
      }
    } catch (error) {
      console.error('Error explaining error:', error);
      setGenerationError(error instanceof Error ? error.message : 'Error explicando error');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateDebugScript = async () => {
    if (!naturalInstructions.trim()) {
      setGenerationError('Primero describe qué quieres extraer en la pestaña IA Generativa');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const response = await fetch(`${EXTRACTORW_API_URL}/agents/generate-debug-script`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instructions: naturalInstructions,
          url: debugUrl,
          siteMap: siteMap
        })
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success) {
        setDebugScript(result.data.script);
        setDebugCodeSource('generated');
        setHasUnsavedChanges(true);
      } else {
        throw new Error(result.error || 'Error generando script de debug');
      }
    } catch (error) {
      console.error('Error generating debug script:', error);
      setGenerationError(error instanceof Error ? error.message : 'Error generando script');
    } finally {
      setIsGenerating(false);
    }
  };

  // Función para guardar el agente
  const handleSave = async () => {
    if (!agentName.trim() || !extractionTarget.trim()) {
      setGenerationError('Nombre del agente y objetivo de extracción son requeridos');
      return;
    }

    // Validate database configuration if enabled
    if (databaseEnabled) {
      if (!dynamicTableName.trim()) {
        setGenerationError('Nombre de la tabla es requerido para la base de datos pública');
        return;
      }

      // Validate table name format (alphanumeric and underscores only)
      const tableNameRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
      if (!tableNameRegex.test(dynamicTableName.trim())) {
        setGenerationError('El nombre de la tabla debe comenzar con letra y solo contener letras, números y guiones bajos');
        return;
      }
    }

    setIsSaving(true);
    setGenerationError(null);

    try {
      const agentData = {
        site_map_id: siteMap?.id || null,
        agent_name: agentName,
        extraction_target: extractionTarget,
        dynamic_table_name: dynamicTableName.trim() || undefined,
        data_description: dataDescription.trim() || undefined,
        database_config: databaseEnabled ? {
          enabled: true,
          table_name: dynamicTableName.trim() || agentName.toLowerCase().replace(/\s+/g, '_'),
          data_description: dataDescription.trim(),
          use_public_database: true
        } : { enabled: false },
        extraction_config: {
          ...(agent?.extraction_config || {}),
          ...(generatedCode ? {
            generated: true,
            instructions: naturalInstructions,
            selectors: generatedCode.selectors,
            workflow: generatedCode.workflow,
            confidence: generatedCode.confidence,
            reasoning: generatedCode.reasoning,
            generatedAt: new Date().toISOString(),
            // ✅ Campos críticos para ejecución
            mode: generatedCode.execution_mode || 'sandbox', // 'webagent' o 'sandbox'
            execution_mode: generatedCode.execution_mode || 'sandbox',
            requires_browser: generatedCode.requires_browser || false,
            extractionLogic: generatedCode.extractionLogic || null // JS code o null si webagent
          } : {})
        }
      };

      console.log('🔧 Saving agent data:', agentData);
      console.log('🤖 Generated code included:', !!generatedCode);

      await onSave(agentData);

      console.log('✅ Agent saved successfully');

      // Don't close modal here - let the parent component handle it
    } catch (error) {
      console.error('❌ Error saving agent:', error);
      setGenerationError(`Error al guardar el agente: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-600" />
                {isCreating ? 'Crear Agente Inteligente' : 'Editar Agente'}
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Sitio: <span className="font-medium">{siteMap?.site_name || 'No especificado'}</span> - {siteMap?.base_url || 'No especificado'}
              </p>
            </div>
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <div className="border-b border-slate-200 px-6">
              <TabsList className={`grid w-full ${explorerInsights ? 'grid-cols-7' : 'grid-cols-6'}`}>
                {explorerInsights && (
                  <TabsTrigger value="explorer" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Explorer
                  </TabsTrigger>
                )}
                <TabsTrigger value="basic" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Básico
                </TabsTrigger>
                <TabsTrigger value="wizard" className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Asistente
                </TabsTrigger>
                <TabsTrigger value="intelligent" className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4" />
                  IA Generativa
                </TabsTrigger>
                <TabsTrigger value="generated" className="flex items-center gap-2" disabled={!generatedCode}>
                  <Code className="h-4 w-4" />
                  Código Generado
                </TabsTrigger>
                <TabsTrigger value="debug" className="flex items-center gap-2">
                  <Bug className="h-4 w-4" />
                  Debug
                </TabsTrigger>
                <TabsTrigger value="config" className="flex items-center gap-2">
                  <Cog className="h-4 w-4" />
                  Configuración
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              {/* Pestaña Explorer Insights */}
              {explorerInsights && (
                <TabsContent value="explorer" className="space-y-4 mt-0">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Eye className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-semibold">Insights de Explorer</h3>
                      <Badge variant="outline" className="text-blue-600 border-blue-300">
                        IA Detectado
                      </Badge>
                    </div>

                    {/* Quick Start Section */}
                    {suggestedElements.length > 0 && (
                      <Card className="border-green-200 bg-green-50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2 text-green-800">
                            <Zap className="h-4 w-4" />
                            🚀 Inicio Rápido - Elementos Recomendados
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-2">
                            {suggestedElements.slice(0, 3).map((element: any, index: number) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-green-200">
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                    #{index + 1}
                                  </Badge>
                                  <span className="font-medium">{element.name}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {element.dataType}
                                  </Badge>
                                  <span className="text-xs text-green-600">
                                    Score: {element.priority}
                                  </span>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => applyExplorerElement(element)}
                                  className="bg-green-600 text-white hover:bg-green-700"
                                >
                                  <Zap className="h-3 w-3 mr-1" />
                                  Usar
                                </Button>
                              </div>
                            ))}
                            {suggestedElements.length > 3 && (
                              <p className="text-xs text-green-600 text-center">
                                +{suggestedElements.length - 3} elementos más disponibles abajo
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Site Analysis Summary */}
                    {explorerInsights.siteAnalysis && (
                      <Card className="border-blue-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Info className="h-4 w-4" />
                            Análisis del Sitio
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Tipo:</span>
                              <p className="text-slate-600">{explorerInsights.siteAnalysis.type}</p>
                            </div>
                            <div>
                              <span className="font-medium">Complejidad:</span>
                              <p className="text-slate-600">{explorerInsights.siteAnalysis.complexity}</p>
                            </div>
                            <div>
                              <span className="font-medium">Estructura:</span>
                              <p className="text-slate-600">{explorerInsights.siteAnalysis.structure}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Extractable Elements */}
                    {explorerInsights.extractableElements && explorerInsights.extractableElements.length > 0 && (
                      <Card className="border-green-200">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Target className="h-4 w-4" />
                              Elementos Extraíbles Detectados
                            </CardTitle>
                            {/* ✅ Botón para usar elementos seleccionados */}
                            {selectedElements.length > 0 && (
                              <Button
                                size="sm"
                                onClick={applySelectedElements}
                                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Usar Seleccionados ({selectedElements.length})
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            {explorerInsights.extractableElements.map((element: any, index: number) => {
                              const isSelected = selectedElements.some(el => el.name === element.name);
                              return (
                                <div 
                                  key={index} 
                                  className={`border rounded-lg p-3 transition-all ${
                                    isSelected ? 'border-blue-400 bg-blue-50' : 'border-slate-200'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-3 flex-1">
                                      {/* ✅ Checkbox para selección múltiple */}
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => toggleElementSelection(element)}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                      />
                                      <div className="flex items-center gap-2">
                                        <h4 className="font-medium">{element.name}</h4>
                                        <Badge variant="secondary" className="text-xs">
                                          {element.dataType}
                                        </Badge>
                                      </div>
                                    </div>
                                    <Button
                                      size="sm"
                                      onClick={() => applyExplorerElement(element)}
                                      className="bg-blue-600 text-white hover:bg-blue-700"
                                    >
                                      <Zap className="h-3 w-3 mr-1" />
                                      Usar Solo
                                    </Button>
                                  </div>
                                  <p className="text-sm text-slate-600 mb-2 ml-7">{element.description}</p>
                                {element.suggestedSelectors && element.suggestedSelectors.length > 0 && (
                                  <div className="text-xs ml-7">
                                    <span className="font-medium">Selectores sugeridos:</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {element.suggestedSelectors.map((selector: string, sIndex: number) => (
                                        <code key={sIndex} className="bg-slate-100 text-slate-700 px-2 py-1 rounded">
                                          {selector}
                                        </code>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Scraping Strategies */}
                    {explorerInsights.scrapingStrategies && explorerInsights.scrapingStrategies.length > 0 && (
                      <Card className="border-purple-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Brain className="h-4 w-4" />
                            Estrategias de Extracción Recomendadas
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            {explorerInsights.scrapingStrategies.map((strategy: any, index: number) => (
                              <div key={index} className="border border-slate-200 rounded-lg p-3 hover:border-purple-300 transition-colors">
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium">{strategy.strategy}</h4>
                                    <Badge
                                      variant="secondary"
                                      className={`text-xs ${
                                        strategy.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                        strategy.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-red-100 text-red-700'
                                      }`}
                                    >
                                      {strategy.difficulty}
                                    </Badge>
                                  </div>
                                  {/* ✅ Botón para usar estrategia completa */}
                                  <Button
                                    size="sm"
                                    onClick={() => applyStrategy(strategy)}
                                    className="bg-purple-600 text-white hover:bg-purple-700"
                                  >
                                    <Brain className="h-3 w-3 mr-1" />
                                    Usar Estrategia
                                  </Button>
                                </div>
                                <p className="text-sm text-slate-600 mb-2">{strategy.description}</p>
                                {strategy.steps && strategy.steps.length > 0 && (
                                  <div className="text-xs">
                                    <span className="font-medium">Pasos:</span>
                                    <p className="text-slate-600 mt-1">{strategy.steps.join(' → ')}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Recommendations */}
                    {explorerInsights.recommendations && explorerInsights.recommendations.length > 0 && (
                      <Card className="border-orange-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Lightbulb className="h-4 w-4" />
                            Recomendaciones
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <ul className="space-y-2">
                            {explorerInsights.recommendations.map((rec: string, index: number) => (
                              <li key={index} className="text-sm text-slate-600 flex items-start gap-2">
                                <span className="text-orange-600 mt-1">•</span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {/* Confidence Score */}
                    {explorerInsights.confidence && (
                      <div className="flex items-center justify-center p-4 bg-slate-50 rounded-lg">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-slate-700">
                            {(explorerInsights.confidence * 100).toFixed(0)}%
                          </div>
                          <div className="text-sm text-slate-500">Confianza del Análisis</div>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              )}

              {/* Pestaña Básica */}
              <TabsContent value="basic" className="space-y-4 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Información Básica
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Nombre del agente *
                      </label>
                      <Input 
                        placeholder="Ej: Extractor de noticias diarias"
                        value={agentName}
                        onChange={(e) => setAgentName(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Objetivo de extracción *
                      </label>
                      <Textarea 
                        placeholder="Ej: Extrae los títulos y links de todas las noticias de la portada, junto con la fecha de publicación"
                        value={extractionTarget}
                        onChange={(e) => setExtractionTarget(e.target.value)}
                        rows={4}
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Describe exactamente qué información debe extraer este agente del sitio web.
                      </p>
                    </div>

                    <div className="border-t border-slate-200 pt-4">
                      <h4 className="text-sm font-medium text-slate-900 mb-3 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Base de Datos Avanzada (Opcional)
                      </h4>

                      {/* Database Enable Toggle */}
                      <div className="mb-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={databaseEnabled}
                            onChange={(e) => setDatabaseEnabled(e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-slate-700">
                            Guardar datos extraídos en base de datos pública
                          </span>
                        </label>
                        <p className="text-xs text-slate-500 mt-1 ml-6">
                          Los datos se guardarán en la base de datos de PulseJournal con acceso público
                        </p>
                      </div>

                      {databaseEnabled && (
                        <div className="space-y-3 bg-slate-50 p-3 rounded-lg border">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Nombre de la tabla de datos *
                            </label>
                            <Input
                              placeholder="Ej: noticias_diarias, precios_productos, leyes_congreso"
                              value={dynamicTableName}
                              onChange={(e) => setDynamicTableName(e.target.value)}
                            />
                            <p className="text-xs text-slate-500 mt-1">
                              Se creará una tabla pública con este nombre en PulseJournal
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Descripción de los datos
                            </label>
                            <Textarea
                              placeholder="Ej: Información estructurada de noticias con títulos, fechas, categorías y enlaces"
                              value={dataDescription}
                              onChange={(e) => setDataDescription(e.target.value)}
                              rows={2}
                            />
                          </div>

                          <div className="bg-green-50 border border-green-200 rounded p-3">
                            <div className="flex gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <div className="text-xs text-green-800">
                                <p className="font-medium mb-1">Base de datos pública:</p>
                                <ul className="space-y-1">
                                  <li>• Los datos se guardan en la base de datos de PulseJournal</li>
                                  <li>• Acceso público para todos los usuarios</li>
                                  <li>• No requiere configuración de credenciales</li>
                                  <li>• Gestión automática de tablas y permisos</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Pestaña Asistente Guiado */}
              <TabsContent value="wizard" className="space-y-4 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-yellow-600" />
                      Asistente Guiado para Extracción
                    </CardTitle>
                    <p className="text-sm text-slate-600">
                      Te guiamos paso a paso para crear las instrucciones perfectas para tu agente de extracción.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">

                    {/* Paso 1: Tipo de datos */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center font-medium">1</div>
                        <h4 className="font-medium text-slate-900">¿Qué tipo de información quieres extraer?</h4>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 ml-8">
                        {[
                          { id: 'productos', label: 'Productos/Servicios', icon: '🛍️' },
                          { id: 'noticias', label: 'Noticias/Artículos', icon: '📰' },
                          { id: 'contactos', label: 'Contactos/Perfiles', icon: '👥' },
                          { id: 'precios', label: 'Precios/Tarifas', icon: '💰' },
                          { id: 'eventos', label: 'Eventos/Fechas', icon: '📅' },
                          { id: 'reviews', label: 'Reseñas/Comentarios', icon: '⭐' },
                          { id: 'inmuebles', label: 'Inmuebles/Propiedades', icon: '🏠' },
                          { id: 'otros', label: 'Otros', icon: '📋' }
                        ].map((type) => (
                          <button
                            key={type.id}
                            onClick={() => setDataType(type.id)}
                            className={`p-3 border rounded-lg text-left transition-colors ${
                              dataType === type.id
                                ? 'border-blue-500 bg-blue-50 text-blue-900'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="text-lg mb-1">{type.icon}</div>
                            <div className="text-sm font-medium">{type.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Paso 2: Elementos específicos */}
                    {dataType && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center font-medium">2</div>
                          <h4 className="font-medium text-slate-900">¿Qué elementos específicos necesitas?</h4>
                        </div>

                        <div className="ml-8 space-y-3">
                          {/* Elementos comunes según el tipo de datos */}
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {getCommonElementsForType(dataType).map((element, index) => (
                              <button
                                key={index}
                                onClick={() => addTargetElement(element)}
                                className={`p-2 text-sm border rounded transition-colors ${
                                  targetElements.includes(element)
                                    ? 'border-green-500 bg-green-50 text-green-900'
                                    : 'border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                {element}
                              </button>
                            ))}
                          </div>

                          {/* Elemento personalizado */}
                          <div className="flex gap-2">
                            <Input
                              placeholder="Agregar elemento personalizado..."
                              value={customElement}
                              onChange={(e) => setCustomElement(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && addCustomElement()}
                              className="flex-1"
                            />
                            <Button onClick={addCustomElement} variant="outline" size="sm">
                              Agregar
                            </Button>
                          </div>

                          {/* Elementos seleccionados */}
                          {targetElements.length > 0 && (
                            <div className="space-y-2">
                              <h5 className="text-sm font-medium text-slate-700">Elementos seleccionados:</h5>
                              <div className="flex flex-wrap gap-2">
                                {targetElements.map((element, index) => (
                                  <div key={index} className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                                    {element}
                                    <button
                                      onClick={() => removeTargetElement(index)}
                                      className="text-blue-600 hover:text-blue-800"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Paso 3: Formato de salida */}
                    {targetElements.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center font-medium">3</div>
                          <h4 className="font-medium text-slate-900">¿En qué formato quieres los datos?</h4>
                        </div>

                        <div className="ml-8">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[
                              { id: 'tabla', label: 'Tabla estructurada (CSV/Excel)', desc: 'Filas y columnas organizadas' },
                              { id: 'json', label: 'Formato JSON', desc: 'Estructura de datos flexible' },
                              { id: 'lista', label: 'Lista simple', desc: 'Lista de elementos uno por uno' },
                              { id: 'detallado', label: 'Informe detallado', desc: 'Descripción completa de cada elemento' }
                            ].map((format) => (
                              <button
                                key={format.id}
                                onClick={() => setOutputFormat(format.id)}
                                className={`p-3 border rounded-lg text-left transition-colors ${
                                  outputFormat === format.id
                                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                                    : 'border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <div className="font-medium text-sm">{format.label}</div>
                                <div className="text-xs text-slate-600 mt-1">{format.desc}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Paso 4: Frecuencia y requisitos */}
                    {outputFormat && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center font-medium">4</div>
                          <h4 className="font-medium text-slate-900">Configuración adicional</h4>
                        </div>

                        <div className="ml-8 space-y-4">
                          {/* Frecuencia */}
                          <div>
                            <label className="text-sm font-medium text-slate-700 mb-2 block">¿Con qué frecuencia necesitas esta información?</label>
                            <select
                              value={extractionFrequency}
                              onChange={(e) => setExtractionFrequency(e.target.value)}
                              className="w-full p-2 border border-slate-200 rounded"
                            >
                              <option value="">Seleccionar frecuencia...</option>
                              <option value="una-vez">Una sola vez</option>
                              <option value="diaria">Diariamente</option>
                              <option value="semanal">Semanalmente</option>
                              <option value="mensual">Mensualmente</option>
                              <option value="personalizada">Frecuencia personalizada</option>
                            </select>
                          </div>

                          {/* Requisitos especiales */}
                          <div>
                            <label className="text-sm font-medium text-slate-700 mb-2 block">Requisitos especiales (opcional)</label>
                            <Textarea
                              placeholder="Ej: Solo productos en stock, excluir ofertas vencidas, filtrar por precio mínimo, etc."
                              value={specialRequirements}
                              onChange={(e) => setSpecialRequirements(e.target.value)}
                              rows={3}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Botón para aplicar */}
                    {dataType && targetElements.length > 0 && outputFormat && (
                      <div className="border-t border-slate-200 pt-4">
                        <div className="flex gap-3">
                          <Button
                            onClick={applyWizardInstructions}
                            className="bg-green-600 text-white hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Crear Instrucciones
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setDataType('');
                              setTargetElements([]);
                              setOutputFormat('');
                              setExtractionFrequency('');
                              setSpecialRequirements('');
                            }}
                          >
                            Reiniciar Asistente
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Vista previa de instrucciones */}
                    {dataType && targetElements.length > 0 && (
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                        <h5 className="font-medium text-slate-900 mb-2">Vista previa de instrucciones:</h5>
                        <div className="text-sm text-slate-700 whitespace-pre-line">
                          {buildInstructionsFromWizard()}
                        </div>
                      </div>
                    )}

                  </CardContent>
                </Card>
              </TabsContent>

              {/* Pestaña IA Generativa */}
              <TabsContent value="intelligent" className="space-y-4 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Brain className="h-5 w-5 text-purple-600" />
                      Generador Inteligente con GPT-5
                    </CardTitle>
                    <p className="text-sm text-slate-600">
                      Describe en lenguaje natural qué quieres extraer y la IA generará el código automáticamente.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Instrucciones en lenguaje natural
                      </label>
                      <Textarea 
                        placeholder="Ej: Quiero extraer todos los productos de la tienda online. Necesito el nombre, precio, descripción, imagen y si está disponible. También quiero saber si hay descuentos aplicados y la categoría del producto."
                        value={naturalInstructions}
                        onChange={(e) => setNaturalInstructions(e.target.value)}
                        rows={6}
                        className="min-h-[120px]"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Explica detalladamente qué información necesitas, cómo debe estar estructurada y cualquier condición especial.
                      </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h5 className="font-medium text-blue-900 mb-1">Consejos para mejores resultados:</h5>
                          <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Sé específico sobre los campos que necesitas</li>
                            <li>• Menciona el formato de salida deseado (tabla, lista, JSON, etc.)</li>
                            <li>• Indica si hay elementos que deben filtrarse o excluirse</li>
                            <li>• Describe la frecuencia de actualización esperada</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button 
                        onClick={generateExtractionCode}
                        disabled={isGenerating || !naturalInstructions.trim()}
                        className="bg-purple-600 text-white hover:bg-purple-700"
                      >
                        {isGenerating ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                            Generando código...
                          </>
                        ) : (
                          <>
                            <Wand2 className="h-4 w-4 mr-2" />
                            Generar Código con IA
                          </>
                        )}
                      </Button>
                    </div>

                    {generationError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <span className="font-medium text-red-900">Error</span>
                        </div>
                        <p className="text-sm text-red-800 mt-1">{generationError}</p>
                      </div>
                    )}

                    {/* ✅ Botón manual para debuggear */}
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800">Debug Manual</span>
                      </div>
                      <p className="text-xs text-yellow-700 mb-2">
                        Si el modal se queda en blanco, usa este botón para forzar la generación:
                      </p>
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={generateAgentCode}
                        disabled={isGenerating}
                        className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            Generando...
                          </>
                        ) : (
                          <>
                            <Wand2 className="h-3 w-3 mr-1" />
                            Forzar Generación
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Pestaña Código Generado */}
              <TabsContent value="generated" className="space-y-4 mt-0">
                {generatedCode ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileCode className="h-5 w-5 text-green-600" />
                        Código de Extracción Generado
                        <Badge 
                          variant="outline" 
                          className={`ml-2 ${
                            generatedCode.confidence >= 0.8 ? 'text-green-600 border-green-200' :
                            generatedCode.confidence >= 0.6 ? 'text-yellow-600 border-yellow-200' :
                            'text-red-600 border-red-200'
                          }`}
                        >
                          Confianza: {(generatedCode.confidence * 100).toFixed(0)}%
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* ✅ Alerta especial para modo WebAgent */}
                      {generatedCode.execution_mode === 'webagent' && (
                        <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4">
                          <h5 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                            <Globe className="h-5 w-5" />
                            🌐 Este agente usará WebAgent (Navegador Real)
                          </h5>
                          <p className="text-sm text-amber-800 mb-2">
                            El sitio tiene protección anti-bot o contenido dinámico. Este agente se ejecutará con Playwright usando un navegador real.
                          </p>
                          <div className="bg-amber-100 rounded p-2 text-xs text-amber-900">
                            <strong>Nota:</strong> No se generó código JavaScript porque no funcionaría con fetch + cheerio. 
                            El objetivo que indicaste se pasará directamente a WebAgent.
                          </div>
                        </div>
                      )}
                      
                      {generatedCode.reasoning && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <h5 className="font-medium text-blue-900 mb-1 flex items-center gap-2">
                            <Brain className="h-4 w-4" />
                            Razonamiento de la IA
                          </h5>
                          <p className="text-sm text-blue-800">{generatedCode.reasoning}</p>
                        </div>
                      )}

                      {generatedCode.extractionLogic && (
                        <div>
                          <h5 className="font-medium text-slate-900 mb-2">Lógica de Extracción:</h5>
                          <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                            <pre>{generatedCode.extractionLogic}</pre>
                          </div>
                        </div>
                      )}

                      {generatedCode.selectors.length > 0 && (
                        <div>
                          <h5 className="font-medium text-slate-900 mb-2">Selectores CSS/XPath:</h5>
                          <div className="space-y-2">
                            {generatedCode.selectors.map((selector, index) => (
                              <div key={index} className="bg-slate-100 rounded px-3 py-2 font-mono text-sm">
                                {selector}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {generatedCode.workflow.length > 0 && (
                        <div>
                          <h5 className="font-medium text-slate-900 mb-2">Flujo de Trabajo:</h5>
                          <div className="space-y-2">
                            {generatedCode.workflow.map((step, index) => (
                              <div key={index} className="flex items-start gap-2">
                                <Badge variant="outline" className="text-xs min-w-[24px] h-6 flex items-center justify-center">
                                  {index + 1}
                                </Badge>
                                <span className="text-sm text-slate-700">{step}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-3 pt-4 border-t border-slate-200">
                        <Button 
                          onClick={applyGeneratedCode}
                          className="bg-green-600 text-white hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Aplicar Código
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => setActiveTab('intelligent')}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Regenerar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Code className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-lg font-medium">No hay código generado</p>
                    <p className="text-sm mt-2">Ve a la pestaña "IA Generativa" para crear código automáticamente.</p>
                  </div>
                )}
              </TabsContent>

              {/* Pestaña Debug */}
              <TabsContent value="debug" className="space-y-4 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Bug className="h-5 w-5 text-orange-600" />
                      Modo Debug Interactivo
                    </CardTitle>
                    <p className="text-sm text-slate-600">
                      Escribe y prueba scripts de extracción en tiempo real para refinar tu agente iterativamente.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">

                    {/* URL Configuration */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        URL de prueba
                      </label>
                      <Input
                        placeholder="https://ejemplo.com/pagina-a-probar"
                        value={debugUrl}
                        onChange={(e) => setDebugUrl(e.target.value)}
                      />
                    </div>

                    {/* Script Editor */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <label className="block text-sm font-medium text-slate-700">
                            Script de Extracción JavaScript
                          </label>
                          {debugCodeSource !== 'manual' && (
                            <Badge
                              variant="secondary"
                              className={`text-xs ${
                                debugCodeSource === 'generated' ? 'bg-purple-100 text-purple-700' :
                                debugCodeSource === 'agent' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {debugCodeSource === 'generated' ? '🤖 IA Generado' :
                               debugCodeSource === 'agent' ? '🔧 Del Agente' :
                               '✏️ Manual'}
                            </Badge>
                          )}
                          {hasUnsavedChanges && (
                            <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                              Sin guardar
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {/* Solo 2 botones: Cargar y Mejorar */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={loadAgentCodeToDebug}
                            disabled={isLoadingDebugCode}
                            className="text-xs"
                          >
                            <RefreshCw className={`h-3 w-3 mr-1 ${isLoadingDebugCode ? 'animate-spin' : ''}`} />
                            {isLoadingDebugCode ? 'Cargando...' : 'Cargar Código'}
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={improveCodeWithAI}
                            disabled={isGenerating || !debugScript.trim()}
                            className="border-blue-300 text-blue-700 hover:bg-blue-50"
                          >
                            {isGenerating ? (
                              <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <Brain className="h-3 w-3 mr-1" />
                            )}
                            Mejorar con IA
                          </Button>
                        </div>
                      </div>

                      {/* Debug Status Messages */}
                      {(isLoadingDebugCode || debugCodeSource !== 'manual' || generatedCode?.extractionLogic || debugScript.trim()) && (
                        <div className="mb-3 p-2 bg-slate-50 rounded-md border">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm">
                              {isLoadingDebugCode && (
                                <div className="flex items-center gap-1 text-blue-700">
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                  Cargando código de depuración...
                                </div>
                              )}
                              {!isLoadingDebugCode && debugCodeSource === 'generated' && debugScript.trim() && (
                                <div className="flex items-center gap-1 text-purple-700">
                                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                  {debugScript.includes('document.querySelector') || debugScript.includes('return') ?
                                    'Código JavaScript generado por IA cargado' :
                                    'Texto descriptivo convertido a JavaScript'
                                  } ({debugScript.length} caracteres)
                                </div>
                              )}
                              {!isLoadingDebugCode && debugCodeSource === 'agent' && debugScript.trim() && (
                                <div className="flex items-center gap-1 text-blue-700">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  Código del agente cargado ({debugScript.length} caracteres)
                                </div>
                              )}
                              {!isLoadingDebugCode && debugCodeSource === 'manual' && hasUnsavedChanges && (
                                <div className="flex items-center gap-1 text-orange-700">
                                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                  Código modificado manualmente ({debugScript.length} caracteres)
                                </div>
                              )}
                              {!isLoadingDebugCode && !debugScript.trim() && (
                                <div className="flex items-center gap-1 text-gray-600">
                                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                  Sin código cargado - usa los botones para generar o cargar
                                </div>
                              )}
                            </div>
                            {!isLoadingDebugCode && generatedCode?.extractionLogic && debugCodeSource !== 'generated' && (
                              <button
                                onClick={loadAgentCodeToDebug}
                                className="text-xs text-purple-600 hover:text-purple-800 hover:underline"
                              >
                                {generatedCode.extractionLogic.includes('document.querySelector') || generatedCode.extractionLogic.includes('return') ?
                                  '↻ Usar código generado disponible' :
                                  '🔄 Convertir descripción a JavaScript'
                                }
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Simple Status and Controls */}
                      <div className="mb-3">
                        {/* Anti-bot Alert */}
                        {diagnosticIssues.some((i: any) => i.type === 'antibot') && (
                          <div className="p-3 rounded-md border bg-red-50 border-red-300 mb-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 text-red-800 font-semibold">
                                <AlertCircle className="w-5 h-5" />
                                🔒 Sitio Bloqueado por Anti-Bot
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-blue-500 text-blue-700 hover:bg-blue-50"
                                onClick={() => {
                                  alert('🚧 WebAgent Integration\n\nEsta funcionalidad está en desarrollo.\n\nPor ahora, consulta la documentación de WebAgent para configurar scraping con navegador real.');
                                }}
                              >
                                🌐 Usar WebAgent
                              </Button>
                            </div>
                            <div className="text-sm text-red-700 space-y-1 ml-7">
                              <p>• El scraping directo NO funcionará en este sitio</p>
                              <p>• El HTML está vacío ({pageInfo?.size_bytes} bytes)</p>
                              <p>• Servicio detectado: <strong>{diagnosticIssues.find((i: any) => i.type === 'antibot')?.title}</strong></p>
                              <p className="font-semibold mt-2 text-green-700">✅ Solución: Usa WebAgent o modo Browser (Puppeteer)</p>
                            </div>
                          </div>
                        )}

                        {/* Basic validation errors only */}
                        {codeValidation.errors.length > 0 && (
                          <div className="p-2 rounded-md border bg-red-50 border-red-200 mb-2">
                            <div className="flex items-center gap-1 text-red-700 text-xs font-medium mb-1">
                              <AlertCircle className="w-3 h-3" />
                              Errores de sintaxis
                            </div>
                            {codeValidation.errors.map((error, index) => (
                              <div key={index} className="text-xs text-red-600 ml-4">• {error}</div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Simple Editor */}
                      <CodeEditor
                        value={debugScript}
                        onChange={handleDebugScriptChange}
                        language="javascript"
                        height="400px"
                        theme="vs-light"
                        placeholder={`// Código de extracción JavaScript para ${debugUrl || 'la página web'}
const items = [];

try {
  // Encuentra elementos en la página
  const elements = document.querySelectorAll('article, .item, .card, .news-item');

  elements.forEach((element, index) => {
    const title = element.querySelector('h1, h2, h3, .title')?.textContent?.trim();
    const link = element.querySelector('a')?.href;

    if (title) {
      items.push({
        index: index + 1,
        title: title,
        link: link,
        extracted_at: new Date().toISOString()
      });
    }
  });
} catch (error) {
  console.error('Error:', error);
}

return items;`}
                        onExecute={runDebugScript}
                      />
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-slate-500">
                          Escribe JavaScript que se ejecutará en el contexto de la página. Debe retornar un array de objetos.
                        </p>
                        {debugScript && (
                          <p className="text-xs text-slate-400">
                            {debugScript.length} caracteres
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons - Reorganizados */}
                    <div className="space-y-4">
                      {/* 🎯 Ejecución Principal */}
                      <div>
                        <div className="text-xs font-medium text-slate-600 mb-2">🎯 Ejecutar</div>
                        <div className="flex flex-wrap gap-2">
                          {/* Botón unificado: usa quickTest si hay agente, sino runDebugScript */}
                          <Button
                            onClick={(agent || generatedCode) ? quickTestAgent : runDebugScript}
                            disabled={isDebugging || (!debugScript.trim() && !(agent || generatedCode)) || !debugUrl.trim()}
                            className="bg-blue-600 text-white hover:bg-blue-700"
                          >
                            {isDebugging ? (
                              <>
                                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                Ejecutando...
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-2" />
                                {(agent || generatedCode) ? 'Probar Agente' : 'Ejecutar Script'}
                              </>
                            )}
                          </Button>

                          {debugResults && !debugResults.success && (
                            <Button
                              variant="outline"
                              onClick={explainErrorWithAI}
                              disabled={isGenerating}
                              className="border-orange-300 text-orange-700 hover:bg-orange-50"
                            >
                              {isGenerating ? (
                                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <AlertCircle className="h-4 w-4 mr-2" />
                              )}
                              Explicar Error
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* 🔧 Acciones Secundarias */}
                      <div>
                        <div className="text-xs font-medium text-slate-600 mb-2">🔧 Acciones</div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setDebugScript('');
                              setDebugResults(null);
                              setGenerationError(null);
                              setDebugCodeSource('manual');
                              setHasUnsavedChanges(false);
                              setPageInfo(null);
                              setDiagnosticIssues([]);
                            }}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Limpiar
                          </Button>

                          {hasUnsavedChanges && debugResults?.success && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={applyDebugToAgent}
                              className="border-green-500 text-green-700 hover:bg-green-50"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Aplicar al Agente
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Apply Success Notification */}
                      {showApplySuccess && (
                        <div className="bg-green-100 border border-green-300 rounded p-3 animate-pulse">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <div className="text-sm text-green-800 font-medium">
                              ✅ Cambios aplicados exitosamente al agente
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Quick Test Info */}
                      {(agent || generatedCode) && (
                        <div className="bg-green-50 border border-green-200 rounded p-3">
                          <div className="flex items-start gap-2">
                            <Zap className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-green-800">
                              <p className="font-medium mb-1">🚀 Quick Test disponible</p>
                              <p>Haz clic en "Probar Agente" para ejecutar el código existente del agente directamente sin editarlo.</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ✅ Page Info Panel */}
                    {pageInfo && (
                      <Card className="border-blue-200 bg-blue-50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2 text-blue-800">
                            <Info className="h-4 w-4" />
                            Información de Página
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div className="bg-white p-2 rounded border border-blue-200">
                              <div className="text-xs text-gray-500">Título</div>
                              <div className="font-medium text-blue-900 truncate" title={pageInfo.title}>
                                {pageInfo.title || 'Sin título'}
                              </div>
                            </div>
                            <div className="bg-white p-2 rounded border border-blue-200">
                              <div className="text-xs text-gray-500">Tamaño HTML</div>
                              <div className="font-medium text-blue-900">
                                {(pageInfo.size_bytes / 1024).toFixed(1)} KB
                              </div>
                            </div>
                            <div className="bg-white p-2 rounded border border-blue-200">
                              <div className="text-xs text-gray-500">Texto</div>
                              <div className="font-medium text-blue-900">
                                {(pageInfo.size_text / 1024).toFixed(1)} KB
                              </div>
                            </div>
                            <div className="bg-white p-2 rounded border border-blue-200">
                              <div className="text-xs text-gray-500">Estado</div>
                              <div className={`font-medium ${pageInfo.has_content ? 'text-green-700' : 'text-red-700'}`}>
                                {pageInfo.has_content ? '✅ Con contenido' : '❌ Vacía'}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* ✅ Diagnostic Issues Panel */}
                    {diagnosticIssues && diagnosticIssues.length > 0 && (
                      <Card className="border-orange-200 bg-orange-50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2 text-orange-800">
                            <AlertCircle className="h-4 w-4" />
                            Problemas Detectados ({diagnosticIssues.length})
                          </CardTitle>
                          <p className="text-xs text-orange-700 mt-1">
                            El sistema detectó estos problemas que podrían estar impidiendo la extracción
                          </p>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-3">
                          {diagnosticIssues.map((issue: any, idx: number) => (
                            <div 
                              key={idx} 
                              className={`p-3 rounded border ${
                                issue.severity === 'critical' ? 'bg-red-50 border-red-300' :
                                issue.severity === 'high' ? 'bg-orange-100 border-orange-300' :
                                issue.severity === 'medium' ? 'bg-yellow-50 border-yellow-300' :
                                'bg-blue-50 border-blue-200'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h4 className={`font-semibold text-sm ${
                                  issue.severity === 'critical' ? 'text-red-800' :
                                  issue.severity === 'high' ? 'text-orange-800' :
                                  issue.severity === 'medium' ? 'text-yellow-800' :
                                  'text-blue-800'
                                }`}>
                                  {issue.title}
                                </h4>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    issue.severity === 'critical' ? 'bg-red-100 text-red-700 border-red-300' :
                                    issue.severity === 'high' ? 'bg-orange-100 text-orange-700 border-orange-300' :
                                    issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                                    'bg-blue-100 text-blue-700 border-blue-300'
                                  }`}
                                >
                                  {issue.severity}
                                </Badge>
                              </div>
                              
                              <p className="text-sm text-gray-700 mb-2">
                                {issue.description}
                              </p>
                              
                              {issue.evidence && (
                                <details className="text-xs mb-2">
                                  <summary className="cursor-pointer text-blue-600 hover:underline">
                                    Ver evidencia
                                  </summary>
                                  <pre className="mt-1 p-2 bg-white rounded border text-xs overflow-auto max-h-24">
                                    {typeof issue.evidence === 'string' 
                                      ? issue.evidence 
                                      : JSON.stringify(issue.evidence, null, 2)}
                                  </pre>
                                </details>
                              )}
                              
                              {issue.suggestions && issue.suggestions.length > 0 && (
                                <div className="mt-2">
                                  <div className="text-xs font-medium text-gray-700 mb-1">
                                    💡 Sugerencias:
                                  </div>
                                  <ul className="space-y-1">
                                    {issue.suggestions.map((suggestion: string, i: number) => (
                                      <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                                        <span className="text-blue-500 mt-0.5">•</span>
                                        <span>{suggestion}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    {/* Debug Results */}
                    {debugResults && (
                      <Card className={`border-2 ${debugResults.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                        <CardHeader className="pb-3">
                          <CardTitle className={`text-sm flex items-center gap-2 ${debugResults.success ? 'text-green-800' : 'text-red-800'}`}>
                            {debugResults.success ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <AlertCircle className="h-4 w-4" />
                            )}
                            Resultado de la Ejecución
                            {debugResults.agent_metadata && (
                              <Badge variant="secondary" className="ml-2 text-xs bg-purple-100 text-purple-700">
                                🚀 {debugResults.agent_metadata.agent_name}
                              </Badge>
                            )}
                          </CardTitle>
                          {debugResults.agent_metadata && (
                            <div className="text-xs text-slate-600 mt-1">
                              Sitio: {debugResults.agent_metadata.site_name} •
                              Código: {debugResults.agent_metadata.code_source === 'generated' ? 'IA Generado' : 'Manual'}
                            </div>
                          )}
                        </CardHeader>
                        <CardContent className="pt-0">
                          {debugResults.success ? (
                            <div className="space-y-3">
                              {debugResults.data?.items && (
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm font-medium text-green-800">
                                      Items extraídos: {debugResults.data.items.length}
                                    </span>
                                    {debugResults.data.items.length > 0 && (
                                      <Button
                                        size="sm"
                                        onClick={applyDebugToAgent}
                                        className="bg-green-600 text-white hover:bg-green-700"
                                      >
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Aplicar al Agente
                                      </Button>
                                    )}
                                  </div>

                                  {debugResults.data.items.length > 0 ? (
                                    <div className="bg-white border border-green-200 rounded p-3 max-h-64 overflow-y-auto">
                                      <pre className="text-xs text-slate-700 whitespace-pre-wrap">
                                        {JSON.stringify(debugResults.data.items.slice(0, 5), null, 2)}
                                      </pre>
                                      {debugResults.data.items.length > 5 && (
                                        <p className="text-xs text-green-600 mt-2">
                                          ... y {debugResults.data.items.length - 5} items más
                                        </p>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="text-sm text-orange-700 bg-orange-100 border border-orange-200 rounded p-3">
                                      ⚠️ El script se ejecutó exitosamente pero no extrajo ningún item.
                                      Revisa los selectores CSS o la lógica de extracción.
                                    </div>
                                  )}
                                </div>
                              )}

                              {debugResults.logs && debugResults.logs.length > 0 && (
                                <div>
                                  <span className="text-sm font-medium text-green-800 block mb-1">Logs:</span>
                                  <div className="bg-white border border-green-200 rounded p-3 max-h-32 overflow-y-auto">
                                    {debugResults.logs.map((log: string, index: number) => (
                                      <div key={index} className="text-xs text-slate-600 font-mono">
                                        {log}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {debugResults.metrics && (
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                  <div className="bg-white border border-green-200 rounded p-2">
                                    <span className="font-medium">Tiempo:</span>
                                    <p className="text-green-700">{debugResults.metrics.execution_time_ms}ms</p>
                                  </div>
                                  <div className="bg-white border border-green-200 rounded p-2">
                                    <span className="font-medium">Memoria:</span>
                                    <p className="text-green-700">{debugResults.metrics.memory_usage || 'N/A'}</p>
                                  </div>
                                  <div className="bg-white border border-green-200 rounded p-2">
                                    <span className="font-medium">Estado:</span>
                                    <p className="text-green-700">{debugResults.status || 'completed'}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="text-sm text-red-800 font-medium">
                                Error: {debugResults.error}
                              </div>

                              {/* AI Error Explanation */}
                              {debugResults.ai_explanation && (
                                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded p-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Brain className="h-4 w-4 text-purple-600" />
                                    <span className="text-sm font-medium text-purple-800">🤖 Explicación de la IA</span>
                                    <Badge variant="outline" className="text-xs text-purple-600 border-purple-300">
                                      Confianza: {(debugResults.ai_explanation.confidence * 100).toFixed(0)}%
                                    </Badge>
                                  </div>

                                  <div className="space-y-2 text-sm">
                                    <div>
                                      <span className="font-medium text-purple-800">Explicación:</span>
                                      <p className="text-purple-700 mt-1">{debugResults.ai_explanation.explanation}</p>
                                    </div>

                                    <div>
                                      <span className="font-medium text-purple-800">Causa probable:</span>
                                      <p className="text-purple-700 mt-1">{debugResults.ai_explanation.probable_cause}</p>
                                    </div>

                                    <div>
                                      <span className="font-medium text-purple-800">Sugerencia:</span>
                                      <p className="text-purple-700 mt-1">{debugResults.ai_explanation.suggested_fix}</p>
                                    </div>

                                    {debugResults.ai_explanation.fixed_code && (
                                      <div className="bg-white border border-purple-200 rounded p-2 mt-2">
                                        <span className="text-xs font-medium text-purple-800">✅ Código corregido aplicado automáticamente</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {debugResults.details && (
                                <div className="bg-white border border-red-200 rounded p-3 max-h-32 overflow-y-auto">
                                  <pre className="text-xs text-red-700 whitespace-pre-wrap">
                                    {debugResults.details}
                                  </pre>
                                </div>
                              )}

                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Debug History */}
                    {debugHistory.length > 0 && (
                      <Card className="border-blue-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Terminal className="h-4 w-4" />
                            Historial de Debug (últimas 10 ejecuciones)
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {debugHistory.map((entry, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded border">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <div className={`w-2 h-2 rounded-full ${entry.success ? 'bg-green-500' : 'bg-red-500'}`} />

                                  {/* Test Type Indicator */}
                                  {entry.agent_test ? (
                                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                      🚀 Quick Test
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                                      🧪 Manual
                                    </Badge>
                                  )}

                                  <span className="text-xs text-slate-600 truncate">
                                    {new Date(entry.timestamp).toLocaleTimeString()}
                                  </span>

                                  {/* Agent Name for Quick Tests */}
                                  {entry.agent_test && entry.agent_name && (
                                    <span className="text-xs text-purple-600 truncate font-medium">
                                      {entry.agent_name}
                                    </span>
                                  )}

                                  <span className="text-xs text-slate-500 truncate">
                                    {entry.url}
                                  </span>

                                  {entry.result?.data?.items && (
                                    <Badge variant="secondary" className="text-xs">
                                      {entry.result.data.items.length} items
                                    </Badge>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => loadScriptFromHistory(entry)}
                                  className="text-xs"
                                  disabled={entry.agent_test} // Disable loading for agent tests since they don't have editable script
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  {entry.agent_test ? 'Ver' : 'Cargar'}
                                </Button>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Quick Tips */}
                    <Card className="border-purple-200 bg-purple-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2 text-purple-800">
                          <Wrench className="h-4 w-4" />
                          💡 Tips para Debug Efectivo
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <ul className="text-sm text-purple-800 space-y-1">
                          <li>• Usa <code className="bg-purple-100 px-1 rounded">console.log()</code> para debuggear valores</li>
                          <li>• Prueba selectores CSS con <code className="bg-purple-100 px-1 rounded">document.querySelector()</code> primero</li>
                          <li>• Inspecciona la estructura HTML de la página target</li>
                          <li>• Maneja errores con <code className="bg-purple-100 px-1 rounded">try/catch</code></li>
                          <li>• Valida que los elementos existen antes de acceder a sus propiedades</li>
                          <li>• Usa <code className="bg-purple-100 px-1 rounded">?.textContent?.trim()</code> para texto seguro</li>
                        </ul>
                      </CardContent>
                    </Card>

                  </CardContent>
                </Card>
              </TabsContent>

              {/* Pestaña Configuración */}
              <TabsContent value="config" className="space-y-4 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Cog className="h-5 w-5" />
                      Configuración Final
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Nombre del agente
                        </label>
                        <Input 
                          value={agentName}
                          onChange={(e) => setAgentName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Tabla de datos
                        </label>
                        <Input 
                          value={dynamicTableName}
                          onChange={(e) => setDynamicTableName(e.target.value)}
                          placeholder="Opcional"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Objetivo de extracción
                      </label>
                      <Textarea 
                        value={extractionTarget}
                        onChange={(e) => setExtractionTarget(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Descripción de los datos
                      </label>
                      <Textarea 
                        value={dataDescription}
                        onChange={(e) => setDataDescription(e.target.value)}
                        rows={2}
                        placeholder="Opcional"
                      />
                    </div>

                    {generatedCode && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-900">Código IA Aplicado</span>
                        </div>
                        <p className="text-sm text-green-800 mt-1">
                          Este agente utilizará la lógica de extracción generada automáticamente.
                          Confianza: {(generatedCode.confidence * 100).toFixed(0)}%
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!agentName.trim() || !extractionTarget.trim() || isSaving}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {isSaving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isSaving ? 'Guardando...' : (isCreating ? 'Crear Agente' : 'Guardar Cambios')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
