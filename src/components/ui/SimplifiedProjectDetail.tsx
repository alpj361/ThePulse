import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  FiX, 
  FiEdit, 
  FiCheckCircle,
  FiDatabase,
  FiCheckSquare,
  FiBox,
  FiLayers,
  FiCpu,
  FiArrowLeft
} from 'react-icons/fi';
import { Card } from './card';
import { Project } from '../../types/projects';
import ProjectInsights from './ProjectInsights';
import CapturedCards from './CapturedCards';
import ProjectCoverages from '../coverages/ProjectCoverages';
import { cn } from '../../lib/utils';

interface SimplifiedProjectDetailProps {
  project: Project;
  onClose: () => void;
  onEdit?: () => void;
  decisionsCount?: number;
  assetsCount?: number;
  findingsCount?: number;
  tasksCompleted?: number;
  totalTasks?: number;
  children?: React.ReactNode;
}

const sections = [
  { id: 'insights', label: 'Pensamientos', icon: FiCpu },
  { id: 'decisions', label: 'Decisiones', icon: FiCheckCircle },
  { id: 'assets', label: 'Codex/Assets', icon: FiDatabase },
  { id: 'tasks', label: 'Tareas', icon: FiCheckSquare },
  { id: 'findings', label: 'Capturados', icon: FiBox },
  { id: 'coverages', label: 'Coberturas', icon: FiLayers },
];

export function SimplifiedProjectDetail({
  project,
  onClose,
  onEdit,
  decisionsCount = 0,
  assetsCount = 0,
  findingsCount = 0,
  tasksCompleted = 0,
  totalTasks = 0,
  children
}: SimplifiedProjectDetailProps) {
  const [activeSection, setActiveSection] = useState('insights');
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    sectionRefs.current[sectionId]?.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with Cover Image */}
      <div className="relative h-48 bg-gradient-to-br from-blue-500 via-blue-400 to-cyan-400 dark:from-blue-900 dark:via-blue-800 dark:to-cyan-900">
        {project.cover_image && (
          <img 
            src={project.cover_image} 
            alt={project.title}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        
        {/* Header Actions */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg shadow-lg hover:bg-white dark:hover:bg-gray-900 transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span className="font-medium">Volver a Proyectos</span>
          </button>
          
          {onEdit && (
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
            >
              <FiEdit className="w-4 h-4" />
              <span className="font-medium">Editar Proyecto</span>
            </button>
          )}
        </div>

        {/* Project Title */}
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-3xl font-bold text-white mb-2">{project.title}</h1>
          {project.description && (
            <p className="text-white/90 text-sm">{project.description}</p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-8">
        {/* Stats Overview Card */}
        <Card className="mb-6 border-2 border-blue-100 dark:border-blue-900/30 shadow-xl">
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {decisionsCount}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Decisiones</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {assetsCount}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Assets</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {tasksCompleted}/{totalTasks}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Tareas</div>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {findingsCount}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Hallazgos</div>
              </div>
            </div>
          </div>
        </Card>

        <div className="flex gap-6">
          {/* Sticky Section Navigation */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-4">
              <Card className="p-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Navegación
                </h3>
                <nav className="space-y-1">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                          activeSection === section.id
                            ? "bg-blue-500 text-white shadow-md"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{section.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </Card>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 space-y-6 pb-12">
            {/* Insights Section */}
            <div 
              ref={(el) => (sectionRefs.current['insights'] = el)}
              id="insights-section"
            >
              <ProjectInsights
                project={project}
                decisionsCount={decisionsCount}
                assetsCount={assetsCount}
                findingsCount={findingsCount}
                tasksCompleted={tasksCompleted}
                totalTasks={totalTasks}
              />
            </div>

            {/* Decisions Section */}
            <div 
              ref={(el) => (sectionRefs.current['decisions'] = el)}
              id="decisions-section"
            >
              <Card className="border-2 border-blue-100 dark:border-blue-900/30">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FiCheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h2 className="text-xl font-bold">Decisiones</h2>
                  </div>
                  {children && React.Children.toArray(children).find((child: any) => 
                    child?.props?.id === 'decisions-content'
                  )}
                </div>
              </Card>
            </div>

            {/* Assets Section */}
            <div 
              ref={(el) => (sectionRefs.current['assets'] = el)}
              id="assets-section"
            >
              <Card className="border-2 border-blue-100 dark:border-blue-900/30">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FiDatabase className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <h2 className="text-xl font-bold">Codex y Assets</h2>
                  </div>
                  {children && React.Children.toArray(children).find((child: any) => 
                    child?.props?.id === 'assets-content'
                  )}
                </div>
              </Card>
            </div>

            {/* Tasks Section */}
            <div 
              ref={(el) => (sectionRefs.current['tasks'] = el)}
              id="tasks-section"
            >
              <Card className="border-2 border-blue-100 dark:border-blue-900/30">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FiCheckSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <h2 className="text-xl font-bold">Tareas</h2>
                  </div>
                  {children && React.Children.toArray(children).find((child: any) => 
                    child?.props?.id === 'tasks-content'
                  )}
                </div>
              </Card>
            </div>

            {/* Findings Section */}
            <div 
              ref={(el) => (sectionRefs.current['findings'] = el)}
              id="findings-section"
            >
              <CapturedCards projectId={project.id} />
            </div>

            {/* Coverages Section */}
            <div 
              ref={(el) => (sectionRefs.current['coverages'] = el)}
              id="coverages-section"
            >
              <ProjectCoverages projectId={project.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SimplifiedProjectDetail;
