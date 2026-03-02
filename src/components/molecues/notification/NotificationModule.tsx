"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  useGetAllNotifications,
  useMarkAsRead,
  useDeleteNotification,
  useWebSocketService,
} from "@/hooks/api/notification";
import { format, formatDistanceToNow } from "date-fns";

type NotificationModuleProps = {
  accessToken: string;
};
type NotificationTableProps = {
  accessToken: string;
};

export const NotificationModule = ({
  accessToken,
}: NotificationModuleProps) => {
  console.log(accessToken);
  const router = useRouter();
  return (
    <div className="">
      <div className="space-y-[24px]">
        <div>
          <img
            src="/assets/icons/arrow-back.svg"
            alt=""
            className="cursor-pointer"
            onClick={() => router.back()}
          />
        </div>
        <NotificationTable accessToken={accessToken} />
      </div>
    </div>
  );
};

const NotificationTable = ({ accessToken }: NotificationTableProps) => {
  const [filterDropdown, setFilterDropdown] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<
    "all" | "read" | "unread"
  >("all");
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>(
    []
  );
  const [searchInput, setSearchInput] = useState("");

  // ✅ API hook for initial load
  const {
    notifications: data,
    loading,
    loadNext,
    loadPrevious,
    setSearchTerm,
    setIsRead,
    setStartDate,
    setEndDate,
    refetch,
  } = useGetAllNotifications();

  const { markAsRead, loading: marking } = useMarkAsRead();
  const { deleteNotification, loading: deleting } = useDeleteNotification();

  // ✅ WebSocket hook
  const { messages: wsMessages } = useWebSocketService(accessToken);

  // ✅ Local state for displaying notifications
  const [notifications, setNotifications] = useState<any[]>([]);

  // Load API data into local state once
  useEffect(() => {
    if (data && data.length > 0) {
      setNotifications(data);
    }
  }, [data]);

  // Append WebSocket notifications in realtime
  useEffect(() => {
    if (wsMessages.length > 0) {
      const latest = wsMessages[wsMessages.length - 1];
      console.log("📩 New WS notification:", latest);

      setNotifications((prev) => {
        if (!prev.some((n) => n.id === latest.id)) {
          return [latest, ...prev]; // prepend new notification
        }
        return prev;
      });
    }
  }, [wsMessages]);

  const toggleDropdown = () => setFilterDropdown((prev) => !prev);

  const handleSelect = (id: string) => {
    setSelectedNotifications((prev) =>
      prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map((n: any) => String(n.id)));
    }
  };

  const handleSingleMarkRead = (id: string) => {
    markAsRead(id, () => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    });
  };

  const handleBulkMarkRead = () => {
    markAsRead(selectedNotifications, () => {
      setNotifications((prev) =>
        prev.map((n) =>
          selectedNotifications.includes(String(n.id))
            ? { ...n, is_read: true }
            : n
        )
      );
      setSelectedNotifications([]);
    });
  };

  const hasUnreadSelected = notifications.some(
    (n: any) => selectedNotifications.includes(String(n.id)) && !n.is_read
  );

  const handleBulkDelete = async () => {
    await deleteNotification(selectedNotifications, () => {
      setNotifications((prev) =>
        prev.filter((n) => !selectedNotifications.includes(String(n.id)))
      );
      setSelectedNotifications([]);
    });
  };

  return (
    <>
      <div className="border border-[#9B9EA4] rounded-[12px] overflow-hidden bg-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b py-[20px] px-[24px] bg-white">
          <div className="flex space-x-2 items-center">
            <input
              type="checkbox"
              className="form-checkbox h-5 w-5"
              checked={
                selectedNotifications.length === notifications.length &&
                notifications.length > 0
              }
              onChange={handleSelectAll}
              aria-label="Select all notifications"
            />
            <button
              onClick={() => refetch()}
              className="flex items-center space-x-2 p-[10px] border border-[#EBECED] rounded-[28px] text-sm font-medium text-[#181818] cursor-pointer"
            >
              <img src="/assets/icons/Refresh.svg" alt="" />
              <span>Refresh</span>
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-2">
            {/* Search */}
            <div className="flex border-[#ACAEB3] border rounded-[1000px] w-[306px] py-[10px] px-6 space-x-4">
              <img src="/assets/icons/search.svg" alt="" />
              <input
                type="text"
                placeholder="Search Notifications"
                value={searchInput}
                className="text-sm w-full outline-none"
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setSearchTerm(searchInput.trim()); // ✅ search only on Enter
                  }
                }}
              />
            </div>

            {/* Date filter
            <div
              className="flex border-[#ACAEB3] border rounded-[1000px] py-[10px] px-6 space-x-4 cursor-pointer"
              onClick={() => {
                const today = new Date().toISOString().split("T")[0];
                setStartDate(today);
              }}
            >
              <img src="/assets/icons/calendar.svg" alt="" />
              <span>Filter by Date</span>
            </div> */}

            {/* Status filter */}
            <div className="relative">
              <button
                onClick={toggleDropdown}
                className="flex border-[#ACAEB3] border rounded-[1000px] py-[10px] px-6 space-x-4 cursor-pointer items-center"
              >
                <span>
                  {selectedStatus === "all"
                    ? "All Notifications"
                    : selectedStatus === "read"
                    ? "Read"
                    : "Unread"}
                </span>
                {filterDropdown ? (
                  <ChevronUp className="ml-2 w-4 h-4" />
                ) : (
                  <ChevronDown className="ml-2 w-4 h-4" />
                )}
              </button>
              {filterDropdown && (
                <div className="absolute top-10 right-0 w-40 bg-white border rounded-lg shadow-md z-100">
                  {["all", "read", "unread"].map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setSelectedStatus(status as "all" | "read" | "unread");
                        if (status === "all") {
                          setIsRead(null);
                        } else if (status === "read") {
                          setIsRead(true);
                        } else {
                          setIsRead(false);
                        }
                        setFilterDropdown(false);
                      }}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {selectedNotifications.length > 0 && (
          <div className="my-3 gap-3 flex items-center px-[24px]">
            <div
              onClick={handleBulkDelete}
              className="bg-[#D72638] text-white cursor-pointer p-[10px] rounded-[28px] flex items-center space-x-2"
            >
              <img src="/assets/icons/NotDel.svg" alt="" />
              <span className="text-[12px] font-[500]">
                {deleting ? "Deleting..." : "Delete"}
              </span>
            </div>

            {hasUnreadSelected && (
              <div
                onClick={handleBulkMarkRead}
                className="border-[#EBECED] border cursor-pointer p-[10px] rounded-[28px] flex items-center space-x-2"
              >
                <span className="text-[12px] text-[#181818] font-[500]">
                  {marking ? "Marking..." : "Mark as Read"}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Notification list */}
        <div>
          {loading ? (
            <Skeleton />
          ) : data.length === 0 ? (
            // ✅ Empty state
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <img
                src="/assets/icons/empty.svg"
                alt=""
                className="w-12 h-12 mb-3"
              />
              <p className="text-sm font-medium">No notifications found</p>
            </div>
          ) : (
            notifications.map((n: any) => (
              <div
                key={n.id}
                className={`flex items-start justify-between w-full px-[32px] py-3 cursor-pointer ${
                  n.is_read ? "bg-white" : "bg-[#CCD8E833]"
                }`}
              >
                <div className="flex items-start space-x-4">
                  <input
                    type="checkbox"
                    className="form-checkbox h-5 w-5"
                    checked={selectedNotifications.includes(String(n.id))}
                    onChange={() => handleSelect(String(n.id))}
                    aria-label={`Select notification ${n.id}`}
                  />
                  <div className="space-y-2 flex-1">
                    <p className="text-[18px] font-[500] text-[#181818]">
                      {n.notification_details.title}
                    </p>
                    <p className="text-[16px] text-[#4E4F52] font-[400]">
                      {n.notification_details.message}
                    </p>
                    <div className="flex items-center space-x-[4px]">
                      <p className="text-[13px] font-[500] text-[#181818]">
                        {format(new Date(n.created_at), "d/M/yyyy")}
                      </p>
                      <span className="w-[6px] h-[6px] rounded-full bg-[#9B9EA4]" />
                      <p className="text-[13px] font-[500] text-[#181818]">
                        {formatDistanceToNow(new Date(n.created_at), {
                          addSuffix: true,
                        })
                          .replace("about ", "")
                          .replace(/^./, (str) => str.toUpperCase())}
                      </p>
                    </div>
                  </div>
                </div>

                {!n.is_read && (
                  <div
                    onClick={() => handleSingleMarkRead(n.id)}
                    className="bg-white cursor-pointer p-[10px] rounded-[4px]"
                  >
                    <span className="text-[14px] font-[500] text-[#181818]">
                      Mark As Read
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-end space-x-5 mt-3">
        <div
          onClick={loadPrevious}
          className="border-[#9B9EA4] border rounded-[8px] p-[12px] text-[14px] text-[#9B9EA4] cursor-pointer"
        >
          Previous
        </div>
        <div
          onClick={loadNext}
          className="border-[#9B9EA4] border rounded-[8px] p-[12px] text-[14px] text-[#9B9EA4] cursor-pointer"
        >
          Next
        </div>
      </div>
    </>
  );
};

const Skeleton = () => {
  return (
    <>
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="flex items-start justify-between w-full px-[32px] py-3 cursor-pointer"
        >
          <div className="flex space-x-2">
            <div className="w-6 h-6 bg-[#a1adbc33] animate-pulse"></div>
            <div className="space-y-2">
              <div className="w-[300px] h-5 bg-[#a1adbc33] animate-pulse rounded-[4px]"></div>
              <div className="w-[200px] h-5 bg-[#a1adbc33] animate-pulse rounded-[4px]"></div>
              <div className="w-[100px] h-5 bg-[#a1adbc33] animate-pulse rounded-[4px]"></div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};
