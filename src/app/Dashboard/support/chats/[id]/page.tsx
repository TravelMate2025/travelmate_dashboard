import React from "react";
import { MainChatComponents } from "@/components/molecues/support/Chats/MainChatComponents";
import { getCookies } from "@/context/Auth-Cookies";
import { getSingleRouteParam } from "@shared/lib/routeParams";

const page = async ({ params }: { params: { id?: string; sessionId?: string } }) => {
  const { accessToken } = await getCookies();
  const resolvedSessionId = getSingleRouteParam(params, "id") || getSingleRouteParam(params, "sessionId");

  return (
    <div className="">
      <MainChatComponents
        sessionId={resolvedSessionId}
        accessToken={accessToken}
      />
    </div>
  );
};

export default page;
