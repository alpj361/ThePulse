// Configuración centralizada de Google APIs
export const GOOGLE_CLIENT_ID = '791862052938-000vods8guv7damvnt2gonrmo6vjtopd.apps.googleusercontent.com';
export const GOOGLE_DEVELOPER_KEY = 'AIzaSyDjBjZCXVX5e8goox4m5r848moPeBOuN44';

// Scopes para Google Drive y Google Sheets
export const GOOGLE_DRIVE_SCOPES = [
  // Permisos de creación/lectura sobre archivos creados o abiertos con la app
  'https://www.googleapis.com/auth/drive.file',
  // Acceso completo a Google Drive (para importar cualquier archivo)
  'https://www.googleapis.com/auth/drive',
  // Acceso de solo lectura a Google Sheets (para sincronización)
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'openid',
  'email',
  'profile'
].join(' ');

// Mapeo de errores de Google OAuth
export const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
  'popup_closed_by_user': 'Cerraste el diálogo de Google. Intenta de nuevo.',
  'access_denied': 'No concediste permisos a Google Drive. Necesitamos acceso para importar archivos.',
  'invalid_client': 'Error de configuración del cliente. Contacta al administrador.',
  'invalid_request': 'Solicitud inválida. Intenta recargar la página.',
  'unauthorized_client': 'Cliente no autorizado. Verifica la configuración.',
  'unsupported_response_type': 'Tipo de respuesta no soportado.',
  'invalid_scope': 'Permisos inválidos solicitados.',
  'server_error': 'Error del servidor de Google. Intenta más tarde.',
  'temporarily_unavailable': 'Servicio temporalmente no disponible. Intenta más tarde.',
};

// Función para obtener mensaje de error amigable
export const getGoogleErrorMessage = (error: string): string => {
  return GOOGLE_ERROR_MESSAGES[error] || `Error de Google OAuth: ${error}`;
};

// Función para verificar si un error es recuperable
export const isRecoverableGoogleError = (error: string): boolean => {
  const recoverableErrors = [
    'popup_closed_by_user',
    'access_denied',
    'server_error',
    'temporarily_unavailable'
  ];
  return recoverableErrors.includes(error);
}; 