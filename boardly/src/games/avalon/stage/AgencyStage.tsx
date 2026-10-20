// Double Agent's stage: the shared GameStage (features/game/stage) at
// night in the agency, with its case-file header across the top (the
// five operations as folders, today's under the lamp, the operation's
// name on the plaque) and what's at stake on enamel tags under it: the
// team's size, two fail cards when that's what it takes, and how many
// teams have been turned down in a row. The scene fills the middle: my
// role card, the satchel of tools and the hint line sit on the plinth
// (the stage's dock).

import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode, RefObject } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { AppText, BezelOverlay } from "@/components/ui";
import { GameStage, useStageSize, type StageDock, type StageLook } from "@/features/game/stage/GameStage";
import { fontFamily } from "@/theme";
import { MAX_REJECTIONS, teamSize, type AvalonState } from "../logic";
import { CaseHeader } from "./CaseHeader";
import { headerLayout, type FileState } from "./headerArt";

/** The agency at night: sea-green ink, a warm desk lamp. */
export const AGENCY: StageLook = {
  sky: ["#17292F", "#0D181C", "#081013"],
  glow: "#E8A04A",
  jewel: "emerald",
  popup: { enamel: ["#2E7A72", "#16403F", "#0A2224"], jewel: "emerald", glow: "#FFD58A" },
};

/** A small enamel tag under the header. */
function Tag({ children, tone = "plain" }: { children: ReactNode; tone?: "plain" | "warn" }) {
  return (
    <View style={styles.tag}>
      <LinearGradient
        colors={tone === "warn" ? ["#5A1A22", "#2A080C"] : ["#1E3036", "#0E181C"]}
        style={StyleSheet.absoluteFill}
      />
      <BezelOverlay r={10} t={2.5} />
      {children}
    </View>
  );
}

export function AgencyStage({
  state,
  subtitle,
  sceneKey,
  centre,
  dock,
  handRef,
  bottom,
  overlays,
  onBack,
  onRules,
  away = false,
  bleed = false,
  paused = false,
  stamp = null,
}: {
  state: AvalonState;
  /** The plaque's second line (the phase). */
  subtitle: string;
  sceneKey: string;
  centre: ReactNode;
  /** My role card, the satchel of tools and the hint line, on the plinth. */
  dock: StageDock;
  /** Set on the card in my hand: where the dealt role card is put away. */
  handRef?: RefObject<View | null>;
  bottom: ReactNode;
  overlays?: ReactNode;
  onBack?: () => void;
  onRules?: () => void;
  away?: boolean;
  bleed?: boolean;
  paused?: boolean;
  /** A file just closed on this device: its seal comes down. */
  stamp?: { index: number; n: number } | null;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useStageSize();
  const live = state.phase !== "finished";
  const files: FileState[] = state.questSizes.map((_, q) => {
    const result = state.questResults[q];
    return result ? (result.success ? "won" : "lost") : q === state.quest && live ? "now" : "ahead";
  });
  const labels = state.questSizes.map((size, q) =>
    state.questResults[q] ? "" : `${size}${state.failsRequired[q] > 1 ? "★" : ""}`,
  );
  const L = headerLayout(width, insets.top, files.length);
  const op = Math.min(state.quest + 1, state.questSizes.length);
  const twoFails = (state.failsRequired[state.quest] ?? 1) > 1;
  return (
    <GameStage
      header={
        <CaseHeader
          width={width}
          top={insets.top}
          title={t("avalon.stage.op", { n: op, total: state.questSizes.length })}
          subtitle={subtitle}
          files={files}
          labels={labels}
          stamp={stamp}
          paused={paused}
        />
      }
      headerHeight={L.h}
      under={
        live && state.phase !== "assassinate" ? (
          <>
            <Tag>
              <AppText style={styles.kind}>{t("avalon.stage.team")}</AppText>
              <AppText style={styles.value}>{teamSize(state)}</AppText>
              {twoFails ? <AppText style={styles.kind}>{`· ${t("avalon.stage.twoFails")}`}</AppText> : null}
            </Tag>
            <Tag tone={state.rejections >= MAX_REJECTIONS - 2 ? "warn" : "plain"}>
              <AppText style={styles.kind}>{t("avalon.stage.rejected")}</AppText>
              <View style={styles.pips}>
                {Array.from({ length: MAX_REJECTIONS }, (_, i) => (
                  <View key={i} style={[styles.pip, i < state.rejections && styles.pipOn]} />
                ))}
              </View>
            </Tag>
          </>
        ) : undefined
      }
      sceneKey={sceneKey}
      centre={centre}
      dock={dock}
      handRef={handRef}
      bottom={bottom}
      overlays={overlays}
      onBack={onBack}
      onRules={onRules}
      away={away}
      bleed={bleed}
      look={AGENCY}
    />
  );
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 26,
    paddingHorizontal: 11,
    borderRadius: 10,
    overflow: "hidden",
    flexShrink: 1,
  },
  kind: { fontFamily: fontFamily.medium, fontSize: 11, lineHeight: 14, color: "#C8C2B0" },
  value: { fontFamily: fontFamily.bold, fontSize: 12, lineHeight: 15, color: "#FFD58A" },
  pips: { flexDirection: "row", gap: 3 },
  pip: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#33454D", borderWidth: 1, borderColor: "#0A1216" },
  pipOn: { backgroundColor: "#F0605D", borderColor: "#5A0612" },
});

export { StageInsets, stageText, useStageSize } from "@/features/game/stage/GameStage";
