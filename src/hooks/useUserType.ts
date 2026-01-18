import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';

export type UserType = 'Alpha' | 'Beta' | 'Admin' | 'Creador';

export function useUserType() {
  const [userType, setUserType] = useState<UserType>('Beta');
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchUserType() {
      if (!user) {
        setUserType('Beta');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_type, role')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user type:', error);
          setUserType('Beta');
        } else {
          // Si es admin, siempre permitir acceso completo
          if (data?.role === 'admin') {
            setUserType('Admin');
          } else {
            setUserType((data?.user_type as UserType) || 'Beta');
          }
        }
      } catch (error) {
        console.error('Error fetching user type:', error);
        setUserType('Beta');
      } finally {
        setLoading(false);
      }
    }

    fetchUserType();
  }, [user]);

  // Helper functions
  const isAlpha = userType === 'Alpha';
  const isBeta = userType === 'Beta';
  const isAdmin = userType === 'Admin';
  const isCreador = userType === 'Creador';

  // Beta users (but not Alpha) should not see Projects and Activity unless they're admin
  const shouldHideProjectsAndActivity = isBeta && !isAlpha && !isAdmin;

  // Alpha or Admin users have access to advanced features like Google Drive/Sheets import
  const hasAdvancedFeatures = isAlpha || isAdmin;

  return {
    userType,
    loading,
    isAlpha,
    isBeta,
    isAdmin,
    isCreador,
    shouldHideProjectsAndActivity,
    hasAdvancedFeatures
  };
}
