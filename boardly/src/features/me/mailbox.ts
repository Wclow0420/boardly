// The Me page's mailbox: the table invites friends have sent this run of
// the app (kept from the `table_invite` socket event, FriendsRealtime),
// beside the friend requests waiting on me (the friends query). An invite
// grows stale with its table, so one older than half an hour is let go
// (when another comes, or the mailbox is opened).
// The dot on the mailbox counts the requests and the invites that came
// since I last opened it.

import { useMemo, useSyncExternalStore } from "react";

import type { TableInvite } from "@/api/client";
import type { Friend } from "@/data/types";
import { useFriendsQuery } from "@/features/friends/hooks";

export interface MailInvite extends TableInvite {
  /** When it came (ms). */
  at: number;
}

const STALE_MS = 30 * 60 * 1000;
const KEEP = 12;

let invites: MailInvite[] = [];
let openedAt = 0;
const listeners = new Set<() => void>();
const changed = () => listeners.forEach((l) => l());

/** Lets go of the invites whose tables have grown stale. */
const fresh = (now: number) => invites.filter((i) => now - i.at < STALE_MS);

/** A table invite arrived: into the mailbox, newest first (one per table). */
export function addInvite(invite: TableInvite) {
  const now = Date.now();
  invites = [{ ...invite, at: now }, ...fresh(now).filter((i) => i.code !== invite.code)].slice(0, KEEP);
  changed();
}

/** The mailbox was opened: what's in it now has been seen (and the
 *  stale invites cleared out). */
export function markMailSeen() {
  openedAt = Date.now();
  invites = fresh(openedAt);
  changed();
}

/** Drops an invite (joined, or turned down). */
export function dropInvite(code: string) {
  invites = invites.filter((i) => i.code !== code);
  changed();
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
let snapshot = { invites, openedAt };
const read = () => {
  if (snapshot.invites !== invites || snapshot.openedAt !== openedAt) snapshot = { invites, openedAt };
  return snapshot;
};

const NO_FRIENDS: Friend[] = [];

export interface Mail {
  invites: MailInvite[];
  requests: Friend[];
  /** What the dot counts. */
  unread: number;
}

export function useMailbox(): Mail {
  const box = useSyncExternalStore(subscribe, read, read);
  const requests = useFriendsQuery().data?.incoming ?? NO_FRIENDS;
  return useMemo(() => {
    const unseen = box.invites.filter((i) => i.at > box.openedAt).length;
    return { invites: box.invites, requests, unread: requests.length + unseen };
  }, [box, requests]);
}
