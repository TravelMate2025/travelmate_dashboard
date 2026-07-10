"use client";
import React, { useState } from "react";
import AuthWrapper from "../AuthWrapper";
import { Switch } from "@/components/ui/switch";
import Button from "@/components/reuseables/Button";
import Link from "next/link";
import { Formik, Form, useField } from "formik";
import { authInitialValues, authSchema } from "@/lib/auth/yupAuthSchema";
import { useRouter } from "next/navigation";
import { useLoginUser } from "@/hooks/api/auth";
import AuthService from "@/services/auth";

const page = () => {
  return (
    <AuthWrapper>
      <LoginComponent />
    </AuthWrapper>
  );
};

const LoginComponent = () => {
  const router = useRouter();
  const { loading, onLogin, redirecting } = useLoginUser({
    Service: AuthService,
  });

  const handleSubmit = async (values: { email: string; password: string }) => {
    await onLogin({
      payload: values,
      successCallback: () => {
        router.push("/Dashboard");
      },
    });
  };

  return redirecting ? (
    <div className="mx-auto max-w-xl rounded-[30px] border border-[#dbe7ff] bg-white p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-10">
      <div className="flex flex-col items-center gap-4 text-center">
        <img
          src="/assets/icons/blue-success.svg"
          alt=""
          className="w-20 lg:w-28"
        />
        <p className="text-[18px] font-[500] text-[#181818] lg:text-2xl lg:font-semibold">
          Login Successful
        </p>
        <p className="text-[16px] font-medium text-[#5f6470] lg:text-lg">
          Redirecting to Dashboard...
        </p>

        <div className="rounded-[16px] border border-[#2D9C5E] bg-[#D5EBDF] px-6 py-4">
          <p className="text-center text-[12px] font-[400] leading-[140%] text-[#2D9C5E] lg:text-[16px]">
            Authentication complete! You are being redirected to the TravelMate
            Admin Dashboard.
          </p>
        </div>
      </div>
    </div>
  ) : (
    <Formik
      initialValues={authInitialValues.signIn}
      validationSchema={authSchema.signIn}
      onSubmit={handleSubmit}
    >
      {({ isValid }: { isValid: boolean }) => (
        <div className="mx-auto max-w-xl rounded-[30px] border border-[#e6eaf2] bg-white p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-10">
          <div className="flex flex-col items-center gap-4 text-center">
            <img
              src="/assets/images/company-logo.svg"
              alt=""
              className="w-24 lg:w-28"
            />
            <p className="text-[18px] font-[500] text-[#181818] lg:text-2xl lg:font-semibold">
              TravelMate
            </p>
            <p className="text-[16px] font-medium text-[#5f6470] lg:text-lg">
              Admin Dashboard
            </p>
            <p className="max-w-md text-sm leading-7 text-[#6b7280] lg:text-[15px]">
              Sign in to continue to bookings, reports, support tools, and role
              management.
            </p>
          </div>

          <Form name="SignInForm" className="mt-10 space-y-8">
            <Inputs />

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <Switch id="remember-me" />
                <div className="text-[12px] font-[400] text-[#181818] lg:text-[14px] lg:font-medium">
                  Remember me
                </div>
              </div>
              <Link
                href={"/auth/reset-password"}
                className="text-[#023E8A] text-[12px] font-[400] lg:text-[14px] lg:font-medium"
              >
                Forgot password?
              </Link>
            </div>

            <div className="rounded-[18px] border border-[#e8edf5] bg-[#f8fafc] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7a8190]">
                Access
              </p>
              <p className="mt-2 text-sm leading-7 text-[#5f6470]">
                Use the admin email address assigned to your dashboard role.
              </p>
            </div>

            <div className="pt-2">
              <Button
                title="SIGN IN"
                variant={isValid ? "blue" : "gray"}
                full
                weight="600"
                type="submit"
                id="SignInFormButton"
                disabled={!isValid || loading}
                loading={loading}
              />
            </div>
          </Form>
        </div>
      )}
    </Formik>
  );
};

const Inputs = () => {
  return (
    <div className="space-y-6">
      <InputReuseables
        label="Enter Email Address"
        placeholder="admin@travelmate.com"
        name="email"
        type="email"
      />
      <InputReuseables
        label="Password"
        placeholder="Enter your password"
        name="password"
        type="password"
      />
    </div>
  );
};

export const InputReuseables = ({
  placeholder,
  label,
  name,
  type,
}: {
  placeholder: string;
  label: string;
  type: string;
  name: string;
}) => {
  const [field, meta] = useField(name);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative space-y-3">
      <p className="text-[14px] font-semibold text-[#181818] lg:text-[16px]">
        {label}
      </p>
      <div className="relative">
        <input
          {...field}
          id={name}
          type={
            type === "password" ? (showPassword ? "text" : "password") : type
          }
          placeholder={placeholder}
          className={`w-full rounded-[18px] border bg-white px-4 py-4 pr-12 text-[14px] font-normal text-[#181818] outline-none transition placeholder:text-[#9B9EA4] focus:border-[#023E8A] focus:ring-4 focus:ring-[#dbeafe] lg:text-[16px] ${
            meta.touched && meta.error
              ? "border-[#d72638] bg-[#fff8f8]"
              : "border-[#d8dde6]"
          }`}
        />
        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9B9EA4] hover:text-[#181818] focus:outline-none"
          >
            {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
          </button>
        )}
      </div>
      <FieldError meta={meta} />
    </div>
  );
};

interface ErrorProps {
  error?: string;
  touched: boolean;
  value: unknown;
  initialError?: string;
  initialTouched: boolean;
  initialValue?: string;
}

const FieldError = ({
  meta,
}: {
  meta: Pick<ErrorProps, "touched" | "error">;
}) => {
  if (meta.touched && meta.error) {
    return (
      <div className="mt-1 text-xs font-normal leading-5 text-[#d72638]">
        {meta.error}
      </div>
    );
  }
  return null;
};

const EyeOpenIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const EyeClosedIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  </svg>
);

export default page;
