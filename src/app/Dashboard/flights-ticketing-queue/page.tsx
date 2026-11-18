"use client";
import React from "react";
import TicketingQueue from "@/components/pages/flights-ticketing-queue/TicketingQueue";

/** Flights → Ticketing queue (flights_plan.md F6): paid bookings until every traveller has a ticket. */
const FlightsTicketingQueuePage = () => (
  <div className="p-4 space-y-6">
    <div className="space-y-1">
      <h1 className="lg:text-[20px] text-[16px] font-semibold text-[#181818]">Flight ticketing queue</h1>
      <p className="text-[14px] text-[#4E4F52]">
        Paid bookings until every traveller has an e-ticket. Tickets are picked up from Amadeus automatically; enter them here if the consolidator sends them another way.
      </p>
    </div>
    <TicketingQueue />
  </div>
);

export default FlightsTicketingQueuePage;
