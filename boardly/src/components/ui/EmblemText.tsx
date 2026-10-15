import { StyleSheet, View, type TextStyle } from "react-native";

import { Emblem, splitEmblems } from "@/components/icons";
import { typography } from "@/theme";
import { AppText, type AppTextProps } from "./AppText";

/** Text whose emoji are drawn as the app's engraved emblems, each as
 *  tall as the letters beside it. Plain AppText when there are none. */
export function EmblemText({ children, ...props }: AppTextProps) {
  if (typeof children !== "string")
    return <AppText {...props}>{children}</AppText>;
  const pieces = splitEmblems(children);
  if (pieces.length === 1) return <AppText {...props}>{children}</AppText>;

  const flat = StyleSheet.flatten(props.style) as TextStyle | undefined;
  const fontSize =
    flat?.fontSize ?? typography[props.variant ?? "body"].fontSize;
  const size = Math.round(fontSize * 1.3);
  return (
    <AppText {...props}>
      {pieces.map((piece, index) =>
        index % 2 === 1 ? (
          <View
            key={index}
            style={{
              width: size,
              height: size,
              transform: [{ translateY: size * 0.2 }],
            }}
          >
            <Emblem emoji={piece} size={size} />
          </View>
        ) : (
          piece
        ),
      )}
    </AppText>
  );
}
