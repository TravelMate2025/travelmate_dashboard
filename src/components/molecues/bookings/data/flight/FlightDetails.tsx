"use client";
import React from "react";
import { GridValues, FlexValues, Policy, LocationTag } from "../../reuseables";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import RefundSummary from "../../RefundSummary";

type FlightDuration = {
  day?: number;
  hr?: number;
  min?: number;
};

type FlightSegment = {
  id?: string;
  sequence?: number;
  airline_code?: string;
  flight_number?: string;
  cabin_class?: string;
  departure_datetime?: string;
  arrival_datetime?: string;
  aircraft_code?: string;
  duration?: FlightDuration;
  included_checked_bags?: number;
  from?: { airport?: string; label?: string };
  to?: { airport?: string; label?: string };
  layover_to_next?: { duration?: FlightDuration };
  change_of_aircraft?: boolean;
  aircraft_change_to?: {
    airline_code?: string;
    flight_number?: string;
    aircraft_code?: string;
  };
};

type FlightLeg = {
  leg?: "DEPARTURE" | "RETURN" | string;
  segments?: FlightSegment[];
  summary?: {
    departure_datetime?: string;
    arrival_datetime?: string;
    from?: { airport?: string; label?: string };
    to?: { airport?: string; label?: string };
    cabin_class?: string;
    total_duration?: FlightDuration;
    baggage_summary?: { included_checked_bags?: number };
    stops_count?: number;
  };
};

type FlightPassenger = {
  id?: string;
  title?: string;
  first_name?: string;
  last_name?: string;
  dob?: string;
  gender?: string;
  passport_number?: string;
  nationality?: string;
  email?: string;
  phone_number?: string;
};

type FlightBookingData = {
  booking_reference?: string;
  date_booked?: string;
  payment_status?: string;
  booking_status?: string;
  passenger_count?: number;
  passengers?: FlightPassenger[];
  pickup_location?: string;
  payment_method?: string;
  transaction_id?: string;
  total_amount?: number;
  tax?: number;
  flight_itinerary?: FlightLeg[];
  refund_status?: string | null;
  refund?: React.ComponentProps<typeof RefundSummary>["refund"];
  refund_operations?: React.ComponentProps<typeof RefundSummary>["refund_operations"];
};

const FlightDetails = ({ data }: { data: FlightBookingData }) => {
  return (
    <div className="space-y-[24px]">
      <BookingDetails data={data} />
      <GridDetails data={data} />
      <RefundSummary refund={data.refund} refund_operations={data.refund_operations} refund_status={data.refund_status} />
    </div>
  );
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB");
};

