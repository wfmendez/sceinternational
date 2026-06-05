import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Combina clases de Tailwind resolviendo conflictos (patrón shadcn/ui). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formatea un monto como moneda. Por defecto USD; ajustable por presupuesto. */
export function formatMoney(amount: number, currency = "USD", locale = "es"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
}
