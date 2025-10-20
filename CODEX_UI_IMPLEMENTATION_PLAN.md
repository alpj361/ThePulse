# 🎨 Plan de Implementación UI: Codex Reestructurado con Wiki

## 📋 Resumen Ejecutivo

### Estado Actual
- ✅ Base de datos migrada (58 items categorizados)
- ✅ Backend completamente funcional (9 endpoints Wiki + 2 Activity)
- ⏳ Frontend por implementar

### Objetivo
Implementar UI completa en ThePulse para:
1. Visualizar items por categoría (General, Monitoring, Wiki)
2. Crear/editar/eliminar Wiki items
3. Sistema de relaciones entre entidades
4. Vista de grafo/red de conexiones
5. Integración con RecentActivity

---

## 📂 Estructura de Archivos a Crear

```
ThePulse/src/
├── pages/
│   └── EnhancedCodex.tsx (MODIFICAR - agregar filtros y secciones)
│
├── components/
│   ├── codex/
│   │   ├── CategoryFilters.tsx         ← NUEVO: Filtros de categoría
│   │   ├── SubcategoryChips.tsx        ← NUEVO: Chips de subcategoría
│   │   │
│   │   ├── general/
│   │   │   ├── DocumentCard.tsx        ← NUEVO: Card para documentos
│   │   │   ├── AudioCard.tsx           ← NUEVO: Card para audios
│   │   │   ├── VideoCard.tsx           ← NUEVO: Card para videos
│   │   │   └── SpreadsheetCard.tsx     ← NUEVO: Card para spreadsheets
│   │   │
│   │   ├── monitoring/
│   │   │   ├── BookmarkCard.tsx        ← NUEVO: Card para posts guardados
│   │   │   ├── ActivityCard.tsx        ← NUEVO: Card para actividad
│   │   │   └── InternalSpreadsheetCard.tsx ← NUEVO
│   │   │
│   │   └── wiki/
│   │       ├── WikiSection.tsx         ← NUEVO: Sección principal Wiki
│   │       ├── WikiItemCard.tsx        ← NUEVO: Card dinámico por tipo
│   │       ├── PersonCard.tsx          ← NUEVO: Card para personas
│   │       ├── OrganizationCard.tsx    ← NUEVO: Card para organizaciones
│   │       ├── LocationCard.tsx        ← NUEVO: Card para lugares
│   │       ├── EventCard.tsx           ← NUEVO: Card para eventos
│   │       ├── ConceptCard.tsx         ← NUEVO: Card para conceptos
│   │       ├── CreateWikiModal.tsx     ← NUEVO: Modal de creación
│   │       ├── EditWikiModal.tsx       ← NUEVO: Modal de edición
│   │       ├── WikiRelationsView.tsx   ← NUEVO: Vista de relaciones
│   │       ├── WikiGraphView.tsx       ← NUEVO: Vista de grafo
│   │       └── WikiStatsPanel.tsx      ← NUEVO: Panel de estadísticas
│   │
│   └── ui/
│       └── SaveActivityButton.tsx      ← NUEVO: Botón en RecentActivity
│
└── services/
    └── wikiService.ts                  ← NUEVO: Servicio para API de Wiki
```

---

## 🎨 Diseño UI/UX

### 1. EnhancedCodex.tsx - Vista Principal

```tsx
┌─────────────────────────────────────────────────────────────────┐
│  🗂️ Codex Mejorado                                  [@usuario]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Filtros principales:                                            │
│  ┌────────┐ ┌──────────┐ ┌──────────────┐ ┌──────────┐        │
│  │ Todos  │ │ 📁 General│ │ 📊 Monitoreos │ │ 📚 Wiki  │        │
│  └────────┘ └──────────┘ └──────────────┘ └──────────┘        │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 🔍 Buscar en Codex...                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Subfiltros (cuando Wiki está seleccionado):                    │
│  [👤 Personas] [🏢 Orgs] [📍 Lugares] [📅 Eventos] [💡 Conceptos]│
│                                                                  │
│  ┌─────────────────────┐  [+ Crear nuevo item de Wiki]         │
│  │ 📊 Estadísticas     │                                        │
│  ├─────────────────────┤                                        │
│  │ Total: 42 items     │                                        │
│  │ Personas: 15        │                                        │
│  │ Organizaciones: 12  │                                        │
│  │ Lugares: 5          │                                        │
│  │ Eventos: 7          │                                        │
│  │ Conceptos: 3        │                                        │
│  │ Relevancia media: 65│                                        │
│  └─────────────────────┘                                        │
│                                                                  │
│  ┌─────────────────────────────────────────────────────┐       │
│  │ Grid de Cards (responsive)                          │       │
│  │                                                      │       │
│  │ [Card 1]  [Card 2]  [Card 3]                        │       │
│  │ [Card 4]  [Card 5]  [Card 6]                        │       │
│  │ ...                                                  │       │
│  └─────────────────────────────────────────────────────┘       │
│                                                                  │
│  [Cargar más...] [Vista de Grafo 🗺️]                          │
└─────────────────────────────────────────────────────────────────┘
```

---

### 2. PersonCard.tsx - Card de Persona

```tsx
┌─────────────────────────────────────────────────┐
│  ┌────┐                                         │
│  │ 👤 │  Bernardo Arévalo              ⭐95/100 │
│  └────┘  Presidente de Guatemala               │
│          🏛️ Movimiento Semilla                 │
│                                                 │
│  ─────────────────────────────────────────────  │
│                                                 │
│  📝 Presidente de Guatemala desde 2024.        │
│     Fundador de Movimiento Semilla.             │
│                                                 │
│  🐦 @BArevalodeLeon  📘 Facebook               │
│                                                 │
│  🔗 Relacionado con:                            │
│  • Movimiento Semilla (org)                     │
│  • Elecciones 2023 (evento)                     │
│  • 3 más...                                     │
│                                                 │
│  📊 Monitoreos vinculados:                      │
│  • 45 posts guardados                           │
│  • 8 análisis de actividad                      │
│                                                 │
│  [Ver perfil completo] [Ver posts] [Editar]     │
└─────────────────────────────────────────────────┘
```

---

### 3. OrganizationCard.tsx - Card de Organización

```tsx
┌─────────────────────────────────────────────────┐
│  ┌────┐                                         │
│  │ 🏢 │  Movimiento Semilla            ⭐90/100 │
│  └────┘  Partido Político                      │
│                                                 │
│  📅 Fundado: 2014  📍 Ciudad de Guatemala      │
│  ─────────────────────────────────────────────  │
│                                                 │
│  📝 Partido político guatemalteco fundado      │
│     en 2014. Enfocado en transparencia y       │
│     combate a la corrupción.                    │
│                                                 │
│  👥 Personas clave:                             │
│  • Bernardo Arévalo (Presidente)                │
│  • Samuel Pérez Álvarez (Diputado)              │
│  • 5 más...                                     │
│                                                 │
│  📊 Logros:                                     │
│  • Victoria electoral 2023                      │
│  • Mayor partido opositor                       │
│                                                 │
│  🔗 Relacionado con:                            │
│  • Bernardo Arévalo (persona)                   │
│  • Elecciones 2023 (evento)                     │
│                                                 │
│  [Ver detalles] [Ver actividad] [Editar]        │
└─────────────────────────────────────────────────┘
```

