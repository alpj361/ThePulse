"use client";

import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import {
  X,
  MessageCircle,
  Send,
  Clock,
  Hash,
  BarChart3,
  TrendingUp,
  FileText,
  Link as LinkIcon,
  ChevronDown,
  ChevronUp,
  Newspaper,
  Info,
  FileStack,
  Maximize2,
  Folder,
  Activity,
  FileUp
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';

import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Textarea } from "./textarea";
import { Avatar, AvatarFallback } from "./avatar";
import { ScrollArea } from "./scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";
import { TypingIndicator } from "./typing-indicator";
import { SkeletonLoader } from "./skeleton-loader";
import { CopyButton } from "./copy-button";

// Types
interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
  toolUsed?: string;
  executionTime?: number;
  tweetsAnalyzed?: number;
  sources?: Array<{ title: string; url: string; }>;
  steps?: Array<{ step: string; description: string; }>;
}

// Components
const ViztaChat = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Root>
>(({ ...props }, ref) => (
  <SheetPrimitive.Root {...props} />
));
ViztaChat.displayName = "ViztaChat";

const ViztaChatTrigger = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SheetPrimitive.Trigger
    ref={ref}
    asChild
    {...props}
  >
    <motion.button
      className={cn(
        "fixed right-6 top-6 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-[#1e40af] text-white shadow-lg focus:outline-none z-50 border border-[#1e3a8a]",
        className
      )}
      whileHover={{ scale: 1.05, boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.2)" }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.15 }}
    >
      {children || (
        <div className="relative flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white rounded flex items-center justify-center font-bold text-sm">
            V
          </div>
        </div>
      )}
    </motion.button>
  </SheetPrimitive.Trigger>
));
ViztaChatTrigger.displayName = "ViztaChatTrigger";

const ViztaChatPortal = ({
  ...props
}: SheetPrimitive.DialogPortalProps) => (
  <SheetPrimitive.Portal {...props} />
);
ViztaChatPortal.displayName = "ViztaChatPortal";

const ViztaChatOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/30 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 transition-all duration-200",
      className
    )}
    {...props}
    ref={ref}
  />
));
ViztaChatOverlay.displayName = "ViztaChatOverlay";

const ViztaChatContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <ViztaChatPortal>
    <ViztaChatOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(
        "fixed z-50 flex flex-col gap-0 right-0 inset-y-0 h-full w-full sm:w-[440px] border-l bg-white shadow-2xl transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right duration-200",
        className
      )}
      {...props}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-[#1e40af] text-white">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 border-2 border-white rounded flex items-center justify-center">
              <span className="text-sm font-bold">V</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold">Vizta</h2>
              <p className="text-xs text-white/80">Análisis de noticias y tendencias</p>
            </div>
          </div>
          <SheetPrimitive.Close asChild>
            <motion.button
              className="rounded-md h-8 w-8 hover:bg-white/10 flex items-center justify-center transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Cerrar</span>
            </motion.button>
          </SheetPrimitive.Close>
        </div>
        
        {/* Messages area */}
        <ScrollArea className="flex-1 p-4 bg-gray-50">
          {children}
        </ScrollArea>
      </div>
    </SheetPrimitive.Content>
  </ViztaChatPortal>
));
ViztaChatContent.displayName = "ViztaChatContent";

