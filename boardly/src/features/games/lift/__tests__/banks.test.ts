import type { GameCatalogEntry } from "@/data/types";
import type { GameType } from "@/games/types";
import { BANK_SIZE, bankEntry, buildBanks, findFloor, floorKey, floorOfGame } from "../banks";

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

  it("has only banks by kind, each game on one floor", () => {
    const b = buildBanks(games, { typeOf });
    expect(b.floors.length).toBe(games.length);
    expect(b.banks.every((k) => k.kind !== ("often" as string))).toBe(true);
    expect(new Set(b.floors.map((f) => f.game.id)).size).toBe(games.length);
  });

  it("finds a remembered floor again, also from before the banks", () => {
    const b = buildBanks(games, { typeOf });
    const coup = b.floors.findIndex((f) => f.game.id === "coup");
    expect(findFloor(b, floorKey(b, coup))).toBe(coup);
    expect(findFloor(b, floorKey(b, 0))).toBe(0);
    expect(findFloor(b, "coup")).toBe(coup);
    expect(findFloor(b, "gone|nothing")).toBe(0);
    expect(findFloor(b, null)).toBe(0);
  });

  it("finds a floor saved on the old often-played bank on its own kind's bank", () => {
    const b = buildBanks(games, { typeOf });
    expect(findFloor(b, "often|coup")).toBe(b.floors.findIndex((f) => f.game.id === "coup"));
    expect(b.banks[b.floors[findFloor(b, "often|ttt")].bank].kind).toBe("duel");
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
  it("is its place in the building, counting up through the banks", () => {
    const games = [game("a", "deduction"), game("b", "bluff"), game("c", "duel")];
    const b = buildBanks(games, { typeOf });
    expect(floorOfGame(b, "c")).toBe(3);
    expect(floorOfGame(b, "b")).toBe(2);
    expect(floorOfGame(b, "zzz")).toBe(1);
  });
});
