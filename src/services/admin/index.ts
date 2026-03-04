import instance from "@/hooks/initializers/useAxiosDefaults";
import env from "@/config/env";

type UpdateRolePayload = {
    name: string;
    description: string;
    permission_group_slugs: string[];
};
type Invite = {
    email: string
    name: string
}
type RoleEmailPayload = {
    email: string;
}
type InviteSupes = {
    email: string,
    name: string,
    transfer_action: string,
    new_role_id: string,
}
type TransferSupes = {
    email: string
    transfer_action: string
    new_role_id: string
}

export const fetchPermission = () =>
    instance.get(env.api.superadminPermissionsGroups);

export const fetchRoles = () =>
    instance.get(env.api.superadminRoles);

export const updateRoles = (
    roleId: string,
    payload: UpdateRolePayload
) =>
    instance.patch(`${env.api.superadmin}roles/${roleId}/`, payload);

export const addRRoles = (
    payload: UpdateRolePayload
) =>
    instance.post(`${env.api.superadmin}roles/`, payload);

export const deleteRoles = (roleToDelete: string) => instance.delete(`${env.api.superadmin}roles/${roleToDelete}/`);
export const inviteMembers = (id: string, payload: Invite) => instance.post(`${env.api.superadmin}roles/${id}/invite/`, payload);
export const revokeInvites = (id: string, email: string) => instance.post(`${env.api.superadmin}roles/${id}/cancel-invite/`, email);
export const assignUserToRole = (roleId: string, email: RoleEmailPayload) => instance.post(`${env.api.superadmin}roles/${roleId}/assign/`, email);
export const removeUsersFromRole = (roleId: string, email: RoleEmailPayload) => instance.post(`${env.api.superadmin}roles/${roleId}/remove/`, email);
export const inviteSupes = (payload: InviteSupes) => instance.post(
    `${env.api.superadmin}superadmins/invite/`,
    payload
);
export const transferSupes = (payload: TransferSupes) => instance.post(`${env.api.superadmin}superadmins/transfer/`, payload);