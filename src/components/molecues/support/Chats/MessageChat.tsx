"use client";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { useState, useEffect } from "react";
import {
  useGetAllChat,
  useGetChat,
  useClaimChat,
  useCloseChat,
  useDeleteChat,
  useExportChatPdf,
  useMarkChatAsRead,
  useUpdateChat,
} from "@/hooks/api/chat";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChatDetailsDialog,
  ChatTableDropdown,
  ClaimedChatSection,
} from "./ChatReuseables";

const formatDisplayDate = (timestamp: string): string => {
  const match = timestamp.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return "--/--/----";
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
};

const formatDisplayTime = (timestamp: string): string => {
  const match = timestamp.match(/T(\d{2}):(\d{2})/);
  if (!match) return "--:--";
  const [, hour, minute] = match;
  return `${hour}:${minute}`;
};

type MessageTabContentProps = {
  selectedOption?: string;
  searchTerm?: string;
  selectedEndDate?: string;
  selectedStartDate?: string;
  date?: string;
};

type ChatItem = {
  id: string;
  title?: string;
  created_at: string;
  status?: string;
  user_info: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
};

type ChatFilters = {
  status?: string;
  search?: string;
  created_after?: string;
  created_before?: string;
  date?: string;
};

export const MessageTabContent: React.FC<MessageTabContentProps> = ({
  selectedOption,
  searchTerm,
  selectedEndDate,
  selectedStartDate,
  date,
}) => {
  const router = useRouter();
  const [selectedTicket, setSelectedTicket] = useState<ChatItem | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<"details" | "claim" | null>(
    null
  );
  const [statusFilter, setStatusFilter] = useState<string>(
    selectedOption || ""
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [editingChat, setEditingChat] = useState<ChatItem | null>(null);
  const [editedTitle, setEditedTitle] = useState("");

  // Add state to track previous values for comparison
  const [prevSearchTerm, setPrevSearchTerm] = useState(searchTerm);
  const [prevSelectedEndDate, setPrevSelectedEndDate] =
    useState(selectedEndDate);
  const [prevSelectedStartDate, setPrevSelectedStartDate] =
    useState(selectedStartDate);
  const [prevDate, setPrevDate] = useState(date);

  const {
    chats: fetchedChats,
    loadNext,
    loading,
    error: chatError,
    nextPageUrl,
    setFilters,
  } = useGetAllChat();

  const [chats, setChats] = useState<ChatItem[]>([]);

  const { chat: chatDetails, loadingChat } = useGetChat({
    ChatId: ticketId as string,
    initialFetch: !!ticketId,
  });

  const { claiming, onClaiming } = useClaimChat();
  const { closing, onCloseChat: performCloseChat } = useCloseChat();
  const { deleting, onDeleteChat: performDeleteChat } = useDeleteChat();
  const { exporting, onExportPdf } = useExportChatPdf();
  const { marking, onMarkAsRead: performMarkAsRead } = useMarkChatAsRead();
  const { updating, onUpdateChat } = useUpdateChat();

  // Execute row actions against the clicked chat row directly.
  const handleCloseChat = (chat: ChatItem) => {
    performCloseChat({
      ChatId: chat.id,
      successCallback: () => {
        triggerFullReload();
      },
    });
  };

  const handleDeleteChat = (chat: ChatItem) => {
    performDeleteChat({
      ChatId: chat.id,
      successCallback: () => {
        triggerFullReload();
      },
    });
  };

  const handleExportChat = (chat: ChatItem) => {
    onExportPdf({
      ChatId: chat.id,
      fileName: `chat-${chat.title || chat.id}.pdf`,
    });
  };

  const handleMarkChatAsRead = (chat: ChatItem) => {
    performMarkAsRead({
      ChatId: chat.id,
      successCallback: () => {
        triggerFullReload();
      },
    });
  };

  const handleOpenEditTitle = (chat: ChatItem) => {
    setEditingChat(chat);
    setEditedTitle(chat.title || "");
  };

  const handleOpenChatDetails = (chat: ChatItem) => {
    setSelectedTicket(chat);
    setTicketId(chat.id);
    setActiveModal("details");
  };

  const handleUpdateTitle = () => {
    if (!editingChat?.id || !editedTitle.trim()) {
      return;
    }

    onUpdateChat({
      ChatId: editingChat.id,
      payload: { title: editedTitle.trim() },
      successCallback: (updatedChat) => {
        const updatedTitle = String(
          (updatedChat as { title?: unknown })?.title || editedTitle.trim()
        );

        setChats((prev) =>
          prev.map((item) =>
            String(item.id) === String(editingChat.id)
              ? { ...item, title: updatedTitle }
              : item
          )
        );

        if (selectedTicket && String(selectedTicket.id) === String(editingChat.id)) {
          setSelectedTicket({ ...selectedTicket, title: updatedTitle });
        }

        setEditingChat(null);
        setEditedTitle("");
      },
    });
  };

  // Function to trigger full reload
  const triggerFullReload = () => {
    setChats([]); // Reset chats array
    setIsInitialLoad(true); // Reset initial load flag
    setIsLoadingMore(false); // Reset loading more state
  };

  useEffect(() => {
    const filters: ChatFilters = {};
    filters.status = statusFilter === "all" ? "" : statusFilter;

    if (searchTerm) {
      filters.search = searchTerm;
    }

    if (selectedStartDate) {
      filters.created_after = selectedStartDate;
    }

    if (selectedEndDate) {
      filters.created_before = selectedEndDate;
    }

    if (date) {
      filters.date = date as string;
    }

    // Check if filter props have changed from previous values
    if (
      searchTerm !== prevSearchTerm ||
      selectedEndDate !== prevSelectedEndDate ||
      selectedStartDate !== prevSelectedStartDate ||
      date !== prevDate
    ) {
      triggerFullReload();
      setPrevSearchTerm(searchTerm);
      setPrevSelectedEndDate(selectedEndDate);
      setPrevSelectedStartDate(selectedStartDate);
      setPrevDate(date);
    }

    setFilters(filters);
  }, [
    statusFilter,
    searchTerm,
    selectedStartDate,
    selectedEndDate,
    date,
    setFilters,
    prevSearchTerm,
    prevSelectedEndDate,
    prevSelectedStartDate,
    prevDate,
  ]);

  useEffect(() => {
    if (fetchedChats) {
      setChats(fetchedChats as ChatItem[]);
      setIsLoadingMore(false);
      setIsInitialLoad(false);
    }
  }, [fetchedChats]);

  const handleViewDetails = (chat: ChatItem) => {
    setSelectedTicket(chat);
    setTicketId(chat.id);
    setActiveModal("details");
  };

  const handleOpenClaimModal = (chat: ChatItem) => {
    setSelectedTicket(chat);
    setTicketId(chat.id);
    setActiveModal("claim");
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedTicket(null);
    setTicketId(null);
  };

  const handleTabChange = (value: string) => {
    setStatusFilter(value === "all" ? "" : value);

    // Trigger full reload when filter changes
    triggerFullReload();

    // Set filters to trigger data refetch
    const filters: ChatFilters = {};
    filters.status = value === "all" ? "" : value;

    if (searchTerm) {
      filters.search = searchTerm;
    }

    if (selectedStartDate) {
      filters.created_after = selectedStartDate;
    }

    if (selectedEndDate) {
      filters.created_before = selectedEndDate;
    }

    if (date) {
      filters.date = date as string;
    }

    setFilters(filters);
  };

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    loadNext();
  };

  const styling =
    "px-[24px] h-full data-[state=active]:text-black data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:rounded-none data-[state=active]:border-b-[2px] data-[state=active]:border-b-[#181818] flex items-center justify-center cursor-pointer bg-transparent shadow-none rounded-none";

  return (
    <>
      <div className="space-y-[32px]">
        <div className="flex justify-between items-center mb-4 px-[16px]">
          <h2 className="lg:text-[20px] text-[14px] text-[#181818] font-[500] lg:font-[600]">
            Chats
          </h2>
        </div>

        <Tabs
          defaultValue="all"
          className="space-y-[40px]"
          onValueChange={handleTabChange}
        >
          <TabsList className="w-full flex justify-center items-center border-b-[1px] border-[#ACAEB3] bg-transparent shadow-none rounded-none pb-0">
            <TabsTrigger value="all" className={styling}>
              All
            </TabsTrigger>
            <TabsTrigger value="WAITING" className={styling}>
              Waiting
            </TabsTrigger>
            <TabsTrigger value="ACTIVE" className={styling}>
              Active
            </TabsTrigger>
            <TabsTrigger value="CLOSED" className={styling}>
              Closed
            </TabsTrigger>
          </TabsList>

          {loading && chats.length === 0 && isInitialLoad ? (
            <div className="h-[200px] flex justify-center items-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : chats.length === 0 && !loading ? (
            <div className="h-[40px] flex justify-center items-center">
              <p className="text-[20px] font-[500] text-[#181818]">
                No data found
              </p>
            </div>
          ) : (
            <div className="lg:px-[24px] px-[4px]">
              <div className="overflow-x-auto">
                <Table className="border-none border-collapse min-w-[600px]">
                  <TableHeader>
                    <TableRow className="items-center border-none hover:bg-none">
                      <TableCell className="font-semibold border-none min-w-[200px] whitespace-nowrap">
                        Message Preview
                      </TableCell>
                      <TableCell className="font-semibold border-none min-w-[180px] whitespace-nowrap">
                        Customer
                      </TableCell>
                      <TableCell className="font-semibold border-none whitespace-nowrap">
                        Created at
                      </TableCell>
                      <TableCell className="font-semibold border-none whitespace-nowrap">
                        Status
                      </TableCell>
                      <TableCell className="font-semibold border-none whitespace-nowrap">
                        Action
                      </TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chats.map((chat, index) => (
                      <TableRow
                        key={`${chat.id}-${index}`}
                        className="items-center cursor-pointer border-none"
                      >
                        <TableCell className="border-none min-w-[200px] whitespace-nowrap">
                          <div className="flex items-center space-x-4">
                            <div className="space-y-[8px]">
                              <h2 className="font-medium text-[#181818] text-[14px] lg:text-[16px]">
                                {chat.title}
                              </h2>
                              <p className="text-[#9B9EA4] text-[12px]">
                                {"Chat--00" + chat.id}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="border-none min-w-[180px] whitespace-nowrap">
                          <div className="space-y-2">
                            <p className="text-[#181818] text-[14px] font-[500] capitalize">
                              {chat.user_info.first_name || "---"}{" "}
                              {chat.user_info.last_name || "---"}
                            </p>
                            <p className="text-[#9B9EA4] text-[12px]">
                              {chat.user_info.email || "---"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="table-cell border-none whitespace-nowrap">
                          <div className="space-y-2">
                            <p className="text-[#181818] text-[14px] font-[500]">
                              {formatDisplayDate(chat.created_at)}
                            </p>
                            <p className="text-[#9B9EA4] text-[12px]">
                              <span>{getRelativeTime(chat.created_at)}</span>
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="border-none whitespace-nowrap">
                          <span
                            className={`px-4 py-3 rounded-md text-[10px] lg:text-[12px] ${
                              chat.status === "WAITING"
                                ? "bg-[#CCD8E8] text-[#181818]"
                                : chat.status === "ACTIVE"
                                ? "bg-[#EFB60880]/50  text-[#181818]"
                                : chat.status === "CLOSED"
                                ? "bg-[#2D9C5E80]/50  text-[#181818]"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {(chat.status || "UNKNOWN").replace("_", " ").toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell className="border-none whitespace-nowrap">
                          <ChatTableDropdown
                            parentWidth={180}
                            onViewDetails={() => handleOpenClaimModal(chat)}
                            onViewMessage={() => handleOpenChatDetails(chat)}
                            onEditTitle={() => handleOpenEditTitle(chat)}
                            onExportPdf={() => handleExportChat(chat)}
                            onMarkAsRead={() => handleMarkChatAsRead(chat)}
                            onCloseChat={() => handleCloseChat(chat)}
                            onDeleteChat={() => handleDeleteChat(chat)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {nextPageUrl && (
            <div className="flex justify-center mt-4">
              <button
                className="bg-[#EBECED] cursor-pointer rounded-[8px] px-[40px] py-[16px] flex items-center"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? (
                  <div className="w-5 h-5 border-2 border-[#023E8A] border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <p className="text-[#023E8A] text-[14px]">Load more</p>
                )}
              </button>
            </div>
          )}
        </Tabs>
      </div>

      {activeModal === "details" && (
        <ChatDetailsDialog
          selectedTicket={selectedTicket}
          chatDetails={chatDetails}
          chatLoading={loadingChat}
          onClose={closeModal}
          onClaimChat={
            selectedTicket ? () => handleOpenClaimModal(selectedTicket) : undefined
          }
          claimingChat={claiming}
        />
      )}

      {activeModal === "claim" && (
        <ClaimedChatSection
          selectedTicket={selectedTicket}
          chatDetails={chatDetails}
          chatLoading={loadingChat}
          onClose={closeModal}
        />
      )}

      <Dialog
        open={Boolean(editingChat)}
        onOpenChange={(open) => {
          if (!open && !updating) {
            setEditingChat(null);
            setEditedTitle("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Chat Title</DialogTitle>
            <DialogDescription>
              Update the title for chat #{editingChat?.id}.
            </DialogDescription>
          </DialogHeader>

          <input
            type="text"
            value={editedTitle}
            onChange={(event) => setEditedTitle(event.target.value)}
            className="w-full rounded-md border border-[#CDCED1] px-3 py-2 text-sm"
            placeholder="Enter chat title"
            disabled={updating}
          />

          <DialogFooter>
            <button
              type="button"
              className="rounded-md border border-[#CDCED1] px-4 py-2 text-sm"
              onClick={() => {
                if (!updating) {
                  setEditingChat(null);
                  setEditedTitle("");
                }
              }}
              disabled={updating}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-md bg-[#023E8A] px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handleUpdateTitle}
              disabled={updating || !editedTitle.trim()}
            >
              {updating ? "Saving..." : "Save"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export function getRelativeTime(timestamp: string): string {
  return formatDisplayTime(timestamp);
}

const Skeleton = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="w-full space-y-[12px] mt-5 px-4 ">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex justify-between items-center w-full"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="bg-gray-300 animate-pulse h-[50px] w-[24%] rounded-[12px]"
            ></div>
          ))}
        </div>
      ))}
    </div>
  );
};
