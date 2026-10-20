import { Image } from "expo-image";
import { View, type ViewStyle } from "react-native";

import type { MascotLook } from "@/api/client";
import { Emblem } from "@/components/icons";
import { MascotPortrait } from "@/features/mascot/MascotPortrait";
import { fontFamily, useTheme } from "@/theme";
import { AppText } from "./AppText";

export type PresenceStatus = "online" | "inGame" | "away" | "offline";

export interface AvatarProps {
  name: string;
  size?: number;
  /** Presence dot in the bottom-right corner. */
  presence?: PresenceStatus;
  /** Show the host crown overlay. */
  crown?: boolean;
  /** Colored ring around the avatar (e.g. the lobby host). */
  ringColor?: string;
  /** Corner radius; defaults to a circle. */
  radius?: number;
  /** Full address of a profile picture; the initial shows without one. */
  imageUri?: string | null;
  /** Their mascot, shown when there is no picture; the initial shows
   *  when there is neither. */
  mascot?: MascotLook | null;
  style?: ViewStyle;
}

/** The warm backdrop a mascot stands on inside the circle. */
const MASCOT_BG = "#FCEBD2";

// Deterministic pastel pairs from the design (bg / initial color).
const TINTS: { bg: string; fg: string }[] = [
  { bg: "#FFD9A8", fg: "#8A5A1E" },
  { bg: "#C9E4CE", fg: "#3B6B48" },
  { bg: "#CBD8F2", fg: "#3E5484" },
  { bg: "#F3D3D3", fg: "#8A4444" },
  { bg: "#EDE4FF", fg: "#7C5CD6" },
  { bg: "#FFF2C4", fg: "#8A6D1E" },
];

function tintFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return TINTS[Math.abs(hash) % TINTS.length];
}

export function Avatar({
  name,
  size = 46,
  presence,
  crown = false,
  ringColor,
  radius,
  imageUri,
  mascot,
  style,
}: AvatarProps) {
  const tint = tintFor(name);
  const initial = name.trim().charAt(0).toUpperCase();

  return (
    <View style={[{ width: size, height: size }, style]}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: radius ?? size / 2,
          backgroundColor: !imageUri && mascot ? MASCOT_BG : tint.bg,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: ringColor ? 3 : 0,
          borderColor: ringColor,
          overflow: "hidden",
        }}
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            accessibilityLabel={name}
          />
        ) : mascot ? (
          <MascotPortrait look={mascot} size={size} />
        ) : (
          <AppText
            style={{
              fontFamily: fontFamily.semiBold,
              fontSize: size * 0.34,
              color: tint.fg,
            }}
          >
            {initial}
          </AppText>
        )}
      </View>
      <AvatarBadges size={size} presence={presence} crown={crown} />
    </View>
  );
}

/** The presence dot and host crown, drawn over an avatar of this size.
 *  Separate so a bordered avatar can keep them on top of its border. */
export function AvatarBadges({
  size,
  presence,
  crown = false,
}: Pick<AvatarProps, "presence" | "crown"> & { size: number }) {
  const { colors } = useTheme();
  const dotSize = Math.max(10, size * 0.26);

  const presenceColors: Record<PresenceStatus, string> = {
    online: colors.success,
    inGame: colors.primary,
    away: colors.accent,
    offline: colors.toggleOff,
  };

  return (
    <>
      {presence ? (
        <View
          style={{
            position: "absolute",
            right: 0,
            bottom: 1,
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: presenceColors[presence],
            borderWidth: 2.5,
            borderColor: colors.surface,
          }}
        />
      ) : null}
      {crown ? (
        <View
          style={{
            position: "absolute",
            top: -size * 0.14,
            right: -size * 0.08,
          }}
        >
          <Emblem emoji="👑" size={Math.round(size * 0.38)} />
        </View>
      ) : null}
    </>
  );
}
