// reportsService.ts
import env from "@/config/env";
import instance from "@/hooks/initializers/useAxiosDefaults";

export const exportStats = () => 
  instance.get(env.api.reportExport, {
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
  const [bookingBreakdownRes, bookingsCombinedRes, summaryRes] =
    await Promise.all([
      instance.get(breakdown),
      instance.get(combined),
      instance.get(summary),
    ]);

  return {
    bookingBreakdown: bookingBreakdownRes.data.results || [],
    bookingsCombined: bookingsCombinedRes.data.results || [],
    summary: summaryRes.data,
  };
};
