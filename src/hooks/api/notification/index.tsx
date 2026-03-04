"use client";

import NotificationService from "@/services/notification";
import env from "@/config/env";
import { useState, useEffect, useCallback, useRef } from "react";
import instance from "@/hooks/initializers/useAxiosDefaults";
import { showSuccessToast, showErrorToast } from "@/utils/toasters";

const toWsBase = (apiUrl: string) => {
  const normalized = apiUrl.replace(/\/+$/, "");
  const parsedUrl = new URL(normalized);
  const protocol = parsedUrl.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${parsedUrl.host}`;
};

const getJwtExp = (token: string): number | null => {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((char) => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join("")
    );

    const parsed = JSON.parse(jsonPayload) as { exp?: number };
    return typeof parsed.exp === "number" ? parsed.exp : null;
  } catch {
    return null;
  }
};

const isJwtExpired = (token: string) => {
  const exp = getJwtExp(token);
  if (!exp) return false;
  return exp * 1000 <= Date.now();
};

type NotificationStatus = "read" | "unread" | "all";

interface FetchParams {
  page?: number;
  status?: NotificationStatus;
  startDate?: string;
  endDate?: string;
}

export type AppNotification = {
  id: string | number;
  is_read?: boolean;
  created_at?: string;
  notification_details?: {
    title?: string;
    message?: string;
  };
  [key: string]: unknown;
};

export type NotificationWsMessage = AppNotification;

export const useGetAllNotifications = () => {
  const BASE_URL = env.api.notification;

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [previousPageUrl, setPreviousPageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // filters
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isRead, setIsRead] = useState<boolean | null>(null); //  read/unread filter
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  const hasFetchedInitial = useRef(false);

  // build query url with filters
  const buildUrl = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.append("search", searchTerm);
    if (isRead !== null) params.append("is_read", String(isRead));
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);

    return `${BASE_URL}${params.toString() ? `?${params.toString()}` : ""}`;
  };

  // fetch data
  const fetchNotifications = async (url?: string, reset = false) => {
    try {
      setLoading(true);
      setError(null);

      const endpoint = url || buildUrl();
      const response = await instance.get(endpoint);
      const data = response.data;

      setNotifications((prev) =>
        reset ? data.results : [...prev, ...data.results]
      );
      setNextPageUrl(data.next);
      setPreviousPageUrl(data.previous);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setLoading(false);
    }
  };

  // initial fetch
  useEffect(() => {
    if (!hasFetchedInitial.current) {
      fetchNotifications(undefined, true);
      hasFetchedInitial.current = true;
    }
  }, []);

  // refetch when filters change
  useEffect(() => {
    fetchNotifications(undefined, true);
  }, [searchTerm, isRead, startDate, endDate]);

  const loadNext = () => {
    if (nextPageUrl) fetchNotifications(nextPageUrl, false);
  };

  const loadPrevious = () => {
    if (previousPageUrl) fetchNotifications(previousPageUrl, false);
  };

  const refetch = () => {
    fetchNotifications(undefined, true);
  };

  return {
    notifications,
    loading,
    error,
    nextPageUrl,
    previousPageUrl,
    loadNext,
    loadPrevious,
    setSearchTerm,
    setIsRead, //  filter read/unread
    setStartDate,
    setEndDate,
    refetch,
  };
};

export const useMarkAsRead = () => {
  const [loading, setLoading] = useState(false);

  const markAsRead = async (
    ids: string | string[],
    successCallback?: () => void
  ) => {
    setLoading(true);
    try {
      const res = await NotificationService.markNotificationAsRead(ids);

      if (res.status === 200) {
        const { message = " Notification marked as read", description = "" } =
          res.data || {};

        showSuccessToast({ message, description });
        if (successCallback) successCallback();
      }
    } catch (error: unknown) {
      showErrorToast({
        message: "Unable to mark as read at the moment!",
      });
    } finally {
      setLoading(false);
    }
  };

  return { markAsRead, loading };
};

export const useDeleteNotification = () => {
  const [loading, setLoading] = useState(false);

  const deleteNotification = async (
    ids: string | string[],
    successCallback?: () => void
  ) => {
    setLoading(true);
    try {
      const res = await NotificationService.deleteNotification(ids);

      if (res.status === 200) {
        const {
          message = " Notification deleted successfully",
          description = "",
        } = res.data || {};

        showSuccessToast({ message, description });
        if (successCallback) successCallback();
      }
    } catch (error: unknown) {
      showErrorToast({
        message: "Unable to delete notification at the moment!",
      });
    } finally {
      setLoading(false);
    }
  };

  return { deleteNotification, loading };
};

export const useMarkAllNotificationsRead = () => {
  const [loading, setLoading] = useState(false);

  const markAllAsRead = async (successCallback?: () => void) => {
    setLoading(true);
    try {
      const res = await NotificationService.markAllRead();

      if (res.status === 200) {
        const { message = " All notifications marked as read", description = "" } =
          res.data || {};

        showSuccessToast({ message, description });
        successCallback?.();
      }
    } catch (error: unknown) {
      showErrorToast({
        message: "Unable to mark all notifications as read at the moment!",
      });
    } finally {
      setLoading(false);
    }
  };

  return { markAllAsRead, loading };
};

export const useWebSocketService = (accessToken: string | null) => {
  const [messages, setMessages] = useState<NotificationWsMessage[]>([]);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const shouldReconnectRef = useRef(true);

  const MAX_RECONNECT_ATTEMPTS = 5;

  const clearReconnectTimer = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    if (!accessToken) {
      setSocket(null);
      return;
    }

    if (isJwtExpired(accessToken)) {
      console.warn("⚠️ Notification WebSocket skipped: access token expired");
      setSocket(null);
      return;
    }

    shouldReconnectRef.current = true;
    reconnectAttemptsRef.current = 0;

    const wsBase = toWsBase(env.api.notification);
    const encodedToken = encodeURIComponent(accessToken);
    const url = `${wsBase}/ws/notifications/?token=${encodedToken}&authorization=${encodedToken}`;

    const connect = () => {
      if (!shouldReconnectRef.current) {
        return;
      }

      const ws = new WebSocket(url);
      setSocket(ws);

      ws.onopen = () => {
        reconnectAttemptsRef.current = 0;
        console.log(" WebSocket connected");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setMessages((prev) => {
            if (!prev.some((msg) => msg.id === data.id)) {
              return [...prev, data];
            }
            return prev;
          });
        } catch (err) {
          console.error("Invalid WS message:", err);
        }
      };

      ws.onerror = () => {
        console.warn("⚠️ Notification WebSocket connection error");
      };

      ws.onclose = (event) => {
        if (!shouldReconnectRef.current) {
          return;
        }

        if (!navigator.onLine) {
          console.warn("⚠️ Notification WebSocket paused: offline");
          return;
        }

        if (isJwtExpired(accessToken)) {
          console.warn("⚠️ Notification WebSocket stopped: token expired");
          return;
        }

        const isAuthOrPolicyClose = event.code === 1008 || event.code === 4001;
        if (isAuthOrPolicyClose) {
          console.warn("⚠️ Notification WebSocket closed by server policy/auth");
          return;
        }

        if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          console.warn("⚠️ Notification WebSocket reconnect limit reached");
          return;
        }

        reconnectAttemptsRef.current += 1;
        const delay = Math.min(1000 * 2 ** reconnectAttemptsRef.current, 10000);

        console.warn(
          `⚠️ WebSocket closed (code: ${event.code}). Reconnecting in ${delay}ms...`
        );

        clearReconnectTimer();
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      };
    };

    connect();

    return () => {
      shouldReconnectRef.current = false;
      clearReconnectTimer();
      setSocket((currentSocket) => {
        currentSocket?.close();
        return null;
      });
    };
  }, [accessToken]);

  const send = (message: Record<string, unknown>) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    } else {
      console.error("WebSocket is not connected.");
    }
  };

  return { messages, send, socket };
};

