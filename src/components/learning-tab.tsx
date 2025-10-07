import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface LearnedItem {
  id: string;
  title: string;
  summary?: string;
  source_type: 'rss' | 'perplexity_search' | 'social_trend' | 'manual';
  source_name?: string;
  source_url?: string;
  tags?: string[];
  learned_at: string;
}

interface QueryLog {
  id: string;
  query: string;
  intent_type?: string;
  has_sources: boolean;
  sources_count: number;
  tools_used?: string[];
  created_at: string;
}

interface RssFeed {
  id: string;
  name: string;
  url: string;
  description?: string;
  active: boolean;
  items_scraped_count?: number;
  last_scraped_at?: string;
  last_scrape_success?: boolean;
  tags?: string[];
}

interface LearningTabProps {
  learnedItems: LearnedItem[];
  queryLog: QueryLog[];
  rssFeeds: RssFeed[];
  loading: boolean;
}

export function LearningTab({ learnedItems, queryLog, rssFeeds, loading }: LearningTabProps) {
  if (loading) {
    return <div className="text-center py-8 text-slate-500">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      
      {/* Query Analytics */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">📊 Analítica de Consultas</CardTitle>
          <CardDescription>
            Queries realizadas por usuarios (últimos 30 días)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {queryLog.length === 0 ? (
            <p className="text-slate-500 text-sm">No hay consultas registradas aún.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {queryLog.slice(0, 20).map((log) => (
                <div key={log.id} className="border-b border-slate-100 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{log.query}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {log.intent_type && (
                          <Badge variant="secondary" className="mr-2 text-xs">
                            {log.intent_type}
                          </Badge>
                        )}
                        {log.has_sources && (
                          <span className="mr-2">✅ {log.sources_count} fuentes</span>
                        )}
                        {log.tools_used && log.tools_used.length > 0 && (
                          <span>🔧 {log.tools_used.join(', ')}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Learned Items */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">🧠 Conocimiento Aprendido</CardTitle>
          <CardDescription>
            Items aprendidos de RSS, búsquedas y trends (últimos 50)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {learnedItems.length === 0 ? (
            <p className="text-slate-500 text-sm">No hay items aprendidos aún.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {learnedItems.map((item) => (
                <div key={item.id} className="border-b border-slate-100 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.title}</div>
                      {item.summary && (
                        <div className="text-xs text-slate-600 mt-1 line-clamp-2">
                          {item.summary}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {item.source_type === 'rss' && '📰 RSS'}
                          {item.source_type === 'perplexity_search' && '🔍 Búsqueda'}
                          {item.source_type === 'social_trend' && '📊 Trend'}
                          {item.source_type === 'manual' && '✏️ Manual'}
                        </Badge>
                        {item.source_name && (
                          <span className="text-xs text-slate-500">{item.source_name}</span>
                        )}
                        {item.source_url && (
                          <a 
                            href={item.source_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            🔗 Ver fuente
                          </a>
                        )}
                      </div>
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.tags.map((tag, idx) => (
                            <span key={idx} className="text-xs bg-slate-100 px-2 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 whitespace-nowrap">
                      {new Date(item.learned_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* RSS Feeds Management */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">📡 RSS Feeds</CardTitle>
          <CardDescription>
            Fuentes RSS configuradas para curación automática
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rssFeeds.length === 0 ? (
            <p className="text-slate-500 text-sm">No hay RSS feeds configurados aún.</p>
          ) : (
            <div className="space-y-3">
              {rssFeeds.map((feed) => (
                <div key={feed.id} className="border-b border-slate-100 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{feed.name}</div>
                      <div className="text-xs text-slate-500 mt-1">{feed.url}</div>
                      {feed.description && (
                        <div className="text-xs text-slate-600 mt-1">{feed.description}</div>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        {feed.active ? (
                          <span className="text-green-600">✅ Activo</span>
                        ) : (
                          <span className="text-slate-400">⏸️ Pausado</span>
                        )}
                        <span className="text-slate-500">
                          Items: {feed.items_scraped_count || 0}
                        </span>
                        {feed.last_scraped_at && (
                          <span className="text-slate-500">
                            Última scrape: {new Date(feed.last_scraped_at).toLocaleString()}
                          </span>
                        )}
                        {feed.last_scrape_success === false && (
                          <span className="text-red-600">⚠️ Error en última scrape</span>
                        )}
                      </div>
                      {feed.tags && feed.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {feed.tags.map((tag, idx) => (
                            <span key={idx} className="text-xs bg-slate-100 px-2 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}

