// Smoke test of the game screen: the room is the page, prompts and
// panels open as popups over it. jest.mock calls are hoisted above the
// imports by babel-jest.
import "@/i18n";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { ThemeProvider } from "@/theme";
import { NightwatchBoard } from "../NightwatchBoard";


jest.mock("@gorhom/bottom-sheet", () => { const { TextInput, View } = jest.requireActual("react-native"); return { BottomSheetTextInput: TextInput, BottomSheetModal: View, BottomSheetView: View, BottomSheetScrollView: View, BottomSheetBackdrop: View, BottomSheetModalProvider: View }; });
jest.mock("@/features/cosmetics/AvatarBorder", () => ({ AvatarBorder: ({ children }: any) => children ?? null }));
jest.mock("@/utils/haptics", () => ({ moveHaptic: jest.fn(), tapHaptic: jest.fn(), successHaptic: jest.fn(), heavyHaptic: jest.fn(), tickHaptic: jest.fn() }));
const base: any = {"numPlayers": 5, "phase": "announce", "round": 0, "rounds": 5, "missionRoom": 6, "nextMissionRoom": 1, "missionSizes": [2, 3, 2, 3, 3], "failsRequired": [1, 1, 1, 1, 1], "event": null, "collapsed": [], "doors": [], "lockedDoor": null, "leader": null, "nextLeader": 1, "rejections": 0, "team": [], "results": [], "history": [], "timeline": [], "rolesInGame": ["apprentice", "double", "hermit", "prophet", "tracker"], "ready": [false, true, true, true, true], "voted": [false, false, false, false, false], "missionPlayed": [], "myRole": "prophet", "known": [{"seat": 2, "as": "evil"}], "assassinSeat": null, "evilSeats": null, "myRoom": 4, "myFake": null, "myFn": null, "abilityLeft": 0, "lastUsed": null, "freeMove": false, "patrolRooms": [1, 3, 4, 5, 7], "doorOptions": [], "studyOptions": [], "letterLimit": 1, "myOrder": null, "myVote": null, "myCard": null, "log": [], "assassinTarget": null, "winner": null, "winReason": null, "roles": null, "positions": null};
const players = [0, 1, 2, 3, 4].map((s) => ({ seat: s, userId: "u" + s, username: "p" + s, borderId: "wood", avatarUrl: null }));
const board = (state: any) => (
  <ThemeProvider>
    <NightwatchBoard state={state} mySeat={0} isMyTurn={false} players={players} busy={false} finished={false} onMove={() => {}} />
  </ThemeProvider>
);

it("walks announce → patrol → room → news and every panel", async () => {
  const view = await render(board(base));
  // the game opens on the hush, then the role card face down
  expect(screen.getByText("Shhh…")).toBeTruthy();
  await fireEvent.press(screen.getByLabelText("Tap to continue"));
  await fireEvent.press(screen.getByLabelText("Tap the card to turn it over"));
  await fireEvent.press(screen.getByText("Keep it secret"));
  await waitFor(() => expect(screen.getByText("I'm ready")).toBeTruthy(), { timeout: 4000 });

  const patrol = { ...base, phase: "patrol", ready: [false, false, false, false, false] };
  await view.rerender(board(patrol));
  expect(screen.getByText(/Where do you patrol/)).toBeTruthy();

  const note = { round: 0, kind: "patrol", room: 0, seen: [2], company: true, fake: null, tracked: null, blocked: null };
  const room = { ...base, phase: "room", myRoom: 0, myFn: "belltower", ready: [false, false, false, false, false], log: [note] };
  await view.rerender(board(room));
  expect(screen.getByText(/What happened/)).toBeTruthy();
  await fireEvent.press(screen.getByText("OK"));
  expect(screen.getByText(/Touch the glowing spot/)).toBeTruthy();
  await fireEvent.press(screen.getByLabelText("In the Bell Tower"));
  expect(screen.getByText(/Ring the bell/)).toBeTruthy();

  const waiting = { ...room, ready: [true, false, false, false, false], myOrder: {} };
  await view.rerender(board(waiting));
  expect(screen.getByText(/Team size each night/)).toBeTruthy();
  const expected: Record<string, RegExp> = { Map: /Bell Tower/, Notebook: /Only you can see this/, Record: /Mission in the Cellar/, Role: /Prophet/, Watchers: /p3/ };
  for (const label of Object.keys(expected)) {
    await fireEvent.press(screen.getByLabelText(label));
    expect(screen.getAllByText(expected[label]).length).toBeGreaterThan(0);
    await fireEvent.press(screen.getAllByLabelText("Got it")[0]);
  }
});

