import React, { useEffect, useState } from 'react'
import { MessageProps } from '@/app/Dashboard/page';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import Loading from '@/app/Dashboard/admin/loading';
const Chat = ({
  messages,
  loading,
}: {
  messages: MessageProps[];
  loading: boolean;
}) => {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const resolveMessageLink = (link?: string) => {
    if (!link || typeof link !== "string") {
      return "/Dashboard/support";
    }

    const trimmedLink = link.trim();
    if (!trimmedLink) {
      return "/Dashboard/support";
    }

    // Keep navigation inside the app when a relative path is returned.
    if (trimmedLink.startsWith("/")) {
      return trimmedLink;
    }

    try {
      const parsed = new URL(trimmedLink);
      return `${parsed.pathname}${parsed.search}${parsed.hash}` || "/Dashboard/support";
    } catch {
      return "/Dashboard/support";
    }
  };
  return (
    <div className="bg-[#fff] h-full px-4 py-[30px] rounded-[16px] overflow-y-auto">
      <div className="space-y-6">
        <div className="flex justify-between items-center lg:px-[20px] ">
          <h3 className="font-[500] text-[18px] text-[#181818] leading-[100%]">
            Messages
          </h3>
          <div
            className="flex items-center space-x-2 cursor-pointer "
            onClick={() => router.push("/Dashboard/support")}
          >
            <p className="font-[500] text-[16px] text-[#023E8A] leading-[100%]">
              See all
            </p>
            <ChevronRight stroke="#023E8A" />
          </div>
        </div>
        <div className="w-full h-[3px] bg-[#EBECED]"></div>
        <div className="">
          {loading ? (
            <Loading />
          ) : (
            messages.slice(0, 10).map((msg, i) => (
              <div
                key={msg.id}
                className={`py-3 lg:px-[20px]  w-full flex space-x-4 items-center cursor-pointer hover:bg-[#f2f2f2]  ${
                  i === messages.length - 1
                    ? ""
                    : "border-b-[2px] border-[#F5F5F5]"
                }`}
                onClick={() => router.push(resolveMessageLink(msg.link))}
              >
                <img
                  src={
                    msg.type === "ticket_message"
                      ? `/assets/icons/flight_cancellation.svg`
                      : `/assets/icons/Message-icon.svg`
                  }
                  alt=""
                  className=""
                />
                <div className="flex-1 justify-between flex items-center">
                  <p className="font-[400] text-sm text-[#181818] leading-[100%]">
                    {(() => {
                      const senderName = msg.sender?.name || "Unknown sender";
                      const titleText = msg.title || msg.content || "Message";
                      const fullText = `${titleText} by ${senderName}`;
                      return fullText.length > 20
                        ? `${fullText.slice(0, 20)}...`
                        : fullText;
                    })()}
                  </p>
                  <span className="font-[400] text-[12px] text-[#9B9EA4] leading-[100%]">
                    {isMounted
                      ? new Date(msg.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "--:--"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};


export default Chat