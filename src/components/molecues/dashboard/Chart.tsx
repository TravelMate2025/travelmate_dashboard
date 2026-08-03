import React from "react";
import { useRouter } from "next/navigation";
import {
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  XAxis,
  YAxis,
  Line,
  Tooltip,
} from "recharts";
import { WeeklyDataPoint } from "@/app/Dashboard/page";

const Chart = ({ weeklyData }: { weeklyData: WeeklyDataPoint[] }) => {
  const router = useRouter();
  const NGNNaira = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "NGN",
  });
  return (
    <div className="bg-white lg:px-6 px-2 py-6 rounded-2xl overflow-hidden h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="lg:text-xl text-sm font-semibold">Booking Trends</h2>
        <div className="hidden lg:block">
          <Legend />
        </div>
        <div
          className="ld:text-sm text-xs text-blue-600 cursor-pointer hover:text-blue-800 "
          onClick={() => router.push("/Dashboard/reports")}
        >
          View full report
        </div>
      </div>
      <div className="flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={weeklyData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" className="text-xs" />
            <YAxis
              className="text-[8px]"
              tickFormatter={(value) =>
                new Intl.NumberFormat("en-NG", {
                  style: "currency",
                  currency: "NGN",
                  maximumFractionDigits: 0,
                })
                  .format(value)
                  .replace(/\.00/, "")
              }
            />

            <Tooltip />
            <Line
              type="monotone"
              dataKey="flight"
              stroke="#FF6D00"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="hotel"
              stroke="#00C853"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="transfer"
              stroke="#2962FF"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="lg:hidden flex justify-center mt-1">
        <Legend />
      </div>
    </div>
  );
};

export default Chart;

export const Legend = () => {
  return (
    <div className="flex space-x-6 items-center">
      <div className="flex space-x-1 items-center cursor-pointer ">
        <img src="/assets/icons/ana-airplane.svg" alt="" className="" />
        <span className="text-[12px] font-[500] leading-[100%] text-[#181818]  ">
          Flight
        </span>
      </div>
      <div className="flex space-x-1 items-center cursor-pointer ">
        <img src="/assets/icons/ana-bed.svg" alt="" className="" />
        <span className="text-[12px] font-[500] leading-[100%] text-[#181818]  ">
          Hotel
        </span>
      </div>
      <div className="flex space-x-1 items-center cursor-pointer ">
        <img src="/assets/icons/ana-car.svg" alt="" className="" />
        <span className="text-[12px] font-[500] leading-[100%] text-[#181818]  ">
          Transfer
        </span>
      </div>
    </div>
  );
};