// Message Component with Conditional Tabs
const AssistantMessage: React.FC<{ message: Message }> = ({ message }) => {
  const [activeTab, setActiveTab] = React.useState("answer");
  const [isExpanded, setIsExpanded] = React.useState(true);
  const messageRef = React.useRef<HTMLDivElement>(null);

  // Check if we have sources or steps
  const hasSources = message.sources && message.sources.length > 0;
  const hasSteps = message.steps && message.steps.length > 0;
  const showTabs = hasSources || hasSteps;

  React.useEffect(() => {
    if (messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, []);

  return (
    <motion.div
      ref={messageRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-start gap-3 rounded-lg p-4 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-150"
    >
      <Avatar className="h-9 w-9 shadow-sm">
        <AvatarFallback className="bg-[#1e40af] text-white border border-[#1e3a8a]">
          <div className="w-6 h-6 border border-white rounded flex items-center justify-center text-xs font-bold">
            V
          </div>
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        {/* Tabs - Only show if we have sources or steps */}
        {showTabs ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-3 bg-gray-100">
              <TabsTrigger value="answer" className="text-xs gap-1.5">
                <FileText className="h-3 w-3" />
                Respuesta
              </TabsTrigger>
              {hasSources && (
                <TabsTrigger value="sources" className="text-xs gap-1.5">
                  <LinkIcon className="h-3 w-3" />
                  Fuentes
                </TabsTrigger>
              )}
              {hasSteps && (
                <TabsTrigger value="steps" className="text-xs gap-1.5">
                  <BarChart3 className="h-3 w-3" />
                  Pasos
                </TabsTrigger>
              )}
            </TabsList>

            {/* Answer Tab */}
            <TabsContent value="answer" className="space-y-2">
              <div className="relative">
                <div className={cn(
                  "prose prose-sm max-w-none transition-all duration-200",
                  !isExpanded && "max-h-48 overflow-hidden"
                )}>
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({children}) => <h1 className="text-lg font-bold mb-3 mt-2 text-gray-900">{children}</h1>,
                      h2: ({children}) => <h2 className="text-base font-semibold mb-2 mt-3 text-gray-800">{children}</h2>,
                      h3: ({children}) => <h3 className="text-sm font-semibold mb-2 mt-2 text-gray-700">{children}</h3>,
                      p: ({children}) => <p className="mb-3 leading-relaxed text-sm text-gray-700">{children}</p>,
                      ul: ({children}) => <ul className="mb-3 ml-4 space-y-1.5 list-disc marker:text-[#1e40af]">{children}</ul>,
                      ol: ({children}) => <ol className="mb-3 ml-4 space-y-1.5 list-decimal marker:text-[#1e40af]">{children}</ol>,
                      li: ({children}) => <li className="leading-relaxed text-sm text-gray-700">{children}</li>,
                      strong: ({children}) => <strong className="font-semibold text-gray-900">{children}</strong>,
                      em: ({children}) => <em className="italic text-gray-600">{children}</em>,
                      blockquote: ({children}) => (
                        <blockquote className="border-l-4 border-[#0891b2] pl-4 py-2 bg-gray-50 rounded-r my-3">
                          {children}
                        </blockquote>
                      ),
                      code: ({inline, children}) => 
                        inline ? (
                          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono text-[#1e40af]">
                            {children}
                          </code>
                        ) : (
                          <div className="relative group">
                            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs my-3">
                              <code>{children}</code>
                            </pre>
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <CopyButton text={String(children)} className="bg-gray-800 text-white hover:bg-gray-700" />
                            </div>
                          </div>
                        )
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
                
                {!isExpanded && (
                  <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent" />
                )}
              </div>
              
              {message.content.length > 500 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-xs text-[#1e40af] hover:text-[#1e3a8a] font-medium flex items-center gap-1 mt-2"
                >
                  {isExpanded ? (
                    <>Mostrar menos <ChevronUp className="h-3 w-3" /></>
                  ) : (
                    <>Mostrar más <ChevronDown className="h-3 w-3" /></>
                  )}
                </button>
              )}
            </TabsContent>

            {/* Sources Tab */}
            {hasSources && (
              <TabsContent value="sources" className="space-y-2">
                {message.sources!.map((source, idx) => (
                  <motion.a
                    key={idx}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-[#0891b2] hover:bg-gray-50 transition-all duration-150 group"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-[#0891b2] group-hover:text-white transition-colors">
                      <LinkIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{source.title}</p>
                      <p className="text-xs text-gray-500 truncate">{source.url}</p>
                    </div>
                  </motion.a>
                ))}
              </TabsContent>
            )}

            {/* Steps Tab */}
            {hasSteps && (
              <TabsContent value="steps" className="space-y-3">
                {message.steps!.map((step, idx) => (
                  <motion.div
                    key={idx}
                    className="flex gap-3"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <div className="flex flex-col items-center">
                      <div className="h-6 w-6 rounded bg-[#1e40af] text-white text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </div>
                      {idx < message.steps!.length - 1 && (
                        <div className="w-0.5 flex-1 bg-gray-300 mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-medium text-gray-900 mb-1">{step.step}</p>
                      <p className="text-xs text-gray-600">{step.description}</p>
                    </div>
                  </motion.div>
                ))}
              </TabsContent>
            )}
          </Tabs>
        ) : (
          /* No tabs - Just show content */
          <div className="space-y-2">
            <div className="relative">
              <div className={cn(
                "prose prose-sm max-w-none transition-all duration-200",
                !isExpanded && "max-h-48 overflow-hidden"
              )}>
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({children}) => <h1 className="text-lg font-bold mb-3 mt-2 text-gray-900">{children}</h1>,
                    h2: ({children}) => <h2 className="text-base font-semibold mb-2 mt-3 text-gray-800">{children}</h2>,
                    h3: ({children}) => <h3 className="text-sm font-semibold mb-2 mt-2 text-gray-700">{children}</h3>,
                    p: ({children}) => <p className="mb-3 leading-relaxed text-sm text-gray-700">{children}</p>,
                    ul: ({children}) => <ul className="mb-3 ml-4 space-y-1.5 list-disc marker:text-[#1e40af]">{children}</ul>,
                    ol: ({children}) => <ol className="mb-3 ml-4 space-y-1.5 list-decimal marker:text-[#1e40af]">{children}</ol>,
                    li: ({children}) => <li className="leading-relaxed text-sm text-gray-700">{children}</li>,
                    strong: ({children}) => <strong className="font-semibold text-gray-900">{children}</strong>,
                    em: ({children}) => <em className="italic text-gray-600">{children}</em>,
                    blockquote: ({children}) => (
                      <blockquote className="border-l-4 border-[#0891b2] pl-4 py-2 bg-gray-50 rounded-r my-3">
                        {children}
                      </blockquote>
                    ),
                    code: ({inline, children}) => 
                      inline ? (
                        <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono text-[#1e40af]">
                          {children}
                        </code>
                      ) : (
                        <div className="relative group">
                          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs my-3">
                            <code>{children}</code>
                          </pre>
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <CopyButton text={String(children)} className="bg-gray-800 text-white hover:bg-gray-700" />
                          </div>
                        </div>
                      )
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
              
              {!isExpanded && (
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent" />
              )}
            </div>
            
            {message.content.length > 500 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-[#1e40af] hover:text-[#1e3a8a] font-medium flex items-center gap-1 mt-2"
              >
                {isExpanded ? (
                  <>Mostrar menos <ChevronUp className="h-3 w-3" /></>
                ) : (
                  <>Mostrar más <ChevronDown className="h-3 w-3" /></>
                )}
              </button>
            )}
          </div>
        )}
        
        {/* Message metadata */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200">
          <time className="text-xs text-gray-500">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </time>
          
          <div className="flex items-center gap-2">
            {message.executionTime && (
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {(message.executionTime / 1000).toFixed(1)}s
              </span>
            )}
            {message.tweetsAnalyzed && message.tweetsAnalyzed > 0 && (
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded flex items-center gap-1">
                <Hash className="h-3 w-3" />
                {message.tweetsAnalyzed}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Main component
const ViztaChatUI = () => {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [inputValue, setInputValue] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [sessionId, setSessionId] = React.useState<string>("");
  const [mode, setMode] = React.useState<'chat' | 'agentic'>('chat');
  const [isContextOpen, setIsContextOpen] = React.useState(false);
  const [isContextModalOpen, setIsContextModalOpen] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const contextButtonRef = React.useRef<HTMLButtonElement>(null);

  // Generar sessionId al montar el componente
  React.useEffect(() => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
  }, []);

  // Auto scroll to bottom
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue("");
    setIsLoading(true);

    try {
      // Importar dinámicamente el servicio
      const { sendViztaChatQuery } = await import('../../services/viztaChat');
      
      // Enviar consulta al backend
      const response = await sendViztaChatQuery(currentInput, sessionId, mode);
      console.log("🔍 Respuesta recibida del servidor:", JSON.stringify(response, null, 2));

      // Manejar diferentes estructuras de respuesta del backend
      if (response.success || response.response) {
        let messageContent: string;

        // Lógica defensiva para asegurar que el contenido siempre sea un string
        if (response.response && typeof response.response === 'object' && 'message' in response.response && typeof response.response.message === 'string') {
          messageContent = response.response.message;
        } else if (typeof response.response === 'string') {
          messageContent = response.response;
        } else if (response.success === false && response.error) {
          // Manejar casos de error explícito
          throw new Error(response.error);
        } else {
          // Fallback: si no podemos encontrar el mensaje, mostramos el objeto de respuesta para depurar
          messageContent = `Respuesta con formato inesperado. Recibido:\n\n\`\`\`json\n${JSON.stringify(response.response || response, null, 2)}\n\`\`\``;
        }
        
        // Extraer timestamp y type de manera segura
        let messageTimestamp = Date.now();
        let toolType = response.toolUsed;
        
        if (response.response && typeof response.response === 'object') {
          if ('timestamp' in response.response && response.response.timestamp) {
            messageTimestamp = new Date(response.response.timestamp).getTime();
          }
          if ('type' in response.response && response.response.type) {
            toolType = toolType || response.response.type;
          }
        }
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: messageContent,
          sender: "assistant",
          timestamp: new Date(messageTimestamp),
          toolUsed: toolType,
          executionTime: response.executionTime || response.metadata?.processingTime,
          tweetsAnalyzed: response.toolResult?.tweets?.length || 0,
          // Only add sources/steps if they exist in the response
          sources: response.sources || undefined,
          steps: response.steps || undefined
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(response.error || 'Error en la respuesta');
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `❌ **Error de conexión**\n\nNo pude procesar tu consulta en este momento. Por favor verifica tu conexión e intenta nuevamente.`,
        sender: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    {
      text: "¿Qué está pasando en Guatemala hoy?",
      icon: <MessageCircle className="h-4 w-4" />,
      gradient: "from-blue-500 to-cyan-400"
    },
    {
      text: "Analiza el sentimiento político actual",
      icon: <BarChart3 className="h-4 w-4" />,
      gradient: "from-purple-500 to-pink-400"
    },
    {
      text: "Tendencias en redes sociales",
      icon: <TrendingUp className="h-4 w-4" />,
      gradient: "from-green-500 to-emerald-400"
    },
    {
      text: "Reacciones sobre deportes guatemaltecos",
      icon: <Hash className="h-4 w-4" />,
      gradient: "from-orange-500 to-red-400"
    }
  ];

  return (
    <ViztaChat>
      <ViztaChatTrigger />
      <ViztaChatContent>
        <div className="flex flex-col space-y-4">
          {/* Mode toggle */}
          <motion.div 
            className="flex items-center justify-between mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          >
            <div className="text-xs text-gray-600 font-medium">Modo</div>
            <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200">
              <button
                onClick={() => setMode('chat')}
                className={cn(
                  'px-3 py-1 rounded-md text-xs font-medium transition-all duration-150',
                  mode === 'chat' ? 'bg-[#1e40af] text-white' : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                Chat
              </button>
              <button
                onClick={() => setMode('agentic')}
                className={cn(
                  'px-3 py-1 rounded-md text-xs font-medium transition-all duration-150',
                  mode === 'agentic' ? 'bg-[#1e40af] text-white' : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                Agéntico
              </button>
            </div>
          </motion.div>

          {/* Welcome screen */}
          {messages.length === 0 ? (
            <motion.div 
              className="flex flex-col items-center justify-center min-h-[500px] text-center p-6 select-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {/* Logo */}
              <div className="mb-6">
                <div className="h-16 w-16 border-2 border-[#1e40af] rounded-lg bg-white flex items-center justify-center shadow-sm">
                  <span className="text-2xl font-bold text-[#1e40af]">V</span>
                </div>
              </div>
              
              <h3 className="text-2xl font-semibold mb-2 text-gray-900">
                Vizta
              </h3>
              <p className="text-sm text-gray-600 mb-8 max-w-sm leading-relaxed">
                Asistente de análisis de noticias y tendencias de Guatemala
              </p>

              {/* Quick prompts */}
              <div className="grid grid-cols-1 gap-3 w-full max-w-sm">
                {quickPrompts.map((prompt, index) => (
                  <motion.button
                    key={index}
                    onClick={() => setInputValue(prompt.text)}
                    className={cn(
                      "group relative overflow-hidden rounded-lg p-4 text-left text-sm font-medium text-white shadow-md hover:shadow-lg transition-all duration-200",
                      `bg-gradient-to-r ${prompt.gradient}`
                    )}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="relative z-10 flex items-center gap-3">
                      {prompt.icon}
                      <span className="flex-1">{prompt.text}</span>
                    </div>
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {messages.map((message, index) => (
                message.sender === "user" ? (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-start gap-3 ml-auto max-w-[85%]"
                  >
                    <div className="flex-1 rounded-lg p-4 bg-[#1e40af] text-white shadow-sm">
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      <time className="text-xs text-white/70 mt-2 block">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </time>
                    </div>
                    <Avatar className="h-9 w-9 shadow-sm">
                      <AvatarFallback className="bg-gray-200 text-gray-700">
                        <MessageCircle className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  </motion.div>
                ) : (
                  <AssistantMessage key={message.id} message={message} />
                )
              ))}
            </AnimatePresence>
          )}
          
          {/* Loading state */}
          <AnimatePresence>
            {isLoading && (
              <motion.div 
                className="flex items-start gap-3 rounded-lg p-4 bg-white border border-gray-200 shadow-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                <Avatar className="h-9 w-9 shadow-sm">
                  <AvatarFallback className="bg-[#1e40af] text-white border border-[#1e3a8a]">
                    <div className="w-6 h-6 border border-white rounded flex items-center justify-center text-xs font-bold">
                      V
                    </div>
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <TypingIndicator />
                    <span className="text-sm text-gray-600">Analizando...</span>
                  </div>
                  <SkeletonLoader lines={3} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={scrollRef} />
        </div>
        
        {/* Context Modal - Full screen */}
        <AnimatePresence>
          {isContextModalOpen && (
            <>
              <motion.div
                className="fixed inset-0 bg-black/50 z-[60]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsContextModalOpen(false)}
              />
              <motion.div
                className="fixed inset-4 md:inset-12 bg-white rounded-lg shadow-2xl z-[70] flex flex-col"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                  <h2 className="text-xl font-semibold text-gray-900">Contexto</h2>
                  <button
                    onClick={() => setIsContextModalOpen(false)}
                    className="h-8 w-8 rounded-md hover:bg-gray-100 flex items-center justify-center transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                {/* Modal Content */}
                <div className="flex-1 overflow-auto p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Documentos */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <FileUp className="h-5 w-5 text-[#1e40af]" />
                        <h3 className="font-semibold text-gray-900">Documentos</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Archivos y documentos que has compartido
                      </p>
                      <div className="text-sm text-gray-500 italic">
                        No hay documentos aún
                      </div>
                    </div>

                    {/* Proyectos */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Folder className="h-5 w-5 text-[#1e40af]" />
                        <h3 className="font-semibold text-gray-900">Proyectos</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Tus proyectos y análisis guardados
                      </p>
                      <div className="text-sm text-gray-500 italic">
                        No hay proyectos aún
                      </div>
                    </div>

                    {/* Actividades */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Activity className="h-5 w-5 text-[#1e40af]" />
                        <h3 className="font-semibold text-gray-900">Actividades</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Historial de consultas y acciones
                      </p>
                      <div className="text-sm text-gray-500 italic">
                        No hay actividades recientes
                      </div>
                    </div>

                    {/* Información */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Info className="h-5 w-5 text-[#1e40af]" />
                        <h3 className="font-semibold text-gray-900">Información</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Datos y configuraciones de la plataforma
                      </p>
                      <div className="text-sm text-gray-500 italic">
                        Sin información adicional
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        
        {/* Input area */}
        <div className="border-t bg-white p-4">
          <div className="flex gap-2">
            {/* Context Button */}
            <div className="relative">
              <button
                ref={contextButtonRef}
                onClick={() => setIsContextOpen(!isContextOpen)}
                className="h-12 w-12 rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center justify-center transition-colors"
                title="Contexto"
              >
                <Info className="h-5 w-5 text-gray-600" />
              </button>

              {/* Context Dropdown */}
              <AnimatePresence>
                {isContextOpen && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsContextOpen(false)}
                    />
                    
                    {/* Dropdown Menu */}
                    <motion.div
                      className="absolute bottom-full left-0 mb-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.15 }}
                    >
                      {/* Dropdown Header */}
                      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Contexto</h3>
                        <button
                          onClick={() => {
                            setIsContextOpen(false);
                            setIsContextModalOpen(true);
                          }}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          title="Expandir"
                        >
                          <Maximize2 className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>

                      {/* Dropdown Content */}
                      <div className="p-3 space-y-2 max-h-96 overflow-auto">
                        {/* Documentos */}
                        <button className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-2 mb-1">
                            <FileUp className="h-4 w-4 text-[#1e40af]" />
                            <span className="text-sm font-medium text-gray-900">Documentos</span>
                          </div>
                          <p className="text-xs text-gray-500">0 documentos</p>
                        </button>

                        {/* Proyectos */}
                        <button className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-2 mb-1">
                            <Folder className="h-4 w-4 text-[#1e40af]" />
                            <span className="text-sm font-medium text-gray-900">Proyectos</span>
                          </div>
                          <p className="text-xs text-gray-500">0 proyectos</p>
                        </button>

                        {/* Actividades */}
                        <button className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-2 mb-1">
                            <Activity className="h-4 w-4 text-[#1e40af]" />
                            <span className="text-sm font-medium text-gray-900">Actividades</span>
                          </div>
                          <p className="text-xs text-gray-500">Sin actividad reciente</p>
                        </button>

                        {/* Información */}
                        <button className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-2 mb-1">
                            <Info className="h-4 w-4 text-[#1e40af]" />
                            <span className="text-sm font-medium text-gray-900">Información</span>
                          </div>
                          <p className="text-xs text-gray-500">Ver detalles</p>
                        </button>
                      </div>

                      {/* Dropdown Footer */}
                      <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                        <p className="text-xs text-gray-500">
                          Agrega contexto para mejorar las respuestas
                        </p>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Input Field */}
            <div className="flex-1 relative">
              <Textarea
                placeholder="Escribe tu consulta sobre Guatemala..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="h-12 w-full resize-none rounded-lg bg-white border border-gray-300 px-4 py-3 focus-visible:ring-1 focus-visible:ring-[#1e40af] focus-visible:border-[#1e40af] focus-visible:outline-none placeholder:text-gray-400 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
            </div>
            <Button 
              size="icon" 
              onClick={handleSend}
              disabled={isLoading || !inputValue.trim()}
              className="h-12 w-12 bg-[#1e40af] text-white hover:bg-[#1e3a8a] shadow-md hover:shadow-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Enviar mensaje</span>
            </Button>
          </div>
        </div>
      </ViztaChatContent>
    </ViztaChat>
  );
};

export { 
  ViztaChat, 
  ViztaChatTrigger, 
  ViztaChatContent, 
  ViztaChatOverlay, 
  ViztaChatPortal,
  ViztaChatUI 
};
