import React from "react";
import { GridValues, FlexValues, Policy } from "../../reuseables";
import { parseISO, format, formatDate } from "date-fns";

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
};

const CarDetails = ({ data }: { data: CarBookingData }) => {
  return (
    <div className="space-y-[24px]">
      <BookingDetails data={data} />
      <GridDetails data={data} />
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
        return "text-[#E74C3C] border-[#E74C3C] bg-[#E74C3C1A]";
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
  const List = [
    "Full refund if cancelled 4+ hours before scheduled pickup time. Processing fee of ₦3500 applies.",
    "25% cancellation fee applies when cancelled between 2-4 hours before pickup.",
    "50% cancellation fee applies when cancelled less than 2 hours before pickup.",
    "No refund for no-shows or same-hour cancellations.",
  ];
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
                value={data?.booking_status}
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
              <FlexValues title="Seats" value="3 Seats" />
              <FlexValues title="Luggage" value="Up to 4 bags" />
              <FlexValues title="Provider" value="Holiday Taxis" />
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
              <FlexValues title="Payment Method" value="Paypal" />
              <FlexValues title="Transaction ID" value="TXN789456123" />
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
