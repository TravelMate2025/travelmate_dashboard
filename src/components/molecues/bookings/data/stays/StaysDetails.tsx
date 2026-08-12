"use client";

import React from "react";
import { GridValues, FlexValues, Policy } from "../../reuseables";
import CancellationFinancials, { CancellationFinancialData } from "../../CancellationFinancials";
import RefundOperations from "../../RefundOperations";
import type { RefundAction, RefundOperations as RefundOperationsData } from "@/services/booking/types";

type StayRoom = {
  room_type?: string;
  room_name?: string;
  // Partner-shaped fields (as returned in the hold response's
  // `roomSelections` and now persisted directly on `rooms`) — the partner
  // calls this field `name`, not `room_type`/`room_name`.
  name?: string;
  roomName?: string;
  adults?: number;
  children?: number;
  occupancy?: number;
  quantity?: number;
  price?: number;
  baseRate?: number;
};

type StayCustomerDetails = {
  name?: string;
  surname?: string;
  age?: number;
  email?: string;
  phone?: string;
  city?: string;
  country?: string;
};

type StayBookingData = {
  id?: string | number;
  reference?: string;
  booking_status?: string;
  payment_status?: string;
  check_in?: string;
  check_out?: string;
  date_booked?: string;
  created_at?: string;
  currency?: string;
  hotel_name?: string;
  hotel_code?: string | number;
  // DRF DecimalField serializes as a string (e.g. "490000.00"), not a JSON number.
  total_amount?: number | string;
  payment_reference?: string;
  payment_transaction_id?: string;
  session_id?: string;
  customer_details?: StayCustomerDetails;
  rooms?: StayRoom[];
  cancellation_policy?: string[] | null;
  refund_amount?: number | string | null;
  cancellation_fee?: number | string | null;
  refund_percent?: number | null;
  refund_status?: string | null;
  cancellation_response?: Record<string, unknown> | null;
  cancellation_preview?: CancellationFinancialData["cancellation_preview"];
  refund_operations?: RefundOperationsData | null;
};

const toDisplayDate = (value?: string) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-GB");
};

const toStatusClass = (status?: string) => {
  const normalized = String(status || "").toLowerCase();
  if (["completed", "confirmed", "paid", "succeeded"].includes(normalized)) {
    return "text-[#2D9C5E] border-[#2D9C5E] bg-[#2D9C5E1A]";
  }
  if (["cancelled", "failed", "refunded"].includes(normalized)) {
    return "text-[#E74C3C] border-[#E74C3C] bg-[#E74C3C1A]";
  }
  if (["ongoing"].includes(normalized)) {
    return "text-[#0084D9] border-[#0084D9] bg-[#0084D91A]";
  }
  return "text-[#EFB608] border-[#EFB608] bg-[#EFB60833]";
};

const formatAmount = (amount?: number | string, currency?: string) => {
  const numericAmount = typeof amount === "string" ? Number(amount) : amount;
  if (typeof numericAmount !== "number" || Number.isNaN(numericAmount)) return "N/A";
  const safeCurrency = (currency || "USD").toUpperCase();

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: safeCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericAmount);
  } catch {
    return `${safeCurrency} ${numericAmount.toFixed(2)}`;
  }
};

const getNights = (checkIn?: string, checkOut?: string) => {
  if (!checkIn || !checkOut) return "N/A";
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "N/A";
  const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? `${diff} night${diff > 1 ? "s" : ""}` : "N/A";
};

export default function StayDetails({ data, onReconcile, onAction, onRepair }: { data?: StayBookingData; onReconcile?: () => Promise<RefundOperationsData | null>; onAction?: (action: RefundAction, reason: string, confirmSettlement?: boolean) => Promise<RefundOperationsData | null>; onRepair?: (amount: string, reason: string) => Promise<RefundOperationsData | null> }) {
  return (
    <div className="space-y-5">
      <BookingDetails data={data} />
      <GridDetails data={data} />
      <CancellationFinancials data={data} />
      <RefundOperations data={data?.refund_operations} onReconcile={onReconcile} onAction={onAction} onRepair={onRepair} />
    </div>
  );
}

