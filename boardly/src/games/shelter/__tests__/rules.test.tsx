// Every "How to play" page renders in each language, takes a standard
// section, and shows no missing string (a raw "rules." key).
import i18n from "@/i18n";
import { render, screen } from "@testing-library/react-native";
import { ThemeProvider } from "@/theme";
import { SHELTER_RULES } from "../rules";

// on a busy machine the first render compiles a lot
jest.setTimeout(30000);

const text = (node: unknown): string =>
  node == null || typeof node === "boolean"
    ? ""
    : typeof node === "string"
      ? node
      : Array.isArray(node)
        ? node.map(text).join(" ")
        : text((node as { children?: unknown }).children);

describe.each(["en", "zh", "ms"])("in %s", (language) => {
  beforeAll(() => i18n.changeLanguage(language));
  afterAll(() => i18n.changeLanguage("en"));
  it.each(SHELTER_RULES.map((page) => [page.key, page] as const))("renders the %s page", async (_key, page) => {
    const { Content } = page;
    await render(
      <ThemeProvider>
        <Content />
      </ThemeProvider>,
    );
    expect(page.section).toBeTruthy();
    const shown = text(screen.toJSON());
    expect(shown.length).toBeGreaterThan(20);
    expect(shown).not.toMatch(/(rules|shelter)\.\w/);
  });
});
