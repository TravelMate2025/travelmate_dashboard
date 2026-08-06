"use client";
import React, { useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { GridValues, FlexValues, Policy } from "@/components/molecues/bookings/reuseables";
import { Switch } from "@/components/ui/switch";
import {
  useGetBooking,
  useProcessBookingCancellation,
  useRequestBookingCancellation,
  CancellationRequestPreview,
} from "@/hooks/api/bookings";
import { getSingleRouteParam } from "@shared/lib/routeParams";

const formatMoney = (value?: string | number | null) => {
  if (value === undefined || value === null || value === "") return "—";
  const numeric = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(numeric)) return "—";
  return `₦${numeric.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

type SupportedBookingType = "stays" | "flights" | "transfers";

const formatDisplayDate = (value?: string) => {
  if (!value) return "--";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";

  return date.toLocaleDateString("en-GB");
};

const normalizePolicyList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        return String(record.terms || record.policyCopy || record.label || "");
      }
      return "";
    }).filter(Boolean);
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const text = record.policyCopy || record.terms || record.label;
    return typeof text === "string" && text.trim() ? [text] : [];
  }
  return [];
};

interface CancellationResult {
  cancellation_reason?: string;
  cancellation_note?: string;
  cancellation_policy?: unknown;
  booking_status?: string;
  status?: string;
}

interface CancellationBooking {
  id?: string | number;
  booking_type?: string;
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
  bookingId?: string;
  routeBookingType?: SupportedBookingType;
}

const page = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const bookingId = getSingleRouteParam(params, "id");
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
    routeBookingType === "taxis" ||
    routeBookingType === "taxi"
      ? routeBookingType === "stay"
        ? "stays"
        : routeBookingType === "flight"
        ? "flights"
        : routeBookingType === "transfer" ||
          routeBookingType === "cars" ||
          routeBookingType === "car" ||
          routeBookingType === "taxis" ||
          routeBookingType === "taxi"
        ? "transfers"
        : routeBookingType
      : undefined;
  const router = useRouter();

  const { booking, loadingBooking } = useGetBooking({
    bookingRef: bookingId,
    bookingType: normalizedRouteType,
    initalFetch: Boolean(bookingId),
  });

  const loadedBookingStatus = String(
    booking?.result?.booking_status || booking?.result?.status || booking?.booking_status || "",
  ).toLowerCase();
  const isTerminalBooking = ["cancelled", "canceled", "refunded", "completed", "failed", "payment_failed"].includes(loadedBookingStatus);

  // if (!booking) {
  //   return (
  //     <div className="flex items-center justify-center h-full">
  //       <p>Booking not found</p>
  //     </div>
  //   );
  // }

  if (!loadingBooking && !booking) {
    return (
      <div className="space-y-5">
        <button type="button" className="text-sm font-medium text-[#023E8A]" onClick={() => router.back()}>← Back to booking</button>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">This booking could not be loaded. Cancellation was not started.</div>
      </div>
    );
  }

  if (!loadingBooking && isTerminalBooking) {
    return (
      <div className="space-y-5">
        <button type="button" className="text-sm font-medium text-[#023E8A]" onClick={() => router.back()}>← Back to booking</button>
        <div className="rounded-xl border border-[#dfe7f0] bg-white p-5 shadow-sm"><h1 className="text-lg font-semibold text-[#18202b]">Cancellation unavailable</h1><p className="mt-2 text-sm text-[#687382]">This booking is already {loadedBookingStatus}. No new cancellation request can be created.</p></div>
      </div>
    );
  }

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

      <CancelDetails
        booking={booking}
        loadingBooking={loadingBooking}
        bookingId={bookingId}
        routeBookingType={normalizedRouteType}
      />
    </div>
  );
};

const CancelDetails = ({
  booking,
  loadingBooking,
  bookingId,
  routeBookingType,
}: CancelDetailsProps) => {
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

  const policyList = normalizePolicyList(booking?.result?.cancellation_policy);
  const safePolicyList = policyList.length ? policyList : [
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
        bookingId={bookingId}
        routeBookingType={routeBookingType}
        reason={reason}
        additionalDetails={additionalDetails}
        policyList={safePolicyList}
      />
    </div>
  );
};

const CancellationGrid = ({
  booking,
  bookingId,
  routeBookingType,
  reason,
  additionalDetails,
  policyList,
}: {
  booking?: CancellationBooking | null;
  bookingId?: string;
  routeBookingType?: SupportedBookingType;
  reason: string;
  additionalDetails: string;
  policyList: string[];
}) => {
  // Real transaction/refund figures only exist once a CancellationRequest has
  // been created (request-cancellation) or resolved (process-cancellation) —
  // the backend doesn't expose a read-only "preview" endpoint. Populated by
  // Form's handleProcessCancellation as soon as either call resolves, so
  // these panels show "—" rather than fabricated placeholder values before
  // that happens.
  const [cancellationPreview, setCancellationPreview] =
    useState<CancellationRequestPreview | null>(null);

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
              <FlexValues
                title="Payment Method"
                value={cancellationPreview?.payment_method || "—"}
              />
              <FlexValues
                title="Transaction ID"
                value={cancellationPreview?.transaction_id || "—"}
              />
            </div>
          </div>
        </div>
      </div>
      <Form
        booking={booking}
        bookingId={bookingId}
        routeBookingType={routeBookingType}
        cancellationPreview={cancellationPreview}
        onCancellationPreview={setCancellationPreview}
      />
    </div>
  );
};

const Form = ({
  booking,
  bookingId,
  routeBookingType,
  cancellationPreview,
  onCancellationPreview,
}: {
  booking?: CancellationBooking | null;
  bookingId?: string;
  routeBookingType?: SupportedBookingType;
  cancellationPreview: CancellationRequestPreview | null;
  onCancellationPreview: (preview: CancellationRequestPreview) => void;
}) => {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [overridePolicy, setOverridePolicy] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [workingMessage, setWorkingMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { processCancellation, loading } = useProcessBookingCancellation();
  const { requestCancellation, loading: requesting } =
    useRequestBookingCancellation();

  const normalizeId = (value?: string | number | null) => {
    if (value === undefined || value === null) return "";

    const trimmed = String(value).trim();
    if (!trimmed || trimmed === "undefined" || trimmed === "null") {
      return "";
    }

    return trimmed;
  };

  const bookingIdFromRoute = normalizeId(
    bookingId || getSingleRouteParam(params, "id")
  );
  const cancellationIdFromQuery = normalizeId(searchParams.get("cancellationId"));
  const cancellationIdFromBooking = booking?.cancellation_id
    ? normalizeId(booking.cancellation_id)
    : "";

  // Unified process-cancellation endpoint expects cancellation request id.
  const processTargetId =
    cancellationIdFromQuery ||
    cancellationIdFromBooking;

  const bookingTypeFromData = (() => {
    const rawType = String(booking?.booking_type || "")
      .trim()
      .toLowerCase();

    return rawType === "stays" || rawType === "flights" || rawType === "transfers"
      ? rawType
      : undefined;
  })();

  const effectiveBookingType = bookingTypeFromData || routeBookingType;

  const handleProcessCancellation = async () => {
    setErrorMessage(null);
    let cancellationRequestId = processTargetId;

    if (!cancellationRequestId) {
      if (!bookingIdFromRoute) {
        setErrorMessage("Booking ID is required to process cancellation.");
        return;
      }

      setWorkingMessage("Creating cancellation request...");
      const cancellationRequestResult = await requestCancellation({
        bookingId: bookingIdFromRoute,
        bookingType: effectiveBookingType,
        reason: "Cancellation requested by admin",
        adminRemark: adminNote,
        errorCallback: ({ message, description }) => {
          setErrorMessage(`${message}${description ? ": " + description : ""}`);
        },
      });

      cancellationRequestId = normalizeId(
        cancellationRequestResult?.cancellationRequestId
      );
      if (cancellationRequestResult?.cancellationRequest) {
        onCancellationPreview(cancellationRequestResult.cancellationRequest);
      }
    }

    if (!cancellationRequestId) {
      setErrorMessage("Failed to create cancellation request. Please try again.");
      setWorkingMessage(null);
      return;
    }

    setWorkingMessage("Processing cancellation and refund...");

    console.log("[ProcessCancellation] Submitting", {
      cancellationRequestId,
      payload: {
        note: adminNote,
        override_policy: overridePolicy,
      },
    });

    await processCancellation({
      id: cancellationRequestId,
      payload: {
        note: adminNote,
        override_policy: overridePolicy,
      },
      successCallback: ({ cancellationRequest }) => {
        if (cancellationRequest) {
          onCancellationPreview(cancellationRequest);
        }
        setWorkingMessage(null);
        router.push("/Dashboard/bookings");
      },
      errorCallback: ({ message, description }) => {
        setErrorMessage(`${message}${description ? ": " + description : ""}`);
      },
    });

    setWorkingMessage(null);
  };

  return (
    <div className="bg-[#fff] space-y-[22px] p-[24px] rounded-[12px]">
      <div className="space-y-4">
        <h1 className="text-[20px] font-[600] text-[#181818]">
          Cancellation and Refunds
        </h1>
        <div className="space-y-4">
          <FlexValues
            title="Original Payment"
            value={formatMoney(cancellationPreview?.original_payment)}
          />
          <FlexValues
            title="Payment Processing fee"
            value={
              cancellationPreview?.processing_fee
                ? `-${formatMoney(cancellationPreview.processing_fee)}`
                : "—"
            }
            red
          />
          <FlexValues
            title="Cancellation fee"
            value={
              cancellationPreview?.cancellation_fee
                ? `-${formatMoney(cancellationPreview.cancellation_fee)}`
                : "—"
            }
            red
          />
          <div className="borde-[1px] border-[#ACAEB3] border-b "></div>
          <FlexValues
            title="Expected Customer Refund"
            value={formatMoney(cancellationPreview?.refund_amount)}
          />
        </div>

        {errorMessage && (
          <div className="bg-[#D726381A] border border-[#D72638] rounded-[8px] p-[12px]">
            <p className="text-[#D72638] text-[14px] font-[400]">{errorMessage}</p>
          </div>
        )}

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
            disabled={loading || requesting || !bookingIdFromRoute}
            className="w-full bg-[#023E8A] p-[16px] rounded-[8px] text-[#ffff] text-[20px] font-[500] text-center disabled:bg-gray-400"
            title={!bookingIdFromRoute ? "Booking ID is required before processing." : undefined}
          >
            {workingMessage
              ? workingMessage
              : loading || requesting
              ? "Processing..."
              : "Process Cancellation and refund"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default page;
