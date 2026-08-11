"use client";
import { useState } from "react";
import { MessageTabContent } from "@/components/molecues/support/Chats/MessageChat";
import { Filter } from "@/components/molecues/support/Reuseables";
import React from "react";
import { useRouter } from "next/navigation";

type Props = {};

const page = (props: Props) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedStartDate, setSelectedStartDate] = useState<
    string | undefined
  >(undefined);
  const [selectedEndDate, setSelectedEndDate] = useState<string | undefined>(
    undefined
  );
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center"
          aria-label="Go back"
        >
          <img src="/assets/icons/arrow-back.svg" alt="Go back" className="" />
        </button>
        <Filter
          activeTab={"chat"}
          setSearchTerm={setSearchTerm}
          searchTerm={searchTerm}
          selectedStartDate={selectedStartDate ?? ""}
          setSelectedStartDate={(value) => setSelectedStartDate(value)}
          selectedEndDate={selectedEndDate ?? ""}
          setSelectedEndDate={(value) => setSelectedEndDate(value)}
          selectedDate={selectedDate}
          setSelectedDate={(value) => setSelectedDate(value ?? "")}
          setDatePickerOpen={setDatePickerOpen}
          datePickerOpen={datePickerOpen}
        />
      </div>

      <div className="p-4 rounded-[20px] bg-white shadow-md">
        <MessageTabContent
          searchTerm={searchTerm}
          selectedEndDate={selectedEndDate ?? ""}
          selectedStartDate={selectedStartDate ?? ""}
        />
      </div>
    </div>
  );
};

export default page;