---

### 4. EventCard.tsx - Card de Evento

```tsx
┌─────────────────────────────────────────────────┐
│  ┌────┐                                         │
│  │ 📅 │  Caso Hogar Seguro             ⭐85/100 │
│  └────┘  Caso Judicial                         │
│                                                 │
│  📍 08 Mar 2017 → En curso  🚨 Impacto: Alto   │
│  ─────────────────────────────────────────────  │
│                                                 │
│  📝 Caso judicial por la muerte de 41 niñas    │
│     en incendio en albergue estatal.            │
│                                                 │
│  👥 Participantes:                              │
│  • Víctimas (41 niñas)                          │
│  • Estado de Guatemala                          │
│  • Ministerio Público                           │
│  • Familiares de víctimas                       │
│                                                 │
│  📅 Timeline:                                   │
│  ├─ 08/03/2017: Incendio en Hogar Seguro       │
│  ├─ 15/01/2023: Sentencia inicial               │
│  └─ En curso: Proceso judicial                  │
│                                                 │
│  📰 Cobertura:                                  │
│  • 28 posts guardados                           │
│  • 4 análisis de actividad                      │
│                                                 │
│  [Ver timeline completo] [Ver cobertura] [Editar]│
└─────────────────────────────────────────────────┘
```

---

### 5. CreateWikiModal.tsx - Modal de Creación

```tsx
┌─────────────────────────────────────────────────────────┐
│  Crear Item de Wiki                              [✕]    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Tipo de item:                                           │
│  ┌────────┐ ┌──────┐ ┌────────┐ ┌────────┐ ┌─────────┐│
│  │👤 Persona│🏢 Org │📍 Lugar │📅 Evento │💡 Concepto││
│  └────────┘ └──────┘ └────────┘ └────────┘ └─────────┘│
│     (✓)                                                  │
│                                                          │
│  Información básica:                                     │
│  ┌────────────────────────────────────────────────────┐│
│  │ Nombre: [Bernardo Arévalo                      ]  ││
│  └────────────────────────────────────────────────────┘│
│                                                          │
│  ┌────────────────────────────────────────────────────┐│
│  │ Descripción:                                       ││
│  │ [Presidente de Guatemala desde 2024.              ││
│  │  Fundador de Movimiento Semilla...]               ││
│  └────────────────────────────────────────────────────┘│
│                                                          │
│  Campos específicos (Persona):                           │
│  ┌──────────────────────┐  ┌────────────────────────┐  │
│  │ Nombre completo:     │  │ Cargo:                 │  │
│  │ [Bernardo Arévalo    │  │ [Presidente de        │  │
│  │  de León          ]  │  │  Guatemala         ]  │  │
│  └──────────────────────┘  └────────────────────────┘  │
│                                                          │
│  ┌──────────────────────┐  ┌────────────────────────┐  │
│  │ Partido político:    │  │ Twitter:               │  │
│  │ [Movimiento Semilla] │  │ [@BArevalodeLeon   ]  │  │
│  └──────────────────────┘  └────────────────────────┘  │
│                                                          │
│  Relevancia: [████████░░] 85/100                        │
│                                                          │
│  Etiquetas:                                              │
│  [#política] [#presidente] [#semilla] [+ Agregar]        │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ [Cancelar]                      [Crear Item] ✓  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

### 6. WikiGraphView.tsx - Vista de Grafo

```tsx
┌─────────────────────────────────────────────────────────┐
│  🗺️ Vista de Red - Wiki                          [✕]    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Filtros:  [Mostrar todos] [Solo alta relevancia]       │
│            [👤 Personas] [🏢 Organizaciones]             │
│                                                          │
│  ┌────────────────────────────────────────────────────┐│
│  │                                                    ││
│  │         Bernardo Arévalo (95)                     ││
│  │               ●                                    ││
│  │              /│\                                   ││
│  │             / | \                                  ││
│  │            /  |  \                                 ││
│  │           /   |   \                                ││
│  │          ●    ●    ●                               ││
│  │      Semilla Elec. Porras                         ││
│  │       (90)  2023  (70)                            ││
│  │         |    (85)   |                              ││
│  │         |     |     |                              ││
│  │         ●     ●     ●                               ││
│  │      Pérez   MP   Caso                            ││
│  │       (75)  (80)  Hogar                           ││
│  │                   (85)                             ││
│  │                                                    ││
│  │  Nodos más grandes = Mayor relevancia             ││
│  │  Click en nodo = Ver detalles                     ││
│  └────────────────────────────────────────────────────┘│
│                                                          │
│  Leyenda:                                                │
│  ● Persona  ■ Organización  ▲ Evento  ◆ Concepto       │
│                                                          │
│  [Vista Lista] [Exportar grafo] [Zoom +/-]              │
└─────────────────────────────────────────────────────────┘
```

---

### 7. RecentActivity.tsx - Integración

```tsx
┌─────────────────────────────────────────────────────────┐
│  📊 Actividad Reciente                                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Scrapes Recientes:                                      │
│                                                          │
│  ┌────────────────────────────────────────────────────┐│
│  │ 📊 Scrape: #argentina                              ││
│  │ • 45 tweets encontrados                            ││
│  │ • Sentimiento: 😊 Positivo (60%)                   ││
│  │ • Herramienta: nitter_context                      ││
│  │ • Fecha: 20 Enero 2025                             ││
│  │                                                     ││
│  │ [Ver resultados] [💾 Guardar a Codex] ← NUEVO      ││
│  │                                                     ││
│  │ ┌─────────────────────────────────────────────┐   ││
│  │ │ ✨ Entidades detectadas:                    │   ││
│  │ │ • @BArevalodeLeon (persona)                 │   ││
│  │ │ • Movimiento Semilla (organización)         │   ││
│  │ │                                              │   ││
│  │ │ [Crear perfiles en Wiki]                    │   ││
│  │ └─────────────────────────────────────────────┘   ││
│  └────────────────────────────────────────────────────┘│
│                                                          │
│  Al hacer click en "Guardar a Codex":                   │
│  1. Guarda actividad en category: 'monitoring'          │
│  2. Detecta entidades mencionadas                       │
│  3. Sugiere crear Wiki items si no existen              │
│  4. Auto-vincula con Wiki items existentes              │
│  5. Incrementa relevance_score de entidades             │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ Implementación Técnica

### 1. CategoryFilters.tsx

