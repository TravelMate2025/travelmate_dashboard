import { useEffect, useState } from "react";
import axios from "axios";
import { showErrorToast, showSuccessToast } from "@/utils/toasters";
import FaqService from "@/services/faq";
import { FaqResponse } from "@/components/molecues/support/Faq";

export function useGetAllFaq({
  initalFetch = true,
  refresh = false,
  successCallback,
  errorCallback,
}: {
  initalFetch?: boolean;
  refresh?: boolean;
  successCallback?: (message: string) => void;
  errorCallback?: (props: { message?: string; description?: string }) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<FaqResponse | null>(null);

  const onGetAllFaq = async () => {
    setLoading(true);
    try {
      const res = await FaqService.getAllFaq();
      setData(res.data);
      successCallback?.("FAQs fetched successfully.");
    } catch {
      errorCallback?.({ message: "An error occur while fetching FAQs" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initalFetch || refresh) onGetAllFaq();
  }, [initalFetch, refresh]);

  return { loading, data, onGetAllFaq };
}

type AddFaqPayload = {
  category: number;
  question: string;
  answer: string;
  is_active: boolean;
};

export type UpdateFaqPayload = Partial<AddFaqPayload>;

export type AddFaqCategoryPayload = {
  name: "FLIGHTS" | "STAYS" | "CAR_RENTALS" | "ACCOUNT";
  description?: string;
  icon?: string;
  order?: number;
};

type FaqCategory = {
  id: number;
  name: string;
  name_display: string;
  description: string;
  icon: string;
  order: number;
  faqs: Array<unknown>;
};

type UseAddFaqReturn = {
  loading: boolean;
  onAddFaq: (params: {
    payload: AddFaqPayload;
    successCallback?: () => void;
  }) => Promise<void>;
  isSuccess: boolean;
};

export const useAddFaq = (): UseAddFaqReturn => {
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const onAddFaq = async ({
    payload,
    successCallback,
  }: {
    payload: AddFaqPayload;
    successCallback?: () => void;
  }) => {
    setLoading(true);
    setIsSuccess(false);
    try {
      const res = await FaqService.addFaq({ payload });
      const { message = "FAQ added successfully", description = "" } = res.data || {};

      showSuccessToast({ message, description });
      successCallback?.();
      setIsSuccess(true);
    } catch (error: unknown) {
      const fallbackMessage = "Unable to add FAQ at the moment!";
      const axiosError = axios.isAxiosError(error) ? error : null;
      const errorData = axiosError?.response?.data as
        | { message?: string; detail?: string }
        | Record<string, string[] | string>
        | undefined;

      let description = "";
      if (errorData && typeof errorData === "object") {
        if ("detail" in errorData && typeof errorData.detail === "string") {
          description = errorData.detail;
        } else if ("message" in errorData && typeof errorData.message === "string") {
          description = errorData.message;
        } else {
          const firstEntry = Object.values(errorData)[0];
          if (Array.isArray(firstEntry)) {
            description = String(firstEntry[0] || "");
          } else if (typeof firstEntry === "string") {
            description = firstEntry;
          }
        }
      }

      showErrorToast({ message: fallbackMessage, description });
    } finally {
      setLoading(false);
    }
  };

  return { loading, onAddFaq, isSuccess };
};

type UseUpdateFaqReturn = {
  loading: boolean;
  onUpdateFaq: (params: {
    id: number;
    payload: UpdateFaqPayload;
    successCallback?: () => void;
  }) => Promise<void>;
};

export const useUpdateFaq = (): UseUpdateFaqReturn => {
  const [loading, setLoading] = useState(false);

  const onUpdateFaq = async ({
    id,
    payload,
    successCallback,
  }: {
    id: number;
    payload: UpdateFaqPayload;
    successCallback?: () => void;
  }) => {
    setLoading(true);
    try {
      const res = await FaqService.patchFaq({ id, payload });
      const { message = "FAQ updated successfully", description = "" } = res.data || {};

      showSuccessToast({ message, description });
      successCallback?.();
    } catch (error: unknown) {
      const axiosError = axios.isAxiosError(error) ? error : null;
      const errorData = axiosError?.response?.data as
        | { message?: string; detail?: string }
        | Record<string, string[] | string>
        | undefined;

      let description = "";
      if (errorData && typeof errorData === "object") {
        if ("detail" in errorData && typeof errorData.detail === "string") {
          description = errorData.detail;
        } else if ("message" in errorData && typeof errorData.message === "string") {
          description = errorData.message;
        } else {
          const firstEntry = Object.values(errorData)[0];
          if (Array.isArray(firstEntry)) {
            description = String(firstEntry[0] || "");
          } else if (typeof firstEntry === "string") {
            description = firstEntry;
          }
        }
      }

      showErrorToast({
        message: "Unable to update FAQ at the moment",
        description,
      });
    } finally {
      setLoading(false);
    }
  };

  return { loading, onUpdateFaq };
};

export function useDeleteFaq() {
  const [isloading, setLoading] = useState(false);

  const onDeleteFaq = async ({
    id,
    successCallback,
  }: {
    id: number;
    successCallback?: () => void;
  }) => {
    setLoading(true);
    try {
      const res = await FaqService.deleteFaq({ id });
      const { message = "FAQ deleted successfully", description = "" } = res.data || {};

      showSuccessToast({ message, description });
      successCallback?.();
    } catch {
      showErrorToast({ message: "Unable to delete FAQ at the moment!" });
    } finally {
      setLoading(false);
    }
  };

  return { isloading, onDeleteFaq };
}

export function useAddFaqCategory() {
  const [loading, setLoading] = useState(false);

  const onAddFaqCategory = async ({
    payload,
  }: {
    payload: AddFaqCategoryPayload;
  }): Promise<FaqCategory | null> => {
    setLoading(true);
    try {
      const res = await FaqService.addFaqCategory({ payload });
      const createdCategory = res.data as FaqCategory;

      showSuccessToast({ message: "FAQ category added successfully" });
      return createdCategory;
    } catch (error: unknown) {
      const axiosError = axios.isAxiosError(error) ? error : null;
      const errorData = axiosError?.response?.data as
        | { message?: string; detail?: string }
        | Record<string, string[] | string>
        | undefined;

      let description = "";
      if (errorData && typeof errorData === "object") {
        if ("detail" in errorData && typeof errorData.detail === "string") {
          description = errorData.detail;
        } else if ("message" in errorData && typeof errorData.message === "string") {
          description = errorData.message;
        } else {
          const firstEntry = Object.values(errorData)[0];
          if (Array.isArray(firstEntry)) {
            description = String(firstEntry[0] || "");
          } else if (typeof firstEntry === "string") {
            description = firstEntry;
          }
        }
      }

      showErrorToast({
        message: "Unable to add FAQ category right now",
        description,
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { loading, onAddFaqCategory };
}

export type UpdateFaqCategoryPayload = Partial<AddFaqCategoryPayload>;

export function useUpdateFaqCategory() {
  const [loading, setLoading] = useState(false);

  const onUpdateFaqCategory = async ({
    id,
    payload,
    successCallback,
  }: {
    id: number;
    payload: UpdateFaqCategoryPayload;
    successCallback?: () => void;
  }) => {
    setLoading(true);
    try {
      await FaqService.updateFaqCategory({ id, payload });

      showSuccessToast({ message: "FAQ category updated successfully" });
      successCallback?.();
    } catch (error: unknown) {
      const axiosError = axios.isAxiosError(error) ? error : null;
      const errorData = axiosError?.response?.data as
        | { message?: string; detail?: string }
        | Record<string, string[] | string>
        | undefined;

      let description = "";
      if (errorData && typeof errorData === "object") {
        if ("detail" in errorData && typeof errorData.detail === "string") {
          description = errorData.detail;
        } else if ("message" in errorData && typeof errorData.message === "string") {
          description = errorData.message;
        } else {
          const firstEntry = Object.values(errorData)[0];
          if (Array.isArray(firstEntry)) {
            description = String(firstEntry[0] || "");
          } else if (typeof firstEntry === "string") {
            description = firstEntry;
          }
        }
      }

      showErrorToast({
        message: "Unable to update FAQ category right now",
        description,
      });
    } finally {
      setLoading(false);
    }
  };

  return { loading, onUpdateFaqCategory };
}

export function useDeleteFaqCategory() {
  const [loading, setLoading] = useState(false);

  const onDeleteFaqCategory = async ({
    id,
    successCallback,
  }: {
    id: number;
    successCallback?: () => void;
  }) => {
    setLoading(true);
    try {
      await FaqService.deleteFaqCategory({ id });

      showSuccessToast({ message: "FAQ category deleted successfully" });
      successCallback?.();
    } catch {
      showErrorToast({ message: "Unable to delete FAQ category at the moment!" });
    } finally {
      setLoading(false);
    }
  };

  return { loading, onDeleteFaqCategory };
}
