"use client";
import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import Button from "@/components/reuseables/Button";
import {
  AddFaqCategoryPayload,
  useAddFaq,
  useAddFaqCategory,
  useGetAllFaq,
} from "@/hooks/api/faq";
import { useRouter } from "next/navigation";

const validationSchema = Yup.object({
  category: Yup.number()
    .typeError("Category is required")
    .min(1, "Category is required")
    .required("Category is required"),
  question: Yup.string().required("Question is required"),
  answer: Yup.string().required("Answer is required"),
});

const initialValues = {
  category: 0,
  question: "",
  answer: "",
  is_active: true,
};

const FAQ_CATEGORY_NAMES: AddFaqCategoryPayload["name"][] = [
  "FLIGHTS",
  "STAYS",
  "CAR_RENTALS",
  "ACCOUNT",
];

const Page = () => {
  const router = useRouter();

  const goToFaqTab = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("activeTab", "faq");
    }
    router.push("/Dashboard/support?tab=faq");
  };

  return (
    <div className="lg:bg-transparent">
      <button
        onClick={goToFaqTab}
        className="inline-flex items-center mb-4 "
        aria-label="Go back"
      >
        <img src="/assets/icons/arrow-back.svg" alt="Go back" className="" />
      </button>
      <AddComponent />
    </div>
  );
};

