import { nightwatch } from "@/games/nightwatch";

/** A stand-in for i18next: the key and its options, to assert on. */
const t = (key: string, o?: Record<string, unknown>) => (o ? `${key}${JSON.stringify(o)}` : key);

describe("Seal the Manor's table notes", () => {
  it("counts the sides and the roles dealt from the role sets", () => {
    const five = nightwatch.tableNotes!(5, t);
    expect(five[0].text).toBe('nightwatch.table.sides{"good":3,"evil":2}');
    expect(five[0].short).toBe('nightwatch.table.sidesShort{"good":3,"evil":2}');
    expect(five[3].text).toContain('"sizes":"2 · 3 · 2 · 3 · 3"');
    // two Fail cards on night 4 only from seven players up
    expect(five).toHaveLength(4);
    const ten = nightwatch.tableNotes!(10, t);
    expect(ten[0].text).toContain('"good":6,"evil":4');
    expect(ten[1].text).toContain("nightwatch.table.copies");
    expect(ten[4].text).toBe('nightwatch.table.twoFails{"night":4}');
  });
});
