-- Migration: Pizarras/Dashboards para visualizaciones
-- Permite a cada usuario crear hasta 3 pizarras para organizar visualizaciones del chat

-- Tabla principal de dashboards/pizarras
CREATE TABLE IF NOT EXISTS dashboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Nueva Pizarra',
  description TEXT,
  layout_config JSONB DEFAULT '{"cols": 12, "rowHeight": 80}'::jsonb,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: máximo 3 dashboards por usuario
  CONSTRAINT max_dashboards_per_user CHECK (
    (SELECT COUNT(*) FROM dashboards WHERE user_id = dashboards.user_id) <= 3
  )
);

-- Tabla de widgets/elementos en las pizarras
CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
  widget_type TEXT NOT NULL CHECK (widget_type IN ('chart', 'emoji', 'text')),
  
  -- Contenido según tipo
  content JSONB NOT NULL,
  -- Para 'chart': { c1Response: "...", originalQuery: "...", timestamp: "..." }
  -- Para 'emoji': { emoji: "😀", size: "large" }
  -- Para 'text': { text: "...", fontSize: 16, color: "#000" }
  
  -- Posición y tamaño en el grid
  position JSONB NOT NULL DEFAULT '{"x": 0, "y": 0, "w": 4, "h": 3}'::jsonb,
  -- { x: col, y: row, w: width_cols, h: height_rows }
  
  -- Configuración adicional (para charts: axis, colores, etc)
  config JSONB DEFAULT '{}'::jsonb,
  
  z_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_dashboards_user_id ON dashboards(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboards_created_at ON dashboards(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_widgets_dashboard_id ON dashboard_widgets(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_widgets_type ON dashboard_widgets(widget_type);

-- Row Level Security (RLS)
ALTER TABLE dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;

-- Políticas para dashboards
DROP POLICY IF EXISTS "Users can view own dashboards" ON dashboards;
CREATE POLICY "Users can view own dashboards"
  ON dashboards FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own dashboards" ON dashboards;
CREATE POLICY "Users can create own dashboards"
  ON dashboards FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND (SELECT COUNT(*) FROM dashboards WHERE user_id = auth.uid()) < 3
  );

DROP POLICY IF EXISTS "Users can update own dashboards" ON dashboards;
CREATE POLICY "Users can update own dashboards"
  ON dashboards FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own dashboards" ON dashboards;
CREATE POLICY "Users can delete own dashboards"
  ON dashboards FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para widgets
DROP POLICY IF EXISTS "Users can view widgets from own dashboards" ON dashboard_widgets;
CREATE POLICY "Users can view widgets from own dashboards"
  ON dashboard_widgets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dashboards 
      WHERE dashboards.id = dashboard_widgets.dashboard_id 
      AND dashboards.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create widgets in own dashboards" ON dashboard_widgets;
CREATE POLICY "Users can create widgets in own dashboards"
  ON dashboard_widgets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dashboards 
      WHERE dashboards.id = dashboard_widgets.dashboard_id 
      AND dashboards.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update widgets in own dashboards" ON dashboard_widgets;
CREATE POLICY "Users can update widgets in own dashboards"
  ON dashboard_widgets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM dashboards 
      WHERE dashboards.id = dashboard_widgets.dashboard_id 
      AND dashboards.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete widgets from own dashboards" ON dashboard_widgets;
CREATE POLICY "Users can delete widgets from own dashboards"
  ON dashboard_widgets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM dashboards 
      WHERE dashboards.id = dashboard_widgets.dashboard_id 
      AND dashboards.user_id = auth.uid()
    )
  );

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_dashboards_updated_at ON dashboards;
CREATE TRIGGER update_dashboards_updated_at
  BEFORE UPDATE ON dashboards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_dashboard_widgets_updated_at ON dashboard_widgets;
CREATE TRIGGER update_dashboard_widgets_updated_at
  BEFORE UPDATE ON dashboard_widgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentarios para documentación
COMMENT ON TABLE dashboards IS 'Pizarras/Dashboards personalizables para visualizaciones. Max 3 por usuario.';
COMMENT ON TABLE dashboard_widgets IS 'Widgets individuales dentro de cada dashboard (gráficos, emojis, textos).';
COMMENT ON COLUMN dashboard_widgets.widget_type IS 'Tipo de widget: chart (visualización Thesys), emoji, o text';
COMMENT ON COLUMN dashboard_widgets.position IS 'Posición en grid: {x: col, y: row, w: width, h: height}';


