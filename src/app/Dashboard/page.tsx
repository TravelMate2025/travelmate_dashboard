"use client";
import React, { useEffect, useMemo, useCallback } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import Activity from "@/components/molecues/dashboard/RecentAct";
import Chat from "@/components/molecues/dashboard/Messages";
import Chart from "@/components/molecues/dashboard/Chart";
import { fetchDashboardData } from "@/services/dashboard";
import Statistics from "@/components/molecues/dashboard/MetricCards";

const page = () => {
  const APP_STATE = useAuthContext();
  const accessToken = APP_STATE?.accessToken;
  const isSuperadmin = APP_STATE?.user?.isSuperuser;
  const [activity, setActivity] = useState<ActivityProps[]>([]);
  const [messages, setMessages] = useState<MessageProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Bookings>({ total_bookings: 0 });
  const [revenue, setRevenue] = useState<RevenueProps | null>(null);
  const [users, setUsers] = useState<UsersProps>({ total_normal_users: 0 });
  const [selectedOption, setSelectedOption] = useState("This Week");
  const [allBookings, setAllBookings] = useState<BookingsProps[]>([]);

  const generateWeeklyChartData = useCallback((bookings: BookingsProps[]) => {
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    // Initialize a structure for each weekday with zero values
    const weeklyData = weekDays.map((day) => ({
      day,
      flight: 0,
      hotel: 0,
      transfer: 0,
      total_amount: 0,
    }));

    // Sum up total_amounts per booking type per day
    bookings.forEach((item) => {
      const date = new Date(item.created_at);
      const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "short" });

      const target = weeklyData.find((entry) => entry.day === dayOfWeek);
      if (!target || !item.total_amount) {
        return;
      }

      // Type-safe way to update the booking type count
      if (item.booking_type === "flight") {
        target.flight += item.total_amount;
      } else if (item.booking_type === "hotel") {
        target.hotel += item.total_amount;
      } else if (item.booking_type === "transfer" || item.booking_type === "transfers") {
        target.transfer += item.total_amount;
      }
      target.total_amount += item.total_amount;
    });

    return weeklyData;
  }, []);

   useEffect(() => {
    if (!accessToken) {
      return;
    }

    fetchDashboardData(
      {
        setBookings,
        setActivity,
        setMessages,
        setLoading,
        setRevenue,
        setUsers,
        setAllBookings: (data) => setAllBookings(data as BookingsProps[]),
      },
      { isSuperadmin }
    );
  }, [accessToken, isSuperadmin]);

  const filteredData = useMemo(() => {
    const now = new Date();

    const filtered = allBookings?.filter((item) => {
      const createdAt = new Date(item.created_at);

      if (selectedOption === "This Week") {
        const currentDate = new Date(); // Create new date to avoid mutation
        const startOfWeek = new Date(
          currentDate.setDate(currentDate.getDate() - currentDate.getDay())
        );

        return createdAt >= startOfWeek;
      } else if (selectedOption === "This Month") {
        const isCurrentMonth =
          createdAt.getMonth() === now.getMonth() &&
          createdAt.getFullYear() === now.getFullYear();

        return isCurrentMonth;
      } else if (selectedOption === "This Year") {
        const isCurrentYear = createdAt.getFullYear() === now.getFullYear();
        return isCurrentYear;
      }
      return true;
    });
    return filtered;
  }, [allBookings, selectedOption]);

  const weeklyData = useMemo(
    () => generateWeeklyChartData(filteredData),
    [filteredData, generateWeeklyChartData]
  );

  const DashboardSkeletonLoader = () => {
    return (
      <div className="space-y-10 py-4 lg:py-0">
        {/* Statistics Section */}
        <div className="flex justify-between items-start flex-col-reverse lg:flex-row gap-y-4 lg:gap-0 px-3">
          <div className="space-y-6">
            {/* Time Filter Dropdown Skeleton */}
            <div className="w-32 h-8 bg-gray-300 rounded-md animate-pulse"></div>

            {/* Stat Cards Skeleton */}
            <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((_, index) => (
                <div
                  key={index}
                  className="lg:p-[20px] lg:rounded-[20px] lg:space-y-[12px] lg:w-[168px] bg-gray-300 animate-pulse h-12 w-12"
                ></div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <div className="w-32 h-6 bg-gray-300 rounded-md animate-pulse"></div>
            <div className="w-48 h-8 bg-gray-300 rounded-md animate-pulse"></div>
          </div>
        </div>

        {/* DataGrid Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Section (Charts and Activities) */}
          <div className="lg:col-span-2 space-y-10">
            <div className="grid grid-rows-2 gap-6 h-[45rem]">
              {/* Chart Skeleton */}
              <div className="bg-gray-300 rounded-2xl animate-pulse h-full"></div>

              {/* Activity Skeleton */}
              <div className="bg-gray-300 rounded-2xl animate-pulse h-full"></div>
            </div>
          </div>

          {/* Right Section (Messages) */}
          <div className="lg:col-span-1">
            <div className="bg-gray-300 rounded-2xl animate-pulse h-full"></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10 py-4 lg:py-0">
      {loading ? (
        <DashboardSkeletonLoader />
      ) : (
        <>
          <Statistics
            bookings={bookings}
            revenue={revenue}
            users={users}
            selectedOption={selectedOption}
            setSelectedOption={setSelectedOption}
            isSuperadmin={isSuperadmin}
          />
          <DataGrid
            activity={activity}
            loading={loading}
            messages={messages}
            bookings={bookings}
            weeklyData={weeklyData}
          />
        </>
      )}
    </div>
  );
};

const StatCard = ({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: string;
  color?: string;
  smColor?: string;
}) => {
  return (
    <>
      <div className="lg:p-[20px] hidden lg:block lg:rounded-[20px] lg:space-y-[12px] lg:w-[168px] cursor-pointer bg-[#023E8A]">
        <div
          className={
            "w-10 h-10 rounded-[8px] flex justify-center items-center bg-[#fff] "
          }
        >
          <img src={icon} alt="Icon" className="" />{" "}
        </div>
        <div className="space-y-2">
          <h1 className="font-[600] text-[28px] leading-[100%] text-[#fff]">
            {value}
          </h1>
          <p className="font-[500] text-[16px] leading-[100%] text-[#fff]">
            {title}
          </p>
        </div>
      </div>

      <div className=" space-x-2 lg:hidden flex items-center ">
        <div className="w-10 h-10 rounded-full flex justify-center items-center bg-[#D5EBDF]">
          <img src={icon} alt="Icon" className="" />{" "}
        </div>
        <div className="space-y-2">
          <h1 className="font-[600] text-[14px] lg:text-[28px]  leading-[100%] text-[#181818]">
            {value}
          </h1>
          <p className="font-[500] text-[12px] lg:text-[16px]  leading-[100%] text-[#555]">
            {title}
          </p>
        </div>
      </div>
    </>
  );
};

const DataGrid = ({
  activity,
  loading,
  messages,
  bookings,
  weeklyData,
}: {
  activity: ActivityProps[];
  loading: boolean;
  messages: MessageProps[];
  bookings: Bookings;
  weeklyData: WeeklyDataPoint[];
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-10">
        <div className="grid grid-rows-2 gap-6 h-[45rem]">
          <Chart weeklyData={weeklyData} />
          <Activity activity={activity} loading={loading} />
        </div>
      </div>
      <div className="lg:col-span-1">
        <Chat messages={messages} loading={loading} />
      </div>
    </div>
  );
};

// TimeFilterDropdown.tsx
const TimeFilterDropdown = ({
  selectedOption,
  setSelectedOption,
}: {
  selectedOption: string;
  setSelectedOption: (value: string) => void;
}) => {
  const options = ["This Week", "This Month", "This Year"];
  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center space-x-2 cursor-pointer px-3 py-2">
            <p className="text-sm lg:text-base font-semibold text-[#181818]">
              {selectedOption}
            </p>
            <ChevronDown />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-full mt-2 border rounded-lg bg-white shadow-lg space-y-2"
          align="start"
        >
          {options.map((option) => (
            <DropdownMenuItem
              key={option}
              onClick={() => setSelectedOption(option)}
              className={`px-3 py-2 space-y-2 cursor-pointer ${
                selectedOption === option
                  ? "font-bold text-white bg-gray-400"
                  : "text-gray-700"
              }`}
            >
              {option}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default page;

type ActivityProps = {
  user_full_name: string;
  amount: number;
  date: string;
  profile_picture: string;
  booking_type: string;
};

type MessageProps = {
  content: string;
  created_at: string;
  id: string;
  link: string;
  sender: {
    id: number;
    name: string;
    email: string;
  } | null;
  title: string;
  type: string;
};

type RevenueProps = {
  total_revenue: number;
  transfer_revenue: number;
  flight_revenue: number;
  currency: string;
};

type UsersProps = {
  total_normal_users: number;
};

type Bookings = {
  total_bookings: number;
};

type BookingsProps = {
  booking_type: "flight" | "stay" | "stays" | "hotel" | "transfer" | "transfers";
  created_at: string;
  details: {
    arrival?: string;
    departure?: string;
    departure_date?: string;
    flight_number?: string;
  };
  email: string;
  id: string;
  specific_id: number;
  status: string;
  total_amount: number | null;
  user: string;
};

type WeeklyDataPoint = {
  day: string;
  flight: number;
  hotel: number;
  transfer: number;
  total_amount: number;
};
