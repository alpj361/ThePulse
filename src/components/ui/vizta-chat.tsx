"use client";

import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import {
  X,
  MessageCircle,
  Send,
  Zap,
  Clock,
  Hash,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Textarea } from "./textarea";
import { Avatar, AvatarFallback } from "./avatar";
import { ScrollArea } from "./scroll-area";
import { TextShimmer } from "./text-shimmer";

// Types
interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
  toolUsed?: string;
  executionTime?: number;
  tweetsAnalyzed?: number;
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
    className={cn(
      "fixed right-6 top-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-500 text-white shadow-lg hover:shadow-2xl hover:scale-105 focus:outline-none transition-all duration-300 z-50",
      className
    )}
    {...props}
  >
    {children || (
      <div className="relative">
        <MessageCircle className="h-6 w-6" />
        <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full animate-pulse"></div>
      </div>
    )}
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
        "fixed z-50 flex flex-col gap-0 right-0 inset-y-0 h-full w-full sm:w-[420px] border-l bg-gradient-to-b from-white to-gray-50/50 shadow-2xl transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right duration-300",
        className
      )}
      {...props}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-500 text-white">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-sm font-bold">V</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold">Vizta Chat</h2>
              <p className="text-xs text-white/80">Análisis inteligente de Guatemala</p>
            </div>
          </div>
          <SheetPrimitive.Close className="rounded-full h-8 w-8 bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <X className="h-4 w-4" />
            <span className="sr-only">Cerrar</span>
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

// Main component
const ViztaChatUI = () => {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [inputValue, setInputValue] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [sessionId, setSessionId] = React.useState<string>("");
  const [mode, setMode] = React.useState<'chat' | 'agentic'>('chat');

  // Generar sessionId al montar el componente
  React.useEffect(() => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
  }, []);

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
          tweetsAnalyzed: response.toolResult?.tweets?.length || 0
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
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-muted-foreground">Modo</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMode('chat')}
                className={cn(
                  'px-3 py-1 rounded-full text-xs border',
                  mode === 'chat' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'
                )}
              >
                Chat
              </button>
              <button
                onClick={() => setMode('agentic')}
                className={cn(
                  'px-3 py-1 rounded-full text-xs border',
                  mode === 'agentic' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200'
                )}
              >
                Agéntico
              </button>
            </div>
          </div>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-6 select-none">
              {/* Logo y bienvenida */}
              <div className="relative mb-6">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-500 flex items-center justify-center shadow-xl">
                  <span className="text-2xl font-bold text-white">V</span>
                </div>
                <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-green-400 rounded-full flex items-center justify-center">
                  <Zap className="h-3 w-3 text-white" />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ¡Hola! Soy Vizta
              </h3>
              <p className="text-sm text-muted-foreground mb-8 max-w-sm leading-relaxed">
                Tu asistente especializado en análisis de redes sociales, tendencias y sentimientos sobre Guatemala. 
                Pregúntame lo que quieras saber.
              </p>

              {/* Quick prompts */}
              <div className="grid grid-cols-1 gap-3 w-full max-w-sm">
                {quickPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => setInputValue(prompt.text)}
                    className={cn(
                      "group relative overflow-hidden rounded-xl p-4 text-left text-sm font-medium text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]",
                      `bg-gradient-to-r ${prompt.gradient}`
                    )}
                  >
                    <div className="relative z-10 flex items-center gap-3">
                      {prompt.icon}
                      <span className="flex-1">{prompt.text}</span>
                    </div>
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-start gap-3 rounded-2xl p-4 transition-all duration-200",
                  message.sender === "user"
                    ? "ml-auto max-w-[85%] bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-500 text-white shadow-lg"
                    : "bg-white border border-gray-100 shadow-sm hover:shadow-md"
                )}
              >
                {message.sender === "assistant" && (
                  <Avatar className="h-9 w-9 shadow-sm">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                      <span className="text-sm font-bold">V</span>
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({children}) => <h1 className="text-lg font-bold mb-3 mt-2">{children}</h1>,
                        h2: ({children}) => <h2 className="text-base font-bold mb-2 mt-3">{children}</h2>,
                        h3: ({children}) => <h3 className="text-sm font-semibold mb-2 mt-2">{children}</h3>,
                        p: ({children}) => <p className="mb-3 leading-relaxed text-sm">{children}</p>,
                        ul: ({children}) => <ul className="mb-3 ml-4 space-y-1">{children}</ul>,
                        ol: ({children}) => <ol className="mb-3 ml-4 space-y-1">{children}</ol>,
                        li: ({children}) => <li className="leading-relaxed text-sm">{children}</li>,
                        strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                        em: ({children}) => <em className="italic">{children}</em>,
                        blockquote: ({children}) => (
                          <blockquote className="border-l-4 border-blue-200 pl-4 py-2 bg-blue-50/50 rounded-r-lg my-3">
                            {children}
                          </blockquote>
                        ),
                        code: ({children}) => (
                          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">
                            {children}
                          </code>
                        )
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                  
                  {/* Message metadata */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-current/10">
                    <time className={cn(
                      "text-xs",
                      message.sender === "user" ? "text-white/70" : "text-muted-foreground"
                    )}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </time>
                    
                    {message.sender === "assistant" && (
                      <div className="flex items-center gap-2">
                        {message.executionTime && (
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {(message.executionTime / 1000).toFixed(1)}s
                          </span>
                        )}
                        {message.tweetsAnalyzed && message.tweetsAnalyzed > 0 && (
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            {message.tweetsAnalyzed}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {message.sender === "user" && (
                  <Avatar className="h-9 w-9 shadow-sm">
                    <AvatarFallback className="bg-white/20 text-white border border-white/30">
                      <MessageCircle className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))
          )}
          
          {/* Loading state */}
          {isLoading && (
            <div className="flex items-start gap-3 rounded-2xl p-4 bg-white border border-gray-100 shadow-sm">
              <Avatar className="h-9 w-9 shadow-sm">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                  <span className="text-sm font-bold">V</span>
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <TextShimmer 
                  duration={1.5}
                  className="text-sm font-medium [--base-color:theme(colors.blue.600)] [--base-gradient-color:theme(colors.blue.300)]"
                >
                  Analizando tu consulta...
                </TextShimmer>
                <TextShimmer 
                  duration={2}
                  className="text-xs [--base-color:theme(colors.gray.500)] [--base-gradient-color:theme(colors.gray.300)]"
                >
                  Procesando datos y generando respuesta inteligente
                </TextShimmer>
                <div className="flex items-center gap-2">
                  <Zap className="h-3 w-3 animate-pulse text-blue-500" />
                  <TextShimmer 
                    duration={1.8}
                    className="text-xs [--base-color:theme(colors.blue.600)] [--base-gradient-color:theme(colors.blue.400)]"
                  >
                    Conectando con fuentes de datos
                  </TextShimmer>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Input area */}
        <div className="border-t bg-white/80 backdrop-blur-sm p-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl p-[1px]">
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
              </div>
            </div>
            <Button 
              size="icon" 
              onClick={handleSend}
              disabled={isLoading || !inputValue.trim()}
              className="h-12 w-12 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
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