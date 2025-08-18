import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdmin } from '../hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/Badge';
import { EXTRACTORW_API_URL } from '../services/api';

function KnowledgeSearchWidget() {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input placeholder="Buscar en knowledge..." value={q} onChange={(e) => setQ(e.target.value)} />
        <Button disabled={loading || !q.trim()} onClick={async () => {
          setLoading(true);
          try {
            const { supabase } = await import('../services/supabase');
            const t = (await supabase.auth.getSession()).data.session?.access_token;
            const res = await fetch(`${EXTRACTORW_API_URL}/knowledge/search`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }, body: JSON.stringify({ query: q, top_k: 8 }) });
            const data = await res.json();
            setResults(data.results || []);
          } catch (e) {
            setResults([{ error: (e as Error).message }]);
          } finally {
            setLoading(false);
          }
        }}>Buscar</Button>
      </div>
      <div className="space-y-2">
        {loading && <div className="text-sm text-slate-500">Buscando...</div>}
        {!loading && results.map((r, i) => (
          <div key={i} className="p-2 border rounded">
            <div className="text-xs text-slate-500">doc: {r.document_id} • chunk #{r.chunk_index} • score: {r.score?.toFixed?.(3) ?? '-'}</div>
            <div className="text-sm mt-1 whitespace-pre-wrap">{r.content?.slice?.(0, 400) || JSON.stringify(r)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function KnowledgeDocumentsList({ refreshKey }: { refreshKey?: any }) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState('');
  React.useEffect(() => { void fetchDocs(); }, [refreshKey]);
  async function fetchDocs() {
    setLoading(true);
    try {
      const { supabase } = await import('../services/supabase');
      const t = (await supabase.auth.getSession()).data.session?.access_token;
      const url = new URL(`${EXTRACTORW_API_URL}/knowledge/documents`);
      if (q) url.searchParams.set('q', q);
      const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${t}` } });
      const data = await res.json();
      setItems(data.documents || []);
    } catch (e) {
      setItems([{ error: (e as Error).message }]);
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input placeholder="Filtrar por título..." value={q} onChange={(e) => setQ(e.target.value)} />
        <Button variant="outline" onClick={fetchDocs} disabled={loading}>Actualizar</Button>
      </div>
      {loading && <div className="text-sm text-slate-500">Cargando...</div>}
      {!loading && items.length === 0 && (
        <div className="text-sm text-slate-500">No hay documentos</div>
      )}
      <div className="space-y-2 max-h-80 overflow-auto">
        {items.map((d, i) => (
          <div key={i} className="p-2 border rounded">
            <div className="text-sm font-medium">{d.title || d.id}</div>
            <div className="text-xs text-slate-500 flex gap-2 flex-wrap">
              <span>{(() => { try { const iso = typeof d.created_at === 'string' ? d.created_at.replace(' ', 'T') : d.created_at; return new Date(iso).toLocaleString(); } catch { return '—'; } })()}</span>
              <span>{d.mimetype || '—'}</span>
              <span>Páginas: {typeof d.pages === 'number' ? d.pages : '—'}</span>
              <span>Estado: {d.status || '—'}</span>
              {Array.isArray(d.tags) && d.tags.length > 0 && (
                <span>Tags: {d.tags.join(', ')}</span>
              )}
            </div>
            {d.source_url && (
              <div className="text-xs text-blue-600 truncate"><a href={d.source_url} target="_blank" rel="noreferrer">{d.source_url}</a></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Knowledge() {
  const { isAdmin, loading } = useAdmin();
  const [files, setFiles] = useState<FileList | null>(null);
  const [tags, setTags] = useState('');
  const [title, setTitle] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [lastUpload, setLastUpload] = useState<any>(null);

  if (!loading && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Estructura</h1>
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
              <TabsTrigger value="entrenamiento">Entrenamiento</TabsTrigger>
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
                    <Input type="file" multiple className="cursor-pointer" onChange={(e) => setFiles(e.target.files)} />
                    <Input placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
                    <Input placeholder="Proyecto (opcional)" />
                    <Input placeholder="Etiquetas separadas por coma" value={tags} onChange={(e) => setTags(e.target.value)} />
                    <Input placeholder="Fuente URL (opcional)" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} />
                    <Textarea placeholder="Descripción breve" />
                    <div className="flex gap-2">
                      <Button className="bg-blue-600 text-white" disabled={uploading || !files || files.length === 0} onClick={async () => {
                        if (!files || files.length === 0) return;
                        setUploading(true);
                        try {
                          const token = (await import('../services/supabase')).supabase.auth.getSession().then(r => r.data.session?.access_token);
                          const t = await token;
                          const form = new FormData();
                          form.append('file', files[0]);
                          if (tags) form.append('tags', tags);
                          if (title) form.append('title', title);
                          if (sourceUrl) form.append('source_url', sourceUrl);
                          const { EXTRACTORW_API_URL } = await import('../services/api');
                          const res = await fetch(`${EXTRACTORW_API_URL}/knowledge/upload`, { method: 'POST', headers: { Authorization: `Bearer ${t}` }, body: form });
                          const data = await res.json();
                          setLastUpload(data);
                        } catch (e) {
                          setLastUpload({ error: (e as Error).message });
                        } finally {
                          setUploading(false);
                        }
                      }}>
                        {uploading ? 'Subiendo...' : 'Subir'}
                      </Button>
                      {lastUpload && (
                        <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600">
                          {lastUpload.success ? `OK: ${lastUpload.chunks} chunks` : `Error: ${lastUpload.error || 'al procesar'}`}
                        </Badge>
                      )}
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

                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-lg">Búsqueda en Knowledge</CardTitle>
                    <CardDescription>Consulta los documentos cargados (vector + lexical fallback).</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <KnowledgeSearchWidget />
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-lg">Mis documentos subidos</CardTitle>
                    <CardDescription>Lista de los últimos documentos en PublicKnowledge.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <KnowledgeDocumentsList refreshKey={lastUpload?.document_id || lastUpload?.success || Math.random()} />
                  </CardContent>
                </Card>
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

            {/* Entrenamiento: UI placeholder para futura estructura de IA */}
            <TabsContent value="entrenamiento" className="space-y-4">
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">Entrenamiento de IA (próximamente)</CardTitle>
                  <CardDescription>
                    Aquí podrás gestionar prompts, conjuntos de datos y sesiones de entrenamiento con archivos.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-slate-600">
                    Esta sección se habilitará con:
                    <ul className="list-disc ml-5 mt-2 space-y-1">
                      <li>Gestión de prompts y plantillas</li>
                      <li>Entrenamiento con archivos (PDF, CSV, DOCX)</li>
                      <li>Versionado de datasets y evaluaciones</li>
                      <li>Panel de métricas y validaciones</li>
                    </ul>
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

