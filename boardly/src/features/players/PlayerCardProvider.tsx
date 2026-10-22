// One player card for the whole app: any screen can show who someone is
// — a friend, someone at my table, someone I played with — by calling
// usePlayerCard().show(person), and put it away with hide() (a screen
// leaving under it). Tapping myself opens my own profile.
// Removing a friend asks first; inviting goes to the table I'm waiting
// at, or to the shelf to open one.

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";

import { api } from "@/api/client";
import { ConfirmSheet, GorhomBottomSheetModal } from "@/components/ui";
import { useSession } from "@/context/SessionContext";
import { useRemoveFriend } from "@/features/friends/hooks";
import { useMyTables } from "@/features/home/hooks";
import { PlayerCardSheet, type CardPerson } from "./PlayerCardSheet";

interface PlayerCardApi {
  show: (person: CardPerson) => void;
  hide: () => void;
}

const PlayerCardContext = createContext<PlayerCardApi>({ show: () => {}, hide: () => {} });

export function usePlayerCard() {
  return useContext(PlayerCardContext);
}

export function PlayerCardProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useSession();
  const { tables } = useMyTables();
  const removeFriend = useRemoveFriend();
  const sheetRef = useRef<GorhomBottomSheetModal>(null);
  const confirmRef = useRef<GorhomBottomSheetModal>(null);
  const [person, setPerson] = useState<CardPerson | null>(null);
  const [removing, setRemoving] = useState<CardPerson | null>(null);

  const show = useCallback(
    (next: CardPerson) => {
      if (next.id === user?.id) {
        router.push("/profile");
        return;
      }
      setPerson(next);
      sheetRef.current?.present();
    },
    [router, user?.id],
  );
  const hide = useCallback(() => sheetRef.current?.dismiss(), []);
  const value = useMemo(() => ({ show, hide }), [show, hide]);

  const waiting = tables.some((table) => table.status === "waiting");

  return (
    <PlayerCardContext.Provider value={value}>
      {children}
      <PlayerCardSheet
        ref={sheetRef}
        person={person}
        onInvite={async (who) => {
          if (!waiting) {
            sheetRef.current?.dismiss();
            router.push("/games");
            return;
          }
          await api.friends.invite(who.id);
        }}
        onRemove={(who) => {
          sheetRef.current?.dismiss();
          setRemoving(who);
          confirmRef.current?.present();
        }}
      />
      <ConfirmSheet
        ref={confirmRef}
        title={t("friends.removeTitle", { name: removing?.name ?? "" })}
        message={t("friends.removeMessage")}
        confirmLabel={t("friends.actions.remove")}
        cancelLabel={t("common.cancel")}
        destructive
        loading={removeFriend.isPending}
        onConfirm={() => {
          if (!removing) return;
          removeFriend.mutate(removing.id, {
            onSettled: () => {
              confirmRef.current?.dismiss();
              queryClient.invalidateQueries({
                queryKey: ["playerCard", removing.id],
              });
            },
          });
        }}
      />
    </PlayerCardContext.Provider>
  );
}
