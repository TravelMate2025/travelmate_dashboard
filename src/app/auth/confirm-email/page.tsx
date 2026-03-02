import Image from "next/image";
import React from "react";
import AuthWrapper from "../AuthWrapper";
import Button from "@/components/reuseables/Button";

const page = () => {
  return (
    <AuthWrapper>
      <EmailComponent />
    </AuthWrapper>
  );
};

const EmailComponent = () => {
  return (
    <div className="bg-[#fff] p-[40px] space-y-10 rounded-[20px]">
      <div className="flex flex-col items-center gap-4">
        <Image
          src="/assets/images/company-logo.svg"
          alt=""
          className="lg:w-28 w-[53px]"
          width={112}
          height={112}
        />
        <p className="text-[#181818] lg:text-2xl lg:font-semibold font-[500] text-[18px] ">
          Email Sent
        </p>
        <p className="text-[#181818] lg:text-lg text-[16px] font-medium text-center ">
          Password reset instructions have been sent to your email
        </p>
      </div>

      <SuccessModal />

      <Button title="SEND RECOVERY EMAIL" variant="blue" full weight="600" />
    </div>
  );
};

const SuccessModal = () => {
  return (
    <div className="rounded-[12px] border-[1px] border-[#2D9C5E] bg-[#D5EBDF] py-4 px-6 ">
      <p className="text-[#2D9C5E] lg:text-[16px] text-[12px] font-[400] leading-[18px] text-center lg:leading-[100%] ">
        Please check your inbox and follow the instructions to reset your
        password. The link will expire in 30 minutes.
      </p>
    </div>
  );
};

export default page;
