// "5m ago", "3h ago", "2d ago" — how long since an ISO time, short.

import type { TFunction } from "i18next";

export function timeAgo(t: TFunction, iso: string, now = Date.now()): string {
  const minutes = Math.max(
    0,
    Math.floor((now - new Date(iso).getTime()) / 60000),
  );
  if (minutes < 1) return t("common.ago.now");
  if (minutes < 60) return t("common.ago.minutes", { n: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("common.ago.hours", { n: hours });
  return t("common.ago.days", { n: Math.floor(hours / 24) });
}
