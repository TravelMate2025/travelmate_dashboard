import instance from "@/hooks/initializers/useAxiosDefaults";
import env from "@/config/env";
import { showErrorToast } from "@/utils/toasters";
import axios, { AxiosResponse } from "axios";

type DashboardSummary = {
  total_bookings: number;
};

type DashboardUsers = {
  total_normal_users: number;
};

type DashboardRevenue = {
  total_revenue: number;
  transfer_revenue: number;
  flight_revenue: number;
  currency: string;
};

type DashboardActivity = {
  user_full_name: string;
  profile_picture: string;
  booking_type: string;
  amount: number;
  date: string;
};

type DashboardMessage = {
  id: string;
  type: string;
  title: string;
  content: string;
  sender: {
    id: number;
    name: string;
    email: string;
  } | null;
  created_at: string;
  link: string;
};

type DashboardSetters = {
  setBookings: (data: DashboardSummary) => void;
  setActivity: (data: DashboardActivity[]) => void;
  setMessages: (data: DashboardMessage[]) => void;
  setLoading: (data: boolean) => void;
  setRevenue: (data: DashboardRevenue) => void;
  setUsers: (data: DashboardUsers) => void;
  setAllBookings: (data: unknown[]) => void;
};

type DashboardOptions = {
  isSuperadmin?: boolean;
};

const toNumber = (value: unknown): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value !== "string") {
    return 0;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed === "-") {
    return 0;
  }

  const normalized = trimmed.replace(/[^0-9.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toStringValue = (value: unknown): string => {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number") {
    return String(value);
  }
  return "";
};

const toMessageArray = (payload: unknown): DashboardMessage[] => {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.map((item) => {
    const source = item as Record<string, unknown>;
    const senderSource =
      source.sender && typeof source.sender === "object"
        ? (source.sender as Record<string, unknown>)
        : null;

    return {
      id: toStringValue(source.id),
      type: toStringValue(source.type),
      title: toStringValue(source.title),
      content: toStringValue(source.content),
      sender: senderSource
        ? {
            id: toNumber(senderSource.id),
            name: toStringValue(senderSource.name),
            email: toStringValue(senderSource.email),
          }
        : null,
      created_at: toStringValue(source.created_at),
      link: toStringValue(source.link),
    };
  });
};

const toActivityArray = (payload: unknown): DashboardActivity[] => {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.map((item) => {
    const source = item as Record<string, unknown>;
    return {
      user_full_name: toStringValue(source.user_full_name),
      profile_picture: toStringValue(source.profile_picture),
      booking_type: toStringValue(source.booking_type),
      amount: toNumber(source.amount),
      date: toStringValue(source.date),
    };
  });
};

const toBookingsArray = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const data = payload as {
    results?: unknown[] | { results?: unknown[] };
  };

  if (Array.isArray(data.results)) {
    return data.results;
  }

  if (
    data.results &&
    typeof data.results === "object" &&
    Array.isArray((data.results as { results?: unknown[] }).results)
  ) {
    return (data.results as { results?: unknown[] }).results ?? [];
  }

  return [];
};

export async function fetchDashboardData(
  setters: DashboardSetters,
  options: DashboardOptions
) {
  const {
    setBookings,
    setActivity,
    setMessages,
    setLoading,
    setRevenue,
    setUsers,
    setAllBookings,
  } = setters;

  const { isSuperadmin } = options;

  const settledData = <T,>(
    result: PromiseSettledResult<AxiosResponse<T>>,
    fallback: T,
  ): AxiosResponse<T> =>
    result.status === "fulfilled"
      ? result.value
      : ({ data: fallback } as AxiosResponse<T>);

  try {
    setLoading(true);

    const [
      activities,
      messages,
      overviewResponse,
      revenueResponse,
      statsResponse,
      userCountResponse,
      allBookings,
    ] = await Promise.allSettled([
        instance.get(env.api.dashboardactivities),
        instance.get(env.api.dashboardmessages),
        instance.get(env.api.dashboardoverview),
        instance.get(env.api.dashboardrevenue),
        instance.get(env.api.dashboardbookings),
        instance.get(env.api.usercount),
        instance.get(env.api.bookingAdminList, {
          params: { booking_type: "stays" },
        }),
      ]);

    const activitiesResponse = settledData(activities, { data: [] as unknown[] });
    const messagesResponse = settledData(messages, { data: [] as unknown[] });
    const overviewApiResponse = settledData(overviewResponse, { data: {} as Record<string, unknown> });
    const revenueApiResponse = settledData(revenueResponse, { data: {} as Record<string, unknown> });
    const statsApiResponse = settledData(statsResponse, { data: {} as Record<string, unknown> });
    const userCountApiResponse = settledData(userCountResponse, { data: {} as Record<string, unknown> });
    const allBookingsApiResponse = settledData(allBookings, {
      data: { results: [] as unknown[] },
    });

    const overviewData = overviewApiResponse?.data || {};
    const statsData = statsApiResponse?.data || (overviewData as { stats?: Record<string, unknown> })?.stats || {};
    const userCountData = userCountApiResponse?.data || {};
    const revenueData =
      revenueApiResponse?.data ||
      (overviewData as { revenue?: Record<string, unknown> })?.revenue ||
      {};
    const recentActivities =
      (activitiesResponse as { data?: unknown[] })?.data ??
      (overviewData as { recent_activities?: unknown[] })?.recent_activities ??
      [];
    const latestMessages =
      (messagesResponse as { data?: unknown[] })?.data ??
      (overviewData as { messages?: unknown[] })?.messages ??
      [];

    setActivity(toActivityArray(recentActivities));
    setMessages(toMessageArray(latestMessages));

    const summaryData = overviewData;

    setBookings({
      total_bookings:
        toNumber((statsData as { total_bookings?: unknown })?.total_bookings) ||
        toNumber((summaryData as { total_bookings?: unknown })?.total_bookings) ||
        toNumber((summaryData as { bookings?: unknown })?.bookings),
    });

    setUsers({
      total_normal_users:
        toNumber((userCountData as { total_normal_users?: unknown })?.total_normal_users) ||
        toNumber((summaryData as { total_users?: unknown })?.total_users) ||
        toNumber((summaryData as { users?: unknown })?.users),
    });

    if (isSuperadmin) {
      setRevenue({
        total_revenue: toNumber((revenueData as { total_revenue?: unknown })?.total_revenue),
        transfer_revenue: toNumber((revenueData as { transfer_revenue?: unknown })?.transfer_revenue),
        flight_revenue: toNumber((revenueData as { flight_revenue?: unknown })?.flight_revenue),
        currency: toStringValue((revenueData as { currency?: unknown })?.currency) || "NGN",
      });
    }

    const bookingsPayload = (allBookingsApiResponse as { data?: unknown })?.data;
    setAllBookings(toBookingsArray(bookingsPayload));
  } catch (error: unknown) {
    const message = axios.isAxiosError(error)
      ? error.response?.data?.message || error.message
      : error instanceof Error
        ? error.message
        : "An unexpected error occurred";
    showErrorToast({
      message,
    });
  } finally {
    setLoading(false);
  }
}
