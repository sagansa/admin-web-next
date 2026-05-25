'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import apiService, { Permission } from '@/app/services/api';
import { getErrorMessage } from '@/app/utils/error';

interface PermissionContextType {
  permissions: Permission[];
  loading: boolean;
  error: string | null;
  fetchPermissions: () => Promise<void>;
  createPermission: (permissionData: Partial<Permission>) => Promise<Permission | null>;
  updatePermission: (id: string, permissionData: Partial<Permission>) => Promise<Permission | null>;
  deletePermission: (id: string) => Promise<boolean>;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export function PermissionProvider({ children }: { children: ReactNode }) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getPermissions();
      const r = response as Record<string, unknown>;
      if (r.success === true && Array.isArray(r.permissions)) {
        // Check if permissions is already a flat array or grouped structure
        const permissions = r.permissions as any[];

        // If first element has 'name' property (not 'module'), it's already flat
        if (permissions.length > 0 && 'name' in permissions[0]) {
          // Flat array - use directly
          setPermissions(permissions.map((perm: any) => ({
            id: perm.id,
            name: perm.name,
            guard_name: perm.guard_name || 'api',
            created_at: perm.created_at || new Date().toISOString(),
            updated_at: perm.updated_at || new Date().toISOString(),
          })));
        } else {
          // Grouped structure - flatten it
          const flatPermissions: Permission[] = [];
          permissions.forEach((module: any) => {
            if (Array.isArray(module.permissions)) {
              module.permissions.forEach((perm: any) => {
                flatPermissions.push({
                  id: perm.id,
                  name: perm.name,
                  guard_name: perm.guard_name || 'api',
                  created_at: perm.created_at || new Date().toISOString(),
                  updated_at: perm.updated_at || new Date().toISOString(),
                });
              });
            }
          });
          setPermissions(flatPermissions);
        }
      } else {
        setError(String((r as Record<string, unknown>).message ?? 'Failed to fetch permissions'));
      }
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, 'An error occurred while fetching permissions'));
    } finally {
      setLoading(false);
    }
  }, []);

  const createPermission = useCallback(
    async (permissionData: Partial<Permission>): Promise<Permission | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiService.createPermission(permissionData);
        const r = response as Record<string, unknown>;
        if (r.success === true) {
          await fetchPermissions();
          return (r.permission ?? null) as Permission | null;
        }

        setError(String((r as Record<string, unknown>).message ?? 'Failed to create permission'));
        return null;
      } catch (caughtError) {
        setError(getErrorMessage(caughtError, 'An error occurred while creating permission'));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchPermissions],
  );

  const updatePermission = useCallback(
    async (id: string, permissionData: Partial<Permission>): Promise<Permission | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiService.updatePermission(id, permissionData);
        const r = response as Record<string, unknown>;
        if (r.success === true) {
          await fetchPermissions();
          return (r.permission ?? null) as Permission | null;
        }

        setError(String((r as Record<string, unknown>).message ?? 'Failed to update permission'));
        return null;
      } catch (caughtError) {
        setError(getErrorMessage(caughtError, 'An error occurred while updating permission'));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchPermissions],
  );

  const deletePermission = useCallback(
    async (id: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiService.deletePermission(id);
        const r = response as Record<string, unknown>;
        if (r.success === true) {
          await fetchPermissions();
          return true;
        }

        setError(String((r as Record<string, unknown>).message ?? 'Failed to delete permission'));
        return false;
      } catch (caughtError) {
        setError(getErrorMessage(caughtError, 'An error occurred while deleting permission'));
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchPermissions],
  );

  return (
    <PermissionContext.Provider
      value={{
        permissions,
        loading,
        error,
        fetchPermissions,
        createPermission,
        updatePermission,
        deletePermission,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissionContext() {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissionContext must be used within a PermissionProvider');
  }
  return context;
}
