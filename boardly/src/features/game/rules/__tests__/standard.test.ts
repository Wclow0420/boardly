import { hasEmblem } from "@/components/icons";

import { RULE_SECTIONS, SECTION_EMBLEM } from "../standard";

test("every section's emblem is drawn engraved", () => {
  for (const section of RULE_SECTIONS) expect([section, hasEmblem(SECTION_EMBLEM[section])]).toEqual([section, true]);
});
