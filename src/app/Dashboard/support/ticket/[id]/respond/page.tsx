"use client";
import React, { useState, useEffect, useRef } from "react";
import { useFormik } from "formik";
import { SuccessModal } from "@/components/reuseables/SuccessModal";
import { useParams } from "next/navigation";
import {
  useCreateTicketMessage,
  useGetTicketMessages,
  useGetTicket,
  useClaimTicket,
} from "@/hooks/api/ticket";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { ConfirmResolution } from "@/components/molecues/support/Reuseables";
import * as Yup from "yup";
import { useAuthContext } from "@/context/AuthContext";
import { useMyRoles } from "@/hooks/api/roles";
import { getSingleRouteParam } from "@shared/lib/routeParams";

type DateInput = string | number | Date | null | undefined;

const formatDate = (isoDate: DateInput) => {
  if (!isoDate) {
    return "Invalid date";
  }

  const date = isoDate instanceof Date ? isoDate : new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return format(date, "EEEE dd/MM/yyyy | hh:mm a");
};

const normalizeRoleName = (value?: string | null) =>
  (value || "").trim().toLowerCase().replace(/\s+/g, " ");

const normalizePermissionSlug = (value?: string | null) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-");

const hasSupportTicketAccess = ({
  roleName,
  permissionSlugs,
}: {
  roleName?: string;
  permissionSlugs?: string[];
}) => {
  const normalizedRole = normalizeRoleName(roleName);
  const normalizedPermissionSlugs = new Set(
    (permissionSlugs || []).map((slug) => normalizePermissionSlug(slug))
  );

  const roleAllowed = [
    "super admin",
    "customer support",
    "customer success",
    "user manager",
  ].includes(normalizedRole);

  const permissionAllowed = [
    "support-tickets",
    "customer-support",
    "customer-success",
    "user-manager",
    "live-chat",
    "chat",
  ].some((slug) => normalizedPermissionSlugs.has(slug));

  return roleAllowed || permissionAllowed;
};

type TicketActor = {
  id?: number | string;
  first_name?: string;
  last_name?: string;
  email?: string;
  name?: string;
  full_name?: string;
  display_name?: string;
  username?: string;
  provider?: string;
  auth_provider?: string;
  signup_provider?: string;
  social_provider?: string;
};

const toReadableNameFromEmail = (email?: string) => {
  if (!email || !email.includes("@")) {
    return "";
  }

  return email
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .trim();
};

const normalizeProvider = (value?: string) =>
  String(value || "")
    .trim()
    .toLowerCase();

const formatProviderLabel = (value?: string) => {
  const normalized = normalizeProvider(value);

  if (!normalized) {
    return "unknown";
  }

  if (["email", "password", "local", "credentials", "basic"].includes(normalized)) {
    return "email";
  }

  return `social (${String(value).trim()})`;
};

const getCustomerIdentity = (actor?: TicketActor | null) => {
  const firstLastName = `${actor?.first_name || ""} ${actor?.last_name || ""}`.trim();
  const fallbackName =
    firstLastName ||
    actor?.display_name?.trim() ||
    actor?.full_name?.trim() ||
    actor?.name?.trim() ||
    actor?.username?.trim() ||
    toReadableNameFromEmail(actor?.email) ||
    "Unknown customer";

  const provider =
    actor?.social_provider ||
    actor?.signup_provider ||
    actor?.auth_provider ||
    actor?.provider;

  const accountSource = provider
    ? formatProviderLabel(provider)
    : actor?.email
    ? "email"
    : "unknown";

  return {
    name: fallbackName,
    accountSource,
  };
};

type RespondTicket = {
  id?: number | string;
  status?: string;
  title?: string;
  created_at?: string;
  category?: string;
  escalated?: boolean;
  escalation_role?: { name?: string };
  escalated_by?: TicketActor;
  claimed_admin?: TicketActor;
  claim_timestamp?: string;
  user?: TicketActor;
  messages?: { results?: unknown[] } | unknown[];
};

type TicketMessage = {
  id?: number | string;
  content?: string | null;
  attachment?: unknown;
  attachment_url?: string | null;
  sender?: { id?: number | string };
  sender_id?: number | string;
  sender_info?: { id?: number | string };
  timestamp?: string;
  created_at?: string;
};

