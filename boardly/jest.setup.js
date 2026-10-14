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
  useIsoClock: () => ({ value: 0 }),
}));
