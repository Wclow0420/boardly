import { StyleSheet, Text, View, type TextStyle } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText, Button, type AppTextProps, type ButtonProps } from "@/components/ui";
import { typography, useTheme } from "@/theme";
import { PLACES, PLACE_COLOR, POSTS, POST_COLOR } from "./logic";
import { EMOJI_ICON, GameIcon, splitIcons, type IconName } from "./icons";

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Icons that keep a colour of their own whatever the text's is. */
const OWN_COLOR: Partial<Record<IconName, "successStrong" | "danger">> = {
  food: "successStrong",
  sabotage: "danger",
  infected: "danger",
  mold: "danger",
  zombie: "danger",
  injured: "danger",
};

/** Shelter's text (the same idea as Seal the Manor's GameText): an emoji
 *  the game has an icon for is drawn as that icon, and the name of a
 *  place or a night post is set in its colour. Everything else is
 *  AppText. */
export function GameText({ children, ...props }: AppTextProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  if (typeof children !== "string") return <AppText {...props}>{children}</AppText>;

  const colorOf = new Map([
    ...PLACES.map((id) => [t(`shelter.places.${id}`), PLACE_COLOR[id]] as const),
    ...POSTS.map((id) => [t(`shelter.posts.${id}`), POST_COLOR[id]] as const),
  ]);
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
            <Text key={`${index}-${i}`} style={{ color: colorOf.get(part), fontWeight: "700" }}>
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
