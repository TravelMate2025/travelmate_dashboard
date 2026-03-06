"use client";
import React, { useState, useEffect, useRef } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Filter } from "@/components/molecues/bookings/reuseables";
import BookingTable from "@/components/molecues/bookings/BookingTable";
import CarBookingTable from "@/components/molecues/bookings/CarsBooking";
import FlightBookings from "@/components/molecues/bookings/FlightBookings";
import { useGetAllBookings } from "@/hooks/api/bookings";
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
  selectedDate?: string;
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
  const [selectedDate, setSelectedDate] = useState<string>();
  const [currency, setCurrency] = useState("NGN");

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

  // Use the hook with current apiFilters
  const {
    data,
    loading,
    error,
    loadNext,
    hasNext,
  } = useGetAllBookings(apiFilters);

  // prevent redundant filter updates
  const lastFilters = useRef<string>("");

  // Apply filters whenever dependencies change
  useEffect(() => {
    const newApiFilters: any = {
      booking_type: mapBookingType(activeTab),
      search: searchTerm || undefined,
      from_date: selectedStartDate || undefined,
      to_date: selectedEndDate || undefined,
      currency,
    };

    if (selectedOption) {
      if (["PAID", "PENDING", "FAILED"].includes(selectedOption.toUpperCase())) {
        newApiFilters.payment_status = selectedOption.toUpperCase();
      } else if (
        ["ongoing", "completed", "cancelled", "pending"].includes(
          selectedOption.toLowerCase()
        )
      ) {
        newApiFilters.status = selectedOption.toLowerCase();
      }
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
    setSelectedDate(undefined);
    setSelectedStartDate(undefined);
    setSelectedEndDate(undefined);
  }, [activeTab]);

  const filterProps: FilterProps = {
    searchTerm,
    selectedOption,
    selectedStartDate,
    selectedEndDate,
    selectedDate,
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
                const current = data ?? [];
                console.log("Exporting bookings:", current);
              }}
            >
              <img src="/assets/icons/orange-download.svg" alt="" className=" lg:w-auto" />
              <span className="font-[600] text-[16px] lg:text-[16px] text-[#fff]">Export as CSV file</span>
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
          setSelectedOption={setSelectedOption}
          selectedStartDate={selectedStartDate}
          setSelectedStartDate={setSelectedStartDate}
          selectedEndDate={selectedEndDate}
          setSelectedEndDate={setSelectedEndDate}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
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
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BookingTab;