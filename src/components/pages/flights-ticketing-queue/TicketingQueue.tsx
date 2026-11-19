"use client";
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { TicketingQueueService, QueuePage, QueueRow, ConsolidatorQueueItem } from "@/services/flightsTicketing";
import { pricingErrorMessage } from "@/hooks/api/pricing";
import { showErrorToast, showSuccessToast } from "@/utils/toasters";
import MarkTicketedDialog from "./MarkTicketedDialog";
import ConfirmCancellationDialog from "./ConfirmCancellationDialog";

const th = "px-3 py-3 text-left text-[12px] lg:text-[13px] font-[500] text-[#181818]";
const td = "px-3 py-3 text-[12px] lg:text-[13px] text-[#181818] align-top";
const FILTERS = [
  ["PAID,TICKETING", "Waiting for tickets", "Every paid booking that doesn't have all its e-tickets yet. The ones the airline will cancel soonest are at the top."],
  ["PAID", "Paid, not handed over", "Paid, but not sent to the consolidator yet. Normally this takes seconds; a booking that stays here has a handover problem (the reason is shown in red). Fix it in Flight ticketing settings, then use Hand over."],
  ["TICKETING", "With the consolidator", "Sent to the consolidator and waiting for them to issue the tickets. We check Amadeus for the tickets automatically."],
  ["TICKETED", "Ticketed", "Every traveller has an e-ticket. Shows whether the void window is still open (the ticket was issued today): a cancellation now can be voided for a full refund."],
  ["CANCELLATION_REQUESTED", "Cancellations", "Ticketed bookings the customer asked to cancel. Ask the consolidator to void the ticket (same day) or refund it, then use Confirm cancellation with the amount they confirm. No money goes back until you do."],
] as const;

const ACTIONS = [
  ["Check now", "Asks Flutterwave about the payment and Amadeus about the tickets straight away. This also happens automatically every few minutes."],
  ["Hand over", "Sends the booking to the consolidator again, using Flight ticketing settings. Use it after fixing a failed handover."],
  ["Enter tickets", "Type in the 13-digit ticket numbers when the consolidator sends them by email or their portal instead of through Amadeus. The customer is told they're ticketed."],
  ["Confirm cancellation", "Use it once the consolidator has voided or refunded the ticket. The amount you enter goes back to the customer through Flutterwave, and the booking is closed."],
] as const;
const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");
const age = (iso: string | null) => {
  if (!iso) return "";
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  return minutes < 60 ? `${minutes} min` : minutes < 2880 ? `${Math.round(minutes / 60)} h` : `${Math.round(minutes / 1440)} days`;
};
const stateLabel = (r: QueueRow) =>
  r.state === "PAID" ? (r.handoff_error ? "Paid · handover failed" : "Paid · handing over")
  : r.state === "TICKETING" ? (r.ticketing_status === "partially_ticketed" ? "Partly ticketed" : "With the consolidator")
  : r.state === "TICKETED" ? "Ticketed"
  : r.state === "CANCELLATION_REQUESTED" ? (r.cancellation?.kind === "VOID" ? "Cancel · void the ticket" : "Cancel · airline refund")
  : r.state;

