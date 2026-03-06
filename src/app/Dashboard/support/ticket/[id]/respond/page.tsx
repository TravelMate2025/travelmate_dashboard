"use client";
import React, { useState, useEffect, useRef } from "react";
import { useFormik } from "formik";
import { SuccessModal } from "@/components/reuseables/SuccessModal";
import { useParams } from "next/navigation";
import {
  useRespondToTicket,
  useGetTicket,
  useClaimTicket,
} from "@/hooks/api/ticket";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { ConfirmResolution } from "@/components/molecues/support/Reuseables";
import * as Yup from "yup";
import { useAuthContext } from "@/context/AuthContext";
import { useMyRoles } from "@/hooks/api/roles";

const formatDate = (isoDate: any) => {
  if (!isoDate) {
    return "Invalid date";
  }

  const date = new Date(isoDate);

  if (isNaN(date.getTime())) {
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

const page = () => {
  const APP_STATE = useAuthContext();
  const currentUser = APP_STATE?.user?.user_id;
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { loading, data } = useMyRoles({ modalVisible: true });

  const { loadingTicket, ticket } = useGetTicket({
    TicketId: id as string,
    initalFetch: true,
  });

  const roleData = (data || null) as
    | { name?: string; current_permission_group_slugs?: string[] }
    | null;
  const permissionSlugs = Array.isArray(roleData?.current_permission_group_slugs)
    ? roleData.current_permission_group_slugs
    : [];
  const currentRoleName = normalizeRoleName(roleData?.name);
  const escalationRoleName = normalizeRoleName(ticket?.escalation_role?.name);
  const canAccessSupport = hasSupportTicketAccess({
    roleName: roleData?.name,
    permissionSlugs,
  });

  const hasClaimOwnership =
    currentUser === ticket?.claimed_admin?.id && canAccessSupport;

  const canManageNonEscalatedTicket = !ticket?.escalated && canAccessSupport;

  const canManageEscalatedTicket =
    ticket?.escalated === true &&
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

          {ticket?.status !== "resolved" && (
            <div className="hidden lg:flex space-x-4">
              {!ticket?.escalated && (
                <button
                  className={`rounded-[8px] border font-medium py-2 px-4 ${
                    isAdmin
                      ? "border-[#D72638] text-[#D72638]"
                      : "border-gray-500 text-gray-700 cursor-not-allowed"
                  }`}
                  onClick={() =>
                    router.push(
                      `/Dashboard/support/ticket/${ticket?.id}/escalate`
                    )
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
              {formatDate(ticket?.created_at)}{" "}
              {ticket?.escalated == true && (
                <span className="text-red-700">
                  | This is an escalated ticket{" "}
                </span>
              )}{" "}
              {ticket?.status == "resolved" && (
                <span className="text-[#2D9C5E]">| Resolved </span>
              )}
            </p>
            <h2 className="lgtext-[22px] text-[18px] font-semibold text-[#181818]">
              {ticket?.title}
            </h2>
            <div className="flex space-x-3 items-center flex-wrap">
              <p className="text-[16px] font-semibold text-[#4E4F52]">
                Customer:{" "}
                <span className="font-medium">
                  {ticket?.user.first_name || "N/A"}{" "}
                  {ticket?.user.last_name || "N/A"}
                </span>
              </p>
              <div className="w-2 h-2 bg-[#9B9EA4] rounded-full"></div>
              <p className="text-[16px] font-semibold text-[#4E4F52]">
                Category:{" "}
                <span className="font-medium">{ticket?.category}</span>
              </p>
              <div className="w-2 h-2 bg-[#9B9EA4] rounded-full"></div>
              <p className="text-[16px] font-semibold text-[#4E4F52]">
                Chat Status:{" "}
                <span className="font-medium uppercase ">{ticket?.status}</span>
              </p>
            </div>
            {ticket?.escalated && (
              <div className="flex space-x-3 items-center flex-wrap">
                <p className="text-[16px] font-semibold text-[#4E4F52]">
                  Escalated By:{" "}
                  <span className="font-medium">
                    {ticket?.escalated_by.first_name ||
                      ticket?.escalated_by.email}{" "}
                    ({"Customer support"})
                  </span>
                </p>
                <div className="w-2 h-2 bg-[#9B9EA4] rounded-full"></div>
                <p className="text-[16px] font-semibold text-[#4E4F52]">
                  Escalated To:{" "}
                  <span className="font-medium">
                    {ticket?.escalation_role?.name || "N/A"}
                  </span>
                </p>
              </div>
            )}
          </div>
        )}
        <Chat
          ticket={ticket}
          loadingTicket={loadingTicket}
          isAdmin={isAdmin}
          currentUser={currentUser}
        />
      </div>
      {ticket?.status !== "resolved" && (
        <div className="  sticky lg:hidden bottom-0 bg-white p-4 flex justify-between items-end space-x-4 shadow-lg">
          {ticket?.escalated !== true && (
            <button
              className={`flex-1 rounded-[8px] border  font-medium py-2 ${
                !isAdmin
                  ? "border-gray-500 text-gray-700 cursor-not-allowed "
                  : "border-[#D72638] text-[#D72638]  "
              } `}
              onClick={() =>
                router.push(`/Dashboard/support/ticket/${ticket?.id}/escalate`)
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
          selectedTicket={ticket}
          onClose={() => setShowConfirmModal(false)}
          setShowModal={setShowSuccessModal}
        />
      )}
    </>
  );
};

const Chat = ({ ticket, loadingTicket, isAdmin, currentUser }: any) => {
  const { claiming, onClaiming } = useClaimTicket();
  const { responding, onRespondToTicket } = useRespondToTicket();

  const [messages, setMessages] = useState(ticket?.messages || []);
  const lastMessageRef = useRef<HTMLDivElement | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New state for attachment functionality
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  // Remove fileBase64 state
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setMessages(ticket?.messages.results || []);
  }, [ticket]);

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

  const formik = useFormik({
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
            TicketId: ticket?.id,
            isShow: false,
          });
        } catch (error) {
          return;
        }
      }

      setIsSubmitting(true);

      try {
        // Create FormData payload with message and file
        const payload = createMessagePayload(messageToSend, selectedFile);

        onRespondToTicket({
          TicketId: ticket?.id,
          payload,
          successCallback: () => {
            const newMessage = {
              id: new Date().toISOString(),
              content: messageToSend || null,
              attachment: selectedFile
                ? URL.createObjectURL(selectedFile)
                : null, // Temporary preview URL
              sender: { id: currentUser },
              timestamp: new Date().toISOString(),
            };
            setMessages((prevMessages: any) => [...prevMessages, newMessage]);
            resetForm();
            removeSelectedFile();
            setIsSubmitting(false);
          },
        });
      } catch (error) {
        setIsSubmitting(false);
        alert("Failed to send message. Please try again.");
      }
    },
  });

  // Add validation context for attachment
  formik.values.hasAttachment = !!selectedFile;

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

      {loadingTicket ? (
        <MessageLoading />
      ) : (
        <div className="flex-1 overflow-auto p-4 space-y-2">
          {messages.map((mes: any, index: number) => {
            const isUser = ticket?.user.id === mes.sender.id;
            return (
              <div
                key={mes.id}
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
                  {mes.attachment && (
                    <div
                      className={`flex ${
                        isUser ? "justify-end" : "justify-start"
                      }`}
                    >
                      {mes.attachment.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                        <img
                          src={mes.attachment}
                          alt="Attachment"
                          className="w-[250px] h-auto rounded-lg shadow-lg cursor-pointer"
                          onClick={() => setModalImage(mes.attachment)}
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
                              href={mes.attachment}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium truncate"
                            >
                              {mes.attachment.split("/").pop() ||
                                "Download File"}
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
                    {format(new Date(mes.timestamp), "do MMMM : h:mmaaa")}
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
                    {responding ? (
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

export default page;
