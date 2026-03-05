export type BookingCancellationProcessPayload = {
  note: string;
  override_policy: boolean;
};

export type BookingCancellationRequestPayload = {
  reason: string;
  admin_remark?: string;
};

export type BookingListItem = {
  id?: string | number;
  reference?: string;
  booking_reference?: string;
  booking_type?: string;
  booking_status?: string;
  payment_status?: string;
  total_amount?: string | number;
  created_at?: string;
  customer_details?: {
    name?: string;
    surname?: string;
  };
  [key: string]: unknown;
};

export type BookingListPage = {
  results: BookingListItem[];
  next?: string | null;
  previous?: string | null;
  count?: number;
  [key: string]: unknown;
};

export type BookingListApiResponse = {
  results: BookingListPage;
  [key: string]: unknown;
};

export type BookingDetailResponse = {
  id?: string | number;
  booking_type?: string;
  booking_status?: string;
  cancellation_id?: string;
  cancellation_status?: string;
  cancellation_reason?: string;
  cancellation_note?: string;
  cancellation_requested_at?: string;
  created_at?: string;
  updated_at?: string;
  result?: Record<string, unknown>;
  [key: string]: unknown;
};

export type BookingCancellationApiResponse = {
  message?: string;
  description?: string;
  status?: string;
  cancellation_id?: string;
  booking_type?: string;
  cancellation_request?: {
    id?: string | number;
    status?: string;
    created_at?: string;
    admin_remark?: string;
    refund_amount?: string;
    [key: string]: unknown;
  };
};

export type BookingCancellationErrorResponse = {
  message?: string;
  description?: string;
  detail?: string;
};
