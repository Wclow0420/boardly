import { useCallback, useEffect, useRef, useState } from "react";

import type { GorhomBottomSheetModal } from "@/components/ui";

/**
 * Keeps a must-answer sheet (a game asking this player for a move) open
 * exactly while `open` is true, re-presenting it whenever `step` changes.
 *
 * Opening the sheet while it is still animating closed doesn't take:
 * @gorhom/bottom-sheet ignores the snap during a forced close, then
 * unmounts the sheet when the close finishes, leaving the player with
 * no prompt until they reload. So when the sheet reports it is gone
 * while it is still wanted, present it again.
 *
 * Pass `ref` and `onDismiss` to the <BottomSheetModal>.
 */
export function usePromptSheet(open: boolean, step: string) {
  const ref = useRef<GorhomBottomSheetModal>(null);
  const openRef = useRef(open);
  // Bumped when the sheet closed under us, to run the effect again
  const [reopen, setReopen] = useState(0);

  useEffect(() => {
    openRef.current = open;
    if (open) ref.current?.present();
    else ref.current?.dismiss();
  }, [open, step, reopen]);

  const onDismiss = useCallback(() => {
    if (openRef.current) setReopen((n) => n + 1);
  }, []);

  return { ref, onDismiss };
}
