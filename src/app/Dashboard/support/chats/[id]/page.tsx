import React from "react";
import { MainChatComponents } from "@/components/molecues/support/Chats/MainChatComponents";
import { getCookies } from "@/context/Auth-Cookies";

const page = async ({ params }: { params: { sessionId: string } }) => {
  const { accessToken } = await getCookies();
  return (
    <div className="">
      <MainChatComponents sessionId={params.sessionId} accessToken={accessToken} />
    </div>
  );
};

export default page;
