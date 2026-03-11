"use client";
import React, { Suspense, useEffect, useState } from "react";
import * as Yup from "yup";
import Button from "@/components/reuseables/Button";
import { useField, Formik, Form } from "formik";
import { useRouter, useSearchParams } from "next/navigation";
import env from "@/config/env";
import { showErrorToast, showSuccessToast } from "@/utils/toasters";
import instance from "@/hooks/initializers/useAxiosDefaults";

type AcceptInviteFormValues = {
  password1: string;
  password2: string;
};

const page = () => (
  <Suspense
    fallback={
      <div>
        <Loading />
      </div>
    }
  >
    <LoginComponent />
  </Suspense>
);

const validationSchema = Yup.object().shape({
  password1: Yup.string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters")
    .matches(/[A-Z]/, "Must include uppercase")
    .matches(/[a-z]/, "Must include lowercase")
    .matches(/\d/, "Must include number")
    .matches(/[!@#$%^&*(),.?":{}|<>]/, "Must include special character"),
  password2: Yup.string()
    .required("Confirm password is required")
    .oneOf([Yup.ref("password1")], "Passwords must match"),
});

const LoginComponent = () => {
  const router = useRouter();
  const searchParamas = useSearchParams();
  const token = searchParamas.get("token");
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [successCreate, setSuccessCreate] = useState(false)

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (
      typeof error === "object" &&
      error !== null &&
      "response" in error &&
      typeof (error as { response?: unknown }).response === "object"
    ) {
      const response = (error as { response?: { data?: { message?: string } } })
        .response;
      return response?.data?.message || fallback;
    }
    return fallback;
  };

  useEffect(() => {
    if (!token) {
      showErrorToast({ message: "Missing invitation token" });
      setIsValidToken(false);
      return;
    } else {
      const validateInvitation = async () => {
        try {
          setLoading(true);
          const response = await instance.get(
            `${env.api.admin}/invitations/validate/`,
            { params: { token } }
          );
          const invitedEmail = response?.data?.email;
          if (!invitedEmail) {
            throw new Error("Invitation email missing");
          }

          setEmail(invitedEmail);
          setIsValidToken(true);
        } catch (error: unknown) {
          showErrorToast({
            message: getErrorMessage(error, "Invalid or expired invitation token"),
          });
          setIsValidToken(false);
        } finally {
          setLoading(false);
        }
      };

      validateInvitation();
    }
  }, [token]);

  const handleSubmit = async (values: AcceptInviteFormValues) => {
    if (!token || !email) {
      showErrorToast({ message: "Invalid invitation details. Please use a valid invite link." });
      return;
    }

    try {
      setLoading(true);
      await instance.post(`${env.api.admin}/invitations/accept/`, {
        email,
        token,
        password: values.password1,
      });
      setSuccessCreate(true)
      showSuccessToast({message: "Password created successfully! You are now redirected to the Login page."})
      setTimeout(() => router.push("/auth/login"), 3000);
    } catch (error: unknown) {
      showErrorToast({
        message: getErrorMessage(error, "Something went wrong"),
      });
      console.log(getErrorMessage(error, "Something went wrong"));
    } finally {
      setLoading(false);
    }
  };

  if (isValidToken === false) {
    return (
      <div className="text-center">
        <h2 className="text-xl font-bold text-red-600">
          Invalid or Expired Token
        </h2>
        <p>Please contact the administrator for a new invitation.</p>
      </div>
    );
  }

  if (isValidToken === null) {
    return (
      <div>
        <Loading />
      </div>
    );
  }
  return (
    <>
      <div className="text-center flex flex-col gap-2 lg:py-12 pt-12 pb-2 font-bold">
        <h2 className="text-xl">Authentication</h2>
        <h2 className="text-[#023E8A] text-2xl">
          Welcome to Travelmate Admin Dashboard
        </h2>
      </div>

      <Formik<AcceptInviteFormValues>
        initialValues={{ password1: "", password2: "" }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, isValid }: { values: AcceptInviteFormValues; isValid: boolean }) => {
          const validations = {
            length: values.password1.length >= 8,
            number: /\d/.test(values.password1),
            uppercase: /[A-Z]/.test(values.password1),
            lowercase: /[a-z]/.test(values.password1),
            specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(values.password1),
            match:
              values.password1 === values.password2 && values.password2 !== "",
          };

          return (
            <div className="bg-[#fff] p-[40px] space-y-10 rounded-[20px]">
              <div className="flex flex-col items-center gap-4">
                <img
                  src="/assets/images/logo.svg"
                  alt=""
                  className="lg:w-28 w-[53px]"
                />
                <p className="text-[#181818] lg:text-2xl text-[18px] font-semibold">
                  Complete your Account Setup
                </p>
                <p className="text-[#181818] lg:text-lg text-[16px] font-medium">
                  You've been invited to join the TravelMate administrative
                  team. Please create a password to access your dashboard
                </p>
              </div>

              <Form className="space-y-10">
                <div className="flex flex-col gap-2">
                  <p className="font-bold">Email Address</p>
                  <p>{email || "emailaddress.com"}</p>
                </div>

                <Inputs />

                <Button
                  title="Create Password"
                  variant={
                    validations.length &&
                    validations.lowercase &&
                    validations.match &&
                    validations.number &&
                    validations.specialChar &&
                    validations.uppercase
                      ? "blue"
                      : "gray"
                  }
                  full
                  weight="600"
                  type="submit"
                  id="SignInFormButton"
                  disabled={!isValid || loading}
                  loading={loading}
                />

                <div>
                  <h1 className="py-3">Password Must include</h1>
                  <div className="flex flex-col gap-2">
                    <ValidationItem
                      isValid={validations.uppercase}
                      text="At least one uppercase letter (A-Z)"
                    />
                    <ValidationItem
                      isValid={validations.lowercase}
                      text="At least one lowercase letter (a-z)"
                    />
                    <ValidationItem
                      isValid={validations.number}
                      text="At least one number (0-9)"
                    />
                    <ValidationItem
                      isValid={validations.specialChar}
                      text="At least one special character (!@#$%^&*()_-+=<>?/{}[]|)"
                    />
                    <ValidationItem
                      isValid={validations.match}
                      text="Passwords must match"
                    />
                  </div>
                </div>
              </Form>
            </div>
          );
        }}
      </Formik>
      {successCreate && (
        <div className="bg-[#D5EBDF80] text-black p-2 border-[#2D9C5E] border-2 rounded-xl m-3 mb-7">
          Password Created Successfully, use this password when next you want to
          Sign In
        </div>
      )}
    </>
  );
};

