import { Dimensions, PixelRatio, Platform } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

export const scale = (size: number): number =>
  (SCREEN_WIDTH / BASE_WIDTH) * size;

export const verticalScale = (size: number): number =>
  (SCREEN_HEIGHT / BASE_HEIGHT) * size;

export const moderateScale = (size: number, factor: number = 0.5): number =>
  size + (scale(size) - size) * factor;

export const normalizeFont = (size: number): number => {
  const newSize = scale(size);
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

export const Typography = {
  displayLarge: { fontSize: normalizeFont(32), lineHeight: normalizeFont(40) },
  displayMedium: { fontSize: normalizeFont(28), lineHeight: normalizeFont(36) },
  displaySmall: { fontSize: normalizeFont(24), lineHeight: normalizeFont(32) },
  headlineLarge: { fontSize: normalizeFont(22), lineHeight: normalizeFont(28) },
  headlineMedium: { fontSize: normalizeFont(20), lineHeight: normalizeFont(26) },
  headlineSmall: { fontSize: normalizeFont(18), lineHeight: normalizeFont(24) },
  titleLarge: { fontSize: normalizeFont(16), lineHeight: normalizeFont(22) },
  titleMedium: { fontSize: normalizeFont(14), lineHeight: normalizeFont(20) },
  titleSmall: { fontSize: normalizeFont(12), lineHeight: normalizeFont(18) },
  bodyLarge: { fontSize: normalizeFont(16), lineHeight: normalizeFont(24) },
  bodyMedium: { fontSize: normalizeFont(14), lineHeight: normalizeFont(20) },
  bodySmall: { fontSize: normalizeFont(12), lineHeight: normalizeFont(18) },
  labelLarge: { fontSize: normalizeFont(14), lineHeight: normalizeFont(20) },
  labelMedium: { fontSize: normalizeFont(12), lineHeight: normalizeFont(16) },
  labelSmall: { fontSize: normalizeFont(10), lineHeight: normalizeFont(14) },
  caption: { fontSize: normalizeFont(11), lineHeight: normalizeFont(16) },
  overline: { fontSize: normalizeFont(9), lineHeight: normalizeFont(12) },
} as const;

export const FontFamily = {
  light: "NotoSans-Light",
  regular: "NotoSans-Regular",
  medium: "NotoSans-Medium",
  semiBold: "NotoSans-SemiBold",
  bold: "NotoSans-Bold",
} as const;

export const Spacing = {
  none: 0,
  xxs: scale(2),
  xs: scale(4),
  sm: scale(8),
  md: scale(12),
  lg: scale(16),
  xl: scale(20),
  xxl: scale(24),
  xxxl: scale(32),
  xxxxl: scale(40),
  section: scale(48),
} as const;

export const BorderRadius = {
  none: 0,
  xs: scale(4),
  sm: scale(8),
  md: scale(12),
  lg: scale(16),
  xl: scale(20),
  xxl: scale(24),
  full: 9999,
} as const;

export const IconSize = {
  xs: scale(12),
  sm: scale(16),
  md: scale(20),
  lg: scale(24),
  xl: scale(28),
  xxl: scale(32),
  xxxl: scale(48),
} as const;

export const HitSlop = {
  small: { top: 8, bottom: 8, left: 8, right: 8 },
  medium: { top: 12, bottom: 12, left: 12, right: 12 },
  large: { top: 16, bottom: 16, left: 16, right: 16 },
} as const;

export const ColorTokens = {
  light: {
    background: "#FFFFFF",
    backgroundSecondary: "#F9FAFB",
    backgroundTertiary: "#F3F4F6",
    surface: "#FFFFFF",
    surfaceElevated: "#FFFFFF",
    card: "#F9FAFB",
    text: "#1F2937",
    textSecondary: "#6B7280",
    textTertiary: "#9CA3AF",
    textInverse: "#FFFFFF",
    border: "#E5E7EB",
    borderLight: "#F3F4F6",
    divider: "#E5E7EB",
    primary: "#ac1d17",
    primaryDark: "#8a1611",
    primaryLight: "#c9423c",
    primarySurface: "#FDF2F2",
    accent: "#ac1d17",
    error: "#EF4444",
    errorSurface: "#FEF2F2",
    warning: "#F59E0B",
    warningSurface: "#FFFBEB",
    info: "#3B82F6",
    infoSurface: "#EFF6FF",
    success: "#ac1d17",
    successSurface: "#FDF2F2",
    overlay: "rgba(0, 0, 0, 0.5)",
    shadow: "rgba(0, 0, 0, 0.1)",
    skeleton: "#E5E7EB",
    skeletonHighlight: "#F3F4F6",
    disabled: "#D1D5DB",
    disabledText: "#9CA3AF",
    star: "#FFC107",
    promo: "#EF4444",
    notification: "#3B82F6",
  },
  dark: {
    background: "#000000",
    backgroundSecondary: "#111827",
    backgroundTertiary: "#1F2937",
    surface: "#1C1C1E",
    surfaceElevated: "#2C2C2E",
    card: "#1C1C1E",
    text: "#FFFFFF",
    textSecondary: "#8E8E93",
    textTertiary: "#636366",
    textInverse: "#000000",
    border: "#2C2C2E",
    borderLight: "#3A3A3C",
    divider: "#2C2C2E",
    primary: "#ac1d17",
    primaryDark: "#8a1611",
    primaryLight: "#c9423c",
    primarySurface: "#3d1513",
    accent: "#ac1d17",
    error: "#EF4444",
    errorSurface: "#7F1D1D",
    warning: "#F59E0B",
    warningSurface: "#78350F",
    info: "#3B82F6",
    infoSurface: "#1E3A5F",
    success: "#ac1d17",
    successSurface: "#3d1513",
    overlay: "rgba(0, 0, 0, 0.7)",
    shadow: "rgba(0, 0, 0, 0.3)",
    skeleton: "#2C2C2E",
    skeletonHighlight: "#3A3A3C",
    disabled: "#3A3A3C",
    disabledText: "#636366",
    star: "#FFC107",
    promo: "#EF4444",
    notification: "#3B82F6",
  },
} as const;

export type ColorTokenKey = keyof typeof ColorTokens.light;

export const Elevation = {
  none: {},
  small: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  large: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  overlay: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

export const SCREEN_WIDTH_VALUE = SCREEN_WIDTH;
export const SCREEN_HEIGHT_VALUE = SCREEN_HEIGHT;
export const IS_SMALL_DEVICE = SCREEN_WIDTH < 375;
export const IS_TABLET = SCREEN_WIDTH >= 768;
