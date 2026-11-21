"use client";
import React from "react";

const AuthWrapper = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f3f6fb] px-4 py-10 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(2,62,138,0.12),_transparent_30%),linear-gradient(135deg,_#f8fbff_0%,_#eef3fb_48%,_#f8f4ef_100%)]" />
      <div className="absolute left-[-5rem] top-20 h-72 w-72 rounded-full bg-[#d7ebff] blur-3xl" />
      <div className="absolute bottom-[-7rem] right-[-3rem] h-80 w-80 rounded-full bg-[#fde7cd] blur-3xl" />

      <div className="relative z-10 w-full max-w-5xl">{children}</div>
    </div>
  );
};

export const AuthPanel = ({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) => {
  return (
    <div className="grid overflow-hidden rounded-[36px] border border-white/60 bg-white/92 shadow-[0_40px_120px_rgba(15,23,42,0.16)] backdrop-blur lg:grid-cols-[1fr_0.95fr]">
      <section className="relative overflow-hidden bg-[#0b1f3a] px-7 py-10 text-white sm:px-10 lg:px-12 lg:py-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(78,205,196,0.22),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(2,62,138,0.45),_transparent_40%)]" />
        <div className="absolute -left-12 top-20 h-44 w-44 rounded-full border border-white/10" />
        <div className="absolute bottom-6 right-6 h-28 w-28 rounded-full bg-white/5 blur-2xl" />

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
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#9ad0ff]">
                TravelMate
              </p>
              <p className="mt-1 text-sm text-white/70">Admin dashboard</p>
            </div>
          </div>

          <div className="mt-10 max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#9ad0ff]">
              {eyebrow}
            </p>
            <h1 className="mt-5 text-4xl font-semibold leading-tight sm:text-5xl">
              {title}
            </h1>
            <p className="mt-6 max-w-lg text-base leading-8 text-white/74 sm:text-lg">
              {description}
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <InfoCard
              title="Protected access"
              body="Secure sign-in for operational tools, team workflows, and booking oversight."
            />
            <InfoCard
              title="Built for speed"
              body="Get into the dashboard quickly with a straightforward, focused authentication flow."
            />
          </div>
        </div>
      </section>

      <section className="bg-[#f7f8fc] px-6 py-8 sm:px-8 lg:px-10 lg:py-12">
        {children}
      </section>
    </div>
  );
};

const InfoCard = ({
  title,
  body,
}: {
  title: string;
  body: string;
}) => {
  return (
    <div className="rounded-[22px] border border-white/12 bg-white/8 p-5 backdrop-blur">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-7 text-white/72">{body}</p>
    </div>
  );
};

const AuthWrapperDefault = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <AuthWrapper>
      <AuthPanel
        eyebrow="Authentication"
        title="Welcome back to your operations hub."
        description="Sign in to manage bookings, support activity, reporting, and administrative actions from one place."
      >
        {children}
      </AuthPanel>
    </AuthWrapper>
  );
};

export default AuthWrapperDefault;
