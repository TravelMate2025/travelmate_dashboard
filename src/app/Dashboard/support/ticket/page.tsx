"use client";
import ContentWrapper from "@/components/reuseables/ContentWrapper";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Filter } from "@/components/molecues/support/Reuseables";
import { TicketTabContent } from "@/components/molecues/support/Tickets";

const Page = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOption, setSelectedOption] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | undefined>(
    undefined
  );
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <img
            src="/assets/icons/arrow-back.svg"
            alt=""
            className=""
            onClick={() => router.back()}
          />
          <h2 className="text-[20px] font-[600] text-[#181818]">Tickets</h2>
        </div>

        <div
          className="bg-[#023E8A] rounded-[8px] px-4 py-3 text-[16px] font-[500] cursor-pointer text-[#fff]"
          onClick={() => router.push("/Dashboard/support/ticket/escalates")}
        >
          All Escalated tickets
        </div>
      </div>

      <Filter
        selectedOption={selectedOption}
        setSelectedOption={setSelectedOption}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterOption={"ticket"}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        datePickerOpen={datePickerOpen}
        setDatePickerOpen={setDatePickerOpen}
      />
      <div className="bg-[#FFFFFF] py-[16px] rounded-[8px] shadow-md">
        <TicketTabContent
          selectedOption={selectedOption}
          searchTerm={searchTerm}
          date={selectedDate}
        />
      </div>
    </div>
  );
};

export default Page;