const BookingDetails = ({ data }: { data?: StayBookingData }) => {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-[#dfe7f0] bg-white p-5 shadow-[0_8px_24px_rgba(16,42,67,0.04)]">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#023E8A]">Booking record</p><h1 className="mt-1 text-[18px] font-semibold text-[#18202b]">Confirmation details</h1></div>
          <span className="text-xs text-[#8994a3]">Stay</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <GridValues title="Confirmation Number" value={data?.reference || "N/A"} />
          <GridValues title="Hotel Code" value={String(data?.hotel_code || "N/A")} />
          <GridValues title="Booked On" value={toDisplayDate(data?.date_booked || data?.created_at)} />
          <GridValues title="Check In" value={toDisplayDate(data?.check_in)} />
          <GridValues title="Check Out" value={toDisplayDate(data?.check_out)} />

          <div className="min-w-0 space-y-1.5 rounded-lg border border-[#e7edf5] bg-[#fbfcfe] px-3.5 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7b8491]">Payment status</p>
            <div className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${toStatusClass(data?.payment_status)}`}>
              {data?.payment_status || "PENDING"}
            </div>
          </div>

          <div className="min-w-0 space-y-1.5 rounded-lg border border-[#e7edf5] bg-[#fbfcfe] px-3.5 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7b8491]">Booking status</p>
            <div className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${toStatusClass(data?.booking_status)}`}>
              {data?.booking_status || "PENDING"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const GridDetails = ({ data }: { data?: StayBookingData }) => {
  const customer = data?.customer_details;
  const fullName = [customer?.name, customer?.surname].filter(Boolean).join(" ") || customer?.name || "N/A";
  const room = data?.rooms?.[0];
  const roomType = room?.room_type || room?.room_name || room?.name || room?.roomName || "N/A";
  const roomQuantity = room?.quantity || (data?.rooms?.length ? data.rooms.length : 1);

  const policyList = Array.isArray(data?.cancellation_policy) && data?.cancellation_policy.length
    ? data.cancellation_policy
    : [
        "Cancellation policy is not provided by the supplier for this booking.",
      ];

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <div className="space-y-6">
        <div className="rounded-xl border border-[#dfe7f0] bg-white p-5 shadow-[0_8px_24px_rgba(16,42,67,0.04)]">
          <div className="space-y-4">
            <h2 className="text-[17px] font-semibold text-[#18202b]">Guest details</h2>
            <div className="space-y-4">
              <FlexValues title="Name" value={fullName} />
              <FlexValues title="Age" value={customer?.age ?? "N/A"} />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-[17px] font-semibold text-[#18202b]">Contact information</h2>
            <div className="space-y-4">
              <FlexValues title="Email Address" value={customer?.email || "N/A"} />
              <FlexValues title="Phone Number" value={customer?.phone || "N/A"} />
              <FlexValues title="City" value={customer?.city || "N/A"} />
              <FlexValues title="Country" value={customer?.country || "N/A"} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#dfe7f0] bg-white p-5 shadow-[0_8px_24px_rgba(16,42,67,0.04)]">
          <div className="space-y-4">
            <h2 className="text-[17px] font-semibold text-[#18202b]">Stay details</h2>
            <div className="space-y-4">
              <FlexValues title="Type" value="Hotel" />
              <FlexValues title="Property Name" value={data?.hotel_name || "N/A"} />
              <FlexValues title="Room Type" value={roomType} />
              <FlexValues title="Rooms" value={roomQuantity} />
              <FlexValues title="Duration" value={getNights(data?.check_in, data?.check_out)} />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-[#dfe7f0] bg-white p-5 shadow-[0_8px_24px_rgba(16,42,67,0.04)]">
          <div className="space-y-4">
            <h2 className="text-[17px] font-semibold text-[#18202b]">Transaction details</h2>
            <div className="space-y-4">
              <FlexValues title="Payment Reference" value={data?.payment_reference || "N/A"} />
              <FlexValues
                title="Transaction ID"
                value={data?.payment_transaction_id || data?.session_id || "N/A"}
              />
            </div>
          </div>
        </div>
        <Transaction
          roomType={roomType}
          roomCount={roomQuantity}
          duration={getNights(data?.check_in, data?.check_out)}
          total={formatAmount(data?.total_amount, data?.currency)}
        />
        <Policy List={policyList} />
      </div>
    </div>
  );
};

export const Transaction = ({
  roomType,
  roomCount,
  duration,
  total,
}: {
  roomType: string;
  roomCount: number;
  duration: string;
  total: string;
}) => {
  return (
    <div className="bg-[#fff] p-[24px] rounded-[12px]">
      <h1 className="text-[20px] font-[600] text-[#181818] mb-[16px]">Payment Details</h1>
      <div className="space-y-4">
        <div className="flex justify-between">
          <div className="space-y-3">
            <h1 className="text-[16px] font-[500] text-[#4E4F52]">{roomType}</h1>
            <div className="flex space-x-1 items-center">
              <span>{roomCount} room{roomCount > 1 ? "s" : ""}</span>
              <span className="w-[6px] h-[6px] bg-[#4E4F52] rounded-full"></span>
              <span>{duration}</span>
            </div>
          </div>

          <p>{total}</p>
        </div>
        <div className="border-[1px] border-[#ACAEB3] border-b"></div>
        <FlexValues title="Total" value={total} />
      </div>
    </div>
  );
};
