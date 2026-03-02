import Image from "next/image";
import React, { useRef, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useGetChat } from "@/hooks/api/chat";
import { useWebSocketService } from "@/hooks/api/chat";
import ChatService from "@/services/chat";
import { useAuthContext } from "@/context/AuthContext";
import { useMyRoles } from "@/hooks/api/roles";
import { FileText, DownloadIcon, X } from "lucide-react";
import {
  MainChatComponentsProps,
  SessionProps,
  Chat,
  Message,
  ChatMessage,
  MyRolesData,
} from "@/types";

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

const formatDate = (isoDate: string | undefined) => {
  if (!isoDate) {
    return "Invalid date";
  }
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) {
    return "Invalid date";
  }
  return format(date, "EEEE dd/MM/yyyy | hh:mm a");
};

export const MainChatComponents = ({
  sessionId,
  accessToken,
}: MainChatComponentsProps) => {
  const APP_STATE = useAuthContext();
  const currentUser = APP_STATE?.user?.user_id || "";

  const { chat, loadingChat }: { chat: Chat | null; loadingChat: boolean } =
    useGetChat({
      ChatId: sessionId,
      initialFetch: !!sessionId,
    });

  const { data } = useMyRoles({ modalVisible: !!chat?.id });
  const rolesData = data as MyRolesData;
  const canViewMessage =
    rolesData?.current_permission_group_slugs?.includes("support-tickets");

  const isParticipant =
    chat?.assigned_admin_info === null ||
    chat?.claimed_by_info?.id === currentUser ||
    chat?.assigned_admin_info?.id === currentUser;

  const isInputDisabled =
    chat?.status === "CLOSED" || !canViewMessage || !isParticipant;

  const router = useRouter();
  const [closing, setClosing] = useState(false);

  const handleCloseChat = async () => {
    if (!chat?.id) return;
    setClosing(true);
    try {
      await ChatService.closeChat({ id: chat.id });
      router.push("/Dashboard/support/chats");
    } catch (error) {
      console.error(error);
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className="space-y-[24px]">
      <div className="flex justify-between items-center">
        <Image
          src="/assets/icons/arrow-back.svg"
          alt="Back"
          className="cursor-pointer"
          onClick={() => router.back()}
          width={24}
          height={24}
        />
        <div className="flex space-x-6">
          <button
            type="button"
            className={`rounded-[8px] font-medium p-4 cursor-pointer ${
              isInputDisabled
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-[#023E8A] text-white"
            }`}
            onClick={handleCloseChat}
            disabled={closing || isInputDisabled}
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
              Chat ID: <span className="font-medium">{"Chat--" + chat?.id}</span>
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
        currentUser={currentUser}
        accessToken={accessToken}
      />
    </div>
  );
};

export const Session = ({
  chat,
  loadingChat,
  currentUser,
  accessToken,
}: SessionProps) => {
  const { messages: liveMessages, send } = useWebSocketService({
    sessionId: chat?.id,
    accessToken,
  });
  const [input, setInput] = useState("");
  const lastMessageRef = useRef<HTMLDivElement | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [uploadingMessages, setUploadingMessages] = useState<Message[]>([]);

  const handleDownload = async () => {
    if (!modalImage) return;
    try {
      const response = await fetch(modalImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = "image";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Failed to download image:", err);
    }
  };

  const handleCloseModal = () => setModalImage(null);
  const handleImageClick = (url: string) => setModalImage(url);

  const handleAttachmentChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file && chat?.id) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        const clientMessageId = Date.now();
        const payload = {
          clientMessageId,
          message: file.name,
          chatId: chat.id,
          attachment: base64String,
          attachmentType: file.type,
        };

        const optimisticMessage: Message = {
          id: String(clientMessageId),
          clientMessageId,
          message: file.name,
          sender_id: currentUser,
          attachment_type: file.type.startsWith("image/") ? "image" : "file",
          attachment_url: base64String,
          uploading: true,
          created_at: new Date().toISOString(),
        };

        setUploadingMessages((prev) => [...prev, optimisticMessage]);
        send(payload);
      };
      reader.readAsDataURL(file);
    }
  };

  const systemErrorMessage = useMemo(() => {
    const errorMsg = (liveMessages as ChatMessage[]).find(
      (msg) => msg.type === "error"
    );
    return errorMsg ? errorMsg.message : null;
  }, [liveMessages]);

  useEffect(() => {
    if (uploadingMessages.length === 0) return;
    const receivedIds = new Set(
      liveMessages.map((msg: ChatMessage) => msg.clientMessageId)
    );
    setUploadingMessages((prev) =>
      prev.filter((umsg) => !receivedIds.has(umsg.clientMessageId))
    );
  }, [liveMessages, uploadingMessages.length]);

  const allMessages = useMemo(() => {
    const history: Message[] = chat?.messages || [];
    const live = (liveMessages as ChatMessage[]).filter(
      (liveMsg) =>
        liveMsg.type !== "session_info" &&
        liveMsg.type !== "error" &&
        !history.some((msg) => msg.id === liveMsg.id)
    );
    return [...history, ...live, ...uploadingMessages].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [chat?.messages, liveMessages, uploadingMessages]);

  const handleSend = () => {
    if (input.trim() && chat?.id) {
      const payload = {
        messageId: Date.now(),
        message: input,
        chatId: chat.id,
      };
      send(payload);
      setInput("");
    }
  };

  useEffect(() => {
    lastMessageRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages, systemErrorMessage]);

  const isInputDisabled = chat?.status === "CLOSED" || !!systemErrorMessage;

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
            {allMessages.map((mes, index) => {
              const isUser =
                chat?.user_info?.id === mes.sender_info?.id ||
                chat?.user_info?.id === mes.sender_id;
              return (
                <div
                  key={mes.id || index}
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
                        {mes.attachment_type === "image" ? (
                          <Image
                            src={mes.attachment_url}
                            alt="Attachment"
                            className={`w-[250px] h-auto rounded-lg shadow-lg cursor-pointer ${
                              isUser ? "ml-auto" : "mr-auto"
                            }`}
                            onClick={() =>
                              handleImageClick(mes.attachment_url!)
                            }
                            width={250}
                            height={200}
                            objectFit="cover"
                          />
                        ) : (
                          <a
                            href={mes.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`w-[250px] flex items-center justify-between gap-2 text-blue-500 h-[50px] bg-blue-100 hover:bg-blue-200 transition-all duration-300 font-semibold px-4 py-2 rounded-lg shadow-md ${
                              isUser ? "ml-auto" : "mr-auto"
                            }`}
                          >
                            <FileText className="w-5 h-5" />
                            <span>Download</span>
                            <DownloadIcon className="w-5 h-5" />
                          </a>
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
          {chat?.status === "RESOLVED" ? (
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
                    aria-label="Type a message"
                    className="flex-1 w-full outline-none bg-transparent"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isInputDisabled) {
                        handleSend();
                      }
                    }}
                    disabled={isInputDisabled}
                  />
                  <div>
                    <label
                      htmlFor="attachment-input"
                      title="Attach file"
                      className="cursor-pointer"
                    >
                      <Image
                        src="/assets/icons/attach-ment.svg"
                        alt="Attach a file"
                        width={24}
                        height={24}
                      />
                    </label>
                    <input
                      id="attachment-input"
                      type="file"
                      className="hidden"
                      onChange={handleAttachmentChange}
                      accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                      disabled={isInputDisabled}
                    />
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSend}
                className={`p-3 rounded-lg ${
                  isInputDisabled
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-[#023E8A] text-white"
                }`}
                disabled={isInputDisabled || !input.trim()}
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
                type="button"
                title="Close image"
                className="text-white bg-black bg-opacity-50 rounded-full p-2"
                onClick={handleCloseModal}
              >
                <X className="w-6 h-6" />
              </button>
              <button
                type="button"
                title="Download image"
                onClick={handleDownload}
                className="text-white bg-black bg-opacity-50 rounded-full p-2"
              >
                <DownloadIcon className="w-6 h-6" />
              </button>
            </div>
            <Image
              src={modalImage}
              alt="Modal Content"
              className="max-w-full max-h-full rounded-lg shadow-lg"
              fill
              objectFit="contain"
            />
          </div>
        </div>
      )}
    </>
  );
};
