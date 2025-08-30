import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdmin } from '../hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { getPublicKnowledgeDocuments, PublicKnowledgeDocument, uploadPublicKnowledgeDocument } from '../services/supabase.ts';
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

  // Explorer state
  const [targetUrl, setTargetUrl] = useState('');
  const [goal, setGoal] = useState('Explorar la página y describir navegación principal');
  const [exploring, setExploring] = useState(false);
  const [summary, setSummary] = useState<string>('');

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

            {/* Monitoreos Universales: Explorer WebAgent */}
            <TabsContent value="monitoreos" className="space-y-4">
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">Explorer</CardTitle>
                  <CardDescription>Explora una URL con IA y muestra navegación y subcategorías.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    <Input placeholder="https://ejemplo.com" value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} />
                    <Input placeholder='Objetivo (p. ej. Necesito buscar "iniciativas")' value={goal} onChange={(e) => setGoal(e.target.value)} />
                    <Button className="bg-blue-600 text-white" disabled={exploring || !targetUrl}
                      onClick={async () => {
                        setExploring(true);
                        setSummary('');
                        try {
                          // Usar URL normalizada del backend (incluye /api)
                          const res = await fetch(`${EXTRACTORW_API_URL}/webagent/explore`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ url: targetUrl, goal, maxSteps: 4, screenshot: false })
                          });
                          const json = await res.json();
                          
                          // Manejar respuesta del nuevo formato del endpoint
                          if (json?.success && json?.data?.summary) {
                            setSummary(json.data.summary);
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
                      }}>
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
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

