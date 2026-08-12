"use client";

import React, { useState } from "react";
import axios from "axios";
import { AlertTriangle, CheckCircle2, Clock3, RefreshCw, ShieldCheck, X } from "lucide-react";
import type { RefundAction, RefundOperations as RefundOperationsData } from "@/services/booking/types";

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

const workflowLabel = (status?: string | null) => (status || "pending").replaceAll("_", " ");

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
  onAction?: (action: RefundAction, reason: string, confirmSettlement?: boolean) => Promise<RefundOperationsData | null>;
  onRepair?: (amount: string, reason: string) => Promise<RefundOperationsData | null>;
};

export default function RefundOperations({ data, onReconcile, onAction, onRepair }: Props) {
  const [current, setCurrent] = useState(data ?? null);
  const [reconciling, setReconciling] = useState(false);
  const [selectedAction, setSelectedAction] = useState<RefundAction | "repair_amount" | null>(null);
  const [reason, setReason] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const active = current?.status === "pending" || current?.status === "processing";
  const workflow = current?.workflow_status || current?.status || "pending";
  const terminal = ["completed", "not_applicable"].includes(workflow);
  const numericMismatch = (left?: string | number | null, right?: string | number | null) =>
    left != null && right != null && Number(left) !== Number(right);
  const mismatch = Boolean(current?.amount_mismatch)
    || numericMismatch(current?.expected_amount, current?.requested_amount)
    || numericMismatch(current?.requested_amount, current?.settled_amount);
  const actionAllowed = (action: RefundAction) => {
    if (terminal) return false;
    if (action === "initiate") return ["pending", "rejected", "failed"].includes(workflow);
    if (action === "approve") return workflow === "initiated" && !mismatch;
    if (action === "settle") return workflow === "approved" && !mismatch;
    return ["initiated", "approved"].includes(workflow);
  };

  const errorMessage = (error: unknown, fallback: string) => {
    if (!axios.isAxiosError(error)) {
      return error instanceof Error ? error.message : fallback;
    }
    const response = error.response?.data as { error?: string; detail?: string; message?: string } | undefined;
    return response?.error || response?.detail || response?.message || error.message || fallback;
  };

  const reconcile = async () => {
    if (!onReconcile) return;
    setReconciling(true);
    setError(null);
    try {
      const refreshed = await onReconcile();
      if (refreshed) setCurrent(refreshed);
    } catch (reconcileError) {
      setError(errorMessage(reconcileError, "Reconciliation failed."));
    } finally {
      setReconciling(false);
    }
  };

  const submitAction = async () => {
    if (!selectedAction || !reason.trim()) return;
    if (selectedAction === "repair_amount" && !onRepair) return;
    if (selectedAction !== "repair_amount" && !onAction) return;
    setWorking(true);
    setError(null);
    try {
      const refreshed = selectedAction === "repair_amount"
        ? await onRepair?.(String(current?.expected_amount || ""), reason.trim())
        : await onAction?.(selectedAction, reason.trim(), selectedAction === "settle");
      if (!refreshed) throw new Error("The backend returned no updated refund record.");
      setCurrent(refreshed);
      setSelectedAction(null);
      setReason("");
    } catch (actionError) {
      setError(errorMessage(actionError, "Refund action failed."));
    } finally {
      setWorking(false);
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
        <div className="flex flex-wrap justify-end gap-2">
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(current?.status)}`}>{statusLabel(current?.status)}</span>
          {current?.workflow_status && <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold capitalize text-slate-700">{workflowLabel(current.workflow_status)}</span>}
        </div>
      </div>

      {!current || current.status === "not_applicable" ? (
        <p className="mt-5 rounded-lg border border-dashed border-[#cfd7e3] px-4 py-3 text-sm text-[#67696D]">No refund record exists for this booking.</p>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            <Metric label="Expected amount" value={money(current.expected_amount, current.currency ?? undefined)} />
            <Metric label="Original payment" value={money(current.original_payment_amount, current.currency ?? undefined)} />
            <Metric label="Requested amount" value={money(current.requested_amount, current.currency ?? undefined)} />
            <Metric label="Settled amount" value={money(current.settled_amount, current.currency ?? undefined)} />
            <Metric label="Retained amount" value={money(current.retained_amount, current.currency ?? undefined)} />
            <Metric label="Policy refund" value={current.refund_percent != null ? `${current.refund_percent}%` : "Not available"} />
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
          {current.policy_basis && Object.keys(current.policy_basis).length > 0 && <div className="mt-4 rounded-lg border border-[#dbe3ed] bg-white px-4 py-3 text-sm text-[#4e5d6d]"><ShieldCheck size={16} className="mr-2 inline text-[#023E8A]" />Policy basis: <span className="font-medium text-[#18202b]">{String(current.policy_basis.optionId || current.policy_basis.option_id || "Recorded cancellation policy")}</span>{current.policy_basis.policyVersion ? ` · version ${String(current.policy_basis.policyVersion)}` : ""}</div>}
          <div className="mt-5 border-t border-[#e7edf5] pt-5">
            <p className="text-sm font-semibold text-[#181818]">Audit timeline</p>
            <ol className="mt-3 space-y-3">
              {(current.timeline || []).map((event, index) => <li key={`${event.status}-${event.occurred_at}-${index}`} className="flex items-start gap-3 text-sm"><span className="mt-0.5 text-[#023E8A]">{event.status === "completed" ? <CheckCircle2 size={17} /> : event.status === "failed" ? <AlertTriangle size={17} /> : <Clock3 size={17} />}</span><span><span className="font-medium text-[#181818]">{timelineLabel(event.status)}</span><span className="ml-2 text-[#6b7280]">{date(event.occurred_at)} · {event.source || "system"}</span></span></li>)}
            </ol>
          </div>
        </>
      )}
      {onAction && current && current.status !== "not_applicable" && <div className="mt-5 border-t border-[#e7edf5] pt-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold text-[#181818]">Refund controls</p><p className="mt-1 text-xs text-[#6b7280]">Every action is recorded against the operator and sent to the partner.</p></div><div className="flex flex-wrap gap-2"><ActionButton label="Initiate" action="initiate" disabled={!actionAllowed("initiate")} onClick={setSelectedAction} /><ActionButton label="Approve" action="approve" disabled={!actionAllowed("approve")} onClick={setSelectedAction} /><ActionButton label="Reject" action="reject" disabled={!actionAllowed("reject")} onClick={setSelectedAction} /><ActionButton label="Settle refund" action="settle" disabled={!actionAllowed("settle")} onClick={setSelectedAction} danger />{onRepair && mismatch && <button type="button" onClick={() => setSelectedAction("repair_amount")} className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-50">Repair amount</button>}</div></div>{mismatch && <p className="mt-3 text-xs font-medium text-red-700">Actions requiring approval or settlement are disabled until the policy amount, provider amount, and settled amount agree.</p>}</div>}
      {onReconcile && active && <button type="button" onClick={reconcile} disabled={reconciling} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#023E8A] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#012f69] disabled:cursor-wait disabled:opacity-60"><RefreshCw size={15} className={reconciling ? "animate-spin" : ""} />{reconciling ? "Reconciling…" : "Reconcile with partner"}</button>}
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      {selectedAction && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="dialog" aria-modal="true" aria-labelledby="refund-action-title"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#023E8A]">Operator confirmation</p><h3 id="refund-action-title" className="mt-1 text-lg font-semibold capitalize text-[#18202b]">{selectedAction === "repair_amount" ? "Repair refund amount" : `${selectedAction} refund`}</h3></div><button type="button" onClick={() => setSelectedAction(null)} aria-label="Close"><X size={18} /></button></div><p className="mt-4 text-sm leading-6 text-[#4e5d6d]">{selectedAction === "repair_amount" ? `Correct the stored amount to ${money(current?.expected_amount, current?.currency ?? undefined)} using the server policy calculation. This does not contact the partner or move money.` : selectedAction === "settle" ? "Settlement immediately executes the real payment refund with the partner. Confirm that the policy amount and booking are correct before continuing." : "This action changes the partner refund lifecycle and is recorded in the operations audit trail."}</p>{error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}<label className="mt-5 block text-sm font-medium text-[#18202b]">Reason<textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#023E8A]" placeholder="Explain why this action is being taken" /></label><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setSelectedAction(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">Cancel</button><button type="button" onClick={submitAction} disabled={working || !reason.trim()} className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${selectedAction === "settle" ? "bg-red-700 hover:bg-red-800" : "bg-[#023E8A] hover:bg-[#012f69]"}`}>{working ? "Working…" : selectedAction === "settle" ? "Confirm settlement" : selectedAction === "repair_amount" ? "Confirm repair" : `Confirm ${selectedAction}`}</button></div></div></div>}
    </section>
  );
}

const ActionButton = ({ label, action, disabled, onClick, danger = false }: { label: string; action: RefundAction; disabled: boolean; onClick: (action: RefundAction) => void; danger?: boolean }) => <button type="button" disabled={disabled} onClick={() => onClick(action)} className={`rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-35 ${danger ? "border-red-200 text-red-700 hover:bg-red-50" : "border-[#cbd7e5] text-[#023E8A] hover:bg-[#f1f6fc]"}`}>{label}</button>;

const Metric = ({ label, value }: { label: string; value: string }) => <div className="rounded-lg border border-[#e7edf5] bg-white p-3"><p className="text-xs text-[#6b7280]">{label}</p><p className="mt-1 break-words text-sm font-medium text-[#181818]">{value}</p></div>;