const BookingDetails = ({ data }: { data: FlightBookingData }) => {
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
          <GridValues title="Booking Refrence" value={data.booking_reference} />
          <GridValues title="E- ticket Number" value="123456" />
          <GridValues title="Booked On" value={formatDate(data.date_booked)} />

          <div className="flex flex-col items-start space-y-3">
            <h1 className="text-[16px] font-[500] text-[#4E4F52] whitespace-nowrap">
              Payment Status{" "}
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

export const GridDetails = ({ data }: { data: FlightBookingData }) => {
  const List = [
    "Full refund if cancelled 4+ hours before scheduled pickup time. Processing fee of ₦3500 applies.",
    "25% cancellation fee applies when cancelled between 2-4 hours before pickup.",
    "50% cancellation fee applies when cancelled less than 2 hours before pickup.",
    "No refund for no-shows or same-hour cancellations.",
  ];

  // Handle toggling which passenger sections are open
  const [openPassengerIndex, setOpenPassengerIndex] = useState<number | null>(
    null
  );

  const togglePassenger = (index: number) => {
    setOpenPassengerIndex(openPassengerIndex === index ? null : index);
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return "N/A";
    const d = new Date(dateString);
    return d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime12 = (dateString?: string) => {
    if (!dateString) return "N/A";
    const d = new Date(dateString);
    const raw = d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return raw.replace("AM", "am").replace("PM", "pm");
  };

  const formatDuration = (duration?: {
    day?: number;
    hr?: number;
    min?: number;
  }) => {
    if (!duration) return "N/A";
    const parts: string[] = [];
    if (duration.day) parts.push(`${duration.day}d`);
    if (duration.hr || duration.hr === 0) parts.push(`${duration.hr}h`);
    if (duration.min || duration.min === 0) parts.push(`${duration.min}m`);
    return parts.join(" ");
  };

  const formatAirportLabel = (code?: string, label?: string) => {
    if (!code && !label) return "N/A";
    if (label) return label;
    return code || "N/A";
  };

  const isRoundTrip =
    Array.isArray(data?.flight_itinerary) &&
    data.flight_itinerary.some((l: FlightLeg) => l.leg === "RETURN");

  const SubStops = ({ leg }: { leg: FlightLeg }) => {
    const segments = Array.isArray(leg?.segments) ? leg.segments : [];
    return (
      <div className="space-y-[12px]">
        {segments.map((seg: FlightSegment, idx: number) => {
          const layover = seg.layover_to_next;
          return (
            <div key={idx} className="bg-[#FAFAFA] rounded-[12px] p-[12px] space-y-3">
              <h1 className="text-[#181818] font-[500] text-[18px] leading-[100%]">
                Stop {seg.sequence || idx + 1}
              </h1>
              <LocationTag
                departureTime={
                  seg.departure_datetime
                    ? formatTime12(seg.departure_datetime)
                    : undefined
                }
                departureLabel={formatAirportLabel(
                  seg.from?.airport,
                  seg.from?.label
                )}
                arrivalTime={
                  seg.arrival_datetime
                    ? formatTime12(seg.arrival_datetime)
                    : undefined
                }
                arrivalLabel={formatAirportLabel(
                  seg.to?.airport,
                  seg.to?.label
                )}
              />
              <FlexValues
                title="Date"
                value={seg.departure_datetime ? formatDate(seg.departure_datetime) : "N/A"}
              />
              <FlexValues
                title="Duration"
                value={formatDuration(seg.duration)}
              />
              <FlexValues title="Aircraft" value={seg.aircraft_code || "N/A"} />
              <FlexValues
                title="Layover"
                value={
                  layover
                    ? `${layover.duration?.hr ?? 0}h ${
                        layover.duration?.min ?? 0
                      }m`
                    : "N/A"
                }
              />
              {seg.change_of_aircraft && seg.aircraft_change_to ? (
                <FlexValues
                  title="Aircraft Change to"
                  value={`${seg.aircraft_change_to.airline_code || ""} ${
                    seg.aircraft_change_to.flight_number || ""
                  } (${seg.aircraft_change_to.aircraft_code || ""})`}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-2 gap-[24px]">
      <div className="space-y-6 lg:sticky lg:top-4 self-start">
        <div className="bg-white p-[24px] space-y-5 rounded-[12px]">
          <h1 className="text-[16px] font-semibold text-[#181818]">
            Passenger Details ({data.passenger_count}{" "}
            {data.passenger_count === 1 ? "Passenger" : "Passengers"})
          </h1>
          {/* Passenger Details */}
          {data.passengers?.map((passenger: FlightPassenger, index: number) => {
            const isOpen =
              openPassengerIndex === index || data.passengers.length === 1;
            const passengerKey =
              passenger.id ||
              `${passenger.first_name || "unknown"}-${passenger.last_name || "passenger"}-${index}`;

            return (
              <div key={passengerKey} className="">
                <div className="space-y-[22px]">
                  <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => togglePassenger(index)}
                  >
                    {/* ✅ Dynamically show Adult Passenger count */}
                    <h1 className="text-[18px] font-[400] text-[#181818]">
                      Adult Passenger {index + 1}
                    </h1>

                    {data.passengers.length > 1 && (
                      <span className="text-sm text-gray-600">
                        {isOpen ? <ChevronUp /> : <ChevronDown />}
                      </span>
                    )}
                  </div>

                  {isOpen && (
                    <div className="space-y-4">
                      <FlexValues
                        title="Pick Up Location"
                        value={data.pickup_location || "N/A"}
                      />
                      <FlexValues
                        title="Title"
                        value={passenger.title || "N/A"}
                      />
                      <FlexValues
                        title="Name"
                        value={`${passenger.first_name} ${passenger.last_name}`}
                      />
                      <FlexValues
                        title="Date Of Birth"
                        value={formatDate(passenger.dob)}
                      />
                      <FlexValues
                        title="Gender"
                        value={passenger.gender || "N/A"}
                      />
                      <FlexValues
                        title="Passport Number"
                        value={passenger.passport_number || "N/A"}
                      />
                      <FlexValues
                        title="Nationality"
                        value={passenger.nationality || "N/A"}
                      />

                      {/* Contact Information Section */}
                      <div className="pt-2">
                        <h1 className="text-[16px] font-[600] text-[#181818]">
                          Contact Information
                        </h1>
                      </div>

                      <FlexValues
                        title="Email Address"
                        value={passenger.email || "N/A"}
                      />
                      <FlexValues
                        title="Phone Number"
                        value={passenger.phone_number || "N/A"}
                      />

                      {/* Divider */}
                      <div className="border-b-[2px] border-[#E5E7EB]"></div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Transaction Details */}
        <div className="bg-[#fff] space-y-[22px] p-[24px] rounded-[12px]">
          <div className="space-y-4">
            <h1 className="text-[20px] font-[600] text-[#181818]">
              Transaction Details
            </h1>
            <div className="space-y-4">
              <FlexValues
                title="Payment Method"
                value={data.payment_method || "N/A"}
              />
              <FlexValues
                title="Transaction ID"
                value={data.transaction_id || "N/A"}
              />
            </div>
          </div>
        </div>

        <Transaction data={data} />
        <Policy List={List} />
      </div>

      {/* Flight Details */}
      <div className="space-y-6">
        {/* Departure Flight */}
        <div className="bg-[#fff] space-y-[22px] p-[24px] rounded-[12px]">
          <div className="space-y-4">
            <h1 className="text-[20px] font-[600] text-[#181818]">
              Departure Flight Details
            </h1>
            {Array.isArray(data.flight_itinerary) ? (
              (() => {
                const depLeg = data.flight_itinerary.find(
                  (l: FlightLeg) => l.leg === "DEPARTURE"
                );
                if (!depLeg) return <LocationTag />;
                const summary = depLeg.summary || {};
                const depTime = summary.departure_datetime
                  ? formatTime12(summary.departure_datetime)
                  : undefined;
                const arrTime = summary.arrival_datetime
                  ? formatTime12(summary.arrival_datetime)
                  : undefined;
                const depLabel =
                  summary.from?.label ||
                  (summary.from?.airport
                    ? `${summary.from.airport}`
                    : undefined);
                const arrLabel =
                  summary.to?.label ||
                  (summary.to?.airport ? `${summary.to.airport}` : undefined);
                return (
                  <LocationTag
                    departureTime={depTime}
                    departureLabel={depLabel}
                    arrivalTime={arrTime}
                    arrivalLabel={arrLabel}
                  />
                );
              })()
            ) : (
              <LocationTag />
            )}
            <div className="space-y-4">
              {(() => {
                const depLeg =
                  Array.isArray(data.flight_itinerary) &&
                  data.flight_itinerary.find((l: FlightLeg) => l.leg === "DEPARTURE");
                const summary = depLeg?.summary;
                const firstSeg = depLeg?.segments?.[0];
                return (
                  <>
                    <FlexValues
                      title="Airline"
                      value={firstSeg?.airline_code || "N/A"}
                    />
                    <FlexValues
                      title="Flight Number"
                      value={firstSeg?.flight_number || "N/A"}
                    />
                    <FlexValues
                      title="Class"
                      value={
                        summary?.cabin_class || firstSeg?.cabin_class || "N/A"
                      }
                    />
                    <FlexValues
                      title="Date"
                      value={
                        summary?.departure_datetime
                          ? formatDate(summary.departure_datetime)
                          : firstSeg?.departure_datetime
                          ? formatDate(firstSeg.departure_datetime)
                          : "N/A"
                      }
                    />
                    <FlexValues
                      title="Air Craft Type"
                      value={firstSeg?.aircraft_code || "N/A"}
                    />
                    <FlexValues
                      title="Duration"
                      value={
                        summary
                          ? `${
                              summary.total_duration?.day
                                ? `${summary.total_duration.day}d `
                                : ""
                            }${summary.total_duration?.hr ?? 0}h ${
                              summary.total_duration?.min ?? 0
                            }m`
                          : "N/A"
                      }
                    />
                    <FlexValues
                      title="Baggage"
                      value={
                        typeof summary?.baggage_summary
                          ?.included_checked_bags !== "undefined"
                          ? `${summary.baggage_summary.included_checked_bags}`
                          : typeof firstSeg?.included_checked_bags !==
                            "undefined"
                          ? `${firstSeg.included_checked_bags}`
                          : "N/A"
                      }
                    />
                    <FlexValues
                      title="Stops"
                      value={
                        typeof summary?.stops_count !== "undefined"
                          ? `${summary.stops_count}`
                          : `${Math.max(
                              (depLeg?.segments?.length || 1) - 1,
                              0
                            )}`
                      }
                    />
                    <div className="border-b-[0.5px] border-[#9B9EA4]"></div>
                    {depLeg && depLeg.segments && depLeg.segments.length > 1 ? (
                      <SubStops leg={depLeg} />
                    ) : null}
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Return Flight - only show for round trips */}
        {isRoundTrip && (
          <div className="bg-[#fff] space-y-[22px] p-[24px] rounded-[12px]">
            <div className="space-y-4">
              <h1 className="text-[20px] font-[600] text-[#181818]">
                Return Flight Details
              </h1>
              {Array.isArray(data.flight_itinerary) ? (
                (() => {
                  const retLeg = data.flight_itinerary.find(
                    (l: FlightLeg) => l.leg === "RETURN"
                  );
                  if (!retLeg) return <LocationTag />;
                  const summary = retLeg.summary || {};
                  const depTime = summary.departure_datetime
                    ? formatTime12(summary.departure_datetime)
                    : undefined;
                  const arrTime = summary.arrival_datetime
                    ? formatTime12(summary.arrival_datetime)
                    : undefined;
                  const depLabel =
                    summary.from?.label ||
                    (summary.from?.airport
                      ? `${summary.from.airport}`
                      : undefined);
                  const arrLabel =
                    summary.to?.label ||
                    (summary.to?.airport ? `${summary.to.airport}` : undefined);
                  return (
                    <LocationTag
                      departureTime={depTime}
                      departureLabel={depLabel}
                      arrivalTime={arrTime}
                      arrivalLabel={arrLabel}
                    />
                  );
                })()
              ) : (
                <LocationTag />
              )}
              <div className="space-y-4">
                {(() => {
                  const retLeg =
                    Array.isArray(data.flight_itinerary) &&
                    data.flight_itinerary.find((l: FlightLeg) => l.leg === "RETURN");
                  const summary = retLeg?.summary;
                  const firstSeg = retLeg?.segments?.[0];
                  return (
                    <>
                      <FlexValues
                        title="Airline"
                        value={firstSeg?.airline_code || "N/A"}
                      />
                      <FlexValues
                        title="Flight Number"
                        value={firstSeg?.flight_number || "N/A"}
                      />
                      <FlexValues
                        title="Class"
                        value={
                          summary?.cabin_class || firstSeg?.cabin_class || "N/A"
                        }
                      />
                      <FlexValues
                        title="Date"
                        value={
                          summary?.departure_datetime
                            ? formatDate(summary.departure_datetime)
                            : firstSeg?.departure_datetime
                            ? formatDate(firstSeg.departure_datetime)
                            : "N/A"
                        }
                      />
                      <FlexValues
                        title="Air Craft Type"
                        value={firstSeg?.aircraft_code || "N/A"}
                      />
                      <FlexValues
                        title="Duration"
                        value={
                          summary
                            ? `${
                                summary.total_duration?.day
                                  ? `${summary.total_duration.day}d `
                                  : ""
                              }${summary.total_duration?.hr ?? 0}h ${
                                summary.total_duration?.min ?? 0
                              }m`
                            : "N/A"
                        }
                      />
                      <FlexValues
                        title="Baggage"
                        value={
                          typeof summary?.baggage_summary
                            ?.included_checked_bags !== "undefined"
                            ? `${summary.baggage_summary.included_checked_bags}`
                            : typeof firstSeg?.included_checked_bags !==
                              "undefined"
                            ? `${firstSeg.included_checked_bags}`
                            : "N/A"
                        }
                      />
                      <FlexValues
                        title="Stops"
                        value={
                          typeof summary?.stops_count !== "undefined"
                            ? `${summary.stops_count}`
                            : `${Math.max(
                                (retLeg?.segments?.length || 1) - 1,
                                0
                              )}`
                        }
                      />
                      <div className="border-b-[0.5px] border-[#9B9EA4]"></div>
                      {retLeg && retLeg.segments && retLeg.segments.length > 1 ? (
                        <SubStops leg={retLeg} />
                      ) : null}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const Transaction = ({ data }: { data: FlightBookingData }) => {
  const isRoundTrip =
    Array.isArray(data?.flight_itinerary) &&
    data.flight_itinerary.some((l: FlightLeg) => l.leg === "RETURN");
  return (
    <div className="bg-[#fff] p-[24px] rounded-[12px]">
      <h1 className="text-[20px] font-[600] text-[#181818] mb-[16px]">
        Payment Details
      </h1>
      <div className="space-y-4">
        <FlexValues
          title={`${isRoundTrip ? "Round Trip" : "One Way"} (${data.passenger_count} ${
            data.passenger_count === 1 ? "Passenger" : "Passengers"
          })`}
          value={`₦${Number(data.total_amount ?? 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
        />
        <FlexValues
          title="Taxes & Fees"
          value={`₦${Number(data.tax ?? 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
        />
        <div className="borde-[1px] border-[#ACAEB3] border-b "></div>
        <FlexValues
          title="Total"
          value={`₦${Number((data.total_amount ?? 0) + (data.tax ?? 0)).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
        />
      </div>
    </div>
  );
};

export default FlightDetails;
