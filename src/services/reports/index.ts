// reportsService.ts
import env from "@/config/env";
import instance from "@/hooks/initializers/useAxiosDefaults";

type BreakdownRow = {
  label: string;
  flight_bookings: number;
  stay_bookings?: number;
  transfer_bookings?: number;
  flight_revenue?: number;
  stay_revenue?: number;
  transfer_revenue?: number;
};

type CombinedRow = {
  label: string;
  bookings: number;
  revenue: number;
};

type SummaryRow = {
  total_users: number;
  user_growth_percentage: number;
  total_bookings: number;
  booking_growth_percentage: number;
  total_revenue: number;
  revenue_growth_percentage: number;
};

export type ReportsResponse = {
  bookingBreakdown: BreakdownRow[];
  bookingsCombined: CombinedRow[];
  summary: SummaryRow;
};

export const exportStats = (queryString = "") =>
  instance.get(`${env.api.reportExport}${queryString}`, {
    responseType: "blob",
  });

export const fetchReports = async ({
  breakdown,
  combined,
  summary,
}: {
  breakdown: string;
  combined: string;
  summary: string;
}) => {
  const normalizeResults = (value: unknown) => {
    if (!Array.isArray(value)) {
      return [];
    }

    if (value.length === 1 && Array.isArray(value[0])) {
      return value[0] as unknown[];
    }

    return value;
  };

  const fetchAllPages = async <T,>(initialUrl: string) => {
    const rows: unknown[] = [];
    const visited = new Set<string>();
    let nextUrl: string | null = initialUrl;

    while (nextUrl && !visited.has(nextUrl)) {
      visited.add(nextUrl);
      const response = await instance.get(nextUrl);
      const data = response.data as {
        results?: unknown;
        next?: unknown;
      };
      rows.push(...normalizeResults(data.results));
      nextUrl = typeof data.next === "string" ? data.next : null;
    }

    return rows as T[];
  };

  const [bookingBreakdown, bookingsCombined, summaryRes] = await Promise.all([
    fetchAllPages<BreakdownRow>(breakdown),
    fetchAllPages<CombinedRow>(combined),
    instance.get(summary),
  ]);

  const summaryData = summaryRes.data as Partial<SummaryRow>;

  return {
    bookingBreakdown,
    bookingsCombined: bookingsCombined.map((row) => ({
      ...row,
      revenue: row.revenue ?? 0,
    })),
    summary: {
      total_users: summaryData.total_users ?? 0,
      user_growth_percentage: summaryData.user_growth_percentage ?? 0,
      total_bookings: summaryData.total_bookings ?? 0,
      booking_growth_percentage: summaryData.booking_growth_percentage ?? 0,
      total_revenue: summaryData.total_revenue ?? 0,
      revenue_growth_percentage: summaryData.revenue_growth_percentage ?? 0,
    },
  };
};
