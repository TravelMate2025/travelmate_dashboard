"use client";

import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, RefreshCw } from "lucide-react";
import type { RefundOperations as RefundOperationsData } from "@/services/booking/types";

const money = (value: unknown, currency?: string) => {
  if (value === null || value === undefined || value === "") return "—";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return `${currency || ""} ${String(value)}`.trim();
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

const date = (value?: string | null) => {
  if (!value) return "Not available";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
};

const statusTone = (status?: string | null) => {
  switch ((status || "not_applicable").toLowerCase()) {
    case "completed": return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "failed": return "border-red-200 bg-red-50 text-red-800";
    case "processing": return "border-blue-200 bg-blue-50 text-blue-800";
    case "pending": return "border-amber-200 bg-amber-50 text-amber-800";
    default: return "border-gray-200 bg-gray-50 text-gray-600";
  }
};

const statusLabel = (status?: string | null) => {
  switch ((status || "not_applicable").toLowerCase()) {
    case "completed": return "Completed";
    case "failed": return "Failed";
    case "processing": return "Processing";
    case "pending": return "Pending";
    default: return "Not applicable";
  }
};

const timelineLabel = (status?: string) => {
  switch ((status || "").toLowerCase()) {
    case "cancelled": return "Cancellation accepted";
    case "pending": return "Refund requested";
    case "processing": return "Provider processing";
    case "completed": return "Refund completed";
    case "failed": return "Refund failed";
    default: return "Refund update";
  }
};

type Props = {
  data?: RefundOperationsData | null;
  onReconcile?: () => Promise<RefundOperationsData | null>;
};

export default function RefundOperations({ data, onReconcile }: Props) {
  const [current, setCurrent] = useState(data ?? null);
  const [reconciling, setReconciling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const active = current?.status === "pending" || current?.status === "processing";

  const reconcile = async () => {
    if (!onReconcile) return;
    setReconciling(true);
    setError(null);
    try {
      const refreshed = await onReconcile();
      if (refreshed) setCurrent(refreshed);
    } catch (reconcileError) {
      setError(reconcileError instanceof Error ? reconcileError.message : "Reconciliation failed.");
    } finally {
      setReconciling(false);
    }
  };

  return (
    <section className="rounded-[12px] border border-[#dbe3ed] bg-[linear-gradient(135deg,#ffffff_0%,#f6f9ff_100%)] p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#023E8A]">Operations ledger</p>
          <h2 className="mt-1 text-[20px] font-[600] text-[#181818]">Refund reconciliation</h2>
          <p className="mt-1 text-sm text-[#67696D]">Provider lifecycle, money movement, and audit state</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(current?.status)}`}>{statusLabel(current?.status)}</span>
      </div>

      {!current || current.status === "not_applicable" ? (
        <p className="mt-5 rounded-lg border border-dashed border-[#cfd7e3] px-4 py-3 text-sm text-[#67696D]">No refund record exists for this booking.</p>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            <Metric label="Expected amount" value={money(current.expected_amount, current.currency ?? undefined)} />
            <Metric label="Requested amount" value={money(current.requested_amount, current.currency ?? undefined)} />
            <Metric label="Settled amount" value={money(current.settled_amount, current.currency ?? undefined)} />
            <Metric label="Provider reference" value={current.provider_refund_id || "Not available"} />
            <Metric label="Requested at" value={date(current.requested_at)} />
            <Metric label="Last synced" value={date(current.last_synced_at)} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
            {current.provider_status && <span className="rounded-full bg-[#eef2f7] px-3 py-1 text-[#4E4F52]">Provider: {current.provider_status}</span>}
            {current.stale && <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-800">Stale sync</span>}
            {current.operational_overdue && <span className="rounded-full bg-red-50 px-3 py-1 text-red-800">Beyond 3-day operating window</span>}
            {current.amount_mismatch && <span className="rounded-full bg-red-50 px-3 py-1 text-red-800">Amount mismatch</span>}
          </div>
          {current.amount_mismatch && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"><AlertTriangle size={16} className="mr-2 inline" />Expected, requested, and settled amounts do not reconcile. Review before closing the finance case.</div>}
          {current.failure_reason && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">Failure reason: {current.failure_reason}</div>}
          <div className="mt-5 border-t border-[#e7edf5] pt-5">
            <p className="text-sm font-semibold text-[#181818]">Audit timeline</p>
            <ol className="mt-3 space-y-3">
              {(current.timeline || []).map((event, index) => <li key={`${event.status}-${event.occurred_at}-${index}`} className="flex items-start gap-3 text-sm"><span className="mt-0.5 text-[#023E8A]">{event.status === "completed" ? <CheckCircle2 size={17} /> : event.status === "failed" ? <AlertTriangle size={17} /> : <Clock3 size={17} />}</span><span><span className="font-medium text-[#181818]">{timelineLabel(event.status)}</span><span className="ml-2 text-[#6b7280]">{date(event.occurred_at)} · {event.source || "system"}</span></span></li>)}
            </ol>
          </div>
        </>
      )}
      {onReconcile && active && <button type="button" onClick={reconcile} disabled={reconciling} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#023E8A] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#012f69] disabled:cursor-wait disabled:opacity-60"><RefreshCw size={15} className={reconciling ? "animate-spin" : ""} />{reconciling ? "Reconciling…" : "Reconcile with partner"}</button>}
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
    </section>
  );
}

const Metric = ({ label, value }: { label: string; value: string }) => <div className="rounded-lg border border-[#e7edf5] bg-white p-3"><p className="text-xs text-[#6b7280]">{label}</p><p className="mt-1 break-words text-sm font-medium text-[#181818]">{value}</p></div>;
