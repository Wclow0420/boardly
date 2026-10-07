import { useCallback, useEffect, useRef, useState } from "react";

import type { GorhomBottomSheetModal } from "@/components/ui";

/**
 * Keeps a must-answer sheet (a game asking this player for a move) open
 * exactly while `open` is true, re-presenting it whenever `step` changes.
 *
 * Two @gorhom/bottom-sheet traps leave the player with no prompt until
 * they reload, so this hook steers around them:
 * - dismiss() on a sheet that was never presented puts it in a
 *   "dismissing" state, and a later present() then never shows it (a
 *   player whose page opened while it wasn't their turn). So only
 *   dismiss a sheet this hook actually presented.
 * - present() while the sheet is still animating closed is ignored, and
 *   the sheet unmounts when the close finishes. So when the sheet
 *   reports it is gone while it is still wanted, present it again.
 *
 * Pass `ref` and `onDismiss` to the <BottomSheetModal>.
 */
export function usePromptSheet(open: boolean, step: string) {
  const ref = useRef<GorhomBottomSheetModal>(null);
  const openRef = useRef(open);
  // Whether the sheet is presented (or on its way): only then dismiss it
  const shownRef = useRef(false);
  // Bumped when the sheet closed under us, to run the effect again
  const [reopen, setReopen] = useState(0);

  useEffect(() => {
    openRef.current = open;
    if (open) {
      ref.current?.present();
      shownRef.current = true;
    } else if (shownRef.current) {
      ref.current?.dismiss();
      shownRef.current = false;
    }
  }, [open, step, reopen]);

  const onDismiss = useCallback(() => {
    shownRef.current = false;
    if (openRef.current) setReopen((n) => n + 1);
  }, []);

  return { ref, onDismiss };
}
