// Borders that can't be bought: each comes with a game's legendary
// badge (see EARNED_BORDERS on the server).

import {
  BlurMask,
  Circle,
  DashPathEffect,
  Group,
  LinearGradient,
  Path,
  RoundedRect,
  SweepGradient,
  vec,
} from "@shopify/react-native-skia";
import { useMemo } from "react";
import { useDerivedValue } from "react-native-reanimated";

import { Fire } from "@/components/iso";
import { MEEPLE_PATH } from "@/components/tabletop/Meeple";
import {
  Band,
  Flicker,
  Glint,
  Halo,
  Sparks,
  TAU,
  polar,
  rnd,
  type ArtBorderDrawing,
  type Clock,
} from "./kit";

// ── Seal Keeper's Halo: a ring of candles round the turning seal ─────

function SealRing({ t }: { t: Clock }) {
  const turn = useDerivedValue(() => [{ rotate: t.value * 0.25 }]);
  const runes = useMemo(
    () =>
      Array.from({ length: 24 }, (_, k) => {
        const a = (k / 24) * TAU;
        const p0 = polar(a, 58);
        const p1 = polar(a, k % 2 ? 62 : 64);
        return `M${p0.x} ${p0.y}L${p1.x} ${p1.y}`;
      }).join(""),
    [],
  );
  return (
    <Group transform={turn} origin={vec(0, 0)}>
      <Circle
        cx={0}
        cy={0}
        r={60}
        style="stroke"
        strokeWidth={1.4}
        color="#F6D27A"
      >
        <DashPathEffect intervals={[6, 3]} />
      </Circle>
      <Path path={runes} style="stroke" strokeWidth={1.2} color="#F6D27A" />
      <Circle
        cx={0}
        cy={0}
        r={66}
        style="stroke"
        strokeWidth={0.8}
        color="#F6D27A99"
      />
    </Group>
  );
}

function Candle({ t, a, i }: { t: Clock; a: number; i: number }) {
  const p = polar(a, 74);
  const h = 9 + rnd(i) * 5;
  return (
    <Group transform={[{ translateX: p.x }, { translateY: p.y }]}>
      <RoundedRect x={-2.6} y={-h / 2} width={5.2} height={h} r={1.2}>
        <LinearGradient
          start={vec(-2.6, 0)}
          end={vec(2.6, 0)}
          colors={["#FFF6E0", "#D9C9A6"]}
        />
      </RoundedRect>
      <Flicker t={t} x={0} y={-h / 2 - 1} size={7} phase={i * 1.7} />
    </Group>
  );
}

const SealHalo: ArtBorderDrawing = {
  back: ({ t }) => (
    <Group>
      <Halo r={90} color="#FFB45E" opacity={0.45} />
      <SealRing t={t} />
    </Group>
  ),
  front: ({ t }) => (
    <Group>
      <Band r={53} width={5} colors={["#F6D27A", "#9A6B1E"]} />
      {Array.from({ length: 10 }, (_, i) => (
        <Candle key={i} t={t} a={(i / 10) * TAU - Math.PI / 2} i={i} />
      ))}
    </Group>
  ),
};

// ── Last Winter Hearth: frost outside, a fire glowing inside ─────────

const FROST = Array.from({ length: 14 }, (_, i) => ({
  a: (i / 14) * TAU + rnd(i) * 0.15,
  len: 10 + rnd(i + 2) * 14,
}));

function WinterHearthBack({ t }: { t: Clock }) {
  const warm = useDerivedValue(
    () => 0.5 + 0.18 * Math.sin(t.value * 6.1) * Math.sin(t.value * 2.3),
  );
  return (
    <Group>
      <Halo r={72} color="#FF8A2A" opacity={warm} />
      {FROST.map((f, i) => (
        <Group
          key={i}
          transform={[{ rotate: f.a + Math.PI / 2 }, { translateY: -58 }]}
        >
          <Path
            path={`M0 0L3 -${f.len * 0.45}L0 -${f.len}L-3 -${f.len * 0.45}z`}
          >
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, -f.len)}
              colors={["#6FC8FF", "#FFFFFF"]}
            />
          </Path>
        </Group>
      ))}
      {[-0.35, 0, 0.35].map((da, k) => (
        <Group key={k} transform={[{ rotate: Math.PI / 2 + da + Math.PI / 2 }]}>
          <Fire
            x={0}
            y={-50}
            width={16}
            height={26 - Math.abs(da) * 20}
            clock={t}
          />
        </Group>
      ))}
    </Group>
  );
}

const WinterHearth: ArtBorderDrawing = {
  back: WinterHearthBack,
  front: () => (
    <Band r={53} width={6} colors={["#E8FBFF", "#FF9A4D"]} rim="#3A2216" />
  ),
};

// ── Spymaster's Reticle: a turning crosshair, a scanning sweep ───────

