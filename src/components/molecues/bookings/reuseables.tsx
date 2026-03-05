"use client";

import { DatePairDialog } from "@/components/reuseables/DateDialog";
import { FilterDropdown } from "@/components/reuseables/FilterDropdown";
import { useState, useEffect } from "react";
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
}: {
  bookingId?: string | number;
}) => {
  const router = useRouter();
  const resolvedBookingId =
    bookingId !== undefined && bookingId !== null ? String(bookingId) : "";

  const handleViewDetails = () => {
    if (!resolvedBookingId) return;
    router.push(`/Dashboard/bookings/${resolvedBookingId}`);
  };

  const handleCancelBooking = () => {
    if (!resolvedBookingId) return;
    router.push(`/Dashboard/bookings/${resolvedBookingId}/process-cancel`);
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
  selectedDate?: string;
  setSelectedDate: (date: string | undefined) => void;
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
  selectedDate,
  setSelectedDate,
}) => {
  const [inputValue, setInputValue] = useState("");

  // Sync inputValue with searchTerm
  useEffect(() => {
    setInputValue(searchTerm);
  }, [searchTerm]);

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);

    // Debounce search or trigger immediately if empty
    if (val === "") {
      setSearchTerm("");
    }
  };

  const handleSearchEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setSearchTerm(inputValue);
    }
  };

  // Format date display
  const formatDateDisplay = () => {
    if (selectedStartDate && selectedEndDate) {
      return `${selectedStartDate} - ${selectedEndDate}`;
    } else if (selectedStartDate || selectedEndDate) {
      return selectedStartDate || selectedEndDate;
    }
    return "yyyy-mm-dd - yyyy-mm-dd";
  };

  // Filter options based on booking type context
  const getFilterOptions = () => {
    return [
      {
        id: 1,
        label: "PAID",
        value: "PAID",
      },
      {
        id: 6,
        label: "Cancelled",
        value: "cancelled",
      },
      {
        id: 2,
        label: "PENDING REFUND",
        value: "PENDING REFUND",
      },
      {
        id: 3,
        label: "REFUNDED",
        value: "REFUNDED",
      },
    ];
  };

  return (
    <div className="w-full px-4 lg:px-0">
      <div className="flex justify-between items-center gap-4 flex-col lg:flex-row w-full lg:space-x-12">
        {/* Search Input */}
        <div className="flex items-center flex-grow min-w-[220px] max-w-full border border-[#ACAEB3] rounded-full py-2 px-4 w-full">
          <img
            src="/assets/icons/search.svg"
            alt="Search Icon"
            className="w-4 h-4 flex-shrink-0"
          />

          <input
            type="text"
            className="flex-grow ml-2 text-[16px] placeholder:text-[#9B9EA4] text-[#181818] placeholder:font-light focus:outline-none placeholder:text-[16px] font-[400] min-w-0"
            placeholder="Search by Name, Reference, Location"
            value={inputValue}
            onChange={handleSearchChange}
            onKeyDown={handleSearchEnter}
            onBlur={() => setSearchTerm(inputValue)}
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
                  onClick={() => setSelectedOption("")}
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
                <div className="ml-2 flex flex-col lg:flex-row lg:items-center">
                  <span className="text-[14px] font-light text-[#181818]">
                    Select Date
                  </span>
                  <span className="text-[14px] font-light text-[#9B9EA4] hidden xl:inline-block lg:ml-1 truncate">
                    {formatDateDisplay()}
                  </span>
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
