"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  ChevronDown,
  Download,
  Users,
  BookOpen,
  DollarSign,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import env from "@/config/env";
import { useAuthContext } from "@/context/AuthContext";
import { showErrorToast, showSuccessToast } from "@/utils/toasters";
import { exportStats, fetchReports } from "@/services/reports";

type Summary = {
  booking_growth_percentage: number;
  total_bookings: number;
  total_users: number;
  user_growth_percentage: number;
  total_revenue: number;
  revenue_growth_percentage: number;
};

type Breakdown = {
  label: string;
  flight_bookings: number;
  stay_bookings?: number;
  transfer_bookings?: number;
  flight_revenue?: number;
  stay_revenue?: number;
  transfer_revenue?: number;
};

type Combined = {
  label: string;
  bookings: number;
  revenue: number;
};

export default function ReportsPage() {
  const APP_STATE = useAuthContext();
  const isSuperadmin = APP_STATE?.user?.isSuperuser;
  const latestRequestIdRef = useRef(0);

  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingExport, setIsLoadingExport] = useState(false);
  const [overviewData, setOverviewData] = useState<Summary>();
  const [revenueBookingsData, setRevenueBookingsData] = useState<Combined[]>(
    []
  );
  const [bookingTrendsData, setBookingTrendsData] = useState<Breakdown[]>([]);
  const [selectedOption, setSelectedOption] = useState("This Week");

  const formatCurrency = useCallback((value: number) => {
    if (value >= 1_000_000) {
      return `₦${(value / 1_000_000).toFixed(1)}M`; // Changed to Naira symbol and proper formatting
    } else if (value >= 1_000) {
      return `₦${(value / 1_000).toFixed(1)}K`;
    }
    return `₦${value.toLocaleString()}`;
  }, []);

  const generateQueryParams = useCallback(() => {
    const breakdownBaseUrl = env.api.reportBookingsBreakdown;
    const combinedBaseUrl = env.api.reportBookingsCombined;
    const summaryBaseUrl = env.api.reportSummary;
    const toYMD = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    };
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const startOfWeek = new Date(today);
    const dayOfWeek = startOfWeek.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWeek.setDate(startOfWeek.getDate() - diffToMonday);
    const start = toYMD(startOfWeek);
    const monthStart = toYMD(startOfMonth);
    const yearStart = toYMD(startOfYear);
    const end = toYMD(today);

    const params = { breakdown: "", combined: "", summary: "" };

    switch (selectedOption) {
      case "This Week": {
        params.breakdown = `${breakdownBaseUrl}?start=${start}&end=${end}&group_by=day`;
        params.summary = `${summaryBaseUrl}?start=${start}&end=${end}`;
        params.combined = `${combinedBaseUrl}?start=${start}&end=${end}&group_by=day`;
        break;
      }
      case "This Month": {
        params.breakdown = `${breakdownBaseUrl}?start=${monthStart}&end=${end}&group_by=day`;
        params.summary = `${summaryBaseUrl}?start=${monthStart}&end=${end}`;
        params.combined = `${combinedBaseUrl}?start=${monthStart}&end=${end}&group_by=day`;
        break;
      }
      case "Last 3 Months":
        params.breakdown = `${breakdownBaseUrl}?months=3`;
        params.summary = `${summaryBaseUrl}?months=3`;
        params.combined = `${combinedBaseUrl}?months=3`;
        break;
      case "This Year":
        params.breakdown = `${breakdownBaseUrl}?start=${yearStart}&end=${end}&group_by=month`;
        params.summary = `${summaryBaseUrl}?start=${yearStart}&end=${end}`;
        params.combined = `${combinedBaseUrl}?start=${yearStart}&end=${end}&group_by=month`;
        break;
      default:
        params.breakdown = `${breakdownBaseUrl}?months=6`;
        params.summary = `${summaryBaseUrl}?months=6`;
        params.combined = `${combinedBaseUrl}?months=6`;
        break;
    }
    return params;
  }, [selectedOption]);

  // 🔹 keep fetchAdminData same as you already have

  const fetchAdminData = useCallback(async () => {
    const requestId = ++latestRequestIdRef.current;
    const { breakdown, summary, combined } = generateQueryParams();
    try {
      setIsLoading(true);
      const {
        bookingBreakdown,
        bookingsCombined,
        summary: summaryResponse,
      } = await fetchReports({ breakdown, summary, combined });

      if (requestId !== latestRequestIdRef.current) {
        return;
      }

      setRevenueBookingsData(bookingsCombined);
      setOverviewData(summaryResponse);
      setBookingTrendsData(bookingBreakdown);
    } catch (error: any) {
      if (requestId !== latestRequestIdRef.current) {
        return;
      }

      console.error("Error fetching data:", error);
      showErrorToast({
        message: error?.response?.data?.message || "Error displaying data",
      });
    } finally {
      if (requestId === latestRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [generateQueryParams]);

  const exportData = useCallback(async () => {
    try {
      setIsLoadingExport(true);
      const { summary } = generateQueryParams();
      const response = await exportStats(summary.replace(env.api.reportSummary, ""));

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "report.xlsx");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link); // Clean up
      window.URL.revokeObjectURL(url); // Clean up

      showSuccessToast({ message: "Download starting" });
    } catch (error: any) {
      showErrorToast({
        message: error?.response?.data?.message || "Error exporting data",
      });
      console.error("Export error:", error);
    } finally {
      setIsLoadingExport(false);
    }
  }, [generateQueryParams]);

  const processedTrendsData = useMemo(() => {
    if (!bookingTrendsData?.length) return [];

    const processed = bookingTrendsData.map((item) => {
      const total_bookings =
        (item.flight_bookings || 0) +
        (item.transfer_bookings || 0) +
        (item.stay_bookings || 0);
      const total_revenue =
        (item.flight_revenue || 0) +
        (item.transfer_revenue || 0) +
        (item.stay_revenue || 0);

      // Safely parse label and fallback if invalid
      let displayLabel = "";
      const parsed = new Date(item.label);
      if (!isNaN(parsed.getTime())) {
        displayLabel =
          selectedOption === "This Year"
            ? parsed.toLocaleString("en-US", { month: "long" })
            : parsed.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });
      } else if (selectedOption === "This Year" && typeof item.label === "number") {
        const m = Number(item.label);
        if (m >= 1 && m <= 12) {
          displayLabel = new Date(0, m - 1).toLocaleString("en-US", {
            month: "long",
          });
        }
      } else {
        displayLabel = item.label || "";
      }

      return {
        ...item,
        total_bookings,
        total_revenue,
        displayLabel,
      };
    });

    return processed;
  }, [bookingTrendsData, selectedOption]);

  const hasTrendsValues = useMemo(() => {
    return processedTrendsData.some(
      (d) => (d.total_bookings || 0) > 0 || (d.total_revenue || 0) > 0
    );
  }, [processedTrendsData]);

  const processedCombinedData = useMemo(() => {
    if (!revenueBookingsData?.length) return [];

    return revenueBookingsData.map((item) => {
      let displayLabel = "";
      const parsed = new Date(item.label);
      if (!isNaN(parsed.getTime())) {
        displayLabel =
          selectedOption === "This Year"
            ? parsed.toLocaleString("en-US", { month: "long" })
            : parsed.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });
      } else if (selectedOption === "This Year" && typeof item.label === "number") {
        const m = Number(item.label);
        if (m >= 1 && m <= 12) {
          displayLabel = new Date(0, m - 1).toLocaleString("en-US", {
            month: "long",
          });
        }
      } else {
        displayLabel = item.label || "";
      }

      return {
        ...item,
        displayLabel,
      };
    });
  }, [revenueBookingsData, selectedOption]);

  const hasCombinedValues = useMemo(() => {
    return processedCombinedData.some(
      (d) => (d.bookings || 0) > 0 || (d.revenue || 0) > 0
    );
  }, [processedCombinedData]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const periodFilter = [
    "This Week",
    "This Month",
    "Last 3 Months",
    "This Year",
  ];

  const SkeletonLoader = () => (
    <div className="animate-pulse">
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        {[1, 2, 3].map((_, index) => (
          <Card key={index} className="bg-gray-100 w-full">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-300 rounded w-1/3 mb-4"></div>
              <div className="h-8 bg-gray-300 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-1/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="h-[400px] bg-gray-100 rounded"></div>
    </div>
  );

  const EmptyState = ({
    message = "No data available",
  }: {
    message?: string;
  }) => (
    <div className="flex items-center justify-center h-[400px]">
      <div className="text-center">
        <div className="text-gray-400 mb-2">
          <BookOpen className="h-12 w-12 mx-auto" />
        </div>
        <p className="text-lg font-medium text-gray-500">{message}</p>
      </div>
    </div>
  );

  // if (!APP_STATE?.accessToken) {
  //   return <div>Please log in to access reports.</div>;
  // }

  return (
    <div className="flex min-h-screen p-5">
      <main className="flex-1 w-full">
        {isLoading ? (
          <SkeletonLoader />
        ) : (
          <>
            <div className="flex justify-between w-full items-center gap-4 pb-8">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    {selectedOption} <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {periodFilter.map((time) => (
                    <DropdownMenuItem
                      key={time}
                      onClick={() => setSelectedOption(time)}
                    >
                      {time}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                className={`${
                  isLoadingExport ? "bg-orange-200" : "bg-orange-500"
                } hover:bg-orange-600`}
                onClick={exportData}
                disabled={isLoadingExport}
              >
                <Download className="mr-2 h-4 w-4" />
                <span className="hidden lg:block">
                  {isLoadingExport ? "Exporting..." : "Export All Data"}
                </span>
              </Button>
            </div>

            {/* Metric Cards */}
            <div
              className={`grid gap-4 ${
                isSuperadmin ? "md:grid-cols-3" : "md:grid-cols-2"
              } mb-8`}
            >
              <Card className="bg-green-50 w-full">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <span className="text-sm font-medium text-muted-foreground">
                      Total Users
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-bold">
                      {overviewData?.total_users?.toLocaleString() ?? 0}
                    </span>
                    <span className="ml-2 text-sm text-green-600">
                      {overviewData?.user_growth_percentage ?? 0}% from last
                      period
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-blue-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    <span className="text-sm font-medium text-muted-foreground">
                      Total Bookings
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-bold">
                      {overviewData?.total_bookings?.toLocaleString() ?? 0}
                    </span>
                    <span className="ml-2 text-sm text-blue-600">
                      {overviewData?.booking_growth_percentage ?? 0}% from last
                      period
                    </span>
                  </div>
                </CardContent>
              </Card>

              {isSuperadmin && (
                <Card className="bg-orange-50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      <span className="text-sm font-medium text-muted-foreground">
                        Total Revenue
                      </span>
                    </div>
                    <div className="mt-2">
                      <span className="text-2xl font-bold">
                        {formatCurrency(overviewData?.total_revenue ?? 0)}
                      </span>
                      <span className="ml-2 text-sm text-orange-600">
                        {overviewData?.revenue_growth_percentage ?? 0}% from
                        last period
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Charts */}
            <Tabs
              defaultValue="overview"
              className="space-y-4"
              onValueChange={setActiveTab}
            >
              <div className="overflow-x-auto whitespace-nowrap pb-2">
                <TabsList className="min-w-max flex gap-2">
                  <TabsTrigger
                    value="overview"
                    className="flex items-center gap-2"
                  >
                    <BarChart className="h-4 w-4" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="booking-trends"
                    className="flex items-center gap-2"
                  >
                    <LineChart className="h-4 w-4" />
                    Booking Trends
                  </TabsTrigger>
                  <TabsTrigger
                    value="user-activities"
                    className="flex items-center gap-2"
                  >
                    <Users className="h-4 w-4" />
                    User Activities
                  </TabsTrigger>
                  {isSuperadmin && (
                    <TabsTrigger
                      value="revenue-analysis"
                      className="flex items-center gap-2"
                    >
                      <DollarSign className="h-4 w-4" />
                      Revenue Analysis
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>

              <Card>
                <CardContent className="pt-6">
                  {/* OVERVIEW CHART */}
                  <TabsContent value="overview" className="mt-0">
                    <h3 className="text-lg font-semibold mb-4">
                      Booking & Revenue Overview
                    </h3>
                    <div className="h-[400px]">
                      {processedCombinedData.length === 0 || !hasCombinedValues ? (
                        <EmptyState message="No booking or revenue data available" />
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={processedCombinedData}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              className="stroke-muted"
                            />
                            <XAxis dataKey="displayLabel" />
                            {/* Left axis: counts (bookings) */}
                            <YAxis
                              yAxisId="left"
                              tickFormatter={(v) =>
                                typeof v === "number" ? v.toLocaleString() : v
                              }
                            />
                            {/* Right axis: currency (revenue) */}
                            <YAxis
                              yAxisId="right"
                              orientation="right"
                              tickFormatter={formatCurrency}
                            />
                            <Tooltip
                              formatter={(value, name) => [
                                typeof value === "number"
                                  ? name === "Revenue"
                                    ? formatCurrency(Number(value))
                                    : value.toLocaleString()
                                  : value,
                                name,
                              ]}
                              contentStyle={{
                                background: "white",
                                border: "1px solid #ccc",
                                borderRadius: "8px",
                              }}
                            />
                            <Legend />
                            <Bar
                              dataKey="bookings"
                              fill="#1e40af"
                              name="Bookings"
                              yAxisId="left"
                            />
                            {isSuperadmin && (
                              <Bar
                                dataKey="revenue"
                                fill="#f97316"
                                name="Revenue"
                                yAxisId="right"
                              />
                            )}
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </TabsContent>

                  {/* BOOKING TRENDS CHART - FIXED */}
                  <TabsContent value="booking-trends" className="mt-0">
                    <h3 className="text-lg font-semibold mb-4">
                      Booking Trends
                    </h3>
                    <div className="h-[400px]">
                      {processedTrendsData.length === 0 || !hasTrendsValues ? (
                        <EmptyState message="No booking trends data available" />
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={processedTrendsData}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              className="stroke-muted"
                            />
                            <XAxis dataKey="displayLabel" />
                            <YAxis />
                            <Tooltip
                              formatter={(value, name) => [
                                typeof value === "number"
                                  ? value.toLocaleString()
                                  : value,
                                name,
                              ]}
                              contentStyle={{
                                background: "white",
                                border: "1px solid #ccc",
                                borderRadius: "8px",
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="flight_bookings"
                              stroke="#f97316"
                              name="Flights"
                              strokeWidth={2}
                              dot={{ r: 4 }}
                            />
                            {/* Stay bookings from bookings breakdown API */}
                            <Line
                              type="monotone"
                              dataKey="stay_bookings"
                              stroke="#22c55e"
                              name="Stays"
                              strokeWidth={2}
                              dot={{ r: 4 }}
                            />
                            <Line
                              type="monotone"
                              dataKey="transfer_bookings"
                              stroke="#1e40af"
                              name="Transfers"
                              strokeWidth={2}
                              dot={{ r: 4 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </TabsContent>

                  {/* USER ACTIVITIES CHART - IMPROVED */}
                  <TabsContent value="user-activities" className="mt-0">
                    <h3 className="text-lg font-semibold mb-4">
                      User Activities
                    </h3>
                    <div className="h-[400px]">
                      {processedTrendsData.length === 0 || !hasTrendsValues ? (
                        <EmptyState message="No user activity data available" />
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={processedTrendsData}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              className="stroke-muted"
                            />
                            <XAxis dataKey="displayLabel" />
                            <YAxis />
                            <Tooltip
                              formatter={(value) => [
                                typeof value === "number"
                                  ? value.toLocaleString()
                                  : value,
                                "Total Bookings",
                              ]}
                              contentStyle={{
                                background: "white",
                                border: "1px solid #ccc",
                                borderRadius: "8px",
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="total_bookings"
                              stroke="#f97316"
                              name="Total Bookings"
                              strokeWidth={2}
                              dot={{ r: 4 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </TabsContent>

                  {/* REVENUE ANALYSIS CHART - IMPROVED */}
                  {isSuperadmin && (
                    <TabsContent value="revenue-analysis" className="mt-0">
                      <h3 className="text-lg font-semibold mb-4">
                        Revenue Analysis
                      </h3>
                      <div className="h-[400px]">
                        {processedTrendsData.length === 0 || !hasTrendsValues ? (
                          <EmptyState message="No revenue data available" />
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={processedTrendsData}>
                              <CartesianGrid
                                strokeDasharray="3 3"
                                className="stroke-muted"
                              />
                              <XAxis dataKey="displayLabel" />
                              <YAxis tickFormatter={formatCurrency} />
                              <Tooltip
                                formatter={(value) => [
                                  formatCurrency(Number(value)),
                                  "Total Revenue",
                                ]}
                                contentStyle={{
                                  background: "white",
                                  border: "1px solid #ccc",
                                  borderRadius: "8px",
                                }}
                              />
                              <Line
                                type="monotone"
                                dataKey="total_revenue"
                                stroke="#eab308"
                                name="Total Revenue"
                                strokeWidth={2}
                                dot={{ r: 4 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </TabsContent>
                  )}
                </CardContent>
              </Card>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
}
