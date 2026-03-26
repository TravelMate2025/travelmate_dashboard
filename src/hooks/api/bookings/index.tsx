"use client"
import { useState, useEffect, useCallback } from "react";
import env from "@/config/env";
import instance from "@/hooks/initializers/useAxiosDefaults";
import BookingService from "@/services/booking";
import { showErrorToast, showSuccessToast } from "@/utils/toasters";
import axios from "axios";
import {
  BookingDetailResponse,
  BookingListApiResponse,
  BookingListItem,
  BookingCancellationErrorResponse,
  BookingCancellationRequestPayload,
  BookingCancellationProcessPayload,
} from "@/services/booking/types";

type BookingFilters = Record<string, string | number | boolean | null | undefined>;

const getErrorDetails = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; error?: string; description?: string }
      | string
      | undefined;

    const responseIsHtml =
      typeof data === "string" && /<html|<!doctype html/i.test(data);

    if (responseIsHtml) {
      const status = error.response?.status;
      return {
        message: `Cancellation request failed on server (${status || "500"}).`,
        description:
          "Backend returned an HTML error page. This indicates a server-side exception in request-cancellation.",
      };
    }

    return {
      message:
        (typeof data === "object" && data?.message) ||
        (typeof data === "object" && data?.error) ||
        error.message,
      description:
        (typeof data === "object" && data?.description) || error.message,
    };
  }

  const message = error instanceof Error ? error.message : "An unexpected error occurred.";
  return { message, description: message };
};

export const useGetAllBookings = (filters: BookingFilters = {}) => {
  const BASE_URL = env.api.bookingAdminList;

  const [data, setData] = useState<BookingListItem[]>([]);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [previousPageUrl, setPreviousPageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add default filter for "stays" if no booking_type is provided
  // Filter out undefined values to prevent sending empty params to API
  const cleanedFilters = Object.entries(filters).reduce<BookingFilters>((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      acc[key] = value;
    }
    return acc;
  }, {});

  const defaultFilters = {
    booking_type: "stays",
    ...cleanedFilters,
  };

  // Fetch function
  const fetchBookings = useCallback(
    async (url?: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await instance.get<BookingListApiResponse>(
          url || BASE_URL,
          url ? {} : { params: defaultFilters }
        );
        const pageData = response?.data?.results;
        setData(pageData?.results || []);
        setNextPageUrl((pageData?.next as string) || null);
        setPreviousPageUrl((pageData?.previous as string) || null);
      } catch (err: unknown) {
        setError(getErrorDetails(err).message);
      } finally {
        setLoading(false);
      }
    },
    [BASE_URL, JSON.stringify(defaultFilters)]
  );

  // Initial + refetch on filter change
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Pagination functions
  const loadNext = useCallback(() => {
    if (nextPageUrl) fetchBookings(nextPageUrl);
  }, [nextPageUrl, fetchBookings]);

  const loadPrevious = useCallback(() => {
    if (previousPageUrl) fetchBookings(previousPageUrl);
  }, [previousPageUrl, fetchBookings]);

  // Function to update filters
  const setFilters = useCallback((newFilters: BookingFilters) => {
    // This will be handled by the component re-calling the hook with new filters
    // The component should manage filter state and pass updated filters to this hook
  }, []);

  return {
    data,
    loading,
    error,
    setFilters,
    loadNext,
    loadPrevious,
    hasNext: Boolean(nextPageUrl),
    hasPrevious: Boolean(previousPageUrl),
  };
};

