// A badge's name and description: badges.<game>.<name> in the locales.

import type { TFunction } from "i18next";

export function badgeText(t: TFunction, key: string) {
  const [game, name] = key.split(".");
  return {
    name: t(`badges.${game}.${name}.name`, { defaultValue: name }),
    desc: t(`badges.${game}.${name}.desc`, { defaultValue: "" }),
  };
}
