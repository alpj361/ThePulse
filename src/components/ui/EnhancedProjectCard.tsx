import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  FiClock, 
  FiTarget, 
  FiCheckCircle,
  FiArchive,
  FiTrash2,
  FiEdit,
  FiDatabase,
  FiBox,
  FiLayers,
  FiUser,
  FiImage,
  FiRefreshCw,
  FiEye
} from 'react-icons/fi';
import { Card, CardContent } from './card';
import { cn } from '../../lib/utils';
import { Project } from '../../types/projects';

interface EnhancedProjectCardProps {
  project: Project;
  onView: (project: Project) => void;
  onEdit?: (project: Project) => void;
  onArchive?: (projectId: string) => void;
  onDelete?: (projectId: string) => void;
  decisionsCount?: number;
  assetsCount?: number;
  findingsCount?: number;
  lastActivity?: string;
  progress?: number; // 0-100
}

const statusConfig = {
  active: {
    color: 'bg-emerald-500',
    lightBg: 'bg-emerald-50/90 dark:bg-emerald-900/30',
    border: 'border-emerald-300 dark:border-emerald-700',
    text: 'text-emerald-700 dark:text-emerald-300',
    label: 'Activo',
    glow: 'shadow-emerald-500/50'
  },
  paused: {
    color: 'bg-amber-500',
    lightBg: 'bg-amber-50/90 dark:bg-amber-900/30',
    border: 'border-amber-300 dark:border-amber-700',
    text: 'text-amber-700 dark:text-amber-300',
    label: 'Pausado',
    glow: 'shadow-amber-500/50'
  },
  completed: {
    color: 'bg-blue-500',
    lightBg: 'bg-blue-50/90 dark:bg-blue-900/30',
    border: 'border-blue-300 dark:border-blue-700',
    text: 'text-blue-700 dark:text-blue-300',
    label: 'Completado',
    glow: 'shadow-blue-500/50'
  },
  archived: {
    color: 'bg-gray-500',
    lightBg: 'bg-gray-50/90 dark:bg-gray-900/30',
    border: 'border-gray-300 dark:border-gray-700',
    text: 'text-gray-700 dark:text-gray-300',
    label: 'Archivado',
    glow: 'shadow-gray-500/50'
  }
};

