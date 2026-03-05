import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Plus,
  LucideMoreVertical,
  LoaderCircleIcon,
} from "lucide-react";
import { FC, JSX, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Loading from "@/app/Dashboard/admin/loading";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@radix-ui/react-dialog";
import { DialogHeader } from "@/components/ui/dialog";

interface Role {
  id: string;
  name: string;
  description: string;
  assigned_users: { id?: number; name?: string; email?: string }[];
  current_permission_group_slugs: string[];
  is_superuser: boolean;
  created_by: string;
  invited_users: { id?: number; name?: string; email?: string }[];
}

interface RoleManagementProps {
  roles: Role[];
  onCreateRoleOpen: () => void;
  isLoading: boolean;
  onStartEdit: (role: Role) => void;
  roleToDelete: string | null;
  setRoleToDelete: (roleId: string | null) => void;
  showConfirmModal: boolean;
  setShowConfirmModal: (open: boolean) => void;
  confirmDeleteRole: () => void;
  successDeleteModal: boolean;
  setSuccessDeleteModal: (open: boolean) => void;
  isDeleteLoading: boolean;
}

const RoleManagement: FC<RoleManagementProps> = ({
  roles,
  onCreateRoleOpen,
  isLoading,
  onStartEdit,
  roleToDelete,
  setRoleToDelete,
  showConfirmModal,
  setShowConfirmModal,
  confirmDeleteRole,
  successDeleteModal,
  setSuccessDeleteModal,
  isDeleteLoading,
}): JSX.Element => {
  const router = useRouter();
  const [openActionRoleId, setOpenActionRoleId] = useState<string | null>(null);

  const toggleActionMenu = (roleId: string) => {
    setOpenActionRoleId((prev) => (prev === roleId ? null : roleId));
  };

  const ManageUsers = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return;
    const isSuperAdmin = role.name === "Super Admin" || role.is_superuser;
    router.push(
      isSuperAdmin
        ? `/Dashboard/admin/manage-super-admin/${roleId}/`
        : `/Dashboard/admin/manage-user/${roleId}/`
    );
  };
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (successDeleteModal) {
      const timeout = setTimeout(() => {
        setSuccessDeleteModal(false);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [successDeleteModal]);
  return (
    <div className="p-3 lg:p-0">
      {/* Header Section */}
      <div className="flex justify-between items-center md:gap-32 gap-6">
        {/* Search Input */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search roles..."
            className="pl-9 rounded-4xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Create Role Button */}
        <div className="flex items-center gap-2 justify-normal">
          <Button
            className="bg-[#023E8A] hover:bg-blue-800 cursor-pointer"
            onClick={onCreateRoleOpen}
          >
            <Plus className="md:mr-2 mr-0 h-4 w-4" />
            <span className="hidden md:block">Create New Role</span>
          </Button>
        </div>
      </div>

      {/* Table Section */}
      <div className="border rounded-lg mt-3 w-full overflow-x-auto">
        <table className="w-full lg:mb-32 mb-12">
          <thead>
            <tr className="bg-muted">
              <th className="text-left p-3 font-medium md:text-sm text-xs">
                Role Name
              </th>
              <th className="text-left p-3 font-medium md:text-sm text-xs">
                Description
              </th>
              <th className="text-left p-3 font-medium md:text-sm text-xs text-nowrap">
                Assigned Users
              </th>
              <th className="text-left p-3 font-medium md:text-sm text-xs pl-8">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="text-xs md:text-base">
            {/* Loading State */}
            {isLoading ? (
              <tr>
                <td colSpan={4} className="p-4 text-center">
                  <Loading />
                </td>
              </tr>
            ) : roles.length === 0 ? (
              // No Roles Found
              <tr>
                <td
                  colSpan={4}
                  className="p-4 text-center text-muted-foreground"
                >
                  No roles found.
                </td>
              </tr>
            ) : (
              // Render Roles
              roles
                .filter((r) =>
                  r.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((role) => (
                  <tr className="border-t" key={role.id}>
                    <td className="pl-3 p-3 md:text-base text-xs capitalize">
                      {role.is_superuser ? "Super Admin" : role.name}
                    </td>
                    <td className="pl-3 p-3 capitalize text-muted-foreground md:text-base text-xs">
                      {role.is_superuser
                        ? "Manage overall dashboard and settings"
                        : role.description}
                    </td>
                    <td className="pl-3 p-3 md:text-base text-xs">
                      {role.assigned_users.length} User
                      {role.assigned_users.length > 1 && "s"}
                    </td>
                    <td className="lg:pl-12 relative">
                      <LucideMoreVertical
                        className="cursor-pointer w-4"
                        onClick={() => toggleActionMenu(role.id)}
                      />

                      {openActionRoleId === role.id && (
                        <div className="absolute bg-white rounded-lg p-3 flex flex-col w-[150px]  border-[1px] border-white h-fit top-10 right-10 z-[99999] shadow-lg items-start">
                          {/* Edit Button */}
                          <p
                            className="cursor-pointer text-xs md:text-base pb-3"
                            onClick={() => {
                              onCreateRoleOpen();
                              onStartEdit(role);
                              setOpenActionRoleId(null);
                            }}
                          >
                            Edit
                          </p>

                          {/* Manage Users Button */}
                          <p
                            className=" cursor-pointer text-xs md:text-base pb-3"
                            onClick={() => {
                              ManageUsers(role.id);
                              setOpenActionRoleId(null);
                            }}
                          >
                            Manage User
                          </p>
                          {/* Delete Roles Button  */}
                          {role.name !== "Super Admin" && (
                            <p
                              className=" cursor-pointer text-xs md:text-base"
                              onClick={() => {
                                setRoleToDelete(role.id);
                                setOpenActionRoleId(null);
                                setShowConfirmModal(true);
                              }}
                            >
                              Delete
                            </p>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {/* CONFIRM DELETE MODAL  */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="w-full lg:max-w-lg max-w-sm p-4 m-auto absolute top-1/3 left-1/3 bg-white rounded-2xl shadow-2xl">
          <div className="lg:space-y-[40px] space-y-3 flex flex-col items-center">
            <DialogHeader className="text-left">
              <DialogTitle className="text-lg font-bold text-[#181818]">
                Delete Role?
              </DialogTitle>
            </DialogHeader>
            <DialogDescription className="lg:text-base text-[12px] text-[#4E4F52] text-left px-4">
              You are about to delete the "
              {roles.find((r) => r.id === roleToDelete)?.name || "this role"}".
              This action cannot be undone and all permissions for this role
              will be permanently cleared. Are you sure you want to proceed?
            </DialogDescription>
          </div>
          <div className="flex items-center gap-2 justify-end lg:pt-5 pt-2">
            <Button
              className="border text-black border-[#023E8A] p-2 bg-transparent hover:bg-transparent cursor-pointer"
              onClick={() => {
                setShowConfirmModal(false);
                setRoleToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                confirmDeleteRole();
              }}
              className="bg-[#D72638] p-2 px-4 hover:bg-red-700 cursor-pointer flex items-center"
            >
              {isDeleteLoading && (
                <LoaderCircleIcon
                  className="w-5 h-5 mr-2 text-white"
                  style={{
                    animation: "spin 1s linear infinite",
                  }}
                />
              )}
              Yes, Proceed
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* SUCCESS MODAL DELETE */}
      <Dialog open={successDeleteModal} onOpenChange={setSuccessDeleteModal}>
        <DialogContent className="w-full max-w-sm p-8 m-auto absolute top-1/3 left-1/3 bg-white rounded-2xl shadow-2xl">
          <div className="space-y-[40px] flex flex-col items-center  ">
            <img
              src="/assets/images/Blue-check.svg"
              alt="Success"
              className="w-24 h-24 "
            />
            <DialogHeader className="text-center">
              <DialogTitle className="text-xl font-[500] text-[#181818]">
                Role Deleted Successfully!
              </DialogTitle>
            </DialogHeader>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoleManagement;
