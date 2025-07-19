import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

// Definir el tipo del contexto
type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAdmin: () => Promise<boolean>;  // Nuevo método para verificar admin
};

// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Proveedor de contexto
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtener sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔍 AuthContext - Sesión inicial:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔍 AuthContext - Auth state change:', event, session?.user?.email);
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Función para cerrar sesión
  const signOut = async () => {
    try {
      // Limpiar estado inmediatamente
      setSession(null);
      setUser(null);
      
      // Llamar a signOut de Supabase
      await supabase.auth.signOut();
      
      // Limpiar almacenamiento local
      localStorage.clear();
      sessionStorage.clear();
      
    } catch (error) {
      console.error("Error en signOut de Supabase:", error);
      // Incluso si hay error, limpiar estado local
      setSession(null);
      setUser(null);
      // Limpiar almacenamiento local incluso si hay error
      localStorage.clear();
      sessionStorage.clear();
    }
  };

  // Método para verificar si el usuario es admin
  const isAdmin = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      // Consultar el perfil del usuario en Supabase
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error verificando rol de admin:', error);
        return false;
      }

      return data?.role === 'admin';
    } catch (error) {
      console.error('Error en verificación de admin:', error);
      return false;
    }
  };

  // Valor del contexto
  const value = {
    session,
    user,
    loading,
    signOut,
    isAdmin  // Agregar el nuevo método
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook personalizado para usar el contexto
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
} 