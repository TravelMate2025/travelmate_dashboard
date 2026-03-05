import type React from "react";
import type { Metadata } from "next";
// import { Inter } from "next/font/google";
import "./globals.css";
import DashboardLayout from "./dashboard-layout";
import NextTopLoader from "nextjs-toploader";
import { AuthContextWrapper } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";

// const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TravelMate - Booking Management",
  description: "Manage travel bookings efficiently",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <NextTopLoader color="#151357" height={5} />
        <AuthContextWrapper>
          <div className="">{children}</div>
        </AuthContextWrapper>
        <Toaster richColors />
      </body>
    </html>
  );
}

// className={inter.className}