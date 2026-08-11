import React, { useEffect, useState } from 'react'
import { ActivityProps } from '@/app/Dashboard/dashboard-shared';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import Loading from '@/app/Dashboard/admin/loading';

const Activity = ({
  activity,
  loading,
}: {
  activity: ActivityProps[];
  loading: boolean;
}) => {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const NGNNaira = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "NGN",
  });

  return (
    <div className="bg-white h-full lg:p-6 rounded-2xl overflow-y-auto p-3">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="lg:text-lg text-sm font-medium text-[#181818]">
            Recent Activities
          </h1>
          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => router.push("/Dashboard/bookings")}
          >
            <p className="lg:text-base text-xs font-medium text-[#023E8A]">See all</p>
            <ChevronRight stroke="#023E8A" />
          </div>
        </div>
        <div className="space-y-4">
          {loading ? (
            <Loading />
          ) : activity.length === 0 ? (
            <p className="text-center mt-auto">No recent activities</p>
          ) : (
            activity.map((act, i) => (
              <div
                key={i}
                className="flex md:justify-center justify-between lg:gap-24 gap-16 w-full items-center cursor-pointer hover:bg-[#f1f1f1] rounded-xl py-2 lg:px-3 px-2"
                onClick={() => router.push("/Dashboard/user")}
              >
                <div className="flex items-center space-x-3 lg:w-[200px] w-full">
                  <img
                    src="/assets/images/profile-image.svg"
                    alt=""
                    className="lg:w-10 w-6"
                  />
                  <p className="lg:text-base text-sm font-medium text-[#181818]">
                    {act.user_full_name}
                  </p>
                </div>
                <p className="lg:text-sm text-xs text-[#181818]">
                  {act.booking_type}
                </p>
                <div className="flex items-center ml-auto space-x-2">
                  <div className="text-right">
                    <p className="lg:text-sm text-xs text-[#181818]">
                      {NGNNaira.format(act.amount)}
                    </p>
                    <p className="lg:text-sm text-xs text-[#9B9EA4]">
                      {isMounted
                        ? new Date(act.date).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "--:--"}
                    </p>
                  </div>
                  <img
                    src="/assets/icons/chevron-down.svg"
                    alt=""
                    className="w-5"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Activity
