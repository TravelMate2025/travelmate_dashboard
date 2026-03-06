import { useState, useEffect, useRef, useCallback } from "react";
import { showErrorToast, showSuccessToast } from "@/utils/toasters";
import ChatService from "@/services/chat";
import env from "@/config/env";
import axios from "axios";
import instance from "@/hooks/initializers/useAxiosDefaults";

const toWsBase = (apiUrl: string) => {
  const normalized = apiUrl.replace(/\/+$/, "");
  const parsedUrl = new URL(normalized);
  const protocol = parsedUrl.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${parsedUrl.host}`;
};

const getFromLocalStorage = ({
  key,
  cb = () => null,
}: {
  key: string;
  cb?: (value: unknown) => void;
}): void => {
  try {
    const value = localStorage?.getItem(key);
    if (value) {
      const parsedValue = JSON.parse(value);
      if (typeof cb === "function") cb(parsedValue);
    }
  } catch (e) {
    console.error("Error accessing localStorage:", e);
  }
};

type Chat = {
  id: string;
  status: string;
  [key: string]: unknown;
};

type ChatMessage = {
  id?: string | number;
  [key: string]: unknown;
};

type ChatFilters = Record<string, string | number | boolean | null | undefined>;

export function useGetAllChat() {
  const BASE_URL = env.api.chat;

  const [chats, setChats] = useState<Chat[]>([]);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<ChatFilters>({});
  const hasFetchedInitial = useRef(false);
  const isFetching = useRef(false); // Prevent redundant fetches

  // Build URL with filters
  const buildUrl = useCallback(() => {
    const params = new URLSearchParams();

    // Convert filters into query parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });

    return `${BASE_URL}${params.toString() ? `?${params.toString()}` : ""}`;
  }, [filters]);

  // Fetch chats function (memoized)
  const fetchChats = useCallback(
    async (url?: string) => {
      if (isFetching.current) return; // Prevent redundant fetching
      isFetching.current = true;

      try {
        setLoading(true);
        setError(null);

        const endpoint = url || buildUrl();
        const response = await instance.get(endpoint);
        const data: { results: Chat[]; next: string | null } = response.data;

        setChats((prevChats) =>
          url ? [...prevChats, ...data.results] : data.results
        );
        setNextPageUrl(data.next);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred."
        );
      } finally {
        setLoading(false);
        isFetching.current = false;
      }
    },
    [buildUrl]
  );

  // Set filters with deep comparison to prevent redundant updates
  const setFilters = (newFilters: ChatFilters) => {
    setFiltersState((prevFilters) => {
      const prevString = JSON.stringify(prevFilters);
      const newString = JSON.stringify(newFilters);
      return prevString === newString ? prevFilters : newFilters;
    });
  };

  // Initial fetch on mount
  useEffect(() => {
    if (!hasFetchedInitial.current) {
      fetchChats();
      hasFetchedInitial.current = true;
    }
  }, [fetchChats]);

  // Fetch chats when filters change
  useEffect(() => {
    if (hasFetchedInitial.current) {
      fetchChats();
    }
  }, [filters, fetchChats]);

  // Load next page
  const loadNext = useCallback(() => {
    if (nextPageUrl) fetchChats(nextPageUrl);
  }, [nextPageUrl, fetchChats]);

  return {
    chats,
    loadNext,
    loading,
    error,
    nextPageUrl,
    setFilters,
  };
}

export function useGetChat({
  ChatId,
  initialFetch = true,
  successCallback,
  errorCallback,
}: {
  ChatId?: string;
  initialFetch?: boolean;
  successCallback?: (message: string) => void;
  errorCallback?: (props: { message?: string; description?: string }) => void;
}) {
  const [loadingChat, setLoading] = useState(false);
  const [chat, setChat] = useState<Chat | null>(null);

  const fetchChat = async () => {
    if (!ChatId) return;

    setLoading(true);
    try {
      const res = await ChatService.getChat({ id: ChatId });
      setChat(res.data);
      if (successCallback) successCallback("Chat fetched successfully.");
    } catch (error: unknown) {
      if (errorCallback) {
        errorCallback({
          message: "An error occurred while fetching the chat.",
          description: error instanceof Error ? error.message : "Unknown error.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialFetch) fetchChat();
  }, [initialFetch, ChatId]);

  return { loadingChat, chat };
}

export const useGetChatMessages = () => {
  const [loadingMessage, setLoading] = useState(false);
  const [messages, setData] = useState<unknown>({});

  const onFetchMessages = async ({ id }: { id: number }) => {
    try {
      setLoading(true);
      const res = await ChatService.getChatMessages({ id });
      setData(res.data);
    } catch (error: unknown) {
      showErrorToast({
        message: "An error occurred while fetching messages",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  return { loadingMessage, messages, onFetchMessages };
};

export const useWebSocketService = ({
  sessionId,
  accessToken,
}: {
  sessionId?: string;
  accessToken?: string | null;
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // const [accessToken, setAccessToken] = useState<string | null>(null);
  const [socketUrl, setSocketUrl] = useState<string | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null); // WebSocket instance
  const [reconnectTick, setReconnectTick] = useState(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldReconnectRef = useRef(true);

  const clearReconnectTimer = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    if (accessToken && sessionId) {
      const wsBase = toWsBase(env.api.chat);
      const url = `${wsBase}/ws/chat/${sessionId}/?token=${accessToken}`;
      setSocketUrl(url);
    }

    return () => {
      shouldReconnectRef.current = false;
      clearReconnectTimer();
      if (socket) {
        socket.close();
      }
    };
  }, [accessToken, sessionId]);

  useEffect(() => {
    if (socketUrl) {
      shouldReconnectRef.current = true;
      const ws = new WebSocket(socketUrl);

      ws.onopen = () => {
        clearReconnectTimer();
      };

      ws.onerror = () => {
        // onclose handles retries and error paths.
      };

      ws.onclose = (event) => {
        if (!shouldReconnectRef.current) {
          return;
        }

        const isNormalClose = event.code === 1000 || event.wasClean;
        if (isNormalClose) {
          return;
        }

        clearReconnectTimer();
        reconnectTimeoutRef.current = setTimeout(() => {
          setReconnectTick((prev) => prev + 1);
        }, 3000);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setMessages((prev) => {
          if (!prev.some((msg) => msg.id === data.id)) {
            return [...prev, data];
          }
          return prev;
        });
      };

      setSocket(ws);

      return () => {
        // Close the WebSocket when the component unmounts or the session changes
        clearReconnectTimer();
        ws.close();
      };
    }
  }, [socketUrl, reconnectTick]);
  // console.log(messages);

  const send = (message: Record<string, unknown>) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  };

  return { messages, send, socket };
};

export function useClaimChat() {
  const [claiming, setClaiming] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const onClaiming = async ({
    ChatId,
    successCallback,
  }: {
    ChatId: string;
    successCallback?: () => void;
  }) => {
    setClaiming(true);
    setIsSuccess(false);

    try {
      const res = await ChatService.claimChat({ id: ChatId });
      const message = res.data?.detail || "Chat claimed successfully";
      showSuccessToast({ message });

      if (successCallback) {
        successCallback();
      }

      setIsSuccess(true);
    } catch (error: unknown) {
      const errorMessage =
        axios.isAxiosError(error)
          ? error.response?.data?.message ||
            "Unable to respond to claim at the moment!"
          :
        "Unable to respond to claim at the moment!";
      showErrorToast({ message: errorMessage });
    } finally {
      setClaiming(false);
    }
  };

  return { claiming, onClaiming, isSuccess };
}
