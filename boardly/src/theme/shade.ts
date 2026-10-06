/** Darkens (amount < 0) or lightens (amount > 0) a "#RRGGBB" colour by
 *  a fraction, e.g. shade("#F9A23B", -0.25). Other formats pass through. */
export function shade(hex: string, amount: number): string {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) return hex;
  const value = parseInt(match[1], 16);
  const channel = (shift: number) => {
    const c = (value >> shift) & 0xff;
    const next = amount < 0 ? c * (1 + amount) : c + (255 - c) * amount;
    return Math.max(0, Math.min(255, Math.round(next)));
  };
  const out = (channel(16) << 16) | (channel(8) << 8) | channel(0);
  return `#${out.toString(16).padStart(6, "0")}`;
}
