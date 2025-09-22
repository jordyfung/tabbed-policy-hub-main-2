import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Permission {
  id: string;
  tab_id: string;
  subtab_id: string;
  is_enabled: boolean;
}

interface PermissionsContextType {
  permissions: Permission[];
  loading: boolean;
  getEnabledSubTabs: (tabId: string) => string[];
  toggleSubTabPermission: (tabId: string, subTabId: string) => Promise<void>;
  refreshPermissions: () => Promise<void>;
  isSubTabEnabled: (tabId: string, subTabId: string) => boolean;
}

const PermissionsContext = createContext<PermissionsContextType>({
  permissions: [],
  loading: true,
  getEnabledSubTabs: () => [],
  toggleSubTabPermission: async () => {},
  refreshPermissions: async () => {},
  isSubTabEnabled: () => true,
});

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
};

interface PermissionsProviderProps {
  children: ReactNode;
}

export const PermissionsProvider = ({ children }: PermissionsProviderProps) => {
  const { isAdmin, isSuperAdmin } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('admin_permissions')
        .select('*')
        .order('tab_id', { ascending: true })
        .order('subtab_id', { ascending: true });

      if (error) {
        console.error('Error fetching permissions:', error);
        return;
      }

      setPermissions(data || []);
    } catch (error) {
      console.error('Error fetching permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, [isAdmin]);

  const getEnabledSubTabs = (tabId: string): string[] => {
    return permissions
      .filter(p => p.tab_id === tabId && p.is_enabled)
      .map(p => p.subtab_id);
  };

  const isSubTabEnabled = (tabId: string, subTabId: string): boolean => {
    const permission = permissions.find(p => p.tab_id === tabId && p.subtab_id === subTabId);
    
    // Super admin can see everything, but permissions page should reflect actual status
    if (isSuperAdmin) {
      return permission?.is_enabled ?? true;
    }
    
    // Regular admins see based on permissions
    if (isAdmin) {
      return permission?.is_enabled ?? true; // Default to enabled if not found
    }
    
    // Staff users always see their allowed tabs
    return ['policies', 'training'].includes(tabId);
  };

  const toggleSubTabPermission = async (tabId: string, subTabId: string) => {
    if (!isSuperAdmin) return;

    try {
      const permission = permissions.find(p => p.tab_id === tabId && p.subtab_id === subTabId);
      if (!permission) return;

      const { error } = await supabase
        .from('admin_permissions')
        .update({ is_enabled: !permission.is_enabled })
        .eq('id', permission.id);

      if (error) {
        console.error('Error toggling permission:', error);
        return;
      }

      // Update local state
      setPermissions(prev => 
        prev.map(p => 
          p.id === permission.id 
            ? { ...p, is_enabled: !p.is_enabled }
            : p
        )
      );
    } catch (error) {
      console.error('Error toggling permission:', error);
    }
  };

  const refreshPermissions = async () => {
    setLoading(true);
    await fetchPermissions();
  };

  const value = {
    permissions,
    loading,
    getEnabledSubTabs,
    toggleSubTabPermission,
    refreshPermissions,
    isSubTabEnabled,
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};