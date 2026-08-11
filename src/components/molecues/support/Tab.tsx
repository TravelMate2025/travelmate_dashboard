"use client";
import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useRouter, useSearchParams } from "next/navigation";
import { FaqSection } from "./Faq";
import { TicketTabContent } from "./Tickets";
import { Filter } from "./Reuseables";
import { format } from "date-fns";
import { MessageTabContent } from "./Chats/MessageChat";

const TicketTable: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromQuery = searchParams.get("tab");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOption, setSelectedOption] = useState("");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState<
    string | undefined
  >(undefined);
  const [selectedEndDate, setSelectedEndDate] = useState<string | undefined>(
    undefined
  );
  const [selectedDate, setSelectedDate] = useState<string | undefined>(
    undefined
  );

  // Track active tab with localStorage persistence
  const [activeTab, setActiveTab] = useState<string>("ticket");

  // Query param has priority, then fall back to saved tab
  useEffect(() => {
    if (tabFromQuery === "ticket" || tabFromQuery === "chat" || tabFromQuery === "faq") {
      setActiveTab(tabFromQuery);
      return;
    }

    if (typeof window !== "undefined") {
      const savedTab = window.localStorage.getItem("activeTab");
      if (savedTab) {
        setActiveTab(savedTab);
      }
    }
  }, [tabFromQuery]);

  // Save the active tab to localStorage on change
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("activeTab", activeTab);
    }
  }, [activeTab]);

  // Reset filters when the active tab changes
  useEffect(() => {
    setSearchTerm("");
    setSelectedOption("");
    setSelectedDate(undefined);
  }, [activeTab]);

  return (
    <div className="pb-20 lg:pb-0">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value)}
        className="space-y-[40px]"
      >
        <div className="flex justify-between items-center flex-col lg:flex-row gap-4">
          <TabsList className="lg:w-[436px] w-full bg-[#EBECED] rounded-[12px] flex justify-between items-center h-[64px]">
            <TabsTrigger
              value="ticket"
              className="px-[24px] h-full rounded-[8px] data-[state=active]:bg-white data-[state=active]:text-black flex items-center justify-center"
            >
              Ticket
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              className="px-[24px] h-full rounded-[8px] data-[state=active]:bg-white data-[state=active]:text-black flex items-center justify-center"
            >
              Chat
            </TabsTrigger>
            <TabsTrigger
              value="faq"
              className="px-[24px] h-full rounded-[8px] data-[state=active]:bg-white data-[state=active]:text-black flex items-center justify-center"
            >
              FAQ
            </TabsTrigger>
          </TabsList>

          {activeTab !== "faq" && (
            <div className="hidden lg:flex gap-6 ">
              {activeTab === "chat" ? (
                <div
                  className="p-4 rounded-[8px] bg-[#023E8A] text-[20px] font-[500] text-[#fff] cursor-pointer"
                  onClick={() => router.push("/Dashboard/support/chats")}
                >
                  All Chat
                </div>
              ) : (
                <>
                  <div
                    className="p-4 rounded-[8px] border-[1px] border-[#023E8A] text-[20px] font-[500] text-[#023E8A] cursor-pointer"
                    onClick={() => router.push("/Dashboard/support/ticket")}
                  >
                    View all tickets
                  </div>
                  <div
                    className="p-4 rounded-[8px] bg-[#023E8A] text-[20px] font-[500] text-[#fff] cursor-pointer"
                    onClick={() =>
                      router.push("/Dashboard/support/ticket/escalates")
                    }
                  >
                    All Escalated tickets
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {activeTab !== "faq" && (
          <Filter
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            datePickerOpen={datePickerOpen}
            setDatePickerOpen={setDatePickerOpen}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            activeTab={activeTab}
            selectedStartDate={selectedStartDate}
            setSelectedStartDate={setSelectedStartDate}
            selectedEndDate={selectedEndDate}
            setSelectedEndDate={setSelectedEndDate}
          />
        )}

        <div className="bg-[#FFFFFF] py-[16px] rounded-[8px] shadow-md w-full ">
          <TabsContent value="ticket">
            <TicketTabContent
              searchTerm={searchTerm}
              date={selectedDate ?? ""}
            />
          </TabsContent>
          <TabsContent value="chat">
            <MessageTabContent
              selectedOption={selectedOption}
              searchTerm={searchTerm}
              selectedEndDate={selectedEndDate}
              selectedStartDate={selectedStartDate}
            />
          </TabsContent>
          <TabsContent value="faq">
            <FaqSection />
          </TabsContent>
        </div>
      </Tabs>

      {activeTab !== "faq" && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 flex justify-around py-3 px-4 shadow-lg z-20">
          {activeTab === "chat" ? (
            <button
              onClick={() => router.push("/Dashboard/support/chats")}
              className="bg-[#023E8A] text-white rounded-md px-6 py-2 font-semibold w-full "
            >
              All Chat
            </button>
          ) : (
            <>
              <button
                onClick={() => router.push("/Dashboard/support/ticket")}
                className="bg-transparent border border-[#023E8A] text-[#023E8A] rounded-md px-6 py-2 font-semibold"
              >
                View all tickets
              </button>
              <button
                onClick={() =>
                  router.push("/Dashboard/support/ticket/escalates")
                }
                className="bg-[#023E8A] text-white rounded-md px-6 py-2 font-semibold"
              >
                All Escalated tickets
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TicketTable;
