/**
 * MobileMoneyPaymentModal — reusable, vertical-agnostic EcoCash/OneMoney
 * payment modal. Collects the method + phone, initiates a payment against
 * loko-api, then polls until a terminal status and surfaces the result.
 *
 * The amount is resolved server-side from the subject, so callers only pass
 * the subject reference.
 *
 * Usage:
 *   <MobileMoneyPaymentModal
 *     visible={showPay}
 *     subjectType="food"            // 'food' | 'rental'
 *     subjectId={order.id}
 *     onPaid={(paymentId) => { ... }}
 *     onClose={() => setShowPay(false)}
 *   />
 *
 * Decoupled by design — not wired into any screen yet (follow-up card).
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import CustomText from "./CustomText";
import { Colors, screenWidth } from "@/utils/Constants";
import {
  initiatePayment,
  getPaymentStatus,
  isTerminalStatus,
  type PaymentMethod,
  type PaymentStatus,
  type PaymentSubjectType,
} from "@/service/paymentsService";

interface MobileMoneyPaymentModalProps {
  visible: boolean;
  subjectType: PaymentSubjectType;
  subjectId: string;
  /** Called once the payment reaches the `paid` state. */
  onPaid: (paymentId: string) => void;
  onClose: () => void;
  /** Optional pre-fill for the payer's mobile-money number. */
  defaultPhone?: string;
  /** Optional idempotency key to make retries safe. */
  idempotencyKey?: string;
}

type Phase = "collect" | "processing" | "paid" | "failed";

const POLL_INTERVAL_MS = 3_000;
const MAX_POLLS = 40; // ~2 minutes

const METHODS: { key: PaymentMethod; label: string }[] = [
  { key: "ecocash", label: "EcoCash" },
  { key: "onemoney", label: "OneMoney" },
];

