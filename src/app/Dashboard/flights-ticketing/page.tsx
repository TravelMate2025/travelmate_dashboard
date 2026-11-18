"use client";
import React from "react";
import TicketingSettingsForm from "@/components/pages/flights-ticketing/TicketingSettingsForm";

/** Flights → Ticketing settings (flights_plan.md F4): how orders reach the
 *  consolidator. Super admins only; the backend enforces it. */
const FlightsTicketingPage = () => (
  <div className="p-4 space-y-8">
    <div className="space-y-1">
      <h1 className="lg:text-[20px] text-[16px] font-semibold text-[#181818]">Flight ticketing settings</h1>
      <p className="text-[14px] text-[#4E4F52]">How bookings reach our consolidator for ticketing, and how long customers have to pay.</p>
    </div>
    <TicketingSettingsForm />
  </div>
);

export default FlightsTicketingPage;
