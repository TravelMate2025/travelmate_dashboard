"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import RoleManagement from "../../../components/molecues/admin/RoleManagement";
import RoleAssignment from "../../../components/molecues/admin/RoleAssignment";
import { showErrorToast, showSuccessToast } from "@/utils/toasters";
import Loading from "./loading";
import { LoaderCircleIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { Download, XCircle } from "lucide-react";
import {
  addRRoles,
  deleteRoles,
  fetchPermission,
  fetchRoles,
  inviteMembers,
  revokeInvites,
  updateRoles,
} from "@/services/admin";
import { useAuthContext } from "@/context/AuthContext";
import type { DashboardRole as Role } from "@/utils/roles";
import { isSuperAdminRole } from "@/utils/roles";

type Permissions = {
  slug: string;
  name: string;
};

const AdminRolesPage: React.FC = () => {
  const router = useRouter();
  const APP_STATE = useAuthContext();
  const isSuperuser = Boolean(APP_STATE?.user?.isSuperuser);
  const [accessResolved, setAccessResolved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPermissionLoading, setIsPermissionLoading] = useState(true);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [isSaveLoading, setIsSaveLoading] = useState(false);
  const [isInviteLoading, setIsInviteLoading] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
  const [successModal, setSuccessModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [successDeleteModal, setSuccessDeleteModal] = useState(false);

  const [activeTab, setActiveTab] = useState("role-management");

  const [adminDetails, setAdminDetails] = useState<Role[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<
    Permissions[]
  >([]);
  const [selectedDepartmentId, setSelectedDepartmentId] =
    useState<string>("");
  const [isInvited, setIsInvited] = useState(false);
  const [lastInvitedEmail, setLastInvitedEmail] = useState("");

  const [roleDetails, setRoleDetails] = useState<{
    id: string;
    name: string;
    description: string;
    permissions: string[];
  }>({
    id: "",
    name: "",
    description: "",
    permissions: [],
  });

  const [newMember, setNewMember] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>({
    id: "",
    name: "",
    email: "",
    role: "",
  });

  const admins = adminDetails.filter(
    (admin) => !isSuperAdminRole(admin)
  );
  // Deliberately no fallback to the unfiltered adminDetails when admins is
  // empty (e.g. a fresh account with no custom roles yet, only the
  // auto-created Super Admin one) — that fallback used to defeat the
  // filter exactly when it mattered most, surfacing "Super Admin" as an
  // invite target even though the backend rejects inviting into it
  // (invite_admin explicitly requires the dedicated superadmin-invite
  // endpoint instead). An empty list here means "create a role first,"
  // not "fall back to the one role you can't actually invite into."
  const departmentOptions = admins;
  const selectedDepartmentName =
    departmentOptions.find((role) => String(role.id) === selectedDepartmentId)
      ?.name ||
    "";

  useEffect(() => {
    if (!APP_STATE?.user) {
      return;
    }

    if (!isSuperuser) {
      showErrorToast({
        message: "Only Super Admins can access Admin Roles.",
      });
      router.replace("/Dashboard");
      return;
    }

    setAccessResolved(true);
  }, [APP_STATE?.user, isSuperuser, router]);

  // FETCH PERMISSIONS TO CREATE NEW ROLE
  const fetchPermissions = async () => {
    try {
      setIsPermissionLoading(true);
      const response = await fetchPermission();
      setAvailablePermissions(
        Array.isArray(response.data.results) ? response.data.results : []
      );
    } catch (error: any) {
      console.error(
        "Error fetching permissions:",
        error.response?.data || error.message
      );
      setAvailablePermissions([]);
      showErrorToast({
        message:
          error.response?.data?.detail?.[0] ||
          error.response?.data?.messages?.[0] ||
          error.message,
      });
    } finally {
      setIsPermissionLoading(false);
    }
  };

  // FETCH ALL ROLES
  const fetchAllRoles = async () => {
    try {
      setIsLoading(true);
      const allRoles: any[] = [];
      let nextUrl: string | null = null;
      const seenUrls = new Set<string>();

      do {
        const response = await fetchRoles(nextUrl || undefined);
        const pageResults = Array.isArray(response.data?.results)
          ? response.data.results
          : [];

        allRoles.push(...pageResults);

        const candidateNext =
          typeof response.data?.next === "string" ? response.data.next : null;

        if (candidateNext && !seenUrls.has(candidateNext)) {
          seenUrls.add(candidateNext);
          nextUrl = candidateNext;
        } else {
          nextUrl = null;
        }
      } while (nextUrl);

      const roleMap = new Map<string, Role>();
      for (const role of allRoles) {
        const normalizedId = String(role?.id ?? "");
        if (!normalizedId) continue;

        roleMap.set(normalizedId, {
          ...role,
          id: normalizedId,
          assigned_users: Array.isArray(role?.assigned_users)
            ? role.assigned_users
            : [],
          invited_users: Array.isArray(role?.invited_users)
            ? role.invited_users
            : [],
        });
      }

      setAdminDetails(Array.from(roleMap.values()));
    } catch (error: any) {
      showErrorToast({
        message: error.response?.data?.detail?.[0] || error?.messages?.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // UPDATE ADMIN ROLES AND PERMISSIONS
  const UpdateRole = async (roleId: string, updatedRole: Partial<Role>) => {
    try {
      setIsSaveLoading(true);
      const payload = {
        name: updatedRole.name ?? "",
        description: updatedRole.description ?? "",
        permission_group_slugs:
          updatedRole.current_permission_group_slugs ?? [],
      };
      const response = await updateRoles(roleId, payload);
      await fetchAllRoles();
      setRoleDetails((prev) => ({
        ...prev,
        permissions: response.data.current_permission_group_slugs || [],
      }));
      showSuccessToast({
        message: "Role updated successfully",
      });
    } catch (error: any) {
      console.error(
        "Error updating role:",
        error.response?.data || error.message
      );
      showErrorToast({
        message: error?.response?.data?.message || "Failed to update role",
      });
    } finally {
      setIsSaveLoading(false);
    }
  };

  // CREATE NEW ROLE OR SAVE
  const saveRole = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (
      !roleDetails.name ||
      roleDetails.name.trim() === "" ||
      !roleDetails.description ||
      !roleDetails.permissions.length
    ) {
      showErrorToast({
        message: "Fill in complete details and assign permissions to role",
      });
      return;
    }
    if (isEditing && editingRoleId) {
      await UpdateRole(editingRoleId, {
        name: roleDetails.name,
        description: roleDetails.description,
        current_permission_group_slugs: roleDetails.permissions,
      });
      setIsCreateRoleOpen(false);
      setIsEditing(false);
      setEditingRoleId(null);
    } else {
      try {
        const payload = {
          name: roleDetails.name,
          description: roleDetails.description,
          permission_group_slugs: roleDetails.permissions,
        };
        setIsSaveLoading(true);
        await addRRoles(payload);
        await fetchAllRoles();
        showSuccessToast({
          message: "Created new role successfully!",
        });
        setIsCreateRoleOpen(false);
      } catch (err: any) {
        console.log("Error Creating new Role", err);
        showErrorToast({
          message: err?.response?.data?.message || "An error occurred",
        });
      } finally {
        setIsSaveLoading(false);
        setRoleDetails({ id: "", name: "", description: "", permissions: [] });
      }
    }
  };

  useEffect(() => {
    if (!accessResolved) {
      return;
    }

    fetchPermissions();
    fetchAllRoles();
  }, [accessResolved]);

  if (!accessResolved) {
    return <Loading />;
  }

  // Handle role details input changes
  const handleChangeRoleDetails = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRoleDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleNewInvite = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewMember((prev) => ({ ...prev, [name]: value }));
  };

  // Handle permission checkbox changes
  const handlePermissionChange = (id: string, checked: boolean) => {
    setRoleDetails((prev) => ({
      ...prev,
      permissions: checked
        ? [...prev.permissions, id]
        : prev.permissions.filter((permId) => permId !== id),
    }));
  };

  // EDIT ADMIN ROLES
  const handleEditRole = (role: Role) => {
    setRoleDetails({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.current_permission_group_slugs || [],
    });
    setEditingRoleId(role.id);
    setIsEditing(true);
    setIsCreateRoleOpen(true);
  };

  // DELETE ROLES
  const confirmDeleteRole = async () => {
    if (!roleToDelete) {
      showErrorToast({ message: "No role selected for deletion" });
      return;
    }

    try {
      setIsDeleteLoading(true);
      await deleteRoles(roleToDelete);
      await fetchAllRoles();
      setShowConfirmModal(false);
      setSuccessDeleteModal(true);
      showSuccessToast({ message: "Role deleted successfully!" });
    } catch (error: any) {
      showErrorToast({
        message:
          error?.response?.data?.message || "Error deleting Role, try again",
      });
    } finally {
      setIsDeleteLoading(false);
    }
  };

  // INVITE NEW MEMBER
  const inviteMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const id = selectedDepartmentId;
    if (!newMember.name || !newMember.email || !id) {
      showErrorToast({ message: "Fill in all the details" });
      return;
    }
    try {
      const payload = {
        email: newMember.email,
        name: newMember.name,
      };

      setIsInviteLoading(true);
      await inviteMembers(id, payload);
      await fetchAllRoles();
      setLastInvitedEmail(newMember.email);
      setIsAddMemberOpen(false);
      setSuccessModal(true);
      setIsInvited(true);
    } catch (error: any) {
      console.log(error);
      showErrorToast({
        message: error?.response?.data?.message || "Cannot add new member",
      });
    } finally {
      setSelectedDepartmentId("");
      setIsInviteLoading(false);
    }
  };

  // REVOKE INVITATION OF ADMINS AND SUPERADMINS
  const revokeInvite = async (id: string, email: string) => {
    try {
      await revokeInvites(id, email);
      await fetchAllRoles();
    } catch (error: any) {
      console.log("error revoking invite", error);
      showErrorToast({
        message:
          error?.response?.data?.message ||
          "Error revoking invite member, please try again ",
      });
    }
  };

  const AdminRolesSkeletonLoader = () => {
    return (
      <div className="flex min-h-screen bg-background rounded-lg">
        <main className="w-full">
          <div className="rounded-lg bg-card md:px-5 px-0 pt-5">
            <div className="h-6 bg-gray-300 rounded-md w-3/4 mb-6 animate-pulse"></div>
            <div className="flex border-b mb-6">
              {[1, 2].map((_, index) => (
                <div
                  key={index}
                  className="h-10 w-32 bg-gray-300 rounded-md mr-4 animate-pulse"
                ></div>
              ))}
            </div>
            <div className="space-y-6">
              <div className="space-y-4">
                {[1, 2, 3].map((_, index) => (
                  <div
                    key={index}
                    className="h-16 bg-gray-300 rounded-md animate-pulse"
                  ></div>
                ))}
              </div>
              <div className="space-y-4">
                {[1, 2, 3].map((_, index) => (
                  <div
                    key={index}
                    className="h-16 bg-gray-300 rounded-md animate-pulse"
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-background rounded-lg">
      <main className="w-full">
        {isLoading ? (
          <AdminRolesSkeletonLoader />
        ) : (
          <>
            <div className="rounded-lg bg-card md:px-5 px-0 pt-5">
              <h2 className="text-lg font-medium pb-6 px-2">
                Manage access control for your travel agency dashboard
              </h2>
              <Tabs
                defaultValue="role-management"
                className="space-y-6"
                onValueChange={setActiveTab}
              >
                <TabsList className="w-full border-b rounded-none bg-transparent p-0 h-auto">
                  <TabsTrigger
                    value="role-management"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 cursor-pointer"
                  >
                    Role Management
                  </TabsTrigger>
                  <TabsTrigger
                    value="role-assignments"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 cursor-pointer"
                  >
                    Role Assignments
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="role-management" className="space-y-4">
                  <RoleManagement
                    roles={adminDetails}
                    onCreateRoleOpen={() => setIsCreateRoleOpen(true)}
                    isLoading={isLoading}
                    onStartEdit={handleEditRole}
                    roleToDelete={roleToDelete}
                    setRoleToDelete={setRoleToDelete}
                    showConfirmModal={showConfirmModal}
                    setShowConfirmModal={setShowConfirmModal}
                    successDeleteModal={successDeleteModal}
                    setSuccessDeleteModal={setSuccessDeleteModal}
                    confirmDeleteRole={confirmDeleteRole}
                    isDeleteLoading={isDeleteLoading}
                  />
                </TabsContent>
                <TabsContent value="role-assignments" className="space-y-8">
                  <RoleAssignment
                    onCreateRoleOpen={() => setIsCreateRoleOpen(true)}
                    roles={adminDetails}
                    isLoading={isLoading}
                    onAddMemberOpen={() => setIsAddMemberOpen(true)}
                    revokeInvite={revokeInvite}
                    refreshRoles={fetchAllRoles}
                  />
                </TabsContent>
              </Tabs>
            </div>
            <Dialog
              open={isCreateRoleOpen}
              onOpenChange={(open) => {
                setIsCreateRoleOpen(open);
                if (!open) {
                  setIsEditing(false);
                  setRoleDetails({
                    id: "",
                    name: "",
                    description: "",
                    permissions: [],
                  });
                }
              }}
            >
              <DialogContent className="fixed md:top-[10vh] top-[20vh] left-1/2 max-w-2xl mt-64 mb-64 overflow-y-auto w-[90vw] max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>
                    {isEditing ? "Edit Role" : "Create New Role"}
                  </DialogTitle>
                  <DialogDescription>
                    {isEditing
                      ? "Update this role's name, description, and permissions."
                      : "Set a name, description, and permissions for the new role."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={saveRole}>
                  <div className="space-y-4">
                    <div className="pt-4">
                      <label className="text-sm font-medium">Role Name</label>
                      <Input
                        className="mt-2"
                        name="name"
                        value={roleDetails.name}
                        onChange={handleChangeRoleDetails}
                      />
                    </div>
                    <div className="pt-4">
                      <label className="text-sm font-medium">Description</label>
                      <Input
                        className="mt-2"
                        name="description"
                        value={roleDetails.description}
                        onChange={handleChangeRoleDetails}
                      />
                    </div>
                  </div>
                  <div className="space-y-6 pt-4">
                    <h3 className="text-sm font-medium">Permissions</h3>
                    {isPermissionLoading && <Loading />}
                    {availablePermissions.map((perm, id) => (
                      <div
                        key={perm.slug}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          className="cursor-pointer"
                          id={String(id)}
                          checked={roleDetails.permissions.includes(perm.slug)}
                          onCheckedChange={(checked: boolean) =>
                            handlePermissionChange(perm.slug, checked)
                          }
                        />
                        <label htmlFor={String(id)} className="capitalize">
                          {perm.name}
                        </label>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center w-full gap-4 mt-7">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateRoleOpen(false)}
                      className="bg-[#FFE2D2] hover:bg-orange-100 text-[#FF6F1E] cursor-pointer flex gap-3 items-center w-full"
                    >
                      <XCircle className="w-5" /> <span>CANCEL</span>
                    </Button>
                    <Button
                      disabled={isSaveLoading}
                      type="submit"
                      className="bg-[#CCD8E8] hover:bg-blue-100 text-[#023E8A] cursor-pointer flex gap-3 items-center w-full"
                    >
                      {isSaveLoading ? (
                        <LoaderCircleIcon
                          stroke="#023E8A"
                          style={{ animation: "spin 1s linear infinite" }}
                        />
                      ) : (
                        <Download className="w-5" />
                      )}
                      <span className="text-[#023E8A]">
                        {isEditing ? "UPDATE ROLE" : "SAVE ROLE"}
                      </span>
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog
              open={isAddMemberOpen}
              onOpenChange={(open) => {
                setIsAddMemberOpen(open);
                if (!open) {
                  setSelectedDepartmentId("");
                  setNewMember({ id: "", name: "", email: "", role: "" });
                }
              }}
            >
              <DialogContent>
                <DialogHeader className="border-b pb-2">
                  <DialogTitle className="text-center">
                    Invite New Member
                  </DialogTitle>
                  <DialogDescription className="text-center">
                    Send a role invitation to a new team member by email.
                  </DialogDescription>
                </DialogHeader>
                <form className="flex flex-col gap-4" onSubmit={inviteMember}>
                  <div className="flex flex-col gap-3">
                    <label htmlFor="name">Name</label>
                    <Input
                      type="text"
                      placeholder="Enter Name"
                      value={newMember.name}
                      name="name"
                      onChange={handleNewInvite}
                    />
                  </div>
                  <div className="flex flex-col gap-3">
                    <label htmlFor="email">Email Address</label>
                    <Input
                      type="text"
                      placeholder="Enter Email Address"
                      value={newMember.email}
                      name="email"
                      onChange={handleNewInvite}
                    />
                  </div>
                  <div className="flex flex-col gap-3">
                    <label htmlFor="role">Department</label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="w-full p-2 py-3 rounded-[8px] space-x-4 mt-3 border-[#9b9ea4] border-[1px] flex justify-between bg-transparent items-center cursor-pointer"
                        >
                          <span className="text-sm">
                            {selectedDepartmentName || "Select Department"}
                          </span>
                          <img
                            src="/assets/icons/arrow-down.svg"
                            alt=""
                            className="w-3 h-3 ml-auto"
                          />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        className="w-[var(--radix-popper-anchor-width)] min-w-[var(--radix-popper-anchor-width)] cursor-pointer"
                      >
                        {departmentOptions.length > 0 ? (
                          departmentOptions.map((department) => (
                            <DropdownMenuItem
                              key={String(department.id)}
                              className="w-full text-center px-4 py-2 hover:bg-gray-200"
                              onClick={() => {
                                setSelectedDepartmentId(String(department.id));
                                setNewMember((prev) => ({
                                  ...prev,
                                  role: department.name,
                                }));
                              }}
                            >
                              {department.name}
                            </DropdownMenuItem>
                          ))
                        ) : (
                          <DropdownMenuItem
                            className="w-full text-center px-4 py-2 hover:bg-gray-200 text-[#023E8A]"
                            onClick={() => {
                              setIsAddMemberOpen(false);
                              setIsCreateRoleOpen(true);
                            }}
                          >
                            No roles yet — create one first
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex justify-end gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsAddMemberOpen(false)}
                      className="border-[#023E8A] text-[#023E8A] cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      disabled={isInviteLoading}
                      type="submit"
                      className="bg-[#023E8A] border-blue-100 hover:bg-blue-500 text-white cursor-pointer"
                    >
                      {isInviteLoading && (
                        <LoaderCircleIcon
                          stroke="#023E8A"
                          style={{ animation: "spin 1s linear infinite" }}
                        />
                      )}
                      Add Member
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog open={successModal} onOpenChange={setSuccessModal}>
              <DialogContent className="w-full lg:max-w-md max-w-sm p-8">
                <div className="space-y-[40px] flex flex-col items-center">
                  <DialogHeader className="text-center">
                    <DialogTitle className="text-xl font-[500] text-[#181818]">
                      Admin Added Successfully!
                    </DialogTitle>
                  </DialogHeader>
                  <img
                    src="/assets/images/Blue-check.svg"
                    alt="Success"
                    className="w-24 h-24"
                  />
                  <DialogDescription className="lg:text-lg text-[14px] text-gray-700 text-center px-4 font-[500]">
                    You have successfully invited a new Admin. An invitation
                    email has been sent to {lastInvitedEmail || "them"} to set up
                    their account.
                  </DialogDescription>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminRolesPage;
