"use client";
import React, { useState } from "react";
import Link from "next/link";
import PricingService, { MarkupRule } from "@/services/pricing";
import { pricingErrorMessage, useMarkupRules } from "@/hooks/api/pricing";
import { showErrorToast } from "@/utils/toasters";
import MarkupRuleDialog from "./MarkupRuleDialog";

const th = "px-4 py-3 text-left text-[12px] lg:text-[14px] font-[500] text-[#181818]";
const td = "px-4 py-3 text-[12px] lg:text-[14px] text-[#181818]";

const appliesTo = (r: MarkupRule) =>
  [
    r.origin_country || r.destination_country ? `${r.origin_country || "any"} → ${r.destination_country || "any"}` : "",
    r.cabin && r.cabin.replace("_", " ").toLowerCase(),
    r.source,
    r.supplier,
  ].filter(Boolean).join(" · ") || "Everything";

const markupText = (r: MarkupRule) =>
  [Number(r.percent) ? `${Number(r.percent)}%` : "", Number(r.fixed_usd) ? `$${Number(r.fixed_usd).toFixed(2)}` : ""]
    .filter(Boolean).join(" + ") || "0%";

/** Markup rules for one product. The most specific active rule wins; with
 *  none, the service commission from CMS applies. */
const MarkupRulesSection = ({ product }: { product: "flights" | "transfers" }) => {
  const { loading, rules, error, refresh } = useMarkupRules(product);
  const [editing, setEditing] = useState<MarkupRule | null>(null);
  const [open, setOpen] = useState(false);

  const toggle = async (rule: MarkupRule) => {
    try {
      await PricingService.updateRule(rule.id, { is_active: !rule.is_active });
      refresh();
    } catch (e) {
      showErrorToast({ message: pricingErrorMessage(e) });
    }
  };

  return (
    <section className="space-y-4" aria-labelledby={`rules-${product}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={`rules-${product}`} className="text-[16px] lg:text-[18px] font-semibold text-[#181818]">Markup rules</h2>
        <button type="button" onClick={() => { setEditing(null); setOpen(true); }}
          className="bg-[#023E8A] text-white rounded-[8px] px-4 py-2 text-[14px] font-[500]">
          Add rule
        </button>
      </div>

      <div className="flex gap-[10px] bg-[#CCD8E833] border-[#023E8A] border rounded-lg p-3 items-start">
        <img src="/assets/icons/in-fo.svg" alt="" />
        <p className="text-[13px] lg:text-[14px] text-[#181818] leading-[22px]">
          The supplier&apos;s price is converted to the customer&apos;s currency, then the rule matching the most fields adds its markup.
          When no active rule matches, the {product === "flights" ? "Flights" : "Airport Taxis"} commission from{" "}
          <Link href="/Dashboard/cms" className="text-[#023E8A] underline">CMS</Link> applies.
        </p>
      </div>

      {error && <p role="alert" className="text-[14px] text-red-600">{error}</p>}

      <div className="border border-gray-300 rounded-lg overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="bg-white">
              <th className={th}>Name</th>
              <th className={th}>Applies to</th>
              <th className={th}>Markup</th>
              <th className={th}>Priority</th>
              <th className={th}>Active</th>
              <th className={th}><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-4">Loading...</td></tr>
            ) : rules.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-4 text-[#4E4F52]">No rules yet: the service commission applies to everything.</td></tr>
            ) : (
              rules.map((r) => (
                <tr key={r.id} className={`hover:bg-gray-50 border-t border-gray-200 ${r.is_active ? "" : "opacity-60"}`}>
                  <td className={`${td} font-[500]`}>{r.name}</td>
                  <td className={td}>{appliesTo(r)}</td>
                  <td className={td}>{markupText(r)}</td>
                  <td className={td}>{r.priority}</td>
                  <td className={td}>
                    <input type="checkbox" aria-label={`${r.name} active`} checked={r.is_active} onChange={() => toggle(r)} />
                  </td>
                  <td className={td}>
                    <button type="button" onClick={() => { setEditing(r); setOpen(true); }}
                      className="text-[#023E8A] font-semibold">Edit</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <MarkupRuleDialog open={open} onOpenChange={setOpen} product={product} rule={editing} onSaved={refresh} />
    </section>
  );
};

export default MarkupRulesSection;
