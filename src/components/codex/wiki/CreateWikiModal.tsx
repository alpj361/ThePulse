import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, Building2, MapPin, Calendar, Lightbulb, X, Plus } from 'lucide-react';
import { createWikiItem, type WikiItemCreate } from '@/services/wikiService';
import { Slider } from '@/components/ui/slider';

interface CreateWikiModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onSuccess?: () => void;
  // Prefill options
  initialName?: string;
  initialType?: 'person' | 'organization' | 'location' | 'event' | 'concept';
  initialDescription?: string;
  initialTags?: string[];
  initialMetadata?: Record<string, any>;
}

type WikiType = 'person' | 'organization' | 'location' | 'event' | 'concept';

const CreateWikiModal: React.FC<CreateWikiModalProps> = ({
  open,
  onClose,
  userId,
  onSuccess,
  initialName,
  initialType,
  initialDescription,
  initialTags,
  initialMetadata
}) => {
  const [selectedType, setSelectedType] = useState<WikiType>(initialType || 'person');
  const [name, setName] = useState(initialName || '');
  const [description, setDescription] = useState(initialDescription || '');
  const [relevance, setRelevance] = useState(50);
  const [tags, setTags] = useState<string[]>(initialTags || []);
  const [tagInput, setTagInput] = useState('');
  const [metadata, setMetadata] = useState<Record<string, any>>(initialMetadata || {});
  const [saving, setSaving] = useState(false);

  const types = [
    { id: 'person' as WikiType, label: 'Persona', icon: User, color: 'bg-blue-600' },
    { id: 'organization' as WikiType, label: 'Organización', icon: Building2, color: 'bg-green-600' },
    { id: 'location' as WikiType, label: 'Lugar', icon: MapPin, color: 'bg-red-600' },
    { id: 'event' as WikiType, label: 'Evento', icon: Calendar, color: 'bg-orange-600' },
    { id: 'concept' as WikiType, label: 'Concepto', icon: Lightbulb, color: 'bg-purple-600' },
  ];

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  // Reset/prefill state when modal opens
  React.useEffect(() => {
    if (open) {
      setSelectedType(initialType || 'person');
      setName(initialName || '');
      setDescription(initialDescription || '');
      setTags(initialTags || []);
      setMetadata(initialMetadata || {});
      setRelevance(50);
      setTagInput('');
    }
  }, [open, initialName, initialType, initialDescription, initialTags, initialMetadata]);

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleMetadataChange = (key: string, value: any) => {
    setMetadata({ ...metadata, [key]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('El nombre es requerido');
      return;
    }

    setSaving(true);
    try {
      const itemData: WikiItemCreate = {
        user_id: userId,
        subcategory: selectedType,
        name: name.trim(),
        description: description.trim() || undefined,
        relevance_score: relevance,
        metadata: metadata,
        tags: tags,
      };

      const result = await createWikiItem(itemData);

      if (result) {
        // Reset form
        setName('');
        setDescription('');
        setRelevance(50);
        setTags([]);
        setMetadata({});
        setSelectedType('person');

        onSuccess?.();
        onClose();
      } else {
        alert('Error al crear el item');
      }
    } catch (error) {
      console.error('Error creating wiki item:', error);
      alert('Error al crear el item');
    } finally {
      setSaving(false);
    }
  };

  const renderSpecificFields = () => {
    switch (selectedType) {
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Item de Wiki</DialogTitle>
          <DialogDescription>
            Agrega una nueva entidad a tu Wiki personal
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type Selector */}
          <div className="space-y-3">
            <Label>Tipo de Item</Label>
            <div className="flex flex-wrap gap-2">
              {types.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedType(type.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${isSelected
                        ? `${type.color} text-white border-transparent`
                        : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                      }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{type.label}</span>
                  </button>
                );
              })}
            </div>
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
              {saving ? 'Creando...' : 'Crear Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateWikiModal;