function SpymasterBack({ t }: { t: Clock }) {
  const scan = useDerivedValue(() => [{ rotate: t.value * 1.4 }]);
  return (
    <Group>
      <Halo r={86} color="#2FE3C8" opacity={0.3} />
      <Group transform={scan} origin={vec(0, 0)}>
        <Circle cx={0} cy={0} r={76} blendMode="screen">
          <SweepGradient
            c={vec(0, 0)}
            colors={["#2FE3C800", "#2FE3C800", "#2FE3C800", "#2FE3C8AA"]}
          />
        </Circle>
      </Group>
    </Group>
  );
}

function SpymasterFront({ t }: { t: Clock }) {
  const turn = useDerivedValue(() => [{ rotate: t.value * 0.4 }]);
  const turnBack = useDerivedValue(() => [{ rotate: -t.value * 0.7 }]);
  const dot = useDerivedValue(() => (Math.sin(t.value * 6) > 0 ? 1 : 0.15));
  return (
    <Group>
      <Band r={53} width={3} colors={["#2FE3C8", "#0E6E62"]} />
      <Group transform={turn} origin={vec(0, 0)}>
        <Circle
          cx={0}
          cy={0}
          r={62}
          style="stroke"
          strokeWidth={2}
          color="#2FE3C8"
        >
          <DashPathEffect intervals={[22, 9]} />
        </Circle>
        {[0, 1, 2, 3].map((k) => {
          const a = (k / 4) * TAU;
          const p0 = polar(a, 56);
          const p1 = polar(a, 72);
          return (
            <Path
              key={k}
              path={`M${p0.x} ${p0.y}L${p1.x} ${p1.y}`}
              style="stroke"
              strokeWidth={2.4}
              color="#B8FFF4"
              strokeCap="round"
            />
          );
        })}
      </Group>
      <Group transform={turnBack} origin={vec(0, 0)}>
        <Circle
          cx={0}
          cy={0}
          r={78}
          style="stroke"
          strokeWidth={1}
          color="#2FE3C8AA"
        >
          <DashPathEffect intervals={[3, 5]} />
        </Circle>
      </Group>
      <Circle cx={44} cy={-44} r={3} color="#FF3B3B" opacity={dot}>
        <BlurMask blur={1.5} style="solid" />
      </Circle>
    </Group>
  );
}

const Spymaster: ArtBorderDrawing = {
  back: SpymasterBack,
  front: SpymasterFront,
};

// ── Legend of the Table: a gold laurel, a meeple crest ───────────────

const LEAVES = Array.from({ length: 22 }, (_, k) => {
  const side = k < 11 ? -1 : 1;
  const j = k % 11;
  // from the foot up each side to near the top
  const a = Math.PI / 2 + side * (0.25 + j * 0.24);
  return { a, side, j };
});

function TableLegendFront({ t }: { t: Clock }) {
  const shine = useDerivedValue(() => [{ rotate: t.value * 0.9 }]);
  return (
    <Group>
      <Band r={53} width={5} colors={["#FFF0B0", "#C9921E"]} rim="#7A4E1C" />
      {LEAVES.map(({ a, side, j }, k) => {
        const p = polar(a, 64);
        return (
          <Group
            key={k}
            transform={[
              { translateX: p.x },
              { translateY: p.y },
              { rotate: a + side * 0.9 },
            ]}
          >
            <Path
              path="M0 0C3 -3 9 -3 12 0C9 3 3 3 0 0z"
              opacity={1 - j * 0.03}
            >
              <LinearGradient
                start={vec(0, -3)}
                end={vec(0, 3)}
                colors={["#FFE9A0", "#C9921E"]}
              />
            </Path>
          </Group>
        );
      })}
      {/* the crest */}
      <Group transform={[{ translateX: -12 }, { translateY: -88 }]}>
        <Path path={MEEPLE_PATH}>
          <LinearGradient
            start={vec(0, 2)}
            end={vec(0, 22)}
            colors={["#FFF0B0", "#E0A82E", "#9A6B1E"]}
          />
        </Path>
        <Path
          path={MEEPLE_PATH}
          style="stroke"
          strokeWidth={0.9}
          color="#7A4E1C"
        />
      </Group>
      <Group
        transform={shine}
        origin={vec(0, 0)}
        blendMode="screen"
        opacity={0.5}
      >
        <Circle cx={0} cy={0} r={70} style="stroke" strokeWidth={14}>
          <SweepGradient
            c={vec(0, 0)}
            colors={["#FFFFFF00", "#FFFFFF00", "#FFFFFFAA", "#FFFFFF00"]}
          />
        </Circle>
      </Group>
      <Glint t={t} x={-50} y={-62} size={5} phase={0.3} />
      <Glint t={t} x={56} y={-50} size={4} phase={2.1} />
    </Group>
  );
}

const TableLegend: ArtBorderDrawing = {
  back: ({ t }) => (
    <Group>
      <Halo r={88} color="#FFC94A" opacity={0.45} />
      <Sparks
        t={t}
        count={6}
        from={-Math.PI}
        to={0}
        r={66}
        rise={20}
        color="#FFE08A"
        seed={9}
      />
    </Group>
  ),
  front: TableLegendFront,
};

export const EARNED_ART = {
  "seal-halo": SealHalo,
  "winter-hearth": WinterHearth,
  spymaster: Spymaster,
  "table-legend": TableLegend,
};
