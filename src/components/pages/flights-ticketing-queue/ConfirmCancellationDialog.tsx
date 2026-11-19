"use client";
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QueueRow, TicketingQueueService } from "@/services/flightsTicketing";
import { pricingErrorMessage } from "@/hooks/api/pricing";
import { showSuccessToast } from "@/utils/toasters";

type Props = {
  row: QueueRow;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

const input = "w-full py-2.5 px-3 border-[#818489] border-[1px] rounded-[8px] outline-none bg-white font-mono";

/**
 * Staff close a ticketed booking's cancellation (flights_plan.md F8) once the
 * consolidator has voided or refunded the ticket: the amount entered is
 * refunded through Flutterwave in the currency the customer paid.
 */
const ConfirmCancellationDialog = ({ row, onOpenChange, onSaved }: Props) => {
  const isVoid = row.cancellation?.kind === "VOID";
  const [amount, setAmount] = useState(isVoid ? row.paid_amount ?? "" : row.cancellation?.estimate ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currency = row.paid_currency ?? row.currency;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await TicketingQueueService.confirmCancellation(row.id, amount.trim());
      showSuccessToast({ message: Number(amount) > 0 ? `Refunding ${amount} ${currency}` : "Cancelled with no refund" });
      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(pricingErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="p-0 min-w-[335px] lg:min-w-[520px]">
        <DialogHeader className="border-b-[1px] border-[#DEDFE1]">
          <DialogTitle className="px-6 py-5">Confirm cancellation · {row.reference}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="px-6 pb-6 space-y-4">
          <p className="text-[13px] text-[#4E4F52]">
            {isVoid
              ? "The customer cancelled on the day of ticketing. Once the consolidator has voided the ticket, refund the full amount."
              : "Enter the amount the consolidator confirmed the airline will refund. Use 0 if nothing comes back."}
          </p>
          <dl className="grid grid-cols-2 gap-2 text-[13px]">
            <dt className="text-[#4E4F52]">Paid</dt><dd>{row.paid_amount ?? "—"} {currency}</dd>
            {!isVoid && <><dt className="text-[#4E4F52]">Our estimate</dt><dd>{row.cancellation?.estimate ? `${row.cancellation.estimate} ${currency}` : "None (refundable fare)"}</dd></>}
            <dt className="text-[#4E4F52]">Customer&apos;s reason</dt><dd>{row.cancellation?.reason || "—"}</dd>
          </dl>
          <label className="block">
            <span className="block text-[14px] font-[500] text-[#181818] mb-1">Refund to the customer ({currency})</span>
            <input className={input} value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" required />
          </label>
          {error && <p role="alert" className="text-[14px] text-red-600">{error}</p>}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => onOpenChange(false)} className="text-[#023E8A] border-[1px] border-[#023E8A] font-[500] rounded-[8px] px-5 py-2.5">Not yet</button>
            <button type="submit" disabled={saving || !amount.trim()} className="bg-[#023E8A] text-white font-[500] rounded-[8px] px-5 py-2.5 disabled:opacity-60">
              {saving ? "Refunding…" : "Confirm and refund"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmCancellationDialog;
