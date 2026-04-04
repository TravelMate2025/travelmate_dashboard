"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { LoadingFaqSkeleton } from "@/components/molecues/support/Faq";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { useDeleteFaq, useGetAllFaq } from "@/hooks/api/faq";
import Button from "@/components/reuseables/Button";
import { useRouter } from "next/navigation";

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

const Page = () => {
  const router = useRouter();

  const goToFaqTab = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("activeTab", "faq");
    }
    router.push("/Dashboard/support?tab=faq");
  };

  const [selectedFaqId, setSelectedFaqId] = useState<number | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const { data, loading } = useGetAllFaq({ initalFetch: true, refresh });
  const { isloading, onDeleteFaq } = useDeleteFaq();

  const handleDeleteFaq = async () => {
    if (selectedFaqId !== null) {
      await onDeleteFaq({
        id: selectedFaqId,
        successCallback: async () => {
          setRefresh((prev: boolean) => !prev);
          setShowModal(true);
        },
      });
      setSelectedFaqId(null);
      setShowConfirmation(false);
    }
  };

  return (
    <>
      <div className="space-y-6 py-4 px-6 rounded-[8px] bg-[#fff]">
        <button
          onClick={goToFaqTab}
          className="inline-flex items-center mb-4 "
          aria-label="Go back"
        >
          <img src="/assets/icons/arrow-back.svg" alt="Go back" className="" />
        </button>
        <div className="space-y-6">
          <h1 className="font-semibold text-[20px] text-[#181818]">FAQs</h1>

          <FaqTabContent
            data={data}
            loading={loading}
            selectedFaqId={selectedFaqId}
            onSelectFaq={(id) => setSelectedFaqId(id)}
          />
        </div>

        <Button
          variant="red"
          title="DELETE SELECTED"
          full
          onClick={() => setShowConfirmation(true)}
          disabled={selectedFaqId === null || isloading}
        />

        {/* Confirmation Modal */}
        {showConfirmation && (
          <Dialog
            open={showConfirmation}
            onOpenChange={() => setShowConfirmation(false)}
          >
            <DialogContent className="w-full lg:min-w-[500px] p-[30px] space-y-5 rounded-[20px]">
              <DialogHeader>
                <DialogTitle>Delete FAQ?</DialogTitle>
              </DialogHeader>
              <DialogDescription>
                Are you sure you want to delete this FAQ? This action cannot be
                undone.
              </DialogDescription>
              <div className="flex justify-between space-x-4">
                <Button
                  title={isloading ? "DELETING..." : "DELETE"}
                  variant="red"
                  onClick={handleDeleteFaq}
                  full
                  disabled={isloading}
                />
                <Button
                  title="CANCEL"
                  variant="outline-dark"
                  onClick={() => setShowConfirmation(false)}
                  full
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </>
  );
};

const FaqTabContent: React.FC<{
  data?: FaqResponse | null;
  loading: boolean;
  selectedFaqId: number | null;
  onSelectFaq: (id: number | null) => void;
}> = ({ data, loading, selectedFaqId, onSelectFaq }) => {
  const categories = data?.results || [];
  return (
    <div className="space-y-10">
      {loading ? (
        <LoadingFaqSkeleton />
      ) : (
        <Tabs defaultValue={categories[0]?.name_display || "Category"}>
          <TabsList className="w-full bg-transparent border-[#CDCED1] border-b-[1px] pb-[6px] rounded-none">
            {categories.map((category) => (
              <TabsTrigger
                key={category.id}
                value={category.name_display}
                className="p-2 bg-transparent shadow-transparent rounded-none border-b-[1.5px] border-transparent data-[state=active]:border-[#D72638]"
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
                    <AccordionItem key={faq.id} value={`faq-${faq.id}`}>
                      <AccordionTrigger>
                        <div className="flex items-center space-x-4">
                          <input
                            type="checkbox"
                            aria-label={`Select FAQ ${faq.question}`}
                            title={`Select FAQ ${faq.question}`}
                            checked={selectedFaqId === faq.id}
                            onChange={(e) =>
                              onSelectFaq(e.target.checked ? faq.id : null)
                            }
                          />
                          <span>{faq.question}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
};

export default Page;
