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
  refund_operations?: RefundOperations | null;
  [key: string]: unknown;
};

export type RefundOperations = {
  id?: string | null;
  status?: string | null;
  provider?: string | null;
  provider_status?: string | null;
  provider_refund_id?: string | null;
  expected_amount?: string | number | null;
  requested_amount?: string | number | null;
  settled_amount?: string | number | null;
  currency?: string | null;
  original_payment_amount?: string | number | null;
  retained_amount?: string | number | null;
  refund_percent?: number | null;
  payment_status?: string | null;
  policy_basis?: Record<string, unknown> | null;
  requested_at?: string | null;
  settled_at?: string | null;
  last_synced_at?: string | null;
  failure_reason?: string | null;
  stale?: boolean;
  operational_overdue?: boolean;
  amount_mismatch?: boolean;
  mismatch_details?: {
    expected_vs_requested?: boolean;
    requested_vs_settled?: boolean;
  };
  timeline?: Array<{
    status?: string;
    workflow_status?: string | null;
    action?: string | null;
    reason?: string | null;
    actor_user_id?: string | null;
    source?: string;
    provider_status?: string | null;
    occurred_at?: string | null;
  }>;
};

export type RefundAction = "initiate" | "approve" | "settle" | "reject";

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
    refund_amount?: string | number | null;
    processing_fee?: string | number | null;
    cancellation_fee?: string | number | null;
    payment_method?: string | null;
    transaction_id?: string | null;
    original_payment?: string | number | null;
    cancellation_policy?: unknown;
    [key: string]: unknown;
  };
};

export type BookingCancellationErrorResponse = {
  message?: string;
  description?: string;
  detail?: string;
};