/** Paid flight bookings waiting for tickets (flights_plan.md F6): deadline first, with the actions staff need. */
const TicketingQueue = () => {
  const [filter, setFilter] = useState<string>(FILTERS[0][0]);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<QueuePage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [marking, setMarking] = useState<QueueRow | null>(null);
  const [confirming, setConfirming] = useState<QueueRow | null>(null);
  const [queue, setQueue] = useState<ConsolidatorQueueItem[] | null>(null);
  const [queueError, setQueueError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await TicketingQueueService.list(filter, page));
      setError(null);
    } catch (e) {
      setError(pricingErrorMessage(e));
    }
  }, [filter, page]);
  useEffect(() => { load(); }, [load]);

  const act = async (row: QueueRow, action: "resync" | "handoff") => {
    setBusy(`${row.id}-${action}`);
    try {
      const res = action === "resync" ? await TicketingQueueService.resync(row.id) : await TicketingQueueService.handoff(row.id);
      const messages: Record<string, string> = {
        ticketed: "All travellers are ticketed", partial: "Some travellers are ticketed", waiting: "No tickets yet",
        handed_off: "Handed over to the consolidator", failed: "Handover failed: see the reason in the row", error: "Couldn't read the order from Amadeus",
      };
      showSuccessToast({ message: messages[res.result] ?? `Done (${res.result})` });
      load();
    } catch (e) {
      showErrorToast({ message: pricingErrorMessage(e) });
    } finally {
      setBusy(null);
    }
  };

  const showConsolidatorQueue = async () => {
    setQueueError(null);
    try {
      setQueue(await TicketingQueueService.consolidatorQueue());
    } catch (e) {
      setQueueError(pricingErrorMessage(e));
    }
  };

  const pages = data ? Math.max(1, Math.ceil(data.count / 25)) : 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter bookings">
        {FILTERS.map(([value, label]) => (
          <button key={value} type="button" role="tab" aria-selected={filter === value} onClick={() => { setFilter(value); setPage(1); }}
            className={`rounded-full px-4 py-2 text-[13px] font-[500] border ${filter === value ? "bg-[#023E8A] text-white border-[#023E8A]" : "bg-white text-[#181818] border-[#DEDFE1]"}`}>
            {label}
          </button>
        ))}
      </div>
      <p className="text-[13px] text-[#4E4F52] -mt-3">{FILTERS.find(([value]) => value === filter)?.[2]}</p>
      <details className="text-[13px] text-[#4E4F52] -mt-3">
        <summary className="cursor-pointer text-[#023E8A] font-[500]">What the buttons do</summary>
        <dl className="mt-2 space-y-1.5">
          {ACTIONS.map(([name, text]) => (
            <div key={name}><dt className="inline font-[600] text-[#181818]">{name}: </dt><dd className="inline">{text}</dd></div>
          ))}
        </dl>
      </details>
      {error && <p role="alert" className="text-[14px] text-red-600">{error}</p>}

      <div className="border border-gray-300 rounded-lg overflow-x-auto bg-white">
        <table className="w-full min-w-[1000px]">
          <thead className="bg-[#F7F9FC]">
            <tr>
              <th className={th}>Booking</th><th className={th}>Status</th><th className={th}>Paid</th><th className={th}>Tickets</th>
              <th className={th}>Airline cancels if not ticketed<span className="block font-[400] text-[#4E4F52]">The airline drops the seats at this time if there&apos;s no ticket</span></th><th className={th}>Last checked</th><th className={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.results.map((r) => (
              <tr key={r.id} className="border-t border-gray-100">
                <td className={td}>
                  <Link href={`/Dashboard/bookings/${r.legacy_id}?type=flights`} className="font-[600] text-[#023E8A] underline">{r.reference}</Link>
                  <div className="font-mono text-[#4E4F52]">PNR {r.pnr || "—"}</div>
                  <div className="text-[#4E4F52]">{r.customer}</div>
                </td>
                <td className={td}>
                  {stateLabel(r)}
                  {r.handoff_error && <div className="text-red-600 mt-1 max-w-[240px]">{r.handoff_error}</div>}
                  {r.state === "TICKETED" && (
                    <div className={`mt-1 ${r.in_void_window ? "text-[#2D9C5E]" : "text-[#4E4F52]"}`}>
                      {r.in_void_window ? "Void window open (today)" : "Void window closed"}
                    </div>
                  )}
                  {r.cancellation && (
                    <div className="mt-1 text-[#4E4F52] max-w-[240px]">
                      Asked {when(r.cancellation.requested_at)}
                      {r.cancellation.kind !== "VOID" && ` · estimate ${r.cancellation.estimate ?? "to be confirmed"}${r.cancellation.estimate ? ` ${r.paid_currency ?? ""}` : ""}`}
                      {r.cancellation.reason && <div>“{r.cancellation.reason}”</div>}
                    </div>
                  )}
                </td>
                <td className={td}>{r.paid_amount ?? r.amount} {r.paid_currency ?? r.currency}<div className="text-[#4E4F52]">{when(r.paid_at)} · {age(r.paid_at)} ago</div></td>
                <td className={td}>{r.tickets} of {r.travelers}</td>
                <td className={td}>
                  <span className={r.overdue ? "text-red-600 font-[600]" : ""}>{when(r.ticketing_deadline)}{r.overdue ? " · overdue" : ""}</span>
                  <div className="text-[#4E4F52]">Last ticketing date {r.last_ticketing_date ?? "—"}</div>
                </td>
                <td className={td}>{when(r.last_checked_at)}</td>
                <td className={td}>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={busy !== null} onClick={() => act(r, "resync")} title={ACTIONS[0][1]} className="border border-[#023E8A] text-[#023E8A] rounded-[6px] px-3 py-1.5 disabled:opacity-50">
                      {busy === `${r.id}-resync` ? "Checking…" : "Check now"}
                    </button>
                    {r.state === "PAID" && (
                      <button type="button" disabled={busy !== null} onClick={() => act(r, "handoff")} title={ACTIONS[1][1]} className="border border-[#023E8A] text-[#023E8A] rounded-[6px] px-3 py-1.5 disabled:opacity-50">
                        {busy === `${r.id}-handoff` ? "Handing over…" : "Hand over"}
                      </button>
                    )}
                    {(r.state === "PAID" || r.state === "TICKETING") && (
                      <button type="button" onClick={() => setMarking(r)} title={ACTIONS[2][1]} className="bg-[#023E8A] text-white rounded-[6px] px-3 py-1.5">Enter tickets</button>
                    )}
                    {r.state === "CANCELLATION_REQUESTED" && (
                      <button type="button" onClick={() => setConfirming(r)} title={ACTIONS[3][1]} className="bg-[#023E8A] text-white rounded-[6px] px-3 py-1.5">Confirm cancellation</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {data && data.results.length === 0 && (
              <tr><td className={td} colSpan={7}>Nothing here.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex items-center gap-3 text-[13px]">
          <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="border rounded px-3 py-1 disabled:opacity-40">Previous</button>
          <span>Page {page} of {pages}</span>
          <button type="button" disabled={page >= pages} onClick={() => setPage(page + 1)} className="border rounded px-3 py-1 disabled:opacity-40">Next</button>
        </div>
      )}

      <section className="space-y-3" aria-labelledby="consolidator-queue-h">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="consolidator-queue-h" className="text-[16px] font-semibold text-[#181818]">On the consolidator&apos;s queue (Amadeus)</h2>
            <p className="text-[13px] text-[#4E4F52]">The bookings waiting in the consolidator&apos;s Amadeus queue right now. Use it to check a booking really reached them.</p>
          </div>
          <button type="button" onClick={showConsolidatorQueue} className="border border-[#023E8A] text-[#023E8A] rounded-[8px] px-4 py-2 text-[13px]">Show queue</button>
        </div>
        {queueError && <p role="alert" className="text-[13px] text-red-600">{queueError}</p>}
        {queue && (
          <ul className="text-[13px] space-y-1">
            {queue.map((q) => (
              <li key={q.pnr} className="font-mono">
                {[q.pnr, q.travelers?.join(", "), q.segments.join(", "), q.created_at].filter(Boolean).join(" · ")}
              </li>
            ))}
            {queue.length === 0 && <li className="text-[#4E4F52]">The queue is empty.</li>}
          </ul>
        )}
      </section>

      {confirming && (
        <ConfirmCancellationDialog row={confirming} onOpenChange={(o) => !o && setConfirming(null)} onSaved={load} />
      )}

      {marking && (
        <MarkTicketedDialog
          open
          onOpenChange={(o) => !o && setMarking(null)}
          bookingId={marking.id}
          reference={marking.reference}
          travelerIds={Array.from({ length: marking.travelers }, (_, i) => String(i + 1))}
          onSaved={load}
        />
      )}
    </div>
  );
};

export default TicketingQueue;
