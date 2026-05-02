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
    <div className="space-y-2">
      <h1 className="text-[16px] font-[500] text-[#4E4F52]">{title}</h1>
      <p className="text-[16px] font-[500] text-[#181818]">{value}</p>
    </div>
  );
};

export const FlexValues = ({ title, value, red }: FlexValuesProps) => {
  return (
    <div className="flex justify-between">
      <h1 className="text-[16px] font-[500] text-[#4E4F52]">{title}</h1>
      <p
        className={
          red
            ? "text-[16px] font-[500] text-[#D72638] text-end"
            : "text-[#181818]"
        }
      >
        {value}
      </p>
    </div>
  );
};

export const Policy = ({ List }: PolicyProps) => {
  return (
    <div className="bg-[#fff] p-[24px] rounded-[12px]">
      <h1 className="text-[20px] font-[600] text-[#181818] mb-[16px]">
        Cancellation Policy
      </h1>

      <ul className="space-y-[12px] list-disc pl-3 list-disc:bg-[#181818] ">
        {List.map((item, index) => (
          <li key={index} className="text-[16px] font-[400] text-[#4E4F52]">
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
}: {
  bookingId?: string | number;
  bookingType?: "stays" | "flights" | "transfers";
}) => {
  const router = useRouter();
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

  const options = [
    { id: 1, label: "View Details", disabled: !resolvedBookingId },
    {
      id: 2,
      label: "Cancel Booking",
      disabled: !resolvedBookingId,
    },
  ];

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
              onClick={option.id === 1 ? handleViewDetails : handleCancelBooking}
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
    <div className="">
      <div className="flex justify-center items-center space-x-4 border-[1px] border-[#9B9EA4] py-[16px] rounded-[12px] space-y-[8px] ">
        <div className="text-center w-[40%] p-2">
          <p className="text-[18px] font-[600] text-[#181818] ">
            {departureTime}
          </p>
          <p className="text-[14px] font-[600] text-[#67696D] ">
            {departureLabel}
          </p>
        </div>
        <div className="text-center text-gray-500 text-xlw-[150%] p-1">{"------->"}</div>
        <div className="text-center space-y-[8px] w-[40%] p-2">
          <p className="text-[18px] font-[600] text-[#181818] ">
            {arrivalTime}
          </p>
          <p className="text-[14px] font-[600] text-[#67696D]">
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
