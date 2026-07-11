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
import { useDeleteFaqCategory, useGetAllFaq } from "@/hooks/api/faq";
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

const Page = () => {
  const router = useRouter();

  const goToFaqTab = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("activeTab", "faq");
    }
    router.push("/Dashboard/support?tab=faq");
  };

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [refresh, setRefresh] = useState(false);

  const { data, loading } = useGetAllFaq({ initalFetch: true, refresh });
  const { loading: isDeleting, onDeleteFaqCategory } = useDeleteFaqCategory();

  const categories: Category[] = data?.results || [];
  const selectedCategory =
    categories.find((category) => category.id === selectedCategoryId) ||
    null;

  const handleDeleteCategory = async () => {
    if (selectedCategoryId === null) {
      return;
    }

    await onDeleteFaqCategory({
      id: selectedCategoryId,
      successCallback: () => {
        setRefresh((prev) => !prev);
        setShowConfirmation(false);
        setSelectedCategoryId(null);
        goToFaqTab();
      },
    });
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
          <h1 className="font-semibold text-[20px] text-[#181818]">
            Delete FAQ Category
          </h1>

          {loading ? (
            <LoadingFaqSkeleton />
          ) : (
            <CategoryList
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={(id) => setSelectedCategoryId(id)}
            />
          )}
        </div>

        <Button
          variant="red"
          title="DELETE SELECTED"
          full
          onClick={() => setShowConfirmation(true)}
          disabled={selectedCategoryId === null || isDeleting}
        />

        {/* Confirmation Modal */}
        {showConfirmation && selectedCategory && (
          <Dialog
            open={showConfirmation}
            onOpenChange={() => setShowConfirmation(false)}
          >
            <DialogContent className="w-full lg:min-w-[500px] p-[30px] space-y-5 rounded-[20px]">
              <DialogHeader>
                <DialogTitle>Delete &quot;{selectedCategory.name_display}&quot;?</DialogTitle>
              </DialogHeader>
              <DialogDescription>
                {selectedCategory.faqs.length > 0 ? (
                  <>
                    This category has{" "}
                    <strong>
                      {selectedCategory.faqs.length} FAQ
                      {selectedCategory.faqs.length === 1 ? "" : "s"}
                    </strong>{" "}
                    attached. Deleting the category will permanently delete
                    all of them too. This action cannot be undone.
                  </>
                ) : (
                  "Are you sure you want to delete this category? This action cannot be undone."
                )}
              </DialogDescription>
              <div className="flex justify-between space-x-4">
                <Button
                  title={isDeleting ? "DELETING..." : "DELETE"}
                  variant="red"
                  onClick={handleDeleteCategory}
                  full
                  disabled={isDeleting}
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

const CategoryList: React.FC<{
  categories: Category[];
  selectedCategoryId: number | null;
  onSelectCategory: (id: number | null) => void;
}> = ({ categories, selectedCategoryId, onSelectCategory }) => {
  if (categories.length === 0) {
    return (
      <div className="text-center text-gray-500 mt-2.5">
        No FAQ categories found.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {categories.map((category) => (
        <label
          key={category.id}
          className="flex items-center justify-between gap-4 rounded-[8px] border border-[#CDCED1] p-4 cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <input
              type="radio"
              name="category"
              aria-label={`Select category ${category.name_display}`}
              checked={selectedCategoryId === category.id}
              onChange={() => onSelectCategory(category.id)}
            />
            <div>
              <p className="font-medium text-[#181818]">
                {category.name_display}
              </p>
              {category.description ? (
                <p className="text-sm text-gray-500">
                  {category.description}
                </p>
              ) : null}
            </div>
          </div>
          <span className="text-sm text-gray-500">
            {category.faqs.length} FAQ{category.faqs.length === 1 ? "" : "s"}
          </span>
        </label>
      ))}
    </div>
  );
};

export default Page;
