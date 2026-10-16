import { useCallback, useContext, useSyncExternalStore } from "react";
import { NavigationContext } from "expo-router/react-navigation";

/** Whether the screen this sits on is the one showing. Screens left open
 *  behind (a tab you switched away from, a page under a pushed one) keep
 *  their views mounted; what moves on them needn't. Outside any screen (a
 *  sheet over everything) it counts as showing. */
export function useOnScreen() {
  const navigation = useContext(NavigationContext);
  const subscribe = useCallback(
    (changed: () => void) => {
      if (!navigation) return () => {};
      const off = [
        navigation.addListener("focus", changed),
        navigation.addListener("blur", changed),
      ];
      return () => off.forEach((stop) => stop());
    },
    [navigation],
  );
  const focused = () => navigation?.isFocused() ?? true;
  return useSyncExternalStore(subscribe, focused, focused);
}
