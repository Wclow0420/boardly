// Reference component test: render inside the real ThemeProvider and
// assert behavior (not styling snapshots).
// NOTE: RNTL v14 — `render` and `fireEvent` are async; always await them.

import { fireEvent, render, screen } from "@testing-library/react-native";
import type { ReactElement } from "react";

import { ThemeProvider } from "@/theme";
import { Button } from "../Button";

function renderWithTheme(ui: ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("Button", () => {
  it("renders its label and fires onPress", async () => {
    const onPress = jest.fn();
    await renderWithTheme(<Button label="Start Game" onPress={onPress} />);

    await fireEvent.press(screen.getByText("Start Game"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not fire onPress while disabled", async () => {
    const onPress = jest.fn();
    await renderWithTheme(
      <Button label="Start Game" disabled onPress={onPress} />
    );

    await fireEvent.press(screen.getByText("Start Game"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("hides the label while loading", async () => {
    await renderWithTheme(<Button label="Start Game" loading />);
    expect(screen.queryByText("Start Game")).toBeNull();
  });
});
