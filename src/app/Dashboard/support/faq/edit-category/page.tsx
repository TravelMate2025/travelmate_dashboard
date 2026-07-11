"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoadingFaqSkeleton } from "@/components/molecues/support/Faq";
import {
  AddFaqCategoryPayload,
  useGetAllFaq,
  useUpdateFaqCategory,
} from "@/hooks/api/faq";
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

const FAQ_CATEGORY_NAMES: AddFaqCategoryPayload["name"][] = [
  "FLIGHTS",
  "STAYS",
  "CAR_RENTALS",
  "ACCOUNT",
];

const Page = () => {
  const router = useRouter();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [refresh, setRefresh] = useState(false);

  const { data, loading } = useGetAllFaq({ initalFetch: true, refresh });
  const { loading: isUpdating, onUpdateFaqCategory } = useUpdateFaqCategory();

  const categories: Category[] = data?.results || [];
  const selectedCategory =
    categories.find((category) => category.id === selectedCategoryId) ||
    null;

  const [editName, setEditName] =
    useState<AddFaqCategoryPayload["name"]>("FLIGHTS");
  const [editDescription, setEditDescription] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [editOrder, setEditOrder] = useState("0");

  const goToFaqTab = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("activeTab", "faq");
    }
    router.push("/Dashboard/support?tab=faq");
  };

  const openEditDialog = () => {
    if (!selectedCategory) {
      return;
    }

    setEditName(selectedCategory.name as AddFaqCategoryPayload["name"]);
    setEditDescription(selectedCategory.description);
    setEditIcon(selectedCategory.icon);
    setEditOrder(String(selectedCategory.order));
    setShowEditDialog(true);
  };

  const handleUpdateCategory = async () => {
    if (selectedCategoryId === null) {
      return;
    }

    await onUpdateFaqCategory({
      id: selectedCategoryId,
      payload: {
        name: editName,
        description: editDescription,
        icon: editIcon,
        order: Number.isFinite(Number(editOrder)) ? Number(editOrder) : 0,
      },
      successCallback: () => {
        setRefresh((prev) => !prev);
        setShowEditDialog(false);
        setSelectedCategoryId(null);
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
        <h1 className="font-semibold text-[20px] text-[#181818]">
          Edit FAQ Category
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
        variant="orange-deep"
        title="EDIT SELECTED"
        full
        onClick={openEditDialog}
        disabled={selectedCategoryId === null || isUpdating}
      />

      {showEditDialog && selectedCategory && (
        <Dialog
          open={showEditDialog}
          onOpenChange={() => setShowEditDialog(false)}
        >
          <DialogContent className="w-full lg:min-w-[640px] p-[30px] space-y-5 rounded-[20px]">
            <DialogHeader>
              <DialogTitle>Edit FAQ Category</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="edit-category-name"
                  className="text-sm font-medium text-[#181818]"
                >
                  Name
                </label>
                <select
                  id="edit-category-name"
                  value={editName}
                  onChange={(e) =>
                    setEditName(e.target.value as AddFaqCategoryPayload["name"])
                  }
                  title="Category name"
                  className="w-full rounded-[8px] border border-[#9B9EA4] p-3 bg-white"
                >
                  {FAQ_CATEGORY_NAMES.map((categoryName) => (
                    <option key={categoryName} value={categoryName}>
                      {categoryName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="edit-category-description"
                  className="text-sm font-medium text-[#181818]"
                >
                  Description
                </label>
                <input
                  id="edit-category-description"
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Description (optional)"
                  title="Category description"
                  className="w-full rounded-[8px] border border-[#9B9EA4] p-3"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="edit-category-icon"
                  className="text-sm font-medium text-[#181818]"
                >
                  Icon
                </label>
                <input
                  id="edit-category-icon"
                  type="text"
                  value={editIcon}
                  onChange={(e) => setEditIcon(e.target.value)}
                  placeholder="Icon class (optional)"
                  title="Category icon"
                  className="w-full rounded-[8px] border border-[#9B9EA4] p-3"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="edit-category-order"
                  className="text-sm font-medium text-[#181818]"
                >
                  Display order
                </label>
                <input
                  id="edit-category-order"
                  type="number"
                  value={editOrder}
                  onChange={(e) => setEditOrder(e.target.value)}
                  placeholder="Display order"
                  title="Category display order"
                  className="w-full rounded-[8px] border border-[#9B9EA4] p-3"
                />
              </div>
            </div>
            <div className="flex justify-between space-x-4">
              <Button
                title={isUpdating ? "UPDATING..." : "UPDATE"}
                variant="orange-deep"
                onClick={handleUpdateCategory}
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
