'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRoleContext } from '@/app/contexts/RoleContext';
import { useAuth } from '@/app/contexts/AuthContext';
import RoleForm from './RoleForm';
import { Role } from '@/app/services/api';
import { Button, ConfirmationDialog, Input } from '@/components/ui';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';

export default function RoleList() {
  const { roles, loading, error, fetchRoles, deleteRole } = useRoleContext();
  const { isSuperAdmin } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingRole(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingRole(null);
  };

  const handleDelete = (role: Role) => {
    setRoleToDelete(role);
  };

  const confirmDelete = async () => {
    if (!roleToDelete) return;

    await deleteRole(roleToDelete.id);
    setRoleToDelete(null);
  };

  const filteredRoles = useMemo(() => {
    const matcher = searchTerm.trim().toLowerCase();
    if (!matcher) {
      return roles;
    }
    return roles.filter((role) => role.name.toLowerCase().includes(matcher));
  }, [roles, searchTerm]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-3xl font-bold text-gray-900">Roles</h3>
          <p className="mt-1 text-sm text-gray-700">
            Define roles and assign permissions to control access across your organization.
          </p>
        </div>
        <Button
          onClick={handleCreate}
        >
          <Plus className="h-4 w-4 mr-1" />
          Role
        </Button>
      </div>

      <div className="mt-4">
        <div className="flex justify-between">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              className="pl-10"
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    {isSuperAdmin && (
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tenant
                      </th>
                    )}
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Permissions Count
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRoles.map((role) => {
                    const isSystemRole = ['super-admin', 'owner'].includes(role.name);

                    return (
                      <tr key={role.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-gray-900">{role.name}</div>
                            {isSystemRole && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                System
                              </span>
                            )}
                          </div>
                        </td>
                        {isSuperAdmin && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {role.tenant?.name || '-'}
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {Array.isArray(role.permissions)
                              ? role.permissions.map(p => p.name).join(', ')
                              : 'No permissions'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(role.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              // variant="info"
                              size="icon-sm"
                              onClick={() => handleEdit(role)}
                              disabled={isSystemRole}
                              title={isSystemRole ? 'System roles cannot be edited' : 'Edit role'}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon-sm"
                              onClick={() => handleDelete(role)}
                              disabled={isSystemRole}
                              title={isSystemRole ? 'System roles cannot be deleted' : 'Delete role'}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <RoleForm
              role={editingRole}
              onClose={handleCloseForm}
            />
          </div>
        </div>
      )}

      <ConfirmationDialog
        isOpen={!!roleToDelete}
        onClose={() => setRoleToDelete(null)}
        onConfirm={confirmDelete}
        title="Konfirmasi Hapus Role"
        message={`Apakah Anda yakin ingin menghapus role "${roleToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
        loading={loading}
      />
    </div>
  );
}
