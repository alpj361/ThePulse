import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiBrain, 
  FiTrendingUp, 
  FiAlertCircle, 
  FiCheckCircle,
  FiClock,
  FiTarget,
  FiActivity,
  FiRefreshCw
} from 'react-icons/fi';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Project } from '../../types/projects';

interface ProjectInsightsProps {
  project: Project;
  decisionsCount?: number;
  assetsCount?: number;
  findingsCount?: number;
  tasksCompleted?: number;
  totalTasks?: number;
}

export function ProjectInsights({
  project,
  decisionsCount = 0,
  assetsCount = 0,
  findingsCount = 0,
  tasksCompleted = 0,
  totalTasks = 0
}: ProjectInsightsProps) {
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Generate insights based on project data
  useEffect(() => {
    generateInsights();
  }, [project, decisionsCount, assetsCount, findingsCount, tasksCompleted, totalTasks]);

  const generateInsights = () => {
    const newInsights = [];

    // Progress insight
    const taskProgress = totalTasks > 0 ? (tasksCompleted / totalTasks) * 100 : 0;
    if (taskProgress > 0) {
      newInsights.push({
        type: taskProgress >= 75 ? 'success' : taskProgress >= 50 ? 'warning' : 'info',
        icon: FiCheckCircle,
        title: 'Progreso de Tareas',
        description: `Has completado ${tasksCompleted} de ${totalTasks} tareas (${Math.round(taskProgress)}%). ${
          taskProgress >= 75 
            ? '¡Excelente progreso! Estás cerca de completar este proyecto.' 
            : taskProgress >= 50 
              ? 'Buen avance, mantén el ritmo para alcanzar tus objetivos.'
              : 'Considera revisar tus prioridades para acelerar el progreso.'
        }`
      });
    }

    // Data collection insight
    if (assetsCount > 0 || findingsCount > 0) {
      newInsights.push({
        type: 'info',
        icon: FiActivity,
        title: 'Recopilación de Datos',
        description: `Has recopilado ${assetsCount} assets y ${findingsCount} hallazgos. ${
          findingsCount > 10 
            ? 'Excelente trabajo en la investigación. Considera organizar estos hallazgos en categorías para mejor análisis.'
            : findingsCount > 0
              ? 'Buen inicio en la recopilación. Continúa documentando hallazgos importantes.'
              : 'Empieza a documentar hallazgos clave para enriquecer tu proyecto.'
        }`
      });
    }

    // Decision-making insight
    if (decisionsCount > 0) {
      newInsights.push({
        type: 'success',
        icon: FiTarget,
        title: 'Toma de Decisiones',
        description: `Se han registrado ${decisionsCount} decisiones para este proyecto. ${
          decisionsCount >= 5
            ? 'Tienes un historial sólido de decisiones documentadas.'
            : 'Continúa documentando decisiones clave para mantener trazabilidad.'
        }`
      });
    }

    // Timeline insight
    if (project.start_date && project.target_date) {
      const startDate = new Date(project.start_date);
      const targetDate = new Date(project.target_date);
      const today = new Date();
      const totalDuration = targetDate.getTime() - startDate.getTime();
      const elapsed = today.getTime() - startDate.getTime();
      const timeProgress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
      
      newInsights.push({
        type: timeProgress > 75 && taskProgress < 75 ? 'warning' : 'info',
        icon: FiClock,
        title: 'Línea de Tiempo',
        description: `Ha transcurrido ${Math.round(timeProgress)}% del tiempo planificado. ${
          timeProgress > taskProgress + 20
            ? '⚠️ El progreso de tareas está por debajo del tiempo transcurrido. Considera ajustar prioridades o plazos.'
            : timeProgress < taskProgress
              ? '✓ Vas adelantado según el cronograma. ¡Excelente gestión del tiempo!'
              : 'Estás en buen ritmo según el tiempo planificado.'
        }`
      });
    }

    // Activity recommendation
    if (decisionsCount === 0 && findingsCount === 0 && totalTasks === 0) {
      newInsights.push({
        type: 'warning',
        icon: FiAlertCircle,
        title: 'Comenzar a Trabajar',
        description: 'Este proyecto está en sus primeras etapas. Te recomendamos: 1) Añadir tareas iniciales, 2) Comenzar a documentar hallazgos, 3) Registrar decisiones clave del proyecto.'
      });
    }

    // Status-based insight
    if (project.status === 'paused') {
      newInsights.push({
        type: 'warning',
        icon: FiAlertCircle,
        title: 'Proyecto en Pausa',
        description: 'Este proyecto está actualmente pausado. Considera retomar el trabajo o actualizar su estado si ya fue completado.'
      });
    }

    // Completion readiness
    if (project.status === 'active' && taskProgress >= 90 && decisionsCount > 0) {
      newInsights.push({
        type: 'success',
        icon: FiTrendingUp,
        title: 'Listo para Completar',
        description: '¡Casi terminas! Con un 90%+ de tareas completadas y decisiones documentadas, considera revisar los entregables finales y marcar el proyecto como completado.'
      });
    }

    setInsights(newInsights);
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-200 dark:border-green-800',
          icon: 'text-green-600 dark:text-green-400',
          text: 'text-green-700 dark:text-green-300'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          border: 'border-yellow-200 dark:border-yellow-800',
          icon: 'text-yellow-600 dark:text-yellow-400',
          text: 'text-yellow-700 dark:text-yellow-300'
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800',
          icon: 'text-blue-600 dark:text-blue-400',
          text: 'text-blue-700 dark:text-blue-300'
        };
    }
  };

  return (
    <Card className="border-2 border-blue-100 dark:border-blue-900/30">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiBrain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span>Pensamientos e Insights del Proyecto</span>
          </div>
          <button
            onClick={generateInsights}
            className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
            title="Regenerar insights"
          >
            <FiRefreshCw className="w-4 h-4" />
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <FiRefreshCw className="w-8 h-8 animate-spin text-purple-600 dark:text-purple-400" />
          </div>
        ) : insights.length > 0 ? (
          <div className="space-y-4">
            {insights.map((insight, index) => {
              const colors = getInsightColor(insight.type);
              const Icon = insight.icon;
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border-2 ${colors.bg} ${colors.border}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-white dark:bg-gray-800 ${colors.icon}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-semibold text-sm mb-1 ${colors.text}`}>
                        {insight.title}
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <FiBrain className="w-12 h-12 mx-auto mb-4 text-gray-400 opacity-50" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Los insights se generarán automáticamente a medida que avances en el proyecto.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ProjectInsights;
