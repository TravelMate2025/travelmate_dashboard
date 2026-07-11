"use client";
import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import Button from "@/components/reuseables/Button";
import Link from "next/link";
import { useGetAllFaq } from "@/hooks/api/faq";

type FaqTabContentProps = {
  data?: FaqResponse | null;
  loading: boolean;
};

// Define the FAQ type
type Faq = {
  id: number;
  category: number;
  category_name: string;
  question: string;
  answer: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  views: number;
};

// Define the Category type
type Category = {
  id: number;
  name: string;
  name_display: string;
  description: string;
  icon: string;
  order: number;
  faqs: Faq[];
};

// Define the main response type
export type FaqResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Category[];
};

export const FaqSection = () => {
  const { data, loading } = useGetAllFaq({ initalFetch: true });

  return <FaqTabContent data={data} loading={loading} />;
};

export const FaqTabContent: React.FC<FaqTabContentProps> = ({
  data,
  loading,
}) => {
  const categories = data?.results || []; // Use categories from API response

  return (
    <div>
      <div className="space-y-10 py-4 px-6 rounded-[8px]">
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="font-[600] text-[20px] text-[#181818] leading-[100%]">
              FAQs
            </h1>
            <Link href="/Dashboard/support/faq/add-faq">
              <div className="hidden lg:block">
                <Button
                  variant="orange-deep"
                  title="Add New"
                  icon="/assets/icons/white-plus.svg"
                />
              </div>
            </Link>
          </div>
          {loading ? (
            <LoadingFaqSkeleton />
          ) : (
            <>
              <Tabs defaultValue={categories[0]?.name_display || "Category"}>
                <TabsList className="w-full bg-transparent border-[#CDCED1] border-b-[1px] pb-[6px] rounded-none">
                  {categories.map((category) => (
                    <TabsTrigger
                      key={category.id}
                      value={category.name_display}
                      className="p-2 bg-transparent shadow-transparent rounded-none border-b-[1px] border-transparent data-[state=active]:border-[#023E8A]"
                    >
                      {category.name_display}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {categories.map((category) => (
                  <TabsContent key={category.id} value={category.name_display}>
                    {category.faqs.length === 0 ? (
                      <div className="text-center text-gray-500 mt-2.5">
                        No FAQs available in this category.
                      </div>
                    ) : (
                      <Accordion type="single" collapsible>
                        {category.faqs.map((faq) => (
                          <AccordionItem
                            key={faq.id}
                            value={`${category.name_display}-faq-${faq.id}`}
                          >
                            <AccordionTrigger>{faq.question}</AccordionTrigger>
                            <AccordionContent>{faq.answer}</AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </>
          )}
        </div>

        {/* Buttons Section */}
        <div className="lg:px-10 flex justify-between lg:space-x-6 space-y-6 lg:space-y-0 flex-col lg:flex-row">
          <Link href="/Dashboard/support/faq/edit-faq" className="w-full">
            <Button
              variant="orange-deep"
              title="EDIT FAQ"
              icon="/assets/icons/mode_edit.svg"
              full
            />
          </Link>
          <Link href="/Dashboard/support/faq/delete-faq" className="w-full">
            <Button
              variant="light-red"
              title="DELETE FAQ"
              icon="/assets/icons/delete.svg"
              full
            />
          </Link>
        </div>

        {/* Category Management Section */}
        <div className="lg:px-10 space-y-4">
          <h2 className="font-[600] text-[16px] text-[#181818]">
            Categories
          </h2>
          <div className="flex justify-between lg:space-x-6 space-y-6 lg:space-y-0 flex-col lg:flex-row">
            <Link href="/Dashboard/support/faq/edit-category" className="w-full">
              <Button
                variant="orange-deep"
                title="EDIT CATEGORY"
                icon="/assets/icons/mode_edit.svg"
                full
              />
            </Link>
            <Link href="/Dashboard/support/faq/delete-category" className="w-full">
              <Button
                variant="light-red"
                title="DELETE CATEGORY"
                icon="/assets/icons/delete.svg"
                full
              />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export const LoadingFaqSkeleton = () => {
  return (
    <div className="w-full space-y-[12px]">
      <div className="bg-gray-300 rounded-[12px] animate-pulse h-[40px] w-ful"></div>
      <div className="bg-gray-300 rounded-[12px] animate-pulse h-[40px] w-ful"></div>
      <div className="bg-gray-300 rounded-[12px] animate-pulse h-[40px] w-ful"></div>
      <div className="bg-gray-300 rounded-[12px] animate-pulse h-[40px] w-ful"></div>
    </div>
  );
};
