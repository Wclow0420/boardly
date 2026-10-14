// A Boardly folder with a game inside: kraft-paper back and tab, our
// meeple on the cover, and in the folder the game's own card. As `open`
// goes 0 → 1 the cover swings forward and down from its bottom edge and
// the game's card rises out to meet you.

import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";

import { GameBox } from "./GameBox";

/** The folder's kraft paper: light on the cover, darker behind. */
const KRAFT_COVER: [string, string] = ["#F2C77E", "#D49A4E"];
const KRAFT_BACK: [string, string] = ["#C98E45", "#A8702F"];

const LOGO = require("../../../assets/images/splash-icon.png");
/** The meeple takes up this share of the splash picture's width. */
const MEEPLE_SHARE = 0.34;

export function GameFolder({
  gameKey,
  emoji,
  tileColor,
  width,
  open,
}: {
  gameKey: string;
  emoji?: string | null;
  tileColor?: string | null;
  width: number;
  open: SharedValue<number>;
}) {
  const height = width * 0.78;
  const tab = Math.round(width * 0.11);
  const radius = Math.max(8, width * 0.06);
  // the cover sits a little lower than the back, as on a real folder
  const drop = height * 0.08;
  const logo = (width * 0.36) / MEEPLE_SHARE;
  const cardWidth = width * 0.84;
  const cardHeight = height * 0.84;

  // the cover falls open towards you, hinged at its foot
  const cover = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { rotateX: `${interpolate(open.value, [0, 1], [0, -72])}deg` },
    ],
  }));
  const coverShade = useAnimatedStyle(() => ({
    opacity: interpolate(open.value, [0, 1], [0, 0.4]),
  }));
  // and the card inside rises to meet you
  const card = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          open.value,
          [0, 1],
          [height * 0.1, -height * 0.3],
          // the cover may bounce as it opens; the card just rises
          Extrapolation.CLAMP,
        ),
      },
      {
        scale: interpolate(open.value, [0, 1], [0.92, 1], Extrapolation.CLAMP),
      },
    ],
  }));

  return (
    <View style={{ width, height: height + tab + drop }}>
      {/* the back, with its tab */}
      <LinearGradient
        colors={KRAFT_BACK}
        style={[
          styles.tab,
          {
            left: width * 0.07,
            width: width * 0.38,
            height: tab + radius,
            borderTopLeftRadius: radius,
            borderTopRightRadius: radius,
          },
        ]}
      />
      <LinearGradient
        colors={KRAFT_BACK}
        style={[styles.back, { top: tab, width, height, borderRadius: radius }]}
      >
        <View
          style={[
            StyleSheet.absoluteFill,
            styles.inside,
            { borderRadius: radius },
          ]}
        />
      </LinearGradient>

      {/* the game, inside */}
      <Animated.View
        style={[
          styles.card,
          {
            top: tab + height * 0.1,
            left: width * 0.08,
            width: cardWidth,
            height: cardHeight,
            borderRadius: radius * 0.6,
          },
          card,
        ]}
      >
        <GameBox
          gameKey={gameKey}
          emoji={emoji}
          tileColor={tileColor}
          width={cardWidth}
          aspect={cardHeight / cardWidth}
          flat
        />
      </Animated.View>

      {/* the cover, with our meeple */}
      <Animated.View
        style={[
          styles.cover,
          {
            top: tab + drop,
            width,
            height,
            borderRadius: radius,
            transformOrigin: "bottom",
          },
          cover,
        ]}
      >
        <LinearGradient colors={KRAFT_COVER} style={StyleSheet.absoluteFill} />
        <Image
          source={LOGO}
          style={{
            position: "absolute",
            top: (height - logo) / 2,
            left: (width - logo) / 2,
            width: logo,
            height: logo,
          }}
          contentFit="contain"
        />
        {/* a crease along the top of the cover */}
        <View style={[styles.crease, { top: height * 0.06 }]} />
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "#000", borderRadius: radius },
            coverShade,
          ]}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  tab: {
    position: "absolute",
    top: 0,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "rgba(255,240,210,0.35)",
  },
  back: {
    position: "absolute",
    left: 0,
    borderWidth: 1,
    borderColor: "rgba(255,240,210,0.35)",
  },
  // the inside of the folder, in shadow
  inside: { backgroundColor: "rgba(60,30,5,0.28)" },
  crease: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: "rgba(120,70,20,0.25)",
  },
  card: {
    position: "absolute",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  cover: {
    position: "absolute",
    left: 0,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,245,220,0.5)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
});
