// A mascot's head and shoulders, still: for the profile circle, friend
// lists, the lobby and the tab bar.

import { useMemo } from "react";

import type { MascotLook } from "@/api/client";
import { EmblemGlyph } from "@/components/engraved";
import { BOX, PORTRAIT, asLook, dress } from "./dress";

export function MascotPortrait({ look, size }: { look?: MascotLook | null; size: number }) {
  const data = useMemo(() => dress(asLook(look)), [look]);
  return <EmblemGlyph data={data} size={size} box={BOX} view={PORTRAIT} />;
}
