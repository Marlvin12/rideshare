import { Alert } from "react-native";

export function showFeatureUnavailable(title?: string, message?: string) {
  Alert.alert(
    title ?? "Not available yet",
    message ?? "This feature is not available in this version of the app."
  );
}
