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
