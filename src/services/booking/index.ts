import env from "@/config/env";
import instance from "@/hooks/initializers/useAxiosDefaults";
import axios from "axios";
import {
  BookingDetailResponse,
  BookingListApiResponse,
  BookingListPage,
  BookingCancellationApiResponse,
  BookingCancellationRequestPayload,
  BookingCancellationProcessPayload,
} from "./types";

const isHtmlServerError = (error: unknown) => {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  const status = error.response?.status;
  const contentType =
    error.response?.headers?.["content-type"] ||
    error.response?.headers?.["Content-Type"];
  const responseData = error.response?.data;
  const htmlBody =
    typeof responseData === "string" && /<html|<!doctype html/i.test(responseData);

  return status === 500 && (htmlBody || /text\/html/i.test(contentType || ""));
};

class Service {
  getBookings({
    designId,
    page = 1,
    limit = 5,
    orderBy = "",
    sortOrder = "desc",
    cursor = "",
  }: {
    designId?: string;
    page?: number;
    limit?: number;
    orderBy?: string;
    sortOrder?: "asc" | "desc";
    cursor?: string;
  }) {
    const endpoint = designId
      ? `${env.api.bookingAdminById}${designId}/`
      : env.api.bookingAdminList;

    return instance.get<BookingListApiResponse | BookingDetailResponse>(endpoint, {
      params: {
        page,
        limit,
        sortOrder,
        orderBy,
        cursor,
      },
    });
  }

  getSingleBooking({
    bookingRef,
    bookingType,
  }: {
    bookingRef?: string;
    bookingType?: "flights" | "stays" | "transfers";
  }) {
    const endpoint = `${env.api.bookingAdminById}${bookingRef}/`;
    const bookingTypes: Array<"stays" | "flights" | "transfers"> = [
      "stays",
      "flights",
      "transfers",
    ];

    const requestByType = (type?: "stays" | "flights" | "transfers") =>
      instance.get<BookingDetailResponse>(endpoint, {
        params: type ? { booking_type: type } : undefined,
      });

    return requestByType(bookingType)
      .then((response) => response)
      .catch(async (error: unknown) => {
        if (
          !bookingType &&
          axios.isAxiosError(error) &&
          error.response?.status === 404
        ) {
          for (const fallbackType of bookingTypes) {
            try {
              const fallbackResponse = await requestByType(fallbackType);
              return fallbackResponse;
            } catch (fallbackError: unknown) {
              if (
                !axios.isAxiosError(fallbackError) ||
                fallbackError.response?.status !== 404
              ) {
                throw fallbackError;
              }
            }
          }
        }

        return Promise.reject(error);
      });
  }

  getAdminBookingsList(params?: Record<string, unknown>) {
    return instance.get<BookingListApiResponse>(env.api.bookingAdminList, {
      params,
    });
  }

  getAdminMyBookings(params?: Record<string, unknown>) {
    return instance.get<BookingListPage>(env.api.bookingAdminMyBookings, {
      params,
    });
  }

  getMyBookings(params?: Record<string, unknown>) {
    return instance.get<BookingListPage>(env.api.bookingMyList, { params });
  }

  getMyBookingById({ bookingId }: { bookingId: string }) {
    return instance.get<BookingDetailResponse>(
      `${env.api.bookingMyById}${bookingId}/`
    );
  }

  getMyBookingsAdvancedSearch(params?: Record<string, unknown>) {
    return instance.get<BookingListPage>(env.api.bookingMyAdvancedSearch, {
      params,
    });
  }

  getMyBookingByReference({ bookingReference }: { bookingReference: string }) {
    return instance.get<BookingDetailResponse>(
      `${env.api.bookingMySearchByReference}${bookingReference}/`
    );
  }

  getMyBookingSummary() {
    return instance.get(env.api.bookingMySummary);
  }

  requestCancellation({
    bookingId,
    bookingType,
    payload,
  }: {
    bookingId?: string;
    bookingType?: "flights" | "stays" | "transfers";
    payload: BookingCancellationRequestPayload;
  }) {
    const endpoint = `${env.api.bookingAdminRequestCancellation}${bookingId}/`;

    if (!bookingType) {
      return instance.post<BookingCancellationApiResponse>(endpoint, payload);
    }

    return instance
      .post<BookingCancellationApiResponse>(endpoint, payload, {
        params: { booking_type: bookingType },
      })
      .catch((error: unknown) => {
        // Fallback to backend auto-detection if typed lookup crashes upstream.
        if (isHtmlServerError(error)) {
          return instance.post<BookingCancellationApiResponse>(endpoint, payload);
        }

        return Promise.reject(error);
      });
  }

  processCancellation({
    id,
    payload,
  }: {
    id?: string;
    payload: BookingCancellationProcessPayload;
  }) {
    return instance.post<BookingCancellationApiResponse>(
      `${env.api.bookingAdminProcessCancellation}${id}/process-cancellation/`,
      payload
    );
  }

  cancelBooking({ bookingId }: { bookingId?: string }) {
    return this.requestCancellation({
      bookingId,
      payload: { reason: "Cancellation requested" },
    });
  }

  updateBooking({ bookingId, payload }: { bookingId?: string; payload?: Record<string, unknown> }) {
    return instance.post(
      env.api.bookings + "/" + bookingId + "/update_booking/",
      payload
    );
  }

  exportAsCSV(params?: Record<string, unknown>) {
    return instance.get(env.api.reportExport, {
      params: {
        ...params,
        format: "csv",
      },
      responseType: "blob",
    });
  }
}
const BookingService = new Service();
export default BookingService;
