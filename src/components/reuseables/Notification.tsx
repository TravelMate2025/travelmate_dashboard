import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import {
  useGetAllNotifications,
  useMarkAllNotificationsRead,
  useWebSocketService,
} from "@/hooks/api/notification";
import type {
  AppNotification,
  NotificationWsMessage,
} from "@/hooks/api/notification";

type NotificationItem = AppNotification;

export const NotificationModal = ({
  onClose,
  accessToken,
  onMarkAllRead,
}: {
  onClose: () => void;
  accessToken: string;
  onMarkAllRead?: () => void;
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const hasMounted = useRef(false);
  const previousPathnameRef = useRef<string | null>(pathname ?? null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const { notifications: apiData, loading, refetch } = useGetAllNotifications();

  const { markAllAsRead, loading: marking } = useMarkAllNotificationsRead();

  //  WebSocket live messages
  const { messages: wsMessages } = useWebSocketService(accessToken);

  // Local state for displaying only 3 notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const normalizeWsNotification = (
    notification: NotificationWsMessage
  ): NotificationItem | null => {
    if (typeof notification?.id === "undefined") {
      return null;
    }
    return {
      ...notification,
      created_at: notification.created_at ?? new Date().toISOString(),
      notification_details: {
        title: notification.notification_details?.title ?? "Notification",
        message: notification.notification_details?.message ?? "",
      },
    };
  };

  // Load initial 3 notifications from API
  useEffect(() => {
    if (apiData && apiData.length > 0) {
      setNotifications(apiData.slice(0, 3));
    }
  }, [apiData]);

  // When new notification arrives, prepend it and drop the last one
  useEffect(() => {
    if (wsMessages.length > 0) {
      const latest = wsMessages[wsMessages.length - 1];
      const normalizedLatest = normalizeWsNotification(latest);
      if (!normalizedLatest) {
        return;
      }

      setNotifications((prev) => {
        // Prevent duplicates
        if (prev.some((n) => n.id === normalizedLatest.id)) return prev;

        // Prepend new one and keep max of 3
        const updated = [normalizedLatest, ...prev];
        return updated.slice(0, 3);
      });
    }
  }, [wsMessages]);

  // close modal on route change (App Router-safe)
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      previousPathnameRef.current = pathname ?? null;
      return;
    }

    const currentPathname = pathname ?? null;
    const didPathChange = previousPathnameRef.current !== currentPathname;

    if (didPathChange) {
      previousPathnameRef.current = currentPathname;
      onCloseRef.current();
    }
  }, [pathname]);

  //  Check if there’s at least one unread
  const hasUnread = useMemo(
    () => notifications.some((n) => !n.is_read),
    [notifications]
  );

  //  Mark all as read
  const handleMarkAllRead = () => {
    if (hasUnread) {
      markAllAsRead(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        onMarkAllRead?.();
        refetch();
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 bg-opacity-25"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div
        className="absolute top-[120px] mx-4 md:mx-auto md:right-[5vw] bg-white md:w-[616px] max-h-[80vh] overflow-auto max-w-[616px] rounded-[12px] shadow-lg border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-[32px] py-[19px] border-b border-[#9B9EA4]">
          <h2 className="text-[28px] font-[600] text-[#181818]">
            Notifications
          </h2>
          <button
            className="text-gray-500 hover:text-gray-700 cursor-pointer"
            onClick={onClose}
          >
            &#x2715;
          </button>
        </div>

        {/* Mark All as Read (only if unread) */}
        {hasUnread && (
          <div className="text-end px-[32px] pt-[19px]">
            <h1
              className="cursor-pointer text-[18px] font-[600] text-[#023E8A]"
              onClick={handleMarkAllRead}
            >
              {marking ? "Marking..." : "Mark all as read"}
            </h1>
          </div>
        )}

        {/* Notifications List */}
        <div className="py-[19px] space-y-4">
          {loading ? (
            <Skeleton />
          ) : notifications.length === 0 ? (
            <p className="px-[32px] text-sm text-gray-500">
              No notifications found.
            </p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start justify-between w-full px-[32px] py-3 cursor-pointer ${
                  n.is_read ? "bg-white" : "bg-[#CCD8E833]"
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className="space-y-2 flex-1 w-full">
                    <p className="text-[18px] font-[500] text-[#181818]">
                      {n.notification_details?.title ?? "Notification"}
                    </p>
                    <p className="text-[16px] text-[#4E4F52] font-[400]">
                      {n.notification_details?.message ?? ""}
                    </p>
                    <div className="flex items-center space-x-[4px]">
                      <p className="text-[13px] font-[500] leading-[100%] text-[#181818]">
                        {format(new Date(n.created_at ?? new Date().toISOString()), "d/M/yyyy")}
                      </p>
                      <span className="w-[6px] h-[6px] rounded-full bg-[#9B9EA4]" />
                      <p className="text-[13px] font-[500] leading-[100%] text-[#181818]">
                        {formatDistanceToNow(new Date(n.created_at ?? new Date().toISOString()), {
                          addSuffix: true,
                        })
                          .replace("about ", "")
                          .replace(/^./, (str) => str.toUpperCase())}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-[32px] py-[19px] border-t border-[#9B9EA4] text-center">
          <button
            className="text-[20px] text-[#023E8A] font-[600] cursor-pointer"
            onClick={() => router.push("/Dashboard/notification")}
          >
            See All Notifications
          </button>
        </div>
      </div>
    </div>
  );
};

const Skeleton = () => (
  <>
    {Array.from({ length: 2 }).map((_, index) => (
      <div
        key={index}
        className="flex items-start justify-between w-full px-[20px] py-3 cursor-pointer"
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
