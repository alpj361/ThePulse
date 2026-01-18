export type ViewMode = 'normal' | 'beta';

export interface ViewModeContextType {
  viewMode: ViewMode;
  toggleViewMode: () => void;
  setViewMode: (mode: ViewMode) => void;
  isBetaView: boolean;
  isNormalView: boolean;
}