const MobileMoneyPaymentModal: React.FC<MobileMoneyPaymentModalProps> = ({
  visible,
  subjectType,
  subjectId,
  onPaid,
  onClose,
  defaultPhone = "",
  idempotencyKey,
}) => {
  const [method, setMethod] = useState<PaymentMethod>("ecocash");
  const [phone, setPhone] = useState(defaultPhone);
  const [phase, setPhase] = useState<Phase>("collect");
  const [instructions, setInstructions] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [paymentId, setPaymentId] = useState<string>("");

  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollCount = useRef(0);
  const cancelled = useRef(false);

  const clearPoll = useCallback(() => {
    if (pollTimer.current) {
      clearTimeout(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  const resetState = useCallback(() => {
    clearPoll();
    cancelled.current = true;
    pollCount.current = 0;
    setMethod("ecocash");
    setPhone(defaultPhone);
    setPhase("collect");
    setInstructions("");
    setError("");
    setPaymentId("");
  }, [clearPoll, defaultPhone]);

  // Reset internal state whenever the modal is (re)opened.
  useEffect(() => {
    if (visible) {
      cancelled.current = false;
      pollCount.current = 0;
      setMethod("ecocash");
      setPhone(defaultPhone);
      setPhase("collect");
      setInstructions("");
      setError("");
      setPaymentId("");
    }
    return () => {
      cancelled.current = true;
      clearPoll();
    };
  }, [visible, defaultPhone, clearPoll]);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  const finishWithStatus = useCallback(
    (status: PaymentStatus, id: string) => {
      clearPoll();
      if (status === "paid") {
        setPhase("paid");
        onPaid(id);
      } else {
        setError(
          status === "cancelled"
            ? "Payment was cancelled."
            : status === "refunded"
            ? "Payment was refunded."
            : "Payment failed. Please try again."
        );
        setPhase("failed");
      }
    },
    [clearPoll, onPaid]
  );

  const poll = useCallback(
    (id: string) => {
      if (cancelled.current) return;
      pollCount.current += 1;

      getPaymentStatus(id).then((res) => {
        if (cancelled.current) return;

        if (!res.success || !res.status) {
          // Transient error — keep polling until we hit the cap.
          if (pollCount.current >= MAX_POLLS) {
            setError(res.error || "Timed out waiting for confirmation.");
            setPhase("failed");
            return;
          }
          pollTimer.current = setTimeout(() => poll(id), POLL_INTERVAL_MS);
          return;
        }

        if (isTerminalStatus(res.status)) {
          finishWithStatus(res.status, id);
          return;
        }

        if (pollCount.current >= MAX_POLLS) {
          setError(
            "Still waiting for confirmation. Check your phone and try again."
          );
          setPhase("failed");
          return;
        }

        pollTimer.current = setTimeout(() => poll(id), POLL_INTERVAL_MS);
      });
    },
    [finishWithStatus]
  );

  const handlePay = useCallback(async () => {
    const trimmed = phone.trim();
    if (trimmed.length < 9) {
      setError("Enter a valid mobile-money number.");
      return;
    }
    setError("");
    setPhase("processing");

    const res = await initiatePayment({
      subjectType,
      subjectId,
      method,
      phone: trimmed,
      idempotencyKey,
    });

    if (cancelled.current) return;

    if (!res.success || !res.paymentId) {
      setError(res.error || "Failed to start payment.");
      setPhase("collect");
      return;
    }

    setPaymentId(res.paymentId);
    setInstructions(res.instructions || "");

    if (isTerminalStatus(res.status)) {
      finishWithStatus(res.status as PaymentStatus, res.paymentId);
      return;
    }

    pollCount.current = 0;
    poll(res.paymentId);
  }, [
    phone,
    subjectType,
    subjectId,
    method,
    idempotencyKey,
    finishWithStatus,
    poll,
  ]);

  const handleRetry = useCallback(() => {
    clearPoll();
    pollCount.current = 0;
    setError("");
    setInstructions("");
    setPaymentId("");
    setPhase("collect");
  }, [clearPoll]);

  const renderCollect = () => (
    <View style={styles.content}>
      <CustomText fontFamily="SemiBold" fontSize={20} style={styles.title}>
        Pay with mobile money
      </CustomText>
      <CustomText fontFamily="Regular" fontSize={14} style={styles.subtitle}>
        Choose a provider and enter the number to charge.
      </CustomText>

      <View style={styles.methodRow}>
        {METHODS.map((m) => {
          const active = method === m.key;
          return (
            <TouchableOpacity
              key={m.key}
              style={[styles.methodButton, active && styles.methodButtonActive]}
              onPress={() => setMethod(m.key)}
              activeOpacity={0.8}
            >
              <CustomText
                fontFamily={active ? "SemiBold" : "Regular"}
                fontSize={14}
                style={[
                  styles.methodLabel,
                  active && styles.methodLabelActive,
                ]}
              >
                {m.label}
              </CustomText>
            </TouchableOpacity>
          );
        })}
      </View>

      <TextInput
        style={styles.phoneInput}
        placeholder="07xx xxx xxx"
        placeholderTextColor={Colors.textLight}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        autoFocus={false}
      />

      {error ? (
        <CustomText fontFamily="Regular" fontSize={13} style={styles.errorText}>
          {error}
        </CustomText>
      ) : null}

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handlePay}
        activeOpacity={0.85}
      >
        <CustomText
          fontFamily="SemiBold"
          fontSize={16}
          style={styles.submitButtonText}
        >
          Pay now
        </CustomText>
      </TouchableOpacity>
    </View>
  );

  const renderProcessing = () => (
    <View style={styles.content}>
      <ActivityIndicator
        size="large"
        color={Colors.primary}
        style={styles.spinner}
      />
      <CustomText fontFamily="SemiBold" fontSize={18} style={styles.title}>
        Waiting for confirmation
      </CustomText>
      <CustomText fontFamily="Regular" fontSize={14} style={styles.subtitle}>
        {instructions ||
          "Approve the prompt on your phone to complete the payment."}
      </CustomText>
    </View>
  );

  const renderPaid = () => (
    <View style={styles.content}>
      <View style={[styles.statusIcon, styles.statusIconSuccess]}>
        <Ionicons name="checkmark" size={RFValue(34)} color={Colors.white} />
      </View>
      <CustomText fontFamily="SemiBold" fontSize={18} style={styles.title}>
        Payment received
      </CustomText>
      <CustomText fontFamily="Regular" fontSize={14} style={styles.subtitle}>
        Your payment was confirmed.
      </CustomText>
      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleClose}
        activeOpacity={0.85}
      >
        <CustomText
          fontFamily="SemiBold"
          fontSize={16}
          style={styles.submitButtonText}
        >
          Done
        </CustomText>
      </TouchableOpacity>
    </View>
  );

  const renderFailed = () => (
    <View style={styles.content}>
      <View style={[styles.statusIcon, styles.statusIconError]}>
        <Ionicons name="close" size={RFValue(34)} color={Colors.white} />
      </View>
      <CustomText fontFamily="SemiBold" fontSize={18} style={styles.title}>
        Payment not completed
      </CustomText>
      <CustomText fontFamily="Regular" fontSize={14} style={styles.subtitle}>
        {error || "Something went wrong. Please try again."}
      </CustomText>
      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleRetry}
        activeOpacity={0.85}
      >
        <CustomText
          fontFamily="SemiBold"
          fontSize={16}
          style={styles.submitButtonText}
        >
          Try again
        </CustomText>
      </TouchableOpacity>
    </View>
  );

  const canDismiss = phase === "collect" || phase === "paid" || phase === "failed";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={canDismiss ? handleClose : undefined}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {canDismiss ? (
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={RFValue(22)} color={Colors.text} />
            </TouchableOpacity>
          ) : null}

          {phase === "collect" && renderCollect()}
          {phase === "processing" && renderProcessing()}
          {phase === "paid" && renderPaid()}
          {phase === "failed" && renderFailed()}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    width: screenWidth - 40,
    maxWidth: 400,
    overflow: "hidden",
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 1,
    padding: 4,
  },
  content: {
    padding: 24,
    alignItems: "center",
  },
  title: {
    color: Colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    color: Colors.textLight,
    marginBottom: 24,
    textAlign: "center",
  },
  methodRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginBottom: 20,
  },
  methodButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    backgroundColor: Colors.white,
  },
  methodButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.secondary_light,
  },
  methodLabel: {
    color: Colors.textLight,
  },
  methodLabelActive: {
    color: Colors.primary,
  },
  phoneInput: {
    width: "100%",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 12,
  },
  errorText: {
    color: Colors.error,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  submitButton: {
    width: "100%",
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonText: {
    color: Colors.white,
  },
  spinner: {
    marginBottom: 20,
  },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  statusIconSuccess: {
    backgroundColor: Colors.primary,
  },
  statusIconError: {
    backgroundColor: Colors.error,
  },
});

export default MobileMoneyPaymentModal;
