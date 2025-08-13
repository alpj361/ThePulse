import React from 'react';
import { getLinksForParentItem } from '../../services/supabase.ts';

function hasAnyTranscription(child: any): boolean {
  return Boolean(child?.audio_transcription || child?.transcripcion);
}

function mediaIcon(child: any): string {
  const url: string = (child?.source_url || '').toLowerCase();
  if (/(\.mp4|\.mov|\.avi|\.mkv|\.webm|\.m4v)$/.test(url) || /twitter\.com\/.+\/status\//.test(url) || /x\.com\/.+\/status\//.test(url)) return '🎥';
  if (/(\.jpg|\.jpeg|\.png|\.gif|\.webp)$/.test(url)) return '🖼️';
  return hasAnyTranscription(child) ? '🎥' : '🔗';
}

interface AsyncLinksListProps { parentId: string; onShowTranscription?: (child: any) => void }

const AsyncLinksList: React.FC<AsyncLinksListProps> = ({ parentId, onShowTranscription }) => {
  const [links, setLinks] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await getLinksForParentItem(parentId);
        if (!cancelled) setLinks(rows || []);
      } catch (e) {
        console.error('Error cargando enlaces del item', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true };
  }, [parentId]);

  if (loading) return <div className="text-xs text-slate-400">Cargando enlaces…</div>;
  if (!links || links.length === 0) return <div className="text-xs text-slate-400">Sin enlaces</div>;

  return (
    <div className="space-y-1 max-h-32 overflow-auto">
      {links.map((ln: any) => {
        const child = ln.child;
        const icon = mediaIcon(child);
        const canShowTx = hasAnyTranscription(child);
        return (
          <div key={ln.id} className="flex items-center gap-2 text-sm">
            <span title={icon === '🎥' ? 'Video' : icon === '🖼️' ? 'Imagen' : 'Enlace'}>{icon}</span>
            <a href={child?.source_url} target="_blank" rel="noreferrer" className="text-blue-600 underline truncate">
              {child?.source_url || '(sin url)'}
            </a>
            {canShowTx && (
              <button
                className="ml-auto text-xs text-slate-600 hover:text-slate-900 underline"
                onClick={() => onShowTranscription && onShowTranscription(child)}
              >
                Ver transcripción
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AsyncLinksList;