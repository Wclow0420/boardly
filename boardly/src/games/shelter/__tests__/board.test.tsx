// Smoke test of the Shelter board: each phase asks the right thing and
// sends the right move. jest.mock calls are hoisted above the imports.
import "@/i18n";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { ThemeProvider } from "@/theme";
import { ShelterBoard } from "../ShelterBoard";

jest.mock("@/utils/haptics", () => ({ moveHaptic: jest.fn(), tapHaptic: jest.fn(), heavyHaptic: jest.fn(), tickHaptic: jest.fn() }));

const base: any = {
  numPlayers: 4, phase: "search", day: 0, days: 6, places: ["farm", "market"], store: 4, medicine: 0,
  status: ["ok", "ok", "ok", "ok"], injured: [false, false, false, false], weak: [false, false, false, false],
  infectedTotal: 1, rescueNeeded: 2, famineAt: 2, coughs: 0, roles: [null, null, null, null],
  waiting: [0, 1, 2, 3], searches: [], nights: [], exiles: [],
  myRole: "survivor", myStatus: "ok", myPlace: null, myHand: [], myPlay: null, myPost: null, myVote: null,
  myTired: false, myStealth: 0, canAct: true, log: [], winner: null, winReason: null,
};
const players = [0, 1, 2, 3].map((s) => ({ seat: s, userId: "u" + s, username: "p" + s, borderId: null, avatarUrl: null }));

function board(state: any, onMove = jest.fn()) {
  return (
    <ThemeProvider>
      <ShelterBoard state={state} mySeat={0} isMyTurn={false} players={players} busy={false} finished={false} onMove={onMove} />
    </ThemeProvider>
  );
}

it("asks for a place, then a card", async () => {
  const onMove = jest.fn();
  const view = await render(board(base, onMove));
  expect(screen.getByText(/Where do you scavenge/)).toBeTruthy();
  await fireEvent.press(screen.getByLabelText("Market"));
  expect(onMove).toHaveBeenCalledWith({ type: "search", place: "market" });

  await view.rerender(board({ ...base, phase: "play", myPlace: "market", myHand: ["f2", "zombie"] }, onMove));
  expect(screen.getByText(/play one card face down/)).toBeTruthy();
  expect(screen.queryByLabelText("Mould (sabotage)")).toBeNull();
  await fireEvent.press(screen.getAllByLabelText("Food")[0]);
  expect(onMove).toHaveBeenLastCalledWith({ type: "play", card: 0 });
});

it("gives the Infected sabotage and tells the night apart", async () => {
  const onMove = jest.fn();
  const infected = { ...base, myRole: "infected", coughs: 1 };
  const view = await render(board({ ...infected, phase: "play", myPlace: "farm", myHand: ["f1"] }, onMove));
  await fireEvent.press(screen.getByLabelText("Tap to continue"));
  await fireEvent.press(screen.getByLabelText("Mould (sabotage)"));
  expect(onMove).toHaveBeenLastCalledWith({ type: "play", card: "sabotage" });

  await view.rerender(board({ ...infected, phase: "night", myStealth: 1 }, onMove));
  expect(screen.getByText(/What do you do tonight/)).toBeTruthy();
  await fireEvent.press(screen.getByText(/Sneak \(once a game\)/));
  await fireEvent.press(screen.getByLabelText("Steal food"));
  expect(onMove).toHaveBeenLastCalledWith({ type: "night", post: "store", stealth: true });
});

it("shows the night's news and the vote", async () => {
  const onMove = jest.fn();
  const night = { day: 0, before: 8, after: 2, stolen: 2, opened: false, injured: [], hungry: [], fallen: [], cough: true };
  const guarded = { day: 0, kind: "guarded", post: "store", with: [], saw: [2] };
  const view = await render(board({ ...base, phase: "night" }, onMove));
  await view.rerender(board({ ...base, phase: "vote", day: 1, coughs: 1, nights: [night], log: [guarded] }, onMove));
  await fireEvent.press(screen.getByLabelText("Tap to continue"));
  expect(screen.getByText(/2 food went missing/)).toBeTruthy();
  expect(screen.getByText(/saw p2/)).toBeTruthy();
  await fireEvent.press(screen.getByText("OK"));
  expect(screen.getByText(/Send someone out/)).toBeTruthy();
  await fireEvent.press(screen.getByText("p2"));
  expect(onMove).toHaveBeenLastCalledWith({ type: "vote", target: 2 });
});
