"use client";
import React, { useCallback, useEffect, useState } from "react";
import FlightsHomeService, { Campaign } from "@/services/flightsHome";
import { pricingErrorMessage } from "@/hooks/api/pricing";
import { showErrorToast } from "@/utils/toasters";
import CampaignDialog from "./CampaignDialog";

const th = "px-4 py-3 text-left text-[12px] lg:text-[14px] font-[500] text-[#181818]";
const td = "px-4 py-3 text-[12px] lg:text-[14px] text-[#181818]";
const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "No end");

const status = (c: Campaign) => {
  const now = Date.now();
  if (!c.is_active) return ["Off", "bg-gray-100 text-[#4E4F52]"];
  if (new Date(c.starts_at).getTime() > now) return ["Scheduled", "bg-[#E8EEF7] text-[#023E8A]"];
  if (c.ends_at && new Date(c.ends_at).getTime() <= now) return ["Ended", "bg-gray-100 text-[#4E4F52]"];
  return ["Live", "bg-[#E7F6EE] text-[#2D9C5E]"];
};

/** Promo cards on the Flights home. Visitors see the live card for their
 *  country, else the live card for every country (latest start wins). */
const CampaignsSection = () => {
  const [items, setItems] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await FlightsHomeService.listCampaigns());
      setError(null);
    } catch (e) {
      setError(pricingErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const remove = async (c: Campaign) => {
    if (!window.confirm(`Delete "${c.headline}"?`)) return;
    try {
      await FlightsHomeService.deleteCampaign(c.id);
      load();
    } catch (e) {
      showErrorToast({ message: pricingErrorMessage(e) });
    }
  };

  return (
    <section className="space-y-4" aria-labelledby="campaigns-h">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="campaigns-h" className="text-[16px] lg:text-[18px] font-semibold text-[#181818]">Promo cards</h2>
        <button type="button" onClick={() => { setEditing(null); setOpen(true); }} className="bg-[#023E8A] text-white rounded-[8px] px-4 py-2 text-[14px] font-[500]">Add promo card</button>
      </div>
      {error && <p role="alert" className="text-[14px] text-red-600">{error}</p>}
      <div className="border border-gray-300 rounded-lg overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="bg-white">
              <th className={th}>Headline</th><th className={th}>Country</th><th className={th}>Route</th><th className={th}>Dates</th><th className={th}>Status</th>
              <th className={th}><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-4">Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-4 text-[#4E4F52]">No promo cards: the Flights home shows none.</td></tr>
            ) : (
              items.map((c) => {
                const [text, tone] = status(c);
                return (
                  <tr key={c.id} className="border-t border-gray-200">
                    <td className={td}><span className="font-[600]">{c.headline}</span><span className="block text-[#4E4F52]">{c.label}</span></td>
                    <td className={td}>{c.country_code || "Every country"}</td>
                    <td className={td}>{c.route_origin ? `${c.route_origin} → ${c.route_destination}` : "—"}</td>
                    <td className={td}>{day(c.starts_at)} – {day(c.ends_at)}</td>
                    <td className={td}><span className={`rounded-full px-2 py-1 text-[12px] font-[600] ${tone}`}>{text}</span></td>
                    <td className={`${td} whitespace-nowrap`}>
                      <button type="button" className="text-[#023E8A] font-semibold mr-3" onClick={() => { setEditing(c); setOpen(true); }}>Edit</button>
                      <button type="button" className="text-[#B42318] font-semibold" onClick={() => remove(c)}>Delete</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <CampaignDialog open={open} onOpenChange={setOpen} campaign={editing} onSaved={load} />
    </section>
  );
};

export default CampaignsSection;
