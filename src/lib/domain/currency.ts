/**
 * Monedas soportadas. Cada presupuesto se denomina en una sola moneda.
 * Por ahora sin IVA/impuestos (muy probable en el futuro: ver MODELO-DOMINIO).
 */
export const CURRENCIES = {
  /** Dólares estadounidenses. */
  USD: "USD",
  /** Bolívares venezolanos. */
  VES: "VES",
} as const;

export type Currency = (typeof CURRENCIES)[keyof typeof CURRENCIES];

export const CURRENCY_LABELS: Record<Currency, string> = {
  USD: "Dólares (USD)",
  VES: "Bolívares (VES)",
};

/** Locale para formateo Intl por moneda. */
export const CURRENCY_LOCALES: Record<Currency, string> = {
  USD: "en-US",
  VES: "es-VE",
};

export const DEFAULT_CURRENCY: Currency = "USD";

export function isCurrency(value: string): value is Currency {
  return value === CURRENCIES.USD || value === CURRENCIES.VES;
}
