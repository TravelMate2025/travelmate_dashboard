"use client";
import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableRow,
  TableCell,
  TableBody,
} from "@/components/ui/table";
import { BookingTableDropdown } from "./reuseables";

// Define the interface for filter props
interface FilterProps {
  searchTerm: string;
  selectedOption: string;
  selectedStartDate?: string;
  selectedEndDate?: string;
  currency: string;
}

interface BookingItem {
  id?: string | number;
  reference?: string;
  booking_reference?: string;
  booking_status?: string;
  status?: string;
  payment_status?: string;
  created_at?: string;
  date_booked?: string;
  hotel_name?: string;
  total_amount?: string | number;
  check_in?: string;
  check_out?: string;
  refund_percent?: number | null;
  refund_amount?: number | string | null;
  refund_status?: string | null;
  rooms?: Array<{ room_type?: string }>;
  customer_details?: {
    name?: string;
    surname?: string;
  };
}

// Define the interface for component props
interface BookingTableProps {
  title: string;
  filterProps: FilterProps;
  bookings: BookingItem[] | null | undefined;
  loading: boolean;
  onLoadMore: () => void;
  hasMore: boolean;
  activeStatusTab: string;
  onStatusTabChange?: (status: string) => void;
  onResynced?: () => void;
}

const BookingTable: React.FC<BookingTableProps> = ({
  title,
  filterProps,
  bookings = [], // default to empty array
  loading,
  onLoadMore,
  hasMore,
  activeStatusTab,
  onStatusTabChange,
  onResynced,
}) => {
  const [filteredData, setFilteredData] = useState<BookingItem[]>([]);

  const styling =
    "h-full data-[state=active]:text-[#181818] data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:rounded-none data-[state=active]:border-b-[3px] data-[state=active]:border-b-[#181818] data-[state=active]:mb-0 flex items-center justify-center cursor-pointer bg-transparent shadow-none rounded-none text-[18px] text-[#4E4F52] font-[400] ";

  /**
   * Keep table rows in backend order semantics and only enforce
   * most-recent-to-least-recent sorting on the currently fetched dataset.
   */
  useEffect(() => {
    const safeBookings = Array.isArray(bookings) ? bookings : [];

    const normalizeStatus = (value?: string) =>
      String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_");

    const matchesActiveTab = (item: BookingItem) => {
      if (activeStatusTab === "all") return true;

      const bookingStatus = normalizeStatus(item.booking_status || item.status);
      const paymentStatus = normalizeStatus(item.payment_status);

      if (activeStatusTab === "ongoing") {
        // "ongoing" was never a real booking_status value — the backend
        // only ever sets 'confirmed'/'cancelled'/'completed'
        // (BookingLifecycleStatus), so this check could never match
        // anything and the Ongoing tab was permanently empty regardless
        // of real data. 'confirmed' bookings become 'completed' via the
        // periodic partner-sync task once the stay concludes, so
        // 'confirmed' reliably means "still ongoing/upcoming" without
        // needing to re-derive it from check_in/check_out here.
        return bookingStatus === "confirmed";
      }

      if (activeStatusTab === "completed") {
        return bookingStatus === "completed";
      }

      if (activeStatusTab === "pending") {
        return bookingStatus === "pending" ||
          paymentStatus === "pending" ||
          paymentStatus === "refund_pending";
      }

      if (activeStatusTab === "refunded") {
        return bookingStatus === "refunded" || paymentStatus === "refunded";
      }

      return bookingStatus === activeStatusTab;
    };

    const getBookingTimestamp = (item: BookingItem) => {
      const dateValue =
        item.created_at || item.date_booked || item.check_in || item.check_out;

      if (!dateValue) return 0;

      const timestamp = new Date(dateValue).getTime();
      return Number.isNaN(timestamp) ? 0 : timestamp;
    };

    const tabFiltered = safeBookings.filter(matchesActiveTab);

    const sorted = [...tabFiltered].sort(
      (a, b) => getBookingTimestamp(b) - getBookingTimestamp(a)
    );

    setFilteredData(sorted);
  }, [bookings, activeStatusTab]);


  const formatAmount = (amount: string | number) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return filterProps.currency === "USD"
      ? `$${numAmount.toFixed(2)}`
      : `₦${numAmount.toLocaleString()}`;
  };

  /**
   * Format date into dd/mm/yyyy
   */
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB");
  };

  /**
   * Format stay dates
   */
  const formatStayDates = (checkIn?: string, checkOut?: string) => {
    if (!checkIn || !checkOut) return "N/A";
    return `${formatDate(checkIn)} - ${formatDate(checkOut)}`;
  };

  /**
   * Calculate nights between two dates
   */
  const calculateNights = (checkIn?: string, checkOut?: string) => {
    if (!checkIn || !checkOut) return "N/A";
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getStatusStyling = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "confirmed":
      case "paid":
      case "succeeded":
        return "text-[#2D9C5E] border-[#2D9C5E] bg-[#2D9C5E1A]";
      case "cancelled":
      case "failed":
      case "refunded":
        return "text-[#E74C3C] border-[#E74C3C] bg-[#E74C3C1A]";
      case "ongoing":
        return "text-[#0084D9] border-[#0084D9] bg-[#0084D91A]";
      case "pending":
      default:
        return "text-[#EFB608] border-[#EFB608] bg-[#EFB60833]";
    }
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg py-4">
      <h2 className="text-lg font-semibold px-4 mb-4">{title}</h2>

      <Tabs
        value={activeStatusTab}
        onValueChange={(value) => {
          onStatusTabChange?.(value);
        }}
      >
        <TabsList className="flex space-x-6 items-center bg-transparent shadow-none rounded-none pb-0">
          <TabsTrigger value="all" className={styling}>
            All
          </TabsTrigger>
          <TabsTrigger value="ongoing" className={styling}>
            Ongoing
          </TabsTrigger>
          <TabsTrigger value="pending" className={styling}>
            Pending
          </TabsTrigger>
          <TabsTrigger value="completed" className={styling}>
            Completed
          </TabsTrigger>
          <TabsTrigger value="cancelled" className={styling}>
            Cancelled
          </TabsTrigger>
          <TabsTrigger value="refunded" className={styling}>
            Refunded
          </TabsTrigger>
        </TabsList>

        <div className="overflow-x-auto border-t-[1px] border-[#4E4F52]">
          <Table className="border-none border-collapse min-w-[600px]">
            <TableHeader className="bg-[#f5f5f5]">
              <TableRow className="border-none">
                {[
                  "ID",
                  "Hotel Name",
                  "Guest Name",
                  "Booked On",
                  "Check-in - Check-out",
                  "Nights",
                  "Room Type",
                  "Total Amount",
                  "Refund",
                  "Payment Status",
                  "Booking Status",
                  "Actions",
                ].map((header) => (
                  <TableCell
                    key={header}
                    className="font-[400] text-[#181818] text-[14px] py-5 px-4"
                    style={{ minWidth: "192.5px" }}
                  >
                    {header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody className="px-4">
              {/* Loading Skeleton */}
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    {Array.from({ length: 12 }).map((_, cellIndex) => (
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
              ) : filteredData.length > 0 ? (
                <>
                  {filteredData.map((item, index) => {
                    const roomType = item.rooms?.[0]?.room_type || "Standard";
                    const bookingStatus = item.booking_status || item.status || "PENDING";
                    const paymentStatus = item.payment_status || "PENDING";

                    return (
                    <TableRow key={String(item.id ?? item.reference ?? item.booking_reference ?? index)}>
                      <TableCell className="py-3 px-4 text-sm text-[#181818]">
                        {item.reference || "N/A"}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-sm text-[#181818]">
                        {item.hotel_name || "N/A"}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-sm text-[#181818]">
                        {item.customer_details?.name &&
                        item.customer_details?.surname
                          ? `${item.customer_details.name} ${item.customer_details.surname}`
                          : "N/A"}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-sm text-[#181818]">
                        {formatDate(item.date_booked || item.created_at)}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-sm text-[#181818]">
                        {formatStayDates(item.check_in, item.check_out)}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-sm text-[#181818]">
                        {calculateNights(item.check_in, item.check_out)}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-sm text-[#181818]">
                        {roomType}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-sm text-[#181818]">
                        {item.total_amount
                          ? formatAmount(item.total_amount)
                          : "N/A"}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-sm text-[#181818]">
                        {item.refund_percent != null
                          ? `${item.refund_percent}%${item.refund_status ? ` · ${item.refund_status}` : ""}`
                          : "—"}
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <div
                          className={`border rounded-[12px] text-[14px] font-[400] p-[8px] w-fit ${getStatusStyling(
                            paymentStatus
                          )}`}
                        >
                          {paymentStatus}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <div
                          className={`border rounded-[12px] text-[14px] font-[400] p-[8px] w-fit ${getStatusStyling(
                            bookingStatus
                          )}`}
                        >
                          {bookingStatus}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4 cursor-pointer">
                        <BookingTableDropdown
                          bookingId={item.id}
                          bookingType="stays"
                          bookingStatus={item.booking_status || item.status}
                          onResynced={onResynced}
                        />
                      </TableCell>
                    </TableRow>
                    );
                  })}

                  {/* Load More Button */}
                  {hasMore && !loading && (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center py-4">
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
                    colSpan={12}
                    className="text-center py-8 text-[#4E4F52]"
                  >
                    No bookings found matching your criteria
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

export default BookingTable;
