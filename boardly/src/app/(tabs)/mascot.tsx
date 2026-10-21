// The Me tab, where the app opens: my meeple centre stage in the lobby of
// the Boardly building (features/me). This gathers what the page shows
// from what the app has (my session and card, my table and its floor,
// friends on now, the games) and where each of its buttons goes. A code
// joins through the join sheet, which asks first (go back or leave) when
// I'm still at another table (useOneTable).

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import type { GorhomBottomSheetModal } from "@/components/ui";
import { useSession } from "@/context/SessionContext";
import { useGamesQuery } from "@/features/games/hooks";
import { floorOfGame } from "@/features/games/lift/banks";
import { isNewGame, useLiftBuilding } from "@/features/games/lift/building";
import { JoinTableSheet } from "@/features/home/JoinTableSheet";
import { useMyTables, useOnlineFriends } from "@/features/home/hooks";
import { tablePath } from "@/features/home/OneTable";
import { useLiftFloor } from "@/features/lobby/floor/useLiftFloor";
import { asLook } from "@/features/mascot/dress";
import { useMeepleTransition } from "@/features/mascot/MeepleTransition";
import { MailboxPopup } from "@/features/me/MailboxPopup";
import { markMailSeen, useMailbox } from "@/features/me/mailbox";
import { marqueeLines } from "@/features/me/marquee";
import { MePage } from "@/features/me/MePage";
import { statsQuery } from "@/features/profile/warm";
import { useGameName } from "@/games/names";

export default function MeTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useSession();
  const look = useMemo(() => asLook(user?.mascot), [user?.mascot]);
  const go = useMeepleTransition();
  const gameName = useGameName();

  // my record, under my name
  const stats = useQuery({ ...statsQuery(user?.id), staleTime: 30_000 }).data;
  const title = stats && stats.gamesPlayed > 0 ? t("me.record", { wins: stats.wins, count: stats.gamesPlayed }) : null;

  // the table I'm at, by its floor
  const { tables } = useMyTables();
  const table = tables[0] ?? null;
  const { floor } = useLiftFloor(table?.gameKey);
  const tableLabel = table ? t("me.backTo", { floor, game: gameName(table.gameKey, table.gameName) }) : null;

  // the marquee's lines
  const games = useGamesQuery().data;
  const friends = useOnlineFriends();
  const building = useLiftBuilding();
  const friendsKey = JSON.stringify(friends.map((f) => [f.id, f.presence, f.playing]));
  const gamesKey = (games ?? []).map((g) => g.id).join(",");
  const marquee = useMemo(
    () =>
      marqueeLines({
        t,
        gameName,
        games: games ?? [],
        friends,
        isNew: isNewGame,
        floorOf: (id) => floorOfGame(building, id),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- by what the lines say
    [t, gameName, gamesKey, friendsKey, building],
  );

  const mail = useMailbox();
  const [mailOpen, setMailOpen] = useState(false);
  const joinRef = useRef<GorhomBottomSheetModal>(null);

  // the wardrobe opens through my meeple where it stands
  const wardrobe = useCallback((chest: number) => go(() => router.push("/wardrobe"), { from: chest }), [go, router]);

  return (
    <>
      <MePage
        name={user?.username ?? ""}
        title={title}
        avatarUrl={user?.avatarUrl}
        borderId={user?.borderId}
        mascot={user?.mascot}
        look={look}
        coins={user?.coins ?? 0}
        marquee={marquee}
        unread={mail.unread}
        table={tableLabel}
        onTable={() =>
          // back to my table: its lobby while it waits, the game once it plays
          table && router.push(tablePath({ code: table.code, status: table.status === "inProgress" ? "playing" : "waiting" }) as never)
        }
        onProfile={() => router.push("/profile")}
        onMascot={wardrobe}
        onWardrobe={wardrobe}
        onMailbox={() => {
          markMailSeen();
          setMailOpen(true);
        }}
        onCode={() => joinRef.current?.present()}
        onPractice={() => router.push("/(tabs)/games?practice=1")}
        onPlay={() => router.push("/games")}
        paused={mailOpen}
      />
      <MailboxPopup visible={mailOpen} mail={mail} onClose={() => setMailOpen(false)} />
      <JoinTableSheet ref={joinRef} />
    </>
  );
}
