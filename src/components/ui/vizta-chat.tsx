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
  ThumbsUp,
  ThumbsDown,
  Info,
  Maximize2,
  Folder,
  Activity,
  FileUp,
  Sparkles,
  BookmarkPlus,
  BookOpen,
  Check,
  AlertTriangle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { C1Component, ThemeProvider } from '@thesysai/genui-sdk';
import '@crayonai/react-ui/styles/index.css';

import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Textarea } from "./textarea";
import { Avatar, AvatarFallback } from "./avatar";
import { ScrollArea } from "./scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";
import { TypingIndicator } from "./typing-indicator";
import { SkeletonLoader } from "./skeleton-loader";
import { CopyButton } from "./copy-button";
import CodexSelector from "./CodexSelector";  // ✨ NUEVO: Import CodexSelector
import { useAuth } from '../../context/AuthContext';  // ✨ NUEVO: Import useAuth
import ProjectSelectorDialog from "./ProjectSelectorDialog";
import { supabase } from "../../services/supabase";
import type { Project } from "../../types/projects";
import type { ViztaCapturedItem, ViztaTermSuggestion } from "../../services/viztaChat";
import CreateWikiModal from "../codex/wiki/CreateWikiModal";

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

type CapturedInsight = ViztaCapturedItem & {
  messageId: string;
  savedProjectId?: string;
  savedProjectTitle?: string;
};

type TermInsight = ViztaTermSuggestion & {
  messageId: string;
  savedToWiki?: boolean;
};

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
  queryLogId?: string; // For feedback
  feedbackScore?: number; // User's rating 1-5
  c1Response?: string; // For Thesys Generative UI
  hasUIComponents?: boolean; // Indicates if message has UI components
  capturedItems?: CapturedInsight[];
  termSuggestions?: TermInsight[];
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
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> & {
    chatWidth?: number;
    onWidthChange?: (width: number) => void;
  }
