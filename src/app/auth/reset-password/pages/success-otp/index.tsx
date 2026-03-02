import React from "react";
import Image from "next/image";
import Button from "@/components/reuseables/Button";
import AuthWrapper from "@/app/auth/AuthWrapper";
interface ResetPasswordFormProps {
  handleSuccess: ({
    message,
    targetPage,
  }: {
    message?: string;
    targetPage: "reset" | "otp" | "newPassword" | "success";
  }) => void;
}

const SuccessOTP = ({ handleSuccess }: ResetPasswordFormProps) => {
  return (
    <AuthWrapper>
      <div>
        <div className="bg-[#fff] p-[40px] space-y-10 rounded-[20px]">
          <div className="flex flex-col items-center gap-4">
            <Image
              src="/assets/icons/blue-success.svg"
              alt=""
              className="lg:w-28 w-28 "
              width={112}
              height={112}
            />
            <p className="text-[#181818] lg:text-2xl lg:font-semibold font-[500] text-[18px] ">
              Email Sent
            </p>
            <p className="text-[#5c1d1d] lg:text-lg text-[16px] font-medium text-center ">
              Password reset instructions have been sent to your email
            </p>
            <div className="py-4 px-6 rounded-[12px] border-[1px] border-[#2D9C5E] bg-[#D5EBDF]">
              <p className=" text-[#2D9C5E] font-[400] text-[12px] lg:text-[16px] leading-[100%] text-center ">
                Please check your inbox and follow the instructions to reset
                your password. The link will expire in 10 minutes.
              </p>
            </div>
          </div>
          <Button
            variant="blue"
            title="PROCEED TO VERIFY EMAIL"
            full
            onClick={() => handleSuccess({ targetPage: "otp" })}
          />
        </div>
      </div>
    </AuthWrapper>
  );
};

export default SuccessOTP;
