// Reusable confirmation bottom sheet — the app's standard replacement
// for Alert.alert on destructive/irreversible actions (leaving a
// table, closing a room, forfeiting a game).
//
// Usage:
//   const sheetRef = useRef<GorhomBottomSheetModal>(null);
//   sheetRef.current?.present();
//   <ConfirmSheet ref={sheetRef} title=... confirmLabel=... onConfirm=... />

import { forwardRef, useRef } from "react";
import { StyleSheet, View } from "react-native";

import { useTheme } from "@/theme";
import { AppText } from "./AppText";
import {
  BottomSheetModal,
  GorhomBottomSheetModal,
} from "./BottomSheetModal";
import { Button } from "./Button";

export interface ConfirmSheetProps {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel: string;
  /** Styles the confirm button red for destructive actions. */
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
}

export const ConfirmSheet = forwardRef<GorhomBottomSheetModal, ConfirmSheetProps>(
  function ConfirmSheet(
    { title, message, confirmLabel, cancelLabel, destructive, loading, onConfirm },
    ref
  ) {
    const { spacing } = useTheme();
    const selfRef = useRef<GorhomBottomSheetModal | null>(null);

    return (
      <BottomSheetModal
        ref={(node) => {
          selfRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        title={title}
      >
        <View style={[styles.body, { gap: spacing.lg }]}>
          {message ? (
            <AppText variant="body" color="textMuted">
              {message}
            </AppText>
          ) : null}
          <Button
            label={confirmLabel}
            variant={destructive ? "danger" : "primary"}
            loading={loading}
            onPress={onConfirm}
          />
          <Button
            label={cancelLabel}
            variant="tertiary"
            onPress={() => selfRef.current?.dismiss()}
          />
        </View>
      </BottomSheetModal>
    );
  }
);

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
});
