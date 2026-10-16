/* eslint-env jest */
// Global test setup — official mocks for native modules.

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// Skia draws natively; tests render the screens around the canvas.
jest.mock("react-native-worklets", () => require("react-native-worklets/src/mock"));
jest.mock("react-native-reanimated", () => ({
  ...require("react-native-reanimated/mock"),
  // the mock leaves this out; the light sweeps ask it
  useReducedMotion: () => false,
}));
jest.mock("@/components/iso", () => ({
  IsoCanvas: () => null,
  IsoClip: () => null,
  IsoGroup: () => null,
  IsoLayer: () => null,
  IsoEffects: () => null,
  Fire: () => null,
  Firefly: () => null,
  LightPool: () => null,
  Steam: () => null,
  Darkness: () => null,
  Dust: () => null,
  Flash: () => null,
  Fog: () => null,
  Rain: () => null,
  Snow: () => null,
  IsoPicture: () => null,
  Vignette: () => null,
  Burst: () => null,
  Seal: () => null,
  Shaft: () => null,
  GlowArea: () => null,
  Passage: () => null,
  useIsoClock: () => ({ value: 0 }),
}));
// The meeple transition draws on Skia: in tests a move just happens
jest.mock("@/features/mascot/MeepleTransition", () => ({
  MeepleTransitionProvider: ({ children }) => children,
  useMeepleTransition: () => (move) => move(),
}));
// Still mascots are Skia pictures too
jest.mock("@/features/mascot/MascotPortrait", () => ({ MascotPortrait: () => null }));
jest.mock("@/features/mascot/MascotThumb", () => ({
  MascotThumb: () => null,
  pictureOf: () => null,
}));
// The living mascot draws on Skia too (features/mascot)
jest.mock("@/features/mascot/MascotStage", () => ({
  FEET: { x: 50, y: 118.4 },
  MascotFigure: () => null,
  MascotStage: () => null,
}));
jest.mock("@/components/tabletop/cards/PlayingCard", () => ({
  FRONT: {
    window: { x: 16, y: 12, w: 68, h: 50 },
    plaque: { x: 10, y: 60, w: 80, h: 15 },
    body: { x: 12, y: 78, w: 76, h: 50 },
  },
  CardBack: () => null,
  CardFront: ({ children }) => children ?? null,
  PlayingCard: ({ children }) => children ?? null,
}));
// Anything drawn straight on Skia (the game stage's arch, curtain and
// lanterns, the popups' gilt panels) draws nothing in tests: every
// component is empty and every factory gives nothing back.
jest.mock("@shopify/react-native-skia", () => {
  const nothing = new Proxy(() => null, { get: () => nothing, apply: () => null });
  return new Proxy(
    { __esModule: true, vec: (x, y) => ({ x, y }), Skia: nothing, BlendMode: {}, BlurStyle: {} },
    { get: (target, key) => (key in target ? target[key] : () => null) },
  );
});
// The game stage sizes itself round the notch
jest.mock("react-native-safe-area-context", () => require("react-native-safe-area-context/jest/mock").default);
