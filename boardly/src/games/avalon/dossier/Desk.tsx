// The operation, played at the agency's desk in the middle of the stage
// (the team's vote is on the lineup instead: StageLineup). Three views,
// each one canvas on one clock:
//
//   choose — the operation's dossier lies open on the desk, and behind
//            it stand two stamps: the gold desk stamp with an emerald
//            (Success) and the moles' black sealing iron with a ruby
//            (Fail), swaying a little. Tap one to pick it; holding the
//            button (HoldButton, sharing `hold`) lifts it and charges it
//            — green fire, or red smoke — until it comes down on the
//            file: a green APPROVED stamp, or a red wax seal. Then it
//            goes back to its place and the mark glows on, calm.
//   gather — the dossier shut and tied, an envelope for each of the
//            team: open while they decide, sealed in gold once their
//            card is in, a stream of light running into the file.
//            Nothing tells whose card was which.
//   reveal — the file opens, the cards come out face down and turn
//            over one by one (in no one's order), and the verdict comes
//            down on the file: APPROVED in green fire, or the red seal in
//            a churn of smoke.

import {
  Canvas,
  Circle,
  Group,
  Image as SkImage,
  RadialGradient,
  Rect,
  Shader,
  vec,
} from "@shopify/react-native-skia";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

import { bakedSvg } from "@/components/badges/bake";
import { Emblem } from "@/components/icons";
import { useIsoClock } from "@/components/iso";
import { shader } from "@/components/iso/shaders";
import { AppText, BezelOverlay, useBox } from "@/components/ui";
import { PlayerName } from "@/features/game/stage/PlayerName";
import { Burst, Motes } from "@/features/game/stage/light";
import { useOnScreen } from "@/hooks/useOnScreen";
import { fontFamily } from "@/theme";
import { errorHaptic, heavyHaptic, successHaptic, tickHaptic } from "@/utils/haptics";
import {
  BAND,
  CLOSED_H,
  CLOSED_W,
  ENV_H,
  ENV_W,
  FOOT,
  MARK_H,
  MARK_W,
  PAGE_H,
  PAGE_W,
  SLIP_H,
  SLIP_W,
  STAMP_H,
  STAMP_JEWEL,
  STAMP_SPOT,
  STAMP_W,
  closedArt,
  envelopeArt,
  markArt,
  pageArt,
  slipArt,
  stampArt,
  type StampKind,
} from "./art";
import { AURA, LIGHT, rgb, type LightKind } from "./fx";

type SV = SharedValue<number>;

export interface DeskSeat {
  seat: number;
  name: string;
  done: boolean;
}

export type DeskView =
  | {
      kind: "choose";
      labels: Record<StampKind, string>;
      /** What each stamp's mark says. */
      marks: Record<StampKind, string>;
      /** A stamp I may not pick (an agent can't fail an operation). */
      locked: StampKind | null;
      picked: StampKind | null;
      /** What I've played (the hold finished). */
      cast: StampKind | null;
      onPick: (kind: StampKind) => void;
    }
  | { kind: "gather"; seats: DeskSeat[]; band: string }
  | { kind: "reveal"; key: string; success: boolean; fails: number; total: number; mark: string };

export function Desk({ view, hold, paused }: { view: DeskView; hold: SV; paused: boolean }) {
  const [{ w, h }, onLayout] = useBox();
  const onScreen = useOnScreen();
  const clock = useIsoClock(paused || !onScreen);
  return (
    <View style={StyleSheet.absoluteFill} onLayout={onLayout}>
      {w > 0 ? (
        view.kind === "choose" ? (
          <Choose view={view} hold={hold} clock={clock} w={w} h={h} />
        ) : view.kind === "gather" ? (
          <Gather view={view} clock={clock} w={w} h={h} />
        ) : (
          <Reveal key={view.key} view={view} clock={clock} w={w} h={h} />
        )
      ) : null}
    </View>
  );
}

/** How much room the reveal leaves under the file: the verdict's words
 *  (RevealTitle) are written there, in the scene. */
export const REVEAL_FOOT = 56;

/** The verdict's delay into the reveal, for the words under it. */
export const revealDelay = (cards: number) => 600 + cards * 420 + 350;

// ── shared pieces ───────────────────────────────────────────────────