const Inputs = () => {
  return (
    <div className="space-y-10">
      <InputReusable
        label="New Password"
        placeholder="Enter your password"
        name="password1"
      />
      <InputReusable
        label="Confirm Password"
        placeholder="Re-enter password"
        name="password2"
      />
    </div>
  );
};

const InputReusable = ({
  placeholder,
  label,
  name,
}: {
  placeholder: string;
  label: string;
  name: string;
}) => {
  const [field, meta] = useField(name);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-4 relative">
      <p className="text-[#181818] lg:text-[16px] font-semibold text-[14px]">
        {label}
      </p>
      <div className="relative">
        <input
          {...field}
          id={name}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          className="w-full border-[1px] border-[#9B9EA4] bg-[#f5f5f5] rounded-[8px] p-[16px] placeholder:text-[#9B9EA4] text-[#181818] placeholder:text-[16px] font-[400] lg:text-[16px] text-[14px] pr-10"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#9B9EA4] hover:text-[#181818] focus:outline-none"
        >
          {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
        </button>
      </div>
      <FieldError meta={meta} />
    </div>
  );
};

const ValidationItem = ({
  isValid,
  text,
}: {
  isValid: boolean;
  text: string;
}) => (
  <div className="flex justify-normal gap-1 items-center">
    <img
      className="w-5 h-5 object-contain"
      src={
        isValid
          ? "/assets/images/checkmark-validate.png"
          : "/assets/images/checkmark.png"
      }
      alt=""
    />
    <p>{text}</p>
  </div>
);

const FieldError = ({ meta }: { meta: { touched?: boolean; error?: string } }) => {
  if (meta.touched && meta.error) {
    return (
      <div className="mt-1 text-xs leading-5 font-normal text-[#FF0000]">
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
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeClosedIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);
const Loading = () => (
  <div className="flex items-center justify-center h-screen bg-white">
    <svg
      className="animate-spin h-12 w-12 text-black"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 
         5.291A7.962 7.962 0 014 12H0c0 3.042 
         1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  </div>
);
export default page;
