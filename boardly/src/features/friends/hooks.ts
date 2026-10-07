// Data hooks for friends — backed by /api/v1/friends and kept live by
// the `friends_updated` socket event (see FriendsRealtime).

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { api, ApiError, type FriendUser } from "@/api/client";
import { useSession } from "@/context/SessionContext";
import type { Friend } from "@/data/types";

export type FriendTab = "friends" | "requests" | "recent";

export const FRIEND_TABS: FriendTab[] = ["friends", "requests", "recent"];

function toFriend(user: FriendUser): Friend {
  return {
    id: user.id,
    name: user.username,
    borderId: user.borderId,
    avatarUrl: user.avatarUrl,
    relation: user.relation,
    presence: user.presence ?? undefined,
    requestId: user.requestId ?? undefined,
  };
}

export function useFriendsQuery() {
  const { user, status } = useSession();

  return useQuery({
    queryKey: ["friends", user?.id],
    queryFn: async () => {
      const data = await api.friends.list();
      return {
        friends: data.friends.map(toFriend),
        incoming: data.incoming.map(toFriend),
        outgoing: data.outgoing.map(toFriend),
        recent: data.recent.map(toFriend),
      };
    },
    enabled: status === "signedIn",
  });
}

export function useFriends() {
  const [tab, setTab] = useState<FriendTab>("friends");
  const query = useFriendsQuery();

  return {
    data: query.data,
    tab,
    setTab,
    isLoading: query.isPending,
    isError: query.isError,
    refetch: query.refetch,
  };
}

const SEARCH_DEBOUNCE_MS = 300;
export const MIN_SEARCH_LENGTH = 2;

/** Username search for the Add Friend sheet (debounced). */
export function useFriendSearch(term: string) {
  const trimmed = term.trim();
  const [debounced, setDebounced] = useState(trimmed);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(trimmed), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [trimmed]);

  const enabled = debounced.length >= MIN_SEARCH_LENGTH;
  const query = useQuery({
    queryKey: ["friendSearch", debounced],
    queryFn: async () => (await api.friends.search(debounced)).users.map(toFriend),
    enabled,
    staleTime: 0,
  });

  return {
    results: enabled ? (query.data ?? []) : [],
    isTyping: trimmed.length < MIN_SEARCH_LENGTH,
    isLoading: enabled && (query.isPending || debounced !== trimmed),
    isError: enabled && query.isError,
  };
}

function useInvalidateFriends() {
  const queryClient = useQueryClient();
  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["friends"] });
    queryClient.invalidateQueries({ queryKey: ["friendSearch"] });
    queryClient.invalidateQueries({ queryKey: ["stats"] });
  }, [queryClient]);
}

export function useRemoveFriend() {
  const invalidate = useInvalidateFriends();
  return useMutation({
    mutationFn: (userId: string) => api.friends.remove(userId),
    onSuccess: invalidate,
  });
}

export interface FriendNote {
  text: string;
  tone: "success" | "danger";
}

const NOTE_MS = 2500;

/** Everything one friend row can do, plus short-lived inline feedback
 *  ("Invite sent!" / the API error) shown in place of the status line. */
export function useFriendActions(friend: Friend) {
  const { t } = useTranslation();
  const invalidate = useInvalidateFriends();
  const [note, setNote] = useState<FriendNote | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const flash = useCallback((next: FriendNote) => {
    if (timer.current) clearTimeout(timer.current);
    setNote(next);
    timer.current = setTimeout(() => setNote(null), NOTE_MS);
  }, []);

  const onError = useCallback(
    (err: unknown) => {
      flash({
        tone: "danger",
        text:
          err instanceof ApiError
            ? t([`errors.${err.code}`, err.message])
            : t("common.errorTitle"),
      });
      // The list may be stale (e.g. the request was already answered)
      invalidate();
    },
    [flash, invalidate, t]
  );

  const add = useMutation({
    mutationFn: () => api.friends.sendRequest(friend.id),
    onSuccess: invalidate,
    onError,
  });
  const accept = useMutation({
    mutationFn: () => api.friends.acceptRequest(friend.requestId ?? ""),
    onSuccess: invalidate,
    onError,
  });
  const removeRequest = useMutation({
    mutationFn: () => api.friends.removeRequest(friend.requestId ?? ""),
    onSuccess: invalidate,
    onError,
  });
  const invite = useMutation({
    mutationFn: () => api.friends.invite(friend.id),
    onSuccess: () => flash({ tone: "success", text: t("friends.inviteSent") }),
    onError,
  });

  return useMemo(
    () => ({
      note,
      busy:
        add.isPending ||
        accept.isPending ||
        removeRequest.isPending ||
        invite.isPending,
      add: () => add.mutate(),
      accept: () => accept.mutate(),
      removeRequest: () => removeRequest.mutate(),
      invite: () => invite.mutate(),
    }),
    [note, add, accept, removeRequest, invite]
  );
}
