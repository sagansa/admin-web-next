'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import apiService, { ShiftStore, ShiftStoreInput } from '@/app/services/api';
import { getErrorMessage } from '@/app/utils/error';

interface ShiftStoreContextType {
  shiftStores: ShiftStore[];
  loading: boolean;
  error: string | null;
  currentTenantId: string | null;
  fetchShiftStores: (tenantId: string) => Promise<void>;
  createShiftStore: (tenantId: string, data: ShiftStoreInput) => Promise<ShiftStore | null>;
  updateShiftStore: (
    tenantId: string,
    shiftStoreId: string,
    data: ShiftStoreInput,
  ) => Promise<ShiftStore | null>;
  deleteShiftStore: (tenantId: string, shiftStoreId: string) => Promise<boolean>;
}

const ShiftStoreContext = createContext<ShiftStoreContextType | undefined>(undefined);

export function ShiftStoreProvider({ children }: { children: ReactNode }) {
  const [shiftStores, setShiftStores] = useState<ShiftStore[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTenantId, setCurrentTenantId] = useState<string | null>(null);

  const fetchShiftStores = useCallback(async (tenantId: string) => {
    setLoading(true);
    setError(null);
    setCurrentTenantId(tenantId);

    try {
      const response = await apiService.getTenantShiftStores(tenantId);
      const r = response as Record<string, unknown>;
      const shiftStoresData = (r as Record<string, unknown>).shift_stores || (r as Record<string, unknown>).shiftStores || (r as Record<string, unknown>).data;
      if ((r as Record<string, unknown>).success === true && Array.isArray(shiftStoresData)) {
        setShiftStores(shiftStoresData as ShiftStore[]);
      } else {
        setError(String((r as Record<string, unknown>).message ?? 'Failed to fetch shift schedules'));
        setShiftStores([]);
      }
    } catch (fetchError) {
      const errorMessage = getErrorMessage(fetchError);
      
      // Tambahkan logging untuk debugging
      console.error('Failed to fetch shift stores:', errorMessage);
      
      setError(errorMessage);
      setShiftStores([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createShiftStore = useCallback(
    async (tenantId: string, data: ShiftStoreInput): Promise<ShiftStore | null> => {
      setLoading(true);
      setError(null);

      try {
        // Cek apakah sudah ada shift dengan nama yang sama
        const existingShift = shiftStores.find(shift => 
          shift.name.toLowerCase() === data.name.toLowerCase()
        );
        
        if (existingShift) {
          setError('A shift with this name already exists');
          return null;
        }

        const response = await apiService.createShiftStore(tenantId, data);
        const r = response as Record<string, unknown>;
        const shiftStore = (r as Record<string, unknown>).shift_store || (r as Record<string, unknown>).shiftStore || (r as Record<string, unknown>).data;
        if ((r as Record<string, unknown>).success === true && shiftStore) {
          await fetchShiftStores(tenantId);
          return shiftStore as ShiftStore;
        }

        const msg = (r as Record<string, unknown>).message as string | undefined;
        if (typeof msg === 'string' && msg.includes('Duplicate entry')) {
          setError('A shift with this name already exists for this tenant');
        } else {
          setError(String(msg ?? 'Failed to create shift'));
        }
        return null;
      } catch (createError) {
        setError(getErrorMessage(createError));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchShiftStores, shiftStores],
  );

  const updateShiftStore = useCallback(
    async (tenantId: string, shiftStoreId: string, data: ShiftStoreInput): Promise<ShiftStore | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiService.updateShiftStore(tenantId, shiftStoreId, data);
        const r = response as Record<string, unknown>;
        if ((r as Record<string, unknown>).success === true) {
          await fetchShiftStores(tenantId);
          return (r.shift_store ?? r.shiftStore) as ShiftStore;
        }

        setError(String((r as Record<string, unknown>).message ?? 'Failed to update shift'));
        return null;
      } catch (updateError) {
        setError(getErrorMessage(updateError));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchShiftStores],
  );

  const deleteShiftStore = useCallback(
    async (tenantId: string, shiftStoreId: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiService.deleteShiftStore(tenantId, shiftStoreId);
        const r = response as Record<string, unknown>;
        if ((r as Record<string, unknown>).success === true) {
          await fetchShiftStores(tenantId);
          return true;
        }

        setError(String((r as Record<string, unknown>).message ?? 'Failed to delete shift'));
        return false;
      } catch (deleteError) {
        setError(getErrorMessage(deleteError));
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchShiftStores],
  );

  return (
    <ShiftStoreContext.Provider
      value={{
        shiftStores,
        loading,
        error,
        currentTenantId,
        fetchShiftStores,
        createShiftStore,
        updateShiftStore,
        deleteShiftStore,
      }}
    >
      {children}
    </ShiftStoreContext.Provider>
  );
}

export function useShiftStoreContext() {
  const context = useContext(ShiftStoreContext);
  if (context === undefined) {
    throw new Error('useShiftStoreContext must be used within a ShiftStoreProvider');
  }
  return context;
}
