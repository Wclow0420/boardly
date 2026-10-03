/* eslint-env jest */
// Global test setup — official mocks for native modules.

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);
