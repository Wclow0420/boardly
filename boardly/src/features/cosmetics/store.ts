import { useSession } from "@/context/SessionContext";

import { DEFAULT_BORDER_ID } from "./borders";

/** The border the signed-in player wears, saved on their account. */
export function useEquippedBorder() {
  const { user } = useSession();
  return user?.borderId ?? DEFAULT_BORDER_ID;
}
