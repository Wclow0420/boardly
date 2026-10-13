import { invitePathFromLink } from "../share";

describe("invitePathFromLink", () => {
  it("reads the table from a website invite link", () => {
    expect(invitePathFromLink("https://boardly.lol/join/AB12CD")).toBe(
      "/join/AB12CD"
    );
  });

  it("reads the table from the app's own scheme", () => {
    expect(invitePathFromLink("boardly://join/AB12CD")).toBe("/join/AB12CD");
    expect(invitePathFromLink("boardly-dev://join/ab12cd/")).toBe(
      "/join/AB12CD"
    );
  });

  it("ignores anything after the code", () => {
    expect(invitePathFromLink("https://boardly.lol/join/AB12CD?ref=chat")).toBe(
      "/join/AB12CD"
    );
  });

  it("is null for links that are not invites", () => {
    expect(invitePathFromLink(null)).toBeNull();
    expect(invitePathFromLink("https://boardly.lol/")).toBeNull();
    expect(invitePathFromLink("boardly://lobby/AB12CD")).toBeNull();
    expect(invitePathFromLink("https://boardly.lol/join/TOOLONG1")).toBeNull();
  });
});
