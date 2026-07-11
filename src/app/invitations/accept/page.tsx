"use client";
import React, { Suspense, useEffect, useMemo, useState } from "react";
import * as Yup from "yup";
import Button from "@/components/reuseables/Button";
import { useField, Formik, Form } from "formik";
import { useRouter, useSearchParams } from "next/navigation";
import { showErrorToast, showSuccessToast } from "@/utils/toasters";
import instance from "@/hooks/initializers/useAxiosDefaults";

type AcceptInviteFormValues = {
  password1: string;
  password2: string;
};

const INVITE_VALIDATE_PATH = "/api/proxy/admin/invitations/validate/";
const INVITE_ACCEPT_PATH = "/api/proxy/admin/invitations/accept/";
const PASSWORD_RULES = [
  "At least one uppercase letter (A-Z)",
  "At least one lowercase letter (a-z)",
  "At least one number (0-9)",
  "At least one special character",
  "Passwords must match",
];

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
  const searchParams = useSearchParams();
  const rawToken = searchParams.get("token") || searchParams.get("invitation_token");
  const token = useMemo(() => {
    if (!rawToken) {
      return null;
    }

    // Some mail clients keep '+' unencoded and URL parsing turns them into spaces.
    return rawToken.trim().replace(/\s+/g, "+");
  }, [rawToken]);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [successCreate, setSuccessCreate] = useState(false);

  const getStatusCode = (error: unknown) => {
    if (
      typeof error === "object" &&
      error !== null &&
      "response" in error &&
      typeof (error as { response?: unknown }).response === "object"
    ) {
      const response = error as { response?: { status?: number } };
      return response.response?.status;
    }

    return undefined;
  };

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

  const validateInvite = async (inviteToken: string) => {
    return instance.get(INVITE_VALIDATE_PATH, {
      params: { token: inviteToken },
    });
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
          const response = await validateInvite(token);
          if (response?.data?.error) {
            throw new Error(response?.data?.message || "Invalid or expired token.");
          }

          const invitedEmail = response?.data?.email;
          if (!invitedEmail) {
            throw new Error("Invitation email missing");
          }

          setEmail(invitedEmail);
          setIsValidToken(true);
        } catch (error: unknown) {
          const defaultMessage =
            getStatusCode(error) === 500
              ? "Invitation link could not be validated right now. Please try again or request a new invite."
              : "Invalid or expired token.";

          showErrorToast({
            message: getErrorMessage(error, defaultMessage),
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
      await instance.post(INVITE_ACCEPT_PATH, {
        email,
        token,
        password: values.password1,
      });
      setSuccessCreate(true);
      showSuccessToast({
        message: "Password created successfully! You are now redirected to the Login page.",
      });
      setTimeout(() => router.push("/auth/login"), 3000);
    } catch (error: unknown) {
      const defaultMessage =
        getStatusCode(error) === 500
          ? "Unable to complete invitation right now. Please try again shortly."
          : "Something went wrong";

      showErrorToast({
        message: getErrorMessage(error, defaultMessage),
      });
    } finally {
      setLoading(false);
    }
  };

  if (isValidToken === false) {
    return (
      <InvitationShell>
        <div className="mx-auto w-full max-w-xl rounded-[32px] border border-[#f2c8cc] bg-white/95 p-8 text-center shadow-[0_35px_90px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#fff1f2] text-[#d72638]">
            <AlertIcon />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#d72638]">
            Invitation Issue
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-[#181818]">
            Invalid or expired token
          </h2>
          <p className="mt-4 text-base leading-7 text-[#5f6470]">
            This invitation link can no longer be used. Please contact your
            administrator and request a fresh invite.
          </p>
          <button
            type="button"
            onClick={() => router.push("/auth/login")}
            className="mt-8 rounded-full border border-[#d7dce5] px-6 py-3 text-sm font-semibold text-[#023e8a] transition hover:border-[#023e8a] hover:bg-[#eff6ff]"
          >
            Go to login
          </button>
        </div>
      </InvitationShell>
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
    <InvitationShell>
      <Formik<AcceptInviteFormValues>
        initialValues={{ password1: "", password2: "" }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({
          values,
          isValid,
        }: {
          values: AcceptInviteFormValues;
          isValid: boolean;
        }) => {
          const validations = {
            length: values.password1.length >= 8,
            number: /\d/.test(values.password1),
            uppercase: /[A-Z]/.test(values.password1),
            lowercase: /[a-z]/.test(values.password1),
            specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(values.password1),
            match:
              values.password1 === values.password2 && values.password2 !== "",
          };

          const passwordChecks = [
            validations.uppercase,
            validations.lowercase,
            validations.number,
            validations.specialChar,
            validations.match,
          ];
          const completedChecks = passwordChecks.filter(Boolean).length;

          return (
            <div className="grid w-full max-w-6xl overflow-hidden rounded-[36px] border border-white/60 bg-white/90 shadow-[0_40px_120px_rgba(15,23,42,0.18)] backdrop-blur xl:grid-cols-[1.05fr_0.95fr]">
              <section className="relative overflow-hidden bg-[#0b1f3a] px-7 py-10 text-white sm:px-10 lg:px-12 lg:py-14">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(78,205,196,0.25),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(2,62,138,0.45),_transparent_40%)]" />
                <div className="absolute -left-16 top-24 h-48 w-48 rounded-full border border-white/10" />
                <div className="absolute bottom-8 right-8 h-28 w-28 rounded-full bg-white/5 blur-2xl" />

                <div className="relative z-10 flex h-full flex-col">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
                      <img
                        src="/assets/images/logo.svg"
                        alt="TravelMate"
                        className="h-8 w-8 object-contain sm:h-10 sm:w-10"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#9ad0ff]">
                        TravelMate Admin
                      </p>
                      <p className="mt-1 text-sm text-white/70">
                        Secure invitation setup
                      </p>
                    </div>
                  </div>

                  <div className="mt-10 max-w-xl">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#d8f3ff]">
                      <SparkIcon />
                      Dashboard Access
                    </div>
                    <h1 className="mt-6 text-4xl font-semibold leading-tight sm:text-5xl">
                      Finish your invitation and step into the control room.
                    </h1>
                    <p className="mt-6 max-w-lg text-base leading-8 text-white/74 sm:text-lg">
                      Create a strong password to activate your admin account
                      and access booking oversight, reports, support tools, and
                      user management.
                    </p>
                  </div>

                  <div className="mt-10 grid gap-4 sm:grid-cols-2">
                    <FeatureCard
                      title="Protected access"
                      body="Your invite token is validated before setup so only the intended teammate can activate this account."
                    />
                    <FeatureCard
                      title="Fast onboarding"
                      body="One secure password step unlocks the dashboard and redirects you straight to the login experience."
                    />
                  </div>

                  <div className="mt-8 rounded-[24px] border border-white/12 bg-white/8 p-5 backdrop-blur">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9ad0ff]">
                      Invitation for
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/12 text-sm font-semibold uppercase">
                        {email?.charAt(0) || "T"}
                      </div>
                      <div>
                        <p className="text-sm text-white/60">
                          Administrative account
                        </p>
                        <p className="text-base font-medium text-white">
                          {email || "emailaddress.com"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="bg-[#f7f8fc] px-6 py-8 sm:px-8 lg:px-10 lg:py-12">
                <div className="mx-auto max-w-xl">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#023e8a]">
                        Account Setup
                      </p>
                      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#111827]">
                        Create your password
                      </h2>
                      <p className="mt-3 text-sm leading-7 text-[#5f6470] sm:text-base">
                        Use a strong password so your dashboard access is ready
                        the moment this invite is accepted.
                      </p>
                    </div>
                    <div className="hidden rounded-full border border-[#dbe7ff] bg-white px-4 py-2 text-sm font-semibold text-[#023e8a] sm:block">
                      {completedChecks}/5 checks
                    </div>
                  </div>

                  {successCreate && (
                    <div className="mt-6 rounded-[22px] border border-[#7dd3a2] bg-[#effcf4] p-4 text-[#14532d] shadow-sm">
                      <p className="text-sm font-semibold">
                        Password created successfully.
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[#2d5b42]">
                        Your account is ready. You&apos;ll be redirected to the
                        login page shortly.
                      </p>
                    </div>
                  )}

                  <Form className="mt-8 space-y-8">
                    <div className="rounded-[24px] border border-[#e6eaf2] bg-white p-5 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7a8190]">
                        Email Address
                      </p>
                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edf4ff] text-[#023e8a]">
                          <MailIcon />
                        </div>
                        <p className="break-all text-sm font-medium text-[#181818] sm:text-base">
                          {email || "emailaddress.com"}
                        </p>
                      </div>
                    </div>

                    <Inputs />

                    <div className="rounded-[28px] border border-[#e6eaf2] bg-white p-5 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-[#111827]">
                            Password checklist
                          </h3>
                          <p className="mt-1 text-sm text-[#6b7280]">
                            Complete every item below to continue.
                          </p>
                        </div>
                        <div className="rounded-full bg-[#eef4ff] px-3 py-1 text-xs font-semibold text-[#023e8a]">
                          {completedChecks === PASSWORD_RULES.length
                            ? "Ready"
                            : `${completedChecks}/${PASSWORD_RULES.length}`}
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3">
                        {PASSWORD_RULES.map((rule, index) => (
                          <ValidationItem
                            key={rule}
                            isValid={passwordChecks[index]}
                            text={rule}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Button
                        title={loading ? "Creating Password..." : "Create Password"}
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
                      <p className="text-center text-xs leading-6 text-[#7a8190]">
                        By continuing, you&apos;re activating access for this
                        invited administrative account.
                      </p>
                    </div>
                  </Form>
                </div>
              </section>
            </div>
          );
        }}
      </Formik>
    </InvitationShell>
  );
};

const Inputs = () => {
  return (
    <div className="space-y-6">
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
    <div className="relative space-y-3">
      <p className="text-[14px] font-semibold text-[#181818] lg:text-[16px]">
        {label}
      </p>
      <div className="relative">
        <input
          {...field}
          id={name}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          className={`w-full rounded-[18px] border bg-white px-4 py-4 pr-12 text-[14px] font-normal text-[#181818] outline-none transition placeholder:text-[#9b9ea4] focus:border-[#023e8a] focus:ring-4 focus:ring-[#dbeafe] lg:text-[16px] ${
            meta.touched && meta.error
              ? "border-[#d72638] bg-[#fff8f8]"
              : "border-[#d8dde6]"
          }`}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9B9EA4] transition hover:text-[#181818] focus:outline-none"
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
  <div
    className={`flex items-start gap-3 rounded-[18px] border px-4 py-3 transition ${
      isValid
        ? "border-[#b7ebcb] bg-[#effcf4]"
        : "border-[#e8ebf2] bg-[#fafbfc]"
    }`}
  >
    <div
      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
        isValid ? "bg-[#2d9c5e] text-white" : "bg-[#e6eaf2] text-[#8e95a3]"
      }`}
    >
      {isValid ? <CheckIcon /> : <DotIcon />}
    </div>
    <p className={`text-sm leading-6 ${isValid ? "text-[#14532d]" : "text-[#5f6470]"}`}>
      {text}
    </p>
  </div>
);

const InvitationShell = ({ children }: { children: React.ReactNode }) => (
  <div className="relative min-h-screen overflow-hidden bg-[#f3f6fb] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(2,62,138,0.12),_transparent_32%),linear-gradient(135deg,_#f8fbff_0%,_#eef3fb_48%,_#f8f4ef_100%)]" />
    <div className="absolute left-[-6rem] top-20 h-72 w-72 rounded-full bg-[#d7ebff] blur-3xl" />
    <div className="absolute bottom-[-8rem] right-[-4rem] h-80 w-80 rounded-full bg-[#fde7cd] blur-3xl" />
    <div className="relative z-10 flex min-h-[calc(100vh-4rem)] items-center justify-center">
      {children}
    </div>
  </div>
);

const FeatureCard = ({
  title,
  body,
}: {
  title: string;
  body: string;
}) => (
  <div className="rounded-[24px] border border-white/12 bg-white/8 p-5 backdrop-blur">
    <p className="text-sm font-semibold text-white">{title}</p>
    <p className="mt-2 text-sm leading-7 text-white/72">{body}</p>
  </div>
);

const FieldError = ({ meta }: { meta: { touched?: boolean; error?: string } }) => {
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
  <InvitationShell>
    <div className="flex w-full max-w-md flex-col items-center rounded-[32px] border border-white/70 bg-white/90 px-8 py-12 text-center shadow-[0_30px_80px_rgba(15,23,42,0.14)] backdrop-blur">
      <div className="relative flex h-20 w-20 items-center justify-center">
        <div className="absolute inset-0 rounded-full border-4 border-[#dbeafe]" />
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[#023e8a] border-r-[#4ecdc4]" />
        <div className="rounded-full bg-[#eff6ff] p-4 text-[#023e8a]">
          <SparkIcon />
        </div>
      </div>
      <h2 className="mt-6 text-2xl font-semibold text-[#111827]">
        Verifying invitation
      </h2>
      <p className="mt-3 text-sm leading-7 text-[#5f6470]">
        We&apos;re validating your invitation token and preparing your account
        setup securely.
      </p>
    </div>
  </InvitationShell>
);

const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m5 12 5 5L20 7" />
  </svg>
);

const DotIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="10"
    height="10"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <circle cx="12" cy="12" r="8" />
  </svg>
);

const AlertIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="26"
    height="26"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
  </svg>
);

const SparkIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m12 3-1.9 5.1L5 10l5.1 1.9L12 17l1.9-5.1L19 10l-5.1-1.9Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
);

const MailIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="20" height="16" x="2" y="4" rx="3" />
    <path d="m22 7-8.97 5.7a2 2 0 0 1-2.06 0L2 7" />
  </svg>
);
export default page;
