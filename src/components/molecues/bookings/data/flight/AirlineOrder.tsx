"use client";
import React, { useState } from "react";
import { GridValues } from "../../reuseables";
import { TicketingQueueService } from "@/services/flightsTicketing";
import { pricingErrorMessage } from "@/hooks/api/pricing";
import { showErrorToast, showSuccessToast } from "@/utils/toasters";

// The Amadeus side of a v2 flight booking (backend airline_order, flights_plan.md F4):
// order id, PNRs, the client reference support quotes to Amadeus, deadlines,
// each segment's status and the latest calls to Amadeus.

export type AirlineOrderData = {
  /** The booking id the staff actions take (same as the clients' booking id). */
  booking_id?: string;
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
  payable: { currency: string; flights?: string; bags?: string; total: string }[];
  /** Extra bags bought (F9), in the booking currency. */
  bags?: { id: string; itineraryIndex: number; quantity: number; weightKg: number | null; price: { amount: string; currency: string }; travelerIds: string[] }[];
  price_change: { previous: { amount: string; currency: string }; current: { amount: string; currency: string }; direction: string } | null;
  failure: { stage: string; reason: string } | null;
  handoff?: { method?: string; office?: string; queue?: string; at?: string; error?: string; last_checked_at?: string; deadline_alerted?: string } | null;
  tickets?: { number: string; type: string; status: string; travelerId: string | null; traveler: string | null; source: string | null; issued_at: string | null }[];
  payments?: { gateway: string; reference: string; transaction_id: string | null; amount: string; currency: string; status: string; created_at: string; paid_at: string | null }[];
  refund?: {
    provider: string; status: string; amount: string; currency: string; reason: string; provider_refund_id: string | null; failure_reason: string | null;
    kind?: string | null; estimate?: string | null; airline_confirmed?: boolean | null; settled_amount?: string | null; requested_at?: string | null; settled_at?: string | null;
  } | null;
  cancellation?: { kind?: string; reason?: string; requested_at?: string; estimate?: string | null; confirmed_amount?: string; confirmed_by?: string; confirmed_at?: string } | null;
  in_void_window?: boolean;
  history?: { status: string; at: string; notes: string | null; by: string | null }[];
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
  payment_create: "Open Flutterwave checkout",
  transaction_verify: "Check payment (Flutterwave)",
  transaction_verify_by_reference: "Check payment (Flutterwave)",
  transaction_refund: "Refund (Flutterwave)",
  refund_get: "Check refund (Flutterwave)",
  queue_list: "List consolidator queue",
};

const PAYMENT_STATUS: Record<string, string> = {
  pending: "Checkout opened",
  succeeded: "Paid",
  failed: "Failed",
  refunded: "Refunded",
  expired: "Expired",
};
const paymentClass = (s: string) =>
  s === "succeeded" ? "text-[#2D9C5E] bg-[#2D9C5E1A]" : s === "pending" ? "text-[#EFB608] bg-[#EFB60833]" : "text-[#E74C3C] bg-[#E74C3C1A]";

const REFUND_KIND: Record<string, string> = {
  FULL_REFUND: "Full refund (cancelled before ticketing)",
  VOID: "Void (cancelled on the ticketing day)",
  AIRLINE_REFUND: "Airline refund (confirmed by the consolidator)",
};

const hint = "text-[12px] text-[#4E4F52] mb-2";

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "N/A");
const statusClass = (s: string | null) =>
  s === "CONFIRMED" ? "text-[#2D9C5E] bg-[#2D9C5E1A]" : s ? "text-[#E74C3C] bg-[#E74C3C1A]" : "text-[#4E4F52] bg-gray-100";

