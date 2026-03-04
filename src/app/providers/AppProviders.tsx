"use client";

import React from "react";
import NextTopLoader from "nextjs-toploader";
import { AuthContextWrapper } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";

type AppProvidersProps = {
  children: React.ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <>
      <NextTopLoader color="#151357" height={5} />
      <AuthContextWrapper>{children}</AuthContextWrapper>
      <Toaster richColors />
    </>
  );
}
