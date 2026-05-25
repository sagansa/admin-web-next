'use client';

import { useState, useEffect } from 'react';
import apiService from '@/app/services/api';
import { Button, Modal, Input, RadioGroup, RadioGroupItem, Label } from '@/components/ui';
import { useAuth } from '@/app/contexts/AuthContext';

interface AddMemberModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddMemberModal({ onClose, onSuccess }: AddMemberModalProps) {
    const { user: currentUser } = useAuth();
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('');
    const [availableRoles, setAvailableRoles] = useState<Array<{ name: string; label?: string }>>([]);
    const [rolesLoading, setRolesLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch available roles on mount
    useEffect(() => {
        const fetchRoles = async () => {
            setRolesLoading(true);
            try {
                const response = await apiService.getRoles();
                const r = response as Record<string, unknown>;
                if (r.roles) {
                    const roles = r.roles as Array<{ name: string; label?: string }>;
                    // Filter out system roles (super-admin, owner)
                    const filteredRoles = roles.filter(
                        (role) => role.name !== 'super-admin' && role.name !== 'owner'
                    );
                    setAvailableRoles(filteredRoles);
                    // Set default role to first available role
                    if (filteredRoles.length > 0) {
                        setRole(filteredRoles[0].name);
                    }
                }
            } catch (error) {
                console.error('Error fetching roles:', error);
                setError('Failed to load roles');
            } finally {
                setRolesLoading(false);
            }
        };

        fetchRoles();
    }, []);

    const handleAddMember = async () => {
        setLoading(true);
        setError(null);
        try {
            if (!currentUser?.tenant?.id) {
                setError('No tenant found for current user');
                setLoading(false);
                return;
            }

            if (!email.trim()) {
                setError('Email is required');
                setLoading(false);
                return;
            }

            await apiService.inviteUserToTenant(currentUser.tenant.id, email.trim(), role);
            
            onSuccess();
            onClose();
        } catch (error: unknown) {
            setError((error as Error).message || 'Failed to add member');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Add Team Member" size="lg">
            {error && (
                <div className="mb-4 rounded-md bg-red-50 p-4">
                    <div className="text-sm text-red-700">{error}</div>
                </div>
            )}

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                </label>
                <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter member email..."
                />
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                </label>
                <RadioGroup
                    value={role}
                    onValueChange={setRole}
                    className="gap-3"
                >
                    {rolesLoading ? (
                        <div className="text-sm text-gray-500">Loading roles...</div>
                    ) : availableRoles.length === 0 ? (
                        <div className="text-sm text-gray-500">No roles available for this tenant</div>
                    ) : (
                        availableRoles.map((r) => (
                            <div key={r.name} className="flex items-center space-x-2 border p-3 rounded-md hover:bg-slate-50 transition-colors">
                                <RadioGroupItem value={r.name} id={r.name} />
                                <Label htmlFor={r.name} className="flex-1 cursor-pointer font-normal">
                                    {r.label || r.name}
                                </Label>
                            </div>
                        ))
                    )}
                </RadioGroup>
            </div>

            <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={onClose} disabled={loading}>
                    Cancel
                </Button>
                <Button 
                    onClick={handleAddMember} 
                    disabled={!email.trim() || !role || loading}
                >
                    {loading ? 'Sending Invitation...' : 'Send Invitation'}
                </Button>
            </div>
        </Modal>
    );
}
