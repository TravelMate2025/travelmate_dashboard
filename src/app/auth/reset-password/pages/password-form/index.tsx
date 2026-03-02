"use client";
import React from "react";
import AuthWrapper from "@/app/auth/AuthWrapper";
import Button from "@/components/reuseables/Button";
import { InputReuseables } from "@/app/auth/login/page";
import { Formik, Form } from "formik";
import { useNewPassword } from "@/hooks/api/auth";
import AuthService from "@/services/auth";
import Image from "next/image";

interface ResetPasswordFormProps {
  form: {
    email: string;
    password: string;
    confirmPassword: string;
    otp: string;
  };
  setForm: React.Dispatch<
    React.SetStateAction<{
      email: string;
      password: string;
      confirmPassword: string;
      otp: string;
    }>
  >;
  handleSuccess: ({
    message,
    targetPage,
  }: {
    message?: string;
    targetPage: "reset" | "otp" | "newPassword" | "success";
  }) => void;
}

const NewPassword = ({
  handleSuccess,
  form,
  setForm,
}: ResetPasswordFormProps) => {
  return (
    <AuthWrapper>
      <div className="">
        <ResetComponent
          handleSuccess={handleSuccess}
          form={form}
          setForm={setForm}
        />
      </div>
    </AuthWrapper>
  );
};

export const ResetComponent = ({
  handleSuccess,
  form,
}: ResetPasswordFormProps) => {
  const { loading, onNewPassword } = useNewPassword({
    Service: AuthService,
  });

  // Update handleSubmit to accept and pass password and confirmPassword
  const handleSubmit = (values: {
    password: string;
    confirmPassword: string;
  }) => {
    const { email, otp } = form || {};
    const { password, confirmPassword } = values;

    if (password !== confirmPassword) {
      return;
    }

    const payload = {
      email,
      token: otp,
      new_password: password,
      re_new_password: confirmPassword,
    };

    onNewPassword({
      payload,
      successCallback: () => {
        handleSuccess({ targetPage: "success" });
      },
      errorCallback: () => {},
    });
  };

  return (
    <Formik
      initialValues={{ email: "", password: "", confirmPassword: "" }} // Include password and confirmPassword in initialValues
      onSubmit={handleSubmit}
    >
      {({ isValid }) => (
        <div className="bg-[#fff] p-[40px] space-y-10 rounded-[20px]">
          <div className="flex flex-col items-center gap-4">
            <Image
              src="/assets/images/company-logo.svg"
              alt=""
              className="lg:w-28 w-28 "
              width={112}
              height={112}
            />
            <p className="text-[#181818] lg:text-2xl lg:font-semibold font-[500] text-[18px] ">
              Reset Password
            </p>
          </div>
          <Form className="space-y-10">
            <Inputs />
            <div className="">
              <Button
                title="CONFIRM PASSWORD"
                variant={isValid ? "blue" : "gray"}
                full
                weight="600"
                type="submit"
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
    <div className="space-y-10">
      <InputReuseables
        label="New Password"
        placeholder="Enter new password"
        name="password"
        type="password"
      />
      <InputReuseables
        label="Confirm Password"
        placeholder="confirm new password"
        name="confirmPassword"
        type="password"
      />
    </div>
  );
};

export default NewPassword;
