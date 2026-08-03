import React from "react";
import { GridValues, FlexValues, Policy } from "../../reuseables";
import CancellationFinancials, { CancellationFinancialData } from "../../CancellationFinancials";
import { parseISO, format, formatDate } from "date-fns";

type CancellationPolicyEntry = {
  from?: string;
  amount?: number | string;
  currency?: string;
};

type CarBookingData = {
  booking_reference?: string;
  date_booked?: string;
  payment_status?: string;
  booking_status?: string;
  pickup_location_label?: string;
  pickup_date?: string;
  pickup_time?: string;
  dropoff_location_label?: string;
  passenger_name?: string;
  dob?: string;
  email?: string;
  contact_phone?: string;
  transfer_type?: string;
  total_amount?: number;
  passenger_capacity?: number;
  luggage_capacity?: number;
  provider_name?: string;
  payment_transaction_id?: string;
  estimated_duration_minutes?: number;
  cancellation_policy?: CancellationPolicyEntry[] | null;
  currency?: string;
  refund_amount?: number | string | null;
  cancellation_fee?: number | string | null;
  refund_percent?: number | null;
  refund_status?: string | null;
  cancellation_response?: Record<string, unknown> | null;
  cancellation_preview?: CancellationFinancialData["cancellation_preview"];
};

const formatCancellationPolicy = (
  policy?: CancellationPolicyEntry[] | null
): string[] => {
  if (!Array.isArray(policy) || policy.length === 0) {
    return ["Cancellation policy is not provided by the supplier for this booking."];
  }
  return policy.map((entry) => {
    const dateLabel = entry?.from ? new Date(entry.from).toLocaleDateString("en-GB") : null;
    const amountLabel =
      entry?.amount !== undefined && entry?.amount !== null
        ? `${entry.currency || ""} ${entry.amount}`.trim()
        : null;
    if (dateLabel && amountLabel) {
      return `From ${dateLabel}: ${amountLabel} cancellation fee applies.`;
    }
    if (amountLabel) return `${amountLabel} cancellation fee applies.`;
    if (dateLabel) return `Cancellation terms apply from ${dateLabel}.`;
    return "Cancellation terms apply.";
  });
};

const formatDuration = (minutes?: number): string => {
  if (!minutes || minutes <= 0) return "—";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours && mins) return `${hours}h ${mins}m`;
  if (hours) return `${hours}h`;
  return `${mins}m`;
};

const CarDetails = ({ data }: { data: CarBookingData }) => {
  return (
    <div className="space-y-[24px]">
      <BookingDetails data={data} />
      <GridDetails data={data} />
      <CancellationFinancials data={data} />
    </div>
  );
};