/** An aura round (x, y), radii rx × ry, as strong as `power`. */
function Aura({
  x,
  y,
  rx,
  ry,
  power,
  clock,
  kind,
  seed = 0,
}: {
  x: number;
  y: number;
  rx: number;
  ry: number;
  power: SV;
  clock: SV;
  kind: LightKind;
  seed?: number;
}) {
  const fx = shader(AURA);
  const light = LIGHT[kind];
  const colors = useMemo(() => light.aura.map(rgb), [light]);
  const uniforms = useDerivedValue(() => ({
    t: clock.value + seed * 5.3,
    c: [x, y],
    R: [rx, ry],
    power: power.value,
    mode: light.mode,
    c0: colors[0],
    c1: colors[1],
    c2: colors[2],
  }));
  if (!fx) return null;
  return (
    <Rect x={x - rx * 1.45} y={y - ry * 1.45} width={rx * 2.9} height={ry * 2.9} blendMode="screen">
      <Shader source={fx} uniforms={uniforms} />
    </Rect>
  );
}

/** A soft round glow, breathing with `level`. */
function Glow({ x, y, r, color, level }: { x: number; y: number; r: number; color: string; level: SV }) {
  return (
    <Circle cx={x} cy={y} r={r} opacity={level} blendMode="screen">
      <RadialGradient c={vec(x, y)} r={r} colors={[`${color}CC`, `${color}00`]} />
    </Circle>
  );
}

const PLATE = {
  approve: ["#5ED88A", "#1E8A4A", "#0C4622"],
  seal: ["#E8485A", "#9A1428", "#44060E"],
} as const;

