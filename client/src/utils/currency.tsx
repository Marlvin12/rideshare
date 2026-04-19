import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mmkvStorage } from "@/store/storage";

export interface CurrencyConfig {
  code: string;
  symbol: string;
  locale: string;
  symbolPosition: "prefix" | "suffix";
  decimalSeparator: string;
  thousandsSeparator: string;
  decimalPlaces: number;
}

const DEFAULT_CURRENCY: CurrencyConfig = {
  code: "USD",
  symbol: "$",
  locale: "en-US",
  symbolPosition: "prefix",
  decimalSeparator: ".",
  thousandsSeparator: ",",
  decimalPlaces: 2,
};

const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  USD: {
    code: "USD",
    symbol: "$",
    locale: "en-US",
    symbolPosition: "prefix",
    decimalSeparator: ".",
    thousandsSeparator: ",",
    decimalPlaces: 2,
  },
  EUR: {
    code: "EUR",
    symbol: "\u20AC",
    locale: "de-DE",
    symbolPosition: "suffix",
    decimalSeparator: ",",
    thousandsSeparator: ".",
    decimalPlaces: 2,
  },
  GBP: {
    code: "GBP",
    symbol: "\u00A3",
    locale: "en-GB",
    symbolPosition: "prefix",
    decimalSeparator: ".",
    thousandsSeparator: ",",
    decimalPlaces: 2,
  },
  ZWL: {
    code: "ZWL",
    symbol: "ZWL",
    locale: "en-ZW",
    symbolPosition: "prefix",
    decimalSeparator: ".",
    thousandsSeparator: ",",
    decimalPlaces: 2,
  },
  KES: {
    code: "KES",
    symbol: "KSh",
    locale: "en-KE",
    symbolPosition: "prefix",
    decimalSeparator: ".",
    thousandsSeparator: ",",
    decimalPlaces: 2,
  },
  INR: {
    code: "INR",
    symbol: "\u20B9",
    locale: "en-IN",
    symbolPosition: "prefix",
    decimalSeparator: ".",
    thousandsSeparator: ",",
    decimalPlaces: 2,
  },
  ZAR: {
    code: "ZAR",
    symbol: "R",
    locale: "en-ZA",
    symbolPosition: "prefix",
    decimalSeparator: ".",
    thousandsSeparator: ",",
    decimalPlaces: 2,
  },
};

interface CurrencyStoreProps {
  currency: CurrencyConfig;
  setCurrency: (code: string) => void;
}

export const useCurrencyStore = create<CurrencyStoreProps>()(
  persist(
    (set) => ({
      currency: DEFAULT_CURRENCY,
      setCurrency: (code: string) => {
        const config = SUPPORTED_CURRENCIES[code];
        if (config) {
          set({ currency: config });
        }
      },
    }),
    {
      name: "currency-store",
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);

export const formatCurrency = (
  amount: number,
  config?: CurrencyConfig
): string => {
  const c = config ?? useCurrencyStore.getState().currency;

  const formatted = amount.toFixed(c.decimalPlaces);
  const [intPart, decPart] = formatted.split(".");

  const withThousands = intPart.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    c.thousandsSeparator
  );

  const number = decPart
    ? `${withThousands}${c.decimalSeparator}${decPart}`
    : withThousands;

  return c.symbolPosition === "prefix"
    ? `${c.symbol}${number}`
    : `${number} ${c.symbol}`;
};

export const getSupportedCurrencies = (): CurrencyConfig[] =>
  Object.values(SUPPORTED_CURRENCIES);

export const getCurrencyByCode = (code: string): CurrencyConfig | undefined =>
  SUPPORTED_CURRENCIES[code];
