"use client";
import React from "react";
import { useState, useEffect } from "react";
import EditDialog from "@/components/molecues/cms/EditDialog";
import { useGetAllServices } from "@/hooks/api/cms";
import { useMyRoles } from "@/hooks/api/roles";
import Link from "next/link";
const page = () => {
  return (
    <div>
      <CmsContent />
    </div>
  );
};
const CmsContent = () => {
  const { loading: roleLoading, data } = useMyRoles({ modalVisible: true });
  const { loading, data: services, refresh } = useGetAllServices({});

  const canEdit =
    data?.name == "Content Manager" || data?.name == "Super Admin";
  return (
    <div className="p-4">
      <div className="space-y-6">
        <h1 className="lg:text-[20px] text-[16px] font-semibold text-[#181818]">
          Service Commission Settings
        </h1>
        <div className="space-y-[40px]">
          <div className="border border-gray-300 rounded-lg">
            <table className="w-full border border-gray-300 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-white">
                  <th className="px-6 py-3 text-left text-[12px] lg:text-[16px] font-[500] text-[#181818]">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-[12px] lg:text-[16px] font-[500] text-[#181818]">
                    Commission (%)
                  </th>
                  <th className="px-6 py-3 text-left text-[12px] lg:text-[16px] font-[500] text-[#181818]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading || roleLoading ? (
                  <tr>
                    <td colSpan={3} className="text-center py-4">
                      Loading...
                    </td>
                  </tr>
                ) : services?.length > 0 ? (
                  services.map((service: any, index: number) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-100 [&>*]:px-6 [&>*]:py-3"
                    >
                      <td className="text-[12px] lg:text-[16px] font-[400] text-[#181818] capitalize">
                        {service.service_type}
                      </td>
                      <td className="text-[12px] lg:text-[16px] font-[400] text-[#181818] capitalize">
                        {service.percentage}
                      </td>
                      <td>
                        <div className="flex space-x-2 items-center cursor-pointer">
                          <img
                            src="/assets/icons/mode_edit.svg"
                            alt="Edit"
                            className="w-4 h-4 lg:w-5 lg:h-5"
                          />
                          <EditDialog
                            serviceId={service.id}
                            refresh={refresh}
                            canEdit={canEdit}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center py-4">
                      No data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="w-full h-[1px] bg-[#EBECED]"></div>

        <div className="p-[12px] flex space-x-[10px] bg-[#CCD8E833] border-[#023E8A] border rounded-lg items-start">
          <img src="/assets/icons/in-fo.svg" alt="Info" />
          <div>
            <h1 className="text-[16px] font-medium text-[#023E8A]">
              How Service Commission Works
            </h1>
            <p className="text-[14px] lg:text-sm leading-[25px] font-medium text-[#181818]">
              When the third party provider returns a base price, we add your
              commission percentage on top. Example: Hotel costs $500 from the
              third party provider → 10% commission → Customer pays $550 → You
              keep $50.
            </p>
          </div>
        </div>

        <div className="w-full h-[1px] bg-[#EBECED]"></div>

        <div className="lg:px-12 py-3 cursor-pointer w-full bg-[#D5EBDF] rounded-lg text-center">
          <Link
            href="/Dashboard/cms/legal"
            className="uppercase text-[#2D9C5E]"
          >
            Go to Information Policies
          </Link>
        </div>
      </div>
    </div>
  );
};

export default page;
