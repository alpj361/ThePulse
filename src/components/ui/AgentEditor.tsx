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

  // Guided prompt builder state
  const [wizardStep, setWizardStep] = useState(1);
  const [dataType, setDataType] = useState('');
  const [targetElements, setTargetElements] = useState<string[]>([]);
  const [outputFormat, setOutputFormat] = useState('');
  const [extractionFrequency, setExtractionFrequency] = useState('');
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [customElement, setCustomElement] = useState('');

  // Estado de las pestañas
  const [activeTab, setActiveTab] = useState('basic');

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

    instructions += `Sitio web objetivo: ${siteMap.site_name} (${siteMap.base_url})`;

    return instructions;
  };

  const applyWizardInstructions = () => {
    const instructions = buildInstructionsFromWizard();
    setNaturalInstructions(instructions);
    setActiveTab('intelligent');
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
              <TabsList className="grid w-full grid-cols-5">
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
