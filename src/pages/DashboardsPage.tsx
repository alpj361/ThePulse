import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, LayoutGrid, Trash2, Edit2, Loader2 } from 'lucide-react';
import { getUserDashboards, createDashboard, deleteDashboard, type Dashboard } from '../services/dashboards';
import { DashboardCanvas } from '../components/dashboard/DashboardCanvas';

export default function DashboardsPage() {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDashboardTitle, setNewDashboardTitle] = useState('');

  // Load dashboards on mount
  useEffect(() => {
    loadDashboards();
  }, []);

  const loadDashboards = async () => {
    try {
      setLoading(true);
      const data = await getUserDashboards();
      setDashboards(data);
      
      // Auto-select first dashboard if none selected
      if (!selectedDashboard && data.length > 0) {
        setSelectedDashboard(data[0]);
      }
    } catch (error) {
      console.error('[Dashboards] Error loading:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDashboard = async () => {
    if (!newDashboardTitle.trim()) return;
    if (dashboards.length >= 3) {
      alert('Máximo 3 pizarras por usuario');
      return;
    }

    try {
      setCreating(true);
      const newDashboard = await createDashboard(newDashboardTitle);
      setDashboards([...dashboards, newDashboard]);
      setSelectedDashboard(newDashboard);
      setShowCreateModal(false);
      setNewDashboardTitle('');
    } catch (error: any) {
      console.error('[Dashboards] Error creating:', error);
      alert(error.message || 'Error creando pizarra');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteDashboard = async (dashboard: Dashboard) => {
    if (!confirm(`¿Eliminar la pizarra "${dashboard.title}"?`)) return;

    try {
      await deleteDashboard(dashboard.id);
      const updated = dashboards.filter(d => d.id !== dashboard.id);
      setDashboards(updated);
      
      // If deleting selected dashboard, select another one
      if (selectedDashboard?.id === dashboard.id) {
        setSelectedDashboard(updated[0] || null);
      }
    } catch (error) {
      console.error('[Dashboards] Error deleting:', error);
      alert('Error eliminando pizarra');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando pizarras...</p>
        </div>
      </div>
    );
  }

  // No dashboards - Empty state
  if (dashboards.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md px-6"
        >
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <LayoutGrid className="h-16 w-16 text-purple-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Bienvenido a Pizarras
            </h2>
            <p className="text-gray-600 mb-6">
              Crea tu primera pizarra para organizar visualizaciones del chat en un dashboard personalizado.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="h-5 w-5" />
              Crear Primera Pizarra
            </button>
          </div>
        </motion.div>

        {/* Create Modal */}
        {showCreateModal && (
          <CreateDashboardModal
            title={newDashboardTitle}
            onTitleChange={setNewDashboardTitle}
            onSubmit={handleCreateDashboard}
            onCancel={() => {
              setShowCreateModal(false);
              setNewDashboardTitle('');
            }}
            creating={creating}
          />
        )}
      </div>
    );
  }

  // Main view - Dashboard selector + Canvas
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Bar - Dashboard Selector */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <LayoutGrid className="h-6 w-6 text-purple-600" />
            <h1 className="text-xl font-bold text-gray-900">Pizarras</h1>
            
            {/* Dashboard Tabs */}
            <div className="flex items-center gap-2 ml-4">
              {dashboards.map((dashboard) => (
                <button
                  key={dashboard.id}
                  onClick={() => setSelectedDashboard(dashboard)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${selectedDashboard?.id === dashboard.id
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-100'
                    }
                  `}
                >
                  {dashboard.title}
                </button>
              ))}
              
              {/* Add Dashboard Button */}
              {dashboards.length < 3 && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  title="Nueva pizarra"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Dashboard Actions */}
          {selectedDashboard && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {dashboards.length}/3 pizarras
              </span>
              <button
                onClick={() => handleDeleteDashboard(selectedDashboard)}
                className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                title="Eliminar pizarra"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {selectedDashboard && (
            <motion.div
              key={selectedDashboard.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <DashboardCanvas dashboard={selectedDashboard} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateDashboardModal
          title={newDashboardTitle}
          onTitleChange={setNewDashboardTitle}
          onSubmit={handleCreateDashboard}
          onCancel={() => {
            setShowCreateModal(false);
            setNewDashboardTitle('');
          }}
          creating={creating}
        />
      )}
    </div>
  );
}

// Create Dashboard Modal Component
interface CreateDashboardModalProps {
  title: string;
  onTitleChange: (title: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  creating: boolean;
}

function CreateDashboardModal({
  title,
  onTitleChange,
  onSubmit,
  onCancel,
  creating
}: CreateDashboardModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4"
      >
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Nueva Pizarra
        </h3>
        
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Nombre de la pizarra..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
          autoFocus
          onKeyPress={(e) => {
            if (e.key === 'Enter') onSubmit();
          }}
        />

        <div className="flex items-center gap-3">
          <button
            onClick={onSubmit}
            disabled={!title.trim() || creating}
            className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
          >
            {creating ? 'Creando...' : 'Crear'}
          </button>
          <button
            onClick={onCancel}
            disabled={creating}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
          >
            Cancelar
          </button>
        </div>
      </motion.div>
    </div>
  );
}


