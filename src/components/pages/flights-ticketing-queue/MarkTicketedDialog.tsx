"use client";
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TicketingQueueService } from "@/services/flightsTicketing";
import { pricingErrorMessage } from "@/hooks/api/pricing";
import { showSuccessToast } from "@/utils/toasters";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  reference: string;
  travelerIds: string[];
  onSaved: () => void;
};

const input = "w-full py-2.5 px-3 border-[#818489] border-[1px] rounded-[8px] outline-none bg-white font-mono";

/** Staff enter ticket numbers the consolidator sent outside Amadeus (email, portal). */
const MarkTicketedDialog = ({ open, onOpenChange, bookingId, reference, travelerIds, onSaved }: Props) => {
  const [numbers, setNumbers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const tickets = travelerIds.filter((t) => numbers[t]?.trim()).map((t) => ({ travelerId: t, number: numbers[t].trim() }));
    try {
      const res = await TicketingQueueService.markTicketed(bookingId, tickets);
      showSuccessToast({ message: res.result === "ticketed" ? "All travellers ticketed" : "Ticket numbers saved" });
      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(pricingErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 min-w-[335px] lg:min-w-[520px]">
        <DialogHeader className="border-b-[1px] border-[#DEDFE1]">
          <DialogTitle className="px-6 py-5">Enter ticket numbers · {reference}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="px-6 pb-6 space-y-4">
          <p className="text-[13px] text-[#4E4F52]">13 digits each, e.g. 147-1234567890. Leave a traveller empty if their ticket isn&apos;t issued yet.</p>
          {travelerIds.map((t) => (
            <label key={t} className="block">
              <span className="block text-[14px] font-[500] text-[#181818] mb-1">Traveller {t}</span>
              <input className={input} value={numbers[t] ?? ""} onChange={(e) => setNumbers({ ...numbers, [t]: e.target.value })} inputMode="numeric" />
            </label>
          ))}
          {error && <p role="alert" className="text-[14px] text-red-600">{error}</p>}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => onOpenChange(false)} className="text-[#023E8A] border-[1px] border-[#023E8A] font-[500] rounded-[8px] px-5 py-2.5">Cancel</button>
            <button type="submit" disabled={saving} className="bg-[#023E8A] text-white font-[500] rounded-[8px] px-5 py-2.5 disabled:opacity-60">{saving ? "Saving…" : "Save ticket numbers"}</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MarkTicketedDialog;
