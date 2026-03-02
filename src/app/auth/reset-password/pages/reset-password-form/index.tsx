"use client";
import React from "react";
import Image from "next/image";
import AuthWrapper from "@/app/auth/AuthWrapper";
import Button from "@/components/reuseables/Button";
import { InputReuseables } from "@/app/auth/login/page";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useForgotPassword } from "@/hooks/api/auth";
import AuthService from "@/services/auth";
import { showErrorToast } from "@/utils/toasters";

const resetPasswordSchema = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
});

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
    targetPage: "reset" | "otp" | "otp-sent" | "newPassword" | "success";
  }) => void;
}

export const ResetEmailForm: React.FC<ResetPasswordFormProps> = ({
  handleSuccess,
  form,
  setForm,
}) => {
  const { loading, onForgotPassword } = useForgotPassword({
    Service: AuthService,
  });

  const handleSubmit = (values: { email: string }) => {
    setForm({ ...form, email: values.email });

    onForgotPassword({
      payload: { email: values.email },
      successCallback: () => {
        handleSuccess({ targetPage: "otp-sent" });
      },
      errorCallback: () => {
        showErrorToast({ message: "An error occured" });
      },
    });
  };

  return (
    <AuthWrapper>
      <Formik
        initialValues={{ email: form.email || "" }}
        validationSchema={resetPasswordSchema}
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
              <InputReuseables
                label="Email Address"
                placeholder="admin@travelmate.com"
                name="email"
                type="email"
              />
              <Button
                title="SEND RECOVERY EMAIL"
                variant="blue"
                full
                weight="600"
                type="submit"
                disabled={!isValid || loading}
                loading={loading}
              />
            </Form>
          </div>
        )}
      </Formik>
    </AuthWrapper>
  );
};
