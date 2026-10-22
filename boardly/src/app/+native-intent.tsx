// Where a link that opens the app lands. Opened from the home screen
// (no link: the bare root) the app starts on the Me tab, my meeple in the
// lobby, rather than Home; every other link goes where it says.

export function redirectSystemPath({ path, initial }: { path: string; initial: boolean }): string {
  if (!initial) return path;
  // "boardly://", "boardly-dev:///", "/" and the like: the root itself
  const rest = path.replace(/^[a-z][a-z0-9+.-]*:\/\/[^/]*/i, "").replace(/^\/+/, "");
  return rest === "" ? "/mascot" : path;
}
