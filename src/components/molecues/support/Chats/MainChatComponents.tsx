"use client";
import React from "react";
import { useRef, useEffect, useState, useMemo } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useRouter } from "next/navigation";
import { useGetChat } from "@/hooks/api/chat";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { useWebSocketService } from "@/hooks/api/chat";
import ChatService from "@/services/chat";
import { useAuthContext } from "@/context/AuthContext";
import { useMyRoles } from "@/hooks/api/roles";
import { FileText, ArrowUpRight, DownloadIcon, X } from "lucide-react";
import { getCookies } from "@/context/Auth-Cookies";
import { getSingleRouteParam } from "@shared/lib/routeParams";
const Spinner = () => (
  <svg
    className="inline w-6 h-6 ml-2 animate-spin text-white"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="6"
      fill="none"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
    />
  </svg>
);

type ChatActor = {
  id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
};

type ChatMessage = {
  id?: string;
  clientMessageId?: number;
  message?: string;
  content?: string;
  sender_id?: string;
  sender_info?: ChatActor;
  created_at?: string;
  type?: string;
  attachment_url?: string;
  attachment_name?: string;
  attachment_type?: string;
  uploading?: boolean;
};

type ChatSession = {
  id?: string;
  created_at?: string;
  status?: string;
  user_info?: ChatActor;
  claimed_by_info?: ChatActor | null;
  assigned_admin_info?: ChatActor | null;
  messages?: ChatMessage[];
};

type MainChatProps = {
  sessionId?: string;
  accessToken?: string;
};

type SessionProps = {
  chat: ChatSession | null;
  loadingChat: boolean;
  isAdmin: boolean;
  canViewMessage: boolean;
  currentUser: string;
  accessToken?: string;
};

const formatDate = (isoDate: string | number | Date | null | undefined) => {
  if (!isoDate) {
    return "Invalid date";
  }

  const date = new Date(isoDate);

  if (isNaN(date.getTime())) {
    return "Invalid date";
  }

  return format(date, "EEEE dd/MM/yyyy | hh:mm a");
};

export const MainChatComponents = ({ sessionId, accessToken }: MainChatProps) => {
  const APP_STATE = useAuthContext();
  const currentUser = APP_STATE?.user?.user_id || "";
  const authAccessToken = APP_STATE?.accessToken || accessToken;
  const params = useParams();
  const chatId = getSingleRouteParam(params, "id");

  const { chat, loadingChat } = useGetChat({
    ChatId: sessionId as string,
    initialFetch: !!chatId,
    successCallback: (message) => {
      console.log(message);
    },
    errorCallback: (error) => {
      console.error(error);
    },
  });
  const { loading, data } = useMyRoles({ modalVisible: chat?.id });
  const canViewMessage =
    data?.current_permission_group_slugs?.includes("support-tickets") ||
    data?.current_permission_group_slugs?.includes("customer-support") ||
    data?.name === "Super Admin";

  const isInputDisabled = chat?.status === "CLOSED" || !canViewMessage;
  !(
    chat?.assigned_admin_info === null ||
    chat?.claimed_by_info?.id === currentUser ||
    chat?.assigned_admin_info?.id === currentUser
  );

  const router = useRouter();
  const [closing, setClosing] = useState(false);

  // Close chat handler
  const handleCloseChat = async () => {
    if (!chat?.id) return;
    setClosing(true);
    try {
      await ChatService.closeChat({ id: chat.id });
      // Optionally, show a toast or notification
      router.push("/Dashboard/support/chats"); // Redirect after closing
    } catch (error) {
      // Optionally, show error toast
      console.error(error);
    } finally {
      setClosing(false);
    }
  };
  return (
    <div className="space-y-[24px]">
      <div className="flex justify-between items-center">
        <img
          src="/assets/icons/arrow-back.svg"
          alt="Back"
          className="cursor-pointer"
          onClick={() => router.back()}
        />
        <div className="flex space-x-6">
          <button
            className={`rounded-[8px] font-medium p-4 cursor-pointer ${
              isInputDisabled
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-[#023E8A] text-white"
            }`}
            onClick={handleCloseChat}
            disabled={closing || isInputDisabled || !canViewMessage}
          >
            {closing ? "Closing..." : "Close chat"}
          </button>
        </div>
      </div>

      {loadingChat ? (
        <p className="">Loading</p>
      ) : (
        <div className="space-y-4">
          <p className="font-medium text-[16px] text-[#181818]">
            {formatDate(chat?.created_at)}
          </p>
          <div className="flex space-x-3 items-center">
            <p className="lg:text-[16px] text-[12px]  font-semibold text-[#4E4F52]">
              Customer:{" "}
              <span className="font-medium">
                {chat?.user_info.first_name} {chat?.user_info.last_name}
              </span>
            </p>
            <div className="w-2 h-2 bg-[#9B9EA4] rounded-full"></div>
            <p className="lg:text-[16px] text-[12px]  font-semibold text-[#4E4F52]">
              Chat ID:{" "}
              <span className="font-medium">{"Chat--" + chat?.id}</span>
            </p>
            <div className="w-2 h-2 bg-[#9B9EA4] rounded-full"></div>
            <p className="lg:text-[16px] text-[12px] font-semibold text-[#4E4F52] capitalize">
              Chat Status:{" "}
              <span className="font-medium capitalize ">{chat?.status}</span>
            </p>
          </div>
        </div>
      )}

      <Session
        chat={chat}
        loadingChat={loadingChat}
        isAdmin={isInputDisabled}
        canViewMessage={canViewMessage}
        currentUser={currentUser}
        accessToken={authAccessToken}
      />
    </div>
  );
};

