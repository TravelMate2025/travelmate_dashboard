"use client";
import { useState } from "react";
import { SuccessModal } from "@/components/reuseables/SuccessModal";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import {
  useGetUser,
  useDeactivateUser,
  useReactivateUser,
} from "@/hooks/api/user";
import { AlertTriangle } from "lucide-react";
import { useMyRoles } from "@/hooks/api/roles";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

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
    <p className="text-[12px] lg:text-[18px] font-[400] text-[#181818] ">
      {label}
    </p>
    <span className="text-[12px] lg:text-[18px] font-[500] lg:font-[600] text-[#181818]">
      {value}
    </span>
  </div>
);

export type UserRecord = {
  id?: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string;
  date_created?: string;
  gender?: string | null;
  date_of_birth?: string | null;
  mobile_number?: string | null;
  address?: string | null;
  is_active?: boolean;
};

type UserDetailsDialogProps = {
  selectedUser: UserRecord | null;
  userDetails: UserRecord | null;
  userLoading: boolean;
  onClose: () => void;
};

export const UserDetailsDialog = ({
  selectedUser,
  userDetails,
  userLoading,
  onClose,
}: UserDetailsDialogProps) => {
  return (
    <Dialog open={Boolean(selectedUser)} onOpenChange={onClose}>
      <DialogContent className="lg:min-w-[800px] rounded-[16px] p-0 space-y-0 ">
        <DialogTitle></DialogTitle>
        <div className=" px-[16px] lg:px-[32px] py-[8px] ">
          <h2 className="font-[600] text-[16px] lg:text-[28px] text-[#181818] ">
            User Details
          </h2>
        </div>
        <div className="w-full border-b-[1px] border-[#9B9EA4] "></div>
        <div className="py-[19px] px-[16px] lg:px-[32px]">
          {userLoading ? (
            <LoadingUser />
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
                value={format(new Date(userDetails.date_created ?? ""), "MM/dd/yyyy")}
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

              <div className="flex justify-between">
                <p className="text-[18px] font-[400] text-[#181818] ">Status</p>
                <span
                  className={`p-[10px] border-[1px] rounded-[12px] text-[14px] uppercase font-[400] ${
                    userDetails.is_active
                      ? "bg-[#2D9C5E1A] text-green-700 border-[#2D9C5E]"
                      : "bg-[#D726380D] text-red-700 border-[#D72638]"
                  }`}
                >
                  {userDetails.is_active ? "Active" : "Deactivated"}
                </span>
              </div>
            </div>
          ) : (
            <p>No details available for this user.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const UserDeactivationDialog = ({
  deactivatingUser,
  isOpen,
  onConfirm,
  onCancel,
  refetch,
}: {
  deactivatingUser: UserRecord | null;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  refetch: () => void;
}) => {
  const { deactivating, onDeactivateUser } = useDeactivateUser();
  const [showModal, setShowModal] = useState(false);
  const [showError, setShowError] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [additionalNote, setAdditionalNote] = useState<string>("");

  const { loading, data } = useMyRoles({ modalVisible: isOpen });
  const canViewMessage = hasPermission(
    data?.current_permission_group_slugs,
    "user-management"
  );

  const handleDeactivate = () => {
    if (!reason || !additionalNote) {
      setShowError(true);
      return;
    }

    onDeactivateUser({
      payload: {
        email: deactivatingUser?.email ?? "",
        reason,
        additional_note: additionalNote,
      },
      userId: deactivatingUser?.id ?? "",
      successCallback: () => {
        onCancel();
        setShowModal(true);
      },
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onCancel}>
        <DialogContent className="lg:min-w-[800px] rounded-[16px] p-0 space-y-0">
          {loading ? (
            <div className="flex justify-center items-center h-[300px]">
              <div className="w-12 h-12 border-4 border-gray-800 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : canViewMessage ? (
            <>
              <DialogTitle></DialogTitle>
              <div className="px-[32px] py-[8px]">
                <h2 className="font-[600] text-[28px] text-[#181818]">
                  Deactivate User Account
                </h2>
              </div>
              <div className="w-full border-b-[1px] border-[#9B9EA4]"></div>
              <div className="py-[19px] px-[32px] space-y-[16px]">
                <div className="space-y-4">
                  <p className="text-[20px] font-[500] text-[#181818]">
                    Deactivation Reason
                  </p>
                  <MiniDropdown
                    options={[
                      { id: "1", label: "Suspicious account activity" },
                      { id: "2", label: "Multiple policy violations" },
                      {
                        id: "3",
                        label: "Fake or misleading profile information",
                      },
                      { id: "4", label: "Multiple booking cancellations" },
                      { id: "5", label: "Fraudulent payment activity" },
                      { id: "6", label: "User reported by multiple hosts" },
                      { id: "7", label: "Terms of service violation" },
                    ]}
                    placeholder="Select"
                    onSelect={(option) => setReason(option?.label || null)}
                  />
                </div>
                <div className="space-y-3 w-full">
                  <p className="text-[20px] font-[500] text-[#181818]">
                    Additional Reason
                  </p>
                  <textarea
                    rows={6}
                    className="py-[16px] w-full px-[12px] rounded-[8px] border-[#818489] border-[1px] font-[400] text-[16px] text-[#181818] placeholder:font-[400] placeholder:text-[16px] placeholder:text-[#818489]"
                    placeholder="Type here..."
                    value={additionalNote}
                    onChange={(e) => setAdditionalNote(e.target.value)}
                  ></textarea>
                </div>

                {showError && (
                  <div className="text-red-500 text-sm">
                    Please provide all required information.
                  </div>
                )}

                <div className="bg-[#F5F5F5] rounded-[12px] p-4 flex space-x-[10px] items-start">
                  <img src="/assets/icons/info.svg" alt="" />
                  <span className="lg:text-[18px] text-[12px] font-[400] text-[#181818]">
                    The selected reason as well as the additional reason will be
                    sent to the user's email to inform them of their account
                    deactivation.
                  </span>
                </div>

                <div className="flex justify-end gap-4 w-full">
                  <div
                    className="border-[#023E8A] border-[1px] p-3 rounded-[8px] text-[#023E8A] font-[500] text-[16px] uppercase cursor-pointer"
                    onClick={onCancel}
                  >
                    Cancel
                  </div>
                  <div
                    className={`bg-[#D72638] p-3 rounded-[8px] text-[#fff] font-[500] text-[16px] uppercase ${
                      !reason || !additionalNote
                        ? "cursor-not-allowed opacity-25"
                        : "cursor-pointer"
                    }`}
                    onClick={() => {
                      if (reason && additionalNote) {
                        handleDeactivate();
                      }
                    }}
                  >
                    {deactivating
                      ? "Deactivating user..."
                      : "Confirm Deactivation"}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <NotAuthorizedModal string={"deactivate"} />
          )}
        </DialogContent>
      </Dialog>

      {showModal && (
        <SuccessModal
          title="User Deactivated Successfully"
          description="You have successfully deactivated a user."
          onClose={() => setShowModal(false)}
          dlink="/Dashboard/user"
          refetch={refetch}
        />
      )}
    </>
  );
};

type MiniDropdownOption = {
  id: string;
  label: string;
};

type MiniDropdownProps = {
  options: MiniDropdownOption[];
  placeholder?: string;
  onSelect: (value: MiniDropdownOption | null) => void;
};

const MiniDropdown = ({
  options,
  placeholder,
  onSelect,
}: MiniDropdownProps) => {
  const [selectedOption, setSelectedOption] =
    useState<MiniDropdownOption | null>(null);

  const handleSelect = (option: MiniDropdownOption) => {
    setSelectedOption(option);
    onSelect(option);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-full p-4 rounded-[8px] border-[#818489] border-[1px] flex justify-between bg-transparent">
          {selectedOption?.label || placeholder}
          <img src="/assets/icons/arrow-down.svg" alt="Dropdown Arrow" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-[var(--radix-popper-anchor-width)] min-w-[var(--radix-popper-anchor-width)]"
      >
        {options.map((option) => (
          <DropdownMenuItem
            key={option.label}
            className="w-full text-center px-4 py-2 hover:bg-gray-200"
            onClick={() => handleSelect(option)}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const UserDropdown = ({
  parentWidth,
  onViewDetails,
  onActivate,
  onDeactivate,
  status,
  canManageUsers = true,
}: {
  parentWidth: number;
  onViewDetails: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
  status: boolean;
  canManageUsers?: boolean;
}) => {
  const options = [{ label: "View Details", action: onViewDetails }];

  if (canManageUsers) {
    options.push({
      label: status ? "Deactivate Account" : "Activate Account",
      action: status ? onDeactivate : onActivate,
    });
  }

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
              className="px-3 py-2 text-gray-700 hover:bg-gray-100"
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

export const UserActivationDialog = ({
  reactivatingUser,
  isOpen,
  onConfirm,
  onCancel,
  refetch,
}: {
  reactivatingUser: UserRecord | null;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  refetch: () => void;
}) => {
  const [reason, setReason] = useState<string | null>(null);
  const [additionalNote, setAdditionalNote] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const { loading, data } = useMyRoles({ modalVisible: isOpen });
  const { reactivating, onReactivateUser } = useReactivateUser();
  const canViewMessage = hasPermission(
    data?.current_permission_group_slugs,
    "user-management"
  );

  const handleReactivate = () => {
    onReactivateUser({
      payload: {
        email: reactivatingUser?.email ?? "",
        reason: reason || "",
        additional_note: additionalNote || "",
      },
      userId: reactivatingUser?.id ?? "",
      successCallback: () => {
        onCancel();
        setShowModal(true);
      },
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onCancel}>
        <DialogContent className="lg:min-w-[800px] rounded-[16px] p-0 space-y-0">
          {loading ? (
            <div className="flex justify-center items-center h-[300px]">
              <div className="w-12 h-12 border-4 border-gray-800 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : canViewMessage ? (
            <>
              <DialogTitle></DialogTitle>
              <div className="px-[32px] py-[8px]">
                <h2 className="font-[600] text-[28px] text-[#181818]">
                  Reactivate User Account
                </h2>
              </div>
              <div className="w-full border-b-[1px] border-[#9B9EA4]"></div>
              <div className="py-[19px] px-[32px] space-y-[16px]">
                <div className="space-y-4">
                  <p className="text-[20px] font-[500] text-[#181818]">
                    Reactivation Reason
                  </p>

                  <MiniDropdown
                    options={[
                      { id: "1", label: "User appeal approved" },
                      { id: "2", label: "Administrative error" },
                      { id: "3", label: "Payment issues resolved" },
                      { id: "4", label: "Policy update compliance" },
                      { id: "5", label: "Other" },
                    ]}
                    placeholder="Select"
                    onSelect={(option) => setReason(option?.label || null)}
                  />
                </div>
                <div className="space-y-3 w-full">
                  <p className="text-[20px] font-[500] text-[#181818]">
                    Additional Details
                  </p>

                  <textarea
                    rows={6}
                    className="py-[16px] w-full px-[12px] rounded-[8px] border-[#818489] border-[1px] font-[400] text-[16px] text-[#181818] placeholder:font-[400] placeholder:text-[16px] placeholder:text-[#818489]"
                    placeholder="Provide additional details for the reactivation..."
                    value={additionalNote}
                    onChange={(e) => setAdditionalNote(e.target.value)}
                  ></textarea>
                </div>

                <div className="bg-[#F5F5F5] rounded-[12px] p-4 flex space-x-[10px] items-start">
                  <img src="/assets/icons/info.svg" alt="Info icon" />
                  <span className="lg:text-[18px] text-[12px] font-[400] text-[#181818]">
                    The reactivation reason and additional details will be sent
                    to the user's email to inform them about their account
                    reactivation.
                  </span>
                </div>

                <div className="flex justify-end gap-4 w-full">
                  <div
                    className="border-[#023E8A] border-[1px] p-3 rounded-[8px] text-[#023E8A] font-[500] text-[16px] uppercase cursor-pointer"
                    onClick={onCancel}
                  >
                    Cancel
                  </div>
                  <div
                    className={`bg-[#023E8A] p-3 rounded-[8px] text-[#fff] font-[500] text-[16px] uppercase ${
                      !reason
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-pointer"
                    }`}
                    onClick={handleReactivate}
                  >
                    {reactivating ? "Reactivating user..." : "Reactivate User"}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <NotAuthorizedModal string={"Reactivate"} />
          )}
        </DialogContent>
      </Dialog>

      {showModal && (
        <SuccessModal
          title="User Reactivated Successfully"
          description={`User ${reactivatingUser?.email} has been successfully reactivated.`}
          onClose={() => setShowModal(false)}
          dlink="/Dashboard/user"
          refetch={refetch}
        />
      )}
    </>
  );
};

export const NotAuthorizedModal = ({ string }: { string: string }) => {
  return (
    <div className="text-center p-6 flex flex-col space-y-2 items-center justify-center min-h-[400px]">
      <AlertTriangle className="w-20 h-20 mx-auto text-red-500" />
      <h1 className="mt-4 text-[#181818] text-[20px] font-semibold">
        You cannot {string} this user.
      </h1>
      <p className="mt-4 text-gray-600">
        You don't have the Authorization to perform this action. <br /> Please
        contact your administrator for assistance.
      </p>
    </div>
  );
};
