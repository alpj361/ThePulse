// Dashboard Theme Palettes
// Inspired by modern dashboard designs

export interface DashboardTheme {
  id: string;
  name: string;
  emoji: string;
  colors: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    surfaceLight: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    gradient: string;
  };
}

export const dashboardThemes: DashboardTheme[] = [
  {
    id: 'emerald',
    name: 'Verde Esmeralda',
    emoji: '🟢',
    colors: {
      primary: '#10b981',
      primaryLight: '#34d399',
      primaryDark: '#059669',
      secondary: '#14532d',
      accent: '#6ee7b7',
      background: '#f9fafb',
      surface: '#ffffff',
      surfaceLight: '#f0fdf4',
      text: '#111827',
      textSecondary: '#6b7280',
      border: '#d1d5db',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
    }
  },
  {
    id: 'ocean',
    name: 'Azul Océano',
    emoji: '🔵',
    colors: {
      primary: '#3b82f6',
      primaryLight: '#60a5fa',
      primaryDark: '#2563eb',
      secondary: '#1e3a8a',
      accent: '#93c5fd',
      background: '#f9fafb',
      surface: '#ffffff',
      surfaceLight: '#eff6ff',
      text: '#111827',
      textSecondary: '#6b7280',
      border: '#d1d5db',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)'
    }
  },
  {
    id: 'purple',
    name: 'Púrpura Moderno',
    emoji: '🟣',
    colors: {
      primary: '#8b5cf6',
      primaryLight: '#a78bfa',
      primaryDark: '#7c3aed',
      secondary: '#4c1d95',
      accent: '#c4b5fd',
      background: '#f9fafb',
      surface: '#ffffff',
      surfaceLight: '#f5f3ff',
      text: '#111827',
      textSecondary: '#6b7280',
      border: '#d1d5db',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)'
    }
  },
  {
    id: 'rose',
    name: 'Rosa Suave',
    emoji: '🌸',
    colors: {
      primary: '#f43f5e',
      primaryLight: '#fb7185',
      primaryDark: '#e11d48',
      secondary: '#881337',
      accent: '#fda4af',
      background: '#f9fafb',
      surface: '#ffffff',
      surfaceLight: '#fff1f2',
      text: '#111827',
      textSecondary: '#6b7280',
      border: '#d1d5db',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      gradient: 'linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)'
    }
  },
  {
    id: 'orange',
    name: 'Naranja Vibrante',
    emoji: '🟠',
    colors: {
      primary: '#f97316',
      primaryLight: '#fb923c',
      primaryDark: '#ea580c',
      secondary: '#7c2d12',
      accent: '#fdba74',
      background: '#f9fafb',
      surface: '#ffffff',
      surfaceLight: '#fff7ed',
      text: '#111827',
      textSecondary: '#6b7280',
      border: '#d1d5db',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      gradient: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)'
    }
  },
  {
    id: 'dark',
    name: 'Modo Oscuro',
    emoji: '⚫',
    colors: {
      primary: '#6366f1',
      primaryLight: '#818cf8',
      primaryDark: '#4f46e5',
      secondary: '#312e81',
      accent: '#a5b4fc',
      background: '#0f172a',
      surface: '#1e293b',
      surfaceLight: '#334155',
      text: '#f1f5f9',
      textSecondary: '#94a3b8',
      border: '#475569',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      gradient: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)'
    }
  }
];

export const getThemeById = (id: string): DashboardTheme => {
  return dashboardThemes.find(theme => theme.id === id) || dashboardThemes[0];
};

export const getDefaultTheme = (): DashboardTheme => dashboardThemes[0];
