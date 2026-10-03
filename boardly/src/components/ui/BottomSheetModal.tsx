// Standard bottom sheet for the whole app — a themed wrapper around
// @gorhom/bottom-sheet (our chosen library, see NEW_PROJECT_PLAYBOOK.md).
// Requires <BottomSheetModalProvider> in the root layout.
//
// Usage:
//   const sheetRef = useRef<GorhomBottomSheetModal>(null);
//   sheetRef.current?.present();
//   <BottomSheetModal ref={sheetRef} snapPoints={["45%"]} title="...">
//     <BottomSheetScrollView>...</BottomSheetScrollView>
//   </BottomSheetModal>

import {
  BottomSheetModal as GorhomBottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetView,
  type BottomSheetBackdropProps,
  type BottomSheetBackgroundProps,
} from "@gorhom/bottom-sheet";
import { forwardRef, useCallback, type ReactNode } from "react";
import { View } from "react-native";

import { useTheme } from "@/theme";
import { AppText } from "./AppText";

export interface BottomSheetModalProps {
  children: ReactNode;
  /** e.g. ["45%"] or ["45%", "90%"]. Omit for dynamic content sizing. */
  snapPoints?: (string | number)[];
  title?: string;
  onDismiss?: () => void;
}

function SheetBackground({ style }: BottomSheetBackgroundProps) {
  const { colors, radius } = useTheme();
  return (
    <View
      style={[
        style,
        {
          backgroundColor: colors.surface,
          borderTopLeftRadius: radius.xxl,
          borderTopRightRadius: radius.xxl,
        },
      ]}
    />
  );
}

export const BottomSheetModal = forwardRef<
  GorhomBottomSheetModal,
  BottomSheetModalProps
>(function BottomSheetModal({ children, snapPoints, title, onDismiss }, ref) {
  const { colors, spacing } = useTheme();

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.45}
      />
    ),
    []
  );

  return (
    <GorhomBottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      onDismiss={onDismiss}
      backdropComponent={renderBackdrop}
      backgroundComponent={SheetBackground}
      handleIndicatorStyle={{ backgroundColor: colors.toggleOff }}
    >
      {/* Single BottomSheetView: sibling BottomSheetViews overlap under
          dynamic sizing, so title + body share one container. */}
      <BottomSheetView>
        {title ? (
          <AppText
            variant="title"
            style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.xs }}
          >
            {title}
          </AppText>
        ) : null}
        {children}
      </BottomSheetView>
    </GorhomBottomSheetModal>
  );
});

// Re-exports so screens import everything sheet-related from the kit.
export { BottomSheetScrollView, BottomSheetView, GorhomBottomSheetModal };