const priorityConfig = {
  low: { color: 'text-emerald-600 dark:text-emerald-400', label: 'Baja', badge: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' },
  medium: { color: 'text-amber-600 dark:text-amber-400', label: 'Media', badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' },
  high: { color: 'text-orange-600 dark:text-orange-400', label: 'Alta', badge: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300' },
  urgent: { color: 'text-red-600 dark:text-red-400', label: 'Urgente', badge: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' }
};

// Artistic gradient presets that users can choose from
const gradientPresets = [
  { 
    id: 'ocean',
    name: 'Ocean Breeze',
    gradient: 'from-blue-400 via-cyan-400 to-teal-400',
    darkGradient: 'dark:from-blue-900 dark:via-cyan-900 dark:to-teal-900'
  },
  { 
    id: 'sunset',
    name: 'Sunset',
    gradient: 'from-orange-400 via-pink-400 to-purple-400',
    darkGradient: 'dark:from-orange-900 dark:via-pink-900 dark:to-purple-900'
  },
  { 
    id: 'forest',
    name: 'Forest',
    gradient: 'from-emerald-400 via-green-400 to-lime-400',
    darkGradient: 'dark:from-emerald-900 dark:via-green-900 dark:to-lime-900'
  },
  { 
    id: 'cosmic',
    name: 'Cosmic',
    gradient: 'from-indigo-400 via-purple-400 to-pink-400',
    darkGradient: 'dark:from-indigo-900 dark:via-purple-900 dark:to-pink-900'
  },
  { 
    id: 'aurora',
    name: 'Aurora',
    gradient: 'from-cyan-400 via-blue-400 to-indigo-400',
    darkGradient: 'dark:from-cyan-900 dark:via-blue-900 dark:to-indigo-900'
  },
  { 
    id: 'dawn',
    name: 'Dawn',
    gradient: 'from-rose-400 via-orange-400 to-amber-400',
    darkGradient: 'dark:from-rose-900 dark:via-orange-900 dark:to-amber-900'
  }
];

export function EnhancedProjectCard({
  project,
  onView,
  onEdit,
  onArchive,
  onDelete,
  decisionsCount = 0,
  assetsCount = 0,
  findingsCount = 0,
  lastActivity,
  progress = 0
}: EnhancedProjectCardProps) {
  const status = statusConfig[project.status] || statusConfig.active;
  const priority = priorityConfig[project.priority] || priorityConfig.medium;
  
  // State for gradient selection
  const [showGradientPicker, setShowGradientPicker] = useState(false);
  const [selectedGradient, setSelectedGradient] = useState(gradientPresets[0]);

  // Calculate progress if not provided
  const calculatedProgress = progress || (project.status === 'completed' ? 100 : 0);

  const handleGradientChange = (gradient: typeof gradientPresets[0]) => {
    setSelectedGradient(gradient);
    setShowGradientPicker(false);
    // Here you could save the preference to localStorage or backend
    localStorage.setItem(`project-gradient-${project.id}`, gradient.id);
  };

  // Load saved gradient preference
  React.useEffect(() => {
    const savedGradientId = localStorage.getItem(`project-gradient-${project.id}`);
    if (savedGradientId) {
      const found = gradientPresets.find(g => g.id === savedGradientId);
      if (found) setSelectedGradient(found);
    }
  }, [project.id]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-full"
    >
      <Card className="group relative overflow-hidden border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl">
        {/* Glassmorphism Background with Artistic Gradient */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, 0]
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className={cn(
              "absolute -inset-10 bg-gradient-to-br opacity-20 dark:opacity-30 blur-3xl",
              selectedGradient.gradient,
              selectedGradient.darkGradient
            )}
          />
          {/* Animated mesh gradient overlay */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20" />
        </div>

        {/* Main Content */}
        <div className="relative z-10">
          {/* Header Section with Cover */}
          <div className="relative h-64 overflow-hidden">
            {/* Dynamic Gradient Background */}
            <motion.div
              className={cn(
                "absolute inset-0 bg-gradient-to-br",
                selectedGradient.gradient,
                selectedGradient.darkGradient
              )}
              animate={{
                backgroundPosition: ['0% 0%', '100% 100%', '0% 0%']
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "linear"
              }}
            />

            {/* Glassmorphism overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/80 dark:to-gray-900/80 backdrop-blur-[2px]" />

            {/* Gradient Picker Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowGradientPicker(!showGradientPicker)}
              className="absolute top-4 left-4 p-2.5 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/60 dark:border-gray-700/60 shadow-lg hover:shadow-xl transition-all duration-300 z-20"
              title="Cambiar gradiente"
            >
              <FiRefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </motion.button>

            {/* Gradient Picker Dropdown */}
            <AnimatePresence>
              {showGradientPicker && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute top-16 left-4 p-3 rounded-2xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-white/60 dark:border-gray-700/60 shadow-2xl z-30 min-w-[200px]"
                >
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 px-2">Selecciona un gradiente</p>
                  <div className="space-y-1">
                    {gradientPresets.map((gradient) => (
                      <motion.button
                        key={gradient.id}
                        whileHover={{ scale: 1.02, x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleGradientChange(gradient)}
                        className={cn(
                          "w-full flex items-center gap-3 p-2 rounded-xl transition-all duration-200",
                          selectedGradient.id === gradient.id
                            ? "bg-blue-100 dark:bg-blue-900/40 shadow-sm"
                            : "hover:bg-gray-100 dark:hover:bg-gray-700/50"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg bg-gradient-to-br shadow-md",
                          gradient.gradient
                        )} />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{gradient.name}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Status Badge */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="absolute top-4 right-4 z-20"
            >
              <span className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-xl border shadow-lg font-semibold text-sm",
                status.lightBg,
                status.border,
                status.text
              )}>
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={cn("w-2 h-2 rounded-full", status.color)}
                />
                {status.label}
              </span>
            </motion.div>

            {/* Category Badge */}
            {project.category && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="absolute bottom-4 left-4 z-20"
              >
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-full border border-white/60 dark:border-gray-700/60 shadow-lg">
                  <FiLayers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {project.category}
                  </span>
                </span>
              </motion.div>
            )}
          </div>

          {/* Content Section with Glassmorphism */}
          <CardContent className="p-8 relative">
            {/* Title and Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-6"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <h3 className="font-bold text-3xl text-gray-900 dark:text-white leading-tight tracking-tight">
                  {project.title}
                </h3>
                <span className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm border",
                  priority.badge
                )}>
                  {priority.label}
                </span>
              </div>
              {project.description && (
                <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3">
                  {project.description}
                </p>
              )}
            </motion.div>

            {/* Stats Grid with Glassmorphism */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-3 gap-4 mb-6"
            >
              <motion.div
                whileHover={{ scale: 1.05, y: -4 }}
                className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-blue-50/80 to-cyan-50/80 dark:from-blue-900/20 dark:to-cyan-900/20 backdrop-blur-xl border-2 border-blue-200/50 dark:border-blue-700/50 shadow-lg group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <FiTarget className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2" />
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">Decisiones</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{decisionsCount}</p>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05, y: -4 }}
                className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-purple-50/80 to-pink-50/80 dark:from-purple-900/20 dark:to-pink-900/20 backdrop-blur-xl border-2 border-purple-200/50 dark:border-purple-700/50 shadow-lg group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <FiDatabase className="w-6 h-6 text-purple-600 dark:text-purple-400 mb-2" />
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">Assets</p>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{assetsCount}</p>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05, y: -4 }}
                className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-teal-50/80 dark:from-emerald-900/20 dark:to-teal-900/20 backdrop-blur-xl border-2 border-emerald-200/50 dark:border-emerald-700/50 shadow-lg group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <FiBox className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mb-2" />
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">Hallazgos</p>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{findingsCount}</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Progress Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-6"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progreso</span>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{calculatedProgress}%</span>
              </div>
              <div className="relative h-3 bg-gray-200/50 dark:bg-gray-700/50 rounded-full overflow-hidden backdrop-blur-sm">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${calculatedProgress}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.7 }}
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 rounded-full shadow-lg"
                >
                  <motion.div
                    animate={{ x: ['0%', '100%', '0%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  />
                </motion.div>
              </div>
            </motion.div>

            {/* Footer with Last Activity */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex items-center justify-between pt-6 border-t-2 border-gray-200/50 dark:border-gray-700/50"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100/50 dark:bg-blue-900/30 backdrop-blur-sm">
                  <FiClock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Última actividad</p>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {lastActivity 
                      ? format(new Date(lastActivity), "d 'de' MMMM", { locale: es })
                      : format(new Date(project.created_at), "d 'de' MMMM", { locale: es })
                    }
                  </p>
                </div>
              </div>

              {/* View Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onView(project)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
              >
                <FiEye className="w-5 h-5" />
                Ver Proyecto
              </motion.button>
            </motion.div>

            {/* Quick Actions (Hidden until hover) */}
            <motion.div
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              className="absolute top-4 right-4 flex gap-2"
            >
              {onEdit && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(project);
                  }}
                  className="p-3 bg-blue-500/90 hover:bg-blue-600 text-white rounded-xl backdrop-blur-xl shadow-lg transition-colors"
                  title="Editar"
                >
                  <FiEdit className="w-4 h-4" />
                </motion.button>
              )}
              {onDelete && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(project.id);
                  }}
                  className="p-3 bg-red-500/90 hover:bg-red-600 text-white rounded-xl backdrop-blur-xl shadow-lg transition-colors"
                  title="Eliminar"
                >
                  <FiTrash2 className="w-4 h-4" />
                </motion.button>
              )}
            </motion.div>
          </CardContent>
        </div>
      </Card>
    </motion.div>
  );
}

export default EnhancedProjectCard;
