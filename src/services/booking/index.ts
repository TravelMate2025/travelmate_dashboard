import env from "@/config/env";
import instance from "@/hooks/initializers/useAxiosDefaults";
import {
  BookingDetailResponse,
  BookingListApiResponse,
  BookingListPage,
  BookingCancellationApiResponse,
  BookingCancellationRequestPayload,
  BookingCancellationProcessPayload,
} from "./types";

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

  getSingleBooking({ bookingRef }: { bookingRef?: string }) {
    return instance.get<BookingDetailResponse>(
      `${env.api.bookingAdminById}${bookingRef}/`
    );
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
    return instance.post<BookingCancellationApiResponse>(
      `${env.api.bookingAdminRequestCancellation}${bookingId}/`,
      payload,
      {
        params: bookingType ? { booking_type: bookingType } : undefined,
      }
    );
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
}
const BookingService = new Service();
export default BookingService;
