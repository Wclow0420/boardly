// A player's name under a tile, a stud or on a plate: one line, centred
// in its slot, cut with "…" when it's too long. A bot's name comes with
// a 🤖 in front; drawn inline in the text, that emblem threw the centring
// off and lifted the line, so here it's its own piece beside the name and
// the two are centred together.

import { memo } from "react";
import { StyleSheet, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";

import { Emblem } from "@/components/icons";
import { AppText } from "@/components/ui";

const BOT = /^🤖️?\s*/u;

/** Style keys that place the name; the rest dress the text. */
const BOX_KEYS = new Set([
  "position",
  "left",
  "right",
  "top",
  "bottom",
  "width",
  "height",
  "maxWidth",
  "minWidth",
  "margin",
  "marginTop",
  "marginBottom",
  "marginLeft",
  "marginRight",
  "marginHorizontal",
  "marginVertical",
  "opacity",
  "alignSelf",
  "flex",
  "flexShrink",
  "flexGrow",
]);

/** A name cut to fit inside a line of text ("Christopher W…'s turn"),
 *  so the words round it still show. */
export function shortName(name: string, max = 12) {
  const chars = [...name];
  return chars.length > max ? `${chars.slice(0, max - 1).join("").trimEnd()}…` : name;
}

export const PlayerName = memo(function PlayerName({
  name,
  style,
  align = "center",
}: {
  name: string;
  /** As for the text it replaces: where it sits and how it reads. */
  style?: StyleProp<TextStyle>;
  align?: "center" | "left";
}) {
  const flat = (StyleSheet.flatten(style) ?? {}) as Record<string, unknown>;
  const box: Record<string, unknown> = {};
  const text: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(flat)) (BOX_KEYS.has(k) ? box : text)[k] = v;
  const size = typeof flat.fontSize === "number" ? flat.fontSize : 12;
  const bot = BOT.test(name);
  return (
    <View
      style={[styles.row, { justifyContent: align === "center" ? "center" : "flex-start" }, box as ViewStyle]}
      pointerEvents="none"
    >
      {bot ? <Emblem emoji="🤖" size={Math.round(size * 1.2)} /> : null}
      <AppText numberOfLines={1} ellipsizeMode="tail" style={[text as TextStyle, styles.text, { textAlign: align }]}>
        {bot ? name.replace(BOT, "") : name}
      </AppText>
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 2 },
  text: { flexShrink: 1 },
});