```tsx
import React from 'react';
import { Box, Chip } from '@mui/material';

interface CategoryFiltersProps {
  selected: 'all' | 'general' | 'monitoring' | 'wiki';
  onChange: (category: string) => void;
  stats: {
    general: number;
    monitoring: number;
    wiki: number;
  };
}

export default function CategoryFilters({ selected, onChange, stats }: CategoryFiltersProps) {
  const categories = [
    { 
      value: 'all', 
      label: 'Todos', 
      icon: '🗂️',
      count: stats.general + stats.monitoring + stats.wiki
    },
    { 
      value: 'general', 
      label: 'Archivos Generales', 
      icon: '📁',
      count: stats.general
    },
    { 
      value: 'monitoring', 
      label: 'Monitoreos', 
      icon: '📊',
      count: stats.monitoring
    },
    { 
      value: 'wiki', 
      label: 'Wiki', 
      icon: '📚',
      count: stats.wiki
    }
  ];

  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
      {categories.map(cat => (
        <Chip
          key={cat.value}
          label={`${cat.icon} ${cat.label} (${cat.count})`}
          onClick={() => onChange(cat.value)}
          color={selected === cat.value ? 'primary' : 'default'}
          sx={{ 
            fontWeight: selected === cat.value ? 600 : 400,
            fontSize: '0.95rem',
            px: 1
          }}
        />
      ))}
    </Box>
  );
}
```

---

### 2. WikiSection.tsx

```tsx
import React, { useState, useEffect } from 'react';
import { Box, Grid, Button, Typography, Tabs, Tab } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import WikiItemCard from './WikiItemCard';
import CreateWikiModal from './CreateWikiModal';
import WikiGraphView from './WikiGraphView';
import WikiStatsPanel from './WikiStatsPanel';
import { getWikiItems, getWikiStats } from '../../services/wikiService';

export default function WikiSection() {
  const [selectedType, setSelectedType] = useState<'all' | string>('all');
  const [wikiItems, setWikiItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'graph'>('grid');
  const [loading, setLoading] = useState(false);

  const wikiTypes = [
    { value: 'all', label: 'Todos', icon: '📚' },
    { value: 'wiki_person', label: 'Personas', icon: '👤' },
    { value: 'wiki_organization', label: 'Organizaciones', icon: '🏢' },
    { value: 'wiki_location', label: 'Lugares', icon: '📍' },
    { value: 'wiki_event', label: 'Eventos', icon: '📅' },
    { value: 'wiki_concept', label: 'Conceptos', icon: '💡' }
  ];

  useEffect(() => {
    fetchWikiItems();
    fetchStats();
  }, [selectedType]);

  const fetchWikiItems = async () => {
    setLoading(true);
    try {
      const items = await getWikiItems({
        wiki_type: selectedType === 'all' ? undefined : selectedType,
        limit: 100
      });
      setWikiItems(items);
    } catch (error) {
      console.error('Error fetching wiki items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await getWikiStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching wiki stats:', error);
    }
  };

  return (
    <Box>
      {/* Header con botón de crear */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          📚 Wiki del Codex
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant={viewMode === 'grid' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('grid')}
            size="small"
          >
            Vista Lista
          </Button>
          <Button
            variant={viewMode === 'graph' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('graph')}
            size="small"
          >
            🗺️ Vista Grafo
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateModalOpen(true)}
          >
            Crear Item
          </Button>
        </Box>
      </Box>

      {/* Estadísticas */}
      {stats && <WikiStatsPanel stats={stats} />}

      {/* Tabs de tipo */}
      <Tabs 
        value={selectedType} 
        onChange={(e, val) => setSelectedType(val)}
        variant="scrollable"
        sx={{ mb: 3 }}
      >
        {wikiTypes.map(type => (
          <Tab 
            key={type.value}
            value={type.value}
            label={`${type.icon} ${type.label}`}
          />
        ))}
      </Tabs>

      {/* Contenido */}
      {viewMode === 'grid' ? (
        <Grid container spacing={3}>
          {wikiItems.map(item => (
            <Grid item xs={12} md={6} lg={4} key={item.id}>
              <WikiItemCard 
                item={item} 
                onUpdate={fetchWikiItems}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <WikiGraphView items={wikiItems} />
      )}

      {/* Modal de creación */}
      <CreateWikiModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={fetchWikiItems}
      />
    </Box>
  );
}
```

---

### 3. wikiService.ts - Servicio de API

```typescript
// src/services/wikiService.ts

const BACKEND_URL = 'https://server.standatpd.com';

export interface WikiItem {
  id: string;
  category: 'wiki';
  subcategory: 'wiki_person' | 'wiki_organization' | 'wiki_location' | 'wiki_event' | 'wiki_concept';
  titulo: string;
  descripcion: string;
  etiquetas: string[];
  metadata: any;
  created_at: string;
  url?: string;
}

export interface CreateWikiItemData {
  wiki_type: string;
  name: string;
  description: string;
  tags?: string[];
  relevance_score?: number;
  [key: string]: any;
}

/**
 * Obtiene items de Wiki con filtros
 */
export async function getWikiItems(params: {
  wiki_type?: string;
  search?: string;
  related_to?: string;
  relevance_min?: number;
  tags?: string;
  project_id?: string;
  limit?: number;
}): Promise<WikiItem[]> {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value.toString());
    }
  });

  const response = await fetch(
    `${BACKEND_URL}/api/wiki/items?${queryParams.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    }
  );

  if (!response.ok) {
    throw new Error('Error obteniendo items de Wiki');
  }

  const data = await response.json();
  return data.items || [];
}

/**
 * Crea un nuevo item de Wiki
 */
export async function createWikiItem(
  userId: string,
  wikiData: CreateWikiItemData
): Promise<{ success: boolean; id?: string; error?: string }> {
  const response = await fetch(`${BACKEND_URL}/api/wiki/save-item`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    },
    body: JSON.stringify({
      user_id: userId,
      wiki_data: wikiData
    })
  });

  const data = await response.json();
  return data;
}

/**
 * Actualiza un item de Wiki existente
 */
export async function updateWikiItem(
  itemId: string,
  wikiData: Partial<CreateWikiItemData>
): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(`${BACKEND_URL}/api/wiki/item/${itemId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    },
    body: JSON.stringify({ wiki_data: wikiData })
  });

  const data = await response.json();
  return data;
}

/**
 * Elimina un item de Wiki
 */
export async function deleteWikiItem(itemId: string): Promise<{ success: boolean }> {
  const response = await fetch(`${BACKEND_URL}/api/wiki/item/${itemId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  });

  const data = await response.json();
  return data;
}

/**
 * Relaciona items de Wiki
 */
export async function relateWikiItems(
  itemId: string,
  relatedIds: string[],
  action: 'add' | 'remove' | 'set' = 'add'
): Promise<{ success: boolean; related_items: string[] }> {
  const response = await fetch(`${BACKEND_URL}/api/wiki/item/${itemId}/relate`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    },
    body: JSON.stringify({
      related_item_ids: relatedIds,
      action: action
    })
  });

  const data = await response.json();
  return data;
}

/**
 * Actualiza relevancia de un item
 */
