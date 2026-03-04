"use client";
import React, { useState, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableRow,
  TableCell,
  TableBody,
} from "@/components/ui/table";
import { BookingTableDropdown } from "./reuseables";

interface FilterProps {
  searchTerm: string;
  selectedOption: string;
  selectedStartDate?: string;
  selectedEndDate?: string;
  selectedDate?: string;
  currency: string;
}

interface CarPassenger {
  first_name?: string;
  last_name?: string;
}

interface CarBooking {
  id?: string | number;
  booking_reference?: string;
  passenger_name?: string;
  pickup_location_label?: string;
  dropoff_location_label?: string;
  transfer_type?: string;
  total_amount?: string | number;
  payment_status?: string;
  booking_status?: string;
  created_at?: string;
  date_booked?: string;
  [key: string]: unknown;
}

interface CarBookingsProps {
  title: string;
  filterProps: FilterProps;
  bookings: CarBooking[];
  loading: boolean;
  onLoadMore: () => void;
  hasMore: boolean;
}

const CarBookings: React.FC<CarBookingsProps> = ({
  title,
  filterProps,
  bookings = [],
  loading,
  onLoadMore,
  hasMore,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<string>("ongoing");

  const styling =
    "h-full data-[state=active]:text-[#181818] data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:rounded-none data-[state=active]:border-b-[3px] data-[state=active]:border-b-[#181818] data-[state=active]:mb-0 flex items-center justify-center cursor-pointer bg-transparent shadow-none rounded-none text-[18px] text-[#4E4F52] font-[400] ";

  // Filter bookings by active tab
  const filteredData = useMemo(() => {
    if (!Array.isArray(bookings)) return [];

    return bookings.filter((item) => {
      const status = item.booking_status?.toLowerCase();
      switch (activeSubTab) {
        case "ongoing":
          return status === "pending" || status === "confirmed";
        case "completed":
          return status === "completed";
        case "cancelled":
          return status === "cancelled";
        default:
          return true;
      }
    });
  }, [bookings, activeSubTab]);

  // Format amount
  const formatAmount = (amount: string | number) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return filterProps.currency === "USD"
      ? `$${numAmount.toFixed(2)}`
      : `₦${numAmount.toLocaleString()}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB");
  };

  // Status styling
  const getStatusStyling = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "confirmed":
      case "paid":
        return "text-[#2D9C5E] border-[#2D9C5E] bg-[#2D9C5E1A]";
      case "cancelled":
      case "failed":
        return "text-[#E74C3C] border-[#E74C3C] bg-[#E74C3C1A]";
      case "pending":
      default:
        return "text-[#EFB608] border-[#EFB608] bg-[#EFB60833]";
    }
  };

  // Helper: get passenger name
  const getPassengerName = (passenger?: CarPassenger | null) => {
    if (!passenger) return "N/A";
    return `${passenger.first_name} ${passenger.last_name}`;
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg py-4">
      <h2 className="text-lg font-semibold px-4 mb-4">{title}</h2>

      {/* Tabs for status filters */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="flex space-x-6 items-center bg-transparent shadow-none rounded-none pb-0">
          <TabsTrigger value="ongoing" className={styling}>
            Ongoing
          </TabsTrigger>
          <TabsTrigger value="completed" className={styling}>
            Completed
          </TabsTrigger>
          <TabsTrigger value="cancelled" className={styling}>
            Cancelled
          </TabsTrigger>
        </TabsList>

        <div className="overflow-x-auto border-t-[1px] border-[#4E4F52]">
          <Table className="border-none border-collapse min-w-[600px]">
            <TableHeader className="bg-[#f5f5f5]">
              <TableRow className="border-none">
                {[
                  "ID",
                  "Booking Reference",
                  "Passenger Name",
                  "Pickup Location",
                  "Dropoff location",
                  "Booked On",
                  "Car Type",
                  "Total Amount",
                  "Payment Status",
                  "Booking Status",
                  "Actions",
                ].map((header) => (
                  <TableCell
                    key={header}
                    className="font-[500] text-[#181818] text-[14px] py-5 px-4"
                    style={{ minWidth: "192.5px" }}
                  >
                    {header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody className="px-4">
              {loading ? (
                // Loading Skeleton
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    {Array.from({ length: 11 }).map((_, cellIndex) => (
                      <TableCell
                        key={cellIndex}
                        className="py-3 px-4"
                        style={{ minWidth: "192.5px" }}
                      >
                        <div className="animate-pulse bg-gray-200 h-4 rounded"></div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : bookings.length > 0 ? (
                <>
                  {bookings.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-[14px] font-[400] text-[#181818] py-3 px-4">
                        {item.booking_reference || "N/A"}
                      </TableCell>
                      <TableCell className="text-[14px] font-[400] text-[#181818] py-3 px-4">
                        {item.id
                          ? String(item.id).substring(0, 8) + "..."
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-[14px] font-[400] text-[#181818] py-3 px-4">
                        {item.passenger_name}
                      </TableCell>
                      <TableCell className="text-[14px] font-[400] text-[#181818] py-3 px-2 whitespace-normal break-words max-w-[350px]">
                        {item.pickup_location_label
                          ? item.pickup_location_label
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-[14px] font-[400] text-[#181818] py-3 px-2 whitespace-normal break-words max-w-[350px]">
                        {item.dropoff_location_label
                          ? item.dropoff_location_label
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-[14px] font-[400] text-[#181818] py-3 px-4">
                        {item.date_booked
                          ? formatDate(item.date_booked)
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-[14px] font-[400] text-[#181818] py-3 px-4">
                        {item.transfer_type || "N/A"}
                      </TableCell>
                      <TableCell className="py-5 px-4 text-gray-800">
                        {item.total_amount
                          ? formatAmount(item.total_amount)
                          : "N/A"}
                      </TableCell>
                      <TableCell className="py-5 px-4">
                        <div
                          className={`border-[1px] rounded-[12px] text-[14px] font-[400] p-[10px] w-fit ${getStatusStyling(
                            item.payment_status
                          )}`}
                        >
                          {item.payment_status || "PENDING"}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <div
                          className={`border-[1px] rounded-[12px] text-[14px] font-[400] p-[10px] w-fit ${getStatusStyling(
                            item.booking_status
                          )}`}
                        >
                          {item.booking_status || "PENDING"}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4 cursor-pointer">
                        <BookingTableDropdown bookingId={item.id} />
                      </TableCell>
                    </TableRow>
                  ))}

                  {hasMore && !loading && (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-4">
                        <button
                          onClick={onLoadMore}
                          disabled={loading}
                          className="px-4 py-2 bg-[#023E8A] text-white rounded hover:bg-[#023E8A]/90 disabled:opacity-50"
                        >
                          Load More
                        </button>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={11}
                    className="text-center py-8 text-[#4E4F52]"
                  >
                    No car bookings found matching your criteria
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Tabs>
    </div>
  );
};

export default CarBookings;
