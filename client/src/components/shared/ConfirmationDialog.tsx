import React from "react";
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CustomText from "./CustomText";
import { useThemeStore } from "@/store/themeStore";
import { ColorTokens, Spacing, BorderRadius } from "@/utils/designSystem";

interface ConfirmationDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  icon,
  onConfirm,
  onCancel,
}) => {
  const { mode } = useThemeStore();
  const tokens = ColorTokens[mode === "dark" ? "dark" : "light"];

  const confirmColor = destructive ? tokens.error : tokens.primary;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={[styles.overlay, { backgroundColor: tokens.overlay }]}>
          <TouchableWithoutFeedback>
            <View style={[styles.dialog, { backgroundColor: tokens.surface }]}>
              {icon && (
                <View
                  style={[
                    styles.iconContainer,
                    {
                      backgroundColor: destructive
                        ? tokens.errorSurface
                        : tokens.primarySurface,
                    },
                  ]}
                >
                  <Ionicons name={icon} size={28} color={confirmColor} />
                </View>
              )}
              <CustomText
                fontFamily="SemiBold"
                fontSize={18}
                style={[styles.title, { color: tokens.text }]}
              >
                {title}
              </CustomText>
              <CustomText
                fontFamily="Regular"
                fontSize={14}
                style={[styles.message, { color: tokens.textSecondary }]}
              >
                {message}
              </CustomText>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.cancelButton,
                    { borderColor: tokens.border },
                  ]}
                  onPress={onCancel}
                  accessibilityRole="button"
                  accessibilityLabel={cancelLabel}
                >
                  <CustomText
                    fontFamily="Medium"
                    fontSize={14}
                    style={{ color: tokens.text }}
                  >
                    {cancelLabel}
                  </CustomText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.confirmButton,
                    { backgroundColor: confirmColor },
                  ]}
                  onPress={onConfirm}
                  accessibilityRole="button"
                  accessibilityLabel={confirmLabel}
                >
                  <CustomText
                    fontFamily="SemiBold"
                    fontSize={14}
                    style={{ color: "#FFFFFF" }}
                  >
                    {confirmLabel}
                  </CustomText>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xxl,
  },
  dialog: {
    width: "100%",
    maxWidth: 340,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xxl,
    alignItems: "center",
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  message: {
    textAlign: "center",
    marginBottom: Spacing.xxl,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.md,
    width: "100%",
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    borderWidth: 1,
  },
  confirmButton: {},
});

export default ConfirmationDialog;
