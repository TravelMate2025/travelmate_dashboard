import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, LoaderCircleIcon } from "lucide-react";
import { FC } from "react";
import { useRouter } from "next/navigation";
import Loading from "@/app/Dashboard/admin/loading";
import { showErrorToast } from "@/utils/toasters";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
} from "@/components/ui/dialog";
import { removeUsersFromRole } from "@/services/admin";

interface RoleUser {
  id?: number;
  name?: string;
  email?: string;
  [key: string]: unknown;
}

interface Role {
  id: string;
  name: string;
  description: string;
  assigned_users: RoleUser[];
  current_permission_group_slugs: string[];
  is_superuser: boolean;
  created_by: string;
  invited_users: RoleUser[];
}
interface RoleAssignmentProps {
  roles: Role[]; // Array of roles to display
  onCreateRoleOpen: () => void; // Callback to open Create Role modal
  onAddMemberOpen: () => void;
  isLoading?: boolean;
  revokeInvite: (id: string, email: string) => void;
  setAdminDetails: React.Dispatch<React.SetStateAction<Role[]>>;
}

const normalizeRoleName = (value?: string | null) =>
  (value || "").trim().toLowerCase().replace(/\s+/g, " ");

const isSuperAdminRole = (role?: Pick<Role, "name" | "is_superuser"> | null) =>
  Boolean(role?.is_superuser) || normalizeRoleName(role?.name) === "super admin";

