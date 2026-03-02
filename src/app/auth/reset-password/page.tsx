"use client";
import React, { useState } from "react";
import { ResetEmailForm } from "./pages/reset-password-form";
import { VerifyOtp } from "./pages/verify-otp";
import NewPassword from "./pages/password-form";
import ResetSuccess from "./pages/reset-success";
import SuccessOTP from "./pages/success-otp";

function ResetPasswordPage() {
  const [page, setPage] = useState<
    "reset" | "otp" | "otp-sent" | "newPassword" | "success"
  >("reset");

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    otp: "",
  });

  const handleSuccess = ({
    targetPage,
  }: {
    targetPage: "reset" | "otp" | "otp-sent" | "newPassword" | "success";
    message?: string;
  }) => {
    setPage(targetPage);
  };

  return (
    <>
      {page === "reset" && (
        <ResetEmailForm
          handleSuccess={handleSuccess}
          form={form}
          setForm={setForm}
        />
      )}
      {page === "otp-sent" && <SuccessOTP handleSuccess={handleSuccess} />}
      {page === "otp" && (
        <VerifyOtp
          handleSuccess={handleSuccess}
          form={form}
          setForm={setForm}
        />
      )}
      {page === "newPassword" && (
        <NewPassword
          handleSuccess={handleSuccess}
          form={form}
          setForm={setForm}
        />
      )}
      {page === "success" && <ResetSuccess />}
    </>
  );
}

export default ResetPasswordPage;
