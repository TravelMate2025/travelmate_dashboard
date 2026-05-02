"use client";
import React, { useState, useEffect, useRef } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Filter } from "@/components/molecues/bookings/reuseables";
import BookingTable from "@/components/molecues/bookings/BookingTable";
import CarBookingTable from "@/components/molecues/bookings/CarsBooking";
import FlightBookings from "@/components/molecues/bookings/FlightBookings";
import { useGetAllBookings, useExportBookingsCSV } from "@/hooks/api/bookings";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface FilterProps {
  searchTerm: string;
  selectedOption: string;
  selectedStartDate?: string;
  selectedEndDate?: string;
  currency: string;
}

const BookingTab: React.FC = () => {
  // default tab
  const [activeTab, setActiveTab] = useState<string>("stays");

  // Local UI filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOption, setSelectedOption] = useState("");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState<string>();
  const [selectedEndDate, setSelectedEndDate] = useState<string>();
  const [currency, setCurrency] = useState("NGN");
  const [statusTabFilter, setStatusTabFilter] = useState("all");

  // Export hook
  const { exportAsCSV, loading: exporting } = useExportBookingsCSV();

  const normalizeApiDate = (value?: string) => {
    if (!value) return undefined;

    // Accept values already in API format.
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return undefined;
    }

    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  // Filter state for the hook
  const [apiFilters, setApiFilters] = useState<any>({
    booking_type: "stays", // Default to stays
    currency: "NGN",
  });

  // Map tab -> API booking_type
  const mapBookingType = (tab: string) => {
    switch (tab) {
      case "stays":
        return "stays";
      case "flights":
        return "flights";
      case "cars":
        return "transfers";
      default:
        return "stays";
    }
  };

  const mapDropdownToStatusTab = (option: string) => {
    const normalized = option.toLowerCase().trim();

    if (!normalized || normalized === "all") return "all";
    if (normalized === "paid" || normalized === "ongoing") return "ongoing";
    if (normalized === "completed") return "completed";
    if (normalized === "cancelled") return "cancelled";
    if (normalized === "pending" || normalized === "pending refund") {
      return "pending";
    }
    if (normalized === "refunded" || normalized === "refund") return "refunded";

    return "all";
  };

  const handleStatusOptionChange = (option: string) => {
    setSelectedOption(option);
    setStatusTabFilter(mapDropdownToStatusTab(option));
  };

  const handleStatusTabChange = (status: string) => {
    setStatusTabFilter(status);

    // Manual tab changes should fetch by tab status only.
    setSelectedOption("");
  };

  // Use the hook with current apiFilters
  const {
    data,
    loading,
    loadNext,
    hasNext,
  } = useGetAllBookings(apiFilters);

  // prevent redundant filter updates
  const lastFilters = useRef<string>("");

  // Apply filters whenever dependencies change
  useEffect(() => {
    const normalizedStartDate = normalizeApiDate(selectedStartDate);
    const normalizedEndDate = normalizeApiDate(selectedEndDate);

    const newApiFilters: any = {
      booking_type: mapBookingType(activeTab),
      search: searchTerm || undefined,
      from_date: normalizedStartDate,
      to_date: normalizedEndDate,
      currency,
    };

    // Status tab filtering is handled CLIENT-SIDE in BookingTable/FlightBookings/CarBookings
    // Do NOT send status filters to the API - fetch all bookings and filter client-side
    // Explicitly ensure status and payment_status are NOT in the params
    delete newApiFilters.status;
    delete newApiFilters.payment_status;

    // Only dropdown "paid" and "failed" filters go to the API
    const normalizedOption = selectedOption.toLowerCase().trim();
    if (normalizedOption === "paid") {
      newApiFilters.payment_status = "paid";
    } else if (normalizedOption === "failed") {
      newApiFilters.payment_status = "failed";
    }

    const str = JSON.stringify(newApiFilters);
    if (lastFilters.current !== str) {
      setApiFilters(newApiFilters);
      lastFilters.current = str;
    }
  }, [
    activeTab,
    searchTerm,
    selectedOption,
    selectedStartDate,
    selectedEndDate,
    currency,
  ]);

  // Reset UI filters when switching tabs (UI only)
  useEffect(() => {
    setSearchTerm("");
    setSelectedOption("");
    setSelectedStartDate(undefined);
    setSelectedEndDate(undefined);
    setStatusTabFilter("all");
  }, [activeTab]);

  const filterProps: FilterProps = {
    searchTerm,
    selectedOption,
    selectedStartDate,
    selectedEndDate,
    currency,
  };

  const handleCurrencyChange = (newCurrency: string) => setCurrency(newCurrency);

  return (
    <div className="pb-20 lg:pb-0">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value)}
        className="space-y-[40px]"
      >
        {/* Tabs Header (UNCHANGED UI) */}
        <div className="flex justify-between items-center flex-col lg:flex-row gap-4">
          <TabsList className="lg:w-[436px] w-full bg-[#fff] rounded-[12px] flex justify-between items-center h-[64px]">
            <TabsTrigger
              value="stays"
              className="px-[24px] h-full rounded-[8px] data-[state=active]:bg-[#023E8A] data-[state=active]:text-white"
            >
              Stays
            </TabsTrigger>
            <TabsTrigger
              value="flights"
              className="px-[24px] h-full rounded-[8px] data-[state=active]:bg-[#023E8A] data-[state=active]:text-white"
            >
              Flights
            </TabsTrigger>
            <TabsTrigger
              value="cars"
              className="px-[24px] h-full rounded-[8px] data-[state=active]:bg-[#023E8A] data-[state=active]:text-white"
            >
              Airport Taxis
            </TabsTrigger>
          </TabsList>

          {/* Currency + Export (UNCHANGED UI) */}
          <div className="flex flex-col md:flex-row gap-2 w-full lg:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="px-6 py-4 bg-[#fff] flex items-center space-x-4 rounded-[8px] cursor-pointer justify-center w/full md:w-auto">
                  <span className="text-[#181818] text-[14px] font-[400]">
                    Currency: {currency === "NGN" ? "NGN – Nigerian Naira (₦)" : "USD – United States Dollar ($)"}
                  </span>
                  <img src="/assets/icons/chevron-down.svg" alt="" className="rotate-90" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-full mt-1 border border-gray-300 rounded-lg bg-white shadow-lg space-y-2"
                align="start"
              >
                <DropdownMenuItem
                  className="px-3 py-2 font-[400] text-[12px] text-[#181818] cursor-pointer"
                  onClick={() => handleCurrencyChange("NGN")}
                >
                  NGN – Nigerian Naira (₦)
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="px-3 py-2 font-[400] text-[12px] text-[#181818] cursor-pointer"
                  onClick={() => handleCurrencyChange("USD")}
                >
                  USD – United States Dollar ($)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div
              className="flex items-center space-x-2 py-4 px-6 bg-[#FF6F1E] rounded-[8px] cursor-pointer p-[6px] justify-center w-full md:w-auto"
              onClick={() => {
                exportAsCSV({
                  booking_type: mapBookingType(activeTab),
                  search: searchTerm || undefined,
                  from_date: normalizeApiDate(selectedStartDate),
                  to_date: normalizeApiDate(selectedEndDate),
                  currency,
                })
              }}
            >
              <img src="/assets/icons/orange-download.svg" alt="" className=" lg:w-auto" />
              <span className="font-[600] text-[16px] lg:text-[16px] text-[#fff]">
                {exporting ? "Exporting..." : "Export as CSV file"}
              </span>
            </div>
          </div>
        </div>

        {/* Filters (UNCHANGED UI) */}
        <Filter
          datePickerOpen={datePickerOpen}
          setDatePickerOpen={setDatePickerOpen}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedOption={selectedOption}
          setSelectedOption={handleStatusOptionChange}
          selectedStartDate={selectedStartDate}
          setSelectedStartDate={setSelectedStartDate}
          selectedEndDate={selectedEndDate}
          setSelectedEndDate={setSelectedEndDate}
        />

        {/* Content (UNCHANGED UI) */}
        <TabsContent value="stays">
          <BookingTable
            title="All Stays"
            filterProps={filterProps}
            bookings={data || []}
            loading={loading}
            onLoadMore={loadNext}
            hasMore={hasNext}
            activeStatusTab={statusTabFilter}
            onStatusTabChange={handleStatusTabChange}
          />
        </TabsContent>

        <TabsContent value="flights">
          <FlightBookings
            title="All Flights"
            filterProps={filterProps}
            bookings={data || []}
            loading={loading}
            onLoadMore={loadNext}
            hasMore={hasNext}
            activeStatusTab={statusTabFilter}
            onStatusTabChange={handleStatusTabChange}
          />
        </TabsContent>

        <TabsContent value="cars">
          <CarBookingTable
            title="All Airport Taxis"
            filterProps={filterProps}
            bookings={data || []}
            loading={loading}
            onLoadMore={loadNext}
            hasMore={hasNext}
            activeStatusTab={statusTabFilter}
            onStatusTabChange={handleStatusTabChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BookingTab;