const AirlineOrder = ({ data: initial }: { data: AirlineOrderData }) => {
  const [data, setData] = useState(initial);
  const [retrying, setRetrying] = useState(false);
  const retryRefund = async () => {
    if (!data.booking_id) return;
    setRetrying(true);
    try {
      const res = await TicketingQueueService.retryRefund(data.booking_id);
      setData(res.airline_order as AirlineOrderData);
      if (res.result === "sent") showSuccessToast({ message: "Refund sent to Flutterwave" });
      else showErrorToast({ message: "Flutterwave refused the refund again: see the reason below" });
    } catch (e) {
      showErrorToast({ message: pricingErrorMessage(e) });
    } finally {
      setRetrying(false);
    }
  };
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
          <GridValues title="Payable" value={data.payable.map((p) => `${p.total} ${p.currency}${p.bags && Number(p.bags) > 0 ? ` (bags ${p.bags})` : ""}`).join(" · ") || "N/A"} />
        </div>
      )}

      <div>
        <h3 className="text-[14px] font-semibold text-[#181818] mb-1">Extra bags</h3>
        <p className={hint}>Checked bags the customer bought on top of the fare&apos;s allowance, per traveller and flight. They&apos;re booked with the airline and included in the price paid; bags can&apos;t be added after booking.</p>
        {data.bags && data.bags.length > 0 ? (
          <div className="border border-gray-200 rounded-lg overflow-x-auto">
            <table className="w-full min-w-[420px] text-[13px]">
              <thead className="bg-[#F7F9FC] text-left"><tr><th className="px-3 py-2">Traveller</th><th className="px-3 py-2">Flight</th><th className="px-3 py-2">Extra bags</th><th className="px-3 py-2">Price</th></tr></thead>
              <tbody>
                {data.bags.map((b) => (
                  <tr key={b.id} className="border-t border-gray-100">
                    <td className="px-3 py-2">{b.travelerIds.join(", ")}</td>
                    <td className="px-3 py-2">{b.itineraryIndex === 0 ? "Outbound" : b.itineraryIndex === 1 ? "Return" : `Flight ${b.itineraryIndex + 1}`}</td>
                    <td className="px-3 py-2">+{b.quantity}{b.weightKg ? ` × ${b.weightKg} kg` : ""}</td>
                    <td className="px-3 py-2">{b.price.amount} {b.price.currency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-[13px] text-[#4E4F52]">None.</p>
        )}
      </div>

      <div>
        <h3 className="text-[14px] font-semibold text-[#181818] mb-1">Consolidator and tickets</h3>
        <p className={hint}>Paid bookings go to the consolidator automatically, who issues the tickets. Tickets marked &quot;entered by staff&quot; were typed in from the Ticketing Queue.</p>
        {data.handoff ? (
          <p className={`text-[13px] ${data.handoff.error ? "text-red-600" : "text-[#181818]"}`}>
            {data.handoff.error
              ? `Not handed over: ${data.handoff.error}`
              : `Handed over by ${(data.handoff.method ?? "").replace(/_/g, " ")}${data.handoff.queue ? `, queue ${data.handoff.queue}` : ""}${data.handoff.office ? `, office ${data.handoff.office}` : ""}, ${when(data.handoff.at ?? null)}.`}
            {data.handoff.last_checked_at ? ` Order last checked ${when(data.handoff.last_checked_at)}.` : ""}
            {data.handoff.deadline_alerted ? " Ticketing time limit passed without tickets." : ""}
          </p>
        ) : (
          <p className="text-[13px] text-[#4E4F52]">Not handed to the consolidator yet.</p>
        )}
        {data.tickets && data.tickets.length > 0 && (
          <ul className="mt-2 space-y-1 text-[13px]">
            {data.tickets.map((t) => (
              <li key={t.number} className="flex flex-wrap gap-x-3">
                <span className="font-mono">{t.number}</span>
                <span>{t.type} · {t.status}</span>
                <span>{t.traveler ?? "Traveller not matched"}</span>
                <span className="text-[#4E4F52]">{t.source === "manual" ? "entered by staff" : "from Amadeus"}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="text-[14px] font-semibold text-[#181818] mb-1">Payments</h3>
        <p className={hint}>Every Flutterwave checkout the customer opened. Only one is paid; the others close by themselves. Search the transaction number in the Flutterwave dashboard.</p>
        {data.payments && data.payments.length > 0 ? (
          <div className="border border-gray-200 rounded-lg overflow-x-auto">
            <table className="w-full min-w-[560px] text-[13px]">
              <thead className="bg-[#F7F9FC] text-left">
                <tr><th className="px-3 py-2">Reference</th><th className="px-3 py-2">Gateway</th><th className="px-3 py-2">Transaction</th><th className="px-3 py-2">Amount</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">When</th></tr>
              </thead>
              <tbody>
                {data.payments.map((p) => (
                  <tr key={p.reference} className="border-t border-gray-100">
                    <td className="px-3 py-2 font-mono">{p.reference}</td>
                    <td className="px-3 py-2 capitalize">{p.gateway}</td>
                    <td className="px-3 py-2 font-mono">{p.transaction_id ?? "N/A"}</td>
                    <td className="px-3 py-2">{p.amount} {p.currency}</td>
                    <td className="px-3 py-2"><span className={`rounded px-2 py-0.5 ${paymentClass(p.status)}`}>{PAYMENT_STATUS[p.status] ?? p.status}</span></td>
                    <td className="px-3 py-2">{when(p.paid_at ?? p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-[13px] text-[#4E4F52]">No payment started yet.</p>
        )}
      </div>

      {(data.refund || data.cancellation || data.state === "TICKETED") && (
        <div>
          <h3 className="text-[14px] font-semibold text-[#181818] mb-1">Cancellation and refund</h3>
          <p className={hint}>
            Before ticketing, a cancellation is refunded in full automatically. After ticketing, the consolidator voids the ticket (same day, full
            refund) or asks the airline for a refund; nothing goes back to the customer until staff confirm the amount in Ticketing Queue → Cancellations.
            &quot;Estimate&quot; is what we told the customer to expect: the taxes on a non-refundable fare, none on a refundable one.
            Every refund is less the Flutterwave fee on the payment (customers bear it, we don&apos;t).
          </p>
          {data.state === "TICKETED" && (
            <p className="text-[13px] text-[#4E4F52]">{data.in_void_window ? "Void window open: the ticket was issued today." : "Void window closed: a cancellation needs the airline's refund."}</p>
          )}
          {data.cancellation && (
            <p className="text-[13px] text-[#181818]">
              {REFUND_KIND[data.cancellation.kind ?? ""] ?? data.cancellation.kind}. Asked {when(data.cancellation.requested_at ?? null)}
              {data.cancellation.reason ? `: “${data.cancellation.reason}”` : ""}.
              {data.cancellation.confirmed_amount !== undefined && ` Confirmed ${data.cancellation.confirmed_amount} by ${data.cancellation.confirmed_by} on ${when(data.cancellation.confirmed_at ?? null)}.`}
            </p>
          )}
          {data.refund && (
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <GridValues title="Refund" value={`${data.refund.amount} ${data.refund.currency} · ${data.refund.status}`} />
              <GridValues title="Estimate" value={data.refund.estimate ? `${data.refund.estimate} ${data.refund.currency}` : "N/A"} />
              <GridValues title="Airline confirmed" value={data.refund.airline_confirmed == null ? "Not needed" : data.refund.airline_confirmed ? "Yes" : "Waiting for the consolidator"} />
              <GridValues title="Flutterwave refund" value={data.refund.provider_refund_id ?? "Not sent yet"} />
            </div>
          )}
          {data.refund?.failure_reason && (
            <div className="mt-2 space-y-2">
              <p role="alert" className="text-[13px] text-red-600">Refund failed: {data.refund.failure_reason}.</p>
              {data.refund.status === "failed" && data.booking_id && (
                <div className="flex flex-wrap items-center gap-3">
                  <button type="button" onClick={retryRefund} disabled={retrying}
                    className="bg-[#023E8A] text-white rounded-[6px] px-3 py-1.5 text-[13px] disabled:opacity-60">
                    {retrying ? "Sending…" : "Send refund again"}
                  </button>
                  <span className="text-[12px] text-[#4E4F52]">
                    &quot;Insufficient Wallet Balance&quot; means our Flutterwave balance in {data.refund.currency} is too low: top it up in Flutterwave, then send again.
                    Don&apos;t also refund from the Flutterwave dashboard, or the customer is paid twice.
                  </span>
                </div>
              )}
            </div>
          )}
          {data.refund?.reason && <p className="mt-2 text-[13px] text-[#4E4F52]">{data.refund.reason}</p>}
        </div>
      )}

      {data.history && data.history.length > 0 && (
        <div>
          <h3 className="text-[14px] font-semibold text-[#181818] mb-1">History</h3>
          <p className={hint}>Status changes, newest first, with who made them (blank = the system or the customer).</p>
          <ul className="space-y-1 text-[13px]">
            {data.history.map((h, i) => (
              <li key={`${h.at}-${i}`} className="flex flex-wrap gap-x-3">
                <span className="capitalize">{h.status.replace(/_/g, " ")}</span>
                <span className="text-[#4E4F52]">{when(h.at)}{h.by ? ` · ${h.by}` : ""}</span>
                {h.notes && <span>{h.notes}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h3 className="text-[14px] font-semibold text-[#181818] mb-1">Calls to Amadeus and Flutterwave</h3>
        <p className={hint}>The latest calls for this booking. When asking Amadeus support about a failure, quote the request id shown and the Ama-Client-Ref above.</p>
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
