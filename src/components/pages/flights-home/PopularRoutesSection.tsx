"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import FlightsHomeService, { PopularRoute } from "@/services/flightsHome";
import { pricingErrorMessage } from "@/hooks/api/pricing";
import { showErrorToast, showSuccessToast } from "@/utils/toasters";

const th = "px-4 py-3 text-left text-[12px] lg:text-[14px] font-[500] text-[#181818]";
const td = "px-4 py-3 text-[12px] lg:text-[14px] text-[#181818]";
const input = "py-2 px-3 border-[#818489] border-[1px] rounded-[8px] outline-none bg-white uppercase";
const countryName = (code: string) => (code ? code : "Everyone else");

/** "Popular routes" on the Flights home, per visitor country. A country with
 *  no routes of its own sees the "Everyone else" list. The first route also
 *  feeds "Browse by class". */
const PopularRoutesSection = () => {
  const [routes, setRoutes] = useState<PopularRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [country, setCountry] = useState("NG");
  const [newCountry, setNewCountry] = useState("");
  const [form, setForm] = useState({ origin_code: "", destination_code: "" });
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRoutes(await FlightsHomeService.listRoutes());
      setError(null);
    } catch (e) {
      setError(pricingErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const countries = useMemo(() => Array.from(new Set(["NG", "GB", "", ...routes.map((r) => r.country_code), country])), [routes, country]);
  const shown = routes.filter((r) => r.country_code === country).sort((a, b) => a.position - b.position || a.id - b.id);

  const run = async (work: () => Promise<unknown>, done?: string) => {
    try {
      await work();
      if (done) showSuccessToast({ message: done });
      await load();
    } catch (e) {
      showErrorToast({ message: pricingErrorMessage(e) });
    }
  };

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    run(() => FlightsHomeService.createRoute({ ...form, country_code: country, position: shown.length, is_active: true }), "Route added")
      .then(() => setForm({ origin_code: "", destination_code: "" }));
  };

  const move = (index: number, step: -1 | 1) => {
    const other = shown[index + step];
    if (!other) return;
    const me = shown[index];
    run(async () => {
      await FlightsHomeService.updateRoute(me.id, { position: index + step });
      await FlightsHomeService.updateRoute(other.id, { position: index });
    });
  };

  return (
    <section className="space-y-4" aria-labelledby="routes-h">
      <h2 id="routes-h" className="text-[16px] lg:text-[18px] font-semibold text-[#181818]">Popular routes</h2>
      <p className="text-[13px] text-[#4E4F52]">
        Shown to visitors from the chosen country, in this order. Countries without their own list see &quot;Everyone else&quot;.
        The first route also shows fares by class. Prices come from recent searches.
      </p>
      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Country">
        {countries.map((c) => (
          <button key={c || "all"} type="button" role="tab" aria-selected={country === c} onClick={() => setCountry(c)}
            className={`px-3 py-1.5 rounded-full text-[13px] font-[500] ${country === c ? "bg-[#023E8A] text-white" : "bg-white border border-gray-300"}`}>
            {countryName(c)}
          </button>
        ))}
        <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); if (/^[A-Za-z]{2}$/.test(newCountry)) { setCountry(newCountry.toUpperCase()); setNewCountry(""); } }}>
          <input aria-label="Add a country" className={`${input} w-[90px]`} maxLength={2} placeholder="e.g. GH" value={newCountry} onChange={(e) => setNewCountry(e.target.value)} />
          <button type="submit" className="text-[#023E8A] text-[13px] font-[600]">Add country</button>
        </form>
      </div>

      {error && <p role="alert" className="text-[14px] text-red-600">{error}</p>}
      <div className="border border-gray-300 rounded-lg overflow-x-auto">
        <table className="w-full min-w-[520px]">
          <thead>
            <tr className="bg-white">
              <th className={th}>Order</th><th className={th}>From</th><th className={th}>To</th><th className={th}>Shown</th>
              <th className={th}><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-4">Loading...</td></tr>
            ) : shown.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-4 text-[#4E4F52]">No routes for {countryName(country)} yet{country ? ": these visitors see the \"Everyone else\" list." : "."}</td></tr>
            ) : (
              shown.map((r, i) => (
                <tr key={r.id} className={`border-t border-gray-200 ${r.is_active ? "" : "opacity-60"}`}>
                  <td className={td}>
                    <button type="button" aria-label={`Move ${r.origin_code} to ${r.destination_code} up`} disabled={i === 0} onClick={() => move(i, -1)} className="px-1 disabled:opacity-30">↑</button>
                    <button type="button" aria-label={`Move ${r.origin_code} to ${r.destination_code} down`} disabled={i === shown.length - 1} onClick={() => move(i, 1)} className="px-1 disabled:opacity-30">↓</button>
                  </td>
                  <td className={`${td} font-[600]`}>{r.origin_code}</td>
                  <td className={`${td} font-[600]`}>{r.destination_code}</td>
                  <td className={td}>
                    <input type="checkbox" aria-label={`${r.origin_code} to ${r.destination_code} shown`} checked={r.is_active}
                      onChange={() => run(() => FlightsHomeService.updateRoute(r.id, { is_active: !r.is_active }))} />
                  </td>
                  <td className={td}>
                    <button type="button" className="text-[#B42318] font-semibold"
                      onClick={() => window.confirm(`Remove ${r.origin_code} → ${r.destination_code}?`) && run(() => FlightsHomeService.deleteRoute(r.id), "Route removed")}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <form onSubmit={add} className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="route-from" className="block text-[13px] font-[500] mb-1">From (airport or city code)</label>
          <input id="route-from" className={`${input} w-[140px]`} maxLength={3} placeholder="LOS" value={form.origin_code} onChange={(e) => setForm({ ...form, origin_code: e.target.value })} required />
        </div>
        <div>
          <label htmlFor="route-to" className="block text-[13px] font-[500] mb-1">To</label>
          <input id="route-to" className={`${input} w-[140px]`} maxLength={3} placeholder="LON" value={form.destination_code} onChange={(e) => setForm({ ...form, destination_code: e.target.value })} required />
        </div>
        <button type="submit" className="bg-[#023E8A] text-white rounded-[8px] px-4 py-2 text-[14px] font-[500]">Add route for {countryName(country)}</button>
      </form>
    </section>
  );
};

export default PopularRoutesSection;
