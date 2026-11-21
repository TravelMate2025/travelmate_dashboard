import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


/** An amount in its own currency ("₦802,469.90", "£290.30", "$381.90"); naira when the currency is unknown. */
export function formatMoney(amount: number | string | null | undefined, currency?: string | null): string {
  const value = typeof amount === "string" ? Number.parseFloat(amount) : amount ?? 0;
  const code = (currency || "NGN").toUpperCase();
  try {
    return new Intl.NumberFormat("en-NG", { style: "currency", currency: code, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
      Number.isFinite(value) ? value : 0,
    );
  } catch {
    return `${code} ${(Number.isFinite(value) ? value : 0).toFixed(2)}`;
  }
}
