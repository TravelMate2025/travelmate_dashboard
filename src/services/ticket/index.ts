import env from "@/config/env";
import instance from "@/hooks/initializers/useAxiosDefaults";

const buildQueryString = (
  filters: Record<string, string | number | boolean | null | undefined>
) => {
  const queryEntries = Object.entries(filters).reduce<Array<[string, string]>>(
    (acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        acc.push([key, String(value)]);
      }
      return acc;
    },
    []
  );

  return new URLSearchParams(queryEntries).toString();
};

type TEscalateTicket = {
  escalation_role: number;
  escalation_reason: string;
  escalation_note: string;
  escalation_response_time: string;
};
type TResolveTicket = {
  title?: string;
  category?: string;
  description?: string;
  status?: string;
  escalation_reason?: string;
  escalation_response_time?: string;
  escalation_note?: string;
};

class Service {
  // TicketService with filter and search
  getTickets({
    url,
    filters,
  }: {
    url?: string;
    filters?: Record<string, string | number | boolean | null | undefined>;
  }) {
    const endpoint = url || env.api.ticket;
    const queryString = buildQueryString(filters ?? {});
    const fullUrl = queryString ? `${endpoint}?${queryString}` : endpoint;
    return instance.get(fullUrl);
  }

  getTicketsStats = ({
    days,
    weeks,
    months,
    years,
  }: {
    days?: number;
    weeks?: number;
    months?: number;
    years?: number;
  }) => {
    const endpoint = `${env.api.ticket}all_stats/`;
    const queryString = buildQueryString({ days, weeks, months, years });
    return instance.get(queryString ? `${endpoint}?${queryString}` : endpoint);
  };

  getTicket({ TicketId }: { TicketId?: string }) {
    return instance.get(env.api.ticket + TicketId + "/");
  }

  claimTicket({ TicketId }: { TicketId?: string }) {
    return instance.post(env.api.ticket + TicketId + "/claim/");
  }

  escalateTicket({
    TicketId,
    payload,
  }: {
    TicketId: string;
    payload: TEscalateTicket;
  }) {
    return instance.post(env.api.ticket + TicketId + "/escalate/", payload);
  }

  getTicketMessages({
    ticketPk,
    admin = true,
    page,
  }: {
    ticketPk: string | number;
    admin?: boolean;
    page?: number;
  }) {
    const endpoint = admin
      ? `${env.api.ticket}${ticketPk}/messages/`
      : `${env.api.ticket.replace("/admin/tickets/", "/tickets/")}${ticketPk}/messages/`;
    const queryString = buildQueryString({ page });
    return instance.get(queryString ? `${endpoint}?${queryString}` : endpoint);
  }

  createTicketMessage({
    ticketPk,
    payload,
    admin = true,
  }: {
    ticketPk: string | number;
    payload: { content: string; attachment?: string | null };
    admin?: boolean;
  }) {
    const endpoint = admin
      ? `${env.api.ticket}${ticketPk}/messages/`
      : `${env.api.ticket.replace("/admin/tickets/", "/tickets/")}${ticketPk}/messages/`;
    return instance.post(endpoint, payload);
  }

  resolveTicket(TicketId: string) {
    return instance.post(`${env.api.ticket}${TicketId}/resolve/`, {});
  }

  resolveTicketWithPayload(
    TicketId: string,
    payload?: TResolveTicket
  ) {
    return instance.post(`${env.api.ticket}${TicketId}/resolve/`, payload || {});
  }

  getEscalatedTickets({
    url,
    filters,
  }: {
    url?: string;
    filters?: Record<string, string | number | boolean | null | undefined>;
  }) {
    const endpoint = url || `${env.api.ticket}escalated/`;
    const queryEntries = Object.entries(filters ?? {}).reduce<
      Array<[string, string]>
    >((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc.push([key, String(value)]);
      }
      return acc;
    }, []);
    const queryString = new URLSearchParams(queryEntries).toString();
    const fullUrl = queryString ? `${endpoint}?${queryString}` : endpoint;
    return instance.get(fullUrl);
  }

  deleteTicket({ TicketId }: { TicketId: string }) {
    return instance.delete(`${env.api.ticket}${TicketId}/`);
  }
}

const TicketService = new Service();
export default TicketService;
