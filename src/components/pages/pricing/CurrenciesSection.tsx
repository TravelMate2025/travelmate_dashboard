"use client";
import React, { useState } from "react";
import PricingService, { SellingCurrency } from "@/services/pricing";
import { pricingErrorMessage, useCurrencies } from "@/hooks/api/pricing";
import { showErrorToast, showSuccessToast } from "@/utils/toasters";

const th = "px-4 py-3 text-left text-[12px] lg:text-[14px] font-[500] text-[#181818]";
const td = "px-4 py-3 text-[12px] lg:text-[14px] text-[#181818]";

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "Never";

/** Selling currencies with their latest rate (Open Exchange Rates). A rate
 *  older than the limit stops sales in that currency: prices show in USD. */
const CurrenciesSection = () => {
  const { loading, currencies, error, refresh } = useCurrencies();
  const [refreshing, setRefreshing] = useState(false);

  const refreshRates = async () => {
    setRefreshing(true);
    try {
      await PricingService.refreshRates();
      showSuccessToast({ message: "Exchange rates refreshed" });
      refresh();
    } catch (e) {
      showErrorToast({ message: pricingErrorMessage(e) });
    } finally {
      setRefreshing(false);
    }
  };

  const toggle = async (c: SellingCurrency) => {
    try {
      await PricingService.updateCurrency(c.code, { is_active: !c.is_active });
      refresh();
    } catch (e) {
      showErrorToast({ message: pricingErrorMessage(e) });
    }
  };

  return (
    <section className="space-y-4" aria-labelledby="currencies-h">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="currencies-h" className="text-[16px] lg:text-[18px] font-semibold text-[#181818]">Currencies and exchange rates</h2>
        <button type="button" onClick={refreshRates} disabled={refreshing}
          className="text-[#023E8A] border border-[#023E8A] rounded-[8px] px-4 py-2 text-[14px] font-[500] disabled:opacity-60">
          {refreshing ? "Refreshing…" : "Refresh rates now"}
        </button>
      </div>
      <p className="text-[13px] text-[#4E4F52]">
        Rates come from Open Exchange Rates every 6 hours. If a rate is more than about a day old, customers see prices in US dollars instead.
      </p>
      {error && <p role="alert" className="text-[14px] text-red-600">{error}</p>}
      <div className="border border-gray-300 rounded-lg overflow-x-auto">
        <table className="w-full min-w-[560px]">
          <thead>
            <tr className="bg-white">
              <th className={th}>Currency</th>
              <th className={th}>1 USD =</th>
              <th className={th}>Updated</th>
              <th className={th}>Status</th>
              <th className={th}>On sale</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-4">Loading...</td></tr>
            ) : (
              currencies.map((c) => (
                <tr key={c.code} className="border-t border-gray-200">
                  <td className={`${td} font-[500]`}>{c.symbol} {c.code} <span className="text-[#4E4F52] font-normal">· {c.name}</span></td>
                  <td className={td}>{c.code === "USD" ? "1" : c.rate_per_usd ? `${Number(c.rate_per_usd).toLocaleString(undefined, { maximumFractionDigits: 6 })} ${c.code}` : "—"}</td>
                  <td className={td}>{c.code === "USD" ? "—" : when(c.fetched_at)}</td>
                  <td className={td}>
                    {c.is_stale ? (
                      <span className="rounded-full bg-[#FDECEA] text-[#B42318] px-2 py-1 text-[12px] font-[600]">Stale: selling in USD</span>
                    ) : (
                      <span className="rounded-full bg-[#E7F6EE] text-[#2D9C5E] px-2 py-1 text-[12px] font-[600]">OK</span>
                    )}
                  </td>
                  <td className={td}>
                    <input type="checkbox" aria-label={`${c.code} on sale`} checked={c.is_active}
                      disabled={c.code === "USD"} onChange={() => toggle(c)} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default CurrenciesSection;
