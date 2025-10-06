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
  Newspaper
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
      "fixed inset-0 z-50 bg-black/20 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
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
        "fixed z-50 flex flex-col gap-0 right-0 inset-y-0 h-full w-full sm:w-[440px] border-l bg-gradient-to-b from-white to-gray-50/50 shadow-2xl transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right duration-300",
        className
      )}
      {...props}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-500 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
          <div className="flex items-center gap-3 relative z-10">
            <motion.div 
              className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <span className="text-sm font-bold">V</span>
            </motion.div>
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                Vizta Chat
                <Sparkles className="h-4 w-4 text-yellow-300" />
              </h2>
              <p className="text-xs text-white/80">Análisis inteligente de Guatemala</p>
            </div>
          </div>
          <SheetPrimitive.Close asChild>
            <motion.button
              className="rounded-full h-8 w-8 bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors relative z-10"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Cerrar</span>
            </motion.button>
          </SheetPrimitive.Close>
        </div>
        
        {/* Messages area */}
        <ScrollArea className="flex-1 p-4">
          {children}
        </ScrollArea>
      </div>
    </SheetPrimitive.Content>
  </ViztaChatPortal>
));
ViztaChatContent.displayName = "ViztaChatContent";

// Message Component with Tabs
const AssistantMessage: React.FC<{ message: Message }> = ({ message }) => {
  const [activeTab, setActiveTab] = React.useState("answer");
  const [isExpanded, setIsExpanded] = React.useState(true);
  const messageRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, []);

  return (
    <motion.div
      ref={messageRef}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex items-start gap-3 rounded-2xl p-4 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200"
    >
      <Avatar className="h-9 w-9 shadow-sm ring-2 ring-blue-100">
        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
          <span className="text-sm font-bold">V</span>
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-3 bg-gray-100/80 backdrop-blur-sm">
            <TabsTrigger value="answer" className="text-xs gap-1.5">
              <FileText className="h-3 w-3" />
              Answer
            </TabsTrigger>
            {message.sources && message.sources.length > 0 && (
              <TabsTrigger value="sources" className="text-xs gap-1.5">
                <LinkIcon className="h-3 w-3" />
                Sources
              </TabsTrigger>
            )}
            {message.steps && message.steps.length > 0 && (
              <TabsTrigger value="steps" className="text-xs gap-1.5">
                <BarChart3 className="h-3 w-3" />
                Steps
              </TabsTrigger>
            )}
          </TabsList>

          {/* Answer Tab */}
          <TabsContent value="answer" className="space-y-2">
            <div className="relative">
              <div className={cn(
                "prose prose-sm max-w-none transition-all duration-300",
                !isExpanded && "max-h-48 overflow-hidden"
              )}>
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({children}) => <h1 className="text-lg font-bold mb-3 mt-2 text-gray-900">{children}</h1>,
                    h2: ({children}) => <h2 className="text-base font-bold mb-2 mt-3 text-gray-800">{children}</h2>,
                    h3: ({children}) => <h3 className="text-sm font-semibold mb-2 mt-2 text-gray-700">{children}</h3>,
                    p: ({children}) => <p className="mb-3 leading-relaxed text-sm text-gray-700">{children}</p>,
                    ul: ({children}) => <ul className="mb-3 ml-4 space-y-1.5 list-disc marker:text-blue-500">{children}</ul>,
                    ol: ({children}) => <ol className="mb-3 ml-4 space-y-1.5 list-decimal marker:text-blue-500">{children}</ol>,
                    li: ({children}) => <li className="leading-relaxed text-sm text-gray-700">{children}</li>,
                    strong: ({children}) => <strong className="font-semibold text-gray-900">{children}</strong>,
                    em: ({children}) => <em className="italic text-gray-600">{children}</em>,
                    blockquote: ({children}) => (
                      <blockquote className="border-l-4 border-blue-400 pl-4 py-2 bg-blue-50/50 rounded-r-lg my-3">
                        {children}
                      </blockquote>
                    ),
                    code: ({inline, children}) => 
                      inline ? (
                        <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono text-pink-600">
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
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 mt-2"
              >
                {isExpanded ? (
                  <>Show less <ChevronUp className="h-3 w-3" /></>
                ) : (
                  <>Show more <ChevronDown className="h-3 w-3" /></>
                )}
              </button>
            )}
          </TabsContent>

          {/* Sources Tab */}
          {message.sources && message.sources.length > 0 && (
            <TabsContent value="sources" className="space-y-2">
              {message.sources.map((source, idx) => (
                <motion.a
                  key={idx}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 group"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                    <LinkIcon className="h-4 w-4 text-blue-600" />
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
          {message.steps && message.steps.length > 0 && (
            <TabsContent value="steps" className="space-y-3">
              {message.steps.map((step, idx) => (
                <motion.div
                  key={idx}
                  className="flex gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <div className="flex flex-col items-center">
                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </div>
                    {idx < message.steps.length - 1 && (
                      <div className="w-0.5 flex-1 bg-gradient-to-b from-blue-300 to-purple-300 mt-2" />
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
        
        {/* Message metadata */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
          <time className="text-xs text-muted-foreground">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </time>
          
          <div className="flex items-center gap-2">
            {message.executionTime && (
              <motion.span 
                className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full flex items-center gap-1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <Clock className="h-3 w-3" />
                {(message.executionTime / 1000).toFixed(1)}s
              </motion.span>
            )}
            {message.tweetsAnalyzed && message.tweetsAnalyzed > 0 && (
              <motion.span 
                className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full flex items-center gap-1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                <Hash className="h-3 w-3" />
                {message.tweetsAnalyzed}
              </motion.span>
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
  const scrollRef = React.useRef<HTMLDivElement>(null);

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
          // Mock sources and steps for demo - in real app these would come from backend
          sources: [
            { title: "Fuente de datos oficial", url: "https://example.com" }
          ],
          steps: [
            { step: "Análisis iniciado", description: "Procesando tu consulta" },
            { step: "Datos obtenidos", description: "Información recopilada exitosamente" },
            { step: "Respuesta generada", description: "Análisis completado" }
          ]
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
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="text-xs text-muted-foreground font-medium">Modo</div>
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm p-1 rounded-full border border-gray-200">
              <motion.button
                onClick={() => setMode('chat')}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium transition-all duration-200',
                  mode === 'chat' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600'
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Chat
              </motion.button>
              <motion.button
                onClick={() => setMode('agentic')}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium transition-all duration-200',
                  mode === 'agentic' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-600'
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Agéntico
              </motion.button>
            </div>
          </motion.div>

          {/* Welcome screen */}
          {messages.length === 0 ? (
            <motion.div 
              className="flex flex-col items-center justify-center min-h-[500px] text-center p-6 select-none"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              {/* Logo y bienvenida */}
              <motion.div 
                className="relative mb-6"
                animate={{ 
                  rotate: [0, 5, -5, 0],
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-500 flex items-center justify-center shadow-xl ring-4 ring-blue-100">
                  <span className="text-2xl font-bold text-white">V</span>
                </div>
                <motion.div 
                  className="absolute -bottom-1 -right-1 h-6 w-6 bg-green-400 rounded-full flex items-center justify-center ring-2 ring-white"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Zap className="h-3 w-3 text-white" />
                </motion.div>
              </motion.div>
              
              <motion.h3 
                className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                ¡Hola! Soy Vizta
              </motion.h3>
              <motion.p 
                className="text-sm text-muted-foreground mb-8 max-w-sm leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Tu asistente especializado en análisis de redes sociales, tendencias y sentimientos sobre Guatemala. 
                Pregúntame lo que quieras saber.
              </motion.p>

              {/* Quick prompts */}
              <div className="grid grid-cols-1 gap-3 w-full max-w-sm">
                {quickPrompts.map((prompt, index) => (
                  <motion.button
                    key={index}
                    onClick={() => setInputValue(prompt.text)}
                    className={cn(
                      "group relative overflow-hidden rounded-xl p-4 text-left text-sm font-medium text-white shadow-lg transition-all duration-300",
                      `bg-gradient-to-r ${prompt.gradient}`
                    )}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1, type: "spring" }}
                    whileHover={{ scale: 1.02, boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="relative z-10 flex items-center gap-3">
                      {prompt.icon}
                      <span className="flex-1">{prompt.text}</span>
                    </div>
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="flex items-start gap-3 ml-auto max-w-[85%]"
                  >
                    <div className="flex-1 rounded-2xl p-4 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-500 text-white shadow-lg">
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      <time className="text-xs text-white/70 mt-2 block">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </time>
                    </div>
                    <Avatar className="h-9 w-9 shadow-sm ring-2 ring-blue-100">
                      <AvatarFallback className="bg-white/20 text-white border border-white/30">
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
                className="flex items-start gap-3 rounded-2xl p-4 bg-white border border-gray-100 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Avatar className="h-9 w-9 shadow-sm ring-2 ring-blue-100">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                    <span className="text-sm font-bold">V</span>
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <TypingIndicator />
                    <TextShimmer 
                      duration={1.5}
                      className="text-sm font-medium [--base-color:theme(colors.blue.600)] [--base-gradient-color:theme(colors.blue.300)]"
                    >
                      Analizando tu consulta
                    </TextShimmer>
                  </div>
                  <SkeletonLoader lines={3} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={scrollRef} />
        </div>
        
        {/* Input area */}
        <motion.div 
          className="border-t bg-white/80 backdrop-blur-sm p-4"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", damping: 20 }}
        >
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl p-[1px]"
                animate={{
                  background: [
                    "linear-gradient(90deg, #3b82f6, #8b5cf6)",
                    "linear-gradient(180deg, #8b5cf6, #3b82f6)",
                    "linear-gradient(270deg, #3b82f6, #8b5cf6)",
                    "linear-gradient(360deg, #8b5cf6, #3b82f6)",
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Textarea
                  placeholder="Escribe tu consulta sobre Guatemala..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="h-12 w-full resize-none rounded-xl bg-white border-0 px-4 py-3 focus-visible:ring-0 focus-visible:outline-none placeholder:text-gray-400 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
              </motion.div>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                size="icon" 
                onClick={handleSend}
                disabled={isLoading || !inputValue.trim()}
                className="h-12 w-12 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Enviar mensaje</span>
              </Button>
            </motion.div>
          </div>
        </motion.div>
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
