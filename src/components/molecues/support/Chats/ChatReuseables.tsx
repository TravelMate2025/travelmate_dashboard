"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { formatCreatedAt } from "../Reuseables";
import { Loading } from "../Reuseables";
import { redirect, useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { useClaimChat } from "@/hooks/api/chat";
import { AlertTriangle } from "lucide-react";
import { useMyRoles } from "@/hooks/api/roles";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"; // Adjust import paths

type ChatActor = {
  id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
};

type ChatClaimHistory = {
  claimed_admin_info: ChatActor;
  timestamp?: string;
};

type ChatDetails = {
  id?: string;
  status?: string;
  created_at?: string;
  closed_at?: string | null;
  closure_type?: string;
  title?: string;
  user_info?: ChatActor;
  claim_history?: ChatClaimHistory[];
  claimed_admin?: ChatActor | null;
  claimed_by_info?: ChatActor | null;
  assigned_admin?: ChatActor | null;
  assigned_admin_info?: ChatActor | null;
};

type ChatDetailsDialogProps = {
  selectedTicket: ChatDetails | null;
  chatDetails: ChatDetails | null;
  chatLoading: boolean;
  onClose: () => void;
  onClaimChat?: () => void;
  claimingChat?: boolean;
};

type ClaimedChatSectionProps = {
  selectedTicket?: ChatDetails | null;
  chatDetails: ChatDetails | null;
  handleClaimTicket?: () => void;
  onClose: () => void;
  chatLoading: boolean;
};

export const ChatTableDropdown = ({
  parentWidth,
  onViewDetails,
  onViewMessage,
  onEditTitle,
  onExportPdf,
  onMarkAsRead,
  onCloseChat,
  onDeleteChat,
}: {
  parentWidth: number;
  onViewDetails?: () => void;
  onViewMessage?: () => void;
  onEditTitle?: () => void;
  onExportPdf?: () => void;
  onMarkAsRead?: () => void;
  onCloseChat?: () => void;
  onDeleteChat?: () => void;
}) => {
  const options = [
    { label: "View Chat Details", action: onViewMessage },
    { label: "Claim Chat", action: onViewDetails },
    { label: "Edit Chat Title", action: onEditTitle, visible: !!onEditTitle },
    { label: "Export as PDF", action: onExportPdf, visible: !!onExportPdf },
    { label: "Mark as Read", action: onMarkAsRead, visible: !!onMarkAsRead },
    { label: "Close Chat", action: onCloseChat, visible: !!onCloseChat },
    { label: "Delete Chat", action: onDeleteChat, visible: !!onDeleteChat },
  ].filter((opt) => opt.visible !== false);

  return (
    <div className="relative overflow-visible">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="cursor-pointer select-none px-2 py-1 text-lg">⋮</div>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side="bottom"
          align="end"
          className="z-50 max-w-[200px] shadow-lg border border-gray-200 rounded-md bg-white"
        >
          {options.map((option, index) => (
            <DropdownMenuItem
              key={index}
              onClick={option.action}
              className="cursor-pointer select-none"
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="space-y-2">
    <p className="text-[16px] font-[500] capitalize text-[#343537]">{label}</p>
    <span className="text-[14px] font-[400] text-[#343537]">{value}</span>
  </div>
);

export const ChatDetailsDialog = ({
  selectedTicket,
  chatDetails,
  chatLoading,
  onClose,
  onClaimChat,
  claimingChat,
}: ChatDetailsDialogProps) => {
  const name = `${chatDetails?.user_info.first_name || "---"} ${
    chatDetails?.user_info.last_name || "---"
  }`;
  const canClaimChat =
    chatDetails?.status === "ACTIVE" &&
    !chatDetails?.assigned_admin &&
    !chatDetails?.claimed_admin;

  return (
    <div
      className={`fixed inset-0 z-100 bg-black/50 ${
        selectedTicket ? "visible opacity-100" : "invisible opacity-0"
      } flex justify-end lg:items-center items-end transition-opacity duration-300`}
      onClick={onClose}
    >
      <div
        className={`bg-white w-full max-w-[600px] lg:max-w-[720px] py-3 rounded-t-[20px] lg:rounded-t-[0px] lg:rounded-l-[20px] h-[90vh] overflow-y-auto shadow-lg transform border-[1px] border-[#9B9EA4] space-y-6  ${
          selectedTicket ? "scale-100" : "scale-95"
        } transition-transform duration-300`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b-[1px] w-full border-[#BCBEC2]">
          <h2 className="font-[600] text-[16px] lg:text-[28px] px-[16px] lg:px-[32px] py-[8px] text-[#181818]">
            Chat Details
          </h2>
        </div>
        <div className="space-y-6">
          <div className="px-[16px] lg:px-[32px] space-y-6">
            <h2 className="text-[18px] font-[500] text-[#18181]">
              Chat Information
            </h2>
            {chatLoading ? (
              <Loading />
            ) : (
              <div className="grid grid-cols-3 gap-6">
                <DetailRow
                  label="chat ID"
                  value={"Chat--00" + chatDetails?.id}
                />
                <DetailRow label="Status" value={chatDetails?.status} />
                <DetailRow
                  label="Created at"
                  value={formatCreatedAt(chatDetails?.created_at, 2)}
                />
                {chatDetails?.closed_at !== null && (
                  <>
                    <DetailRow
                      label="Closed at"
                      value={formatCreatedAt(chatDetails?.closed_at, 2)}
                    />
                    <DetailRow
                      label="Closure Type"
                      value={chatDetails?.closure_type}
                    />
                  </>
                )}{" "}
              </div>
            )}
          </div>

          <div className="border-[#9B9EA4]  border-b-[1px]"></div>
          <div className="px-[16px] lg:px-[32px] space-y-3">
            <h2 className="text-[18px] font-[500] text-[#18181]">
              Customer Information
            </h2>
            <div className="space-y-4">
              {chatLoading ? (
                <Loading />
              ) : (
                <>
                  <DetailRow label="Customer’s Name" value={name} />
                  <DetailRow
                    label="Customer’s Email"
                    value={chatDetails?.user_info.email}
                  />
                </>
              )}
            </div>
          </div>

          {chatDetails?.claim_history?.length !== 0 && (
            <>
              <div className="border-[#9B9EA4]  border-b-[1px]"></div>
              <div className="px-[16px] lg:px-[32px] space-y-3">
                <h2 className="text-[18px] font-[500] text-[#18181]">
                  Claim History
                </h2>
                <div className="space-y-4">
                  {chatLoading ? (
                    <Loading />
                  ) : (
                    <div className="sace-y-2">
                      {chatDetails?.claim_history?.map(
                        (text: ChatClaimHistory, i: number) => (
                        <p
                          key={i}
                          className="text-[14px] font-[400] text-[#343537]"
                        >
                          {`This chat was claimed by ${
                            text.claimed_admin_info.first_name || "---"
                          } ${" "} ${
                            text.claimed_admin_info.last_name || "---"
                          } - ${formatCreatedAt(text?.timestamp, 2)}  `}{" "}
                        </p>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
          <div className="border-[#9B9EA4]  border-b-[1px]"></div>
          <div className="px-[16px] lg:px-[32px] space-y-3">
            <h2 className="text-[18px] font-[500] text-[#18181]">
              Issue Description
            </h2>
            <div className="space-y-4">
              {chatLoading ? (
                <Loading />
              ) : (
                <>
                  <DetailRow label="Title" value={chatDetails?.title} />
                </>
              )}
            </div>
          </div>

          {canClaimChat && onClaimChat && (
            <div className="px-[16px] lg:px-[32px] pt-2 pb-4 flex justify-end">
              <button
                type="button"
                className="rounded-[8px] bg-[#023E8A] px-4 py-2 text-white font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={onClaimChat}
                disabled={Boolean(claimingChat) || chatLoading}
              >
                {claimingChat ? "Claiming..." : "Claim Chat"}
              </button>
            </div>
          )}
        </div>
        <button
          className="absolute top-[16px] right-[16px] text-gray-500 cursor-pointer"
          onClick={onClose}
          aria-label="Close dialog"
          title="Close dialog"
        >
          <img src="/assets/icons/modalClose.svg" alt="" className="w-[20px]" />
        </button>
      </div>
    </div>
  );
};

export const ClaimedChatSection = ({
  chatDetails,
  handleClaimTicket: externalHandleClaimTicket,
  onClose,
  chatLoading,
}: ClaimedChatSectionProps) => {
  const APP_STATE = useAuthContext();
  const router = useRouter();
  const { onClaiming, claiming } = useClaimChat();
  const currentUser = APP_STATE?.user?.user_id || "";
  const { loading, data } = useMyRoles({ modalVisible: !!chatDetails });
  const normalizeRoleName = (value?: string | null) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

  const normalizePermissionSlug = (value?: string | null) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, "-");

  const permissionSlugs = Array.isArray(data?.current_permission_group_slugs)
    ? data.current_permission_group_slugs
    : [];
  const normalizedSlugs = new Set(
    permissionSlugs.map((slug) => normalizePermissionSlug(slug))
  );
  const normalizedRoleName = normalizeRoleName(data?.name);
  const canViewMessage =
    [
      "support-tickets",
      "customer-support",
      "customer-success",
      "user-manager",
      "live-chat",
      "chat",
    ].some((slug) => normalizedSlugs.has(slug)) ||
    ["super admin", "customer support", "customer success", "user manager"].includes(
      normalizedRoleName
    );


  const [notAuthorized, setNotAuthorized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const formattedDate = useMemo(
    () => (chatDetails ? formatCreatedAt(chatDetails.created_at, 2) : ""),
    [chatDetails]
  );

  const handleClaimTicket = useCallback(async () => {
    if (!chatDetails?.id) return;

    if (!canViewMessage) {
      setNotAuthorized(true);
      return;
    }

    setIsProcessing(true);
    try {
      await onClaiming({
        ChatId: chatDetails.id,
        successCallback: () =>
          router.push(`/Dashboard/support/chats/${chatDetails.id}/`),
      });
    } finally {
      setIsProcessing(false);
    }
  }, [chatDetails, router, onClaiming, canViewMessage]);

  const handleNavigateToResponse = useCallback(() => {
    setIsRedirecting(true);
    if (!canViewMessage) {
      setNotAuthorized(true);
      return;
    }

    if (chatDetails?.id) {
      router.push(`/Dashboard/support/chats/${chatDetails.id}/`);
    }
  }, [chatDetails, router, canViewMessage]);

  useEffect(() => {
    if (loading) {
      return;
    }
    if (!canViewMessage) {
      setNotAuthorized(true);
    } else {
      setNotAuthorized(false);
    }
  }, [loading, canViewMessage]);

  useEffect(() => {
    if (
      chatDetails?.claimed_admin?.id === currentUser ||
      chatDetails?.assigned_admin_info?.id === currentUser
    ) {
      handleNavigateToResponse();
    } else if (
      chatDetails?.status === "WAITING" &&
      !chatDetails?.assigned_admin
    ) {
      handleNavigateToResponse();
    } else if (chatDetails?.status === "CLOSED") {
      handleNavigateToResponse();
    }
  }, [chatDetails, currentUser, handleNavigateToResponse]);

  useEffect(() => {
    if (!chatDetails) {
      setNotAuthorized(false);
    }
  }, [chatDetails]);

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center items-center bg-black/50 transition-opacity duration-500 ${
        chatDetails ? "visible opacity-100" : "invisible opacity-0"
      }`}
      onClick={onClose}
    >
      <div
        className={`relative bg-white w-[90%] max-w-[720px] p-6 rounded-2xl shadow-lg border border-gray-300 transform transition-transform duration-500 min-h-[400px] ${
          chatDetails ? "scale-100" : "scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="modal-title"
      >
        {chatLoading || ((loading || isRedirecting) && !notAuthorized) ? (
          <div className="absolute inset-0 bg-white/80 flex justify-center items-center rounded-2xl z-50 min-h-[400px]">
            <div className="w-12 h-12 border-4 border-gray-800 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : notAuthorized && !loading ? (
          <NotAuthorizedModal
            ticketDetails={chatDetails}
            className="animate-fade-in"
          />
        ) : !loading ? (
          <>
            <div className="border-b-[1px] w-full border-[#BCBEC2]">
              <h2 className="font-[600] text-[16px] lg:text-[28px] px-[16px] lg:px-[32px] py-[8px] text-[#181818]">
                Ticket Already Claimed
              </h2>
            </div>

            <div className="px-[16px] lg:px-[32px]">
              <p className="font-[400] text-[16px] lg:text-[20px]">
                This chat is currently being handled by{" "}
                {chatDetails?.claimed_by_info?.first_name || "---"}. You can
                either view the ticket or claim it. Claiming the ticket will
                transfer responsibility to you, removing{" "}
                {chatDetails?.claimed_by_info?.first_name || "---"} from the
                conversation. The customer will be notified of the change. Would
                you like to proceed?
              </p>
            </div>

            <div className="mt-10 border-t-[1px] border-[#BCBEC2]">
              <div className="px-[16px] lg:px-[32px] py-[10px] flex lg:space-x-[24px] flex-col lg:flex-row items-center justify-end space-y-2 lg:space-y-0">
                <div
                  className="w-full lg:w-auto p-4 rounded-[8px] border-[1px] border-[#023E8A] justify-center flex items-center space-x-3 cursor-pointer hover:opacity-90"
                  onClick={() =>
                    router.push(`/Dashboard/support/chats/${chatDetails.id}/`)
                  }
                >
                  <span className="text-[#023E8A] text-[20px] font-[500]">
                    View Only
                  </span>
                </div>

                <div
                  className="w-full lg:w-auto p-4 rounded-[8px] bg-[#023E8A] flex items-center space-x-3 justify-center cursor-pointer hover:bg-[#0353A4]"
                  onClick={handleClaimTicket}
                >
                  {claiming ? (
                    <div className="w-5 h-5 border-4 border-gray-800 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span className="text-[#fff] text-[20px] font-[500]">
                      Yes, Proceed
                    </span>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

const NotAuthorizedModal = ({ ticketDetails }: { ticketDetails: ChatDetails }) => {
  const router = useRouter();
  return (
    <div className="text-center p-6 flex flex-col space-y-4 items-center justify-center min-h-[400px]">
      <AlertTriangle className="w-20 h-20 mx-auto text-red-500" />
      <h1 className="mt-4 text-[#181818] text-[20px] font-semibold">
        Access Restricted
      </h1>
      <p className="mt-4 text-gray-600">
        You can view this chat but won't be able to send messages because you
        don't have the required department permissions
      </p>

      <div
        className="p-4 rounded-[8px] bg-[#023E8A] flex items-center space-x-3 justify-center cursor-pointer"
        onClick={() =>
          router.push(`/Dashboard/support/chats/${ticketDetails.id}`)
        }
      >
        <>
          <span className="text-[#fff] text-[20px] font-[500]">
            View Chat Only
          </span>
        </>
      </div>
    </div>
  );
};
