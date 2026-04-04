import Stats from "@/components/molecues/support/Stats";
import Tab from "@/components/molecues/support/Tab";
import React from "react";
import { Suspense } from "react";


const page = () => {
  return (
    <div className="px-[16px] lg:px-[37px] bg-[white] lg:bg-transparent min-h-screeen space-y-10">
      <Stats />
      <Suspense fallback={<div className="h-16" />}>
        <Tab />
      </Suspense>
    </div>
  );
};

export default page;
