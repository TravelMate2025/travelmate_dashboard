"use client";

import React, { useState } from "react";
import Image from "next/image";
import AuthWrapper from "@/app/auth/AuthWrapper";
import Button from "@/components/reuseables/Button";
import {
  InputOTPGroup,
  InputOTPSlot,
  InputOTP,
} from "@/components/ui/input-otp";
import { useVerifyOtp, useResendOTP } from "@/hooks/api/auth";
import AuthService from "@/services/auth";
import { showErrorToast } from "@/utils/toasters";
import { useRouter } from "next/navigation";

// Props interface
interface ResetPasswordFormProps {
  form: any;
  setForm: React.Dispatch<React.SetStateAction<any>>;
  handleSuccess: ({
    message,
    targetPage,
  }: {
    message?: string;
    targetPage: "reset" | "otp" | "newPassword" | "success";
  }) => void;
}

// Main VerifyOtp component
export const VerifyOtp = ({
  handleSuccess,
  form,
  setForm,
}: ResetPasswordFormProps) => {
  const { loading, onVerifyToken } = useVerifyOtp({ Service: AuthService });

  return (
    <AuthWrapper>
      <OtpComponent
        handleSuccess={handleSuccess}
        setForm={setForm}
        form={form}
        onVerifyToken={onVerifyToken}
        loading={loading}
      />
    </AuthWrapper>
  );
};

// OTP Component for handling form submission and input
const OtpComponent = ({
  handleSuccess,
  form,
  setForm,
  onVerifyToken,
  loading,
}: ResetPasswordFormProps & {
  onVerifyToken: any;
  loading: boolean;
}) => {
  const router = useRouter();
  const { loadingReset, onResendPassword } = useResendOTP({
    Service: AuthService,
  });
  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();

    const { email, otp } = form;

    onVerifyToken({
      payload: { email, token: otp },
      successCallback: (message: string) => {
        handleSuccess({ message, targetPage: "newPassword" });
      },
      errorCallback: ({ message }: { message: string }) => {
        router.push("/auth/reset-password");
      },
    });
  };

  const resendOTP = () => {
    const { email } = form;

    onResendPassword({
      payload: { email },
      successCallback: () => {},
    });
  };

  return (
    <form onSubmit={submit}>
      <div className="bg-[#fff] p-[40px] space-y-[36px] rounded-[20px]">
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/assets/images/company-logo.svg"
            alt="Company Logo"
            className="lg:w-28 w-28 "
            width={112}
            height={112}
          />
          <p className="text-[#181818] lg:text-2xl lg:font-semibold font-[500] text-[18px]">
            Verification Required
          </p>
        </div>

        <OtpInput setForm={setForm} />

        <div>
          <p className="text-gray-700 lg:text-[20px] text-[14px] font-medium text-center">
            Didn't receive a code?{" "}
            <span
              className="text-[#023E8A] cursor-pointer"
              onClick={resendOTP}
            >
              {loadingReset ? "Sending..." : "Resend"}
            </span>
          </p>
        </div>
        <div>
          <Button
            title={loading ? "VERIFYING..." : "VERIFY"}
            variant="blue"
            full
            weight="600"
            disabled={form?.otp?.length !== 4 || loading}
          />
        </div>
        <Button
          title="BACK TO LOG IN"
          variant="outline"
          full
          weight="600"
          onClick={() => router.push("/auth/login")}
        />
      </div>
    </form>
  );
};

// OTP Input Component for entering OTP
const OtpInput = ({ setForm }: { setForm: any }) => {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[#181818] font-[600] text-[16px] text-center">
          A verification code has been sent to your email
        </p>
      </div>

      <div className="flex justify-center">
        <InputOTP
          maxLength={4}
          onChange={(value) =>
            setForm((prev: any) => ({ ...(prev || {}), otp: value }))
          }
        >
          <InputOTPGroup className="space-x-4">
            {[0, 1, 2, 3].map((index) => (
              <InputOTPSlot
                key={index}
                index={index}
                className="h-[50px] w-[50px] rounded-[8px] border-[1px] border-[#9B9EA4] bg-[#f5f5f5]"
              />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>
    </div>
  );
};
