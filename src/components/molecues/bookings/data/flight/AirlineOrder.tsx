"use client";
import React from "react";
import { GridValues } from "../../reuseables";

// The Amadeus side of a v2 flight booking (backend airline_order, flights_plan.md F4):
// order id, PNRs, the client reference support quotes to Amadeus, deadlines,
// each segment's status and the latest calls to Amadeus.

export type AirlineOrderData = {
  state: string;
  reference: string;
  order_id: string | null;
  pnr: string;
  associated_records: { reference: string; system: string }[];
  ama_client_ref: string;
  source: string;
  validating_airline: string;
  payment_deadline: string | null;
  ticketing_deadline: string | null;
  last_ticketing_date: string | null;
  ticketing_status: string;
  segments: { segmentId: string; flight: string; from: string; to: string; departureLocal: string; status: string | null }[];
  price: { supplier_amount?: string; supplier_currency?: string; customer_amount?: string; customer_currency?: string; markup_amount?: string; markup_label?: string; fx_rate?: string } | null;
  payable: { currency: string; total: string }[];
  price_change: { previous: { amount: string; currency: string }; current: { amount: string; currency: string }; direction: string } | null;
  failure: { stage: string; reason: string } | null;
  supplier_calls: { operation: string; status_code: number | null; succeeded: boolean; at: string; ama_request_id: string; error: string | null; duration_ms: number | null }[];
};

const STATE_LABELS: Record<string, string> = {
  HELD: "Held, waiting for payment",
  HOLD_EXPIRED: "Hold expired (released)",
  PAID: "Paid",
  TICKETING: "With the consolidator",
  TICKETED: "Ticketed",
  FAILED: "Failed",
  CANCELLATION_REQUESTED: "Cancellation requested",
  CANCELLED: "Cancelled",
};

const OPERATIONS: Record<string, string> = {
  flight_create_order: "Create order",
  flight_order_get: "Read order",
  flight_order_delete: "Delete order",
  flight_order_patch: "Update order",
};

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "N/A");
const statusClass = (s: string | null) =>
  s === "CONFIRMED" ? "text-[#2D9C5E] bg-[#2D9C5E1A]" : s ? "text-[#E74C3C] bg-[#E74C3C1A]" : "text-[#4E4F52] bg-gray-100";

const AirlineOrder = ({ data }: { data: AirlineOrderData }) => {
  const airlineRecords = data.associated_records.filter((r) => r.system !== "GDS");
  return (
    <div className="rounded-xl border border-[#dfe7f0] bg-white p-5 shadow-[0_8px_24px_rgba(16,42,67,0.04)] space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#023E8A]">Amadeus</p>
          <h2 className="mt-1 text-[18px] font-semibold text-[#18202b]">Airline order</h2>
        </div>
        <span className="text-xs text-[#4E4F52]">{STATE_LABELS[data.state] ?? data.state}</span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <GridValues title="TravelMate reference" value={data.reference} />
        <GridValues title="PNR (Amadeus)" value={data.pnr || "N/A"} />
        <GridValues title="Airline record" value={airlineRecords.map((r) => `${r.system} ${r.reference}`).join(", ") || "N/A"} />
        <GridValues title="Validating airline" value={data.validating_airline || "N/A"} />
        <GridValues title="Pay by" value={when(data.payment_deadline)} />
        <GridValues title="Airline cancels if not ticketed" value={when(data.ticketing_deadline)} />
        <GridValues title="Last ticketing date" value={data.last_ticketing_date ?? "N/A"} />
        <GridValues title="Ticketing" value={data.ticketing_status.replace(/_/g, " ") || "N/A"} />
      </div>

      <div className="space-y-1">
        <p className="text-[12px] text-[#4E4F52]">Ama-Client-Ref (quote it to Amadeus support)</p>
        <p className="font-mono text-[13px] break-all text-[#181818]">{data.ama_client_ref}</p>
        <p className="text-[12px] text-[#4E4F52] pt-1">Order ID</p>
        <p className="font-mono text-[13px] break-all text-[#181818]">{data.order_id ?? "N/A"}</p>
      </div>

      {data.price_change && (
        <p className="text-[14px] text-[#181818]">
          Price changed at booking ({data.price_change.direction === "UP" ? "up" : "down"}): {data.price_change.previous.amount} → {data.price_change.current.amount} {data.price_change.current.currency}
        </p>
      )}
      {data.failure && <p role="alert" className="text-[14px] text-red-600">Failed {data.failure.stage === "AFTER_PAYMENT" ? "after" : "before"} payment: {data.failure.reason}</p>}

      <div>
        <h3 className="text-[14px] font-semibold text-[#181818] mb-2">Segments</h3>
        <div className="border border-gray-200 rounded-lg overflow-x-auto">
          <table className="w-full min-w-[480px] text-[13px]">
            <thead className="bg-[#F7F9FC] text-left"><tr><th className="px-3 py-2">Flight</th><th className="px-3 py-2">Route</th><th className="px-3 py-2">Departs (local)</th><th className="px-3 py-2">Status</th></tr></thead>
            <tbody>
              {data.segments.map((s) => (
                <tr key={s.segmentId} className="border-t border-gray-100">
                  <td className="px-3 py-2">{s.flight}</td>
                  <td className="px-3 py-2">{s.from} → {s.to}</td>
                  <td className="px-3 py-2">{s.departureLocal.replace("T", " ").slice(0, 16)}</td>
                  <td className="px-3 py-2"><span className={`rounded px-2 py-0.5 ${statusClass(s.status)}`}>{s.status ?? "Unknown"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {data.price && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <GridValues title="Airline price" value={`${data.price.supplier_amount} ${data.price.supplier_currency}`} />
          <GridValues title="Customer price" value={`${data.price.customer_amount} ${data.price.customer_currency}`} />
          <GridValues title="Our markup" value={`${data.price.markup_amount} ${data.price.customer_currency}${data.price.markup_label ? ` (${data.price.markup_label})` : ""}`} />
          <GridValues title="Payable" value={data.payable.map((p) => `${p.total} ${p.currency}`).join(" · ") || "N/A"} />
        </div>
      )}

      <div>
        <h3 className="text-[14px] font-semibold text-[#181818] mb-2">Calls to Amadeus</h3>
        <ul className="space-y-1 text-[13px]">
          {data.supplier_calls.map((c) => (
            <li key={`${c.at}-${c.operation}`} className="flex flex-wrap gap-x-3">
              <span className={c.succeeded ? "text-[#2D9C5E]" : "text-[#E74C3C]"}>{c.status_code ?? "no response"}</span>
              <span>{OPERATIONS[c.operation] ?? c.operation}</span>
              <span className="text-[#4E4F52]">{when(c.at)}{c.duration_ms ? ` · ${c.duration_ms} ms` : ""}</span>
              {c.ama_request_id && <span className="font-mono text-[#4E4F52]">{c.ama_request_id}</span>}
              {c.error && <span className="text-[#E74C3C]">{c.error}</span>}
            </li>
          ))}
          {data.supplier_calls.length === 0 && <li className="text-[#4E4F52]">None recorded.</li>}
        </ul>
      </div>
    </div>
  );
};

export default AirlineOrder;
