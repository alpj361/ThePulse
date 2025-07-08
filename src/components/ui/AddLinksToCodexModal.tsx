import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Checkbox, FormControlLabel, List, ListItem, ListItemText, CircularProgress, Typography, Alert
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { analyzePendingLinks } from '../../services/pendingAnalysis';

interface AddLinksToCodexModalProps {
  open: boolean;
  onClose: () => void;
  initialLinks: string[];
  initialTitle: string;
  onSaved?: () => void;
}

const AddLinksToCodexModal: React.FC<AddLinksToCodexModalProps> = ({
  open,
  onClose,
  initialLinks,
  initialTitle,
  onSaved
}) => {
  const { user } = useAuth();
  const [title, setTitle] = useState(initialTitle);
  const [links, setLinks] = useState<string[]>(initialLinks);
  const [analyze, setAnalyze] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setTitle(initialTitle);
    setLinks(initialLinks);
    setAnalyze(false);
    setError(null);
    setSuccess(null);
  }, [open, initialLinks, initialTitle]);

  // Función local para crear grupos bulk (evita problemas de importación)
  const createCodexGroupBulk = async (
    userId: string,
    groupData: {
      group_name: string;
      group_description: string;
      items: {
        tipo?: string;
        titulo?: string;
        descripcion?: string;
        etiquetas?: string[];
        proyecto?: string;
        url: string;
      }[];
    }
  ) => {
    console.log('🔄 INICIO createCodexGroupBulk LOCAL');
    console.log('📝 userId:', userId);
    console.log('📝 groupData:', JSON.stringify(groupData, null, 2));

    try {
      // Obtener token de sesión
      const session = await supabase.auth.getSession();
      if (!session.data.session?.access_token) {
        throw new Error('No hay sesión activa');
      }
      const token = session.data.session.access_token;
      console.log('🔑 Token obtenido:', token ? 'SÍ' : 'NO');

      // Detectar entorno y usar URL correcta
      const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
      const baseUrl = isProduction ? 'https://server.standatpd.com' : 'http://localhost:8080';
      const endpoint = `${baseUrl}/api/codex-groups/create-bulk`;
      
      console.log('🌍 Entorno:', isProduction ? 'PRODUCCIÓN' : 'DESARROLLO');
      console.log('🌐 Base URL:', baseUrl);
      console.log('🌐 Endpoint completo:', endpoint);

      const requestBody = {
        group_name: groupData.group_name,
        group_description: groupData.group_description,
        items: groupData.items
      };
      console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));

      // Hacer la petición
      console.log('📡 Haciendo petición HTTP...');
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📥 Respuesta HTTP:', response.status, response.statusText);

      // Leer la respuesta completa
      const responseText = await response.text();
      console.log('📥 Respuesta raw:', responseText);

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (parseError) {
          console.error('❌ Error parseando respuesta de error:', parseError);
          throw new Error(`HTTP ${response.status}: ${responseText}`);
        }
        
        console.error('❌ Error del servidor:', errorData);
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      // Parsear respuesta exitosa
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Error parseando respuesta exitosa:', parseError);
        throw new Error('Respuesta del servidor no válida');
      }

      console.log('✅ Resultado parseado:', result);
      console.log('✅ FIN createCodexGroupBulk LOCAL exitoso');
      
      return result;

    } catch (error) {
      console.error('❌ Error completo en createCodexGroupBulk LOCAL:', error);
      throw error;
    }
  };

  const handleSave = async () => {
    console.log('🚀 INICIO handleSave');
    console.log('📝 title:', title);
    console.log('📝 links:', links);
    console.log('📝 user:', user);
    
    if (!title.trim() || links.length === 0) {
      console.log('❌ Validación falló: título o enlaces vacíos');
      setError('El título y al menos un enlace son requeridos');
      return;
    }
    if (!user || !user.id) {
      console.log('❌ Validación falló: usuario no encontrado');
      setError('No se pudo identificar al usuario');
      return;
    }
    
    console.log('✅ Validaciones pasadas, proceeding...');
    setSaving(true);
    setError(null);
    
    try {
      // Obtener token de sesión para futuras llamadas
      const sessionRes = await supabase.auth.getSession();
      const authToken = sessionRes.data.session?.access_token || undefined;
      console.log(`💾 Guardando ${links.length} enlaces en Codex...`);
      
      if (links.length === 1) {
        console.log('📍 FLUJO: Enlace individual');
        // Caso simple: un solo enlace, guardarlo sin agrupación
        const item = {
          user_id: user.id,
          tipo: 'enlace',
          titulo: title.trim(),
          descripcion: '',
          etiquetas: [],
          proyecto: 'Sin proyecto',
          url: links[0],
          fecha: new Date().toISOString()
        };
        
        const { data, error } = await supabase
          .from('codex_items')
          .insert([item])
          .select()
          .single();
          
        if (error) throw error;
        
        console.log('✅ Enlace individual guardado:', data);

        // Llamar análisis si checkbox marcado
        if (analyze && data && data.id) {
          analyzePendingLinks({ itemIds: [data.id] }, authToken)
            .then(res => {
              console.log('✅ Análisis en segundo plano completado', res);
            })
            .catch(err => {
              console.error('❌ Error análisis en segundo plano:', err);
            });
        }
        setSaving(false);
        if (onSaved) onSaved();
        onClose();
        return;
      }
      
      console.log('📍 FLUJO: Múltiples enlaces - usando función bulk');
      // Caso múltiples enlaces: usar la función bulk
      console.log('📂 Creando grupo para múltiples enlaces usando función bulk...');
      
      // Preparar los items para la función bulk
      const items = links.map((url, index) => ({
        tipo: 'enlace',
        titulo: `Enlace ${index + 1}`,
        descripcion: '',
        etiquetas: [],
        proyecto: 'Sin proyecto',
        url: url
      }));
      
      console.log('📦 Items preparados para bulk:', items);
      
      console.log('🔄 Llamando a createCodexGroupBulk...');
      // Crear el grupo con todos los enlaces de una vez
      const result = await createCodexGroupBulk(user.id, {
        group_name: title.trim(),
        group_description: `Grupo de ${links.length} enlaces relacionados`,
        items: items
      });
      
      console.log('✅ Grupo de enlaces creado exitosamente:', result);

      // Intentar extraer IDs de items para análisis
      if (analyze) {
        const createdIds: string[] = result?.itemIds || result?.items?.map((i: any)=>i.id) || [];
        if (createdIds.length) {
          analyzePendingLinks({ itemIds: createdIds }, authToken)
            .then(res => console.log('✅ Análisis bulk en BG:', res))
            .catch(err => console.error('❌ Error análisis bulk BG:', err));
        }
      }
      setSaving(false);
      if (onSaved) onSaved();
      onClose();
    } catch (err: any) {
      console.error('❌ Error guardando enlaces:', err);
      console.error('❌ Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      setSaving(false);
      setError('Error al guardar los enlaces: ' + (err.message || err));
    }
    
    console.log('🏁 FIN handleSave');
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Añadir enlaces al Codex</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          <TextField
            label="Título del grupo"
            value={title}
            onChange={e => setTitle(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Enlaces a guardar:</Typography>
          <List dense>
            {links.map((link, idx) => (
              <ListItem key={link + idx}>
                <ListItemText primary={link} />
              </ListItem>
            ))}
          </List>
          <FormControlLabel
            control={<Checkbox checked={analyze} onChange={e => setAnalyze(e.target.checked)} />}
            label="Analizar estos enlaces después de guardarlos"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained" color="primary" disabled={saving || links.length === 0}>
            {saving ? <CircularProgress size={20} /> : 'Guardar en Codex'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AddLinksToCodexModal; 