'use client';

import { useEffect, useState } from 'react';
import { Tenant, TenantInput, TenantUpdateInput, User } from '@/app/services/api';
import { getErrorMessage } from '@/app/utils/error';
import { Modal, Input, Select, Button } from '@/components/ui';

interface TenantFormProps {
  tenant?: Tenant;
  users: User[];
  isOpen: boolean;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: TenantInput | TenantUpdateInput) => Promise<void>;
  error?: string | null;
}

export default function TenantForm({
  tenant,
  users,
  isOpen,
  loading,
  onClose,
  onSubmit,
  error,
}: TenantFormProps) {
  const [name, setName] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [operationMode, setOperationMode] = useState<'standard' | 'foodcourt'>('standard');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (tenant) {
      setName(tenant.name || '');
      setOwnerId(tenant.owner?.id ?? '');
      setOperationMode(tenant.operation_mode || 'standard');
    } else {
      setName('');
      setOwnerId('');
      setOperationMode('standard');
    }
    setLocalError(null);
  }, [tenant, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!name.trim()) {
      setLocalError('Tenant name is required.');
      return;
    }

    if (!ownerId) {
      setLocalError('Please select an owner for the tenant.');
      return;
    }

    const payload: TenantInput | TenantUpdateInput = {
      name: name.trim(),
      owner_id: ownerId,
      operation_mode: operationMode,
    };

    try {
      await onSubmit(payload);
    } catch (error) {
      setLocalError(getErrorMessage(error, 'Failed to save tenant'));
      return;
    }

    if (!loading) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={tenant ? 'Edit Tenant' : 'Create Tenant'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {(localError || error) && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
            {localError || error}
          </div>
        )}

        <div>
          <label htmlFor="tenant-name" className="block text-sm font-medium text-gray-700 mb-1">
            Tenant Name
          </label>
          <Input
            id="tenant-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter tenant name"
          />
        </div>

        <div>
          <label htmlFor="tenant-owner" className="block text-sm font-medium text-gray-700 mb-1">
            Tenant Owner
          </label>
          <Select
            id="tenant-owner"
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
            disabled={users.length === 0 || loading}
          >
            <option value="">Select owner</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </Select>
          {users.length === 0 && (
            <p className="mt-1 text-xs text-gray-500">
              No available users found. Create an admin user first.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="operation-mode" className="block text-sm font-medium text-gray-700 mb-1">
            Operation Mode
          </label>
          <Select
            id="operation-mode"
            value={operationMode}
            onChange={(e) => setOperationMode(e.target.value as 'standard' | 'foodcourt')}
            disabled={loading}
          >
            <option value="standard">Standard (Single Store)</option>
            <option value="foodcourt">Foodcourt (Multi-Tenant/Zone)</option>
          </Select>
          <p className="mt-1 text-xs text-gray-500">
            Standard mode is for regular restaurants. Foodcourt mode enables zone management and multi-tenant features.
          </p>
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || users.length === 0}
          >
            {loading ? 'Saving...' : tenant ? 'Update Tenant' : 'Create Tenant'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