export async function updateRelevance(
  itemId: string,
  score: number,
  increment: boolean = false
): Promise<{ success: boolean; relevance_score: number }> {
  const response = await fetch(`${BACKEND_URL}/api/wiki/item/${itemId}/relevance`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    },
    body: JSON.stringify({
      relevance_score: score,
      increment: increment
    })
  });

  const data = await response.json();
  return data;
}

/**
 * Busca en Wiki
 */
export async function searchWiki(params: {
  q: string;
  type?: string;
  min_relevance?: number;
  tags?: string;
  sort?: 'relevance' | 'date' | 'name';
  limit?: number;
}): Promise<WikiItem[]> {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value.toString());
    }
  });

  const response = await fetch(
    `${BACKEND_URL}/api/wiki/search?${queryParams.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    }
  );

  if (!response.ok) {
    throw new Error('Error en búsqueda de Wiki');
  }

  const data = await response.json();
  return data.results || [];
}

/**
 * Obtiene estadísticas de Wiki
 */
export async function getWikiStats(): Promise<any> {
  const response = await fetch(`${BACKEND_URL}/api/wiki/stats`, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  });

  if (!response.ok) {
    throw new Error('Error obteniendo estadísticas');
  }

  const data = await response.json();
  return data.stats;
}

/**
 * Helper para obtener token de autenticación
 */
function getAuthToken(): string {
  // Implementar según tu sistema de autenticación
  // Por ejemplo, desde localStorage o context
  return localStorage.getItem('supabase_token') || '';
}

/**
 * Guarda actividad de monitoreo al Codex
 */
export async function saveActivityToCodex(params: {
  userId: string;
  userEmail: string;
  query: string;
  type: 'hashtag' | 'user' | 'keyword' | 'profile';
  title?: string;
  description?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  tweetCount?: number;
  scrapeId?: string;
  tags?: string[];
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const response = await fetch(`${BACKEND_URL}/api/codex/save-activity-pulse`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      user_id: params.userId,
      pulse_user_email: params.userEmail,
      activity_data: {
        query: params.query,
        type: params.type,
        title: params.title || `Actividad: ${params.query}`,
        description: params.description || `Monitoreo de ${params.query}`,
        sentiment: params.sentiment || 'neutral',
        tweet_count: params.tweetCount || 0,
        scrape_id: params.scrapeId,
        tags: params.tags || [],
        platform: 'twitter'
      }
    })
  });

  const data = await response.json();
  return data;
}

/**
 * Detecta entidades mencionadas en texto
 */
export async function detectEntitiesInText(text: string): Promise<string[]> {
  // Regex simple para detectar menciones de Twitter
  const mentions = text.match(/@[\w]+/g) || [];
  const hashtags = text.match(/#[\w]+/g) || [];
  
  // Buscar cada mención en Wiki
  const entities: string[] = [];
  
  for (const mention of mentions) {
    const results = await searchWiki({
      q: mention.replace('@', ''),
      type: 'wiki_person',
      limit: 1
    });
    
    if (results.length > 0) {
      entities.push(results[0].id);
    }
  }
  
  return entities;
}
```

---

## 📋 Plan de Implementación Paso a Paso

### Fase 1: Componentes Base (2-3 días)

#### Día 1: Servicios y Filtros
- [ ] Crear `src/services/wikiService.ts`
- [ ] Crear `src/components/codex/CategoryFilters.tsx`
- [ ] Crear `src/components/codex/SubcategoryChips.tsx`
- [ ] Modificar `EnhancedCodex.tsx` para agregar filtros de categoría
- [ ] Testing de filtros básicos

#### Día 2: Cards de Wiki
- [ ] Crear `src/components/codex/wiki/WikiItemCard.tsx`
- [ ] Crear `src/components/codex/wiki/PersonCard.tsx`
- [ ] Crear `src/components/codex/wiki/OrganizationCard.tsx`
- [ ] Crear `src/components/codex/wiki/EventCard.tsx`
- [ ] Testing de renderizado

#### Día 3: Sección Wiki Principal
- [ ] Crear `src/components/codex/wiki/WikiSection.tsx`
- [ ] Crear `src/components/codex/wiki/WikiStatsPanel.tsx`
- [ ] Integrar WikiSection en EnhancedCodex
- [ ] Testing de navegación

### Fase 2: Creación y Edición (2-3 días)

#### Día 4: Modales de Creación
- [ ] Crear `src/components/codex/wiki/CreateWikiModal.tsx`
- [ ] Crear formularios dinámicos por tipo
- [ ] Validaciones de campos
- [ ] Testing de creación

#### Día 5: Edición y Eliminación
- [ ] Crear `src/components/codex/wiki/EditWikiModal.tsx`
- [ ] Implementar confirmación de eliminación
- [ ] Testing de actualización

#### Día 6: Sistema de Relaciones
- [ ] Crear `src/components/codex/wiki/WikiRelationsView.tsx`
- [ ] Modal para agregar relaciones
- [ ] Vista de items relacionados
- [ ] Testing de vínculos

### Fase 3: Vista de Grafo (2 días)

#### Día 7: Componente de Grafo
- [ ] Instalar `react-force-graph` o similar
- [ ] Crear `src/components/codex/wiki/WikiGraphView.tsx`
- [ ] Configurar nodos y enlaces
- [ ] Testing de visualización

#### Día 8: Interactividad del Grafo
- [ ] Click en nodos para ver detalles
- [ ] Filtros en vista de grafo
- [ ] Zoom y navegación
- [ ] Testing de UX

### Fase 4: Integración (2-3 días)

#### Día 9: RecentActivity
- [ ] Crear `src/components/ui/SaveActivityButton.tsx`
- [ ] Modificar `RecentActivity.tsx` para incluir botón
- [ ] Implementar auto-detección de entidades
- [ ] Testing de guardado

#### Día 10: Auto-sugerencias
- [ ] Detección de menciones en posts
- [ ] Modal de sugerencia de Wiki item
- [ ] Auto-vinculación con existentes
- [ ] Testing de flujo completo

#### Día 11: Cards de Monitoring
- [ ] Crear `src/components/codex/monitoring/BookmarkCard.tsx`
- [ ] Crear `src/components/codex/monitoring/ActivityCard.tsx`
- [ ] Mostrar vínculos con Wiki
- [ ] Testing de visualización

### Fase 5: Refinamiento (1-2 días)

#### Día 12: Polish y UX
- [ ] Ajustes de diseño
- [ ] Animaciones y transiciones
- [ ] Loading states
- [ ] Error handling

#### Día 13: Testing Final
- [ ] Testing end-to-end completo
- [ ] Performance testing
- [ ] Mobile responsiveness
- [ ] Deploy a staging

---

## 🎯 Especificaciones de Diseño

### Paleta de Colores

```tsx
const wikiColors = {
  person: '#3B82F6',      // Azul
  organization: '#10B981', // Verde
  location: '#F59E0B',    // Naranja
  event: '#EF4444',       // Rojo
  concept: '#8B5CF6'      // Púrpura
};

const categoryColors = {
  general: '#6B7280',     // Gris
  monitoring: '#3B82F6',  // Azul
  wiki: '#8B5CF6'         // Púrpura
};
```

### Iconos por Tipo

```tsx
const wikiIcons = {
  wiki_person: '👤',
  wiki_organization: '🏢',
  wiki_location: '📍',
  wiki_event: '📅',
  wiki_concept: '💡'
};

const categoryIcons = {
  general: '📁',
  monitoring: '📊',
  wiki: '📚'
};
```

### Tamaños y Espaciado

```tsx
const sizing = {
  cardWidth: {
    xs: '100%',
    md: '48%',
    lg: '31%'
  },
  cardHeight: {
    compact: 200,
    normal: 280,
    expanded: 400
  },
  spacing: {
    section: 4,
    card: 3,
    element: 2
  }
};
```

---

## 🧪 Testing Checklist

### Funcionalidad
- [ ] Crear cada tipo de Wiki item
- [ ] Editar Wiki items
- [ ] Eliminar Wiki items
- [ ] Relacionar items entre sí
- [ ] Buscar en Wiki
- [ ] Filtrar por categoría y subcategoría
- [ ] Ver estadísticas
- [ ] Vista de grafo renderiza correctamente
- [ ] Navegación entre vistas

### UX/UI
- [ ] Diseño consistente con ThePulse actual
- [ ] Responsive en mobile, tablet, desktop
- [ ] Loading states apropiados
- [ ] Error messages claros
- [ ] Confirmaciones para acciones destructivas
- [ ] Animaciones suaves
- [ ] Accesibilidad (aria-labels)

### Integración
- [ ] Guardar actividad desde RecentActivity funciona
- [ ] Auto-detección de entidades
- [ ] Sugerencias de creación aparecen
- [ ] Vínculos entre posts y Wiki funcionan
- [ ] Relevancia se actualiza automáticamente

### Performance
- [ ] Carga inicial < 1 segundo
- [ ] Filtrado instantáneo
- [ ] Búsqueda < 500ms
- [ ] Vista de grafo < 2 segundos
- [ ] Sin lag en scrolling

---

## 📦 Dependencias Requeridas

### Nuevas Dependencias a Instalar

```json
{
  "dependencies": {
    "react-force-graph": "^1.43.0",
    "d3": "^7.8.5",
    "@mui/x-date-pickers": "^6.18.0",
    "react-hook-form": "^7.48.2",
    "zod": "^3.22.4"
  }
}
```

**Instalación:**
```bash
cd ThePulse
npm install react-force-graph d3 @mui/x-date-pickers react-hook-form zod
```

---

## 🎨 Mockups Detallados

### Vista Principal con Wiki Seleccionado

```
┌───────────────────────────────────────────────────────────────────┐
│ ThePulse                                    [@usuario] [⚙️] [🔔] │
├───────────────────────────────────────────────────────────────────┤
│ [Dashboard] [Proyectos] [Sondeos] [Trends] [🗂️ Codex] [Config]  │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  🗂️ Codex Mejorado                                               │
│  ───────────────────────────────────────────────────────────────  │
│                                                                    │
│  Categorías:                                                       │
│  [Todos (58)] [📁 General (26)] [📊 Monitoreos (32)] [📚 Wiki (42)]│
│                                                       ───────────  │
│                                                                    │
│  🔍 [Buscar en Wiki...                                    ]  🔎   │
│                                                                    │
│  Tipos de Wiki:                                                    │
│  [📚 Todos] [👤 Personas (15)] [🏢 Orgs (12)] [📍 Lugares (5)]   │
│  [📅 Eventos (7)] [💡 Conceptos (3)]                              │
│                                                                    │
│  ┌──────────────────┐  [+ Crear Item] [🗺️ Vista Grafo]          │
│  │ 📊 Estadísticas  │                                             │
│  ├──────────────────┤                                             │
│  │ Total: 42        │                                             │
│  │ Alta relev.: 18  │                                             │
│  │ Recientes: 8     │                                             │
│  │ Relaciones: 45   │                                             │
│  │ Promedio: 65/100 │                                             │
│  └──────────────────┘                                             │
│                                                                    │
│  Resultados (15):                                                  │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐          │
│  │👤             │ │👤             │ │👤             │          │
│  │Bernardo       │ │Consuelo       │ │Samuel         │          │
│  │Arévalo        │ │Porras         │ │Pérez          │          │
│  │               │ │               │ │               │          │
│  │Presidente     │ │Fiscal General │ │Diputado       │          │
│  │Semilla        │ │MP             │ │Semilla        │          │
│  │               │ │               │ │               │          │
│  │⭐⭐⭐⭐⭐ 95/100│ │⭐⭐⭐⭐ 70/100  │ │⭐⭐⭐⭐ 75/100  │          │
│  │               │ │               │ │               │          │
│  │🔗 5 relaciones│ │🔗 3 relaciones│ │🔗 4 relaciones│          │
│  │               │ │               │ │               │          │
│  │[Ver] [Editar] │ │[Ver] [Editar] │ │[Ver] [Editar] │          │
│  └───────────────┘ └───────────────┘ └───────────────┘          │
│                                                                    │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐          │
│  │🏢             │ │🏢             │ │📅             │          │
│  │Movimiento     │ │Ministerio     │ │Elecciones     │          │
│  │Semilla        │ │Público        │ │2023           │          │
│  │  ...          │ │  ...          │ │  ...          │          │
│  └───────────────┘ └───────────────┘ └───────────────┘          │
│                                                                    │
│  [Cargar más...]                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

### Modal de Creación - Persona

```
┌─────────────────────────────────────────────────────────┐
│  Crear Item de Wiki: Persona                      [✕]   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Información Básica                                      │
│  ───────────────────────────────────────────────────── │
│                                                          │
│  Nombre *                                                │
│  ┌────────────────────────────────────────────────────┐│
│  │ Bernardo Arévalo                                   ││
│  └────────────────────────────────────────────────────┘│
│                                                          │
│  Nombre completo                                         │
│  ┌────────────────────────────────────────────────────┐│
│  │ Bernardo Arévalo de León                           ││
│  └────────────────────────────────────────────────────┘│
│                                                          │
│  Cargo/Posición                                          │
│  ┌────────────────────────────────────────────────────┐│
│  │ Presidente de Guatemala                            ││
│  └────────────────────────────────────────────────────┘│
│                                                          │
│  Partido político                                        │
│  ┌────────────────────────────────────────────────────┐│
│  │ Movimiento Semilla                                 ││
│  └────────────────────────────────────────────────────┘│
│                                                          │
│  Descripción/Biografía                                   │
│  ┌────────────────────────────────────────────────────┐│
│  │ Presidente de Guatemala desde 2024. Fundador de   ││
│  │ Movimiento Semilla, partido político enfocado en  ││
│  │ transparencia y anticorrupción...                 ││
│  └────────────────────────────────────────────────────┘│
│                                                          │
│  Redes Sociales                                          │
│  ───────────────────────────────────────────────────── │
│  Twitter:  [@BArevalodeLeon                         ]  │
│  Facebook: [BernardoArevalodeLeón                   ]  │
│  Instagram:[                                         ]  │
│                                                          │
│  Relevancia Inicial: [████████░░] 80/100                │
│                                                          │
│  Etiquetas:                                              │
│  [#política] [#presidente] [#semilla] [+ Agregar]        │
│                                                          │
│  [▼ Campos Avanzados]                                    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ [Cancelar]                    [Crear Persona] ✓ │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

### Vista de Grafo

```
┌─────────────────────────────────────────────────────────┐
│  🗺️ Vista de Red - Wiki                          [✕]    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [Vista Lista] [🗺️ Vista Grafo] ← Toggle               │
│                                  ────────────            │
│  Filtros:  [☑ Personas] [☑ Organizaciones] [☐ Eventos] │
│            [Relevancia mín: 50 ───●─── 100]             │
│                                                          │
│  ┌────────────────────────────────────────────────────┐│
│  │                                                    ││
│  │                  Bernardo Arévalo                 ││
│  │                       ●(95)                        ││
│  │                      /│\                           ││
│  │                     / │ \                          ││
│  │                    /  │  \                         ││
│  │                   /   │   \                        ││
│  │                  /    │    \                       ││
│  │                 /     │     \                      ││
│  │                /      │      \                     ││
│  │               ●       ●       ●                    ││
│  │           Semilla  Elec.  Consuelo                ││
│  │            (90)    2023    Porras                  ││
│  │                    (85)    (70)                    ││
│  │              │       │       │                     ││
│  │              │       │       │                     ││
│  │              ●       ●       ●                     ││
│  │           Samuel    MP    Caso                    ││
│  │           Pérez    (80)   Hogar                   ││
│  │            (75)           (85)                     ││
│  │                                                    ││
│  │  [Click en nodo para ver detalles]                ││
│  │  [Doble-click para expandir relaciones]           ││
│  └────────────────────────────────────────────────────┘│
│                                                          │
│  Nodo seleccionado:                                      │
│  ┌────────────────────────────────────────────────────┐│
│  │ 👤 Bernardo Arévalo (95)                          ││
│  │ Presidente de Guatemala                            ││
│  │ 🔗 5 relaciones directas                          ││
│  │ [Ver perfil] [Ver posts relacionados]             ││
│  └────────────────────────────────────────────────────┘│
│                                                          │
│  Leyenda:                                                │
│  ● Persona  ■ Organización  ▲ Evento  ◆ Concepto       │
│  Tamaño = Relevancia  |  Color = Tipo                   │
│                                                          │
│  [Zoom -] [Centrar] [Zoom +] [Exportar imagen]          │
└─────────────────────────────────────────────────────────┘
```

---

### RecentActivity - Botón de Guardar

```
┌─────────────────────────────────────────────────────────┐
│  📊 Actividad Reciente                                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Scrapes Recientes con Vizta Chat:                      │
│                                                          │
│  ┌────────────────────────────────────────────────────┐│
│  │ 📊 Scrape: #argentina                              ││
│  │ ─────────────────────────────────────────────────  ││
│  │                                                     ││
│  │ 📅 20 Enero 2025 - 15:30                           ││
│  │ 🔧 Herramienta: nitter_context                     ││
│  │ 📊 Resultados: 45 tweets                           ││
│  │ 😊 Sentimiento: Positivo (60%)                     ││
│  │                                                     ││
│  │ ┌─────────────────────────────────────────────┐   ││
│  │ │ ✨ Entidades detectadas automáticamente:    │   ││
│  │ ├─────────────────────────────────────────────┤   ││
│  │ │ 👤 @BArevalodeLeon                          │   ││
│  │ │    ┌─ Existe en Wiki ✓                      │   ││
│  │ │    └─ Relevancia actual: 95                 │   ││
│  │ │                                              │   ││
│  │ │ 🏢 Movimiento Semilla                       │   ││
│  │ │    ┌─ Existe en Wiki ✓                      │   ││
│  │ │    └─ Relevancia actual: 90                 │   ││
│  │ │                                              │   ││
│  │ │ 👤 @SamuelPerezUNE                          │   ││
│  │ │    ┌─ No existe en Wiki                     │   ││
│  │ │    └─ [+ Crear perfil]                      │   ││
│  │ └─────────────────────────────────────────────┘   ││
│  │                                                     ││
│  │ ┌───────────────┐ ┌─────────────────────────────┐ ││
│  │ │ Ver resultados│ │ 💾 Guardar a Codex          │ ││
│  │ └───────────────┘ └─────────────────────────────┘ ││
│  │                   (Botón NUEVO)                     ││
│  └────────────────────────────────────────────────────┘│
│                                                          │
│  Cuando hace click en "Guardar a Codex":                │
│  ┌────────────────────────────────────────────────────┐│
│  │ ✅ Actividad guardada en Codex                     ││
│  │                                                     ││
│  │ ✨ Acciones automáticas:                           ││
│  │ • Vinculado con Bernardo Arévalo (Wiki)            ││
│  │ • Vinculado con Movimiento Semilla (Wiki)          ││
│  │ • Relevancia de Arévalo: 95 → 98 (+3)             ││
│  │ • Relevancia de Semilla: 90 → 93 (+3)             ││
│  │                                                     ││
│  │ [Ver en Codex] [Cerrar]                            ││
│  └────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

---

## 💻 Código de Referencia

### EnhancedCodex.tsx - Modificaciones

```tsx
// src/pages/EnhancedCodex.tsx

import React, { useState, useEffect } from 'react';
import { Box, Container, Typography } from '@mui/material';
import CategoryFilters from '../components/codex/CategoryFilters';
import SubcategoryChips from '../components/codex/SubcategoryChips';
import WikiSection from '../components/codex/wiki/WikiSection';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

export default function EnhancedCodex() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'general' | 'monitoring' | 'wiki'>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [codexItems, setCodexItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ general: 0, monitoring: 0, wiki: 0 });

  useEffect(() => {
    fetchStats();
  }, [user]);

  useEffect(() => {
    fetchCodexItems();
  }, [selectedCategory, selectedSubcategory, user]);

  const fetchStats = async () => {
    if (!user) return;

    try {
      // Obtener conteos por categoría
      const { data: generalData } = await supabase
        .from('codex_items')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('category', 'general');

      const { data: monitoringData } = await supabase
        .from('codex_items')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('category', 'monitoring');

      const { data: wikiData } = await supabase
        .from('codex_items')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('category', 'wiki');

      setStats({
        general: generalData?.length || 0,
        monitoring: monitoringData?.length || 0,
        wiki: wikiData?.length || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchCodexItems = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('codex_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      if (selectedSubcategory !== 'all') {
        query = query.eq('subcategory', selectedSubcategory);
      }

      const { data, error } = await query;

      if (error) throw error;

      setCodexItems(data || []);
    } catch (error) {
      console.error('Error fetching codex items:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSubcategoryOptions = () => {
    if (selectedCategory === 'general') {
      return [
        { value: 'all', label: 'Todos', icon: '📁' },
        { value: 'document', label: 'Documentos', icon: '📄' },
        { value: 'audio', label: 'Audios', icon: '🎤' },
        { value: 'video', label: 'Videos', icon: '🎬' },
        { value: 'external_spreadsheet', label: 'Spreadsheets', icon: '📊' }
      ];
    } else if (selectedCategory === 'monitoring') {
      return [
        { value: 'all', label: 'Todos', icon: '📊' },
        { value: 'bookmark', label: 'Posts Guardados', icon: '📌' },
        { value: 'activity', label: 'Actividad', icon: '📈' },
        { value: 'internal_spreadsheet', label: 'Spreadsheets', icon: '📑' }
      ];
    } else if (selectedCategory === 'wiki') {
      return [
        { value: 'all', label: 'Todos', icon: '📚' },
        { value: 'wiki_person', label: 'Personas', icon: '👤' },
        { value: 'wiki_organization', label: 'Organizaciones', icon: '🏢' },
        { value: 'wiki_location', label: 'Lugares', icon: '📍' },
        { value: 'wiki_event', label: 'Eventos', icon: '📅' },
        { value: 'wiki_concept', label: 'Conceptos', icon: '💡' }
      ];
    }
    return [];
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
        🗂️ Codex Mejorado
      </Typography>

      {/* Filtros de categoría */}
      <CategoryFilters
        selected={selectedCategory}
        onChange={setSelectedCategory}
        stats={stats}
      />

      {/* Filtros de subcategoría */}
      {selectedCategory !== 'all' && (
        <SubcategoryChips
          options={getSubcategoryOptions()}
          selected={selectedSubcategory}
          onChange={setSelectedSubcategory}
        />
      )}

      {/* Contenido según categoría */}
      {selectedCategory === 'wiki' ? (
        <WikiSection 
          selectedType={selectedSubcategory}
          onRefresh={fetchCodexItems}
        />
      ) : (
        <Box>
          {/* Renderizar cards según categoría y subcategoría */}
          <Grid container spacing={3}>
            {codexItems.map(item => (
              <Grid item xs={12} md={6} lg={4} key={item.id}>
                {renderCardByType(item)}
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Container>
  );
}

function renderCardByType(item) {
  // Renderizar card específico según subcategory
  switch (item.subcategory) {
    case 'bookmark':
      return <BookmarkCard item={item} />;
    case 'activity':
      return <ActivityCard item={item} />;
    case 'document':
      return <DocumentCard item={item} />;
    case 'audio':
      return <AudioCard item={item} />;
    case 'video':
      return <VideoCard item={item} />;
    case 'wiki_person':
      return <PersonCard item={item} />;
    case 'wiki_organization':
      return <OrganizationCard item={item} />;
    case 'wiki_event':
      return <EventCard item={item} />;
    // ... etc
    default:
      return <GenericCard item={item} />;
  }
}
```

---

### SaveActivityButton.tsx - Nuevo Componente

```tsx
// src/components/ui/SaveActivityButton.tsx

import React, { useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Box, Chip, Alert } from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { saveActivityToCodex, detectEntitiesInText } from '../../services/wikiService';
import { useAuth } from '../../context/AuthContext';

interface SaveActivityButtonProps {
  scrape: {
    id: string;
    query_original: string;
    query_clean: string;
    herramienta: string;
    categoria?: string;
    tweet_count?: number;
    sentimiento?: string;
    smart_grouping?: string;
  };
  onSaved?: () => void;
}

export default function SaveActivityButton({ scrape, onSaved }: SaveActivityButtonProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [detectedEntities, setDetectedEntities] = useState([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    setSaveSuccess(false);

    try {
      // Detectar entidades en el query
      const entities = await detectEntitiesInText(scrape.query_original);
      setDetectedEntities(entities);

      // Determinar tipo de actividad
      const activityType = detectActivityType(scrape.herramienta, scrape.query_original);

      // Guardar actividad
      const result = await saveActivityToCodex({
        userId: user.id,
        userEmail: user.email,
        query: scrape.query_original,
        type: activityType,
        title: `Monitoreo: ${scrape.query_original}`,
        description: `Análisis de ${scrape.tweet_count || 0} tweets sobre "${scrape.query_original}"`,
        sentiment: scrape.sentimiento || 'neutral',
        tweetCount: scrape.tweet_count || 0,
        scrapeId: scrape.id,
        tags: [scrape.categoria, scrape.smart_grouping].filter(Boolean)
      });

      if (result.success) {
        setSaveSuccess(true);
        setShowDialog(true);
        
        // Incrementar relevancia de entidades detectadas
        for (const entityId of entities) {
          await updateRelevance(entityId, 3, true);
        }

        onSaved?.();
      }
    } catch (error) {
      console.error('Error saving activity:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={<SaveIcon />}
        onClick={handleSave}
        disabled={loading}
        size="small"
      >
        {loading ? 'Guardando...' : 'Guardar a Codex'}
      </Button>

      {/* Dialog de confirmación */}
      <Dialog open={showDialog} onClose={() => setShowDialog(false)}>
        <DialogTitle>✅ Actividad Guardada</DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 2 }}>
            La actividad se guardó exitosamente en tu Codex
          </Alert>

          {detectedEntities.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                ✨ Acciones automáticas realizadas:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {detectedEntities.map((entity, idx) => (
                  <Chip
                    key={idx}
                    label={`Vinculado con ${entity.name} (relevancia +3)`}
                    size="small"
                    color="primary"
                  />
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDialog(false)}>
            Cerrar
          </Button>
          <Button 
            variant="contained"
            onClick={() => {
              setShowDialog(false);
              window.location.href = '/codex';
            }}
          >
            Ver en Codex
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function detectActivityType(herramienta: string, query: string): 'hashtag' | 'user' | 'keyword' | 'profile' {
  if (herramienta === 'nitter_profile') return 'profile';
  if (query.startsWith('#')) return 'hashtag';
  if (query.startsWith('@')) return 'user';
  return 'keyword';
}
```

---

## 📐 Especificaciones Técnicas

### Estado y Stores

```tsx
// Estado local en EnhancedCodex
const [selectedCategory, setSelectedCategory] = useState<'all' | 'general' | 'monitoring' | 'wiki'>('all');
const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
const [codexItems, setCodexItems] = useState<CodexItem[]>([]);
const [searchQuery, setSearchQuery] = useState('');
const [viewMode, setViewMode] = useState<'grid' | 'graph'>('grid');

// Estado en WikiSection
const [wikiItems, setWikiItems] = useState<WikiItem[]>([]);
const [stats, setStats] = useState(null);
const [createModalOpen, setCreateModalOpen] = useState(false);
const [editingItem, setEditingItem] = useState<WikiItem | null>(null);
```

### Tipos TypeScript

```typescript
// src/types/wiki.ts

export type WikiType = 
  | 'wiki_person' 
  | 'wiki_organization' 
  | 'wiki_location' 
  | 'wiki_event' 
  | 'wiki_concept';

export interface WikiItem {
  id: string;
  user_id: string;
  category: 'wiki';
  subcategory: WikiType;
  source_type: 'manual' | 'bookmark' | 'activity' | 'upload' | 'generated';
  tipo: string;
  titulo: string;
  descripcion: string;
  etiquetas: string[];
  proyecto: string;
  project_id: string | null;
  url: string | null;
  metadata: WikiMetadata;
  fecha: string;
  created_at: string;
}

export interface WikiMetadata {
  created_by: string;
  relevance_score: number;
  last_mentioned: string | null;
  source_urls: string[];
  related_items: string[];
  
  // Campos específicos según tipo
  full_name?: string;
  position?: string;
  political_party?: string;
  social_media?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
  
  // Para organizaciones
  official_name?: string;
  acronym?: string;
  org_type?: 'political_party' | 'ngo' | 'government' | 'media' | 'company';
  key_people?: string[];
  
  // Para eventos
  event_name?: string;
  event_type?: 'legal_case' | 'election' | 'protest' | 'crisis' | 'milestone';
  start_date?: string;
  end_date?: string;
  status?: 'planned' | 'ongoing' | 'completed' | 'cancelled';
  timeline?: Array<{
    date: string;
    event: string;
    description: string;
  }>;
  
  // ... otros campos
}

export interface WikiStats {
  total: number;
  by_type: {
    wiki_person: number;
    wiki_organization: number;
    wiki_location: number;
    wiki_event: number;
    wiki_concept: number;
  };
  avg_relevance: number;
  high_relevance_count: number;
  recent_count: number;
  total_relations: number;
}
```

---

## 🎯 Prioridades de Implementación

### 🔥 Alta Prioridad (Semana 1)
1. ✅ CategoryFilters.tsx
2. ✅ SubcategoryChips.tsx
3. ✅ wikiService.ts
4. ✅ WikiSection.tsx
5. ✅ PersonCard.tsx
6. ✅ OrganizationCard.tsx
7. ✅ CreateWikiModal.tsx (básico)
8. ✅ Integración en EnhancedCodex.tsx

### 📊 Media Prioridad (Semana 2)
1. EventCard.tsx
2. ConceptCard.tsx
3. LocationCard.tsx
4. EditWikiModal.tsx
5. WikiRelationsView.tsx
6. SaveActivityButton.tsx
7. BookmarkCard.tsx
8. ActivityCard.tsx

### 🌟 Baja Prioridad (Semana 3)
1. WikiGraphView.tsx (vista de grafo)
2. Auto-detección de entidades
3. Sugerencias automáticas
4. Export de Wiki items
5. Estadísticas avanzadas

---

## ✅ Checklist de Completitud

### Componentes Críticos
- [ ] CategoryFilters funcional
- [ ] WikiSection renderiza correctamente
- [ ] PersonCard muestra toda la información
- [ ] OrganizationCard muestra toda la información
- [ ] CreateWikiModal crea items correctamente
- [ ] wikiService conecta con backend

### Funcionalidad Esencial
- [ ] Filtrado por categoría funciona
- [ ] Filtrado por subcategoría funciona
- [ ] Crear Wiki items funciona
- [ ] Editar Wiki items funciona
- [ ] Eliminar Wiki items funciona
- [ ] Búsqueda funciona

### Integraciones
- [ ] RecentActivity tiene botón "Guardar a Codex"
- [ ] Guardar actividad funciona
- [ ] Detección de entidades básica
- [ ] Actualización de relevancia automática

### UX/Performance
- [ ] Diseño consistente con ThePulse
- [ ] Responsive en todos los tamaños
- [ ] Loading states apropiados
- [ ] Queries < 500ms

---

## 🚀 Entregables

### Archivos a Crear (Mínimo)
1. `src/services/wikiService.ts` (300 líneas aprox)
2. `src/components/codex/CategoryFilters.tsx` (80 líneas)
3. `src/components/codex/SubcategoryChips.tsx` (60 líneas)
4. `src/components/codex/wiki/WikiSection.tsx` (200 líneas)
5. `src/components/codex/wiki/WikiItemCard.tsx` (100 líneas)
6. `src/components/codex/wiki/PersonCard.tsx` (150 líneas)
7. `src/components/codex/wiki/OrganizationCard.tsx` (150 líneas)
8. `src/components/codex/wiki/CreateWikiModal.tsx` (250 líneas)
9. `src/components/codex/wiki/WikiStatsPanel.tsx` (80 líneas)
10. `src/components/ui/SaveActivityButton.tsx` (150 líneas)
11. `src/types/wiki.ts` (100 líneas)

### Archivos a Modificar
1. `src/pages/EnhancedCodex.tsx` - Agregar filtros y lógica de categorización
2. `src/pages/RecentActivity.tsx` - Agregar SaveActivityButton

**Total Estimado:** ~1600 líneas de código nuevo + modificaciones

---

## 📖 Recursos de Referencia

### Documentos
- `CODEX_RESTRUCTURING_PLAN.md` - Plan completo con todos los detalles
- `WIKI_API_DOCUMENTATION.md` - Documentación de endpoints
- `CODEX_FLOW_DIAGRAMS.md` - Diagramas de flujo
- Este documento - Plan de UI

### Endpoints Disponibles
```
POST   /api/wiki/save-item
GET    /api/wiki/items
GET    /api/wiki/item/:id
PUT    /api/wiki/item/:id
DELETE /api/wiki/item/:id
PUT    /api/wiki/item/:id/relate
PUT    /api/wiki/item/:id/relevance
GET    /api/wiki/search
GET    /api/wiki/stats
POST   /api/codex/save-activity
POST   /api/codex/save-activity-pulse
```

### Librerías Requeridas
- Material-UI (ya instalado)
- react-force-graph (instalar)
- react-hook-form (instalar)
- zod (instalar)

---

## 🎨 Guía de Estilo

### Componentes
- Usar Material-UI v5
- Preferir functional components con hooks
- TypeScript estricto
- Props interfaces bien definidas

### Naming
- Archivos: PascalCase.tsx
- Componentes: PascalCase
- Funciones: camelCase
- Constantes: UPPER_SNAKE_CASE

### Estructura
```tsx
// Imports
import React from 'react';
import { ... } from '@mui/material';

// Types/Interfaces
interface ComponentProps { ... }

// Component
export default function Component(props: ComponentProps) {
  // Hooks
  const [state, setState] = useState();
  
  // Effects
  useEffect(() => { ... }, []);
  
  // Handlers
  const handleAction = () => { ... };
  
  // Render
  return ( ... );
}

// Helper functions
function helperFunction() { ... }
```

---

**Tiempo Estimado Total:** 2-3 semanas  
**Complejidad:** Media-Alta  
**Prioridad:** Alta  
**Estado:** Listo para implementar (Backend 100% funcional)

