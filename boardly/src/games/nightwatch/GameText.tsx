import { StyleSheet, Text, View, type TextStyle } from "react-native";
import { useTranslation } from "react-i18next";

import { shade } from "@/components/engraved/shapes";
import { AppText, Button, type AppTextProps, type ButtonProps } from "@/components/ui";
import { typography, useTheme } from "@/theme";
import { ROOMS, ROOM_COLOR } from "./logic";
import { EMOJI_ICON, GameIcon, splitIcons, type IconName } from "./icons";

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Icons that keep a colour of their own whatever the text's is. */
const OWN_COLOR: Partial<Record<IconName, "successStrong" | "danger">> = {
  check: "successStrong",
  up: "successStrong",
  cross: "danger",
  down: "danger",
  blocked: "danger",
};

/** The game's text. Two things are drawn rather than written wherever
 *  they appear in it: an emoji the game has an icon for becomes that
 *  icon, and a room's name is set in that room's colour — so anything
 *  on the board can be read at a glance. Everything else is AppText. */
export function GameText({ children, paper = false, ...props }: AppTextProps & {
  /** Written on paper: room names inked darker, to read on ivory. */
  paper?: boolean;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  if (typeof children !== "string") return <AppText {...props}>{children}</AppText>;

  const colorOf = new Map(ROOMS.map((id) => [t(`nightwatch.rooms.${id}`), ROOM_COLOR[id]]));
  // longest first, so a name that contains another is found whole
  const names = [...colorOf.keys()].sort((a, b) => b.length - a.length);
  const rooms = new RegExp(`(${names.map(escape).join("|")})`);

  const pieces = splitIcons(children);
  if (pieces.length === 1 && !rooms.test(children)) {
    return <AppText {...props}>{children}</AppText>;
  }

  // an icon is as tall as the letters beside it
  const flat = StyleSheet.flatten(props.style) as TextStyle | undefined;
  const fontSize = flat?.fontSize ?? typography[props.variant ?? "body"].fontSize;
  const size = Math.round(fontSize * 1.2);
  const ink = (flat?.color as string | undefined) ?? colors.primary;

  return (
    <AppText {...props}>
      {pieces.map((piece, index) => {
        if (index % 2 === 1) {
          const name = EMOJI_ICON[piece];
          const own = OWN_COLOR[name];
          return (
            <View key={index} style={{ width: size, height: size, transform: [{ translateY: size * 0.18 }] }}>
              <GameIcon name={name} size={size} color={own ? colors[own] : ink} />
            </View>
          );
        }
        return piece.split(rooms).map((part, i) =>
          colorOf.has(part) ? (
            <Text
              key={`${index}-${i}`}
              style={{ color: paper ? shade(colorOf.get(part)!, -0.55) : colorOf.get(part), fontWeight: "700" }}
            >
              {part}
            </Text>
          ) : (
            part
          )
        );
      })}
    </AppText>
  );
}

/** The game's button: a label that opens with one of the game's emoji
 *  gets its icon in front instead. */
export function GameButton({ label, ...props }: ButtonProps) {
  const { colors } = useTheme();
  const [before, emoji, ...rest] = splitIcons(label);
  if (before !== "" || emoji === undefined) return <Button label={label} {...props} />;

  const variant = props.variant ?? "primary";
  const color =
    variant === "primary"
      ? colors.primaryContrast
      : variant === "danger"
        ? "#FFFFFF"
        : variant === "tertiary"
          ? colors.primary
          : colors.text;
  return (
    <Button
      {...props}
      label={rest.join("").trim()}
      leftIcon={<GameIcon name={EMOJI_ICON[emoji]} size={props.size === "lg" ? 22 : 18} color={color} />}
    />
  );
}
