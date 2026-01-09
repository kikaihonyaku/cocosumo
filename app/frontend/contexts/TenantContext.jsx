import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const TenantContext = createContext();

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

export const TenantProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [currentTenant, setCurrentTenant] = useState(null);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [originalTenant, setOriginalTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_BASE = '/api/v1';

  const fetchTenantInfo = useCallback(async () => {
    if (!isAuthenticated) {
      setCurrentTenant(null);
      setIsImpersonating(false);
      setOriginalTenant(null);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentTenant(data.tenant);
        setIsImpersonating(data.impersonating || false);
        setOriginalTenant(data.original_tenant || null);
      }
    } catch (error) {
      console.error('テナント情報の取得に失敗:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchTenantInfo();
  }, [fetchTenantInfo]);

  const impersonate = async (tenantId) => {
    try {
      const response = await fetch(`${API_BASE}/super_admin/tenants/${tenantId}/impersonate`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentTenant(data.tenant);
        setIsImpersonating(true);
        return { success: true };
      }
      const error = await response.json();
      return { success: false, error: error.error };
    } catch (error) {
      return { success: false, error: 'エラーが発生しました' };
    }
  };

  const stopImpersonation = async () => {
    try {
      const response = await fetch(`${API_BASE}/super_admin/tenants/stop_impersonation`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        setIsImpersonating(false);
        setOriginalTenant(null);
        await fetchTenantInfo();
        return { success: true };
      }
    } catch (error) {
      return { success: false, error: 'エラーが発生しました' };
    }
  };

  const value = {
    currentTenant,
    isImpersonating,
    originalTenant,
    loading,
    impersonate,
    stopImpersonation,
    refreshTenant: fetchTenantInfo,
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};
