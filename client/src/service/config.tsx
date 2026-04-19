import { Platform } from "react-native";

const DEFAULT_PORT = 3000;
const devFallback =
  typeof __DEV__ !== "undefined" && __DEV__
    ? Platform.OS === "android"
      ? `http://10.0.2.2:${DEFAULT_PORT}`
      : `http://localhost:${DEFAULT_PORT}`
    : "";

let BASE_URL =
  (process.env.EXPO_PUBLIC_API_URL?.trim()) || devFallback;
if (
  Platform.OS === "android" &&
  BASE_URL &&
  (BASE_URL.includes("localhost") || BASE_URL.includes("127.0.0.1"))
) {
  BASE_URL = BASE_URL
    .replace(/localhost/g, "10.0.2.2")
    .replace(/127\.0\.0\.1/g, "10.0.2.2");
}
const SOCKET_URL =
  process.env.EXPO_PUBLIC_WS_URL ??
  (BASE_URL ? BASE_URL.replace(/^http/, "ws") : "");

export { BASE_URL, SOCKET_URL };
