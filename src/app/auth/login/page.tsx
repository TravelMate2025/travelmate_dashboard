"use client";
import React, { useState } from "react";
import AuthWrapper from "../AuthWrapper";
import { Switch } from "@/components/ui/switch";
import Button from "@/components/reuseables/Button";
import Link from "next/link";
import { useField } from "formik";
import { Formik, Form } from "formik";
import {
  SignInFormValues,
  authInitialValues,
  authSchema,
} from "@/lib/auth/yupAuthSchema";
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

  return (
    <>
      {redirecting ? (
        <div className="bg-[#fff] p-[40px] space-y-10 rounded-[20px]">
          <div className="flex flex-col items-center gap-4">
            <img
              src="/assets/icons/blue-success.svg"
              alt=""
              className="lg:w-28 w-20 "
            />
            <p className="text-[#181818] lg:text-2xl lg:font-semibold font-[500] text-[18px] ">
              Login Successful
            </p>
            <p className="text-[#5c1d1d] lg:text-lg text-[16px] font-medium">
              Redirecting to Dashboard...
            </p>

            <div className="py-4 px-6 rounded-[12px] border-[1px] border-[#2D9C5E] bg-[#D5EBDF]">
              <p className=" text-[#2D9C5E] font-[400] text-[12px] lg:text-[16px] leading-[100%] text-center ">
                Authentication complete! You are being redirected to the
                TravelMate Admin Dashboard.
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
            <div className="bg-[#fff] p-[40px] space-y-10 rounded-[20px]">
              <div className="flex flex-col items-center gap-4">
                <img
                  src="/assets/images/company-logo.svg"
                  alt=""
                  className="lg:w-28 w-28 "
                />
                <p className="text-[#181818] lg:text-2xl lg:font-semibold font-[500] text-[18px] ">
                  TravelMate
                </p>
                <p className="text-[#181818] lg:text-lg text-[16px] font-medium">
                  Admin Dashboard
                </p>
              </div>
              <Form name="SignInForm" className="space-y-10">
                <Inputs />

                <div className="flex items-center space-x-4">
                  <Switch id="airplane-mode" />
                  <div className="text-[#181818] lg:text-[14px] font-[400] lg:font-medium text-[12px]">
                    Remember me
                  </div>
                </div>

                <div className="">
                  <Link
                    href={"/auth/reset-password"}
                    className="w-full flex justify-end "
                  >
                    <p className="text-[#023E8A] lg:text-[14px] font-[400] lg:font-medium text-[12px]">
                      Forgot password?
                    </p>
                  </Link>
                </div>

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
              </Form>
            </div>
          )}
        </Formik>
      )}
    </>
  );
};

const Inputs = () => {
  return (
    <div className="space-y-10">
      <InputReuseables
        label="Enter Email Address "
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
  const [showPassword, setShowPassword] = useState(false); // Only for password fields

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="space-y-4 relative">
      {" "}
      {/* Added 'relative' for positioning */}
      <p className="text-[#181818] lg:text-[16px] font-semibold text-[14px]">
        {label}
      </p>
      <div className="relative">
        {" "}
        {/* Wrapper for input + toggle button */}
        <input
          {...field}
          id={name}
          type={
            type === "password" ? (showPassword ? "text" : "password") : type
          }
          placeholder={placeholder}
          className="w-full border-[1px] border-[#9B9EA4] bg-[#f5f5f5] rounded-[8px] p-[16px] placeholder:text-[#9B9EA4] text-[#181818] placeholder:text-[16px] font-[400] lg:text-[16px] text-[14px] pr-10" /* Added 'pr-10' for icon spacing */
        />
        {/* Show/hide toggle (only for password fields) */}
        {type === "password" && (
          <button
            type="button" // Prevents form submission
            onClick={togglePasswordVisibility}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#9B9EA4] hover:text-[#181818] focus:outline-none"
          >
            {showPassword ? (
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
            ) : (
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
            )}
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
      <div className="mt-1 font-gordita text-xs leading-5 font-normal text-[#FF0000]">
        {meta.error}
      </div>
    );
  }
  return null;
};

export default page;
