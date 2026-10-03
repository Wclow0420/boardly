import { View } from "react-native";

import { fontFamily, useTheme } from "@/theme";
import { AppText } from "./AppText";
import { Avatar } from "./Avatar";

export interface AvatarStackProps {
  names: string[];
  /** Show at most this many avatars; the rest collapse into "+N". */
  max?: number;
  size?: number;
}

/** Overlapping avatar row with a "+N" overflow bubble. */
export function AvatarStack({ names, max = 3, size = 22 }: AvatarStackProps) {
  const { colors } = useTheme();
  const visible = names.slice(0, max);
  const overflow = names.length - visible.length;

  return (
    <View style={{ flexDirection: "row" }}>
      {visible.map((name, i) => (
        <View
          key={`${name}-${i}`}
          style={{
            marginLeft: i === 0 ? 0 : -size * 0.32,
            borderRadius: size / 2 + 2,
            borderWidth: 2,
            borderColor: colors.card,
          }}
        >
          <Avatar name={name} size={size} />
        </View>
      ))}
      {overflow > 0 ? (
        <View
          style={{
            marginLeft: -size * 0.32,
            width: size + 4,
            height: size + 4,
            borderRadius: (size + 4) / 2,
            backgroundColor: colors.toggleOff,
            borderWidth: 2,
            borderColor: colors.card,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AppText
            style={{
              fontFamily: fontFamily.semiBold,
              fontSize: size * 0.4,
              color: colors.textSubtle,
            }}
          >
            +{overflow}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}
