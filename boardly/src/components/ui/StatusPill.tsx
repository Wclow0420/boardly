import { View } from "react-native";

import { fontFamily, useTheme } from "@/theme";
import { AppText } from "./AppText";

export type StatusPillVariant = "host" | "ready" | "waiting" | "info";

export interface StatusPillProps {
  label: string;
  variant: StatusPillVariant;
}

/** Small tinted badge (Host / Ready / Waiting / game tags). */
export function StatusPill({ label, variant }: StatusPillProps) {
  const { colors, radius } = useTheme();

  const tints: Record<StatusPillVariant, { bg: string; fg: string }> = {
    host: { bg: colors.warningSoft, fg: colors.warningStrong },
    ready: { bg: colors.successSoft, fg: colors.successStrong },
    waiting: { bg: colors.chip, fg: colors.textSubtle },
    info: { bg: colors.infoSoft, fg: colors.info },
  };
  const tint = tints[variant];

  return (
    <View
      style={{
        alignSelf: "flex-start",
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: radius.sm,
        backgroundColor: tint.bg,
      }}
    >
      <AppText
        variant="tiny"
        style={{ fontFamily: fontFamily.semiBold, color: tint.fg }}
      >
        {label}
      </AppText>
    </View>
  );
}
