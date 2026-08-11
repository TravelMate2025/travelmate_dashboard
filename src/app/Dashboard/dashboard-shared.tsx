"use client";

import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ActivityProps = {
  user_full_name: string;
  amount: number;
  date: string;
  profile_picture: string;
  booking_type: string;
};

export type MessageProps = {
  content: string;
  created_at: string;
  id: string;
  link: string;
  sender: { id: number; name: string; email: string } | null;
  title: string;
  type: string;
};

export type RevenueProps = {
  total_revenue: number;
  transfer_revenue: number;
  flight_revenue: number;
  currency: string;
};

export type UsersProps = { total_normal_users: number };
export type Bookings = { total_bookings: number };

export type BookingsProps = {
  booking_type: "flight" | "stay" | "stays" | "hotel" | "transfer" | "transfers";
  created_at: string;
  details: { arrival?: string; departure?: string; departure_date?: string; flight_number?: string };
  email: string;
  id: string;
  specific_id: number;
  status: string;
  total_amount: number | null;
  user: string;
};

export type WeeklyDataPoint = {
  day: string;
  flight: number;
  hotel: number;
  transfer: number;
  total_amount: number;
};

export const StatCard = ({
  title,
  value,
  icon,
  color,
  smColor,
}: {
  title: string;
  value: string;
  icon: string;
  color?: string;
  smColor?: string;
}) => (
  <>
    <div className="lg:p-[20px] hidden lg:block lg:rounded-[20px] lg:space-y-[12px] lg:w-[168px] cursor-pointer bg-[#023E8A]">
      <div className="w-10 h-10 rounded-[8px] flex justify-center items-center bg-[#fff]"><img src={icon} alt="Icon" /></div>
      <div className="space-y-2"><h1 className="font-[600] text-[28px] leading-[100%] text-[#fff]">{value}</h1><p className="font-[500] text-[16px] leading-[100%] text-[#fff]">{title}</p></div>
    </div>
    <div className="space-x-2 lg:hidden flex items-center">
      <div className="w-10 h-10 rounded-full flex justify-center items-center" style={{ backgroundColor: smColor ?? "#D5EBDF" }}><img src={icon} alt="Icon" /></div>
      <div className="space-y-2"><h1 className="font-[600] text-[14px] leading-[100%]" style={{ color: color ?? "#181818" }}>{value}</h1><p className="font-[500] text-[12px] leading-[100%] text-[#555]">{title}</p></div>
    </div>
  </>
);

export const TimeFilterDropdown = ({
  selectedOption,
  setSelectedOption,
}: {
  selectedOption: string;
  setSelectedOption: (value: string) => void;
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild><div className="relative flex items-center space-x-2 cursor-pointer px-3 py-2"><p className="text-sm lg:text-base font-semibold text-[#181818]">{selectedOption}</p><ChevronDown /></div></DropdownMenuTrigger>
    <DropdownMenuContent className="w-full mt-2 border rounded-lg bg-white shadow-lg space-y-2" align="start">
      {["This Week", "This Month", "This Year"].map((option) => <DropdownMenuItem key={option} onClick={() => setSelectedOption(option)}>{option}</DropdownMenuItem>)}
    </DropdownMenuContent>
  </DropdownMenu>
);
