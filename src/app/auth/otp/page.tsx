import React from "react";
import AuthWrapper from "../AuthWrapper";
import Button from "@/components/reuseables/Button";
import {
  InputOTPGroup,
  InputOTPSlot,
  InputOTP,
} from "@/components/ui/input-otp";
import Link from "next/link";
import Image from "next/image";

const page = () => {
  return (
    <AuthWrapper>
      <OtpComponent />
    </AuthWrapper>
  );
};

const OtpComponent = () => {
  return (
    <div className="bg-[#fff] p-[40px] space-y-[36px] rounded-[20px]">
      <div className="flex flex-col items-center gap-4">
        <Image
          src="/assets/images/company-logo.svg"
          alt=""
          className="lg:w-28 w-28 "
          width={112}
          height={112}
        />
        <p className="text-[#181818] lg:text-2xl lg:font-semibold font-[500] text-[18px] ">
          Verification Required
        </p>
      </div>

      <Otpinput />

      <div className="">
        <p className="text-gray-700 lg:text-[20px] text-[14px] font-medium text-center">
          Didn&apos;t receive a code?{" "}
          <span className="underline text-[#023E8A] ">Resend</span>{" "}
        </p>
      </div>
      <div>
        <Link href={"/auth/login"} className="w-full">
          <Button title="VERIFY" variant="blue" full weight="600" />{" "}
        </Link>{" "}
      </div>
      <Button title="BACK TO LOG IN" variant="outline" full weight="600" />
    </div>
  );
};

const Otpinput = () => {
  return (
    <div className="space-y-4">
      <div className="">
        <p className="text-[#181818]font-[600] text-[16px] text-center ">
          A verification code has been sent to your email
        </p>
      </div>

      <div className=" flex justify-center ">
        <InputOTP maxLength={4}>
          <InputOTPGroup className="space-x-4">
            <InputOTPSlot
              index={0}
              className="h-[50px] w-[50px] rounded-[8px] border-[1px] border-[#9B9EA4] bg-[#f5f5f5] "
            />
            <InputOTPSlot
              index={1}
              className="h-[50px] w-[50px] rounded-[8px] border-[1px] border-[#9B9EA4] bg-[#f5f5f5] "
            />
            <InputOTPSlot
              index={2}
              className="h-[50px] w-[50px] rounded-[8px] border-[1px] border-[#9B9EA4] bg-[#f5f5f5] "
            />
            <InputOTPSlot
              index={3}
              className="h-[50px] w-[50px] rounded-[8px] border-[1px] border-[#9B9EA4] bg-[#f5f5f5] "
            />
          </InputOTPGroup>
        </InputOTP>
      </div>
    </div>
  );
};

export default page;
