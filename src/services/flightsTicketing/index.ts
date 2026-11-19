import env from "@/config/env";
import instance from "@/hooks/initializers/useAxiosDefaults";

// How flight orders reach the consolidator (backend /api/v2/admin/flights/ticketing-settings,
// flights_plan.md F4). One record; super admins only.

export type TicketingSettings = {
  consolidator_name: string;
  handoff_method: "queue" | "owner_transfer" | "ticketing_office";
  queue_number: string;
  queue_category: string;
  consolidator_office_id: string;
  form_of_payment: "none" | "ACCOUNT" | "CASH" | "NONREFUNDABLE";
  ticketing_agreement_option: "DELAY_TO_CANCEL" | "DELAY_TO_QUEUE" | "CONFIRM";
  ticketing_deadline_hours: number;
  payment_window_minutes: number;
  remark_templates: { general?: string };
  agency_contact: Record<string, unknown>;
  enabled_sources: string[];
  excluded_carriers: string[];
  updated_at: string;
  updated_by: string | null;
};

export type TicketingSettingsInput = Omit<TicketingSettings, "updated_at" | "updated_by">;

class Service {
  async get() {
    const res = await instance.get<TicketingSettings>(env.api.flightsTicketingSettings);
    return res.data;
  }
  async save(payload: TicketingSettingsInput) {
    const res = await instance.put<TicketingSettings>(env.api.flightsTicketingSettings, payload);
    return res.data;
  }
}

const FlightsTicketingService = new Service();
export default FlightsTicketingService;

// ---------------------------------------------------------------- ticketing queue (F6)

export type QueueRow = {
  id: string;
  legacy_id: number;
  reference: string;
  pnr: string;
  state: "PAID" | "TICKETING" | string;
  ticketing_status: string;
  customer: string;
  travelers: number;
  tickets: number;
  paid_at: string | null;
  amount: string;
  currency: string;
  handed_off_at: string | null;
  ticketing_deadline: string | null;
  last_ticketing_date: string | null;
  overdue: boolean;
  handoff_error: string | null;
  last_checked_at: string | null;
  paid_amount: string | null;
  paid_currency: string | null;
  ticketed_at: string | null;
  in_void_window: boolean;
  /** CANCELLATION_REQUESTED only (F8): what the customer asked for. */
  cancellation: { kind: "VOID" | "AIRLINE_REFUND" | string; reason: string; requested_at: string; estimate: string | null } | null;
  /** Flutterwave's fee on the payment, taken off every refund (customers bear it). */
  gateway_fee: string | null;
};

export type QueuePage = { count: number; next: string | null; previous: string | null; results: QueueRow[] };
export type ActionResult = { result: string; airline_order: unknown };
export type ConsolidatorQueueItem = { pnr: string; created_at: string | null; segments: string[]; travelers?: string[] };

export const TicketingQueueService = {
  async list(states: string, page: number) {
    const res = await instance.get<QueuePage>(env.api.flightsTicketingQueue, { params: { state: states, page } });
    return res.data;
  },
  async resync(id: string) {
    return (await instance.post<ActionResult>(`${env.api.flightsTicketingQueue}/${id}/resync`, {}, { timeout: 120000 })).data;
  },
  async handoff(id: string) {
    return (await instance.post<ActionResult>(`${env.api.flightsTicketingQueue}/${id}/handoff`, {}, { timeout: 120000 })).data;
  },
  async markTicketed(id: string, tickets: { travelerId: string; number: string }[]) {
    return (await instance.post<ActionResult>(`${env.api.flightsTicketingQueue}/${id}/mark-ticketed`, { tickets })).data;
  },
  /** F8: the consolidator voided or refunded the ticket; refund this amount (currency paid) and close the booking. */
  async confirmCancellation(id: string, amount: string) {
    return (await instance.post<ActionResult>(`${env.api.flightsTicketingQueue}/${id}/confirm-cancellation`, { amount }, { timeout: 120000 })).data;
  },
  /** A refund Flutterwave refused (e.g. "Insufficient Wallet Balance"): send it again. */
  async retryRefund(id: string) {
    return (await instance.post<ActionResult>(`${env.api.flightsTicketingQueue}/${id}/retry-refund`, {}, { timeout: 120000 })).data;
  },
  async consolidatorQueue() {
    return (await instance.get<ConsolidatorQueueItem[]>(env.api.flightsConsolidatorQueue, { timeout: 120000 })).data;
  },
};
