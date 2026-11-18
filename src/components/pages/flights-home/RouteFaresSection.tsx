"use client";
import React, { useCallback, useEffect, useState } from "react";
import FlightsHomeService, { RouteFare } from "@/services/flightsHome";
import { pricingErrorMessage } from "@/hooks/api/pricing";
import { showErrorToast, showSuccessToast } from "@/utils/toasters";

const th = "px-4 py-3 text-left text-[12px] lg:text-[14px] font-[500] text-[#181818]";
const td = "px-4 py-3 text-[12px] lg:text-[14px] text-[#181818]";

/** The "from" prices behind the home sections: the cheapest one-way adult
 *  fare per route and cabin, from searches and a daily refresh. Shown to
 *  customers in their currency with markup; hidden once older than 7 days. */
const RouteFaresSection = () => {
  const [fares, setFares] = useState<RouteFare[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setFares(await FlightsHomeService.listFares());
    } catch (e) {
      showErrorToast({ message: pricingErrorMessage(e) });
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const res = await FlightsHomeService.refreshFares();
      showSuccessToast({ message: `Prices refreshed (${res.data.searches} searches)` });
      load();
    } catch (e) {
      showErrorToast({ message: pricingErrorMessage(e) });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <section className="space-y-4" aria-labelledby="fares-h">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="fares-h" className="text-[16px] lg:text-[18px] font-semibold text-[#181818]">&quot;From&quot; prices</h2>
        <button type="button" onClick={refresh} disabled={refreshing} className="text-[#023E8A] border border-[#023E8A] rounded-[8px] px-4 py-2 text-[14px] font-[500] disabled:opacity-60">
          {refreshing ? "Searching… (up to a minute)" : "Refresh now"}
        </button>
      </div>
      <p className="text-[13px] text-[#4E4F52]">
        Cheapest one-way fare for one adult, in the airline&apos;s currency before markup. Refreshed daily for the popular routes and from customers&apos; searches.
      </p>
      <div className="border border-gray-300 rounded-lg overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="bg-white">
              <th className={th}>Route</th><th className={th}>Cabin</th><th className={th}>From</th><th className={th}>Flying</th><th className={th}>Seen</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-4">Loading...</td></tr>
            ) : fares.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-4 text-[#4E4F52]">No prices yet: use Refresh now.</td></tr>
            ) : (
              fares.map((f) => (
                <tr key={`${f.origin_code}-${f.destination_code}-${f.cabin}`} className="border-t border-gray-200">
                  <td className={`${td} font-[600]`}>{f.origin_code} → {f.destination_code}</td>
                  <td className={td}>{f.cabin.replace("_", " ").toLowerCase()}</td>
                  <td className={td}>{Number(f.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} {f.currency}</td>
                  <td className={td}>{new Date(f.departure_date).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</td>
                  <td className={td}>{new Date(f.searched_at).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default RouteFaresSection;
