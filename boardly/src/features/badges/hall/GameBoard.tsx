// One game's badges on its board: dark planks in a riveted iron frame,
// the game's name on a gold-framed plate over the top edge and its
// count, the cards hanging inside three to a row (each swings in on its
// clip the first time the board is shown, then hangs still).

import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import { SvgXml } from "react-native-svg";

import type { BadgeRecord } from "@/api/client";
import { AppText, BezelOverlay, useBox } from "@/components/ui";
import { fontFamily } from "@/theme";
import { BadgeGrid } from "../BadgeGrid";
import { boardArt } from "./art";

export function GameBoard({
  name,
  badges,
  clock,
  still,
  fresh,
  onStamped,
  action,
}: {
  name: string;
  badges: BadgeRecord[];
  clock: SharedValue<number>;
  still: SharedValue<number>;
  fresh: Set<string>;
  onStamped: (ids: string[]) => void;
  action: (badge: BadgeRecord, close: () => void) => ReactNode;
}) {
  const [{ w, h }, onLayout] = useBox();
  const earned = badges.filter((b) => b.tier).length;
  return (
    <View style={styles.wrap}>
      <View style={styles.board} onLayout={onLayout}>
        {w > 0 ? <SvgXml xml={boardArt(w, h)} width={w} height={h} style={StyleSheet.absoluteFill} /> : null}
        <BadgeGrid
          badges={badges}
          clock={clock}
          still={still}
          fresh={fresh}
          onStamped={onStamped}
          action={action}
          columns={3}
          cards
        />
      </View>
      {/* the name plate over the top edge */}
      <View style={styles.plate} pointerEvents="none">
        <View style={styles.plateFace}>
          <BezelOverlay r={11} t={3} />
          <AppText style={styles.plateText} numberOfLines={1}>
            {name}
          </AppText>
          <AppText style={styles.plateCount}>{`${earned}/${badges.length}`}</AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 18 },
  board: { paddingTop: 30, paddingBottom: 14, paddingHorizontal: 12 },
  plate: { position: "absolute", top: -12, left: 0, right: 0, alignItems: "center" },
  plateFace: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 26,
    paddingHorizontal: 16,
    borderRadius: 11,
    backgroundColor: "#F4EEDF",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  plateText: { fontFamily: fontFamily.bold, fontSize: 13, lineHeight: 17, color: "#3A2408", letterSpacing: 0.5 },
  plateCount: { fontFamily: fontFamily.semiBold, fontSize: 11, lineHeight: 15, color: "#8A6A3A" },
});
