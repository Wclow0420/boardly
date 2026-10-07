// NOTE: RNTL v14 — `renderHook`, `rerender` and `act` are async; await them.
import { act, renderHook } from "@testing-library/react-native";

import type { GorhomBottomSheetModal } from "@/components/ui";
import { usePromptSheet } from "../usePromptSheet";

async function setup() {
  const sheet = { present: jest.fn(), dismiss: jest.fn() };
  const hook = await renderHook(
    ({ open, step }: { open: boolean; step: string }) =>
      usePromptSheet(open, step),
    { initialProps: { open: false, step: "a" } }
  );
  hook.result.current.ref.current = sheet as unknown as GorhomBottomSheetModal;
  return { sheet, hook };
}

describe("usePromptSheet", () => {
  it("presents while open and dismisses once answered", async () => {
    const { sheet, hook } = await setup();
    await hook.rerender({ open: true, step: "a" });
    expect(sheet.present).toHaveBeenCalledTimes(1);
    await hook.rerender({ open: false, step: "a" });
    expect(sheet.dismiss).toHaveBeenCalledTimes(1);
  });

  it("presents again when the step changes", async () => {
    const { sheet, hook } = await setup();
    await hook.rerender({ open: true, step: "a" });
    await hook.rerender({ open: true, step: "b" });
    expect(sheet.present).toHaveBeenCalledTimes(2);
  });

  it("re-presents a sheet that closed while still needed", async () => {
    const { sheet, hook } = await setup();
    await hook.rerender({ open: true, step: "a" });
    // The sheet finished an earlier close and unmounted itself
    await act(() => hook.result.current.onDismiss());
    expect(sheet.present).toHaveBeenCalledTimes(2);
  });

  it("never dismisses a sheet it didn't present", async () => {
    const { sheet, hook } = await setup();
    await hook.rerender({ open: false, step: "b" });
    expect(sheet.dismiss).not.toHaveBeenCalled();
    // so it still opens when the player's turn comes
    await hook.rerender({ open: true, step: "c" });
    expect(sheet.present).toHaveBeenCalledTimes(1);
  });

  it("leaves a sheet closed once it is no longer needed", async () => {
    const { sheet, hook } = await setup();
    await hook.rerender({ open: true, step: "a" });
    await hook.rerender({ open: false, step: "a" });
    await act(() => hook.result.current.onDismiss());
    expect(sheet.present).toHaveBeenCalledTimes(1);
  });
});
