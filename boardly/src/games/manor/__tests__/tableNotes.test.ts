import { manor } from "@/games/manor";

/** A stand-in for i18next: the key and its options, to assert on. */
const t = (key: string, o?: Record<string, unknown>) => (o ? `${key}${JSON.stringify(o)}` : key);

describe("Midnight Manor's table notes", () => {
  it("counts the intruders from the role sets, the lone one holding the knife", () => {
    const four = manor.tableNotes!(4, t);
    expect(four[0].text).toBe('manor.table.intruders{"count":1,"household":3}');
    expect(four.at(-1)?.text).toBe("manor.table.knife");
    const eight = manor.tableNotes!(8, t);
    expect(eight[0].text).toContain('"count":3,"household":5');
    expect(eight[1].text).toContain("manor.table.copies");
    expect(eight).toHaveLength(3);
    expect(eight.filter((n) => n.short)).toHaveLength(2);
  });
});