const AddComponent = () => {
  const router = useRouter();
  const { loading, onAddFaq } = useAddFaq();
  const { loading: addCategoryLoading, onAddFaqCategory } = useAddFaqCategory();
  const {
    data: faqCategoriesData,
    loading: categoriesLoading,
    onGetAllFaq,
  } = useGetAllFaq({
    initalFetch: true,
  });
  const [showModal, setShowModal] = useState(false);

  const categoryOptions = (faqCategoriesData?.results || []).map((category) => ({
    id: category.id,
    label: category.name_display,
  }));

  const goToFaqTab = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("activeTab", "faq");
    }
    router.push("/Dashboard/support?tab=faq");
  };

  const handleSubmit = async (values: typeof initialValues) => {
    await onAddFaq({
      payload: values,
      successCallback: () => {
        setShowModal(true);
        goToFaqTab();
      },
    });
  };

  return (
    <>
      <div className="space-y-6 py-4 px-6 rounded-[8px] bg-[#fff]">
        <h1 className="font-[600] text-[16px] lg:text-[20px] leading-[1.5] text-[#181818]">
          Add New FAQ
        </h1>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isValid, errors, touched, setFieldValue }) => (
            <Form>
              <div className="space-y-6">
                {/* Category Field */}
                <div className="space-y-2">
                  <label className="text-[14px] lg:text-[16px] font-[500] text-[#181818]">
                    Category:
                  </label>
                  <Dropdown
                    options={categoryOptions}
                    placeholder="Select category"
                    onSelect={(value) => setFieldValue("category", value?.id || 0)}
                    addCategoryLoading={addCategoryLoading}
                    onAddCategory={async (payload) => {
                      const createdCategory = await onAddFaqCategory({ payload });

                      if (!createdCategory) {
                        return null;
                      }

                      await onGetAllFaq();

                      const newOption = {
                        id: createdCategory.id,
                        label: createdCategory.name_display,
                      };

                      setFieldValue("category", newOption.id);
                      return newOption;
                    }}
                  />
                  {errors.category && touched.category && (
                    <p className="text-red-500 text-sm">{errors.category}</p>
                  )}
                  {!categoriesLoading && categoryOptions.length === 0 && (
                    <p className="text-red-500 text-sm">
                      No FAQ categories found. Please create a category first.
                    </p>
                  )}
                </div>

                {/* Question Field */}
                <div className="space-y-2">
                  <label className="text-[14px] lg:text-[16px] font-[500] text-[#181818]">
                    Question:
                  </label>
                  <Field
                    name="question"
                    type="text"
                    placeholder="Enter a frequently asked question"
                    className="w-full p-4 rounded-full outline-none border-[1px] border-[#9B9EA4] placeholder:text-[#9b9ea4] text-[16px] font-[400]"
                  />
                  {errors.question && touched.question && (
                    <p className="text-red-500 text-sm">{errors.question}</p>
                  )}
                </div>

                {/* Answer Field */}
                <div className="space-y-2">
                  <label className="text-[14px] lg:text-[16px] font-[500] text-[#181818]">
                    Answer:
                  </label>
                  <Field
                    name="answer"
                    as="textarea"
                    placeholder="Provide an answer"
                    rows={5}
                    className="w-full rounded-[8px] p-[16px] bg-[#F5F5F5] outline-none border-[1px] border-[#9B9EA4] placeholder:text-[#9b9ea4] text-[16px] font-[400]"
                  />
                  {errors.answer && touched.answer && (
                    <p className="text-red-500 text-sm">{errors.answer}</p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  title="SUBMIT"
                  variant={isValid ? "blue" : "gray"}
                  full
                  type="submit"
                  disabled={!isValid || loading || categoriesLoading || categoryOptions.length === 0}
                  loading={loading}
                />
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </>
  );
};

type DropdownOption = {
  id: number;
  label: string;
};

type DropdownProps = {
  options: DropdownOption[];
  placeholder?: string;
  onSelect: (value: DropdownOption | null) => void;
  onAddCategory?: (
    payload: AddFaqCategoryPayload
  ) => Promise<DropdownOption | null>;
  addCategoryLoading?: boolean;
};

const Dropdown = ({
  options,
  placeholder,
  onSelect,
  onAddCategory,
  addCategoryLoading = false,
}: DropdownProps) => {
  const [selectedOption, setSelectedOption] = useState<DropdownOption | null>(
    null
  );
  const [showAddCategoryForm, setShowAddCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState<AddFaqCategoryPayload["name"]>(
    FAQ_CATEGORY_NAMES[0]
  );
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("");
  const [newCategoryOrder, setNewCategoryOrder] = useState("0");

  const handleSelect = (option: DropdownOption) => {
    setSelectedOption(option);
    onSelect(option);
  };

  const handleAddCategory = async () => {
    if (!onAddCategory) {
      return;
    }

    const createdOption = await onAddCategory({
      name: newCategoryName,
      description: newCategoryDescription,
      icon: newCategoryIcon,
      order: Number.isFinite(Number(newCategoryOrder))
        ? Number(newCategoryOrder)
        : 0,
    });

    if (createdOption) {
      handleSelect(createdOption);
      setShowAddCategoryForm(false);
      setNewCategoryDescription("");
      setNewCategoryIcon("");
      setNewCategoryOrder("0");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="w-full p-4 rounded-full border-[#9b9ea4] border-[1px] flex justify-between bg-transparent"
        >
          {selectedOption?.label || placeholder}
          <img src="/assets/icons/arrow-down.svg" alt="Dropdown Arrow" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-[var(--radix-popper-anchor-width)] min-w-[var(--radix-popper-anchor-width)]"
      >
        {options.map((option) => (
          <DropdownMenuItem
            key={option.id}
            className="w-full text-center px-4 py-2 hover:bg-gray-200"
            onClick={() => handleSelect(option)}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem
          className="w-full text-center px-4 py-2 font-semibold text-[#023E8A]"
          onClick={() => setShowAddCategoryForm(true)}
          disabled={addCategoryLoading}
        >
          {addCategoryLoading ? "Adding category..." : "+ Add category"}
        </DropdownMenuItem>
      </DropdownMenuContent>

      {showAddCategoryForm ? (
        <div className="mt-3 space-y-2 rounded-[8px] border border-[#CDCED1] p-3 bg-[#F9FAFB]">
          <p className="text-[14px] font-[500] text-[#181818]">New Category</p>
          <select
            value={newCategoryName}
            onChange={(e) =>
              setNewCategoryName(e.target.value as AddFaqCategoryPayload["name"])
            }
            title="Category name"
            className="w-full p-2 rounded-[8px] border border-[#9B9EA4] bg-white"
          >
            {FAQ_CATEGORY_NAMES.map((categoryName) => (
              <option key={categoryName} value={categoryName}>
                {categoryName}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={newCategoryDescription}
            onChange={(e) => setNewCategoryDescription(e.target.value)}
            placeholder="Description (optional)"
            className="w-full p-2 rounded-[8px] border border-[#9B9EA4]"
          />
          <input
            type="text"
            value={newCategoryIcon}
            onChange={(e) => setNewCategoryIcon(e.target.value)}
            placeholder="Icon class (optional)"
            className="w-full p-2 rounded-[8px] border border-[#9B9EA4]"
          />
          <input
            type="number"
            value={newCategoryOrder}
            onChange={(e) => setNewCategoryOrder(e.target.value)}
            placeholder="Display order"
            className="w-full p-2 rounded-[8px] border border-[#9B9EA4]"
          />
          <div className="flex gap-2">
            <button
              type="button"
              className="px-3 py-2 rounded-[8px] border border-[#9B9EA4] text-[13px]"
              onClick={() => setShowAddCategoryForm(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-3 py-2 rounded-[8px] bg-[#023E8A] text-white text-[13px]"
              onClick={handleAddCategory}
              disabled={addCategoryLoading}
            >
              {addCategoryLoading ? "Creating..." : "Create category"}
            </button>
          </div>
        </div>
      ) : null}
    </DropdownMenu>
  );
};

export default Page;