const RoleAssignment: FC<RoleAssignmentProps> = ({
  onAddMemberOpen,
  roles,
  isLoading,
  revokeInvite,
  setAdminDetails,
}) => {
  const [showSuccessRemoveModal, setShowSuccessRemoveModal] = useState(false);
  const [showConfirmRemoveModal, setShowConfirmRemoveModal] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [selectedUserEmail, setSelectedUserEmail] = useState<string | null>(
    null
  );

  const currentRole = roles.find(
    (role) => String(role.id) === String(selectedRoleId)
  );
  const route = useRouter();
  const [loadingRemove, setLoadingRemove] = useState<{
    [key: string]: boolean;
  }>({});

  const ManageUsers = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return;
    const isSuperAdmin = isSuperAdminRole(role);
    route.push(
      isSuperAdmin
        ? `/Dashboard/admin/manage-super-admin/${roleId}/`
        : `/Dashboard/admin/manage-user/${roleId}/`
    );
  };

  const handleRemoveUser = async (roleId: string, userEmail: string) => {
    try {
      setLoadingRemove((prev) => ({ ...prev, [userEmail]: true }));

      await removeUsersFromRole(roleId, userEmail);
      const updatedRoles = roles.map((role) =>
        role.id === roleId
          ? {
              ...role,
              assigned_users: role.assigned_users.filter(
                (user) => user.email !== userEmail
              ),
            }
          : role
      );

      setAdminDetails(updatedRoles);
      setShowConfirmRemoveModal(false);
      setShowSuccessRemoveModal(true);
    } catch (error: unknown) {
      console.log(error);
      const errorMessage =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: unknown }).response === "object"
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : undefined;
      showErrorToast({
        message: errorMessage || "Failed to remove user.",
      });
    } finally {
      setSelectedRoleId(null);
      setSelectedUserEmail(null);
      setLoadingRemove((prev) => ({ ...prev, [userEmail]: false }));
    }
  };

  const [searchQuery, setSearchQuery] = useState("");

  const filteredRoles = useMemo(() => {
    return roles.filter((role) => {
      const query = searchQuery.toLowerCase();
      const isRoleNameMatch = role.name.toLowerCase().includes(query);
      const isAssignedUserMatch = role?.assigned_users?.some((user) =>
        (user.name || "").toLowerCase().includes(query)
      );
      return isRoleNameMatch || isAssignedUserMatch;
    });
  }, [roles, searchQuery]);

  return (
    <>
      <div className="p-4 lg:p-0">
        <div className="flex justify-between items-center md:gap-32 gap-6">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search roles..."
              className="pl-9 rounded-4xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            className="bg-[#023E8A] hover:bg-blue-800 cursor-pointer"
            onClick={onAddMemberOpen}
          >
            <Plus className="md:mr-2 mr-0 h-4 w-4" />
            <span className="hidden md:block">Invite New Member</span>
          </Button>
        </div>
        {isLoading ? (
          <Loading />
        ) : (
          filteredRoles.map((role, index) => (
            <div key={index} className="space-y-3 pt-5 pb-12">
              <div>
                <h3 className="text-lg font-medium">{role.name || ""}</h3>
                <p className="text-muted-foreground text-sm pt-2 py-3">
                  {role.description || ""}
                </p>
                <p className="pt-2 text-[16px]">
                  Assigned users ({role.assigned_users?.length})
                </p>
              </div>
              {role.assigned_users?.map((assigned, i) => (
                <div
                  className=" flex justify-between w-full lg:items-center align-top lg:align-middle"
                  key={i}
                >
                  <div className="flex flex-col justify-normal ">
                    <p className="font-medium">
                      {assigned?.name || assigned?.email || "Unnamed User"}
                    </p>
                    <p className="text-slate-600">{assigned?.email}</p>
                  </div>

                  {!isSuperAdminRole(role) && (
                    <Button
                      variant="link"
                      className={`text-red-600
                       hover:text-red-800 p-0 cursor-pointer`}
                      onClick={() => {
                        setSelectedRoleId(role.id);
                        setSelectedUserEmail(assigned.email);
                        setShowConfirmRemoveModal(true);
                        setSelectedRoleId(role.id);
                      }}
                      disabled={loadingRemove[assigned?.email]}
                    >
                      {loadingRemove[assigned.email] ? "Removing" : "Remove"}
                    </Button>
                  )}
                </div>
              ))}
              {role.invited_users?.map((invited, i) => (
                <div
                  className=" flex justify-between w-full items-center"
                  key={i}
                >
                  <p className="font-medium">{invited.name || ""}</p>
                  <Button
                    variant="link"
                    className={`text-blue-600
                      hover:text-blue-800 p-0`}
                  >
                    Invited
                  </Button>
                  <Button
                    onClick={() => revokeInvite(role.id, invited.email)}
                    variant="link"
                    className={` text-green-600
                      hover:text-green-800 p-0`}
                  >
                    Revoke Invite
                  </Button>
                </div>
              ))}
              <Button
                className="w-full h-12 bg-[#CCD8E8] text-[#023E8A] hover:bg-muted/80 cursor-pointer"
                onClick={() => ManageUsers(role.id)}
                disabled={role.assigned_users.length === 0}
              >
                Manage Users
              </Button>
            </div>
          ))
        )}

        {/* MODAL TO SHOW REMOVE SUCCESSFUL  */}
        <Dialog
          open={showSuccessRemoveModal}
          onOpenChange={setShowSuccessRemoveModal}
        >
          <DialogContent className="w-full lg:max-w-sm max-w-sm p-8">
            <div className="flex flex-col items-center">
              <DialogHeader className="text-center">
                <DialogTitle className="text-xl font-[500] text-[#181818]"></DialogTitle>
              </DialogHeader>
              <img
                src="/assets/icons/blue-success.svg"
                alt="Success"
                className="w-20 h-20 my-6"
              />
              <DialogDescription className="lg:text-lg text-[14px] text-gray-700 text-center px-4 font-bold">
                Users Removed Successfully
              </DialogDescription>
            </div>
          </DialogContent>
        </Dialog>
        {/* MODAL TO CONFIRM DELETE OR REMOVE ADMIN  */}
        <Dialog
          open={showConfirmRemoveModal}
          onOpenChange={setShowConfirmRemoveModal}
        >
          <DialogContent className="w-full lg:max-w-lg max-w-sm p-4">
            <div className="space-y-[40px] flex flex-col items-center">
              <DialogHeader className="text-left">
                <DialogTitle className="text-xl font-bold text-[#181818]">
                  Confirm Remove Users?
                </DialogTitle>
              </DialogHeader>
              <DialogDescription className="lg:text-base text-[12px] text-gray-700 text-left px-4 font-[500]">
                You are about to remove the selected users from{" "}
                {currentRole?.name} role. They will no longer have access to
                these role permissions. Do you want to proceed?
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2 justify-end pt-5">
              <Button
                className="border text-black border-[#023E8A] p-2 bg-transparent hover:bg-transparent cursor-pointer"
                onClick={() => setShowConfirmRemoveModal(false)}
              >
                Cancel
              </Button>

              <Button
                className="bg-[#023E8A] p-2 px-4 hover:bg-blue-700 cursor-pointer"
                onClick={() => {
                  if (selectedRoleId && selectedUserEmail) {
                    handleRemoveUser(selectedRoleId, selectedUserEmail);
                  }
                }}
              >
                {selectedUserEmail && loadingRemove[selectedUserEmail] ? (
                  <LoaderCircleIcon
                    stroke="#ffffff"
                    className="animate-spin mr-2 w-4 h-4"
                  />
                ) : null}
                Yes, Proceed
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};
export default RoleAssignment;
