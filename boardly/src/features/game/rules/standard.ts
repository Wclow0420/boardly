// The standard every game's "How to play" follows, so a player who knows
// one game's rules knows where to look in any other: the same sections,
// with the same names, always in this order. A game includes only the
// sections it has (no teams, no rooms, no events: those are left out).
//
//   overview — what the game is, how you win, how long it takes
//   teams    — the sides and how each one wins (games with sides)
//   roles    — who you might be, grouped by team
//   play     — how a round goes, step by step
//   actions  — the moves you can make
//   rooms    — the places in the game (games with places)
//   events   — things that change a round (night events…)
//   counts   — what changes with the number of players

export const RULE_SECTIONS = ["overview", "teams", "roles", "play", "actions", "rooms", "events", "counts"] as const;
export type RuleSection = (typeof RULE_SECTIONS)[number];

/** Each section's emblem, on its tab and its title. */
export const SECTION_EMBLEM: Record<RuleSection, string> = {
  overview: "📖",
  teams: "⚔️",
  roles: "🎭",
  play: "🎲",
  actions: "👆",
  rooms: "🚪",
  events: "🌙",
  counts: "👥",
};
