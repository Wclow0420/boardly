// Every badge a game declares in the app is named in all three locales.
// (The badge list itself comes from the server; see AGENTS.md.)
import en from "@/i18n/locales/en.json";
import ms from "@/i18n/locales/ms.json";
import zh from "@/i18n/locales/zh.json";
import { GAMES } from "@/games/registry";

// Only the games' data is read here: nothing is drawn (babel-jest
// hoists this above the imports)
jest.mock("@shopify/react-native-skia", () => ({}));

const LOCALES = { en, zh, ms } as Record<
  string,
  { badges: Record<string, Record<string, { name?: string; desc?: string }>> }
>;

it("names and describes every game's badges in every language", () => {
  const missing: string[] = [];
  for (const game of Object.values(GAMES)) {
    for (const key of Object.keys(game.badges ?? {})) {
      const [prefix, name] = key.split(".");
      if (prefix !== game.key) missing.push(`${key}: not keyed by its game`);
      for (const [lang, locale] of Object.entries(LOCALES)) {
        const text = locale.badges?.[prefix]?.[name];
        if (!text?.name || !text?.desc) missing.push(`${key} (${lang})`);
      }
    }
  }
  expect(missing).toEqual([]);
});
