import React from "react";
import { FlexValues } from "./reuseables";

type RefundSummaryData = {
  status?: string | null;
  provider_status?: string | null;
  provider_refund_id?: string | null;
  expected_amount?: string | number | null;
  requested_amount?: string | number | null;
  settled_amount?: string | number | null;
  original_payment_amount?: string | number | null;
  retained_amount?: string | number | null;
  refund_percent?: string | number | null;
  currency?: string | null;
  requested_at?: string | null;
  settled_at?: string | null;
  failure_reason?: string | null;
  amount_mismatch?: boolean;
  timeline?: Array<{ status?: string; source?: string; occurred_at?: string }>;
};

type Props = {
  refund?: RefundSummaryData | null;
  refund_operations?: RefundSummaryData | null;
  refund_status?: string | null;
};

const money = (value: string | number | null | undefined, currency = "NGN") => {
  if (value === null || value === undefined || value === "") return "—";
  const amount = Number(value);
  if (Number.isNaN(amount)) return String(value);
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

const date = (value?: string | null) => {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString("en-GB");
};

const label = (value?: string | null) =>
  String(value || "Not available").replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

export default function RefundSummary({ refund, refund_operations, refund_status }: Props) {
  const data = refund_operations || refund;
  if (!data && !refund_status) return null;
  const currency = data?.currency || "NGN";
  const timeline = data?.timeline || [];

  return (
    <section className="bg-white rounded-[12px] p-[24px] space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[20px] font-[600] text-[#181818]">Refund Details</h2>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold capitalize text-emerald-800">
          {label(data?.status || refund_status)}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <FlexValues title="Original Payment" value={money(data?.original_payment_amount, currency)} />
        <FlexValues title="Expected Refund" value={money(data?.expected_amount, currency)} />
        <FlexValues title="Requested Refund" value={money(data?.requested_amount, currency)} />
        <FlexValues title="Settled Refund" value={money(data?.settled_amount, currency)} />
        <FlexValues title="Retained Amount" value={money(data?.retained_amount, currency)} />
        <FlexValues title="Refund Percentage" value={data?.refund_percent != null ? `${data.refund_percent}%` : "—"} />
        <FlexValues title="Provider Status" value={label(data?.provider_status)} />
        <FlexValues title="Provider Refund ID" value={data?.provider_refund_id || "—"} />
        <FlexValues title="Requested At" value={date(data?.requested_at)} />
        <FlexValues title="Settled At" value={date(data?.settled_at)} />
      </div>

      {data?.amount_mismatch && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          Refund amount mismatch requires review.
        </div>
      )}
      {data?.failure_reason && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {data.failure_reason}
        </div>
      )}

      {timeline.length > 0 && (
        <div>
          <h3 className="mb-3 text-base font-semibold text-[#181818]">Refund Timeline</h3>
          <ol className="space-y-3 border-l-2 border-slate-200 pl-4">
            {timeline.map((event, index) => (
              <li key={`${event.status}-${event.occurred_at}-${index}`} className="text-sm">
                <div className="font-medium capitalize text-[#181818]">{label(event.status)}</div>
                <div className="text-slate-500">{date(event.occurred_at)} · {event.source || "system"}</div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
