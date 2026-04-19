import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mmkvStorage } from "./storage";

export type ThemeMode = "light" | "dark" | "system";

export interface ThemeColors {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  divider: string;
  accent: string;
  error: string;
  warning: string;
  info: string;
  success: string;
  promo: string;
  notification: string;
}

const lightTheme: ThemeColors = {
  background: "#FFFFFF",
  card: "#F9FAFB",
  text: "#1F2937",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
  divider: "#E5E7EB",
  accent: "#ac1d17",
  error: "#EF4444",
  warning: "#F59E0B",
  info: "#3B82F6",
  success: "#ac1d17",
  promo: "#EF4444",
  notification: "#3B82F6",
};

const darkTheme: ThemeColors = {
  background: "#000000",
  card: "#1C1C1E",
  text: "#FFFFFF",
  textSecondary: "#8E8E93",
  border: "#2C2C2E",
  divider: "#2C2C2E",
  accent: "#ac1d17",
  error: "#EF4444",
  warning: "#F59E0B",
  info: "#3B82F6",
  success: "#ac1d17",
  promo: "#EF4444",
  notification: "#3B82F6",
};

interface ThemeStoreProps {
  mode: ThemeMode;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const getThemeColors = (mode: ThemeMode): ThemeColors => {
  if (mode === "dark") return darkTheme;
  if (mode === "light") return lightTheme;
  return lightTheme;
};

export const useThemeStore = create<ThemeStoreProps>()(
  persist(
    (set) => ({
      mode: "light",
      colors: lightTheme,
      setMode: (mode) => {
        const colors = getThemeColors(mode);
        set({ mode, colors });
      },
      toggleMode: () => {
        set((state) => {
          const newMode = state.mode === "light" ? "dark" : "light";
          const colors = getThemeColors(newMode);
          return { mode: newMode, colors };
        });
      },
    }),
    {
      name: "theme-store",
      version: 2,
      storage: createJSONStorage(() => mmkvStorage),
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          return { ...persistedState, mode: "light", colors: lightTheme };
        }
        if (version < 2 && persistedState?.mode) {
          const m = persistedState.mode === "dark" ? "dark" : "light";
          return {
            ...persistedState,
            mode: m,
            colors: m === "dark" ? darkTheme : lightTheme,
          };
        }
        return persistedState;
      },
    }
  )
);

