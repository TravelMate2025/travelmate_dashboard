import { useCallback, useEffect, useState } from "react";
import PricingService, { MarkupRule, SellingCurrency } from "@/services/pricing";

/** A readable message from an API error (DRF field errors, detail, 403). */
export function pricingErrorMessage(error: unknown): string {
  const response = (error as { response?: { status?: number; data?: unknown } })?.response;
  if (response?.status === 403) {
    return "Only super admins, finance and content managers can change pricing.";
  }
  const data = response?.data;
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    if (typeof record.detail === "string") return record.detail;
    const first = Object.entries(record)[0];
    if (first) {
      const [field, value] = first;
      const text = Array.isArray(value) ? value.join(" ") : String(value);
      return `${field.replace(/_/g, " ")}: ${text}`;
    }
  }
  return "Something went wrong. Please try again.";
}

export function useMarkupRules(product: "flights" | "transfers") {
  const [loading, setLoading] = useState(false);
  const [rules, setRules] = useState<MarkupRule[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await PricingService.listRules(product);
      const data = res.data;
      setRules(Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : []);
    } catch (e) {
      setError(pricingErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [product]);

  useEffect(() => {
    load();
  }, [load]);

  return { loading, rules, error, refresh: load };
}

export function useCurrencies() {
  const [loading, setLoading] = useState(false);
  const [currencies, setCurrencies] = useState<SellingCurrency[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await PricingService.listCurrencies();
      setCurrencies(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError(pricingErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { loading, currencies, error, refresh: load };
}