>(({ className, children, chatWidth = 440, onWidthChange, ...props }, ref) => {
  const [isResizing, setIsResizing] = React.useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = window.innerWidth - e.clientX;
      const minWidth = 380;
      const maxWidth = Math.min(900, window.innerWidth * 0.7);
      
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        onWidthChange?.(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, onWidthChange]);

  return (
    <ViztaChatPortal>
      <ViztaChatOverlay />
      <SheetPrimitive.Content
        ref={ref}
        className={cn(
          "fixed z-50 flex flex-col gap-0 right-0 inset-y-0 h-full border-l bg-white shadow-2xl transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right duration-200",
          className
        )}
        style={{
          width: window.innerWidth < 640 ? '100%' : `${chatWidth}px`,
        }}
        {...props}
      >
        {/* Resize Handle */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 hover:w-1.5 bg-transparent hover:bg-[#1e40af] cursor-ew-resize transition-all z-10 group"
          onMouseDown={() => setIsResizing(true)}
        >
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-16 bg-[#1e40af]/30 group-hover:bg-[#1e40af] rounded-r transition-all" />
        </div>

        <div className="flex flex-col h-full" ref={contentRef}>
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
  );
});
ViztaChatContent.displayName = "ViztaChatContent";

// Auto-scaling C1Component Wrapper
interface C1ComponentWrapperProps {
  c1Response: string;
  cleanResponse?: boolean;
}

const C1ComponentWrapper: React.FC<C1ComponentWrapperProps> = ({ c1Response, cleanResponse = false }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(1);
  const [isCompact, setIsCompact] = React.useState(false);
  const [showFullSize, setShowFullSize] = React.useState(false);

  React.useEffect(() => {
    if (!containerRef.current || !contentRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (!containerRef.current || !contentRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const contentWidth = contentRef.current.scrollWidth;

      if (contentWidth > containerWidth) {
        const newScale = containerWidth / contentWidth;
        const finalScale = Math.max(newScale, 0.3); // Min scale 30% para chat
        setScale(finalScale);
        setIsCompact(finalScale < 0.7);
      } else {
        setScale(1);
        setIsCompact(false);
      }
    });

    resizeObserver.observe(containerRef.current);
    resizeObserver.observe(contentRef.current);

    // Initial calculation
    setTimeout(() => {
      if (!containerRef.current || !contentRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      const contentWidth = contentRef.current.scrollWidth;
      if (contentWidth > containerWidth) {
        const newScale = containerWidth / contentWidth;
        const finalScale = Math.max(newScale, 0.3);
        setScale(finalScale);
        setIsCompact(finalScale < 0.7);
      }
    }, 100);

    return () => resizeObserver.disconnect();
  }, [c1Response]);

  const processedResponse = cleanResponse
    ? c1Response.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    : c1Response;

  return (
    <div className="mt-4 border-t pt-3 border-gray-200 w-full">
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 className="h-3.5 w-3.5 text-purple-600" />
        <h4 className="text-xs font-semibold text-gray-900">Visualización</h4>
        <div className="ml-auto flex items-center gap-2">
          {isCompact && (
            <span className="text-xs text-gray-500">
              {Math.round(scale * 100)}%
            </span>
          )}
          {isCompact && (
            <button
              onClick={() => setShowFullSize(!showFullSize)}
              className="text-xs text-[#1e40af] hover:text-[#1e3a8a] font-medium flex items-center gap-1"
            >
              {showFullSize ? (
                <>Compactar <ChevronUp className="h-3 w-3" /></>
              ) : (
                <>Expandir <ChevronDown className="h-3 w-3" /></>
              )}
            </button>
          )}
        </div>
      </div>
      <div 
        ref={containerRef}
        className={cn(
          "bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-2 w-full overflow-hidden",
          isCompact && !showFullSize && "max-h-64 overflow-y-auto"
        )}
      >
        <div
          ref={contentRef}
          style={{
            transform: showFullSize ? 'scale(1)' : `scale(${scale})`,
            transformOrigin: 'top left',
            width: showFullSize ? '100%' : (scale < 1 ? `${100 / scale}%` : '100%'),
            transition: 'transform 0.2s ease-out'
          }}
        >
          <C1Component c1Response={processedResponse} />
        </div>
      </div>
      {isCompact && !showFullSize && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          Visualización compactada para chat
        </div>
      )}
    </div>
  );
};

// Message Component with Conditional Tabs
interface AssistantMessageProps {
  message: Message;
  onFeedback?: (messageId: string, score: number) => void;
  onRequestProjectSave?: (item: CapturedInsight) => void;
  onSaveTermToWiki?: (term: TermInsight) => void;
  capturedSaveStatus?: Record<string, SaveStatus>;
  termSaveStatus?: Record<string, SaveStatus>;
}

const AssistantMessage = React.forwardRef<HTMLDivElement, AssistantMessageProps>(
  function AssistantMessage({ message, onFeedback, onRequestProjectSave, onSaveTermToWiki, capturedSaveStatus, termSaveStatus }, ref) {
    const [activeTab, setActiveTab] = React.useState("answer");
    const [isExpanded, setIsExpanded] = React.useState(true);
    const [showSources, setShowSources] = React.useState(false);
    const [feedbackGiven, setFeedbackGiven] = React.useState(message.feedbackScore || null);
    const messageRef = React.useRef<HTMLDivElement>(null);

    // Check if we have sources or steps
    const hasSources = message.sources && message.sources.length > 0;
    const hasSteps = message.steps && message.steps.length > 0;
    const hasInsights = (message.capturedItems && message.capturedItems.length > 0) ||
      (message.termSuggestions && message.termSuggestions.length > 0);
    const showTabs = hasSources || hasSteps || hasInsights;

    const handleFeedback = async (score: number) => {
      if (!message.queryLogId || feedbackGiven) return;
      
      setFeedbackGiven(score);
      if (onFeedback) {
        onFeedback(message.id, score);
      }
      
      // Send feedback to backend
      try {
        const response = await fetch(`${import.meta.env.VITE_EXTRACTORW_API_URL}/vizta/feedback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            queryLogId: message.queryLogId,
            feedbackScore: score
          })
        });
        
        if (!response.ok) {
          console.error('Failed to send feedback');
          setFeedbackGiven(null); // Reset on error
        }
      } catch (error) {
        console.error('Error sending feedback:', error);
        setFeedbackGiven(null); // Reset on error
      }
    };

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
              {hasInsights && (
                <TabsTrigger value="insights" className="text-xs gap-1.5">
                  <Sparkles className="h-3 w-3" />
                  Hallazgos
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

                  {/* Generative UI Components - shown below text */}
                  {message.hasUIComponents && message.c1Response && (
                    <C1ComponentWrapper c1Response={message.c1Response} />
                  )}
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

              {/* Fuentes visibles solo en la pestaña "Fuentes" */}
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

            {/* Insights Tab */}
            {hasInsights && (
              <TabsContent value="insights" className="space-y-4">
                {message.capturedItems && message.capturedItems.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <BookmarkPlus className="h-3 w-3" />
                      <span>Datos detectados</span>
                    </div>
                    {message.capturedItems.map((item) => {
                      const status = capturedSaveStatus?.[item.id] || (item.savedProjectId ? 'saved' as SaveStatus : 'idle');
                      const amountText = item.amount !== undefined && item.amount !== null
                        ? `${item.amount.toLocaleString()}${item.currency ? ` ${item.currency}` : ''}`
                        : null;
                      const geoText = [item.city, item.department].filter(Boolean).join(', ');
                      return (
                        <div key={item.id} className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-1 text-sm text-gray-700">
                              <h4 className="text-base font-semibold text-gray-900">
                                {item.title || item.discovery || item.description || 'Dato detectado'}
                              </h4>
                              {item.entity && (
                                <div className="text-xs text-gray-600">
                                  <span className="font-medium text-gray-700">Entidad:</span> {item.entity}
                                </div>
                              )}
                              {amountText && (
                                <div className="text-xs text-gray-600">
                                  <span className="font-medium">Monto:</span> {amountText}
                                </div>
                              )}
                              {geoText && (
                                <div className="text-xs text-gray-600">
                                  <span className="font-medium">Ubicación:</span> {geoText}
                                </div>
                              )}
                              {item.discovery && (
                                <p className="text-sm text-gray-700 leading-relaxed">{item.discovery}</p>
                              )}
                              {item.description && item.description !== item.discovery && (
                                <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
                              )}
                              {item.source_url && (
                                <a
                                  href={item.source_url}
                                  className="text-xs text-[#1e40af] hover:underline"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Ver fuente
                                </a>
                              )}
                              {item.confidence !== undefined && item.confidence !== null && (
                                <div className="text-xs text-gray-500">
                                  Confianza estimada: {(item.confidence * 100).toFixed(0)}%
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-stretch gap-2 min-w-[160px]">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onRequestProjectSave?.(item)}
                                disabled={status === 'saving' || status === 'saved'}
                              >
                                {status === 'saving' ? 'Guardando...' : status === 'saved' ? 'Guardado' : 'Guardar en proyecto'}
                              </Button>
                              {status === 'error' && (
                                <div className="flex items-center gap-1 text-xs text-red-600">
                                  <AlertTriangle className="h-3 w-3" />
                                  Error al guardar
                                </div>
                              )}
                              {status === 'saved' && (
                                <div className="flex items-center gap-1 text-xs text-green-600">
                                  <Check className="h-3 w-3" />
                                  {item.savedProjectTitle ? `En ${item.savedProjectTitle}` : 'Guardado'}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {message.termSuggestions && message.termSuggestions.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <BookOpen className="h-3 w-3" />
                      <span>Términos sugeridos</span>
                    </div>
                    {message.termSuggestions.map((term) => {
                      const status = termSaveStatus?.[term.id] || (term.savedToWiki ? 'saved' as SaveStatus : 'idle');
                      return (
                        <div key={term.id} className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-1 text-sm text-gray-700">
                              <h4 className="text-base font-semibold text-gray-900">{term.term}</h4>
                              {term.category && (
                                <div className="text-xs text-gray-600">
                                  <span className="font-medium">Categoría:</span> {term.category}
                                </div>
                              )}
                              {term.confidence !== undefined && term.confidence !== null && (
                                <div className="text-xs text-gray-600">
                                  <span className="font-medium">Confianza:</span> {(term.confidence * 100).toFixed(0)}%
                                </div>
                              )}
                              {term.reason && (
                                <p className="text-sm text-gray-700 leading-relaxed">{term.reason}</p>
                              )}
                              {term.research_focus && (
                                <p className="text-xs text-gray-500 leading-relaxed">
                                  <span className="font-medium text-gray-600">Investigar:</span> {term.research_focus}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-stretch gap-2 min-w-[160px]">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onSaveTermToWiki?.(term)}
                                disabled={status === 'saving' || status === 'saved'}
                              >
                                {status === 'saving' ? 'Guardando...' : status === 'saved' ? 'Guardado' : 'Guardar en wiki'}
                              </Button>
                              {status === 'error' && (
                                <div className="flex items-center gap-1 text-xs text-red-600">
                                  <AlertTriangle className="h-3 w-3" />
                                  Error al guardar
                                </div>
                              )}
                              {status === 'saved' && (
                                <div className="flex items-center gap-1 text-xs text-green-600">
                                  <Check className="h-3 w-3" />
                                  Guardado en la wiki
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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

                {/* Generative UI Components - shown below text */}
                {message.hasUIComponents && message.c1Response && (
                  <C1ComponentWrapper c1Response={message.c1Response} cleanResponse={true} />
                )}
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

            {/* Fuentes visibles solo en la pestaña "Fuentes" */}
          </div>
        )}
        
        {/* Message metadata */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <time className="text-xs text-gray-500">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </time>
            
            {/* Feedback buttons */}
            {message.queryLogId && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleFeedback(5)}
                  disabled={!!feedbackGiven}
                  className={cn(
                    "p-1 rounded hover:bg-gray-100 transition-colors",
                    feedbackGiven === 5 && "text-green-600 bg-green-50"
                  )}
                  title="Útil"
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleFeedback(1)}
                  disabled={!!feedbackGiven}
                  className={cn(
                    "p-1 rounded hover:bg-gray-100 transition-colors",
                    feedbackGiven === 1 && "text-red-600 bg-red-50"
                  )}
                  title="No útil"
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
          
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
});
AssistantMessage.displayName = "AssistantMessage";

// Main component
const ViztaChatUI = () => {
  const { user, session } = useAuth();  // ✨ NUEVO: Obtener usuario autenticado
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [inputValue, setInputValue] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [sessionId, setSessionId] = React.useState<string>("");
  const [mode, setMode] = React.useState<'chat' | 'agentic'>('chat');
  const [useGenerativeUI, setUseGenerativeUI] = React.useState(false); // Toggle for Generative UI
  const [isContextOpen, setIsContextOpen] = React.useState(false);
  const [isContextModalOpen, setIsContextModalOpen] = React.useState(false);
  // ✨ NUEVO: Estado para items del Codex seleccionados
  const [selectedCodex, setSelectedCodex] = React.useState<string[]>([]);
  const [chatWidth, setChatWidth] = React.useState<number>(() => {
    // Load saved width from localStorage or use default
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vizta-chat-width');
      return saved ? parseInt(saved, 10) : 440;
    }
    return 440;
  });
  const [capturedSaveStatus, setCapturedSaveStatus] = React.useState<Record<string, SaveStatus>>({});
  const [termSaveStatus, setTermSaveStatus] = React.useState<Record<string, SaveStatus>>({});
  const [isProjectSelectorOpen, setIsProjectSelectorOpen] = React.useState(false);
  const [pendingCapturedItem, setPendingCapturedItem] = React.useState<CapturedInsight | null>(null);
  const [isWikiModalOpen, setIsWikiModalOpen] = React.useState(false);
  const [pendingTerm, setPendingTerm] = React.useState<TermInsight | null>(null);
  
  // ✨ NUEVO: Estado para funcionalidad @
  const [showMentions, setShowMentions] = React.useState(false);
  const [mentionQuery, setMentionQuery] = React.useState('');
  const [mentionPosition, setMentionPosition] = React.useState(0);
  const [availableCodexItems, setAvailableCodexItems] = React.useState<any[]>([]);
  const [filteredCodexItems, setFilteredCodexItems] = React.useState<any[]>([]);
  const [selectedMentionIndex, setSelectedMentionIndex] = React.useState(0);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const contextButtonRef = React.useRef<HTMLButtonElement>(null);

  // Save chat width to localStorage when it changes
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('vizta-chat-width', chatWidth.toString());
    }
  }, [chatWidth]);

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

  // ✨ NUEVO: Cargar elementos del codex disponibles para @
  React.useEffect(() => {
    const loadCodexItems = async () => {
      if (!user?.id) {
        console.warn('No hay usuario autenticado, no se pueden cargar elementos del codex');
        setAvailableCodexItems([]);
        return;
      }

      try {
        console.log('🔍 [ViztaChat] Cargando elementos del codex para usuario:', user.id);
        const { getCodexItems } = await import('../../services/codexService');
        const items = await getCodexItems(user.id);
        console.log('📚 [ViztaChat] Elementos cargados:', items.length);
        setAvailableCodexItems(items);
      } catch (error) {
        console.error('❌ [ViztaChat] Error cargando elementos del codex:', error);
        setAvailableCodexItems([]);
      }
    };
    loadCodexItems();
  }, [user?.id]); // ✨ NUEVO: Dependencia en user.id

  // ✨ NUEVO: Filtrar elementos del codex cuando cambia la query
  React.useEffect(() => {
    if (mentionQuery.trim()) {
      const filtered = availableCodexItems.filter(item => 
        item.title?.toLowerCase().includes(mentionQuery.toLowerCase()) ||
        item.content?.toLowerCase().includes(mentionQuery.toLowerCase())
      );
      setFilteredCodexItems(filtered.slice(0, 5)); // Máximo 5 resultados
    } else {
      setFilteredCodexItems(availableCodexItems.slice(0, 5));
    }
    setSelectedMentionIndex(0);
  }, [mentionQuery, availableCodexItems]);

  // ✨ NUEVO: Manejar input con detección de @
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    setInputValue(value);
    
    // Detectar si el usuario está escribiendo después de @
    const textBeforeCursor = value.substring(0, cursorPosition);
    const atMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (atMatch) {
      setShowMentions(true);
      setMentionQuery(atMatch[1]);
      setMentionPosition(cursorPosition - atMatch[1].length - 1);
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }
  };

  // ✨ NUEVO: Manejar selección de mención
  const handleMentionSelect = (item: any) => {
    const beforeAt = inputValue.substring(0, mentionPosition);
    const afterAt = inputValue.substring(mentionPosition + 1 + mentionQuery.length);
    const newValue = `${beforeAt}@${item.title}${afterAt}`;
    
    setInputValue(newValue);
    setShowMentions(false);
    setMentionQuery('');
  };

  // ✨ NUEVO: Manejar navegación con teclado en menciones
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentions && filteredCodexItems.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex(prev => 
          prev < filteredCodexItems.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex(prev => 
          prev > 0 ? prev - 1 : filteredCodexItems.length - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleMentionSelect(filteredCodexItems[selectedMentionIndex]);
      } else if (e.key === 'Escape') {
        setShowMentions(false);
        setMentionQuery('');
      }
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRequestProjectSave = React.useCallback((item: CapturedInsight) => {
    if (!user) {
      console.warn('Debes iniciar sesión para guardar hallazgos.');
      return;
    }
    setPendingCapturedItem(item);
    setIsProjectSelectorOpen(true);
  }, [user]);

  const handleProjectSelected = React.useCallback(async (project: Project) => {
    if (!pendingCapturedItem || !session?.access_token) {
      setIsProjectSelectorOpen(false);
      return;
    }

    const itemId = pendingCapturedItem.id;
    setCapturedSaveStatus(prev => ({ ...prev, [itemId]: 'saving' }));

    try {
      const payload: Record<string, any> = {
        entity: pendingCapturedItem.entity ?? undefined,
        city: pendingCapturedItem.city ?? undefined,
        department: pendingCapturedItem.department ?? undefined,
        description: pendingCapturedItem.description || pendingCapturedItem.discovery || pendingCapturedItem.title || 'Dato detectado por Vizta',
        discovery: pendingCapturedItem.discovery || pendingCapturedItem.title || pendingCapturedItem.description || null,
        amount: pendingCapturedItem.amount ?? undefined,
        currency: pendingCapturedItem.currency ?? undefined,
        source: pendingCapturedItem.source_url ?? undefined,
        start_date: pendingCapturedItem.start_date ?? undefined,
        duration_days: pendingCapturedItem.duration_days ?? undefined,
        counter: pendingCapturedItem.counter ?? undefined
      };

      const { createCapturadoCard } = await import('../../services/capturados');
      await createCapturadoCard(project.id, payload, session.access_token);

      setCapturedSaveStatus(prev => ({ ...prev, [itemId]: 'saved' }));
      setMessages(prev => prev.map(msg => {
        if (msg.id !== pendingCapturedItem.messageId) return msg;
        const updated = msg.capturedItems?.map(ci =>
          ci.id === pendingCapturedItem.id
            ? { ...ci, savedProjectId: project.id, savedProjectTitle: project.title }
            : ci
        ) as CapturedInsight[] | undefined;
        return { ...msg, capturedItems: updated };
      }));
    } catch (saveError) {
      console.error('Error guardando en proyecto:', saveError);
      setCapturedSaveStatus(prev => ({ ...prev, [itemId]: 'error' }));
    } finally {
      setIsProjectSelectorOpen(false);
      setPendingCapturedItem(null);
    }
  }, [pendingCapturedItem, session?.access_token, setMessages]);

  const mapTermCategoryToKnowledge = React.useCallback((category?: string) => {
    switch ((category || '').toLowerCase()) {
      case 'political':
        return 'political_context';
      case 'social':
        return 'social_context';
      case 'economic':
        return 'economic_context';
      case 'cultural':
        return 'cultural_context';
      case 'technical':
        return 'technical_term';
      default:
        return 'concept_definition';
    }
  }, []);

  // Open Wiki modal prefilled from term
  const handleSaveTermToWiki = React.useCallback((term: TermInsight) => {
    if (!user) {
      console.warn('Debes iniciar sesión para crear un item de Wiki.');
      return;
    }
    setPendingTerm(term);
    setIsWikiModalOpen(true);
  }, [user]);

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

    // ✨ DEBUG: Log de codex items antes de enviar
    console.log('🔍 [VIZTA-CHAT] Enviando mensaje con contexto:', {
      message: currentInput.substring(0, 50) + '...',
      selectedCodex: selectedCodex,
      selectedCodexCount: selectedCodex.length
    });

    try {
      // Importar dinámicamente el servicio
      const { sendViztaChatQuery } = await import('../../services/viztaChat');

      // ✨ Enviar consulta al backend con el toggle de Generative UI y codex items seleccionados
      const response = await sendViztaChatQuery(currentInput, sessionId, mode, useGenerativeUI, selectedCodex);
      
      // ✨ DEBUG: Verificar respuesta
      console.log('✅ [VIZTA-CHAT] Respuesta recibida, usó codex?', response);
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

        // Extraer fuentes del contenido si están en markdown
        let extractedSources = response.sources || [];
        
        if (!extractedSources.length && (messageContent.includes('**Fuentes**') || messageContent.includes('Fuentes'))) {
          // Buscar la sección de fuentes (con o sin markdown bold)
          const sourcesRegex = /(?:^|\n)(?:\*\*)?Fuentes(?:\*\*)?[\s\n]+([\s\S]*?)(?=\n\n[A-Z]|\n\n$|$)/m;
          const sourcesMatch = messageContent.match(sourcesRegex);
          
          if (sourcesMatch) {
            const sourcesText = sourcesMatch[1].trim();
            const sourceLines = sourcesText.split('\n').filter(line => {
              const trimmed = line.trim();
              return (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) && trimmed.length > 2;
            });
            
            extractedSources = sourceLines.map(line => {
              const cleanLine = line.replace(/^[-•*]\s*/, '').trim();
              return {
                title: cleanLine,
                url: '#' // Placeholder, ya que no tenemos URL en el markdown
              };
            });
            
            // Limpiar el contenido removiendo la sección de fuentes completa
            // Buscar desde "Fuentes" hasta el final o hasta la próxima sección
            messageContent = messageContent.replace(/(?:^|\n)(?:\*\*)?Fuentes(?:\*\*)?[\s\S]*$/, '').trim();
          }
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
        
        const assistantId = (Date.now() + 1).toString();

        const capturedTabItems = Array.isArray(response.capturedItems)
          ? response.capturedItems
          : Array.isArray(response.tabs)
            ? (response.tabs.find((tab: any) => tab.type === 'captured')?.items || [])
            : [];

        const termTabItems = Array.isArray(response.termSuggestions)
          ? response.termSuggestions
          : Array.isArray(response.tabs)
            ? (response.tabs.find((tab: any) => tab.type === 'captured')?.terms || [])
            : [];

        const capturedItems = capturedTabItems
          .filter(Boolean)
          .map((item: ViztaCapturedItem, idx: number) => ({
            ...item,
            id: item.id || `vizta_captured_${assistantId}_${idx}`,
            messageId: assistantId
          }));

        const termSuggestions = termTabItems
          .filter(Boolean)
          .map((term: ViztaTermSuggestion, idx: number) => ({
            ...term,
            id: term.id || `vizta_term_${assistantId}_${idx}`,
            messageId: assistantId
          }));

        const assistantMessage: Message = {
          id: assistantId,
          content: messageContent,
          sender: "assistant",
          timestamp: new Date(messageTimestamp),
          toolUsed: toolType,
          executionTime: response.executionTime || response.metadata?.processingTime,
          tweetsAnalyzed: response.toolResult?.tweets?.length || 0,
          // Only add sources/steps if they exist in the response
          sources: extractedSources.length > 0 ? extractedSources : (response.sources || undefined),
          steps: response.steps || undefined,
          queryLogId: response.queryLogId || undefined, // For feedback
          // Generative UI fields
          c1Response: response.response && typeof response.response === 'object' && 'c1Response' in response.response
            ? response.response.c1Response
            : undefined,
          hasUIComponents: response.response && typeof response.response === 'object' && 'hasUIComponents' in response.response
            ? response.response.hasUIComponents
            : false,
          capturedItems: capturedItems.length > 0 ? capturedItems as CapturedInsight[] : undefined,
          termSuggestions: termSuggestions.length > 0 ? termSuggestions as TermInsight[] : undefined
        };

        if (capturedItems.length > 0) {
          setCapturedSaveStatus((prev) => {
            const next = { ...prev };
            capturedItems.forEach((item) => {
              if (!(item.id in next)) {
                next[item.id] = 'idle';
              }
            });
            return next;
          });
        }

        if (termSuggestions.length > 0) {
          setTermSaveStatus((prev) => {
            const next = { ...prev };
            termSuggestions.forEach((term) => {
              if (!(term.id in next)) {
                next[term.id] = 'idle';
              }
            });
            return next;
          });
        }

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
    <ThemeProvider theme={{ mode: 'dark' }}>
      <ViztaChat>
        <ViztaChatTrigger />
        <ViztaChatContent chatWidth={chatWidth} onWidthChange={setChatWidth}>
        <div className="flex flex-col space-y-4">
          {/* Mode toggle */}
          <motion.div
            className="flex flex-col gap-2 mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex items-center justify-between">
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
            </div>

            {/* Generative UI Toggle */}
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-600 font-medium">Visualización</div>
              <button
                onClick={() => setUseGenerativeUI(!useGenerativeUI)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 border',
                  useGenerativeUI
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-transparent shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                )}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                {useGenerativeUI ? 'UI Generativa' : 'Texto Simple'}
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
                  <AssistantMessage
                    key={message.id}
                    message={message}
                    onRequestProjectSave={handleRequestProjectSave}
                    onSaveTermToWiki={handleSaveTermToWiki}
                    capturedSaveStatus={capturedSaveStatus}
                    termSaveStatus={termSaveStatus}
                  />
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
                
                {/* ✨ Modal Content - CodexSelector funcional */}
                <div className="flex-1 overflow-auto p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">📚 Selecciona items del Codex</h3>
                    <p className="text-sm text-gray-600">
                      Selecciona documentos, Wiki items, o monitoreos para que Vizta los use como contexto en su respuesta.
                    </p>
                    {selectedCodex.length > 0 && (
                      <div className="mt-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                          <p className="text-sm text-blue-800 font-medium">
                            {selectedCodex.length} {selectedCodex.length === 1 ? 'item seleccionado' : 'items seleccionados'}
                          </p>
                        </div>
                        <div className="space-y-1">
                          {selectedCodex.slice(0, 3).map((itemId, index) => (
                            <div key={itemId} className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded">
                              {index + 1}. {itemId}
                            </div>
                          ))}
                          {selectedCodex.length > 3 && (
                            <div className="text-xs text-blue-600 italic">
                              +{selectedCodex.length - 3} más...
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ✨ Usar CodexSelector real */}
                  <CodexSelector 
                    selectedCodex={selectedCodex} 
                    onCodexChange={setSelectedCodex} 
                  />
                </div>
                
                {/* Modal Actions */}
                <div className="border-t px-6 py-4 flex items-center justify-between bg-gray-50">
                  <button
                    onClick={() => setSelectedCodex([])}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Limpiar selección
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsContextModalOpen(false)}
                      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        setIsContextModalOpen(false);
                        setIsContextOpen(false);
                      }}
                      className="px-6 py-2 bg-[#1e40af] text-white rounded-lg hover:bg-[#1e3a8a] transition-colors text-sm font-medium"
                    >
                      Aplicar ({selectedCodex.length})
                    </button>
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
                        {/* ✨ Codex - Abrir modal completo */}
                        <button 
                          className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 transition-colors"
                          onClick={() => {
                            setIsContextOpen(false);
                            setIsContextModalOpen(true);
                          }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <FileUp className="h-4 w-4 text-[#1e40af]" />
                            <span className="text-sm font-medium text-gray-900">📚 Codex</span>
                            {selectedCodex.length > 0 && (
                              <span className="ml-auto bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                                {selectedCodex.length}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            {selectedCodex.length > 0 
                              ? `${selectedCodex.length} items seleccionados` 
                              : 'Docs, Wiki, Monitoreos'}
                          </p>
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
                placeholder="Escribe tu consulta sobre Guatemala... (usa @ para referenciar elementos del codex)"
                value={inputValue}
                onChange={handleInputChange}
                className="h-12 w-full resize-none rounded-lg bg-white border border-gray-300 px-4 py-3 focus-visible:ring-1 focus-visible:ring-[#1e40af] focus-visible:border-[#1e40af] focus-visible:outline-none placeholder:text-gray-400 text-sm"
                onKeyDown={handleKeyDown}
              />
              
              {/* ✨ NUEVO: Dropdown de menciones @ */}
              {showMentions && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                  <div className="p-2 text-xs text-gray-500 border-b flex items-center gap-2">
                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                    <span>Elementos del Codex disponibles:</span>
                    <span className="text-blue-600 font-medium">{filteredCodexItems.length} encontrados</span>
                  </div>
                  
                  {filteredCodexItems.length > 0 ? (
                    <>
                      {filteredCodexItems.map((item, index) => (
                        <button
                          key={item.id}
                          onClick={() => handleMentionSelect(item)}
                          className={`w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-3 ${
                            index === selectedMentionIndex ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-500' : 'text-gray-700'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate flex items-center gap-2">
                              <span className="text-blue-600">@</span>
                              {item.title}
                            </div>
                            {item.content && (
                              <div className="text-xs text-gray-500 truncate mt-1">
                                {item.content.substring(0, 60)}...
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                              {item.type || 'documento'}
                            </div>
                            {index === selectedMentionIndex && (
                              <div className="text-xs text-blue-600 font-medium">
                                ← Seleccionado
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                      <div className="p-2 text-xs text-gray-400 border-t bg-gray-50">
                        <div className="flex items-center gap-4">
                          <span>↑↓ navegar</span>
                          <span>Enter seleccionar</span>
                          <span>Esc cancelar</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      <div className="text-sm">No se encontraron elementos</div>
                      <div className="text-xs mt-1">
                        {availableCodexItems.length === 0 
                          ? "No hay elementos en tu Codex. Crea algunos documentos primero."
                          : "Intenta con otro término de búsqueda"
                        }
                      </div>
                      {availableCodexItems.length === 0 && (
                        <div className="text-xs mt-2 text-blue-600">
                          💡 Ve a "Conocimiento" para crear elementos del Codex
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Send Button */}
            <Button 
              size="icon" 
              onClick={handleSend}
              disabled={isLoading || !inputValue.trim()}
              className="h-12 w-12 bg-[#1e40af] text-white hover:bg-[#1e3a8a] shadow-md hover:shadow-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Enviar mensaje</span>
            </Button>
          </div>
        </div>
        </ViztaChatContent>
        <ProjectSelectorDialog
          open={isProjectSelectorOpen}
          onClose={() => {
            setIsProjectSelectorOpen(false);
            setPendingCapturedItem(null);
          }}
          onSelect={handleProjectSelected}
          title="Selecciona un proyecto"
        />
      </ViztaChat>
      {/* Create Wiki Modal */}
      <CreateWikiModal
        open={isWikiModalOpen}
        onClose={() => { setIsWikiModalOpen(false); setPendingTerm(null); }}
        userId={user?.id || ''}
        onSuccess={() => {
          if (!pendingTerm) return;
          const termId = pendingTerm.id;
          setTermSaveStatus(prev => ({ ...prev, [termId]: 'saved' }));
          setMessages(prev => prev.map(msg => {
            if (msg.id !== pendingTerm.messageId) return msg;
            const updated = msg.termSuggestions?.map(ts =>
              ts.id === termId ? { ...ts, savedToWiki: true } : ts
            ) as TermInsight[] | undefined;
            return { ...msg, termSuggestions: updated };
          }));
          setIsWikiModalOpen(false);
          setPendingTerm(null);
        }}
        initialName={pendingTerm?.term}
        initialType={(pendingTerm?.category && ['person','organization','location','event','concept'].includes(pendingTerm.category)) ? (pendingTerm!.category as any) : 'concept'}
        initialDescription={pendingTerm?.reason || pendingTerm?.research_focus || ''}
        initialTags={pendingTerm?.category ? [pendingTerm.category, 'vizta_chat'] : ['vizta_chat']}
        initialMetadata={{ source: 'vizta_chat', confidence: pendingTerm?.confidence ?? null }}
      />
    </ThemeProvider>
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
