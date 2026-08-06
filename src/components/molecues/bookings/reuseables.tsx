"use client";

import { DatePairDialog } from "@/components/reuseables/DateDialog";
import { FilterDropdown } from "@/components/reuseables/FilterDropdown";
import { useState, useEffect, useRef } from "react";
import { Label } from "recharts";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import BookingService from "@/services/booking";
import { showErrorToast, showSuccessToast } from "@/utils/toasters";
import axios from "axios";

interface GridValuesProps {
  title: string;
  value: React.ReactNode;
}

interface FlexValuesProps {
  title: string;
  value: React.ReactNode;
  red?: boolean;
}

interface PolicyProps {
  List: string[];
}

export const GridValues = ({ title, value }: GridValuesProps) => {
  return (
    <div className="min-w-0 space-y-1.5 rounded-lg border border-[#e7edf5] bg-[#fbfcfe] px-3.5 py-3">
      <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7b8491]">{title}</p>
      <p className="break-words text-[14px] font-semibold leading-5 text-[#18202b]">{value || "—"}</p>
    </div>
  );
};

export const FlexValues = ({ title, value, red }: FlexValuesProps) => {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-[#edf1f6] py-2.5 last:border-b-0">
      <p className="text-[13px] font-medium text-[#687382]">{title}</p>
      <p
        className={
          red
            ? "max-w-[62%] text-end text-[13px] font-semibold text-[#D72638]"
            : "max-w-[62%] text-end text-[13px] font-semibold text-[#18202b]"
        }
      >
        {value || "—"}
      </p>
    </div>
  );
};

