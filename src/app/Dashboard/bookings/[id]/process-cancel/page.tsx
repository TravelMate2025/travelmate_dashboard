"use client";
import React, { useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { GridValues, FlexValues, Policy } from "@/components/molecues/bookings/reuseables";
import { Switch } from "@/components/ui/switch";
import { useGetBooking, useProcessBookingCancellation } from "@/hooks/api/bookings";
import { getSingleRouteParam } from "@shared/lib/routeParams";

const formatDisplayDate = (value?: string) => {
  if (!value) return "--";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";

  return date.toLocaleDateString("en-GB");
};

interface CancellationResult {
  cancellation_reason?: string;
  cancellation_note?: string;
  cancellation_policy?: string[];
}

interface CancellationBooking {
  id?: string | number;
  cancellation_id?: string | number;
  cancellation_status?: string;
  booking_status?: string;
  cancellation_reason?: string;
  cancellation_note?: string;
  cancellation_requested_at?: string;
  updated_at?: string;
  created_at?: string;
  result?: CancellationResult;
}

interface CancelDetailsProps {
  booking?: CancellationBooking | null;
  loadingBooking?: boolean;
}

const page = () => {
  const params = useParams();
  const bookingId = getSingleRouteParam(params, "id");
  const router = useRouter();

  const { booking, loadingBooking } = useGetBooking({
    bookingRef: bookingId,
    initalFetch: Boolean(bookingId),
  });

  // if (!booking) {
  //   return (
  //     <div className="flex items-center justify-center h-full">
  //       <p>Booking not found</p>
  //     </div>
  //   );
  // }

  return (
    <div className="space-y-[24px]">
      <div className="flex space-x-4 items-center">
        <img
          src="/assets/icons/arrow-back.svg"
          alt=""
          className=" cursor-pointer "
          onClick={() => router.back()}
        />
        <h1 className="text-[24px] font-semibold text-[#181818]">
          Cancel Booking
        </h1>
      </div>

      <CancelDetails booking={booking} loadingBooking={loadingBooking} />
    </div>
  );
};

const CancelDetails = ({ booking, loadingBooking }: CancelDetailsProps) => {
  const cancellationStatus =
    booking?.cancellation_status || booking?.booking_status || "pending";

  const statusStyle =
    cancellationStatus?.toLowerCase() === "approved"
      ? "border-[#2EA043] text-[#2EA043] bg-[#2EA0431A]"
      : cancellationStatus?.toLowerCase() === "rejected"
      ? "border-[#D72638] text-[#D72638] bg-[#D726381A]"
      : "border-[#EFB608] text-[#EFB608] bg-[#EFB6081A]";

  const reason =
    booking?.cancellation_reason || booking?.result?.cancellation_reason || "--";
  const additionalDetails =
    booking?.cancellation_note || booking?.result?.cancellation_note || "--";

  const policyList = booking?.result?.cancellation_policy || [
    "Cancellation charges may apply based on fare rules.",
    "Refund timelines depend on provider and payment method.",
    "Processed cancellations are final once confirmed.",
  ];

  return (
    <div className="space-y-[24px]">
      <div className="bg-[#fff] p-[24px] space-y-[20px] rounded-[12px] w-full ">
        <h1 className="font-[600] text-[20px] text-[#181818] ">
          Cancellation Request
        </h1>

        <div className="flex justify-between items-center">
          <GridValues
            title="Cancellation ID"
            value={
              loadingBooking
                ? "Loading..."
                : booking?.cancellation_id || `CAN-${booking?.id || "--"}`
            }
          />
          <GridValues
            title="Date Requested"
            value={
              loadingBooking
                ? "Loading..."
                : formatDisplayDate(
                    booking?.cancellation_requested_at ||
                      booking?.updated_at ||
                      booking?.created_at
                  )
            }
          />

          <div className="flex flex-col items-start space-y-3">
            <h1 className="text-[16px] font-[500] text-[#4E4F52] whitespace-nowrap">
              Cancellation Status
            </h1>
            <div
              className={`border-[1px] rounded-[12px] text-[14px] font-[400] px-[20px] py-[10px] whitespace-nowrap flex-shrink-0 capitalize ${statusStyle}`}
            >
              {loadingBooking ? "Loading..." : cancellationStatus}
            </div>
          </div>
        </div>
      </div>
      <CancellationGrid
        booking={booking}
        reason={reason}
        additionalDetails={additionalDetails}
        policyList={policyList}
      />
    </div>
  );
};

const CancellationGrid = ({
  booking,
  reason,
  additionalDetails,
  policyList,
}: {
  booking?: CancellationBooking | null;
  reason: string;
  additionalDetails: string;
  policyList: string[];
}) => {
  return (
    <div className="grid grid-cols-2 gap-[24px]">
      <div className="space-y-6">
        <div className="bg-[#fff] space-y-[22px] p-[24px] rounded-[12px]">
          <div className="space-y-4">
            <h1 className="text-[20px] font-[600] text-[#181818]">
              Cancellation Request Details
            </h1>
            <div className="space-y-4">
              <GridValues title="Primary Reason" value={reason} />
              <GridValues title="Additional Details" value={additionalDetails} />
            </div>
          </div>
        </div>
        <Policy List={policyList} />
        <div className="bg-[#fff] space-y-[22px] p-[24px] rounded-[12px]">
          <div className="space-y-4">
            <h1 className="text-[20px] font-[600] text-[#181818]">
              Transaction Details
            </h1>
            <div className="space-y-4">
              <FlexValues title="Payment Method" value="Paypal" />
              <FlexValues title="Transaction ID" value="TXN789456123" />
            </div>
          </div>
        </div>
      </div>
      <Form booking={booking} />
    </div>
  );
};

const Form = ({ booking }: { booking?: CancellationBooking | null }) => {
  const params = useParams();
  const searchParams = useSearchParams();
  const [overridePolicy, setOverridePolicy] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const { processCancellation, loading } = useProcessBookingCancellation();

  const normalizeId = (value?: string | number | null) => {
    if (value === undefined || value === null) return "";

    const trimmed = String(value).trim();
    if (!trimmed || trimmed === "undefined" || trimmed === "null") {
      return "";
    }

    return trimmed;
  };

  const bookingIdFromRoute = normalizeId(getSingleRouteParam(params, "id"));
  const cancellationIdFromQuery = normalizeId(searchParams.get("cancellationId"));
  const cancellationIdFromBooking = booking?.cancellation_id
    ? normalizeId(booking.cancellation_id)
    : "";
  const bookingIdFromBooking = booking?.id ? normalizeId(booking.id) : "";

  // Some flows provide cancellation_id while others only provide booking id.
  const processTargetId =
    cancellationIdFromQuery ||
    cancellationIdFromBooking ||
    bookingIdFromBooking ||
    bookingIdFromRoute;

  const handleProcessCancellation = async () => {
    if (!processTargetId) return;

    await processCancellation({
      id: processTargetId,
      payload: {
        note: adminNote,
        override_policy: overridePolicy,
      },
    });
  };

  return (
    <div className="bg-[#fff] space-y-[22px] p-[24px] rounded-[12px]">
      <div className="space-y-4">
        <h1 className="text-[20px] font-[600] text-[#181818]">
          Cancellation and Refunds
        </h1>
        <div className="space-y-4">
          <FlexValues title="Original Payment" value="₦80,000" />
          <FlexValues title="Payment Processing fee" value="-₦3500" red />
          <FlexValues title="Cancellation fee" value="-₦0" red />
          <div className="borde-[1px] border-[#ACAEB3] border-b "></div>
          <FlexValues title="Expected Customer Refund" value="₦80,000" />
        </div>

        <div className="flex justify-between items-center bg-[#DEDFE126] rounded-[12px] p-[12px]">
          <div className="flex items-center space-x-1">
            <img src="/assets/icons/vector-red.svg" alt="" className="" />
            <p className="text-[#D72638] text-[18px] font-[500]">
              Override Policy
            </p>
          </div>

          <Switch
            id="airplane-mode"
            checked={overridePolicy}
            onCheckedChange={(checked) => setOverridePolicy(Boolean(checked))}
          />
        </div>
      </div>
      <div className="space-y-[20px] rounded-[12px] w-full ">
        <h1 className="font-[600] text-[20px] text-[#181818] ">
          Admin Decision
        </h1>

        <div className="space-y-[34px]">
          <textarea
            name=""
            id=""
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            className="w-full border-[1px] rounded-[8px] border-[#818489] px-[12px] pt-[16px] text-[16px] placeholder:text-[16px] font-[400] placeholder:font-[400]  placeholder:text-[#818489] text-[#181818] "
            placeholder="Add notes about this cancellation..."
            cols={7}
            rows={8}
          ></textarea>

          <button
            type="button"
            onClick={handleProcessCancellation}
            disabled={loading || !processTargetId}
            className="w-full bg-[#023E8A] p-[16px] rounded-[8px] text-[#ffff] text-[20px] font-[500] text-center disabled:bg-gray-400"
          >
            {loading ? "Processing..." : "Process Cancellation and refund"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default page;
