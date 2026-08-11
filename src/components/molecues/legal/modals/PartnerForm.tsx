import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Upload, X } from "lucide-react";
import { Partners } from "@/app/Dashboard/cms/legal/page";
const defaultData: Partners = {
  id: 0,
  name: "",
  logo: "",
  website: "",
  description: "",
  category: 0,
  is_active: true,
};

const PartnerForm = ({
  onSubmit,
  categories,
  showAddPartnersModal,
  setShowAddPartnersModal,
  loadingSave,
  editingPartner,
  onUpdatePartner,
}: {
  onSubmit: (newPartner: Partners) => Promise<void>;
  categories: { id: number; name: string }[];
  showAddPartnersModal: boolean;
  setShowAddPartnersModal: (showAddPartnersModal: boolean) => void;
  loadingSave: boolean;
  editingPartner?: Partners | null;
  onUpdatePartner?: (updatedPartner: Partners) => void;
}) => {
  const [formData, setFormData] = useState<Partners>(
    editingPartner || defaultData
  );
  const formatSnakeToTitle = (value: string): string => {
    return value
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, type } = e.target;
    const checked = e.target instanceof HTMLInputElement ? e.target.checked : false;

    if (
      type === "file" &&
      e.target instanceof HTMLInputElement &&
      e.target.files
    ) {
      const file = e.target.files[0];
      setFormData((prev) => ({
        ...prev,
        [name]: file,
      }));
    } else {
      const value =
        type === "checkbox"
          ? checked
          : type === "number"
          ? +e.target.value
          : e.target.value;

      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPartner) {
      onUpdatePartner?.(formData);
    } else {
      onSubmit(formData);
    }
     setFormData(defaultData);
  };

  useEffect(() => {
    if (showAddPartnersModal) {
      setFormData(editingPartner || defaultData);
    }
  }, [showAddPartnersModal, editingPartner]);

  useEffect(() => {
    if (editingPartner) {
      setFormData(editingPartner? {
        id: editingPartner.id,
        name: editingPartner.name,
        website: editingPartner.website || "",
        description: editingPartner.description,
        category: editingPartner.category,
        logo: editingPartner.logo,
        is_active: editingPartner.is_active,
      }: defaultData);
    } else {
      setFormData(defaultData);
    }
  }, [editingPartner]);

  return (
    <Dialog open={showAddPartnersModal} onOpenChange={setShowAddPartnersModal}>
      <DialogContent className="w-full lg:max-w-4xl max-w-sm p-8 rounded-lg bg-white shadow-2xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <DialogHeader className="text-justify">
          <DialogTitle className="text-xl font-bold text-[#181818]  text-justify">
            Add trusted Partners
          </DialogTitle>
        </DialogHeader>
        <div className="border rounded-lg p-2 bg-white">
          <div className="flex lg:flex-row flex-col justify-between gap-8 items-center w-full">
            <div className="w-full flex flex-col gap-1">
              <label className="font-bold">Category*</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-full p-2 cursor-pointer rounded-[8px] space-x-4  border-[#9b9ea4] border-[1px] flex justify-between items-center bg-transparent">
                    <span>
                      {formData.category
                        ? formatSnakeToTitle(
                            categories.find(
                              (cat) => cat.id === formData.category
                            )?.name || ""
                          )
                        : "Select category"}
                    </span>
                    <img
                      src="/assets/icons/arrow-down.svg"
                      alt=""
                      className="w-3 h-3 ml-auto"
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[var(--radix-popper-anchor-width)] min-w-[var(--radix-popper-anchor-width)]">
                  {Array.isArray(categories) &&
                    categories?.map((cat) => (
                      <DropdownMenuItem
                        key={cat.id}
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            category: cat.id,
                          }));
                        }}
                        className="w-full text-center px-4 py-2 hover:bg-gray-200 cursor-pointer"
                      >
                        {formatSnakeToTitle(cat.name)}
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="w-full flex flex-col gap-1">
              <label className="font-bold">Partner Name*</label>
              <input
                name="name"
                placeholder="Enter partner name"
                value={formData.name}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="font-bold">Description*</label>
            <textarea
              rows={4}
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-bold text-sm text-gray-700">
              Partner Logo*
            </label>

            {/* Hidden file input */}
            <input
              type="file"
              name="logo"
              accept="image/*"
              id="logo-upload"
              onChange={handleChange}
              className="hidden"
            />

            {/* Custom Upload Button */}
            <label
              htmlFor="logo-upload"
              className="flex items-center justify-center gap-2 px-4 py-2 border-[1px]  text-center w-full  rounded-md cursor-pointer transition-colors text-sm "
            >
              <Upload />
              <span>Upload File</span>
            </label>

            {/* Filename (if available) */}
            {formData.logo instanceof File && (
              <p className="text-sm text-gray-500 mt-1">{formData.logo.name}</p>
            )}

            {/* Image Preview */}
            {formData.logo instanceof File && (
              <div className="relative m-auto">
                <img
                  src={URL.createObjectURL(formData.logo)}
                  alt="Logo Preview"
                  className="h-24 w-auto rounded mt-2 object-contain"
                />
                <X
                  className="z-20 absolute -right-6 -top-4 rounded-full w-5 h-5 cursor-pointer"
                  onClick={() => setFormData((prev) => ({ ...prev, logo: "" }))}
                />
              </div>
            )}
            {typeof formData.logo === "string" && formData.logo && (
              <div className="relative m-auto">
                <img
                  src={formData.logo}
                  alt="Logo Preview"
                  className="h-24 w-auto rounded mt-2 object-contain"
                />
                <X
                  className="z-20 absolute -right-6 0 -top-4 rounded-full w-5 h-5 cursor-pointer"
                  onClick={() => setFormData((prev) => ({ ...prev, logo: "" }))}
                />
              </div>
            )}
          </div>
          <div className="flex justify-center w-full items-center mt-12 gap-5 ">
            <button
              className="border-[1px] border-[#023E8A] text-[#023E8A] p-2 rounded-md w-full cursor-pointer"
              onClick={() => {
                setShowAddPartnersModal(false);
                setFormData(defaultData);
              }}
            >
              Cancel
            </button>
            <button
              className="bg-[#023E8A] flex items-center justify-center text-white p-2 rounded-md w-full cursor-pointer disabled:cursor-auto disabled:bg-gray-300 disabled:text-gray-500"
              onClick={handleSubmit}
            >
              {loadingSave && <LoadingIcon />}
              <span className="pl-2"> Save</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
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
export default PartnerForm;
