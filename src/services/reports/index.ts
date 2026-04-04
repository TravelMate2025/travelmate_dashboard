// reportsService.ts
import env from "@/config/env";
import instance from "@/hooks/initializers/useAxiosDefaults";

type BreakdownRow = {
  label: string;
  flight_bookings: number;
  car_bookings: number;
  stay_bookings?: number;
  flight_revenue?: number;
  car_revenue?: number;
  stay_revenue?: number;
};

type CombinedRow = {
  label: string;
  bookings: number;
  revenue?: number;
};

type SummaryRow = {
  total_users: number;
  user_growth_percentage: number;
  total_bookings: number;
  booking_growth_percentage: number;
  total_revenue?: number;
  revenue_growth_percentage?: number;
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
      rows.push(...normalizeResults(response.data?.results));
      nextUrl = typeof response.data?.next === "string" ? response.data.next : null;
    }

    return rows as T[];
  };

  const [bookingBreakdown, bookingsCombined, summaryRes] = await Promise.all([
    fetchAllPages<BreakdownRow>(breakdown),
    fetchAllPages<CombinedRow>(combined),
    instance.get(summary),
  ]);

  return {
    bookingBreakdown,
    bookingsCombined,
    summary: summaryRes.data as SummaryRow,
  };
};
