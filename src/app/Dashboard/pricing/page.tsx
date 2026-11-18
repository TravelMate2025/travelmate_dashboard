"use client";
import React, { useState } from "react";
import MarkupRulesSection from "@/components/pages/pricing/MarkupRulesSection";
import CurrenciesSection from "@/components/pages/pricing/CurrenciesSection";
import PricePreview from "@/components/pages/pricing/PricePreview";

type Product = "flights" | "transfers";

/** Pricing (flights_plan.md F2b): markup rules per product, selling
 *  currencies and exchange rates, and a price preview. */
const PricingPage = () => {
  const [product, setProduct] = useState<Product>("flights");
  const tab = (p: Product, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={product === p}
      onClick={() => setProduct(p)}
      className={`px-4 py-2 rounded-full text-[14px] font-[500] ${product === p ? "bg-[#023E8A] text-white" : "bg-white border border-gray-300 text-[#181818]"}`}
    >
      {label}
    </button>
  );

  return (
    <div className="p-4 space-y-8">
      <div className="space-y-1">
        <h1 className="lg:text-[20px] text-[16px] font-semibold text-[#181818]">Markup and exchange rates</h1>
        <p className="text-[14px] text-[#4E4F52]">How supplier prices become what customers pay.</p>
      </div>
      <div role="tablist" aria-label="Product" className="flex gap-2">
        {tab("flights", "Flights")}
        {tab("transfers", "Transfers")}
      </div>
      <MarkupRulesSection key={`rules-${product}`} product={product} />
      <div className="w-full h-[1px] bg-[#EBECED]" />
      <PricePreview key={`preview-${product}`} product={product} />
      <div className="w-full h-[1px] bg-[#EBECED]" />
      <CurrenciesSection />
    </div>
  );
};

export default PricingPage;
