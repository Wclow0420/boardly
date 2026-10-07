# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Game prompt sheets

A game board that asks the player for a move in a bottom sheet must
drive it with `usePromptSheet(needsMe, step)` (`src/hooks/usePromptSheet.ts`),
passing its `ref` and `onDismiss` to `<BottomSheetModal>`. Don't write
your own `present()`/`dismiss()` effect: @gorhom/bottom-sheet drops a
`present()` that arrives while the sheet is still closing, which leaves
the player with no prompt until they reload.