const BookingDetails = ({ data }: { data: CarBookingData }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB");
  };

  const getStatusStyling = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "confirmed":
      case "paid":
        return "text-[#2D9C5E] border-[#2D9C5E] bg-[#2D9C5E1A]";
      case "cancelled":
      case "failed":
      case "refunded":
        return "text-[#E74C3C] border-[#E74C3C] bg-[#E74C3C1A]";
      case "ongoing":
        return "text-[#0084D9] border-[#0084D9] bg-[#0084D91A]";
      case "pending":
      default:
        return "text-[#EFB608] border-[#EFB608] bg-[#EFB60833]";
    }
  };

  return (
    <div className="space-y-[24px]">
      <div className="bg-[#fff] p-[24px] space-y-[20px] rounded-[12px] w-full ">
        <h1 className="font-[600] text-[20px] text-[#181818] ">
          Confirmation Details
        </h1>

        <div className="flex justify-between items-center">
          <GridValues
            title="Booking Refrence"
            value={data?.booking_reference}
          />
          <GridValues title="Booked On" value={formatDate(data?.date_booked)} />

          <div className="flex flex-col items-start space-y-3">
            <h1 className="text-[16px] font-[500] text-[#4E4F52] whitespace-nowrap">
              Payment Status
            </h1>
            <div
              className={`border rounded-[12px] text-[14px] font-[400] p-[8px] w-fit ${getStatusStyling(
                data.payment_status
              )}`}
            >
              {data.payment_status || "PENDING"}
            </div>
          </div>
          <div className="flex flex-col items-start space-y-3">
            <h1 className="text-[16px] font-[500] text-[#4E4F52] whitespace-nowrap">
              Booking Status
            </h1>
            <div
              className={`border rounded-[12px] text-[14px] font-[400] p-[8px] w-fit ${getStatusStyling(
                data.booking_status
              )}`}
            >
              {data.booking_status || "PENDING"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const GridDetails = ({ data }: { data: CarBookingData }) => {
  const formatDate2 = (dateString: string) => {
    if (!dateString) return "";

    const parsedDate = parseISO(dateString);
    return format(parsedDate, "MMM d, yyyy");
  };
  const List = formatCancellationPolicy(data?.cancellation_policy);
  return (
    <div className="grid grid-cols-2 gap-[24px]">
      <div className="space-y-6">
        <div className="bg-[#fff] space-y-[22px] p-[24px] rounded-[12px]">
          <div className="space-y-4">
            <h1 className="text-[20px] font-[600] text-[#181818]">
              Trip Details
            </h1>
            <div className="space-y-4">
              <FlexValues
                title="Pick Up Location"
                value={data?.pickup_location_label}
              />
              <FlexValues
                title="Pick Up Date"
                value={formatDate2(data.pickup_date)}
              />
              <FlexValues title="Pick Up Time" value={data?.pickup_time} />
              <FlexValues
                title="Drop Off Location"
                value={data?.dropoff_location_label}
              />
              <FlexValues
                title="Estimated Duration"
                value={formatDuration(data?.estimated_duration_minutes)}
              />
            </div>
          </div>
        </div>
        <div className="bg-[#fff] space-y-[22px] p-[24px] rounded-[12px]">
          <div className="space-y-4">
            <h1 className="text-[20px] font-[600] text-[#181818]">
              Passenger Details
            </h1>
            <div className="space-y-4">
              <FlexValues title="Name" value={data?.passenger_name} />
              <FlexValues title="Date Of Birth" value={data?.dob} />
            </div>
          </div>
          <div className="space-y-4">
            <h1 className="text-[20px] font-[600] text-[#181818]">
              Contact Information
            </h1>
            <div className="space-y-4">
              <FlexValues title="Email Address" value={data?.email} />
              <FlexValues title="Phone Number" value={data?.contact_phone} />
            </div>
          </div>
        </div>
        <div className="bg-[#fff] space-y-[22px] p-[24px] rounded-[12px]">
          <div className="space-y-4">
            <h1 className="text-[20px] font-[600] text-[#181818]">
              Taxi Details
            </h1>
            <div className="space-y-4">
              <FlexValues title="Type" value={data.transfer_type} />
              <FlexValues
                title="Seats"
                value={data?.passenger_capacity ? `${data.passenger_capacity} Seats` : "—"}
              />
              <FlexValues
                title="Luggage"
                value={data?.luggage_capacity ? `Up to ${data.luggage_capacity} bags` : "—"}
              />
              <FlexValues title="Provider" value={data?.provider_name || "—"} />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-[#fff] space-y-[22px] p-[24px] rounded-[12px]">
          <div className="space-y-4">
            <h1 className="text-[20px] font-[600] text-[#181818]">
              Transaction Details
            </h1>
            <div className="space-y-4">
              <FlexValues title="Payment Method" value="—" />
              <FlexValues
                title="Transaction ID"
                value={data?.payment_transaction_id || "—"}
              />
            </div>
          </div>
        </div>
        <Transaction value={data.total_amount} />
        <Policy List={List} />
      </div>
    </div>
  );
};

export const Transaction = ({ value }: { value: number | string }) => {
  return (
    <div className="bg-[#fff] p-[24px] rounded-[12px]">
      <h1 className="text-[20px] font-[600] text-[#181818] mb-[16px]">
        Payment Details
      </h1>
      <div className="space-y-4">
        <FlexValues title="Total" value={`₦${value}`} />
      </div>
    </div>
  );
};

export default CarDetails;
