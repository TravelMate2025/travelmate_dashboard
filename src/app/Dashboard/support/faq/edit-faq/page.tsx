"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoadingFaqSkeleton } from "@/components/molecues/support/Faq";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { useGetAllFaq, useUpdateFaq } from "@/hooks/api/faq";
import Button from "@/components/reuseables/Button";
import { useRouter } from "next/navigation";

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

type Category = {
  id: number;
  name: string;
  name_display: string;
  description: string;
  icon: string;
  order: number;
  faqs: Faq[];
};

type FaqResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Category[];
};

type EditFaq = Faq & { categoryId: number };

const Page = () => {
  const router = useRouter();
  const [selectedFaqId, setSelectedFaqId] = useState<number | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [refresh, setRefresh] = useState(false);

  const { data, loading } = useGetAllFaq({ initalFetch: true, refresh });
  const { loading: isUpdating, onUpdateFaq } = useUpdateFaq();

  const selectedFaq =
    data?.results
      .flatMap((category: Category) =>
        category.faqs.map((faq: Faq): EditFaq => ({
          ...faq,
          categoryId: category.id,
        }))
      )
      .find((faq) => faq.id === selectedFaqId) || null;

  const [editCategoryId, setEditCategoryId] = useState<number>(0);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);

  const categoryOptions: Category[] = data?.results || [];

  const goToFaqTab = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("activeTab", "faq");
    }
    router.push("/Dashboard/support?tab=faq");
  };

  const openEditDialog = () => {
    if (!selectedFaq) {
      return;
    }

    setEditCategoryId(selectedFaq.categoryId);
    setEditQuestion(selectedFaq.question);
    setEditAnswer(selectedFaq.answer);
    setEditIsActive(selectedFaq.is_active);
    setShowEditDialog(true);
  };

  const handleUpdateFaq = async () => {
    if (selectedFaqId === null) {
      return;
    }

    await onUpdateFaq({
      id: selectedFaqId,
      payload: {
        category: editCategoryId,
        question: editQuestion,
        answer: editAnswer,
        is_active: editIsActive,
      },
      successCallback: async () => {
        setRefresh((prev: boolean) => !prev);
        setShowEditDialog(false);
        setSelectedFaqId(null);
        goToFaqTab();
      },
    });
  };

  return (
    <div className="space-y-6 py-4 px-6 rounded-[8px] bg-[#fff]">
      <button
        onClick={goToFaqTab}
        className="inline-flex items-center mb-4"
        aria-label="Go back"
      >
        <img src="/assets/icons/arrow-back.svg" alt="Go back" />
      </button>

      <div className="space-y-6">
        <h1 className="font-semibold text-[20px] text-[#181818]">Edit FAQs</h1>

        <FaqTabContent
          data={data}
          loading={loading}
          selectedFaqId={selectedFaqId}
          onSelectFaq={(id) => setSelectedFaqId(id)}
        />
      </div>

      <Button
        variant="orange-deep"
        title="EDIT SELECTED"
        full
        onClick={openEditDialog}
        disabled={selectedFaqId === null || isUpdating || selectedFaq === null}
      />

      {showEditDialog && selectedFaq && (
        <Dialog open={showEditDialog} onOpenChange={() => setShowEditDialog(false)}>
          <DialogContent className="w-full lg:min-w-[640px] p-[30px] space-y-5 rounded-[20px]">
            <DialogHeader>
              <DialogTitle>Edit FAQ</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="edit-faq-category"
                  className="text-sm font-medium text-[#181818]"
                >
                  Category
                </label>
                <select
                  id="edit-faq-category"
                  value={editCategoryId}
                  onChange={(e) => setEditCategoryId(Number(e.target.value))}
                  title="FAQ category"
                  className="w-full rounded-[8px] border border-[#9B9EA4] p-3 bg-white"
                >
                  {categoryOptions.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name_display}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="edit-faq-question"
                  className="text-sm font-medium text-[#181818]"
                >
                  Question
                </label>
                <input
                  id="edit-faq-question"
                  type="text"
                  value={editQuestion}
                  onChange={(e) => setEditQuestion(e.target.value)}
                  placeholder="Enter FAQ question"
                  title="FAQ question"
                  className="w-full rounded-[8px] border border-[#9B9EA4] p-3"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="edit-faq-answer"
                  className="text-sm font-medium text-[#181818]"
                >
                  Answer
                </label>
                <textarea
                  id="edit-faq-answer"
                  value={editAnswer}
                  onChange={(e) => setEditAnswer(e.target.value)}
                  rows={5}
                  placeholder="Enter FAQ answer"
                  title="FAQ answer"
                  className="w-full rounded-[8px] border border-[#9B9EA4] p-3"
                />
              </div>

              <label className="flex items-center gap-2 text-sm font-medium text-[#181818]">
                <input
                  type="checkbox"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                />
                Active
              </label>
            </div>
            <div className="flex justify-between space-x-4">
              <Button
                title={isUpdating ? "UPDATING..." : "UPDATE"}
                variant="orange-deep"
                onClick={handleUpdateFaq}
                full
                disabled={isUpdating}
              />
              <Button
                title="CANCEL"
                variant="outline-dark"
                onClick={() => setShowEditDialog(false)}
                full
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
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