export function useGetBooking({
  bookingRef,
  bookingType,
  initalFetch = true,
  successCallback,
  errorCallback,
}: {
  bookingRef?: string;
  bookingType?: "flights" | "stays" | "transfers";
  initalFetch?: boolean;
  successCallback?: (message: string) => void;
  errorCallback?: (props: { message?: string; description?: string }) => void;
}) {
  const [loadingBooking, setLoading] = useState(false);
  const [booking, setData] = useState<BookingDetailResponse | null>(null);

  const fetchBooking = async () => {
    if (!bookingRef) return;
    setLoading(true);
    try {
      const res = await BookingService.getSingleBooking({ bookingRef, bookingType });
      setData(res.data);
      if (successCallback) successCallback("Booking fetched successfully.");
    } catch (error: unknown) {
      const details = getErrorDetails(error);
      if (errorCallback)
        errorCallback({
          message: "An error occurred while fetching the ticket",
          description: details.description,
        });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initalFetch) fetchBooking();
  }, [initalFetch, bookingRef, bookingType]);

  return { loadingBooking, booking };
}

export const useRequestBookingCancellation = () => {
  const [loading, setLoading] = useState(false);

  const requestCancellation = async ({
    bookingId,
    bookingType,
    reason,
    adminRemark,
    successCallback,
    errorCallback,
  }: {
    bookingId: string;
    bookingType?: "flights" | "stays" | "transfers";
    reason?: string;
    adminRemark?: string;
    successCallback?: (result: { cancellationRequestId?: string }) => void;
    errorCallback?: (props: { message?: string; description?: string }) => void;
  }) => {
    setLoading(true);
    try {
      const payload: BookingCancellationRequestPayload = {
        reason: (reason || "Cancellation requested by admin").trim(),
      };

      if (adminRemark?.trim()) {
        payload.admin_remark = adminRemark.trim();
      }

      const res = await BookingService.requestCancellation({
        bookingId,
        bookingType,
        payload,
      });
      const message =
        res?.data?.message || "Cancellation request submitted successfully";
      const responseData = res?.data as {
        cancellation_id?: string | number;
        cancellation_request?: { id?: string | number };
      };
      const cancellationRequestId =
        responseData?.cancellation_request?.id ?? responseData?.cancellation_id;

      showSuccessToast({ message });
      successCallback?.({
        cancellationRequestId:
          cancellationRequestId !== undefined && cancellationRequestId !== null
            ? String(cancellationRequestId)
            : undefined,
      });

      return {
        cancellationRequestId:
          cancellationRequestId !== undefined && cancellationRequestId !== null
            ? String(cancellationRequestId)
            : undefined,
      };
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const responseData = error.response?.data;
        const htmlError =
          typeof responseData === "string" &&
          /<html|<!doctype html/i.test(responseData);

        console.error("[BookingCancellationRequest] Request failed", {
          bookingId,
          bookingType,
          request: {
            method: error.config?.method,
            url: error.config?.url,
            params: error.config?.params,
            data: error.config?.data,
          },
          response: {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
          },
          diagnostics: {
            htmlError,
            responseContentType:
              error.response?.headers?.["content-type"] ||
              error.response?.headers?.["Content-Type"],
          },
        });
      }

      const details = getErrorDetails(error);
      const message = details.message || "Unable to submit cancellation request at the moment";

      showErrorToast({ message });
      errorCallback?.({
        message,
        description: details.description,
      });
    } finally {
      setLoading(false);
    }

    return { cancellationRequestId: undefined };
  };

  return { requestCancellation, loading };
};

export const useProcessBookingCancellation = () => {
  const [loading, setLoading] = useState(false);

  const processCancellation = async ({
    id,
    payload,
    successCallback,
    errorCallback,
  }: {
    id: string;
    payload: BookingCancellationProcessPayload;
    successCallback?: () => void;
    errorCallback?: (props: { message?: string; description?: string }) => void;
  }) => {
    setLoading(true);
    try {
      const res = await BookingService.processCancellation({ id, payload });
      const message =
        res?.data?.message || "Cancellation processed successfully";

      showSuccessToast({ message });
      successCallback?.();
    } catch (error: unknown) {
      const maybeError = error as {
        response?: { data?: BookingCancellationErrorResponse };
        message?: string;
      };
      const message =
        maybeError?.response?.data?.message ||
        "Unable to process cancellation at the moment";

      showErrorToast({ message });
      errorCallback?.({
        message,
        description:
          maybeError?.response?.data?.description || maybeError?.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return { processCancellation, loading };
};
