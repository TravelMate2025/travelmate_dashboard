import env from "@/config/env";
import instance from "@/hooks/initializers/useAxiosDefaults";

// Admin pricing API (backend /api/v2/admin/pricing/…): markup rules,
// selling currencies with their latest exchange rate, and a price preview.

export type MarkupRule = {
  id: number;
  name: string;
  product: "flights" | "transfers";
  supplier: string;
  origin_country: string;
  destination_country: string;
  cabin: string;
  source: string;
  percent: string;
  fixed_usd: string;
  priority: number;
  is_active: boolean;
  specificity: number;
  created_at?: string;
  updated_at?: string;
};

export type MarkupRuleInput = Omit<MarkupRule, "id" | "specificity" | "created_at" | "updated_at">;

export type SellingCurrency = {
  code: string;
  name: string;
  symbol: string;
  is_active: boolean;
  rate_per_usd: string | null;
  fetched_at: string | null;
  is_stale: boolean;
};

export type PreviewInput = {
  amount: string;
  supplier_currency: string;
  product: "flights" | "transfers";
  origin_country?: string;
  destination_country?: string;
  cabin?: string;
  source?: string;
  supplier?: string;
};

export type PreviewRow = {
  customer_currency: string;
  customer_amount?: string;
  converted_amount?: string;
  markup_amount?: string;
  markup_label?: string;
  fell_back_to_usd?: boolean;
  error?: string;
};

class Service {
  listRules(product?: string) {
    return instance.get<MarkupRule[] | { results: MarkupRule[] }>(env.api.pricingMarkupRules, { params: product ? { product } : {} });
  }
  createRule(payload: MarkupRuleInput) {
    return instance.post<MarkupRule>(env.api.pricingMarkupRules, payload);
  }
  updateRule(id: number, payload: Partial<MarkupRuleInput>) {
    return instance.patch<MarkupRule>(`${env.api.pricingMarkupRules}/${id}`, payload);
  }
  deleteRule(id: number) {
    return instance.delete(`${env.api.pricingMarkupRules}/${id}`);
  }
  listCurrencies() {
    return instance.get<SellingCurrency[]>(env.api.pricingCurrencies);
  }
  updateCurrency(code: string, payload: { is_active: boolean }) {
    return instance.patch(`${env.api.pricingCurrencies}/${code}`, payload);
  }
  refreshRates() {
    return instance.post<Record<string, string>>(`${env.api.pricingCurrencies}/refresh`);
  }
  preview(payload: PreviewInput) {
    return instance.post<PreviewRow[]>(env.api.pricingPreview, payload);
  }
}

const PricingService = new Service();
export default PricingService;
