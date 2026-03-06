"use client";
import React, { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useGetAllTicketStats } from "@/hooks/api/ticket";

const Stats = () => {
  const [days, setDays] = useState<number>(1); // Default filter is "Today"

  const { loading, data, updateDays } = useGetAllTicketStats({
    initialFetch: true,
    defaultDays: days,
  });

  useEffect(() => {
    updateDays(days); // Update stats whenever `days` changes
  }, [days]);

  return (
    <div className="space-y-6 mt-[10] ">
      <div className="">
        <TimeFilterDropdown setDays={setDays} />
      </div>
      <>
        {loading ? (
          <LoadingState />
        ) : (
          <div className="flex lg:space-x-6 items-center flex-col lg:flex-row space-y-6 lg:space-y-0">
            <StatCard
              icon="/assets/icons/airplane_ticket.svg"
              label="Open Tickets"
              value={data?.open_tickets?.count ?? "N/A"}
            />
            <StatCard
              icon="/assets/icons/access_time.svg"
              label="Average Response Time"
              value={data?.average_response_time?.human_readable ?? "N/A"}
            />
            <StatCard
              icon="/assets/icons/card-escalate.svg"
              label="Escalated Issues"
              value={data?.escalated_issues?.count ?? "N/A"}
            />
          </div>
        )}
      </>
    </div>
  );
};

const TimeFilterDropdown = ({
  setDays,
}: {
  setDays: (days: number) => void;
}) => {
  const [selectedOption, setSelectedOption] = useState("Today"); // Default is "Today"

  const options = [
    { label: "Today", days: 1 },
    { label: "This week", days: 7 },
    { label: "This month", days: 30 },
    { label: "This year", days: 365 },
  ];

  const handleSelect = (option: (typeof options)[0]) => {
    setSelectedOption(option.label);
    setDays(option.days);
  };

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center space-x-2 cursor-pointer px-3 py-2">
            <p className="text-sm lg:text-base font-semibold text-[#181818]">
              {selectedOption}
            </p>
            <img
              src="/assets/icons/chevron-down.svg"
              alt="Dropdown Icon"
              className="w-5 rotate-90"
            />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-full mt-2 border border-gray-300 rounded-lg bg-white shadow-lg space-y-2"
          align="start"
        >
          {options.map((option) => (
            <DropdownMenuItem
              key={option.label}
              onClick={() => handleSelect(option)}
              className={`px-3 py-2 ${
                selectedOption === option.label
                  ? "font-bold text-[#181818] bg-gray-100"
                  : "text-gray-700"
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

const StatCard = ({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) => (
  <div className="w-full lg:w-[246px] border-[1px] p-[20px] space-y-[12px] rounded-[10px] border-[#9B9EA4] bg-[#F5F5F5]">
    <div className="space-x-3 flex items-center justify-center">
      <img src={icon} alt="" />
      <p className="text-[14px] font-[500px] leading-[100%] text-[#181818]">
        {label}
      </p>
    </div>
    <div>
      <h1 className="text-[20px] font-[600px] leading-[100%] text-[#181818] text-center">
        {value}
      </h1>
    </div>
  </div>
);

const LoadingState = () => {
  return (
    <div className="flex lg:space-x-6 items-center flex-col lg:flex-row space-y-6 lg:space-y-0">
      <div className="w-full lg:w-[246px] border-[1px] p-[20px] space-y-[12px] rounded-[10px] bg-gray-200 h-[100px] animate-pulse"></div>
      <div className="w-full lg:w-[246px] border-[1px] p-[20px] space-y-[12px] rounded-[10px] bg-gray-200 h-[100px] animate-pulse"></div>
      <div className="w-full lg:w-[246px] border-[1px] p-[20px] space-y-[12px] rounded-[10px] bg-gray-200 h-[100px] animate-pulse"></div>
    </div>
  );
};

export default Stats;
