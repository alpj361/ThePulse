import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdmin } from '../hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { getPublicKnowledgeDocuments, PublicKnowledgeDocument } from '../services/supabase.ts';
import { Card as UICard } from '@/components/ui/card';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import Folder from 'lucide-react/dist/esm/icons/folder';

export default function Knowledge() {
  const { isAdmin, loading } = useAdmin();
  const { user } = useAuth();
  const [docs, setDocs] = useState<PublicKnowledgeDocument[]>([]);
  const [fetching, setFetching] = useState(false);

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
              <TabsTrigger value="monitoreos">Monitoreos Universales</TabsTrigger>
            </TabsList>

            {/* Base: mini codex para conocimiento público */}
            <TabsContent value="base" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-lg">Subir archivo</CardTitle>
                    <CardDescription>PDFs, documentos e información pública que Vizta podrá referenciar.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Input type="file" multiple className="cursor-pointer" />
                    <Input placeholder="Título" />
                    <Input placeholder="Proyecto (opcional)" />
                    <Input placeholder="Etiquetas separadas por coma" />
                    <Textarea placeholder="Descripción breve" />
                    <div className="flex gap-2">
                      <Button className="bg-blue-600 text-white" disabled>
                        Subir (próximamente)
                      </Button>
                      <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600">
                        UI lista, funcionalidad pendiente
                      </Badge>
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

            {/* Monitoreos Universales: solo botón inhabilitado */}
            <TabsContent value="monitoreos" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Programación de monitoreos</h3>
                  <p className="text-slate-600">Define crons globales de extracción de tweets.</p>
                </div>
                <Button variant="outline" className="text-slate-500" disabled>
                  Agregar (próximamente)
                </Button>
              </div>
              <Card className="border-dashed">
                <CardContent className="py-10 text-center text-slate-500">
                  No hay monitoreos universales configurados todavía.
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

