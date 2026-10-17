import { coup } from "@/games/coup";
import { placeSpots, roomLayout, signLayout } from "../layout";
import { qrEncode, qrPath } from "../qr";
import { lobbyStatus, nameList, type StatusPerson } from "../status";

/** A stand-in for i18next: the key and its options, to assert on. */
const t = (key: string, o?: Record<string, unknown>) => (o ? `${key}${JSON.stringify(o)}` : key);

describe("the QR encoder", () => {
  it("sizes the code by the length of the text (level M)", () => {
    expect(qrEncode("hello")?.size).toBe(21);
    expect(qrEncode("https://boardly.lol/join/K7QX2P")?.size).toBe(29);
    expect(qrEncode("x".repeat(120))?.size).toBe(45);
    expect(qrEncode("x".repeat(400))).toBeNull();
  });

  it("draws the three finder patterns and the timing lines", () => {
    const code = qrEncode("boardly-dev://join/ABC123");
    expect(code).not.toBeNull();
    const { size, modules: m } = code!;
    for (const [x, y] of [
      [0, 0],
      [size - 7, 0],
      [0, size - 7],
    ]) {
      // dark ring, light ring, dark 3 × 3 core
      expect(m[y][x]).toBe(true);
      expect(m[y + 6][x + 6]).toBe(true);
      expect(m[y + 1][x + 1]).toBe(false);
      expect(m[y + 3][x + 3]).toBe(true);
    }
    for (let i = 8; i < size - 8; i++) {
      expect(m[6][i]).toBe(i % 2 === 0);
      expect(m[i][6]).toBe(i % 2 === 0);
    }
    // the dark module beside the lower format bits
    expect(m[size - 8][8]).toBe(true);
  });

  it("is the same code every time, and its path covers each dark module once", () => {
    const a = qrEncode("https://boardly.lol/join/ZZZZZZ");
    const b = qrEncode("https://boardly.lol/join/ZZZZZZ");
    expect(a).toEqual(b);
    const dark = a!.modules.flat().filter(Boolean).length;
    const covered = [...qrPath(a!).matchAll(/h(\d+)/g)].reduce((n, [, w]) => n + Number(w), 0);
    expect(covered).toBe(dark);
  });
});

describe("the floor lobby's layout", () => {
  it("places one row up to five, then a smaller back row in the front row's gaps", () => {
    expect(placeSpots(4, 420, 280, 560, 40).every((s) => s.row === 1)).toBe(true);
    const six = placeSpots(6, 420, 280, 560, 40);
    expect(six.filter((s) => s.row === 1)).toHaveLength(4);
    expect(six.filter((s) => s.row === 0)).toHaveLength(2);
    const front = six.filter((s) => s.row === 1);
    const back = six.filter((s) => s.row === 0);
    expect(back[0].size).toBeLessThan(front[0].size);
    expect(back[0].y).toBeLessThan(front[0].y);
    // the first seats are at the front
    expect(six[0].row).toBe(1);
    expect(placeSpots(10, 420, 280, 560, 40)).toHaveLength(10);
  });

  it.each([
    [375, 520],
    [420, 566],
  ])("keeps the door, the board and the table on the wall at %ix%i", (w, h) => {
    const R = roomLayout(w, h, 6);
    expect(R.door.y + R.door.h).toBe(R.floorY);
    expect(R.board.x).toBeGreaterThan(R.door.x + R.door.w);
    expect(R.board.y + R.board.h).toBeLessThan(R.table.y);
    expect(R.board.x + R.board.w).toBeLessThanOrEqual(w);
    // the lamps hang above the door and the board
    for (const s of R.spots) expect(s.lantern.y).toBeLessThan(R.door.y);
    const S = signLayout(w, 50);
    expect(S.qr.x + S.qr.s).toBeLessThanOrEqual(w);
    expect(S.plate.y).toBeGreaterThan(S.frieze.y + S.frieze.h);
  });
});

describe("the line over the plinth", () => {
  const P = (name: string, ready: boolean, host = false, me = false): StatusPerson => ({ name, ready, host, me });

  it("asks for more players first", () => {
    expect(lobbyStatus([P("Jo", true, true, true)], 2, t).text).toBe('lobby.floor.needMore{"count":1}');
  });

  it("names who isn't ready, you first", () => {
    const s = lobbyStatus([P("Jo", true, true), P("Ada", false), P("Me", false, false, true)], 2, t);
    expect(s.ready).toBe(false);
    expect(s.text).toContain("lobby.floor.waitingOn");
    expect(s.text).toContain('lobby.floor.two{\\"a\\":\\"lobby.floor.you\\",\\"b\\":\\"Ada\\"}');
  });

  it("tells the host to start, and everyone else who they wait for", () => {
    const all = [P("Jo", false, true), P("Ada", true)];
    expect(lobbyStatus(all.map((p, i) => ({ ...p, me: i === 0 })), 2, t).text).toBe("lobby.floor.canStart");
    expect(lobbyStatus(all.map((p, i) => ({ ...p, me: i === 1 })), 2, t).text).toBe('lobby.floor.waitingHost{"host":"Jo"}');
  });

  it("counts the rest of a long list", () => {
    expect(nameList(["A", "B", "C", "D"], t)).toBe('lobby.floor.more{"a":"A","b":"B","count":2}');
    expect(nameList(["Ann", "Bo", "Cy"], t)).toBe('lobby.floor.three{"a":"Ann","b":"Bo","c":"Cy"}');
  });
});

describe("Hustle's table notes", () => {
  it("gives the first player one coin less at two players, and counts the deck", () => {
    const two = coup.tableNotes!(2, t);
    expect(two[0].text).toContain("coup.table.coinsTwo");
    expect(coup.tableNotes!(5, t)[0].text).toContain("coup.table.coins{");
    expect(coup.tableNotes!(6, t)[2].text).toContain('"left":3');
    expect(two.filter((n) => n.short)).toHaveLength(2);
  });
});