export const Session = ({
  chat,
  loadingChat,
  isAdmin,
  canViewMessage,
  currentUser,
  accessToken,
}: SessionProps) => {
  const {
    messages: liveMessages,
    send,
    socket,
  } = useWebSocketService({ sessionId: chat?.id, accessToken });
  const [input, setInput] = useState("");
  const lastMessageRef = useRef<HTMLDivElement | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploadingMessages, setUploadingMessages] = useState<ChatMessage[]>(
    []
  );

  const handleDownload = () => {
    if (!modalImage) return;
    fetch(modalImage)
      .then((response) => response.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = "image";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      })
      .catch((err) => console.error("Failed to download image:", err));
  };

  const handleCloseModal = () => setModalImage(null);
  const handleImageClick = (url: string) => setModalImage(url);

  const triggerBrowserDownload = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.style.display = "none";
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
  };

  const handleAttachmentDownload = async (message: ChatMessage) => {
    const fallbackUrl = message?.attachment_url;

    try {
      if (message?.id) {
        const response = await ChatService.downloadChatAttachment({
          id: message.id,
        });

        const contentDisposition =
          response.headers?.["content-disposition"] || "";
        const nameFromHeader = contentDisposition
          .match(/filename\*?=(?:UTF-8''|\")?([^\";]+)/i)?.[1]
          ?.replace(/\"/g, "");

        const filename =
          (nameFromHeader && decodeURIComponent(nameFromHeader)) ||
          message?.attachment_name ||
          message?.message ||
          "attachment";

        triggerBrowserDownload(response.data, filename);
        return;
      }

      if (fallbackUrl) {
        window.open(fallbackUrl, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      if (fallbackUrl) {
        window.open(fallbackUrl, "_blank", "noopener,noreferrer");
      }
    }
  };

  const handleAttachmentChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        const clientMessageId = Date.now();
        const payload = {
          clientMessageId, // for tracking
          message: file.name, // Use file name as content
          chatId: chat?.id,
          attachment: base64String, // base64 string
          attachmentType: file.type,
        };
        setUploadingMessages((prev) => [
          ...prev,
          {
            clientMessageId,
            message: file.name,
            sender_id: currentUser,
            attachment_type: "other",
            uploading: true,
            created_at: new Date().toISOString(),
          },
        ]);
        send(payload);
      };
      reader.readAsDataURL(file);
    }
  };

  const systemErrorMessage = useMemo(() => {
    const errorMsgObj = liveMessages.find(
      (msg: ChatMessage) => msg.type === "error"
    );
    return errorMsgObj ? errorMsgObj.message : null;
  }, [liveMessages]);

  // Remove uploading message when real message arrives (match by clientMessageId)
  useEffect(() => {
    if (uploadingMessages.length === 0) return;
    setUploadingMessages((prev) =>
      prev.filter(
        (umsg) =>
          !liveMessages.some(
            (msg: ChatMessage) =>
              (msg.clientMessageId &&
                msg.clientMessageId === umsg.clientMessageId) ||
              // fallback: match by file name, sender, and created_at (if backend doesn't echo clientMessageId)
              (msg.message === umsg.message && msg.sender_id === umsg.sender_id)
          )
      )
    );
  }, [liveMessages]);

  const allMessages = useMemo(() => {
    const history = chat?.messages || [];
    const live = liveMessages.filter(
      (live: ChatMessage) =>
        live.type !== "session_info" &&
        live.type !== "error" &&
        !history.some((msg: ChatMessage) => msg.id === live.id)
    );
    return [...history, ...live, ...uploadingMessages];
  }, [chat?.messages, liveMessages, uploadingMessages]);

  const handleSend = () => {
    if (input.trim()) {
      const payload = {
        messageId: Date.now(),
        message: input,
        chatId: chat?.id,
      };

      send(payload);
      setInput("");
    }
  };

  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [allMessages, systemErrorMessage]);

  const isInputDisabled =
    chat?.status === "CLOSED" || systemErrorMessage !== null || isAdmin;

  return (
    <>
      <div className="w-full pt-6 border border-gray-300 bg-gray-100 rounded-lg flex flex-col">
        <div className="flex justify-center items-center space-x-4 p-4">
          <div className="w-48 h-0.5 bg-black"></div>
          <div className="rounded-full border border-black py-2 px-4 text-black">
            {loadingChat ? (
              <span className="text-gray-500">Loading...</span>
            ) : (
              <div className=" text-[12px] lg:text-sm">
                {chat?.claimed_by_info?.first_name ||
                chat?.assigned_admin_info?.email ? (
                  <>
                    Responding:{" "}
                    {chat?.claimed_by_info?.first_name ||
                      chat?.claimed_by_info?.email ||
                      chat?.assigned_admin_info?.first_name ||
                      chat?.assigned_admin_info?.email ||
                      "---"}
                  </>
                ) : (
                  "No admin claimed"
                )}
              </div>
            )}
          </div>
          <div className="w-48 h-0.5 bg-black"></div>
        </div>

        {loadingChat ? (
          <div className="text-center text-gray-500">Loading messages...</div>
        ) : (
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {allMessages.map((mes: ChatMessage, index: number) => {
              const isUser =
                chat?.user_info?.id === mes.sender_info?.id ||
                chat?.user_info?.id === mes.sender_id;
              return (
                <div
                  key={index}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                  ref={index === allMessages.length - 1 ? lastMessageRef : null}
                >
                  <div className="space-y-1 max-w-[80%]">
                    {mes.content || mes.message ? (
                      <div
                        className={`py-3 px-4 text-sm font-medium rounded-xl shadow-md ${
                          isUser
                            ? "bg-gray-200 text-black"
                            : "bg-[#023E8A] text-white"
                        }`}
                      >
                        {mes.content || mes.message}
                        {mes.uploading && <Spinner />}
                      </div>
                    ) : null}

                    {mes.attachment_url && (
                      <div className="mt-2">
                        {mes.attachment_type === "other" ? (
                          <img
                            src={mes.attachment_url}
                            alt="Attachment"
                            className={`w-[250px] h-auto rounded-lg shadow-lg cursor-pointer ${
                              isUser ? "ml-auto" : "mr-auto"
                            }`}
                            onClick={() => handleImageClick(mes.attachment_url)}
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAttachmentDownload(mes)}
                            className={`w-[250px] flex items-center justify-between gap-2 text-blue-500 h-[50px] bg-blue-100 hover:bg-blue-200 transition-all duration-300 font-semibold px-4 py-2 rounded-lg shadow-md ${
                              isUser ? "ml-auto" : "mr-auto"
                            }`}
                          >
                            <FileText className="w-5 h-5" />
                            <span>Download</span>
                            <DownloadIcon className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    )}

                    <span
                      className={`block text-xs text-gray-500 ${
                        isUser ? "text-right" : "text-left"
                      }`}
                    >
                      {mes.created_at
                        ? format(new Date(mes.created_at), "h:mm a")
                        : ""}
                    </span>
                  </div>
                </div>
              );
            })}

            {systemErrorMessage && (
              <div className="flex justify-center">
                <div className="bg-red-100 text-red-800 text-center px-4 py-2 rounded-md shadow-md max-w-[80%]">
                  {systemErrorMessage}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="p-4 border-t flex items-center gap-4">
          {chat?.status === "resolved" ? (
            <p className="text-center w-full text-gray-500">
              This chat has been marked as resolved
            </p>
          ) : (
            <>
              <div className="bg-gray-200 flex-1 p-3 border rounded-lg flex items-center space-x-4">
                <div className="flex justify-between items-center w-full">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 w-full outline-none bg-transparent"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isInputDisabled) {
                        handleSend();
                      }
                    }}
                    disabled={isInputDisabled}
                  />
                  <div>
                    <label htmlFor="attachment-input">
                      <img
                        src="/assets/icons/attach-ment.svg"
                        alt="Attach"
                        className="cursor-pointer"
                      />
                    </label>
                    <input
                      id="attachment-input"
                      type="file"
                      className="hidden"
                      onChange={handleAttachmentChange}
                      accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                    />
                  </div>
                </div>
              </div>
              <button
                onClick={handleSend}
                className={`p-3 rounded-lg ${
                  isInputDisabled
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-[#023E8A] text-white"
                }`}
                disabled={isInputDisabled}
              >
                Send
              </button>
            </>
          )}
        </div>
      </div>

      {modalImage && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-75 flex justify-center items-center z-50">
          <div className="relative w-auto max-w-3xl max-h-[90vh]">
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                className="text-white bg-black bg-opacity-50 rounded-full p-2"
                onClick={handleCloseModal}
                aria-label="Close image preview"
              >
                <X className="w-6 h-6" />
              </button>
              <button
                onClick={handleDownload}
                className="text-white bg-black bg-opacity-50 rounded-full p-2"
                aria-label="Download image"
              >
                <DownloadIcon className="w-6 h-6" />
              </button>
            </div>
            <img
              src={modalImage}
              alt="Modal Content"
              className="max-w-full max-h-full rounded-lg shadow-lg"
            />
          </div>
        </div>
      )}
    </>
  );
};
