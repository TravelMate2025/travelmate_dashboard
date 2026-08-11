"use client";
import React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useGetBooking, useRequestBookingCancellation } from "@/hooks/api/bookings";

import StayDetails from "@/components/molecues/bookings/data/stays/StaysDetails";
import CarDetails from "@/components/molecues/bookings/data/cars/CarDetails";
import FlightDetails from "@/components/molecues/bookings/data/flight/FlightDetails";
import BookingService from "@/services/booking";
import type { RefundAction, RefundOperations as RefundOperationsData } from "@/services/booking/types";

export default function BookingDetailsPage() {
  const { id }: { id: string } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const routeBookingType = searchParams.get("type")?.toLowerCase();
  const normalizedRouteType =
    routeBookingType === "stays" ||
    routeBookingType === "stay" ||
    routeBookingType === "flights" ||
    routeBookingType === "flight" ||
    routeBookingType === "transfers" ||
    routeBookingType === "transfer" ||
    routeBookingType === "cars" ||
    routeBookingType === "car" ||
    routeBookingType === "taxi" ||
    routeBookingType === "taxis"
      ? routeBookingType === "stay"
        ? "stays"
        : routeBookingType === "flight"
        ? "flights"
        : routeBookingType === "transfer" ||
          routeBookingType === "cars" ||
          routeBookingType === "car" ||
          routeBookingType === "taxi" ||
          routeBookingType === "taxis"
        ? "transfers"
        : routeBookingType
      : undefined;
  const { requestCancellation, loading: requestingCancellation } =
    useRequestBookingCancellation();

  const { booking, loadingBooking } = useGetBooking({
    bookingRef: id,
    bookingType: normalizedRouteType,
    initalFetch: true,
    successCallback: () => {},
  });

  const currentType = booking?.booking_type?.toLowerCase() ?? "";
  const resultStatus = String(
    (booking?.result as { booking_status?: string; status?: string } | undefined)?.booking_status ||
    (booking?.result as { status?: string } | undefined)?.status ||
    booking?.booking_status ||
    "",
  ).toLowerCase();
  const isTerminalBooking = ["cancelled", "canceled", "refunded", "completed", "failed", "payment_failed"].includes(resultStatus);
  const resolvedBookingType =
    currentType === "flights" ||
    currentType === "stays" ||
    currentType === "transfers"
      ? currentType
      : undefined;
  const bookingResult = booking?.result ?? {};

  const reconcileRefund = async (): Promise<RefundOperationsData | null> => {
    const refundId = String(
      (booking?.result as { refund_operations?: { id?: string | null } } | undefined)
        ?.refund_operations?.id || "",
    );
    if (!refundId) return null;
    const idempotencyKey = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `dashboard-reconcile-${Date.now()}`;
    const response = await BookingService.reconcileRefund({
      refundId,
      idempotencyKey,
    });
    return (response.data?.refund || null) as RefundOperationsData | null;
  };

  const executeRefundAction = async (action: RefundAction, reason: string, confirmSettlement = false): Promise<RefundOperationsData | null> => {
    const refundId = String((booking?.result as { refund_operations?: { id?: string | null } } | undefined)?.refund_operations?.id || "");
    if (!refundId) return null;
    const idempotencyKey = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `dashboard-refund-${Date.now()}`;
    const response = await BookingService.refundAction({ refundId, action, reason, confirmSettlement, idempotencyKey });
    return response.data?.refund || null;
  };

  const bookingComponents: Record<string, React.ReactNode> = {
    stays: <StayDetails data={bookingResult} onReconcile={reconcileRefund} onAction={executeRefundAction} />,
    transfers: <CarDetails data={bookingResult} onReconcile={reconcileRefund} onAction={executeRefundAction} />,
    flights: <FlightDetails data={bookingResult} onReconcile={reconcileRefund} onAction={executeRefundAction} />,
  };

  const handleRequestCancellation = async () => {
    if (!id) return;

    const cancellationType = resolvedBookingType || normalizedRouteType;
    const typeQuery = cancellationType
      ? `&type=${encodeURIComponent(cancellationType)}`
      : "";

    await requestCancellation({
      bookingId: id,
      bookingType: cancellationType,
      reason: "Cancellation requested by admin",
      successCallback: ({ cancellationRequestId }) => {
        router.push(
          cancellationRequestId
            ? `/Dashboard/bookings/${id}/process-cancel?cancellationId=${encodeURIComponent(cancellationRequestId)}${typeQuery}`
            : `/Dashboard/bookings/${id}/process-cancel${
                cancellationType
                  ? `?type=${encodeURIComponent(cancellationType)}`
                  : ""
              }`
        );
      },
    });
  };

  if (loadingBooking || !booking || !booking.result) {
    return (
      <div className="space-y-[24px]">
        <div className="flex justify-between items-center">
          <div className="flex space-x-4 items-center">
            <img
              src="/assets/icons/arrow-back.svg"
              alt="Go back"
              className="cursor-pointer"
              onClick={() => router.back()}
            />
            <h1 className="text-[28px] font-semibold text-[#181818]">
              Booking Details
            </h1>
          </div>
          <div className="h-[40px] w-[140px] rounded-[8px] bg-gray-200 animate-pulse" />
        </div>

        {/* Summary skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-[12px] border border-gray-100 bg-white p-4">
            <div className="animate-pulse space-y-3">
              <div className="h-4 w-1/3 bg-gray-200 rounded" />
              <div className="h-6 w-1/2 bg-gray-200 rounded" />
              <div className="h-4 w-2/3 bg-gray-200 rounded" />
            </div>
          </div>
          <div className="rounded-[12px] border border-gray-100 bg-white p-4">
            <div className="animate-pulse space-y-3">
              <div className="h-4 w-1/3 bg-gray-200 rounded" />
              <div className="h-6 w-1/2 bg-gray-200 rounded" />
              <div className="h-4 w-2/3 bg-gray-200 rounded" />
            </div>
          </div>
          <div className="rounded-[12px] border border-gray-100 bg-white p-4">
            <div className="animate-pulse space-y-3">
              <div className="h-4 w-1/3 bg-gray-200 rounded" />
              <div className="h-6 w-1/2 bg-gray-200 rounded" />
              <div className="h-4 w-2/3 bg-gray-200 rounded" />
            </div>
          </div>
        </div>

        {/* Details skeleton card */}
        <div className="rounded-[12px] border border-gray-100 bg-white p-6">
          <div className="animate-pulse space-y-6">
            <div className="flex items-center justify-between">
              <div className="h-6 w-40 bg-gray-200 rounded" />
              <div className="h-4 w-24 bg-gray-200 rounded" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-10 w-full bg-gray-200 rounded" />
              </div>
              <div className="space-y-3">
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-10 w-full bg-gray-200 rounded" />
              </div>
              <div className="space-y-3">
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-10 w-full bg-gray-200 rounded" />
              </div>
              <div className="space-y-3">
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-10 w-full bg-gray-200 rounded" />
              </div>
            </div>

            <div className="h-[1px] w-full bg-gray-100" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-12 w-full bg-gray-200 rounded" />
              <div className="h-12 w-full bg-gray-200 rounded" />
              <div className="h-12 w-full bg-gray-200 rounded" />
            </div>
          </div>
        </div>

        {/* Secondary list skeletons */}
        <div className="rounded-[12px] border border-gray-100 bg-white p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-5 w-48 bg-gray-200 rounded" />
            <div className="space-y-3">
              <div className="h-4 w-full bg-gray-200 rounded" />
              <div className="h-4 w-5/6 bg-gray-200 rounded" />
              <div className="h-4 w-2/3 bg-gray-200 rounded" />
              <div className="h-4 w-3/4 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-xl border border-[#dfe7f0] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(16,42,67,0.04)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/assets/icons/arrow-back.svg"
            alt="Go back"
            className="cursor-pointer"
            onClick={() => router.back()}
          />
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#023E8A]">Operations</p><h1 className="text-[22px] font-semibold text-[#18202b]">Booking details</h1></div>
        </div>

        {!isTerminalBooking && <button
          className="rounded-lg bg-[#d72638] px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#b91f2f] disabled:cursor-wait disabled:opacity-60"
          onClick={handleRequestCancellation}
          disabled={requestingCancellation}
        >
          {requestingCancellation ? "Requesting..." : "Cancel Booking"}
        </button>}
      </div>

      {bookingComponents[currentType] || (
        <div className="text-center py-6 text-gray-400">
          No details available for this booking type.
        </div>
      )}
    </div>
  );
}
