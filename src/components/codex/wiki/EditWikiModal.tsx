import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { updateWikiItem, type WikiItem } from '@/services/wikiService';
import { Slider } from '@/components/ui/slider';

interface EditWikiModalProps {
  open: boolean;
  onClose: () => void;
  item: WikiItem | null;
  onSuccess?: () => void;
}

const EditWikiModal: React.FC<EditWikiModalProps> = ({ open, onClose, item, onSuccess }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [relevance, setRelevance] = useState(50);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  // Load item data when modal opens
  useEffect(() => {
    if (item && open) {
      setName(item.name);
      setDescription(item.description || '');
      setRelevance(item.relevance_score);
      setTags(item.tags || []);
      setMetadata(item.metadata || {});
    }
  }, [item, open]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleMetadataChange = (key: string, value: any) => {
    setMetadata({ ...metadata, [key]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!item || !name.trim()) {
      return;
    }

    setSaving(true);
    try {
      const updates = {
        name: name.trim(),
        description: description.trim() || undefined,
        relevance_score: relevance,
        metadata: metadata,
        tags: tags,
      };

      const result = await updateWikiItem(item.id, updates);

      if (result) {
        onSuccess?.();
        onClose();
      } else {
        alert('Error al actualizar el item');
      }
    } catch (error) {
      console.error('Error updating wiki item:', error);
      alert('Error al actualizar el item');
    } finally {
      setSaving(false);
    }
  };

  const renderSpecificFields = () => {
    if (!item) return null;

    switch (item.subcategory) {
      case 'person':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="full_name">Nombre Completo</Label>
              <Input
                id="full_name"
                value={metadata.full_name || ''}
                onChange={(e) => handleMetadataChange('full_name', e.target.value)}
                placeholder="Nombre completo de la persona"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="position">Cargo</Label>
                <Input
                  id="position"
                  value={metadata.position || ''}
                  onChange={(e) => handleMetadataChange('position', e.target.value)}
                  placeholder="Ej: Presidente"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="party">Partido Político</Label>
                <Input
                  id="party"
                  value={metadata.political_party || ''}
                  onChange={(e) => handleMetadataChange('political_party', e.target.value)}
                  placeholder="Ej: Movimiento Semilla"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter/X</Label>
              <Input
                id="twitter"
                value={metadata.twitter_handle || ''}
                onChange={(e) => handleMetadataChange('twitter_handle', e.target.value)}
                placeholder="@usuario"
              />
            </div>
          </>
        );

      case 'organization':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="org_type">Tipo de Organización</Label>
              <Input
                id="org_type"
                value={metadata.type || ''}
                onChange={(e) => handleMetadataChange('type', e.target.value)}
                placeholder="Ej: Partido político, ONG, Empresa"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Sitio Web</Label>
              <Input
                id="website"
                value={metadata.website || ''}
                onChange={(e) => handleMetadataChange('website', e.target.value)}
                placeholder="https://..."
                type="url"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org_location">Ubicación</Label>
              <Input
                id="org_location"
                value={metadata.location || ''}
                onChange={(e) => handleMetadataChange('location', e.target.value)}
                placeholder="Ciudad, País"
              />
            </div>
          </>
        );

      case 'location':
        return (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="country">País</Label>
                <Input
                  id="country"
                  value={metadata.country || ''}
                  onChange={(e) => handleMetadataChange('country', e.target.value)}
                  placeholder="Ej: Guatemala"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">Región</Label>
                <Input
                  id="region"
                  value={metadata.region || ''}
                  onChange={(e) => handleMetadataChange('region', e.target.value)}
                  placeholder="Ej: Centroamérica"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="coordinates">Coordenadas (opcional)</Label>
              <Input
                id="coordinates"
                value={metadata.coordinates || ''}
                onChange={(e) => handleMetadataChange('coordinates', e.target.value)}
                placeholder="14.6349, -90.5069"
              />
            </div>
          </>
        );

      case 'event':
        return (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="start_date">Fecha de Inicio</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={metadata.start_date || ''}
                  onChange={(e) => handleMetadataChange('start_date', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">Fecha de Fin (opcional)</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={metadata.end_date || ''}
                  onChange={(e) => handleMetadataChange('end_date', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="event_location">Lugar</Label>
              <Input
                id="event_location"
                value={metadata.location || ''}
                onChange={(e) => handleMetadataChange('location', e.target.value)}
                placeholder="Lugar donde ocurrió"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <select
                id="status"
                value={metadata.status || 'Programado'}
                onChange={(e) => handleMetadataChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              >
                <option value="Programado">Programado</option>
                <option value="En curso">En curso</option>
                <option value="Finalizado">Finalizado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>
          </>
        );

      case 'concept':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="definition">Definición</Label>
              <Textarea
                id="definition"
                value={metadata.definition || ''}
                onChange={(e) => handleMetadataChange('definition', e.target.value)}
                placeholder="Define el concepto..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="context">Contexto</Label>
              <Textarea
                id="context"
                value={metadata.context || ''}
                onChange={(e) => handleMetadataChange('context', e.target.value)}
                placeholder="Contexto en el que se usa..."
                rows={2}
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  if (!item) return null;

  const typeLabels = {
    person: 'Persona',
    organization: 'Organización',
    location: 'Lugar',
    event: 'Evento',
    concept: 'Concepto',
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar {typeLabels[item.subcategory]}</DialogTitle>
          <DialogDescription>
            Modifica la información de este item
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type Badge (read-only) */}
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Badge variant="secondary" className="text-sm">
              {typeLabels[item.subcategory]}
            </Badge>
          </div>

          {/* Common Fields */}
          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del item"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción breve..."
              rows={12}
            />
          </div>

          {/* Specific Fields */}
          {renderSpecificFields()}

          {/* Relevance */}
          <div className="space-y-3">
            <Label>Relevancia: {relevance}/100</Label>
            <Slider
              value={[relevance]}
              onValueChange={(value) => setRelevance(value[0])}
              max={100}
              min={0}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>Baja</span>
              <span>Media</span>
              <span>Alta</span>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Etiquetas</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Agregar etiqueta..."
              />
              <Button type="button" onClick={handleAddTag} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditWikiModal;
