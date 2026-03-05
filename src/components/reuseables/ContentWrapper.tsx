"use client";
import React from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

type LayoutWrapperProps = {
  children: React.ReactNode;
  url?: string;
};

const ContentWrapper = ({ children, url }: LayoutWrapperProps) => {
  const router = useRouter();
  return (
    <div className="max-screen-wrapper">
      <div className="max-screen-inner lg:py-[10px]">
        <div className="hidden w-full lg:block">
          <div className="mb-6 flex items-center gap-4">
            <button
              onClick={url ? () => router.push(url) : () => router.back()}
              aria-label="Go back"
              title="Go back"
              className="p-1 rounded-full hover:bg-gray-200"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
          </div>
        </div>
        <div className="lg:w-full lg:max-w-[754px] w-full lg:rounded-[20px] lg:mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ContentWrapper;
