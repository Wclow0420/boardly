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

import { TABLE, ThemeRelay, shade, useThemeRelay } from "@/theme";
import { Ribbon } from "./Frames";

export interface BottomSheetModalProps {
  children: ReactNode;
  /** e.g. ["45%"] or ["45%", "90%"]. Omit for dynamic content sizing. */
  snapPoints?: (string | number)[];
  title?: string;
  onDismiss?: () => void;
  /** false = the user can't swipe or tap it away; only code closes it
   *  (a prompt that must be answered). Default true. */
  dismissable?: boolean;
  /** false = no dimmed backdrop, so the screen behind stays visible and
   *  usable while the sheet is open. Default true. */
  backdrop?: boolean;
}

export const BottomSheetModal = forwardRef<
  GorhomBottomSheetModal,
  BottomSheetModalProps
>(function BottomSheetModal(
  { children, snapPoints, title, onDismiss, dismissable = true, backdrop = true },
  ref
) {
  // Sheets render through a portal, outside any ThemeScope around the
  // caller — relay the caller's theme into the sheet.
  const themeValue = useThemeRelay();
  const { colors, radius, spacing } = themeValue.theme;

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.45}
        pressBehavior={dismissable ? "close" : "none"}
      />
    ),
    [dismissable]
  );

  const renderBackground = useCallback(
    ({ style }: BottomSheetBackgroundProps) => (
      <View
        style={[
          style,
          {
            // A drawer pulled out of the table: lighter than the page,
            // with a bright lip along the top
            backgroundColor: shade(colors.surface, 0.07),
            borderTopLeftRadius: radius.xxl,
            borderTopRightRadius: radius.xxl,
            borderTopWidth: 3,
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderColor: colors.primarySoftBorder,
          },
        ]}
      />
    ),
    [colors.surface, colors.primarySoftBorder, radius.xxl]
  );

  return (
    <GorhomBottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      onDismiss={onDismiss}
      enablePanDownToClose={dismissable}
      backdropComponent={backdrop ? renderBackdrop : undefined}
      backgroundComponent={renderBackground}
      handleIndicatorStyle={{
        backgroundColor: dismissable ? colors.textSubtle : "transparent",
        width: 44,
      }}
    >
      {/* Single BottomSheetView: sibling BottomSheetViews overlap under
          dynamic sizing, so title + body share one container. */}
      <BottomSheetView>
        <ThemeRelay value={themeValue}>
          {title ? (
            <View style={{ paddingHorizontal: spacing.xl, paddingBottom: 14 }}>
              <Ribbon label={title} colors={TABLE.ribbonGold} />
            </View>
          ) : null}
          {children}
        </ThemeRelay>
      </BottomSheetView>
    </GorhomBottomSheetModal>
  );
});

// Re-exports so screens import everything sheet-related from the kit.
export { BottomSheetScrollView, BottomSheetView, GorhomBottomSheetModal };
