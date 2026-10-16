// Shaders compiled once each and shared: every flame, beam and candle
// using the same SkSL draws with the same compiled effect, instead of
// each compiling its own when it mounts. Made on first use (Jest has no
// Skia), so call it from a component, never at the top of a module.

import { onMemoryWarning } from "@/utils/memory";
import { Skia, type SkRuntimeEffect } from "@shopify/react-native-skia";

const compiled = new Map<string, SkRuntimeEffect | null>();
onMemoryWarning(() => compiled.clear());

export function shader(sksl: string): SkRuntimeEffect | null {
  if (!compiled.has(sksl)) compiled.set(sksl, Skia.RuntimeEffect.Make(sksl));
  return compiled.get(sksl)!;
}