const toTicketMessage = (value: unknown): TicketMessage | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  return value as TicketMessage;
};

const toMessageList = (
  messages?: { results?: unknown[] } | unknown[]
): TicketMessage[] => {
  const source = Array.isArray(messages)
    ? messages
    : Array.isArray(messages?.results)
    ? messages.results
    : [];

  return source
    .map((message) => toTicketMessage(message))
    .filter((message): message is TicketMessage => Boolean(message));
};

const normalizeThreadMessages = (value: unknown): TicketMessage[] => {
  if (Array.isArray(value)) {
    return value.map((item) => toTicketMessage(item)).filter((item): item is TicketMessage => Boolean(item));
  }

  if (value && typeof value === "object") {
    const asObject = value as { results?: unknown[] };
    if (Array.isArray(asObject.results)) {
      return asObject.results
        .map((item) => toTicketMessage(item))
        .filter((item): item is TicketMessage => Boolean(item));
    }
  }

  return [];
};

type MessageFormValues = {
  message: string;
};

const TicketRespondPage: React.FC = () => {
  const APP_STATE = useAuthContext();
  const currentUser = APP_STATE?.user?.user_id;
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const params = useParams();
  const id = getSingleRouteParam(params, "id") || "";
  const router = useRouter();
    const escalateTicket = () => {
      const ticketId = ticketDetails?.id;
      if (!ticketId) return;

      router.push(`/Dashboard/support/ticket/${String(ticketId)}/escalate`);
    };

  const { loading, data } = useMyRoles({ modalVisible: true });

  const { loadingTicket, ticket } = useGetTicket({
    TicketId: id as string,
    initalFetch: true,
  });

  const ticketDetails = (ticket || null) as RespondTicket | null;
  const customerIdentity = getCustomerIdentity(ticketDetails?.user);

  const roleData = (data || null) as
    | { name?: string; current_permission_group_slugs?: string[] }
    | null;
  const permissionSlugs = Array.isArray(roleData?.current_permission_group_slugs)
    ? roleData.current_permission_group_slugs
    : [];
  const currentRoleName = normalizeRoleName(roleData?.name);
  const escalationRoleName = normalizeRoleName(ticketDetails?.escalation_role?.name);
  const canAccessSupport = hasSupportTicketAccess({
    roleName: roleData?.name,
    permissionSlugs,
  });

  const hasClaimOwnership =
    currentUser === ticketDetails?.claimed_admin?.id && canAccessSupport;

  const canManageNonEscalatedTicket = !ticketDetails?.escalated && canAccessSupport;

  const canManageEscalatedTicket =
    ticketDetails?.escalated === true &&
    canAccessSupport &&
    (currentRoleName === "super admin" ||
      (Boolean(currentRoleName) && currentRoleName === escalationRoleName));

  const isAdmin =
    hasClaimOwnership ||
    canManageNonEscalatedTicket ||
    canManageEscalatedTicket;

  return (
    <>
      <div className="space-y-6 pb-[72px] min-h-[100vh] ">
        <div className="flex justify-between items-center">
          <img
            src="/assets/icons/arrow-back.svg"
            alt="Back"
            className="cursor-pointer"
            onClick={router.back}
          />

          {ticketDetails?.status !== "resolved" && (
            <div className="hidden lg:flex space-x-4">
              {!ticketDetails?.escalated && (
                <button
                  className={`rounded-[8px] border font-medium py-2 px-4 ${
                    isAdmin
                      ? "border-[#D72638] text-[#D72638]"
                      : "border-gray-500 text-gray-700 cursor-not-allowed"
                  }`}
                  onClick={() =>
                    escalateTicket()
                  }
                  disabled={!isAdmin}
                  title={isAdmin ? "Escalate this ticket" : "Admins only"}
                >
                  Escalate Ticket
                </button>
              )}
              <button
                className={`rounded-[8px] text-white font-medium px-4 py-2 ${
                  isAdmin ? "bg-[#023E8A]" : "bg-gray-500 cursor-not-allowed"
                }`}
                onClick={() => setShowConfirmModal(true)}
                disabled={!isAdmin}
                title={isAdmin ? "Mark ticket as resolved" : "Admins only"}
              >
                Mark as Resolved
              </button>
            </div>
          )}
        </div>
        {loadingTicket ? (
          <DetailsLoader />
        ) : (
          <div className="space-y-2">
            <p className="font-medium text-[12px] lg:text-[16px] text-[#181818]">
              {formatDate(ticketDetails?.created_at)}{" "}
              {ticketDetails?.escalated == true && (
                <span className="text-red-700">
                  | This is an escalated ticket{" "}
                </span>
              )}{" "}
              {ticketDetails?.status == "resolved" && (
                <span className="text-[#2D9C5E]">| Resolved </span>
              )}
            </p>
            <h2 className="lgtext-[22px] text-[18px] font-semibold text-[#181818]">
              {ticketDetails?.title}
            </h2>
            <div className="flex space-x-3 items-center flex-wrap">
              <p className="text-[16px] font-semibold text-[#4E4F52]">
                Customer:{" "}
                <span className="font-medium">
                  {customerIdentity.name}
                </span>
              </p>
              <div className="w-2 h-2 bg-[#9B9EA4] rounded-full"></div>
              <p className="text-[16px] font-semibold text-[#4E4F52]">
                Account source:{" "}
                <span className="font-medium capitalize">
                  {customerIdentity.accountSource}
                </span>
              </p>
              <div className="w-2 h-2 bg-[#9B9EA4] rounded-full"></div>
              <p className="text-[16px] font-semibold text-[#4E4F52]">
                Category:{" "}
                <span className="font-medium">{ticketDetails?.category}</span>
              </p>
              <div className="w-2 h-2 bg-[#9B9EA4] rounded-full"></div>
              <p className="text-[16px] font-semibold text-[#4E4F52]">
                Chat Status:{" "}
                <span className="font-medium uppercase ">{ticketDetails?.status}</span>
              </p>
            </div>
            {ticketDetails?.escalated && (
              <div className="flex space-x-3 items-center flex-wrap">
                <p className="text-[16px] font-semibold text-[#4E4F52]">
                  Escalated By:{" "}
                  <span className="font-medium">
                    {ticketDetails?.escalated_by?.first_name ||
                      ticketDetails?.escalated_by?.email}{" "}
                    ({"Customer support"})
                  </span>
                </p>
                <div className="w-2 h-2 bg-[#9B9EA4] rounded-full"></div>
                <p className="text-[16px] font-semibold text-[#4E4F52]">
                  Escalated To:{" "}
                  <span className="font-medium">
                    {ticketDetails?.escalation_role?.name || "N/A"}
                  </span>
                </p>
              </div>
            )}
          </div>
        )}
        <Chat
          ticket={ticketDetails}
          loadingTicket={loadingTicket}
          isAdmin={isAdmin}
          currentUser={currentUser}
          ticketId={id}
        />
      </div>
      {ticketDetails?.status !== "resolved" && (
        <div className="  sticky lg:hidden bottom-0 bg-white p-4 flex justify-between items-end space-x-4 shadow-lg">
          {ticketDetails?.escalated !== true && (
            <button
              className={`flex-1 rounded-[8px] border  font-medium py-2 ${
                !isAdmin
                  ? "border-gray-500 text-gray-700 cursor-not-allowed "
                  : "border-[#D72638] text-[#D72638]  "
              } `}
              onClick={() =>
                escalateTicket()
              }
              disabled={!isAdmin}
            >
              Escalate Ticket
            </button>
          )}
          <button
            className={`flex-1 rounded-[8px]  text-white font-medium py-2 ${
              !isAdmin ? "bg-gray-600 cursor-not-allowed" : "bg-[#023E8A]"
            } `}
            onClick={() => setShowConfirmModal(true)}
            disabled={!isAdmin}
          >
            Mark as Resolved
          </button>
        </div>
      )}

      {showSuccessModal && (
        <SuccessModal
          title="Ticket Resolved Successfully"
          description="You have successfully resolved this ticket."
          onClose={() => setShowSuccessModal(false)}
          dlink="/Dashboard/support/ticket/escalates"
        />
      )}

      {showConfirmModal && (
        <ConfirmResolution
          selectedTicket={
            ticketDetails
              ? { ...ticketDetails, id: String(ticketDetails.id || "") }
              : null
          }
          onClose={() => setShowConfirmModal(false)}
          setShowModal={setShowSuccessModal}
        />
      )}
    </>
  );
};

