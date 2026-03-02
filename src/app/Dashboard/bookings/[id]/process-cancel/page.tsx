"use client";
import React, { useState } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { GridValues, FlexValues, Policy, Transaction } from "../page";
import { Switch } from "@/components/ui/switch";

const page = () => {
  const params = useParams();
  const id = params?.id;
  const router = useRouter();

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
        <Image
          src="/assets/icons/arrow-back.svg"
          alt=""
          className=" cursor-pointer "
          onClick={() => router.back()}
          width={24}
          height={24}
        />
        <h1 className="text-[24px] font-semibold text-[#181818]">
          Cancel Booking
        </h1>
      </div>

      <CancelDetails />
    </div>
  );
};

const CancelDetails = () => {
  return (
    <div className="space-y-[24px]">
      <div className="bg-[#fff] p-[24px] space-y-[20px] rounded-[12px] w-full ">
        <h1 className="font-[600] text-[20px] text-[#181818] ">
          Cancellation Request
        </h1>

        <div className="flex justify-between items-center">
          <GridValues title="Cancellation ID" value="CAN-001" />
          <GridValues title="Date Requested" value="25/05/2025" />

          <div className="flex flex-col items-start space-y-3">
            <h1 className="text-[16px] font-[500] text-[#4E4F52] whitespace-nowrap">
              Cancellation Status
            </h1>
            <div className="border-[1px] border-[#EFB608] rounded-[12px] text-[#EFB608] text-[14px] font-[400] bg-[#EFB6081A] px-[20px] py-[10px] whitespace-nowrap flex-shrink-0">
              Paid
            </div>
          </div>
        </div>
      </div>
      <CancellationGrid />
    </div>
  );
};

const CancellationGrid = () => {
  return (
    <div className="grid grid-cols-2 gap-[24px]">
      <div className="space-y-6">
        <div className="bg-[#fff] space-y-[22px] p-[24px] rounded-[12px]">
          <div className="space-y-4">
            <h1 className="text-[20px] font-[600] text-[#181818]">
              Cancellation Request Details
            </h1>
            <div className="space-y-4">
              <GridValues title="Primary Reason" value="I changed my mind" />
              <GridValues
                title="Additional Details"
                value="I changed my mind so that is why i had to cancel"
              />
            </div>
          </div>
        </div>
        <Policy />
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
      <Form />
    </div>
  );
};

const Form = () => {
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
            <Image
              src="/assets/icons/vector-red.svg"
              alt=""
              className=""
              width={16}
              height={16}
            />
            <p className="text-[#D72638] text-[18px] font-[500]">
              Override Policy
            </p>
          </div>

          <Switch id="airplane-mode" />
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
            className="w-full border-[1px] rounded-[8px] border-[#818489] px-[12px] pt-[16px] text-[16px] placeholder:text-[16px] font-[400] placeholder:font-[400]  placeholder:text-[#818489] text-[#181818] "
            placeholder="Add notes about this cancellation..."
            cols={7}
            rows={8}
          ></textarea>

          <div className="w-full bg-[#023E8A] p-[16px] rounded-[8px] text-[#ffff] text-[20px] font-[500] text-center ">Process Cancellation and refund</div>
        </div>
      </div>
    </div>
  );
};

export default page;