it("opens the map night by night, with notes only on nights so far", async () => {
  const patrol = { round: 0, kind: "patrol", room: 0, seen: [2], company: true, fake: null, tracked: null, blocked: null };
  const result = { round: 0, room: 6, team: [0, 1], missing: [], fails: 0, success: true };
  const second = { ...base, round: 1, missionRoom: 2, nextMissionRoom: 7, ready: [true, false, false, false, false], log: [patrol], results: [result] };
  await render(board(second));
  await fireEvent.press(screen.getByLabelText("Map"));

  expect(screen.getByLabelText("Night 2").props.accessibilityState.selected).toBe(true);
  expect(screen.getByLabelText("Night 3").props.accessibilityState.disabled).toBe(true);
  await fireEvent.press(screen.getByLabelText("Night 1"));
  expect(screen.getByLabelText("Night 1").props.accessibilityState.selected).toBe(true);
  expect(screen.getByText(/Mission: Cellar/)).toBeTruthy();

  await fireEvent.press(screen.getByText("p3"));
  expect(screen.getByText("Tap a room for p3.")).toBeTruthy();
});

it("delivers the night's anonymous letters when the talking starts", async () => {
  const timeline = [{ round: 0, kind: "letters", texts: ["Trust no one in the cellar"] }];
  const talking = { ...base, phase: "team", leader: 1, ready: [true, true, true, true, true], timeline };
  const view = await render(board(talking));
  expect(screen.getByText("AN ANONYMOUS LETTER")).toBeTruthy();
  // the table moving on to the vote doesn't take the letter away
  await view.rerender(board({ ...talking, phase: "vote", team: [1, 2] }));
  expect(screen.getByText("AN ANONYMOUS LETTER")).toBeTruthy();
  // one tap finishes the writing, the next puts the letter away
  await fireEvent.press(screen.getAllByLabelText("Tap to continue")[0]);
  expect(screen.getByText("“Trust no one in the cellar”")).toBeTruthy();
});

it("keeps the Chapel's record in its book until the book is opened", async () => {
  const patrol = { round: 1, kind: "patrol", room: 2, seen: [], company: false, fake: null, tracked: null, blocked: null };
  const record = { round: 1, kind: "chapelRecord", records: [{ round: 0, prayed: true, result: "cancelled" }] };
  const chapel = { ...base, round: 1, phase: "room", myRoom: 2, myFn: "chapel", ready: [false, false, false, false, false], log: [patrol, record] };
  await render(board(chapel));
  expect(screen.queryByText(/Night 1:/)).toBeNull();
  await fireEvent.press(screen.getByLabelText("The Chapel's record"));
  expect(screen.getByText(/Night 1:/)).toBeTruthy();
});

it("says why I'm in another room after going on a mission", async () => {
  const result = { round: 0, room: 6, team: [0, 1], missing: [], fails: 0, success: true };
  const next = { ...base, round: 1, phase: "patrol", myRoom: 6, missionRoom: 2, results: [result], ready: [false, false, false, false, false] };
  await render(board(next));
  expect(screen.getByText(/You went on last night's mission/)).toBeTruthy();
});