/** A stamp's name on an enamel plate over it. */
function Plate({ kind, label, on, dim }: { kind: StampKind; label: string; on: boolean; dim: boolean }) {
  return (
    <View style={[styles.plate, dim && styles.dim, on && styles.on]}>
      <LinearGradient colors={PLATE[kind] as unknown as [string, string, string]} style={StyleSheet.absoluteFill} />
      <BezelOverlay r={10} t={3} />
      <AppText style={styles.plateText} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

/** The words a stamp leaves, laid over its mark, fading in with it. */
function MarkWords({
  x,
  y,
  width,
  label,
  shown,
  size,
  angle,
}: {
  x: number;
  y: number;
  width: number;
  label: string;
  shown: SV;
  size: number;
  angle: number;
}) {
  const style = useAnimatedStyle(() => ({ opacity: shown.value }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.markWords,
        { left: x - width / 2, top: y - size, width, height: size * 2, transform: [{ rotate: `${angle}deg` }] },
        style,
      ]}
    >
      <AppText style={[styles.markText, { fontSize: size, lineHeight: size * 1.2 }]} numberOfLines={1} adjustsFontSizeToFit>
        {label}
      </AppText>
    </Animated.View>
  );
}

/** Where the open dossier lies on a desk w × h. */
function pageAt(w: number, h: number, share = 0.44, foot = 4) {
  const ps = Math.min((w * 0.82) / PAGE_W, (h * share) / PAGE_H);
  const pw = PAGE_W * ps;
  const ph = (PAGE_H + 4) * ps;
  const x = (w - pw) / 2;
  const y = h - ph - foot;
  return { ps, x, y, w: pw, h: ph, spot: { x: x + STAMP_SPOT.x * ps, y: y + STAMP_SPOT.y * ps } };
}

// ── choose ──────────────────────────────────────────────────────────

const MARK_ANGLE = -8;

function Choose({
  view,
  hold,
  clock,
  w,
  h,
}: {
  view: Extract<DeskView, { kind: "choose" }>;
  hold: SV;
  clock: SV;
  w: number;
  h: number;
}) {
  const { picked, locked, cast } = view;
  const P = pageAt(w, h);
  const plateH = 44;
  const ss = Math.min((P.y - plateH - 6) / STAMP_H, (w * 0.36) / STAMP_W, 1.6);
  const home = { approve: { x: w * 0.28, y: P.y + 6 * P.ps }, seal: { x: w * 0.72, y: P.y + 6 * P.ps } };
  const page = bakedSvg("dossier-page", P.w, P.h, pageArt);

  // the stamps slide in from the sides
  const enter = useSharedValue(0);
  useEffect(() => {
    enter.set(withTiming(1, { duration: 650, easing: Easing.out(Easing.back(1.1)) }));
  }, [enter]);

  // the mark it leaves, and the light settling on it
  const inked = useSharedValue(0);
  const markPower = useSharedValue(0);
  const burst = useSharedValue(0);
  const travel = useSharedValue(0);
  useEffect(() => {
    if (!cast) return;
    const go = 380;
    travel.set(
      withSequence(
        withTiming(1, { duration: go, easing: Easing.in(Easing.quad) }),
        withDelay(220, withTiming(0, { duration: 650, easing: Easing.inOut(Easing.cubic) })),
      ),
    );
    inked.set(withDelay(go, withTiming(1, { duration: 120 })));
    burst.set(withDelay(go, withTiming(1, { duration: 900, easing: Easing.out(Easing.quad) })));
    markPower.set(
      withDelay(go, withSequence(withTiming(0.9, { duration: 260 }), withTiming(0.32, { duration: 1400 }))),
    );
    const thud = setTimeout(() => {
      heavyHaptic();
      if (cast === "approve") successHaptic();
      else errorHaptic();
    }, go);
    return () => clearTimeout(thud);
  }, [cast, travel, inked, burst, markPower]);

  const markW = P.w * 0.44;
  const markH = cast === "seal" ? markW * 0.86 : (markW * MARK_H) / MARK_W;
  const mark = cast ? bakedSvg(`dossier-mark|${cast}`, markW, markH, () => markArt(cast)) : null;
  const markTransform = useDerivedValue(() => [
    { translateX: P.spot.x },
    { translateY: P.spot.y },
    { rotate: (MARK_ANGLE * Math.PI) / 180 },
    { scale: 1 + 0.25 * (1 - inked.value) },
  ]);
  const markOpacity = useDerivedValue(() => inked.value);
  const calm = useDerivedValue(() => inked.value * (0.28 + 0.08 * Math.sin(clock.value * 1.6)));
  const flow = useDerivedValue(() => (picked && !cast ? Math.min(1, hold.value * 1.6) : 0), [picked, cast]);
  const target = picked ? { x: home[picked].x, y: home[picked].y - STAMP_H * ss * 0.5 } : { x: w / 2, y: P.y };

  return (
    <>
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        {page ? <SkImage image={page} x={P.x} y={P.y} width={P.w} height={P.h} /> : null}
        {cast ? (
          <Aura x={P.spot.x} y={P.spot.y} rx={markW * 0.55} ry={markH * 0.62} power={markPower} clock={clock} kind={cast} />
        ) : null}
        {cast ? <Glow x={P.spot.x} y={P.spot.y} r={markW * 0.7} color={LIGHT[cast].glow} level={calm} /> : null}
        {mark ? (
          <Group transform={markTransform}>
            <SkImage image={mark} x={-markW / 2} y={-markH / 2} width={markW} height={markH} opacity={markOpacity} />
          </Group>
        ) : null}
        {(["approve", "seal"] as const).map((kind, i) => (
          <Stamp
            key={kind}
            kind={kind}
            home={home[kind]}
            spot={P.spot}
            scale={ss}
            clock={clock}
            hold={hold}
            enter={enter}
            from={i === 0 ? -1 : 1}
            w={w}
            picked={picked}
            locked={locked === kind}
            cast={cast}
            travel={travel}
          />
        ))}
        <Motes
          clock={clock}
          flow={flow}
          from={{ x0: w * 0.12, x1: w * 0.88, y: h + 40 }}
          to={target}
          color={picked ? LIGHT[picked].glow : "#FFC870"}
        />
        {cast ? <Burst x={P.spot.x} y={P.spot.y} go={burst} color={LIGHT[cast].glow} size={w * 0.42} /> : null}
      </Canvas>
      {cast === "approve" ? (
        <MarkWords
          x={P.spot.x + markW * 0.13}
          y={P.spot.y - markW * 0.03}
          width={markW * 0.5}
          label={view.marks.approve}
          shown={markOpacity}
          size={Math.max(10, markW * 0.1)}
          angle={MARK_ANGLE}
        />
      ) : null}
      {(["approve", "seal"] as const).map((kind) => {
        const top = home[kind].y - STAMP_H * ss;
        return (
          <View
            key={kind}
            pointerEvents="box-none"
            style={[styles.choice, { left: home[kind].x - (STAMP_W * ss) / 2, width: STAMP_W * ss, top: Math.max(0, top - plateH) }]}
          >
            <Plate
              kind={kind}
              label={view.labels[kind]}
              on={picked === kind}
              dim={locked === kind || (picked !== null && picked !== kind)}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={view.labels[kind]}
              accessibilityState={{ selected: picked === kind, disabled: locked === kind }}
              disabled={locked === kind || cast !== null}
              onPress={() => view.onPick(kind)}
              style={{ width: "100%", height: STAMP_H * ss }}
            >
              {locked === kind ? (
                <View style={[styles.lock, { top: STAMP_H * ss * 0.4 }]}>
                  <Emblem emoji="🔒" size={34} />
                </View>
              ) : null}
            </Pressable>
          </View>
        );
      })}
    </>
  );
}

/** A stamp standing on the desk, alive: a slow sway, its jewel glowing;
 *  lifted and charged while held; brought down on the file when played. */
function Stamp({
  kind,
  home,
  spot,
  scale,
  clock,
  hold,
  enter,
  from,
  w,
  picked,
  locked,
  cast,
  travel,
}: {
  kind: StampKind;
  home: { x: number; y: number };
  spot: { x: number; y: number };
  scale: number;
  clock: SV;
  hold: SV;
  enter: SV;
  from: number;
  w: number;
  picked: StampKind | null;
  locked: boolean;
  cast: StampKind | null;
  travel: SV;
}) {
  const image = bakedSvg(`dossier-stamp|${kind}`, STAMP_W * scale, STAMP_H * scale, () => stampArt(kind));
  const mine = picked === kind;
  const played = cast === kind;
  const shownTo = locked ? 0.35 : picked && !mine ? 0.4 : 1;
  const shown = useSharedValue(shownTo);
  useEffect(() => {
    shown.set(withTiming(shownTo, { duration: 350 }));
  }, [shownTo, shown]);
  // full while held; once played it settles
  const settle = useSharedValue(1);
  useEffect(() => {
    if (played) settle.set(withTiming(0, { duration: 260 }));
  }, [played, settle]);
  const power = useDerivedValue(() => (mine ? hold.value * settle.value : 0), [mine]);
  const seed = kind === "approve" ? 1 : 2;

  const transform = useDerivedValue(() => {
    const t = clock.value + seed * 3.1;
    const sway = Math.sin(t * 0.9) * 0.025 * (1 - power.value) + Math.sin(t * 2.3) * 0.006;
    const lift = power.value * 26;
    const k = played ? travel.value : 0;
    const x = home.x + (spot.x - home.x) * k + (1 - enter.value) * from * w * 0.5;
    const y = home.y + (spot.y + STAMP_H * scale * 0.02 - home.y) * k - lift * (1 - k) - Math.sin(Math.PI * k) * 46;
    // squashed a little as it lands
    const squash = k > 0.92 ? 1 - (k - 0.92) * 1.2 : 1;
    return [
      { translateX: x },
      { translateY: y },
      { rotate: sway * (1 - k) },
      { scaleX: scale },
      { scaleY: scale * squash },
      { translateX: -FOOT.x },
      { translateY: -FOOT.y },
    ];
  }, [played, mine]);
  const opacity = useDerivedValue(() => shown.value);
  const jewel = useDerivedValue(
    () => shown.value * (0.35 + 0.25 * Math.sin(clock.value * 1.9 + seed) + 0.6 * power.value),
  );
  const light = LIGHT[kind];
  return (
    <>
      <Aura
        x={home.x}
        y={home.y - STAMP_H * scale * 0.55}
        rx={STAMP_W * scale * 0.5}
        ry={STAMP_H * scale * 0.55}
        power={power}
        clock={clock}
        kind={kind}
        seed={seed}
      />
      <Group transform={transform}>
        <Circle cx={STAMP_JEWEL.x} cy={STAMP_JEWEL.y} r={30} opacity={jewel} blendMode="screen">
          <RadialGradient c={vec(STAMP_JEWEL.x, STAMP_JEWEL.y)} r={30} colors={[`${light.glow}CC`, `${light.glow}00`]} />
        </Circle>
        {image ? <SkImage image={image} x={0} y={0} width={STAMP_W} height={STAMP_H} opacity={opacity} /> : null}
      </Group>
    </>
  );
}

// ── gather ──────────────────────────────────────────────────────────

function Gather({
  view,
  clock,
  w,
  h,
}: {
  view: Extract<DeskView, { kind: "gather" }>;
  clock: SV;
  w: number;
  h: number;
}) {
  const seats = view.seats;
  const done = seats.filter((seat) => seat.done).length;
  const share = seats.length ? done / seats.length : 0;
  const rowH = 74;
  const cs = Math.min((h - rowH - 16) / CLOSED_H, (w * 0.52) / CLOSED_W);
  const cw = CLOSED_W * cs;
  const ch = CLOSED_H * cs;
  const cx = w / 2;
  const top = Math.max(0, (h - rowH - ch) * 0.4);
  const file = bakedSvg("dossier-closed", cw, ch, closedArt);
  const es = Math.min(1.2, (w * 0.9) / (seats.length * (ENV_W + 14)));
  const sealed = bakedSvg("dossier-env|sealed", ENV_W * es, ENV_H * es, () => envelopeArt(true));
  const open = bakedSvg("dossier-env|open", ENV_W * es, ENV_H * es, () => envelopeArt(false));

  const step = Math.min(w * 0.9 / Math.max(seats.length, 1), (ENV_W + 22) * es);
  const envs = seats.map((seat, i) => ({ ...seat, x: cx + (i - (seats.length - 1) / 2) * step, y: h - rowH + 4 }));

  const appear = useSharedValue(0);
  const lit = useSharedValue(0.15 + 0.3 * share);
  const flow = useSharedValue(0);
  const power = useSharedValue(0);
  useEffect(() => {
    appear.set(withTiming(1, { duration: 600 }));
  }, [appear]);
  useEffect(() => {
    lit.set(withTiming(0.15 + 0.3 * share, { duration: 700 }));
    if (done > 0) {
      tickHaptic();
      flow.set(withSequence(withTiming(0.8, { duration: 250 }), withTiming(0, { duration: 1300 })));
      power.set(withSequence(withTiming(0.2 + 0.25 * share, { duration: 300 }), withTiming(0, { duration: 1500 })));
    }
  }, [done, share, lit, flow, power]);
  const level = useDerivedValue(() => appear.value * (lit.value + 0.05 * Math.sin(clock.value * 1.4)));
  const fileOpacity = useDerivedValue(() => appear.value);
  const first = envs[0];
  const last = envs[envs.length - 1];
  const fileMid = top + ch * 0.45;
  return (
    <>
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        <Glow x={cx} y={fileMid} r={cw * 0.95} color={LIGHT.lamp.glow} level={level} />
        <Aura x={cx} y={fileMid} rx={cw * 0.55} ry={ch * 0.55} power={power} clock={clock} kind="lamp" />
        {file ? <SkImage image={file} x={cx - cw / 2} y={top} width={cw} height={ch} opacity={fileOpacity} /> : null}
        {envs.length > 0 ? (
          <Motes
            clock={clock}
            flow={flow}
            from={{ x0: first.x, x1: last.x, y: first.y }}
            to={{ x: cx, y: fileMid }}
            color="#FFD58A"
            count={28}
          />
        ) : null}
        {envs.map((e) => {
          const image = e.done ? sealed : open;
          return image ? (
            <SkImage
              key={e.seat}
              image={image}
              x={e.x - (ENV_W * es) / 2}
              y={e.y}
              width={ENV_W * es}
              height={ENV_H * es}
              opacity={e.done ? 1 : 0.55}
            />
          ) : null;
        })}
      </Canvas>
      <View
        pointerEvents="none"
        style={[
          styles.band,
          {
            left: cx - cw / 2,
            width: cw,
            top: top + (BAND.y + BAND.h / 2) * cs - 9,
            transform: [{ rotate: `${BAND.angle}deg` }],
          },
        ]}
      >
        <AppText style={[styles.bandText, { fontSize: Math.max(10, 11 * cs) }]} numberOfLines={1}>
          {view.band}
        </AppText>
      </View>
      {envs.map((e) => (
        <PlayerName
          key={e.seat}
          name={e.name}
          style={[styles.name, { left: e.x - 36, top: e.y + ENV_H * es + 1, opacity: e.done ? 1 : 0.6 }]}
        />
      ))}
    </>
  );
}

// ── reveal ──────────────────────────────────────────────────────────

/** The same shuffle for the same reveal: the cards come out in no one's
 *  order. */
function shuffled(total: number, fails: number, key: string) {
  const cards = Array.from({ length: total }, (_, i) => i >= total - fails);
  let s = 0;
  for (const c of key) s = (s * 31 + c.charCodeAt(0)) % 2147483647;
  for (let i = cards.length - 1; i > 0; i--) {
    s = (s * 48271) % 2147483647;
    const j = s % (i + 1);
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

function Reveal({
  view,
  clock,
  w,
  h,
}: {
  view: Extract<DeskView, { kind: "reveal" }>;
  clock: SV;
  w: number;
  h: number;
}) {
  const { success, fails, total } = view;
  const kind: StampKind = success ? "approve" : "seal";
  const P = pageAt(w, h, 0.42, REVEAL_FOOT);
  const cards = useMemo(() => shuffled(total, fails, view.key), [total, fails, view.key]);
  const n = cards.length;
  const sc = Math.min(1.35, (w * 0.86) / (n * SLIP_W + (n - 1) * 10), (P.y - 24) / SLIP_H);
  const sw = SLIP_W * sc;
  const sh = SLIP_H * sc;
  const gap = 10 * sc;
  const rowY = Math.max(4, (P.y - sh) * 0.45);
  const slipX = (i: number) => w / 2 + (i - (n - 1) / 2) * (sw + gap);
  const markW = P.w * 0.52;
  const markH = kind === "seal" ? markW * 0.86 : (markW * MARK_H) / MARK_W;
  const page = bakedSvg("dossier-page", P.w, P.h, pageArt);
  const back = bakedSvg("dossier-slip|back", sw, sh, () => slipArt("back"));
  const good = bakedSvg("dossier-slip|success", sw, sh, () => slipArt("success"));
  const bad = bakedSvg("dossier-slip|fail", sw, sh, () => slipArt("fail"));
  // baked as big as it lands; it falls from bigger, softer for a moment
  const mark = bakedSvg(`dossier-mark|${kind}`, markW, markH, () => markArt(kind));
  const T = revealDelay(n);

  const out = useSharedValue(0);
  const fall = useSharedValue(0);
  const power = useSharedValue(0);
  const burst = useSharedValue(0);
  useEffect(() => {
    out.set(withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
    fall.set(withDelay(T - 300, withTiming(1, { duration: 300, easing: Easing.in(Easing.quad) })));
    burst.set(withDelay(T, withTiming(1, { duration: 1100, easing: Easing.out(Easing.quad) })));
    power.set(withDelay(T, withSequence(withTiming(1, { duration: 500 }), withTiming(0.55, { duration: 1600 }))));
    const ticks = Array.from({ length: n }, (_, i) => setTimeout(tickHaptic, 600 + i * 420 + 150));
    const thud = setTimeout(() => {
      heavyHaptic();
      if (success) successHaptic();
      else errorHaptic();
    }, T);
    return () => {
      ticks.forEach(clearTimeout);
      clearTimeout(thud);
    };
  }, [T, n, success, out, fall, power, burst]);

  const markTransform = useDerivedValue(() => {
    const k = fall.value;
    return [
      { translateX: P.spot.x - P.w * 0.08 },
      { translateY: P.spot.y - P.h * 0.08 },
      { rotate: (MARK_ANGLE * Math.PI) / 180 },
      { scale: 2.4 - 1.4 * k },
    ];
  });
  const markOpacity = useDerivedValue(() => Math.min(1, fall.value * 3));
  const calm = useDerivedValue(() => burst.value > 0 ? 0.3 + 0.08 * Math.sin(clock.value * 1.6) : 0);
  const cx = P.spot.x - P.w * 0.08;
  const cy = P.spot.y - P.h * 0.08;
  return (
    <>
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        {page ? <SkImage image={page} x={P.x} y={P.y} width={P.w} height={P.h} /> : null}
        <Aura x={cx} y={cy} rx={markW * 0.55} ry={markH * 0.62} power={power} clock={clock} kind={kind} />
        <Glow x={cx} y={cy} r={markW * 0.75} color={LIGHT[kind].glow} level={calm} />
        {cards.map((fail, i) => (
          <Slip
            key={i}
            x={slipX(i)}
            y={rowY}
            w={sw}
            h={sh}
            from={{ x: w / 2, y: P.y + P.h * 0.4 }}
            out={out}
            delay={600 + i * 420}
            back={back}
            face={fail ? bad : good}
          />
        ))}
        {mark ? (
          <Group transform={markTransform}>
            <SkImage image={mark} x={-markW / 2} y={-markH / 2} width={markW} height={markH} opacity={markOpacity} />
          </Group>
        ) : null}
        <Burst x={cx} y={cy} go={burst} color={LIGHT[kind].glow} size={w * 0.55} />
      </Canvas>
      {success ? (
        <MarkWords
          x={cx + markW * 0.13}
          y={cy - markW * 0.03}
          width={markW * 0.5}
          label={view.mark}
          shown={markOpacity}
          size={Math.max(11, markW * 0.1)}
          angle={MARK_ANGLE}
        />
      ) : null}
    </>
  );
}

/** A played card: out of the file face down, then turned over. */
function Slip({
  x,
  y,
  w,
  h,
  from,
  out,
  delay,
  back,
  face,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  from: { x: number; y: number };
  out: SV;
  delay: number;
  back: ReturnType<typeof bakedSvg>;
  face: ReturnType<typeof bakedSvg>;
}) {
  const turn = useSharedValue(0);
  useEffect(() => {
    turn.set(withDelay(delay, withTiming(1, { duration: 360, easing: Easing.inOut(Easing.quad) })));
  }, [delay, turn]);
  const transform = useDerivedValue(() => {
    const k = out.value;
    const flip = Math.abs(Math.cos(turn.value * Math.PI));
    return [
      { translateX: from.x + (x - from.x) * k },
      { translateY: from.y + (y + h / 2 - from.y) * k },
      { scaleX: Math.max(0.02, flip) * (0.4 + 0.6 * k) },
      { scaleY: 0.4 + 0.6 * k },
    ];
  });
  const backOpacity = useDerivedValue(() => (turn.value < 0.5 ? 1 : 0));
  const faceOpacity = useDerivedValue(() => (turn.value >= 0.5 ? 1 : 0));
  return (
    <Group transform={transform}>
      {back ? <SkImage image={back} x={-w / 2} y={-h / 2} width={w} height={h} opacity={backOpacity} /> : null}
      {face ? <SkImage image={face} x={-w / 2} y={-h / 2} width={w} height={h} opacity={faceOpacity} /> : null}
    </Group>
  );
}

/** The lines under the stage during a reveal, fading in as it lands. */
export function RevealTitle({
  title,
  detail,
  good,
  delay = 1400,
}: {
  title: string;
  detail?: string;
  good: boolean;
  delay?: number;
}) {
  return (
    <Animated.View entering={FadeIn.delay(delay).duration(500)} style={styles.reveal}>
      <AppText style={[styles.revealTitle, { color: good ? "#8CFFB0" : "#FF8A94" }]} numberOfLines={1}>
        {title}
      </AppText>
      {detail ? (
        <AppText style={styles.revealDetail} numberOfLines={2}>
          {detail}
        </AppText>
      ) : null}
    </Animated.View>
  );
}

const shadow = {
  textShadowColor: "rgba(0,0,0,0.9)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 3,
};

const styles = StyleSheet.create({
  choice: { position: "absolute", alignItems: "center" },
  lock: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  plate: {
    marginBottom: 8,
    minWidth: 104,
    height: 34,
    paddingHorizontal: 16,
    borderRadius: 10,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  dim: { opacity: 0.45 },
  on: { transform: [{ scale: 1.08 }] },
  plateText: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    lineHeight: 19,
    letterSpacing: 1,
    color: "#FFF6E6",
    textTransform: "uppercase",
    ...shadow,
  },
  markWords: { position: "absolute", alignItems: "center", justifyContent: "center" },
  markText: { fontFamily: fontFamily.bold, color: "#1E8A4A", letterSpacing: 1, textTransform: "uppercase" },
  band: { position: "absolute", height: 18, alignItems: "center", justifyContent: "center" },
  bandText: { fontFamily: fontFamily.bold, color: "#FFF2F0", letterSpacing: 2.5, textTransform: "uppercase" },
  name: {
    position: "absolute",
    width: 72,
    textAlign: "center",
    fontFamily: fontFamily.semiBold,
    fontSize: 10.5,
    lineHeight: 13,
    color: "#F1E6D2",
    ...shadow,
  },
  reveal: { alignItems: "center", gap: 2 },
  revealTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    lineHeight: 27,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    ...shadow,
  },
  revealDetail: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
    color: "#F1E6D2",
    textAlign: "center",
    ...shadow,
  },
});
