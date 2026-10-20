// Every "How to play" page of Midnight Manor, Liar's Dice and Tic-Tac-Toe
// draws, in each language, with no missing strings.
import i18n from "@/i18n";
import { render } from "@testing-library/react-native";
import { ThemeProvider } from "@/theme";
import { LIARSDICE_RULES } from "@/games/liarsdice/rules";
import { MANOR_RULES } from "../rules";
import { TICTACTOE_RULES } from "@/games/tictactoe/rules";

const GAMES = { manor: MANOR_RULES, liarsdice: LIARSDICE_RULES, tictactoe: TICTACTOE_RULES };

describe.each(["en", "zh", "ms"])("rules in %s", (lang) => {
  beforeAll(() => i18n.changeLanguage(lang));
  for (const [game, pages] of Object.entries(GAMES)) {
    for (const { key, Content } of pages) {
      it(`${game}: ${key}`, async () => {
        const view = await render(
          <ThemeProvider>
            <Content />
          </ThemeProvider>,
        );
        // a missing string shows its key
        expect(JSON.stringify(view.toJSON())).not.toMatch(/rules\.(manor|liarsdice|tictactoe)\.|manor\.(roles|rooms|items|actions)\./);
      });
    }
  }
});
