"use client";
import { useState } from "react";
import { useMyRoles } from "@/hooks/api/roles";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { format } from "date-fns";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import { useDeleteUser } from "@/hooks/api/user";

const normalizePermissionSlug = (value?: string | null) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-");

const hasPermission = (slugs: unknown, target: string) => {
  if (!Array.isArray(slugs)) return false;

  const normalizedTarget = normalizePermissionSlug(target);
  const normalizedSet = new Set(
    slugs.map((slug) => normalizePermissionSlug(String(slug)))
  );

  return normalizedSet.has(normalizedTarget);
};

const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex justify-between">
    <p className="text-[18px] font-[400] text-[#181818] ">{label}</p>
    <span className="text-[18px] font-[600] text-[#181818]">{value}</span>
  </div>
);

type UserDetails = {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  date_created?: string;
  deleted_at?: string;
  gender?: string;
  date_of_birth?: string;
  mobile_number?: string;
  address?: string;
  deactivation_reason?: {
    reason?: string;
  };
};

type UserDetailsDialogProps = {
  selectedUser: { id: string } | null;
  userDetails: UserDetails | null;
  userLoading: boolean;
  onClose: () => void;
};

export const UserDetailsDialog = ({
  selectedUser,
  userDetails,
  userLoading,
  onClose,
}: UserDetailsDialogProps) => {
  console.log(userDetails);
  return (
    <Dialog open={Boolean(selectedUser)} onOpenChange={onClose}>
      <DialogContent className="lg:min-w-[800px] rounded-[16px] p-0 space-y-0 ">
        <DialogTitle></DialogTitle>
        <div className="px-[32px] py-[8px] ">
          <h2 className="font-[600] text-[28px] text-[#181818] ">
            User Details
          </h2>
        </div>
        <div className="w-full border-b-[1px] border-[#9B9EA4] "></div>
        <div className="py-[19px] px-[32px]">
          {userLoading ? (
            <p>Loading user details...</p>
          ) : userDetails ? (
            <div className="space-y-[28px]">
              <DetailRow label="USERID" value={userDetails.id} />
              <DetailRow
                label="Name"
                value={`${userDetails.first_name} ${userDetails.last_name}`}
              />
              <DetailRow label="Email" value={userDetails.email} />
              <DetailRow
                label="Registration Date"
                value={format(new Date(userDetails.date_created), "MM/dd/yyyy")}
              />
              <DetailRow
                label="Deletion Date"
                value={format(new Date(userDetails.deleted_at), "MM/dd/yyyy")}
              />
              <DetailRow
                label="Gender"
                value={userDetails.gender || "Not Available"}
              />
              <DetailRow
                label="Date Of Birth"
                value={userDetails.date_of_birth || "Not Available"}
              />
              <DetailRow
                label="Mobile Number"
                value={userDetails.mobile_number || "Not Available"}
              />
              <DetailRow
                label="Address"
                value={userDetails.address || "Not Available"}
              />
              <DetailRow
                label="Deletion Reason"
                value={
                  userDetails.deactivation_reason.reason || "Not Available"
                }
              />
            </div>
          ) : (
            <p>No details available for this user.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const UserDeleteDialog = ({
  deactivatingUser,
  isOpen,
  onCancel,
}: {
  deactivatingUser: { id: string } | null;
  isOpen: boolean;
  onCancel: () => void;
}) => {
  const { deleting, onDeleteUser } = useDeleteUser();
  const { loading, data } = useMyRoles({ modalVisible: isOpen });
  const canViewMessage = hasPermission(
    data?.current_permission_group_slugs,
    "user-management"
  );

  const handleConfirm = () => {
    if (!deactivatingUser?.id) return;

    onDeleteUser({
      userId: deactivatingUser.id,
      successCallback: () => {
        onCancel();
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="lg:min-w-[800px] rounded-[16px] p-0 space-y-0 ">
        {canViewMessage ? (
          <>
            <DialogTitle></DialogTitle>
            <div className="px-[32px] py-[8px] ">
              <h2 className="font-[600] text-[28px] text-[#181818] ">
                Confirm Deletion
              </h2>
            </div>
            <div className="w-full border-b-[1px] border-[#9B9EA4]"></div>
            <div className="py-[19px] px-[32px] space-y-[16px]">
              <p className=" font-[400] text-[#4E4F52] text-[18px] ">
                You are about to permanently erase this user from the system.
                This account is currently in a deleted state, but this action
                will remove all remaining data permanently and cannot be undone.
                Are you sure you want to continue?
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
                onClick={handleConfirm}
              >
                {deleting ? "Deleting..." : "Yes, Continue"}
              </div>
            </div>
          </>
        ) : (
          <NotAuthorizedModal ticketDetails={deactivatingUser} />
        )}
      </DialogContent>
    </Dialog>
  );
};

export const NotAuthorizedModal = () => {
  const router = useRouter();
  return (
    <div className="text-center p-6 flex flex-col space-y-2 items-center justify-center min-h-[400px]">
      <AlertTriangle className="w-20 h-20 mx-auto text-red-500" />
      <h1 className="mt-4 text-[#181818] text-[20px] font-semibold">
        You cannot view this message.
      </h1>
      <p className="mt-4 text-gray-600">
        You don't have the Authorization to delete an account. <br /> Please
        contact your administrator for assistance.
      </p>
    </div>
  );
};

export const UserDropdown = ({
  parentWidth,
  onViewDetails,
  onDeactivate,
}: {
  parentWidth: number;
  onViewDetails: () => void;
  onDeactivate: () => void;
}) => {
  const options = [
    { label: "View Details", action: onViewDetails },
    { label: "Delete", action: onDeactivate },
  ];

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="text-gray-500 hover:text-gray-700 cursor-pointer flex justify-center">
            <img src="/assets/icons/tableMenu.svg" alt="Menu" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="absolute z-10 mt-2 border border-gray-300 rounded-lg bg-white shadow-lg"
          style={{
            minWidth: "180px",
            maxWidth: parentWidth - 16,
            overflow: "hidden",
            left: "auto",
            right: 0,
          }}
        >
          {options.map((option) => (
            <DropdownMenuItem
              key={option.label}
              onClick={option.action}
              className={`px-3 py-2 ${
                option.label === "Delete"
                  ? "text-red-600 hover:text-red-600 "
                  : "text-gray-700"
              } hover:bg-gray-100`}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export const LoadingUser = () => {
  return (
    <div className="w-full space-y-[12px] px-6 py-[10px] ">
      <div className="bg-gray-300 rounded-[12px] animate-pulse h-[50px] w-ful"></div>
      <div className="bg-gray-300 rounded-[12px] animate-pulse h-[50px] w-ful"></div>
      <div className="bg-gray-300 rounded-[12px] animate-pulse h-[50px] w-ful"></div>
      <div className="bg-gray-300 rounded-[12px] animate-pulse h-[50px] w-ful"></div>
      <div className="bg-gray-300 rounded-[12px] animate-pulse h-[50px] w-ful"></div>
    </div>
  );
};
