import React from 'react';
import { motion } from 'framer-motion';
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
  FiImage
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
    color: 'bg-green-500',
    lightBg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-700 dark:text-green-300',
    label: 'Activo'
  },
  paused: {
    color: 'bg-yellow-500',
    lightBg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-700 dark:text-yellow-300',
    label: 'Pausado'
  },
  completed: {
    color: 'bg-blue-500',
    lightBg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
    label: 'Completado'
  },
  archived: {
    color: 'bg-gray-500',
    lightBg: 'bg-gray-50 dark:bg-gray-900/20',
    border: 'border-gray-200 dark:border-gray-800',
    text: 'text-gray-700 dark:text-gray-300',
    label: 'Archivado'
  }
};

const priorityConfig = {
  low: { color: 'text-green-600 dark:text-green-400', label: 'Baja' },
  medium: { color: 'text-yellow-600 dark:text-yellow-400', label: 'Media' },
  high: { color: 'text-orange-600 dark:text-orange-400', label: 'Alta' },
  urgent: { color: 'text-red-600 dark:text-red-400', label: 'Urgente' }
};

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

  // Calculate progress if not provided (based on completion)
  const calculatedProgress = progress || (project.status === 'completed' ? 100 : 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className="group relative overflow-hidden border-2 border-blue-100 dark:border-blue-900/30 hover:border-blue-300 dark:hover:border-blue-700/50 hover:shadow-xl hover:shadow-blue-100/50 dark:hover:shadow-blue-900/20 transition-all duration-300 cursor-pointer"
        onClick={() => onView(project)}
      >
        {/* Cover Image or Gradient Background */}
        <div className="relative h-32 bg-gradient-to-br from-blue-500 via-blue-400 to-cyan-400 dark:from-blue-900 dark:via-blue-800 dark:to-cyan-900 overflow-hidden">
          {project.cover_image ? (
            <img 
              src={project.cover_image} 
              alt={project.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-blue-400/20 to-cyan-400/20 backdrop-blur-3xl" />
          )}
          
          {/* Category Badge */}
          {project.category && (
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full shadow-sm">
                <FiLayers className="w-3 h-3" />
                {project.category}
              </span>
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <span className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 backdrop-blur-sm text-xs font-semibold rounded-full shadow-sm",
              status.lightBg,
              status.border,
              status.text
            )}>
              <span className={cn("w-2 h-2 rounded-full", status.color)} />
              {status.label}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/30 dark:bg-gray-900/30">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${calculatedProgress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
            />
          </div>
        </div>

        <CardContent className="p-5">
          {/* Title and Priority */}
          <div className="mb-3">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 leading-tight flex-1">
                {project.title}
              </h3>
              <span className={cn("text-xs font-bold", priority.color)}>
                {priority.label}
              </span>
            </div>
            {project.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {project.description}
              </p>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <FiTarget className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">Decisiones</p>
                <p className="text-sm font-bold text-blue-700 dark:text-blue-300">{decisionsCount}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <FiDatabase className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">Assets</p>
                <p className="text-sm font-bold text-purple-700 dark:text-purple-300">{assetsCount}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <FiBox className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">Hallazgos</p>
                <p className="text-sm font-bold text-green-700 dark:text-green-300">{findingsCount}</p>
              </div>
            </div>
          </div>

          {/* Team Members (if available) */}
          {project.collaborators && project.collaborators.length > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <FiUser className="w-3.5 h-3.5 text-gray-500" />
              <div className="flex -space-x-2">
                {project.collaborators.slice(0, 3).map((collab, idx) => (
                  <div
                    key={idx}
                    className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white dark:border-gray-800 flex items-center justify-center text-white text-xs font-semibold"
                  >
                    {collab.charAt(0).toUpperCase()}
                  </div>
                ))}
                {project.collaborators.length > 3 && (
                  <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-semibold">
                    +{project.collaborators.length - 3}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Last Activity */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <FiClock className="w-3.5 h-3.5" />
              <span>
                {lastActivity 
                  ? `Actualizado ${format(new Date(lastActivity), "d 'de' MMMM", { locale: es })}`
                  : `Creado ${format(new Date(project.created_at), "d 'de' MMMM", { locale: es })}`
                }
              </span>
            </div>
            
            {/* Progress Percentage */}
            <div className="flex items-center gap-2">
              <FiCheckCircle className={cn(
                "w-4 h-4",
                calculatedProgress === 100 ? "text-green-600" : "text-gray-400"
              )} />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {calculatedProgress}%
              </span>
            </div>
          </div>

          {/* Action Buttons (Shown on Hover) */}
          <div className="absolute bottom-5 right-5 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(project);
                }}
                className="p-2 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600 transition-colors"
                title="Editar"
              >
                <FiEdit className="w-4 h-4" />
              </button>
            )}
            {onArchive && project.status !== 'archived' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onArchive(project.id);
                }}
                className="p-2 bg-gray-500 text-white rounded-lg shadow-lg hover:bg-gray-600 transition-colors"
                title="Archivar"
              >
                <FiArchive className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(project.id);
                }}
                className="p-2 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600 transition-colors"
                title="Eliminar"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default EnhancedProjectCard;
