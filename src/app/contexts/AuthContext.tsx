'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import apiService, { ApiError, User, Permission } from '@/app/services/api';

type LoginResult = {
  requiresTenantSetup: boolean;
};

interface AuthContextType {
  user: User | null;
  activeTenant: import('@/app/services/api').Tenant | null;
  availableTenants: import('@/app/services/api').Tenant[];
  switchTenant: (tenantId: string) => Promise<void>;
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string,
    tenantName: string,
  ) => Promise<void>;
  completeInvitation: (token: string, name: string, password: string, passwordConfirmation: string) => Promise<void>;
  refreshUser: () => Promise<User | null>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  loading: boolean;
  can: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [activeTenant, setActiveTenant] = useState<import('@/app/services/api').Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  const applyAuthenticatedUser = (userData: User) => {
    setUser(userData);

    const savedTenantId = localStorage.getItem('activeTenantId');
    const savedTenant = savedTenantId && userData.tenants
      ? userData.tenants.find(t => t.id === savedTenantId)
      : null;
    const defaultTenant = savedTenant || userData.tenant || userData.tenants?.[0] || null;

    setActiveTenant(defaultTenant);

    if (defaultTenant) {
      localStorage.setItem('activeTenantId', defaultTenant.id);
    } else {
      localStorage.removeItem('activeTenantId');
    }
  };

  const redirectToTenantSetup = () => {
    setUser(null);
    setActiveTenant(null);
    localStorage.removeItem('activeTenantId');

    if (typeof window !== 'undefined' && window.location.pathname !== '/setup-tenant') {
      window.location.href = '/setup-tenant';
    }
  };

  const clearAuthSession = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('activeTenantId');
    apiService.setToken(null);
    setUser(null);
    setActiveTenant(null);
  };

  useEffect(() => {
    console.log('AuthContext: Checking authentication status...');
    // Check if user is already authenticated
    const token = localStorage.getItem('authToken');
    console.log('AuthContext: Token found:', !!token);

    if (token) {
      apiService.setToken(token);
      console.log('AuthContext: Attempting to get authenticated user...');
      apiService.getAuthenticatedUser()
        .then((response) => {
          console.log('AuthContext: getAuthenticatedUser response:', response);
          const r = response as Record<string, unknown>;
          if (r.success === true) {
            console.log('AuthContext: User authenticated successfully');
            applyAuthenticatedUser(r.user as User);
          } else {
            console.log('AuthContext: Authentication failed, response:', response);
          }
        })
        .catch((error) => {
          console.error('AuthContext: Error getting authenticated user:', error);
          if (error instanceof ApiError && error.status === 409) {
            redirectToTenantSetup();
            return;
          }
          // Token is invalid, clear it
          clearAuthSession();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      console.log('AuthContext: No token found, user not authenticated');
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.login(email, password);
      const r = response as Record<string, unknown>;

      // Handle tenant setup required (409 response)
      if (r.requires_tenant_setup === true) {
        const token = String(r.token ?? '');
        if (token) {
          localStorage.setItem('authToken', token);
          apiService.setToken(token);
        }
        setUser(null);
        setActiveTenant(null);
        localStorage.removeItem('activeTenantId');
        return { requiresTenantSetup: true };
      }

      if (r.success === true) {
        const token = String(r.token ?? r.access_token ?? '');
        if (!token) {
          throw new Error('Login response did not include an auth token');
        }
        localStorage.setItem('authToken', token);
        apiService.setToken(token);
        applyAuthenticatedUser(r.user as User);
        return { requiresTenantSetup: false };
      } else {
        throw new Error(String((r as Record<string, unknown>).message ?? 'Login failed'));
      }
    } catch (error) {
      throw error;
    }
  };

  const refreshUser = async () => {
    const response = await apiService.getAuthenticatedUser();
    const r = response as Record<string, unknown>;

    if (r.success === true) {
      const userData = r.user as User;
      applyAuthenticatedUser(userData);
      return userData;
    }

    throw new Error(String(r.message ?? 'Failed to refresh authenticated user'));
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string,
    tenantName: string,
  ) => {
    try {
      const response = await apiService.register(name, email, password, passwordConfirmation, tenantName);
      const r = response as Record<string, unknown>;
      if (r.success === true) {
        return;
      } else {
        throw new Error(String((r as Record<string, unknown>).message ?? 'Registration failed'));
      }
    } catch (error) {
      throw error;
    }
  };

  const completeInvitation = async (token: string, name: string, password: string, passwordConfirmation: string) => {
    const response = await apiService.completeInvitation(token, {
      name,
      password,
      password_confirmation: passwordConfirmation,
    });
    const r = response as Record<string, unknown>;
    if (r.success === true) {
      const authToken = String(r.token ?? r.access_token ?? '');
      if (!authToken) {
        throw new Error('Invitation response did not include an auth token');
      }
      localStorage.setItem('authToken', authToken);
      apiService.setToken(authToken);
      const userData = r.user as User;
      setUser(userData);
      // Set default active tenant
      const defaultTenant = userData.tenant || userData.tenants?.[0] || null;
      setActiveTenant(defaultTenant);
      if (defaultTenant) {
        localStorage.setItem('activeTenantId', defaultTenant.id);
      }
      return;
    }

    throw new Error(String((r as Record<string, unknown>).message ?? 'Failed to complete invitation'));
  };

  const logout = () => {
    apiService.logout().finally(() => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('activeTenantId');
      apiService.setToken(null);
      setUser(null);
      setActiveTenant(null);
    });
  };

  const switchTenant = async (tenantId: string) => {
    try {
      const response = await apiService.switchTenant(tenantId);
      const r = response as Record<string, unknown>;
      if (r.success === true) {
        const userData = r.user as User;
        setUser(userData);
        const newTenant = userData.tenants?.find(t => t.id === tenantId) || userData.tenant || null;
        setActiveTenant(newTenant);
        localStorage.setItem('activeTenantId', tenantId);
      }
    } catch (error) {
      console.error('Error switching tenant:', error);
      throw error;
    }
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.roles?.some(role => role.name === 'owner' || role.name === 'admin' || role.name === 'manager' || role.name === 'support') || false;
  const isSuperAdmin = user?.roles?.some(role => role.name === 'super-admin') || false;
  const availableTenants = user?.tenants || [];

  const can = (permission: string): boolean => {
    if (!user) return false;
    // Super-admin has all permissions
    if (isSuperAdmin) return true;
    // Check if user has the permission
    return user.permissions?.some((p: Permission) => p.name === permission) || false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeTenant,
        availableTenants,
        switchTenant,
        login,
        register,
        completeInvitation,
        refreshUser,
        logout,
        isAuthenticated,
        isAdmin,
        isSuperAdmin,
        loading,
        can,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
