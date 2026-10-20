import type { GameCatalogEntry } from "@/data/types";
import type { GameType } from "@/games/types";
import { BANK_SIZE, bankEntry, buildBanks, findFloor, floorKey, floorOfGame, oftenPlayed } from "../banks";

const game = (id: string, type: GameType): GameCatalogEntry & { type: GameType } => ({
  id,
  name: id,
  emoji: "🎲",
  tileColor: "#fff",
  category: "classic",
  tagKey: "classic",
  minPlayers: 2,
  maxPlayers: 6,
  type,
});

const typeOf = (g: GameCatalogEntry) => (g as ReturnType<typeof game>).type;

describe("the lift's banks", () => {
  const games = [
    game("ttt", "duel"),
    game("manor", "deduction"),
    game("coup", "bluff"),
    ...Array.from({ length: 8 }, (_, i) => game(`d${i}`, "deduction")),
  ];

  it("groups the floors by kind in the fixed order, a bank at most seven", () => {
    const b = buildBanks(games, { typeOf });
    expect(b.banks.map((k) => [k.kind, k.part, k.start, k.size])).toEqual([
      ["deduction", 0, 0, BANK_SIZE],
      ["deduction", 1, 7, 2],
      ["bluff", 0, 9, 1],
      ["duel", 0, 10, 1],
    ]);
    // the server's order within a kind
    expect(b.floors.slice(0, 3).map((f) => f.game.id)).toEqual(["manor", "d0", "d1"]);
    expect(b.floors[8]).toMatchObject({ bank: 1, slot: 1 });
  });

  it("puts the games I play most first, also on their own banks", () => {
    const played = { coup: 9, ttt: 3, d4: 3, manor: 0 };
    expect(oftenPlayed(games, played).map((g) => g.id)).toEqual(["coup", "ttt", "d4"]);
    const b = buildBanks(games, { typeOf, played });
    expect(b.banks[0]).toMatchObject({ kind: "often", start: 0, size: 3 });
    expect(b.floors.length).toBe(games.length + 3);
    expect(b.floors.filter((f) => f.game.id === "coup").map((f) => f.often)).toEqual([true, true]);
    expect(b.floors.find((f) => f.game.id === "manor")?.often).toBe(false);
    // nothing played: no Your floors
    expect(buildBanks(games, { typeOf, played: {} }).banks[0].kind).toBe("deduction");
  });

  it("finds a remembered floor again, also from before the banks", () => {
    const b = buildBanks(games, { typeOf, played: { coup: 2 } });
    const i = b.floors.findIndex((f, k) => k > 0 && f.game.id === "coup");
    expect(findFloor(b, floorKey(b, i))).toBe(i);
    expect(findFloor(b, floorKey(b, 0))).toBe(0);
    expect(findFloor(b, "coup")).toBe(0);
    expect(findFloor(b, "gone|nothing")).toBe(0);
  });

  it("flips to the first floor that fits on the next bank that has one", () => {
    const b = buildBanks(games, { typeOf });
    const fits = b.floors.map((f) => f.game.id !== "coup" && f.game.id !== "d6");
    expect(bankEntry(b, fits, 1, 1)).toBe(8);
    expect(bankEntry(b, fits, 2, 1)).toBe(10);
    expect(bankEntry(b, fits, 2, -1)).toBe(8);
    expect(bankEntry(b, fits, 0, 1)).toBe(0);
    expect(bankEntry(b, fits, 4, 1)).toBe(-1);
  });
});

describe("a game's floor", () => {
  it("is its place on its own kind's bank, not on Your floors", () => {
    const games = [game("a", "deduction"), game("b", "bluff"), game("c", "duel")];
    const b = buildBanks(games, { typeOf, played: { c: 4 } });
    expect(floorOfGame(b, "c")).toBe(4);
    expect(floorOfGame(b, "b")).toBe(3);
    expect(floorOfGame(b, "zzz")).toBe(1);
  });
});
