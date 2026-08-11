import React from "react";
import {
  TimeFilterDropdown,
  Bookings,
  UsersProps,
  RevenueProps,
  StatCard,
} from "@/app/Dashboard/dashboard-shared";
const Statistics = ({
  bookings,
  revenue,
  users,
  selectedOption,
  setSelectedOption,
  isSuperadmin,
}: {
  bookings: Bookings;
  revenue: RevenueProps | null;
  users: UsersProps;
  selectedOption: string;
  setSelectedOption: (value: string) => void;
  isSuperadmin?: boolean;
}) => {
  const NGNNaira = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  function formatMoney(number: number) {
    if (Math.abs(number) >= 1000000) {
      return (number / 1000000).toFixed(1) + "M";
    }
    return number?.toLocaleString();
  }

  return (
    <div className="flex justify-between items-start flex-col-reverse lg:flex-row gap-y-4 lg:gap-0 px-3 ">
      <div className="space-y-6">
        <TimeFilterDropdown
          selectedOption={selectedOption}
          setSelectedOption={setSelectedOption}
        />
        <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="Users"
            value={users?.total_normal_users?.toLocaleString() || "0"}
            color="#50AC79"
            icon="/assets/icons/ana-users.svg"
            smColor="#D5EBDF"
          />
          <StatCard
            title="Bookings"
            value={bookings?.total_bookings?.toLocaleString() || "0"}
            color="#023E8A"
            icon="/assets/icons/ana-bookings.svg"
            smColor="#CCD8E8"
          />
          {isSuperadmin && (
            <StatCard
              title="Revenue"
              value={
                revenue
                  ? Math.abs(revenue?.total_revenue) >= 1000000
                    ? `₦${formatMoney(revenue.total_revenue)}`
                    : NGNNaira.format(revenue.total_revenue)
                  : "₦0"
              }
              color="#FF6F1E"
              icon="/assets/icons/ana-revenue.svg"
              smColor="#FFCFB4"
            />
          )}
        </div>
      </div>
      {isSuperadmin && (
        <div className="space-y-2">
          <p className="text-sm lg:text-base font-semibold text-[#181818]">
            Total Revenue
          </p>

          <h1 className="text-2xl font-semibold text-[#023E8A]">
            {revenue ? NGNNaira.format(Number(revenue.total_revenue)) : "₦0"}
          </h1>
        </div>
      )}
    </div>
  );
};

export default Statistics;
