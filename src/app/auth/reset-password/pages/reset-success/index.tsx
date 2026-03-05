import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Button from "@/components/reuseables/Button";
import AuthWrapper from "@/app/auth/AuthWrapper";

const ResetSuccess = () => {
  const router = useRouter();
  return (
    <AuthWrapper>
      <div>
        <div className="bg-[#fff] p-[40px] space-y-10 rounded-[20px]">
          <div className="flex flex-col items-center gap-4">
            <Image
              src="/assets/icons/blue-success.svg"
              alt=""
              className="lg:w-28 w-28 "
              width={112}
              height={112}
            />
            <p className="text-[#181818] lg:text-2xl lg:font-semibold font-[500] text-[18px] ">
              New Password Confirmed
            </p>
            <p className="text-[#5c1d1d] lg:text-lg text-[16px] font-medium text-center ">
              You have successfully changed your password
            </p>
          </div>
          <Button
            variant="blue"
            title="LOG IN"
            full
            onClick={() => router.push("/auth/login")}
          />
        </div>
      </div>
    </AuthWrapper>
  );
};

export default ResetSuccess;
