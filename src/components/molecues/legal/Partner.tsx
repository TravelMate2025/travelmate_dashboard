import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import env from "@/config/env";
import PartnerForm from "./modals/PartnerForm";
import PartnerDetails from "./modals/PartnerDetails";
import {
  TableBody,
  TableCell,
  TableRow,
  Table,
  TableHeader,
  TableHead,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { showErrorToast } from "@/utils/toasters";
import { HistoryProps, Partners } from "@/app/Dashboard/cms/legal/page";
import { PartnerCategory } from "@/app/Dashboard/cms/legal/page";
import { fetchPartnersCategories } from "@/services/infopolicies";

type PartnerProps = {
  content: PartnerCategory[];
  onContentChange: (value: PartnerCategory[]) => void;
  onDeletePartner?: (categoryId: number, partnerId: number) => void;
  showAddPartnersModal: boolean;
  setShowAddPartnersModal: (show: boolean) => void;
  historyDetails: HistoryProps[];
  getHistory?: () => Promise<void>;
  editingPartner: Partners | null;
  setEditingPartner: (partner: Partners | null) => void;
};

const Partner = ({
  content,
  onContentChange,
  onDeletePartner,
  showAddPartnersModal,
  setShowAddPartnersModal,
  historyDetails,
  getHistory,
  editingPartner,
  setEditingPartner,
}: PartnerProps) => {
  const [categorys, setCategories] = useState<PartnerCategory[]>([]);

  const [loadingSave, setLoadingSave] = useState(false);

  const [isOpenOptions, setIsOpenOptions] = useState(-1);
  const [showPartnerDetails, setShowPartnerDetails] = useState(true);

  const [selectedPartner, setSelectedPartner] = useState<Partners | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const optionsRef = useRef<HTMLDivElement | null>(null);

  const handleViewDetails = (partner: Partners) => {
    setSelectedPartner(partner);
    setShowPartnerDetails(true);
  };
  const toggleOptions = (index: number) => {
    setIsOpenOptions(isOpenOptions === index ? -1 : index);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        optionsRef.current &&
        !optionsRef.current.contains(event.target as Node)
      ) {
        setIsOpenOptions(-1);
      }
    };
    if (isOpenOptions !== -1) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpenOptions]);
  const createpartner = async (newPartner: Partners) => {
    if (!newPartner.name || !newPartner.category || !newPartner.logo) {
      showErrorToast({ message: "Please fill in all required fields." });
      return;
    }
    try {
      setLoadingSave(true);
      const formData = new FormData();
      formData.append("name", newPartner.name);
      formData.append("description", newPartner.description);
      formData.append("category", newPartner.category.toString());
      formData.append("is_active", newPartner.is_active ? "true" : "false");

      if (newPartner.logo instanceof File) {
        formData.append("logo", newPartner.logo);
      }

      const response = await axios.post(
        `${env.api.admin}/partners/`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const updatedContent = [...content];
      const catIndex = updatedContent.findIndex(
        (cat) => cat.id === response.data.category
      );
      if (catIndex !== -1) {
        updatedContent[catIndex].partners.push(response.data);
        onContentChange(updatedContent);
      }
      setShowAddPartnersModal(false);
      await getHistory?.();
    } catch (error: unknown) {
      const errorMessage =
        typeof error === "object" && error !== null && "message" in error
          ? String((error as { message?: string }).message)
          : "Unknown error";
      console.log(
        "Create partner error:",
        error,
        errorMessage
      );
    } finally {
      setLoadingSave(false);
    }
  };

  const updatePartner = async (updated: Partners) => {
    try {
      setLoadingSave(true);

      const formData = new FormData();
      formData.append("name", updated.name);
      formData.append("description", updated.description);
      formData.append("category", updated.category.toString());
      formData.append("is_active", updated.is_active ? "true" : "false");

      if (updated.logo instanceof File) {
        formData.append("logo", updated.logo);
      }

      const response = await axios.patch(
        `${env.api.admin}/partners/${updated.id}/`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const updatedContent = [...content];
      const catIndex = updatedContent.findIndex(
        (cat) => cat.id === updated.category
      );
      if (catIndex !== -1) {
        const partnerIndex = updatedContent[catIndex].partners.findIndex(
          (p) => p.id === updated.id
        );
        if (partnerIndex !== -1) {
          updatedContent[catIndex].partners[partnerIndex] = response.data;
          onContentChange(updatedContent);
        }
      }

      setShowAddPartnersModal(false);
      setEditingPartner(null);
      await getHistory?.();
    } catch (err) {
      console.error("Update failed:", err);
    } finally {
      setLoadingSave(false);
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetchPartnersCategories();
        setCategories(Array.isArray(res.data.results) ? res.data.results : []);
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    };
    fetchCategories();
  }, []);

  const noPartners = content.every((cat) => cat.partners.length === 0);
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

  const formatSnakeToTitle = (value: string): string => {
    return value
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const filteredContent = selectedCategory
    ? content.filter((cat) => cat.id === selectedCategory)
    : content;
  let serial = 1;
  return (
    <div className="space-y-6">
      {showPartnerDetails && selectedPartner && (
        <PartnerDetails
          historyDetails={historyDetails}
          showPartnerDetails={showPartnerDetails}
          setShowPartnerDetails={setShowPartnerDetails}
          partner={selectedPartner}
          category={categorys}
          formatSnakeToTitle={formatSnakeToTitle}
        />
      )}
      <div>
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-[150px] p-2 cursor-pointer rounded-[8px] space-x-4  border-[#9b9ea4] border-[1px] flex justify-between items-center bg-transparent">
                <span>
                  {selectedCategory
                    ? formatSnakeToTitle(
                        categorys.find((cat) => cat.id === selectedCategory)
                          ?.name || ""
                      )
                    : "All Categories"}
                </span>
                <img
                  src="/assets/icons/arrow-down.svg"
                  alt=""
                  className="w-3 h-3 ml-auto"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[var(--radix-popper-anchor-width)] min-w-[var(--radix-popper-anchor-width)]">
              <DropdownMenuItem
                onClick={() => setSelectedCategory(null)}
                className="w-full text-center px-4 py-2 hover:bg-gray-200 cursor-pointer"
              >
                All Categories
              </DropdownMenuItem>
              {Array.isArray(categorys) &&
                categorys?.map((cat) => (
                  <DropdownMenuItem
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className="w-[150px] text-center px-4 py-2 hover:bg-gray-200 cursor-pointer"
                  >
                    {formatSnakeToTitle(cat.name)}
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Table className="w-full z-[9999] mb-28">
        <TableHeader className="bg-gray-100">
          <TableRow>
            <TableHead className="font-semibold">Serial No</TableHead>
            <TableHead className="font-semibold">Logo</TableHead>
            <TableHead className="font-semibold">Name</TableHead>
            <TableHead className="font-semibold">Date</TableHead>
            <TableHead className="font-semibold">Category</TableHead>
            <TableHead className="font-semibold">Uploaded By</TableHead>
            <TableHead className="font-semibold">Role</TableHead>
            <TableHead className="font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {noPartners ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-4">
                <div className="flex flex-col items-center justify-end ml-auto gap-5">
                  <p className="text-[16px] lg:text-[18px] font-[400] text-[#181818] leading-[30px]">
                    No content added yet.
                  </p>
                  <button
                    onClick={() => {
                      setEditingPartner(null);
                      setShowAddPartnersModal(true);
                    }}
                    className="bg-[#023E8A] text-white px-4 py-2 rounded-md hover:bg-blue-800 cursor-pointer"
                  >
                    Add Partner
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            filteredContent.flatMap((cat) =>
              cat.partners.map((partner) => {
                const matched = historyDetails.find(
                  (item) =>
                    item.content_type === "partner" &&
                    item.action === "create" &&
                    item.object_id === partner.id
                );

                const latestPartnerHistory = historyDetails.reduce<HistoryProps | null>(
                  (latest, item) => {
                    if (
                      item.content_type !== "partner" ||
                      item.object_id !== partner.id
                    ) {
                      return latest;
                    }

                    if (!latest) return item;

                    return new Date(item.timestamp).getTime() >
                      new Date(latest.timestamp).getTime()
                      ? item
                      : latest;
                  },
                  null
                );

                const partnerTimestamp =
                  partner.last_updated ||
                  partner.updated_at ||
                  partner.created_at ||
                  latestPartnerHistory?.timestamp;

                return (
                  <TableRow key={`${cat.id}-${partner.id}`}>
                    <TableCell>{serial++}</TableCell>

                    <TableCell>
                      {typeof partner.logo === "string" ? (
                        <img
                          src={partner.logo}
                          alt={partner.name}
                          className="h-10 w-10 object-contain"
                        />
                      ) : (
                        "No Logo"
                      )}
                    </TableCell>
                    <TableCell>{partner.name}</TableCell>
                    <TableCell>{formatDate(partnerTimestamp)}</TableCell>
                    <TableCell>{formatSnakeToTitle(cat.name)}</TableCell>
                    <TableCell>{matched?.admin_full_name}</TableCell>
                    <TableCell>{matched?.admin_role}</TableCell>
                    <TableCell className="relative cursor-pointer">
                      <MoreVertical
                        onClick={() => toggleOptions(partner.id)}
                        width={12}
                        height={12}
                      />
                      {isOpenOptions === partner.id && (
                        <div
                          ref={optionsRef}
                          className={`rounded-lg w-[120px] bg-white border-[1px] border-white h-fit absolute top-10 right-10 z-[99999] shadow-lg`}
                        >
                          <p
                            onClick={() => {
                              handleViewDetails(partner);
                              setIsOpenOptions(-1);
                            }}
                            className="border-b-[1px] border-gray-300 p-2 cursor-pointer"
                          >
                            View
                          </p>
                          <p
                            onClick={() => {
                              setEditingPartner(partner);
                              setShowAddPartnersModal(true);
                              setIsOpenOptions(-1);
                            }}
                            className="border-b-[1px] p-2 cursor-pointer"
                          >
                            Edit
                          </p>
                          <p
                            onClick={() => {
                              onDeletePartner?.(cat.id, partner.id);
                              setIsOpenOptions(-1);
                            }}
                            className="p-2 cursor-pointer"
                          >
                            Delete
                          </p>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )
          )}
        </TableBody>
      </Table>

      {(showAddPartnersModal || editingPartner) && (
        <PartnerForm
          onSubmit={createpartner}
          onUpdatePartner={updatePartner}
          categories={categorys}
          showAddPartnersModal={showAddPartnersModal}
          setShowAddPartnersModal={setShowAddPartnersModal}
          loadingSave={loadingSave}
          editingPartner={editingPartner}
        />
      )}
    </div>
  );
};

export default Partner;
