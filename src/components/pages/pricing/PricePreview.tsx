"use client";
import React, { useState } from "react";
import PricingService, { PreviewRow } from "@/services/pricing";
import { pricingErrorMessage } from "@/hooks/api/pricing";

const input = "w-full py-2 px-3 border-[#818489] border-[1px] rounded-[8px] outline-none bg-white";
const label = "block text-[13px] font-[500] text-[#181818] mb-1";

/** What a customer would pay in each currency for a supplier amount, with
 *  the rule that applies: to check a rule before or after saving it. */
const PricePreview = ({ product }: { product: "flights" | "transfers" }) => {
  const [form, setForm] = useState({ amount: "500", supplier_currency: "USD", origin_country: "NG", destination_country: "GB", cabin: "ECONOMY" });
  const [rows, setRows] = useState<PreviewRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [key]: e.target.value });

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await PricingService.preview({
        product,
        amount: form.amount,
        supplier_currency: form.supplier_currency,
        origin_country: form.origin_country.toUpperCase(),
        destination_country: form.destination_country.toUpperCase(),
        cabin: product === "flights" ? form.cabin : "",
      });
      setRows(res.data);
    } catch (err) {
      setError(pricingErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-4" aria-labelledby={`preview-${product}`}>
      <h2 id={`preview-${product}`} className="text-[16px] lg:text-[18px] font-semibold text-[#181818]">Price preview</h2>
      <form onSubmit={run} className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
        <div className="col-span-2 md:col-span-1">
          <label className={label} htmlFor="pv-amount">Supplier price</label>
          <input id="pv-amount" className={input} inputMode="decimal" value={form.amount} onChange={set("amount")} />
        </div>
        <div>
          <label className={label} htmlFor="pv-cur">In</label>
          <select id="pv-cur" className={input} value={form.supplier_currency} onChange={set("supplier_currency")}>
            {["USD", "NGN", "GBP"].map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="pv-from">From</label>
          <input id="pv-from" className={input} maxLength={2} value={form.origin_country} onChange={set("origin_country")} />
        </div>
        <div>
          <label className={label} htmlFor="pv-to">To</label>
          <input id="pv-to" className={input} maxLength={2} value={form.destination_country} onChange={set("destination_country")} />
        </div>
        {product === "flights" && (
          <div>
            <label className={label} htmlFor="pv-cabin">Cabin</label>
            <select id="pv-cabin" className={input} value={form.cabin} onChange={set("cabin")}>
              {["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"].map((c) => <option key={c} value={c}>{c.replace("_", " ").toLowerCase()}</option>)}
            </select>
          </div>
        )}
        <button type="submit" disabled={busy} className="bg-[#023E8A] text-white rounded-[8px] px-4 py-2 font-[500] disabled:opacity-60">
          {busy ? "Working…" : "Preview"}
        </button>
      </form>
      {error && <p role="alert" className="text-[14px] text-red-600">{error}</p>}
      {rows && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {rows.map((r) => (
            <div key={r.customer_currency} className="border border-gray-300 rounded-lg p-4 bg-white">
              <p className="text-[13px] text-[#4E4F52]">{r.customer_currency}</p>
              {r.error ? (
                <p className="text-[14px] text-red-600">{r.error}</p>
              ) : (
                <>
                  <p className="text-[20px] font-[700] text-[#181818]">{Number(r.customer_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  <p className="text-[12px] text-[#4E4F52]">
                    {Number(r.converted_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} + markup {Number(r.markup_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[12px] text-[#4E4F52]">{r.markup_label}</p>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default PricePreview;
