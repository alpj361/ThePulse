import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/Badge';
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
  Cog
} from 'lucide-react';
import { SiteAgent, SiteMap } from '../../services/supabase';
import { EXTRACTORW_API_URL } from '../../services/api';

interface AgentEditorProps {
  agent?: SiteAgent | null;
  siteMap: SiteMap;
  onSave: (agentData: any) => Promise<void>;
  onCancel: () => void;
  isCreating?: boolean;
}

interface GeneratedCode {
  extractionLogic: string;
  selectors: string[];
  workflow: string[];
  confidence: number;
  reasoning: string;
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
  const [dynamicTableName, setDynamicTableName] = useState('');
  const [dataDescription, setDataDescription] = useState('');

  // Estado del editor inteligente
  const [naturalInstructions, setNaturalInstructions] = useState('');
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  
  // Estado de las pestañas
  const [activeTab, setActiveTab] = useState('basic');

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
            site_name: siteMap.site_name,
            base_url: siteMap.base_url,
            structure: siteMap.site_structure,
            navigation_summary: siteMap.navigation_summary
          },
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

  // Función para guardar el agente
  const handleSave = async () => {
    if (!agentName.trim() || !extractionTarget.trim()) {
      setGenerationError('Nombre del agente y objetivo de extracción son requeridos');
      return;
    }

    const agentData = {
      site_map_id: siteMap.id,
      agent_name: agentName,
      extraction_target: extractionTarget,
      dynamic_table_name: dynamicTableName.trim() || undefined,
      data_description: dataDescription.trim() || undefined,
      extraction_config: {
        ...agent?.extraction_config,
        ...(generatedCode ? {
          generated: true,
          instructions: naturalInstructions,
          selectors: generatedCode.selectors,
          workflow: generatedCode.workflow,
          confidence: generatedCode.confidence,
          reasoning: generatedCode.reasoning,
          generatedAt: new Date().toISOString()
        } : {})
      }
    };

    await onSave(agentData);
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
                Sitio: <span className="font-medium">{siteMap.site_name}</span> - {siteMap.base_url}
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
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Básico
                </TabsTrigger>
                <TabsTrigger value="intelligent" className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4" />
                  IA Generativa
                </TabsTrigger>
                <TabsTrigger value="generated" className="flex items-center gap-2" disabled={!generatedCode}>
                  <Code className="h-4 w-4" />
                  Código Generado
                </TabsTrigger>
                <TabsTrigger value="config" className="flex items-center gap-2">
                  <Cog className="h-4 w-4" />
                  Configuración
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
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
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Nombre de la tabla de datos
                          </label>
                          <Input 
                            placeholder="Ej: noticias_diarias, precios_productos"
                            value={dynamicTableName}
                            onChange={(e) => setDynamicTableName(e.target.value)}
                          />
                          <p className="text-xs text-slate-500 mt-1">
                            Si especificas un nombre, se creará una tabla dedicada para este agente
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
                      </div>
                    </div>
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
                      {generatedCode.reasoning && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <h5 className="font-medium text-blue-900 mb-1 flex items-center gap-2">
                            <Brain className="h-4 w-4" />
                            Razonamiento de la IA
                          </h5>
                          <p className="text-sm text-blue-800">{generatedCode.reasoning}</p>
                        </div>
                      )}

                      <div>
                        <h5 className="font-medium text-slate-900 mb-2">Lógica de Extracción:</h5>
                        <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                          <pre>{generatedCode.extractionLogic}</pre>
                        </div>
                      </div>

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
              disabled={!agentName.trim() || !extractionTarget.trim()}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {isCreating ? 'Crear Agente' : 'Guardar Cambios'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
