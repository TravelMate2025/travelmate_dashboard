import { useState, useEffect, useRef, useCallback } from "react";
import { showErrorToast, showSuccessToast } from "@/utils/toasters";
import TicketService from "@/services/ticket";
import ChatService from "@/services/chat";
import axios from "axios";
import env from "@/config/env";
import instance from "@/hooks/initializers/useAxiosDefaults";

export interface User {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

export interface Ticket {
  id: number;
  title: string;
  ticket_id: string;
  category: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  user: User;
  messages: unknown[];
  escalated: boolean;
  escalation_role?: {
    id: number;
    name: string;
    description: string;
  } | null;
  escalation_reason?: string | null;
  escalation_response_time?: string | null;
  escalation_note?: string | null;
  escalated_by?: User | null;
  escalated_at?: string | null;
  claimed_admin?: User | null;
  claim_timestamp?: string | null;
  escalation_note_text?: string | null;
  claim_note_text?: string | null;
  escalation_history?: string | null;
  claim_history?: string | null;
}

interface Level {
  id: number;
  name: string;
  email: string;
}

type TicketFilters = Record<string, string | number | boolean | null | undefined>;

export type TicketListFilters = {
  status?: string;
  date?: string;
  search?: string;
  role?: number;
  escalation_role?: number;
  limit?: number;
  offset?: number;
};

type TicketStatsFilters = {
  days?: number;
  weeks?: number;
  months?: number;
  years?: number;
};

export type TicketStatsResponse = {
  unresolved_escalated?: {
    count?: number;
    tickets?: unknown[];
  };
  resolved_tickets?: {
    count?: number;
    tickets?: unknown[];
  };
  categories?: Array<{
    category?: string;
    total?: number;
    pending?: number;
    resolved?: number;
    escalated?: number;
  }>;
  escalation_roles?: Array<{
    escalation_role?: string;
    total?: number;
    pending?: number;
    resolved?: number;
  }>;
  pending_tickets?: {
    count?: number;
    tickets?: unknown[];
  };
  average_response_time?: {
    seconds?: number;
    human_readable?: string;
  };
};

export const useGetAllTickets = () => {
  const BASE_URL = env.api.ticket;

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<TicketListFilters>({});
  const hasFetchedInitial = useRef(false);
  const isFetching = useRef(false); // Prevent redundant fetches

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        !(typeof value === "string" && value.trim() === "")
      ) {
        params.append(key, String(value));
      }
    });

    return `${BASE_URL}${params.toString() ? `?${params.toString()}` : ""}`;
  }, [filters]);

  // Fetch tickets function (memoized)
  const fetchTickets = useCallback(
    async (url?: string) => {
      if (isFetching.current) return; // Prevent redundant fetching
      isFetching.current = true;

      try {
        setLoading(true);
        setError(null);

        const endpoint = url || buildUrl();
        const response = await instance.get(endpoint);
        const data: { results: Ticket[]; next: string | null } = response.data;

        setTickets((prevTickets) =>
          url ? [...prevTickets, ...data.results] : data.results
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
  const setFilters = (newFilters: TicketListFilters) => {
    setFiltersState((prevFilters) => {
      const prevString = JSON.stringify(prevFilters);
      const newString = JSON.stringify(newFilters);
      return prevString === newString ? prevFilters : newFilters;
    });
  };

  // Initial fetch on mount
  useEffect(() => {
    if (!hasFetchedInitial.current) {
      fetchTickets();
      hasFetchedInitial.current = true;
    }
  }, [fetchTickets]);

  // Fetch tickets when filters change
  useEffect(() => {
    if (hasFetchedInitial.current) {
      fetchTickets();
    }
  }, [filters, fetchTickets]);

  // Load next page
  const loadNext = useCallback(() => {
    if (nextPageUrl) fetchTickets(nextPageUrl);
  }, [nextPageUrl, fetchTickets]);

  return {
    tickets,
    loadNext,
    loading,
    error,
    nextPageUrl,
    setFilters,
  };
};

export function useGetTicket({
  TicketId,
  initalFetch = true,
  successCallback,
  errorCallback,
}: {
  TicketId?: string;
  initalFetch?: boolean;
  successCallback?: (message: string) => void;
  errorCallback?: (props: { message?: string; description?: string }) => void;
}) {
  const [loadingTicket, setLoading] = useState(false);
  const [ticket, setData] = useState<Ticket | null>(null);

  const fetchTicket = async () => {
    if (!TicketId) return;
    setLoading(true);
    try {
      const res = await TicketService.getTicket({ TicketId });
      setData(res.data);
      if (successCallback) successCallback("Ticket fetched successfully.");
    } catch (error: unknown) {
      if (errorCallback)
        errorCallback({
          message: "An error occurred while fetching the ticket",
          description: error instanceof Error ? error.message : "Unknown error",
        });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initalFetch) fetchTicket();
  }, [initalFetch, TicketId]);

  return { loadingTicket, ticket };
}

export function useGetAllEscalationLevel({
  initalFetch = true,
  refresh = false,
}: {
  initalFetch?: boolean;
  refresh?: boolean;
}) {
  const [Levelloading, setLoading] = useState(false);
  const [Leveldata, setData] = useState<unknown | null>(null);

  const onEscalationLevel = async () => {
    setLoading(true);
    try {
      const res = await TicketService.getEscalationLevel();
      setData(res.data);
    } catch (error) {
      console.error("Error fetching escalation levels:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initalFetch || refresh) onEscalationLevel();
  }, [initalFetch, refresh]);

  return { Levelloading, Leveldata };
}

export function useGetAllEscalationReasons({
  initalFetch = true,
  refresh = false,
}: {
  initalFetch?: boolean;
  refresh?: boolean;
}) {
  const [Reasonsloading, setLoading] = useState(false);
  const [Reasonsdata, setData] = useState<unknown | null>(null);

  const onEscalationReason = async () => {
    setLoading(true);
    try {
      const res = await TicketService.getEscalationReasons();
      setData(res.data);
    } catch (error) {
      console.error("Error fetching escalation levels:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initalFetch || refresh) onEscalationReason();
  }, [initalFetch, refresh]);

  return { Reasonsloading, Reasonsdata };
}

type TEscalate = {
  escalation_role: number;
  escalation_reason: string;
  escalation_note: string;
  escalation_response_time: string;
};

export const useEscalateTicket = () => {
  const [escalating, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const onEscalateTicket = async ({
    TicketId,
    payload,
    successCallback,
  }: {
    TicketId: string;
    payload: TEscalate;
    successCallback?: () => void;
  }) => {
    setLoading(true);
    setIsSuccess(false);
    try {
      const res = await TicketService.escalateTicket({ TicketId, payload });
      const message = res.data.detail;

      showSuccessToast({ message });

      try {
        successCallback?.();
      } catch (callbackError) {
        console.error("Error in successCallback:", callbackError);
      }

      setIsSuccess(true);
    } catch (error: unknown) {
      const errorMessage =
        axios.isAxiosError(error)
          ? error.response?.data?.message ||
            "Unable to escalate ticket at the moment!"
          :
        "Unable to escalate ticket at the moment!";
      showErrorToast({ message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return { escalating, onEscalateTicket, isSuccess };
};

export type TEscalationPayload = {
  name: string;
  description: string;
  email: string;
};

export const useCreateEscalationLevel = () => {
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const onEsccalationLevel = async ({
    TicketId,
    payload,
    successCallback,
  }: {
    TicketId: string;
    payload: TEscalationPayload;
    successCallback?: () => void;
  }) => {
    setLoading(true);
    setIsSuccess(false);
    try {
      const res = await TicketService.createEscalationLevel({ payload });
      const message = res.data.detail || "Escalation level added successfully.";

      showSuccessToast({ message });

      successCallback?.();
      setIsSuccess(true);
    } catch (error: unknown) {
      const errorMessage =
        axios.isAxiosError(error)
          ? error.response?.data?.message ||
            "Unable to add escalation level at the moment.!"
          :
        "Unable to add escalation level at the moment.!";
      showErrorToast({ message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return { loading, onEsccalationLevel, isSuccess };
};

export function useGetAllTicketStats({
  initialFetch = true,
  defaultFilters = { days: 7 },
  successCallback,
  errorCallback,
}: {
  initialFetch?: boolean;
  defaultFilters?: TicketStatsFilters;
  successCallback?: (message: string) => void;
  errorCallback?: (props: { message?: string; description?: string }) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TicketStatsResponse | null>(null);
  const [filters, setFilters] = useState<TicketStatsFilters>(defaultFilters);

  const fetchTicketsStats = async () => {
    setLoading(true);
    try {
      const response = await TicketService.getTicketsStats(filters);
      setData(response.data);
      successCallback?.("Tickets fetched successfully.");
    } catch (error: unknown) {
      const status = axios.isAxiosError(error)
        ? error.response?.status
        : undefined;
      const errorDescription = axios.isAxiosError(error)
        ? error.response?.data?.detail || error.response?.data?.message || error.message
        : error instanceof Error
          ? error.message
          : "Unknown error";

      setData((prev) =>
        prev ?? {
          pending_tickets: { count: 0, tickets: [] },
          resolved_tickets: { count: 0, tickets: [] },
          unresolved_escalated: { count: 0, tickets: [] },
          average_response_time: { seconds: 0, human_readable: "0s" },
        }
      );

      if (status === 502) {
        showErrorToast({
          message: "Ticket stats are temporarily unavailable",
          description: "Please try again shortly.",
        });
      }

      errorCallback?.({
        message:
          status === 502
            ? "Ticket stats are temporarily unavailable"
            : "An error occurred while fetching tickets",
        description: errorDescription,
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFilters = (newFilters: TicketStatsFilters) => {
    setFilters((prevFilters) => {
      const nextFilters = { ...prevFilters, ...newFilters };
      const prevString = JSON.stringify(prevFilters);
      const nextString = JSON.stringify(nextFilters);

      if (prevString === nextString) {
        return prevFilters;
      }

      return nextFilters;
    });
  };

  const updateDays = (newDays: number) => {
    updateFilters({ days: newDays, weeks: undefined, months: undefined, years: undefined });
  };

  useEffect(() => {
    if (initialFetch) fetchTicketsStats();
  }, [initialFetch, filters]);

  return {
    loading,
    data,
    updateDays,
    updateFilters,
    fetchTicketsStats,
  };
}

type TicketMessage = {
  id?: number | string;
  ticket?: number | string;
  sender_id?: number | string;
  sender_name?: string;
  content?: string;
  attachment?: string | null;
  attachment_url?: string | null;
  created_at?: string;
  is_staff?: boolean;
};

export function useGetTicketMessages({
  ticketPk,
  admin = true,
  initialFetch = true,
}: {
  ticketPk?: string | number;
  admin?: boolean;
  initialFetch?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{
    count?: number;
    next?: string | null;
    previous?: string | null;
    results?: TicketMessage[];
  } | null>(null);

  const flattenMessages = (results?: unknown[]) => {
    if (!Array.isArray(results)) {
      return [] as TicketMessage[];
    }

    return results.flatMap((entry) => {
      if (Array.isArray(entry)) {
        return entry.filter((item): item is TicketMessage => Boolean(item));
      }

      return entry ? [entry as TicketMessage] : [];
    });
  };

  const fetchMessages = async () => {
    if (!ticketPk) return;

    setLoading(true);
    try {
      const response = await TicketService.getTicketMessages({
        ticketPk,
        admin,
      });

      const payload = response.data;
      const rawResults = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.results)
          ? payload.results
          : [];

      setData({
        ...(Array.isArray(payload) ? { count: payload.length } : payload),
        results: flattenMessages(rawResults),
      });
    } catch (error: unknown) {
      showErrorToast({
        message: "An error occurred while fetching ticket messages",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialFetch) fetchMessages();
  }, [initialFetch, ticketPk, admin]);

  return { loading, data, fetchMessages };
}

export function useCreateTicketMessage() {
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const onCreateTicketMessage = async ({
    ticketPk,
    payload,
    admin = true,
    successCallback,
  }: {
    ticketPk: string | number;
    payload: { content: string; attachment?: File | null };
    admin?: boolean;
    successCallback?: () => void;
  }) => {
    setLoading(true);
    setIsSuccess(false);
    try {
      let attachmentUrl: string | null | undefined = null;

      if (payload.attachment) {
        const uploadResponse = await ChatService.uploadAttachment(
          payload.attachment
        );
        attachmentUrl =
          uploadResponse.data?.url ||
          uploadResponse.data?.file ||
          uploadResponse.data?.attachment ||
          uploadResponse.data?.path ||
          uploadResponse.data ||
          null;
      }

      const response = await TicketService.createTicketMessage({
        ticketPk,
        payload: {
          content: payload.content,
          attachment: attachmentUrl,
        },
        admin,
      });

      showSuccessToast({
        message: response.data?.detail || "Message added successfully.",
      });
      successCallback?.();
      setIsSuccess(true);
    } catch (error: unknown) {
      showErrorToast({
        message: "Unable to add ticket message at the moment.",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  return { loading, onCreateTicketMessage, isSuccess };
}

export function useClaimTicket() {
  const [claiming, setClaiming] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const onClaiming = async ({
    TicketId,
    successCallback,
    isShow = true,
  }: {
    TicketId: string;
    successCallback?: () => void;
    isShow?: boolean;
  }) => {
    setClaiming(true);
    setIsSuccess(false);

    try {
      const res = await TicketService.claimTicket({ TicketId });
      const message = res.data?.detail || "Ticket claimed successfully";
      showSuccessToast({ message });

      if (isShow) {
        showSuccessToast({ message });
      }
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

export const useResolveTicket = () => {
  const [resolving, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const onResolveTicket = async ({
    TicketId,
    payload,
    successCallback,
  }: {
    TicketId: string;
    payload?: {
      title?: string;
      category?: string;
      description?: string;
      status?: string;
      escalation_reason?: string;
      escalation_response_time?: string;
      escalation_note?: string;
    };
    successCallback?: () => void;
  }) => {
    setLoading(true);
    setIsSuccess(false);
    try {
      const res = await TicketService.resolveTicketWithPayload(TicketId, payload);
      const message = res.data.detail || "Ticket response sent sucessfully";

      showSuccessToast({ message });

      try {
        successCallback?.();
      } catch (callbackError) {
        console.error("Error in successCallback:", callbackError);
      }

      setIsSuccess(true);
    } catch (error: unknown) {
      const errorMessage =
        axios.isAxiosError(error)
          ? error.response?.data?.message ||
            "Unable to resolve ticket at the moment!"
          :
        "Unable to resolve ticket at the moment!";
      showErrorToast({ message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return { resolving, onResolveTicket, isSuccess };
};

export const useDeleteTicket = () => {
  const [deleting, setDeleting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const onDeleteTicket = async ({
    TicketId,
    successCallback,
  }: {
    TicketId: string;
    successCallback?: () => void;
  }) => {
    setDeleting(true);
    setIsSuccess(false);
    try {
      await TicketService.deleteTicket({ TicketId });
      const message = "Ticket deleted successfully";

      showSuccessToast({ message });

      try {
        successCallback?.();
      } catch (callbackError) {
        console.error("Error in successCallback:", callbackError);
      }

      setIsSuccess(true);
    } catch (error: unknown) {
      const errorMessage =
        axios.isAxiosError(error)
          ? error.response?.data?.message ||
            "Unable to delete ticket at the moment!"
          :
        "Unable to delete ticket at the moment!";
      showErrorToast({ message: errorMessage });
    } finally {
      setDeleting(false);
    }
  };

  return { deleting, onDeleteTicket, isSuccess };
};

export const useGetAllEscalatedTickets = () => {
  const BASE_URL = `${env.api.ticket}escalated/`;

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null); // Pagination disabled
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<TicketFilters>({});
  const hasFetchedInitial = useRef(false);
  const isFetching = useRef(false); // Prevent redundant fetches

  // Build URL with filters
  const buildUrl = useCallback(() => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        !(typeof value === "string" && value.trim() === "")
      ) {
        params.set(key, String(value));
      }
    });

    return `${BASE_URL}${params.toString() ? `?${params.toString()}` : ""}`;
  }, [filters]);

  // Fetch tickets function (memoized)
  const fetchTickets = useCallback(
    async (url?: string) => {
      if (isFetching.current) return; // Prevent redundant fetching
      isFetching.current = true;

      try {
        setLoading(true);
        setError(null);

        const endpoint = url || buildUrl();
        const response = await instance.get(endpoint);

        const data: Ticket[] = response.data.results; // Adjusted to match direct array structure

        setTickets(data);
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
  const setFilters = (newFilters: TicketFilters) => {
    setFiltersState((prevFilters) => {
      const prevString = JSON.stringify(prevFilters);
      const newString = JSON.stringify(newFilters);
      return prevString === newString ? prevFilters : newFilters;
    });
  };

  // Initial fetch on mount
  useEffect(() => {
    if (!hasFetchedInitial.current) {
      fetchTickets();
      hasFetchedInitial.current = true;
    }
  }, [fetchTickets]);

  // Fetch tickets when filters change
  useEffect(() => {
    if (hasFetchedInitial.current) {
      fetchTickets();
    }
  }, [filters, fetchTickets]);

  // Load next page (Disabled)
  const loadNext = useCallback(() => {
    if (nextPageUrl) fetchTickets(nextPageUrl);
  }, [nextPageUrl, fetchTickets]);

  return {
    tickets,
    loadNext, // Pagination disabled
    loading,
    error,
    nextPageUrl, // Pagination disabled
    setFilters,
  };
};
