// A badge's name and what it asks: badges.<game>.<name> in the locales.
// The ask takes a count (the goal of the level being worked towards).

import type { TFunction } from "i18next";

export function badgeText(t: TFunction, key: string, count = 1) {
  const [game, name] = key.split(".");
  return {
    name: t(`badges.${game}.${name}.name`, { defaultValue: name }),
    desc: t(`badges.${game}.${name}.desc`, { count, defaultValue: "" }),
  };
}
