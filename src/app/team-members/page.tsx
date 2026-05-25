'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import { TeamMemberProvider } from '@/app/contexts/TeamMemberContext';
import { RoleProvider } from '@/app/contexts/RoleContext';
import TeamMemberList from './TeamMemberList';
import RoleList from '../roles/RoleList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function TeamMembersPage() {
    return (
        <ProtectedRoute requiredRole="admin">
            <TeamMemberProvider>
                <RoleProvider>
                    <AdminLayout>
                        <div className="space-y-6">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
                                <p className="text-muted-foreground mt-2">
                                    Manage your team members and roles. Add new members, assign roles, and configure permissions.
                                </p>
                            </div>

                            <Tabs defaultValue="members" className="w-full">
                                <TabsList className="mb-4">
                                    <TabsTrigger value="members">Team Members</TabsTrigger>
                                    <TabsTrigger value="roles">Roles</TabsTrigger>
                                </TabsList>
                                <TabsContent value="members">
                                    <TeamMemberList />
                                </TabsContent>
                                <TabsContent value="roles">
                                    <RoleList />
                                </TabsContent>
                            </Tabs>
                        </div>
                    </AdminLayout>
                </RoleProvider>
            </TeamMemberProvider>
        </ProtectedRoute>
    );
}
