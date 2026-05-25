'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import apiService from '@/app/services/api';
import { useAuth } from '@/app/contexts/AuthContext';
import { getErrorMessage } from '@/app/utils/error';

interface TeamMember {
    id: string;
    name: string;
    email: string;
    pivot_role: string;
    assigned_by: string | null;
    joined_at: string;
    roles: string[];
    permissions: string[];
}

interface TeamMemberContextType {
    members: TeamMember[];
    loading: boolean;
    error: string | null;
    tenantId: string | null;
    fetchTeamMembers: (tenantId: string) => Promise<void>;
    addMember: (userId: string, role: string) => Promise<boolean>;
    removeMember: (userId: string) => Promise<boolean>;
    updateMemberRole: (userId: string, role: string) => Promise<boolean>;
}

const TeamMemberContext = createContext<TeamMemberContextType | undefined>(undefined);

export function TeamMemberProvider({ children }: { children: ReactNode }) {
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tenantId, setTenantId] = useState<string | null>(null);
    const { user: currentUser } = useAuth();

    const fetchTeamMembers = useCallback(async (tid: string) => {
        setLoading(true);
        setError(null);
        setTenantId(tid);

        try {
            const response = await apiService.getTenantUsers(tid);
            const r = response as Record<string, unknown>;
            if (r.users) {
                setMembers(r.users as TeamMember[]);
            } else {
                setError('Failed to fetch team members');
            }
        } catch (error) {
            setError(getErrorMessage(error, 'An error occurred while fetching team members'));
        } finally {
            setLoading(false);
        }
    }, []);

    const addMember = useCallback(async (userId: string, role: string): Promise<boolean> => {
        if (!tenantId) return false;

        setLoading(true);
        setError(null);

        try {
            const response = await apiService.addUserToTenant(tenantId, userId, role);
            const r = response as unknown as Record<string, unknown>;
            if (r.success === true || r.message === 'User added successfully') {
                await fetchTeamMembers(tenantId);
                return true;
            } else {
                setError(String((r as Record<string, unknown>).message ?? 'Failed to add member'));
                return false;
            }
        } catch (error) {
            setError(getErrorMessage(error, 'An error occurred while adding member'));
            return false;
        } finally {
            setLoading(false);
        }
    }, [tenantId, fetchTeamMembers]);

    const removeMember = useCallback(async (userId: string): Promise<boolean> => {
        if (!tenantId) return false;

        setLoading(true);
        setError(null);

        try {
            const response = await apiService.removeUserFromTenant(tenantId, userId);
            const r = response as unknown as Record<string, unknown>;
            if (r.success === true || r.message === 'User removed from tenant successfully') {
                await fetchTeamMembers(tenantId);
                return true;
            } else {
                setError(String((r as Record<string, unknown>).message ?? 'Failed to remove member'));
                return false;
            }
        } catch (error) {
            setError(getErrorMessage(error, 'An error occurred while removing member'));
            return false;
        } finally {
            setLoading(false);
        }
    }, [tenantId, fetchTeamMembers]);

    const updateMemberRole = useCallback(async (userId: string, role: string): Promise<boolean> => {
        if (!tenantId) return false;

        setLoading(true);
        setError(null);

        try {
            await apiService.updateUserRole(tenantId, userId, role);
            await fetchTeamMembers(tenantId);
            return true;
        } catch (error) {
            setError(getErrorMessage(error, 'An error occurred while updating member role'));
            return false;
        } finally {
            setLoading(false);
        }
    }, [tenantId, fetchTeamMembers]);

    return (
        <TeamMemberContext.Provider
            value={{
                members,
                loading,
                error,
                tenantId,
                fetchTeamMembers,
                addMember,
                removeMember,
                updateMemberRole,
            }}
        >
            {children}
        </TeamMemberContext.Provider>
    );
}

export function useTeamMemberContext() {
    const context = useContext(TeamMemberContext);
    if (context === undefined) {
        throw new Error('useTeamMemberContext must be used within a TeamMemberProvider');
    }
    return context;
}
