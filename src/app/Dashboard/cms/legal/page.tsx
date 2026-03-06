"use client";
import React, { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import About from "@/components/molecues/legal/About";
import Privacy from "@/components/molecues/legal/Privacy";
import Terms from "@/components/molecues/legal/Terms";
import Partner from "@/components/molecues/legal/Partner";
import Button from "@/components/reuseables/Button";
import SuccessModal from "@/components/ui/LegalSuccessModal";
import Link from "next/link";
import Loading from "../../admin/loading";
import { showErrorToast, showSuccessToast } from "@/utils/toasters";
import HistoryModal from "@/components/molecues/legal/modals/HistoryModal";
import {
  fetchAllContents,
  addAbout,
  updateAbout,
  addPrivacy,
  updatePrivacy,
  addTerms,
  updateTerms,
  deletePartner,
  fetchHistory,
} from "@/services/infopolicies/index";

const page = () => {
  return (
    <div>
      <ContentTab />
    </div>
  );
};

export type AboutContent = {
  id: number;
  content: string;
  updated_at: string;
};
export type PrivacyPolicy = {
  id: number;
  content: string;
  last_updated: string;
};
export type TermsContent = {
  id: number;
  content: string;
  updated_at: string;
  last_updated: string;
};

export type Partners = {
  id: number;
  name: string;
  logo: string | File;
  description: string;
  website: string;
  category: number;
  is_active: boolean;
};

export type PartnerCategory = {
  id: number;
  name: string;
  description: string;
  partners: Partners[];
};

type ContentTypes = {
  about: AboutContent[];
  privacy: PrivacyPolicy[];
  terms: TermsContent[];
  partnerCategory: PartnerCategory[];
};
export type HistoryProps = {
  id: number;
  object_id: number;
  action: "create" | "update";
  admin_full_name: string;
  admin_role: string;
  content_type: "privacy_policy" | "about_us" | "terms_of_use" | "partner";
  timestamp: string;
};

const ContentTab = () => {
  const [editStates, setEditStates] = useState({
    about_us: false,
    privacy_policy: false,
    terms_of_use: false,
    partner: false,
  });

  type TabKey = keyof typeof editStates; // "about_us" | "privacy_policy" | "terms_of_use" | "partners"
  const [activeTab, setActiveTab] = useState<TabKey>("about_us");
  const isTabKey = (value: string): value is TabKey => value in editStates;
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingUpdate, setIsLoadingUpdate] = useState<boolean>(false);
  const [showAddPartnersModal, setShowAddPartnersModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyDetails, setHistoryDetails] = useState<HistoryProps[]>([]);
  const [editingPartner, setEditingPartner] = useState<Partners | null>(null);

  const [isLoadingAboutUpdate, setIsLoadingAboutUpdate] =
    useState<boolean>(false);
  const [isLoadingPrivacyUpdate, setIsLoadingPrivacyUpdate] =
    useState<boolean>(false);
  const [isLoadingTermsUpdate, setIsLoadingTermsUpdate] =
    useState<boolean>(false);

  const [error, setError] = useState<string | null>(null);

  const [contents, setContents] = useState<ContentTypes>({
    about: [],
    privacy: [],
    terms: [],
    partnerCategory: [],
  });

  const [contentIds, setContentIds] = useState({
    about: 0,
    privacy: null,
    terms: null,
    partners: null,
    partnerCategory: null,
  });

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { about, privacy, terms, partners, partnerCategories } =
        await fetchAllContents();

      const merged = partnerCategories.results.map((category: any) => ({
        ...category,
        partners: partners.results.filter(
          (partner: any) => partner.category === category.id
        ),
      }));

      setContents({
        about: [
          {
            id: about.id,
            content: about.content,
            updated_at: about.updated_at,
          },
        ],
        privacy: [
          {
            id: privacy.id,
            content: privacy.content,
            last_updated: privacy.last_updated,
          },
        ],
        terms: [
          {
            id: terms.id,
            content: terms.content,
            updated_at: terms.updated_at,
            last_updated: terms.updated_at,
          },
        ],
        partnerCategory: merged,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load content. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateAboutContent = async () => {
    setIsLoadingAboutUpdate(true);
    setError(null);
    try {
      if (!editStates.about_us) {
        await addAbout(contents.about[0].content);
        showSuccessToast({
          message: "About content added successfully!",
        });
      } else {
        updateAbout(
          contentIds.about,
          contents.about[0].content,
          contents.about[0].updated_at
        );
        setEditStates((prev) => ({ ...prev, about_us: false }));
        showSuccessToast({
          message: "About content updated successfully!",
        });
      }
    } catch (error: any) {
      console.error("Error updating about content:", error);
      showErrorToast({
        message:
          error?.response?.data?.detail ||
          "Failed to update about content. Please try again!",
      });
    } finally {
      setIsLoadingAboutUpdate(false);
    }
  };

  const updatePrivacyContent = async () => {
    setIsLoadingPrivacyUpdate(true);
    setError(null);
    try {
      if (!editStates.privacy_policy) {
        await addPrivacy(contents.privacy[0].content);
        showSuccessToast({
          message: "Privacy content added successfully!",
        });
      } else {
        updatePrivacy(
          contents.privacy[0].id,
          contents.privacy[0].content,
          contents.privacy[0].last_updated
        );

        setEditStates((prev) => ({ ...prev, privacy_policy: false }));
        showSuccessToast({
          message: "Privacy content updated successfully!",
        });
      }
    } catch (error: any) {
      console.error("Error updating privacy content:", error);
      showErrorToast({
        message:
          error?.response?.data?.detail ||
          "Failed to update privacy content. Please try again!",
      });
    } finally {
      setIsLoadingPrivacyUpdate(false);
    }
  };

  const updateTermsContent = async () => {
    setIsLoadingTermsUpdate(true);
    setError(null);
    try {
      if (!editStates.terms_of_use) {
        await addTerms(contents.terms[0].content);
        showSuccessToast({
          message: "Terms of use content added successfully!",
        });
      } else {
        updateTerms(
          contents.terms[0].id,
          contents.terms[0].content,
          contents.terms[0].updated_at
        ),
          setEditStates((prev) => ({ ...prev, terms_of_use: false }));
        showSuccessToast({
          message: "Terms of use content updated successfully!",
        });
      }
    } catch (error: any) {
      console.error("Error updating terms of use content:", error);
      showErrorToast({
        message:
          error?.response?.data?.detail ||
          "Failed to update terms of use content. Please try again!",
      });
    } finally {
      setIsLoadingTermsUpdate(false);
    }
  };

  const deletePartners = async (categoryId: number, partnerId: number) => {
    try {
      await deletePartner(partnerId);
      fetchData();
    } catch (error) {
      console.error("Error deleting partner:", error);
      setError("Failed to delete partner. Please try again.");
    }
  };

  const handleContentAboutChange = (
    section: keyof ContentTypes,
    value: AboutContent[] | string
  ) => {
    setContents((prev) => ({
      ...prev,
      [section]: value,
    }));
  };
  const handleContentPartnerChange = (
    section: keyof ContentTypes,
    value: PartnerCategory[]
  ) => {
    setContents((prev) => ({
      ...prev,
      [section]: value,
    }));
  };
  const handleContentTermsChange = (
    section: keyof ContentTypes,
    value: TermsContent[] | string
  ) => {
    setContents((prev) => ({
      ...prev,
      [section]: value,
    }));
  };
  const handleContentPrivacyChange = (
    section: keyof ContentTypes,
    value: PrivacyPolicy[] | string
  ) => {
    setContents((prev) => ({
      ...prev,
      [section]: value,
    }));
  };
  const handleCloseModal = () => {
    setShowSuccessModal(false);
  };

  const getHistory = async () => {
    try {
      const response = await fetchHistory();
      setHistoryDetails(response.data.results);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };
  useEffect(() => {
    getHistory();
  }, []);

  return (
    <div className="bg-[#fff] rounded-[8px] py-4 px-6 space-y-10">
      <div className="space-y-8">
        <HistoryModal
          activeTab={activeTab}
          historyDetails={historyDetails}
          showHistoryModal={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
        />
        <div className="flex lg:flex-row flex-col lg:items-center justify-normal lg:justify-between">
          <p className="font-[600] text-[14px] lg:text-[20px] text-[#181818] leading-[100%] ">
            Manage Information and Policies
          </p>
          <div className="flex lg:justify-end justify-normal items-center space-x-4 mt-5">
            <button
              className="cursor-pointer py-2 px-4 rounded-lg border-[1px] border-[#023E8A] font-[600] text-[16px] text-[#023E8A]"
              onClick={() => setShowHistoryModal(true)}
            >
              History
            </button>
            {activeTab !== "partner" ? (
              <button
                onClick={() => {
                  setEditStates((prev) => ({
                    ...prev,
                    [activeTab]: !prev[activeTab],
                  }));
                  if (editStates[activeTab]) fetchData();
                }}
                className="cursor-pointer py-2 px-4 rounded-lg bg-[#023E8A] font-[600] text-[16px] text-[#FFFFFF] hidden lg:block"
              >
                {editStates[activeTab] ? "Cancel" : "Edit"}
              </button>
            ) : (
              <button
                onClick={() => {
                  setEditingPartner(null);
                  setShowAddPartnersModal(true);
                }}
                className="bg-[#023E8A] text-white px-4 py-2 rounded-md hover:bg-blue-800 cursor-pointer"
              >
                Add Partner
              </button>
            )}
            {activeTab !== "partner" && (
              <img
                onClick={() => {
                  setEditStates((prev) => ({
                    ...prev,
                    [activeTab]: !prev[activeTab],
                  }));
                  if (editStates[activeTab]) fetchData();
                }}
                src="/assets/icons/mode_edit.svg"
                alt="Edit"
                className="cursor-pointer lg:hidden "
              />
            )}
          </div>
        </div>

        <Tabs
          className="w-full space-y-8"
          value={activeTab}
          onValueChange={(value: string) => {
            if (isTabKey(value)) setActiveTab(value);
          }}
        >
          <TabsList className="w-full bg-transparent border-[#CDCED1] border-b-[1px] pb-[6px] rounded-none">
            <TabsTrigger
              value="about_us"
              className="cursor-pointer p-2 bg-transparent shadow-transparent rounded-none border-b-[1px] border-transparent data-[state=active]:border-[#023E8A]"
            >
              About Us
            </TabsTrigger>
            <TabsTrigger
              value="privacy_policy"
              className="cursor-pointer p-2 bg-transparent shadow-transparent rounded-none border-b-[1px] border-transparent data-[state=active]:border-[#023E8A]"
            >
              Privacy <span className="hidden lg:block ">Policy</span>
            </TabsTrigger>
            <TabsTrigger
              value="terms_of_use"
              className="cursor-pointer p-2 bg-transparent shadow-transparent rounded-none border-b-[1px] border-transparent data-[state=active]:border-[#023E8A]"
            >
              Terms
            </TabsTrigger>
            <TabsTrigger
              value="partner"
              className="cursor-pointer p-2 bg-transparent shadow-transparent rounded-none border-b-[1px] border-transparent data-[state=active]:border-[#023E8A]"
            >
              <span className="hidden lg:block ">Our Trusted</span> Partners
            </TabsTrigger>
          </TabsList>
          {isLoading && <Loading />}

          {error && (
            <div className="text-center text-red-500">
              <p>{error}</p>
            </div>
          )}
          <TabsContent value="about_us">
            <About
              isEditing={editStates.about_us}
              content={contents.about}
              onContentChange={(value) =>
                handleContentAboutChange("about", value)
              }
              updateAboutContent={updateAboutContent}
              isLoadingAboutUpdate={isLoadingAboutUpdate}
              onCancel={() =>
                setEditStates((prev) => ({ ...prev, about_us: false }))
              }
              onEdit={() =>
                setEditStates((prev) => ({ ...prev, about_us: true }))
              }
            />
          </TabsContent>
          <TabsContent value="privacy_policy">
            <Privacy
              isEditing={editStates.privacy_policy}
              content={contents.privacy}
              onContentChange={(value) =>
                handleContentPrivacyChange("privacy", value)
              }
              updatePrivacyContent={updatePrivacyContent}
              isLoadingPrivacyUpdate={isLoadingPrivacyUpdate}
              onCancel={() =>
                setEditStates((prev) => ({ ...prev, privacy_policy: false }))
              }
              onEdit={() =>
                setEditStates((prev) => ({ ...prev, privacy_policy: true }))
              }
            />
          </TabsContent>
          <TabsContent value="terms_of_use">
            <Terms
              isEditing={editStates.terms_of_use}
              content={contents.terms}
              onContentChange={(value) =>
                handleContentTermsChange("terms", value)
              }
              updateTermsContent={updateTermsContent}
              isLoadingTermsUpdate={isLoadingTermsUpdate}
              onEdit={() =>
                setEditStates((prev) => ({ ...prev, terms_of_use: true }))
              }
              onCancel={() =>
                setEditStates((prev) => ({ ...prev, terms_of_use: false }))
              }
            />
          </TabsContent>
          <TabsContent value="partner">
            <Partner
              content={contents.partnerCategory}
              onContentChange={(value) =>
                handleContentPartnerChange("partnerCategory", value)
              }
              onDeletePartner={(partnerId, categoryId) =>
                deletePartners(partnerId, categoryId)
              }
              showAddPartnersModal={showAddPartnersModal}
              setShowAddPartnersModal={setShowAddPartnersModal}
              historyDetails={historyDetails}
              getHistory={getHistory}
              editingPartner={editingPartner}
              setEditingPartner={setEditingPartner}
            />
          </TabsContent>
        </Tabs>
      </div>

      {editStates[activeTab] && (
        <div className="flex items-center justify-center relative">
          {isLoadingUpdate && (
            <svg
              className="animate-spin -ml-1 mr-48  h-4 w-4 text-white absolute "
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="#ffffff"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          )}
        </div>
      )}
      {!editStates[activeTab] && (
        <Link href="/Dashboard/cms">
          <Button full variant="success" title="GO TO BACK TO SERVICES" />
        </Link>
      )}
      <div className="bg-[#fff] p-[40px] rounded-[20px]">
        <SuccessModal isOpen={showSuccessModal} onClose={handleCloseModal} />
      </div>
    </div>
  );
};

export default page;
