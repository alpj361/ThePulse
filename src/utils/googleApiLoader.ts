let gsiPromise: Promise<void> | null = null;
let gapiPromise: Promise<void> | null = null;
let sheetsPromise: Promise<void> | null = null;

export const loadGsi = (): Promise<void> => {
  console.log('🟦 [GoogleApiLoader] loadGsi() llamado');
  if (gsiPromise) {
    console.log('🟦 [GoogleApiLoader] GSI ya está cargándose, retornando promesa existente');
    return gsiPromise;
  }
  
  gsiPromise = new Promise((resolve, reject) => {
    // Si ya está cargado, resolver inmediatamente
    if ((window as any).google?.accounts?.oauth2) {
      console.log('🟩 [GoogleApiLoader] GSI ya estaba cargado');
      return resolve();
    }
    
    console.log('🟦 [GoogleApiLoader] Cargando script GSI...');
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.id = 'google-gsi-script';
    script.onload = () => {
      console.log('🟦 [GoogleApiLoader] Script GSI cargado, verificando API...');
      // Esperar a que la API esté disponible con reintentos
      const checkGsiApi = (attempts = 0) => {
        if ((window as any).google?.accounts?.oauth2) {
          console.log('🟩 [GoogleApiLoader] GSI API disponible');
          resolve();
        } else if (attempts < 10) {
          console.log(`🟧 [GoogleApiLoader] GSI API no disponible aún, reintentando... (${attempts + 1}/10)`);
          setTimeout(() => checkGsiApi(attempts + 1), 200);
        } else {
          console.error('🟥 [GoogleApiLoader] GSI API no disponible después de 10 intentos');
          reject(new Error('GSI API no expone oauth2 después de cargar'));
        }
      };
      checkGsiApi();
    };
    script.onerror = (error) => {
      console.error('🟥 [GoogleApiLoader] Error cargando script GSI:', error);
      reject(error);
    };
    document.body.appendChild(script);
  });
  
  return gsiPromise;
};

export const loadGapiPicker = async (): Promise<void> => {
  console.log('🟦 [GoogleApiLoader] loadGapiPicker() llamado');
  if (gapiPromise) {
    console.log('🟦 [GoogleApiLoader] GAPI Picker ya está cargándose, retornando promesa existente');
    return gapiPromise;
  }
  
  // Garantizar que GSI se carga primero
  await loadGsi();
  
  gapiPromise = new Promise((resolve, reject) => {
    // Si ya está cargado, resolver inmediatamente
    if ((window as any).gapi && (window as any).google?.picker) {
      console.log('🟩 [GoogleApiLoader] GAPI Picker ya estaba cargado');
      return resolve();
    }
    
    console.log('🟦 [GoogleApiLoader] Cargando script GAPI...');
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.id = 'google-gapi-script';
    script.onload = () => {
      console.log('🟦 [GoogleApiLoader] Script GAPI cargado, cargando client:picker...');
      (window as any).gapi.load('client:picker', {
        callback: () => {
          console.log('🟩 [GoogleApiLoader] GAPI client:picker cargado');
          resolve();
        },
        onerror: (error: any) => {
          console.error('🟥 [GoogleApiLoader] Error cargando GAPI client:picker:', error);
          reject(error);
        }
      });
    };
    script.onerror = (error) => {
      console.error('🟥 [GoogleApiLoader] Error cargando script GAPI:', error);
      reject(error);
    };
    document.body.appendChild(script);
  });
  
  return gapiPromise;
};

// Función de utilidad para esperar a que GSI esté disponible
export const waitForGsi = async (retries = 10): Promise<void> => {
  console.log('🟦 [GoogleApiLoader] waitForGsi() llamado');
  while (!((window as any).google?.accounts?.oauth2)) {
    if (retries-- === 0) {
      console.error('🟥 [GoogleApiLoader] GSI API nunca se cargó después de esperar');
      throw new Error('GSI API never loaded');
    }
    console.log('🟧 [GoogleApiLoader] Esperando a que GSI esté disponible...');
    await new Promise(r => setTimeout(r, 300));
  }
  console.log('🟩 [GoogleApiLoader] GSI está disponible');
};

// Cargar Google Sheets API
export const loadSheetsApi = async (): Promise<void> => {
  console.log('🟦 [GoogleApiLoader] loadSheetsApi() llamado');
  if (sheetsPromise) {
    console.log('🟦 [GoogleApiLoader] Sheets API ya está cargándose, retornando promesa existente');
    return sheetsPromise;
  }

  // Garantizar que GAPI se carga primero
  await loadGapiPicker();

  sheetsPromise = new Promise((resolve, reject) => {
    // Si ya está cargado, resolver inmediatamente
    if ((window as any).gapi?.client?.sheets) {
      console.log('🟩 [GoogleApiLoader] Sheets API ya estaba cargada');
      return resolve();
    }

    console.log('🟦 [GoogleApiLoader] Cargando Sheets API...');
    (window as any).gapi.client.load('sheets', 'v4').then(
      () => {
        console.log('🟩 [GoogleApiLoader] Sheets API cargada exitosamente');
        resolve();
      },
      (error: any) => {
        console.error('🟥 [GoogleApiLoader] Error cargando Sheets API:', error);
        reject(error);
      }
    );
  });

  return sheetsPromise;
}; 