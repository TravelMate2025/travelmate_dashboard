import Tiptap from "@/components/ui/Tiptap";
import { Plus } from "lucide-react";
import React, { useState } from "react";
import { AboutContent } from "@/app/Dashboard/cms/legal/page";
import HistoryModal from "./modals/HistoryModal";

type Props = {
  isEditing: boolean;
  content: AboutContent[];
  updateAboutContent: () => void;
  onContentChange: (content: AboutContent[]) => void;
  isLoadingAboutUpdate: boolean;
  onCancel?: () => void;
  onEdit?: () => void;
};
const isContentEmpty = (html: string) =>
  !html || html.trim() === "" || html.trim() === "<p></p>";

const About = ({
  isEditing,
  content,
  onContentChange,
  updateAboutContent,
  isLoadingAboutUpdate,
  onCancel,
  onEdit,
}: Props) => {
  const currentContent = content?.[0]?.content || "";

   const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

    const handleChange = (id: number, value: string) => {
    const updatedContent = content.map((item) =>
      item.id === id ? { ...item, content: value } : item
    );
    onContentChange(updatedContent);
  };
  return (
    <div>
      {/* <HistoryModal/> */}
      {isEditing ? (
        content?.map((item) => (
          <div
            key={item.id}
            className="w-full p-4 text-[16px] lg:text-[18px] font-[400] text-[#181818] leading-[30px] border border-gray-300 rounded-md"
          >
            <Tiptap
              onChange={(value: string) => handleChange(item.id, value)}
              content={item.content}
            />
            <div className="flex justify-center w-full items-center mt-12 gap-5 px-8">
              <button
                className="border-[1px] border-[#023E8A] text-[#023E8A] p-2 rounded-md w-full cursor-pointer"
                onClick={onCancel}
              >
                Cancel
              </button>
              <button
                className="bg-[#023E8A] flex items-center justify-center text-white p-2 rounded-md w-full cursor-pointer disabled:cursor-auto disabled:bg-gray-300 disabled:text-gray-500"
                onClick={updateAboutContent}
                disabled={isContentEmpty(item.content)}
              >
                {isLoadingAboutUpdate && <LoadingIcon />}
                <span className="pl-2">Save</span>
              </button>
            </div>
          </div>
        ))
      ) : currentContent && !isContentEmpty(currentContent) ? (
        <div className="text-[16px] lg:text-[18px] font-[400] text-[#181818] leading-[30px]">
          <p className="pb-3">Last Updated: {formatDate(content[0]?.updated_at || content[0]?.last_updated)}</p>
          <p
            dangerouslySetInnerHTML={{
              __html: currentContent,
            }}
          ></p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2">
          <p className="text-[16px] lg:text-[18px] font-[400] text-[#181818] leading-[30px]">
            No content added yet.
          </p>
          <button
            onClick={onEdit}
            className="cursor-pointer flex items-center justify-center gap-1 text-white bg-[#023E8A] p-2 rounded-lg"
          >
            <Plus />
            <span>Add Content</span>
          </button>
        </div>
      )}
    </div>
  );
};
const LoadingIcon = () => {
  return (
    <svg
      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
};

export default About;
