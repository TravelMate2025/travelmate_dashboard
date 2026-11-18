"use client";
import React from "react";
import PopularRoutesSection from "@/components/pages/flights-home/PopularRoutesSection";
import CampaignsSection from "@/components/pages/flights-home/CampaignsSection";
import RouteFaresSection from "@/components/pages/flights-home/RouteFaresSection";

/** Flights home (flights_plan.md F2d): what the web and app Flights home
 *  shows: popular routes per country, promo cards, and their prices. */
const FlightsHomePage = () => (
  <div className="p-4 space-y-8">
    <div className="space-y-1">
      <h1 className="lg:text-[20px] text-[16px] font-semibold text-[#181818]">Flights home content</h1>
      <p className="text-[14px] text-[#4E4F52]">What customers see on the Flights home in the web and mobile apps.</p>
    </div>
    <PopularRoutesSection />
    <div className="w-full h-[1px] bg-[#EBECED]" />
    <CampaignsSection />
    <div className="w-full h-[1px] bg-[#EBECED]" />
    <RouteFaresSection />
  </div>
);

export default FlightsHomePage;
