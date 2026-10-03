import type { ComponentType } from "react";
import { TextInput, View, type TextInputProps } from "react-native";

import { fontFamily, useTheme } from "@/theme";
import { AppText } from "./AppText";

export interface TextFieldProps extends TextInputProps {
  label?: string;
  /** Swap the underlying input, e.g. Gorhom's BottomSheetTextInput so
   *  the keyboard behaves correctly inside bottom sheets. */
  InputComponent?: ComponentType<TextInputProps>;
}

export function TextField({
  label,
  InputComponent = TextInput,
  style,
  ...rest
}: TextFieldProps) {
  const { colors, radius, spacing } = useTheme();

  return (
    <View style={{ gap: spacing.sm }}>
      {label ? (
        <AppText variant="caption" color="textMuted">
          {label}
        </AppText>
      ) : null}
      <InputComponent
        placeholderTextColor={colors.textSubtle}
        style={[
          {
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.md,
            paddingHorizontal: spacing.lg,
            paddingVertical: 13,
            fontFamily: fontFamily.medium,
            fontSize: 14,
            color: colors.text,
          },
          style,
        ]}
        {...rest}
      />
    </View>
  );
}
