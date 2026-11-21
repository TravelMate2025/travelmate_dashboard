import React from "react";
import { FlexValues } from "./reuseables";

export type CancellationFinancialData = {
  currency?: string;
  total_amount?: number | string | null;
  cancellation_policy?: unknown;
  cancellation_preview?: {
    cancellable?: boolean;
    refundPercent?: number | null;
    refundAmount?: number | string | null;
    cancellationFee?: number | string | null;
    currency?: string | null;
    message?: string | null;
  } | null;
  refund_amount?: number | string | null;
  cancellation_fee?: number | string | null;
  refund_percent?: number | null;
  refund_status?: string | null;
  cancellation_response?: Record<string, unknown> | null;
};

const numberValue = (value: unknown) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const money = (value: unknown, currency?: string) => {
  const amount = numberValue(value);
  if (amount === null) return "—";
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency || "NGN",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency || "NGN"} ${amount.toFixed(2)}`;
  }
};

const statusClass = (status?: string | null) => {
  const value = String(status || "not started").toLowerCase();
  if (["succeeded", "refunded", "completed"].includes(value)) {
    return "border-[#2D9C5E] bg-[#2D9C5E1A] text-[#2D9C5E]";
  }
  if (["failed", "rejected"].includes(value)) {
    return "border-[#D72638] bg-[#D726381A] text-[#D72638]";
  }
  return "border-[#EFB608] bg-[#EFB6081A] text-[#9A7000]";
};

export default function CancellationFinancials({ data }: { data?: CancellationFinancialData }) {
  const preview = data?.cancellation_preview;
  const currency = preview?.currency || data?.currency;
  const selectedPercent = data?.refund_percent ?? preview?.refundPercent;
  const expected = preview?.refundAmount;
  const actual = data?.refund_amount;
  const response = data?.cancellation_response;
  const providerPercent = numberValue(response?.refund_percent ?? response?.refundPercent);
  const expectedPercent = numberValue(selectedPercent);
  const mismatch = providerPercent !== null && expectedPercent !== null && providerPercent !== expectedPercent;
  const policy = data?.cancellation_policy;
  const firstPolicy = Array.isArray(policy) ? policy[0] : policy;
  const policyRecord = firstPolicy && typeof firstPolicy === "object"
    ? firstPolicy as Record<string, unknown>
    : undefined;
  const policyLabel = Array.isArray(policy)
    ? String(policyRecord?.label || policyRecord?.policyCopy || "Selected policy")
    : String(policyRecord?.label || policyRecord?.policyCopy || "Selected policy");

  return (
    <div className="bg-white p-[24px] rounded-[12px] space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-[600] text-[#181818]">Cancellation & Refund</h2>
          <p className="text-sm text-[#67696D] mt-1">Server-owned policy snapshot and refund outcome</p>
        </div>
        <span className={`border rounded-full px-3 py-1 text-xs font-medium capitalize whitespace-nowrap ${statusClass(data?.refund_status)}`}>
          {data?.refund_status || "Not started"}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FlexValues title="Selected policy" value={policyLabel} />
        <FlexValues title="Refund percentage" value={selectedPercent != null ? `${selectedPercent}%` : "—"} />
        <FlexValues title="Expected refund" value={money(expected, currency)} />
        <FlexValues title="Actual refund" value={money(actual, currency)} />
        <FlexValues title="Cancellation fee" value={money(data?.cancellation_fee ?? preview?.cancellationFee, currency)} red />
        <FlexValues title="Eligibility" value={preview?.cancellable === false ? "Not cancellable" : "Cancellable"} />
      </div>
      {mismatch && (
        <div className="rounded-[8px] border border-[#D72638] bg-[#D726381A] px-3 py-2 text-sm text-[#D72638]">
          Provider mismatch: expected {expectedPercent}% refund, provider returned {providerPercent}%.
        </div>
      )}
      {preview?.message && <p className="text-xs text-[#67696D]">{preview.message}</p>}
    </div>
  );
}
