import env from "@/config/env";
import instance from "@/hooks/initializers/useAxiosDefaults";

// Admin API for the Flights home sections (backend /api/v2/admin/flights/…):
// popular routes per country, promo cards, and the "from" prices.

export type PopularRoute = {
  id: number;
  country_code: string;
  origin_code: string;
  destination_code: string;
  position: number;
  is_active: boolean;
};

export type Campaign = {
  id: number;
  label: string;
  headline: string;
  body: string;
  cta_label: string;
  route_origin: string;
  route_destination: string;
  country_code: string;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
};

export type RouteFare = {
  origin_code: string;
  destination_code: string;
  cabin: string;
  amount: string;
  currency: string;
  departure_date: string;
  searched_at: string;
};

const list = <T,>(data: T[] | { results: T[] }) => (Array.isArray(data) ? data : data?.results ?? []);

class Service {
  async listRoutes() {
    const res = await instance.get<PopularRoute[] | { results: PopularRoute[] }>(env.api.flightsPopularRoutes);
    return list(res.data);
  }
  createRoute(payload: Omit<PopularRoute, "id">) {
    return instance.post<PopularRoute>(env.api.flightsPopularRoutes, payload);
  }
  updateRoute(id: number, payload: Partial<PopularRoute>) {
    return instance.patch<PopularRoute>(`${env.api.flightsPopularRoutes}/${id}`, payload);
  }
  deleteRoute(id: number) {
    return instance.delete(`${env.api.flightsPopularRoutes}/${id}`);
  }
  async listCampaigns() {
    const res = await instance.get<Campaign[] | { results: Campaign[] }>(env.api.flightsCampaigns);
    return list(res.data);
  }
  createCampaign(payload: Omit<Campaign, "id">) {
    return instance.post<Campaign>(env.api.flightsCampaigns, payload);
  }
  updateCampaign(id: number, payload: Partial<Campaign>) {
    return instance.patch<Campaign>(`${env.api.flightsCampaigns}/${id}`, payload);
  }
  deleteCampaign(id: number) {
    return instance.delete(`${env.api.flightsCampaigns}/${id}`);
  }
  async listFares() {
    const res = await instance.get<RouteFare[] | { results: RouteFare[] }>(env.api.flightsRouteFares);
    return list(res.data);
  }
  refreshFares() {
    return instance.post<{ searches: number }>(`${env.api.flightsRouteFares}/refresh`, {}, { timeout: 180000 });
  }
}

const FlightsHomeService = new Service();
export default FlightsHomeService;
