import instance from "@/hooks/initializers/useAxiosDefaults";
import env from "@/config/env";
import { showErrorToast } from "@/utils/toasters";
import axios from "axios";

type DashboardSummary = {
  total_bookings: number;
};

type DashboardUsers = {
  total_normal_users: number;
};

type DashboardRevenue = {
  total_revenue: number;
  car_revenue: number;
  flight_revenue: number;
  currency: "NGN";
};

type DashboardSetters = {
  setBookings: (data: DashboardSummary) => void;
  setActivity: (data: unknown[]) => void;
  setMessages: (data: unknown[]) => void;
  setLoading: (data: boolean) => void;
  setRevenue: (data: DashboardRevenue) => void;
  setUsers: (data: DashboardUsers) => void;
  setAllBookings: (data: unknown[]) => void;
};

type DashboardOptions = {
  isSuperadmin?: boolean;
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

  const settledData = <T,>(result: PromiseSettledResult<T>, fallback: T): T =>
    result.status === "fulfilled" ? result.value : fallback;

  try {
    setLoading(true);

    const [
      activities,
      messages,
      overviewResponse,
      statsResponse,
      userCountResponse,
      allBookings,
    ] = await Promise.allSettled([
        instance.get(env.api.dashboardactivities),
        instance.get(env.api.dashboardmessages),
        instance.get(env.api.dashboardoverview),
        instance.get(env.api.dashboardbookings),
        instance.get(env.api.usercount),
        instance.get(env.api.bookingAdminList, {
          params: { booking_type: "stays" },
        }),
      ]);

    const activitiesResponse = settledData(activities, { data: [] as unknown[] });
    const messagesResponse = settledData(messages, { data: [] as unknown[] });
    const overviewApiResponse = settledData(overviewResponse, { data: {} as Record<string, unknown> });
    const statsApiResponse = settledData(statsResponse, { data: {} as Record<string, unknown> });
    const userCountApiResponse = settledData(userCountResponse, { data: {} as Record<string, unknown> });
    const allBookingsApiResponse = settledData(allBookings, {
      data: { results: [] as unknown[] },
    });

    const overviewData = overviewApiResponse?.data || {};
    const statsData = statsApiResponse?.data || (overviewData as { stats?: Record<string, unknown> })?.stats || {};
    const userCountData = userCountApiResponse?.data || {};

    setActivity(
      (activitiesResponse as { data?: unknown[] })?.data ??
        (overviewData as { recent_activities?: unknown[] })?.recent_activities ??
        []
    );
    setMessages(
      (messagesResponse as { data?: unknown[] })?.data ??
        (overviewData as { messages?: unknown[] })?.messages ??
        []
    );

    const summaryData = overviewData;

    setBookings({
      total_bookings:
        (statsData as { total_bookings?: number })?.total_bookings ??
        (summaryData as { total_bookings?: number })?.total_bookings ??
        (summaryData as { bookings?: number })?.bookings ??
        0,
    });

    setUsers({
      total_normal_users:
        (userCountData as { total_normal_users?: number })?.total_normal_users ??
        (summaryData as { total_users?: number })?.total_users ??
        (summaryData as { users?: number })?.users ??
        0,
    });

    if (isSuperadmin) {
      const revenueData =
        (summaryData as { revenue?: Record<string, number> })?.revenue ??
        (summaryData as Record<string, number>);

      setRevenue({
        total_revenue: revenueData?.total_revenue ?? 0,
        car_revenue: revenueData?.car_revenue ?? 0,
        flight_revenue: revenueData?.flight_revenue ?? 0,
        currency: "NGN",
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