const getAttachmentUrl = (attachment: unknown): string => {
  if (typeof attachment === "string") {
    return attachment;
  }

  if (attachment && typeof attachment === "object") {
    const attachmentObject = attachment as { url?: unknown; file?: unknown };

    if (typeof attachmentObject.url === "string") {
      return attachmentObject.url;
    }

    if (typeof attachmentObject.file === "string") {
      return attachmentObject.file;
    }
  }

  return "";
};

type ChatProps = {
  ticket: RespondTicket | null;
  loadingTicket: boolean;
  isAdmin: boolean;
  currentUser?: string | number;
  ticketId?: string;
};

const Chat = ({
  ticket,
  loadingTicket,
  isAdmin,
  currentUser,
  ticketId,
}: ChatProps) => {
  const { claiming, onClaiming } = useClaimTicket();
  const {
    loading: messagesLoading,
    data: ticketMessages,
    fetchMessages,
  } = useGetTicketMessages({
    ticketPk: ticketId || (ticket?.id ? String(ticket.id) : undefined),
    admin: true,
    initialFetch: Boolean(ticketId || ticket?.id),
  });
  const { loading: sendingMessage, onCreateTicketMessage } =
    useCreateTicketMessage();

  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const lastMessageRef = useRef<HTMLDivElement | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New state for attachment functionality
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  // Remove fileBase64 state
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const preferred = normalizeThreadMessages(ticketMessages?.results);
    const fallback = toMessageList(ticket?.messages);
    setMessages(preferred.length > 0 ? preferred : fallback);
  }, [ticketMessages, ticket]);

  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (limit to 10MB for example)
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        event.target.value = "";
        return;
      }

      // Check file type
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];

      if (!allowedTypes.includes(file.type)) {
        alert(
          "Please select a valid file type (images, PDF, Word, Excel, or text files)"
        );
        event.target.value = "";
        return;
      }

      setSelectedFile(file);

      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFilePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  // Remove selected file
  const removeSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Function to create FormData with message and file
  const createMessagePayload = (message: string, file: File | null) => {
    const formData = new FormData();

    if (message.trim()) {
      formData.append("content", message.trim());
    }

    if (file) {
      formData.append("attachment", file);
    }

    return formData;
  };

  const formik = useFormik<MessageFormValues>({
    initialValues: {
      message: "",
    },
    validationSchema: Yup.object({
      message: Yup.string(), // Remove required validation
    }),
    onSubmit: async (values, { resetForm }) => {
      // Check if there's either a message or an attachment
      if (!values.message.trim() && !selectedFile) {
        alert("Please enter a message or select a file to send");
        return;
      }

      const ticketId = ticket?.id ? String(ticket.id) : "";
      if (!ticketId) {
        alert("Unable to send message: ticket not found.");
        return;
      }

      // If message is empty and attachment exists, use attachment name as message
      let messageToSend = values.message.trim();
      if (!messageToSend && selectedFile) {
        messageToSend = selectedFile.name;
      }

      if (
        !ticket?.claimed_admin?.id ||
        ticket?.claimed_admin?.id !== currentUser
      ) {
        try {
          await onClaiming({
            TicketId: ticketId,
            isShow: false,
          });
        } catch {
          return;
        }
      }

      setIsSubmitting(true);

      try {
        await Promise.resolve(
          onCreateTicketMessage({
            ticketPk: ticketId,
            payload: {
              content: messageToSend,
              attachment: selectedFile,
            },
            successCallback: async () => {
              await fetchMessages();
              resetForm();
              removeSelectedFile();
              setIsSubmitting(false);
            },
          })
        );
      } catch {
        setIsSubmitting(false);
        alert("Failed to send message. Please try again.");
      }
    },
  });

  return (
    <div className="w-full pt-[24px] border-[1px] border-[#CDCED1] bg-[#F5F5F5] rounded-[24px] space-y-[40px] flex flex-col">
      {/* Full-screen Modal */}
      {modalImage && (
        <div
          className="fixed inset-0 bg-black/80 bg-opacity-75 flex justify-center items-center z-50 h-screen "
          onClick={() => setModalImage(null)}
        >
          <img
            src={modalImage}
            alt="Full-Screen Image"
            className="max-w-full max-h-[90%] rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <div className="flex justify-center items-center">
        <div className="hidden md:block w-[100px] lg:w-[220px] h-[1px] bg-[#181818]"></div>
        <div className="w-[70vw] md:w-auto mx-auto md:mx-4 rounded-[100px] border-[1px] border-[#181818] py-[8px] px-[10px] sm:py-[10px] sm:px-[14px] font-[400] text-[#181818] text-[10px] sm:text-[12px] lg:text-[14px] text-center">
          {ticket?.claimed_admin ? (
            <div className="flex items-center sm:justify-center sm:space-x-1">
              <span className="font-medium">Responding: </span>
              <span className="truncate">
                {ticket.claimed_admin.first_name ||
                ticket.claimed_admin.last_name
                  ? `${ticket.claimed_admin.first_name || ""} ${
                      ticket.claimed_admin.last_name || ""
                    }`.trim()
                  : ticket.claimed_admin.email || "---"}
              </span>
              <span className="text-[10px] sm:text-[12px] lg:text-[14px] text-gray-600">
                -{" "}
                {ticket.claim_timestamp
                  ? format(
                      new Date(ticket.claim_timestamp),
                      "dd/MM/yyyy | hh:mm a"
                    )
                  : "Unknown Time"}
              </span>
            </div>
          ) : (
            "No admin claimed"
          )}
        </div>
        <div className="hidden md:block w-[100px] lg:w-[220px] h-[1px] bg-[#181818]"></div>
      </div>

      {loadingTicket || messagesLoading ? (
        <MessageLoading />
      ) : (
        <div className="flex-1 overflow-auto p-4 space-y-2">
          {messages.map((mes, index) => {
            const customerId =
              ticket?.user?.id ||
              (ticket?.user as TicketActor & { user_id?: string | number; pk?: string | number } | undefined)
                ?.user_id ||
              (ticket?.user as TicketActor & { user_id?: string | number; pk?: string | number } | undefined)
                ?.pk;
            const senderId =
              mes?.sender?.id || mes?.sender_id || mes?.sender_info?.id;
            const isUser =
              String(customerId || "") !== "" &&
              String(senderId || "") !== "" &&
              String(customerId) === String(senderId);
            const attachmentUrl = mes?.attachment_url || getAttachmentUrl(mes?.attachment);
            return (
              <div
                key={mes.id ?? `${mes.created_at ?? "message"}-${index}`}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                ref={index === messages.length - 1 ? lastMessageRef : null}
              >
                <div
                  className={`flex flex-col items-${
                    isUser ? "end" : "start"
                  } space-y-1 max-w-[80%]`}
                >
                  {/* Message Content */}
                  {mes.content && (
                    <div
                      className={`py-3 px-4 text-[16px] font-medium rounded-xl shadow-md ${
                        isUser
                          ? "bg-[#f0f0f0] text-[#181818] text-end"
                          : "bg-[#023E8A] text-white text-start"
                      } max-w-fit`}
                    >
                      {mes.content}
                    </div>
                  )}

                  {/* Image Attachment */}
                  {attachmentUrl && (
                    <div
                      className={`flex ${
                        isUser ? "justify-end" : "justify-start"
                      }`}
                    >
                      {/\.(jpeg|jpg|gif|png|webp)$/i.test(attachmentUrl) ? (
                        <img
                          src={attachmentUrl}
                          alt="Attachment"
                          className="w-[250px] h-auto rounded-lg shadow-lg cursor-pointer"
                          onClick={() => setModalImage(attachmentUrl)}
                        />
                      ) : (
                        <div className="bg-white p-3 rounded-lg shadow-lg border max-w-[250px]">
                          <div className="flex items-center space-x-2">
                            <svg
                              className="w-6 h-6 text-gray-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            <a
                              href={attachmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium truncate"
                            >
                              {attachmentUrl.split("/").pop() || "Download File"}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Timestamp */}
                  <span
                    className={`block text-[12px] font-light text-[#67696D] ${
                      isUser ? "text-right" : "text-left"
                    }`}
                  >
                    {formatDate(mes?.timestamp || mes?.created_at)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <form
        onSubmit={formik.handleSubmit}
        className="sticky bottom-0 rounded-b-[24px] bg-[#fff]"
      >
        {ticket?.status == "resolved" ? (
          <div className="text-center p-4 text-[14px] lg:text-[24px] font-[500] text-[#181818]">
            This Ticket has been marked as resolved
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {/* File Preview Section */}
            {selectedFile && (
              <div className="bg-gray-50 p-3 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {filePreview ? (
                      <img
                        src={filePreview}
                        alt="Preview"
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeSelectedFile}
                    className="text-red-500 hover:text-red-700 p-1"
                    aria-label="Remove selected file"
                    title="Remove selected file"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Input Section */}
            <div className="flex items-center gap-4 w-full">
              {loadingTicket ? (
                <div className="w-full bg-[#f5f5f5] animate-pulse h-[20px]"></div>
              ) : (
                <>
                  <div className="bg-[#EBECED] flex-1 p-3 border rounded-lg flex items-center space-x-4">
                    <img
                      src="/assets/icons/emoji.svg"
                      alt="Emoji"
                      className="cursor-pointer"
                    />
                    <input
                      type="text"
                      name="message"
                      placeholder="Type a message..."
                      className="flex-1 outline-none bg-transparent"
                      value={formik.values.message}
                      onChange={formik.handleChange}
                      disabled={!isAdmin || isSubmitting}
                    />

                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx"
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={!isAdmin || isSubmitting}
                      aria-label="Attach a file"
                      title="Attach a file"
                    />

                    {/* Attachment button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={!isAdmin || isSubmitting}
                      aria-label="Open file picker"
                      title="Open file picker"
                      className={`${
                        !isAdmin || isSubmitting
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-gray-200 cursor-pointer"
                      } p-1 rounded transition-colors`}
                    >
                      <img
                        src="/assets/icons/attach-ment.svg"
                        alt="Attach"
                        className=""
                      />
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={
                      !isAdmin || ticket?.status === "resolved" || isSubmitting
                    }
                    className={`p-3 rounded-[8px] items-center flex space-x-1 ${
                      !isAdmin || ticket?.status === "resolved" || isSubmitting
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-[#023E8A] text-white"
                    }`}
                  >
                    {sendingMessage ? (
                      <div className="w-5 h-5 border-4 border-gray-100 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <img src="/assets/icons/white-send.svg" alt="Send" />
                    )}
                    <span className="text-[#fff] font-[500] text-[20px]">
                      Send
                    </span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

const MessageLoading = () => {
  return (
    <div className="space-y-6 animate-pulse w-full px-3">
      {/* Skeleton for Admin Message */}
      <div className="flex justify-start">
        <div className="space-y-2 w-[80%]">
          {/* Message Bubble */}
          <div className="py-3 px-4 bg-[#e1e1e1] w-full rounded-xl shadow-md h-8"></div>
          <div className="py-3 px-4 bg-[#E0E0E0] rounded-xl shadow-md w-2/3 h-6"></div>
          {/* Time */}
          <div className="h-3 w-1/3 bg-[#E0E0E0] rounded"></div>
        </div>
      </div>

      {/* Skeleton for User Message */}
      <div className="flex justify-end">
        <div className="space-y-2 w-[80%]">
          {/* Message Bubble */}
          <div className="py-3 px-4 bg-[#E0E0E0] rounded-xl w-full shadow-md h-8"></div>
          <div className="py-3 px-4 bg-[#E0E0E0] rounded-xl shadow-md w-2/4 h-6"></div>
          {/* Time */}
          <div className="h-3 w-1/4 bg-[#E0E0E0] rounded"></div>
        </div>
      </div>

      {/* Skeleton for Admin Message */}
      <div className="flex justify-start">
        <div className="space-y-2 w-[80%]">
          {/* Message Bubble */}
          <div className="py-3 px-4 bg-[#E0E0E0] rounded-xl shadow-md w-full h-10"></div>
          <div className="py-3 px-4 bg-[#E0E0E0] rounded-xl shadow-md w-4/5 h-8"></div>
          {/* Time */}
          <div className="h-3 w-1/3 bg-[#E0E0E0] rounded"></div>
        </div>
      </div>
    </div>
  );
};

const DetailsLoader = () => {
  return (
    <div className="space-y-2">
      <div className="w-[300px] h-[20px] bg-[#f2f2f2] rounded-[8px] animate-pulse"></div>
      <div className="w-[100px] h-[20px] bg-[#f5f5f5] rounded-[8px] animate-pulse"></div>
      <div className="w-[300px] h-[20px] bg-[#f5f5f5] rounded-[8px] animate-pulse"></div>
    </div>
  );
};

export default TicketRespondPage;
