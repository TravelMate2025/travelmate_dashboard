import { useState, useEffect } from "react";
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
      if (successCallback) successCallback("FAQs fetched successfully.");
    } catch (error: unknown) {
      if (errorCallback) errorCallback({ message: "An error occur while fetching FAQs" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initalFetch || refresh) onGetAllFaq();
  }, [initalFetch, refresh]); // Include refresh as a dependency

  return { loading, data, onGetAllFaq };
}

type AddFaqPayload = {
  category: number;
  question: string;
  answer: string;
  is_active: boolean;
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
    setIsSuccess(false); // Reset success state before the API call
    try {
      console.log(payload);

      const res = await FaqService.addFaq({ payload });
      const { message = "🚀 FAQ added successfully", description = "" } =
        res.data || {};

      showSuccessToast({ message, description });

      try {
        successCallback?.();
      } catch (callbackError) {
        console.error("Error in successCallback:", callbackError);
      }

      setIsSuccess(true);
    } catch (error: unknown) {
      showErrorToast({
        message: "unable to add FAQ at the moment!",
      });
    } finally {
      setLoading(false);
    }
  };

  return { loading, onAddFaq, isSuccess };
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
      const { message = "🚀 FAQ deleted successfully", description = "" } =
        res.data || {};

      showSuccessToast({ message, description });
      if (successCallback) successCallback();
    } catch (error: unknown) {
      showErrorToast({
        message: "Unable to delete FAQ at the moment!",
      });
    } finally {
      setLoading(false);
    }
  };

  return { isloading, onDeleteFaq };
}