export const Policy = ({ List }: PolicyProps) => {
  const safeList = Array.isArray(List)
    ? List
    : List && typeof List === "object"
      ? [
          (List as Record<string, unknown>).policyCopy,
          (List as Record<string, unknown>).terms,
          (List as Record<string, unknown>).label,
        ].filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : [];
  return (
    <div className="rounded-xl border border-[#dfe7f0] bg-white p-5 shadow-[0_8px_24px_rgba(16,42,67,0.04)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#023E8A]">Terms</p>
      <h2 className="mb-4 mt-1 text-[17px] font-semibold text-[#18202b]">
        Cancellation Policy
      </h2>

      <ul className="space-y-2.5 pl-4">
        {safeList.map((item, index) => (
          <li key={index} className="text-[13px] leading-5 text-[#687382]">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

export const BookingTableDropdown = ({
  bookingId,
  bookingType,
  onResynced,
  bookingStatus,
}: {
  bookingId?: string | number;
  bookingType?: "stays" | "flights" | "transfers";
  onResynced?: () => void;
  bookingStatus?: string;
}) => {
  const router = useRouter();
  const [resyncing, setResyncing] = useState(false);
  const resolvedBookingId =
    bookingId !== undefined && bookingId !== null ? String(bookingId) : "";

  const bookingTypeQuery = bookingType
    ? `?type=${encodeURIComponent(bookingType)}`
    : "";

  const handleViewDetails = () => {
    if (!resolvedBookingId) return;
    router.push(`/Dashboard/bookings/${resolvedBookingId}${bookingTypeQuery}`);
  };

  const handleCancelBooking = () => {
    if (!resolvedBookingId) return;
    router.push(`/Dashboard/bookings/${resolvedBookingId}/process-cancel${bookingTypeQuery}`);
  };

  // Only stays and transfers sync from the partner (the periodic
  // mark_ended_stays_checked_out_task / on-demand BookingViewSet.list sync
  // never upserts flights), so a resync request for a flight booking would
  // 404 — don't offer it there.
  const canResync = resolvedBookingId && (bookingType === "stays" || bookingType === "transfers");
  const canCancel = !["cancelled", "canceled", "refunded", "completed", "failed", "payment_failed"].includes(
    String(bookingStatus || "").toLowerCase(),
  );

  const handleResync = async () => {
    if (!resolvedBookingId || resyncing) return;
    setResyncing(true);
    try {
      await BookingService.resyncBooking({ bookingId: resolvedBookingId });
      showSuccessToast({ message: "Booking resynced from partner" });
      onResynced?.();
    } catch (error: unknown) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data as { error?: string })?.error ||
          "Unable to resync this booking from the partner"
        : "Unable to resync this booking from the partner";
      showErrorToast({ message });
    } finally {
      setResyncing(false);
    }
  };

  const options = [
    { id: 1, label: "View Details", disabled: !resolvedBookingId },
    ...(canCancel ? [{
      id: 2,
      label: "Cancel Booking",
      disabled: !resolvedBookingId,
    }] : []),
    ...(canResync
      ? [
          {
            id: 3,
            label: resyncing ? "Resyncing..." : "Resync from Partner",
            disabled: resyncing,
          },
        ]
      : []),
  ];

  const handleOptionClick = (id: number) => {
    if (id === 1) return handleViewDetails();
    if (id === 2) return handleCancelBooking();
    return handleResync();
  };

  return (
    <div className="relative overflow-visible">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="cursor-pointer select-none px-2 py-1 text-lg">⋮</div>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side="bottom"
          align="end"
          className="z-50 max-w-[180px] shadow-lg border border-gray-200 rounded-md bg-white"
        >
          {options.map((option) => (
            <DropdownMenuItem
              key={option.id}
              onClick={() => handleOptionClick(option.id)}
              disabled={option.disabled}
              className={`cursor-pointer select-none ${
                option.label === "Cancel Booking"
                  ? "text-red-500 hover:text-red-600"
                  : ""
              }`}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export const LocationTag = ({
  departureTime,
  departureLabel,
  arrivalTime,
  arrivalLabel,
}: {
  departureTime?: string;
  departureLabel?: string;
  arrivalTime?: string;
  arrivalLabel?: string;
}) => {
  return (
    <div>
      <div className="flex items-center justify-center gap-4 rounded-xl border border-[#dfe7f0] bg-[#fbfcfe] px-3 py-4">
        <div className="text-center w-[40%] p-2">
          <p className="text-[17px] font-semibold text-[#18202b]">
            {departureTime}
          </p>
          <p className="text-[12px] font-medium text-[#687382]">
            {departureLabel}
          </p>
        </div>
        <div className="text-center text-lg text-[#9aa7b5]">→</div>
        <div className="text-center space-y-[8px] w-[40%] p-2">
          <p className="text-[17px] font-semibold text-[#18202b]">
            {arrivalTime}
          </p>
          <p className="text-[12px] font-medium text-[#687382]">
            {arrivalLabel}
          </p>
        </div>
      </div>
    </div>
  );
};

interface FilterProps {
  datePickerOpen: boolean;
  setDatePickerOpen: (open: boolean) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedOption: string;
  setSelectedOption: (option: string) => void;
  selectedStartDate?: string;
  setSelectedStartDate: (date: string | undefined) => void;
  selectedEndDate?: string;
  setSelectedEndDate: (date: string | undefined) => void;
}

export const Filter: React.FC<FilterProps> = ({
  datePickerOpen,
  setDatePickerOpen,
  searchTerm,
  setSearchTerm,
  selectedOption,
  setSelectedOption,
  selectedStartDate,
  setSelectedStartDate,
  selectedEndDate,
  setSelectedEndDate,
}) => {
  const [inputValue, setInputValue] = useState("");
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync inputValue with searchTerm
  useEffect(() => {
    setInputValue(searchTerm);
  }, [searchTerm]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Handle search input with debounced real-time search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);

    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Trigger search immediately if empty, otherwise debounce
    if (val === "") {
      setSearchTerm("");
    } else {
      // Debounce: search after 500ms of user stopping typing
      debounceTimeoutRef.current = setTimeout(() => {
        setSearchTerm(val);
      }, 500);
    }
  };

  const handleSearchEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      // Clear pending debounce and search immediately
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      setSearchTerm(inputValue);
    }
  };

  const fromDateDisplay = selectedStartDate || "yyyy-mm-dd";
  const toDateDisplay = selectedEndDate || "yyyy-mm-dd";

  // Filter options based on booking type context
  const getFilterOptions = () => {
    return [
      {
        id: 1,
        label: "Ongoing",
        value: "ongoing",
      },
      {
        id: 4,
        label: "Pending",
        value: "pending",
      },
      {
        id: 2,
        label: "Completed",
        value: "completed",
      },
      {
        id: 6,
        label: "Cancelled",
        value: "cancelled",
      },
      {
        id: 3,
        label: "REFUNDED",
        value: "refunded",
      },
      { id: 7, label: "Refund pending", value: "pending_refund" },
      { id: 8, label: "Refund processing", value: "processing_refund" },
      { id: 9, label: "Refund completed", value: "completed_refund" },
      { id: 10, label: "Refund failed", value: "failed_refund" },
      { id: 11, label: "Stale refunds", value: "stale_refund" },
      { id: 12, label: "No refund applies", value: "not_applicable_refund" },
      { id: 13, label: "Overdue refunds", value: "overdue_refund" },
    ];
  };

  const handleSearchClick = () => {
    // Clear pending debounce and search immediately
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    setSearchTerm(inputValue);
  };

  return (
    <div className="w-full px-4 lg:px-0">
      <div className="flex justify-between items-center gap-4 flex-col lg:flex-row w-full lg:space-x-12">
        {/* Search Input */}
        <div className="flex items-center flex-grow min-w-[220px] max-w-full border border-[#ACAEB3] rounded-full py-2 px-4 w-full">
          <img
            src="/assets/icons/search.svg"
            alt="Search Icon"
            className="w-4 h-4 flex-shrink-0 cursor-pointer"
            onClick={handleSearchClick}
          />

          <input
            type="text"
            className="flex-grow ml-2 text-[16px] placeholder:text-[#9B9EA4] text-[#181818] placeholder:font-light focus:outline-none placeholder:text-[16px] font-[400] min-w-0"
            placeholder="Search by Name, Reference, Location"
            value={inputValue}
            onChange={handleSearchChange}
            onKeyDown={handleSearchEnter}
            onBlur={() => {
              // Clear pending debounce and search immediately on blur
              if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
              }
              setSearchTerm(inputValue);
            }}
          />
        </div>

        <div className="flex space-x-4 w-full items-center">
          {/* Filter Dropdown */}
          <div className="mr-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center bg-white border border-[#EBECED] rounded-full py-3 px-5 cursor-pointer shadow-sm lg:shadow-none">
                  <span className="ml-2 text-[14px] font-light text-[#181818]">
                    {selectedOption || "Filter by Status"}
                  </span>
                  <img
                    src="/assets/icons/chevron-down.svg"
                    alt="Chevron"
                    className="w-4 h-4 ml-2 flex-shrink-0 rotate-90"
                  />
                </div>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-48 mt-1 border border-gray-300 rounded-lg bg-white shadow-lg">
                <DropdownMenuItem
                  className="px-3 py-2 font-[400] text-[12px] text-[#181818] cursor-pointer"
                  onClick={() => setSelectedOption("all")}
                >
                  All
                </DropdownMenuItem>
                {getFilterOptions().map((option) => (
                  <DropdownMenuItem
                    key={option.id}
                    className="px-3 py-2 font-[400] text-[12px] text-[#181818] cursor-pointer capitalize"
                    onClick={() => setSelectedOption(option.value)}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Date Picker */}
          <div className="flex space-x-3">
            <div className="flex items-center w-full gap-3">
              <div
                className="flex items-center bg-white border border-[#EBECED] rounded-full py-3 px-5 cursor-pointer flex-shrink-0 shadow-sm lg:shadow-none"
                onClick={() => setDatePickerOpen(true)}
              >
                <img
                  src="/assets/icons/calendar.svg"
                  alt="Calendar Icon"
                  className="w-6 flex-shrink-0"
                />
                <div className="ml-2 flex flex-col items-start">
                  <span className="text-[14px] font-light text-[#181818]">
                    Select Date Range
                  </span>
                  <div className="text-[12px] font-light text-[#9B9EA4] hidden xl:flex flex-col leading-[1.2]">
                    <span>From: {fromDateDisplay}</span>
                    <span>To: {toDateDisplay}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Date Picker Dialog */}
      <DatePairDialog
        isOpen={datePickerOpen}
        onClose={() => setDatePickerOpen(false)}
        selectedStartDate={selectedStartDate}
        setSelectedStartDate={setSelectedStartDate}
        selectedEndDate={selectedEndDate}
        setSelectedEndDate={setSelectedEndDate}
      />
    </div>
  );
};
