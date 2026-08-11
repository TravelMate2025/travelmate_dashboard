"use client";

import { useState, useEffect } from "react";
import {
  UserDetailsDialog,
  UserDropdown,
  UserDeleteDialog,
  LoadingUser,
  NotAuthorizedModal,
} from "@/components/molecues/user/DeleteUserComponent";
import type { UserDetails } from "@/components/molecues/user/DeleteUserComponent";

import {
  useGetDeletedUsers,
  useGetUser,
  useBulkDeleteUser,
} from "@/hooks/api/user";
import { useAuthContext } from "@/context/AuthContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { useMyRoles } from "@/hooks/api/roles";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";

const BulkDeleteConfirmationDialog = ({
  isOpen,
  selectedCount,
  onConfirm,
  onCancel,
  deleting,
}: {
  isOpen: boolean;
  selectedCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) => {
  const { loading, data } = useMyRoles({ modalVisible: isOpen });
  const canViewMessage = Boolean(data?.is_superuser);

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="lg:min-w-[800px] rounded-[16px] p-0 space-y-0">
        {canViewMessage ? (
          <>
            <div className="px-[32px] py-[8px]">
              <h2 className="font-[600] text-[28px] text-[#181818]">
                Confirm Bulk Deletion
              </h2>
            </div>
            <div className="w-full border-b-[1px] border-[#9B9EA4]"></div>
            <div className="py-[19px] px-[32px] space-y-[16px]">
              <p className="font-[400] text-[#4E4F52] text-[18px]">
                Are you sure you want to delete <strong>{selectedCount}</strong>{" "}
                user{selectedCount > 1 ? "s" : ""}? You are about to permanently
                erase this user from the system. This account is currently in a
                deleted state, but this action will remove all remaining data
                permanently and cannot be undone. Are you sure you want to
                continue?
              </p>
            </div>
            <div className="w-full border-b-[1px] border-[#9B9EA4]"></div>
            <div className="flex justify-end gap-4 w-full py-[19px] px-[32px]">
              <div
                className="border-[#023E8A] border-[1px] p-3 rounded-[8px] text-[#023E8A] font-[500] text-[16px] uppercase cursor-pointer"
                onClick={onCancel}
              >
                Cancel
              </div>
              <div
                className={`bg-[#D72638] p-3 rounded-[8px] text-[#fff] font-[500] text-[16px] uppercase cursor-pointer ${
                  deleting ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={onConfirm}
              >
                {deleting ? "Deleting..." : "Yes, Continue"}
              </div>
            </div>
          </>
        ) : (
          <NotAuthorizedModal />
        )}
      </DialogContent>
    </Dialog>
  );
};

type DeletedUsersTableProps = {
  searchTerm: string;
  selectedOption: string;
  dateRange?: {
    from: string;
    to: string;
  };
};

type DeletedUserItem = {
  id: string;
  name?: string;
  email?: string;
  registration_date?: string;
  deleted_at?: string;
  reason?: string;
};

export const DeletedUsersTable = ({
  searchTerm,
  selectedOption,
  dateRange,
}: DeletedUsersTableProps) => {
  void dateRange;
  const {
    users,
    loadNext,
    loadPrevious,
    loading,
    error,
    setSearchTerm,
    setIsActive,
    nextPageUrl,
    previousPageUrl,
    refetch,
  } = useGetDeletedUsers();
  const APP_STATE = useAuthContext();
  const isSuperuser = Boolean(APP_STATE?.user?.isSuperuser);

  const [selectedUser, setSelectedUser] = useState<DeletedUserItem | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [deactivatingUser, setDeactivatingUser] = useState<DeletedUserItem | null>(null);
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // New state for bulk delete confirmation dialog
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);

  // Bulk delete hook
  const { deleting, onBulkDeleteUser } = useBulkDeleteUser();

  const { data: userDetails, loading: userLoading } = useGetUser<UserDetails>({
    UserId: userId as string,
    initialFetch: !!userId,
    successCallback: (message) => {
      console.log("User details fetched successfully:", message);
    },
    errorCallback: (error) => {
      console.error("Error fetching user details:", error);
    },
  });

  useEffect(() => {
    setSearchTerm(searchTerm || "");
    setIsActive(selectedOption || null);
  }, [searchTerm, selectedOption, setSearchTerm, setIsActive]);

  // Bulk delete handlers
  const handleBulkDeleteClick = () => {
    if (selectedUserIds.length === 0) return;
    setIsBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = async () => {
    setIsBulkDeleteDialogOpen(false);
    if (selectedUserIds.length === 0) return;

    try {
      const userIds = selectedUserIds.map((id) => parseInt(id, 10));
      await onBulkDeleteUser({
        userIds,
        successCallback: () => {
          setSelectedUserIds([]);
          refetch();
        },
      });
    } catch (error) {
      console.error("Error during bulk deletion:", error);
    }
  };

  const cancelBulkDelete = () => {
    setIsBulkDeleteDialogOpen(false);
  };

  const handleViewDetails = (user: DeletedUserItem) => {
    setSelectedUser(user);
    setUserId(user.id);
  };

  const handleDeactivateUser = (user: DeletedUserItem) => {
    setDeactivatingUser(user);
    setIsDeactivateDialogOpen(true);
  };

  const confirmDeactivation = () => {
    if (deactivatingUser) {
      setDeactivatingUser(null);
      setIsDeactivateDialogOpen(false);
    }
  };

  const handleDialogClose = () => {
    setSelectedUser(null);
    setUserId(null);
  };

  const cancelDeactivation = () => {
    setDeactivatingUser(null);
    setIsDeactivateDialogOpen(false);
  };

  const toggleSelectUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedUserIds(checked ? users.map((user) => user.id) : []);
  };

  return (
    <div className="relative w-full">
      {isSuperuser && selectedUserIds.length > 0 && (
        <div className="flex justify-end mb-4">
          <button
            className={`text-white text-[14px] font-[400] py-2 px-4 rounded-[8px] transition duration-200 ${
              deleting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-red-500 hover:bg-red-600"
            }`}
            onClick={handleBulkDeleteClick}
            disabled={deleting}
          >
            {deleting
              ? "Deleting..."
              : `Delete Selected Users (${selectedUserIds.length})`}
          </button>
        </div>
      )}

      <div className="bg-white rounded-[20px] border border-gray-300 w-full overflow-hidden">
        <div className="max-w-[95vw] lg:max-w-full overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            {loading ? (
              <LoadingUser />
            ) : (
              <>
                {users.length === 0 ? (
                  <div className="h-[80px] flex justify-center items-center">
                    <p className="text-[20px] font-[500] text-[#181818]">
                      No data found
                    </p>
                  </div>
                ) : error ? (
                  <div className="h-[80px] flex justify-center items-center">
                    <p className="text-[20px] font-[500] text-[#181818]">
                      We cannot fetch users at the moment. Please try again.
                    </p>
                  </div>
                ) : (
                  <Table className="w-full min-w-[800px]">
                    <TableHeader className="bg-gray-100">
                      <TableRow>
                        {isSuperuser && (
                          <TableHead className="py-4 px-6 text-sm font-semibold text-gray-700 text-left w-1/12">
                            <input
                              type="checkbox"
                              className="w-5 h-5 rounded border-gray-300 text-red-500 focus:ring-red-400"
                              title="Select all users"
                              aria-label="Select all users"
                              onChange={(e) => handleSelectAll(e.target.checked)}
                              checked={
                                users.length > 0 &&
                                selectedUserIds.length === users.length
                              }
                              disabled={deleting}
                            />
                          </TableHead>
                        )}
                        <TableHead className="py-4 px-6 text-sm font-semibold text-gray-700 text-left">
                          User ID
                        </TableHead>
                        <TableHead className="py-4 px-6 text-sm font-semibold text-gray-700 text-left">
                          Name
                        </TableHead>
                        <TableHead className="py-4 px-6 text-sm font-semibold text-gray-700 text-left">
                          Email Address
                        </TableHead>
                        <TableHead className="py-4 px-6 text-sm font-semibold text-gray-700 text-left">
                          Registration Date
                        </TableHead>
                        <TableHead className="py-4 px-6 text-sm font-semibold text-gray-700 text-left">
                          Deletion Date
                        </TableHead>
                        <TableHead className="py-4 px-6 text-sm font-semibold text-gray-700 text-left">
                          Deletion Reason
                        </TableHead>
                        <TableHead className="py-4 px-6 text-sm font-semibold text-gray-700 text-center">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow
                          key={user.id}
                          className="bg-white hover:bg-gray-50 transition duration-200 cursor-pointer"
                        >
                          {isSuperuser && (
                            <TableCell className="py-4 px-6 text-[14px] font-[400] text-[#181818]">
                              <input
                                type="checkbox"
                                className="w-5 h-5 rounded border-gray-300 text-red-500 focus:ring-red-400"
                                title={`Select ${user.name || user.email}`}
                                aria-label={`Select ${user.name || user.email}`}
                                checked={selectedUserIds.includes(user.id)}
                                onChange={() => toggleSelectUser(user.id)}
                                disabled={deleting}
                              />
                            </TableCell>
                          )}
                          <TableCell className="py-4 px-6 text-[14px] font-[400] text-[#181818]">
                            {user.id}
                          </TableCell>
                          <TableCell className="py-4 px-6 text-[14px] font-[400] text-[#181818]">
                            {user.name}
                          </TableCell>
                          <TableCell className="py-4 px-6 text-[14px] font-[400] text-[#181818]">
                            {user.email}
                          </TableCell>
                          <TableCell className="py-4 px-6 text-[14px] font-[400] text-[#181818]">
                            {user.registration_date
                              ? format(new Date(user.registration_date), "MM/dd/yyyy")
                              : "---"}
                          </TableCell>
                          <TableCell className="py-4 px-6 text-[14px] font-[400] text-[#181818]">
                            {user.deleted_at
                              ? format(new Date(user.deleted_at), "MM/dd/yyyy")
                              : "---"}
                          </TableCell>
                          <TableCell className="py-4 px-6 text-[14px] font-[400] text-[#181818]">
                            {user?.reason || "---"}
                          </TableCell>
                          <TableCell className="py-4 px-6 text-center">
                            <UserDropdown
                              parentWidth={180}
                              onViewDetails={() => handleViewDetails(user)}
                              onDeactivate={() => handleDeactivateUser(user)}
                              canDelete={isSuperuser}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {selectedUser && (
        <UserDetailsDialog
          selectedUser={selectedUser}
          userDetails={userDetails}
          userLoading={userLoading}
          onClose={handleDialogClose}
        />
      )}

      {isDeactivateDialogOpen && deactivatingUser && (
        <UserDeleteDialog
          isOpen={isDeactivateDialogOpen}
          deactivatingUser={deactivatingUser}
          onCancel={cancelDeactivation}
          refetch={refetch}
        />
      )}

      <BulkDeleteConfirmationDialog
        isOpen={isBulkDeleteDialogOpen}
        selectedCount={selectedUserIds.length}
        onConfirm={confirmBulkDelete}
        onCancel={cancelBulkDelete}
        deleting={deleting}
      />

      <div className="flex justify-end mt-[20px] space-x-4">
        <button
          className={`text-[#023E8A] text-[14px] font-[400] py-2 px-3 border-[1px] rounded-[8px] ${
            previousPageUrl && !deleting
              ? "border-[#023E8A] hover:bg-blue-50"
              : "cursor-not-allowed border-gray-300 text-gray-400"
          }`}
          disabled={!previousPageUrl || deleting}
          onClick={loadPrevious}
        >
          Previous
        </button>
        <button
          className={`text-[#023E8A] text-[14px] font-[400] py-2 px-3 border-[1px] rounded-[8px] ${
            nextPageUrl && !deleting
              ? "border-[#023E8A] hover:bg-blue-50"
              : "cursor-not-allowed border-gray-300 text-gray-400"
          }`}
          disabled={!nextPageUrl || deleting}
          onClick={loadNext}
        >
          Next
        </button>
      </div>
    </div>
  );
};
