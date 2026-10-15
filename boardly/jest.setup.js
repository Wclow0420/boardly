/* eslint-env jest */
// Global test setup — official mocks for native modules.

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// Skia draws natively; tests render the screens around the canvas.
jest.mock("react-native-worklets", () => require("react-native-worklets/src/mock"));
jest.mock("react-native-reanimated", () => require("react-native-reanimated/mock"));
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
