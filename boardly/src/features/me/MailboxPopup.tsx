// The lobby's mailbox, opened from the Me page: the building's letter
// board (the lift directory's black felt in its brass deco frame) with a
// line for each thing waiting on me. A friend's request (accept or turn
// it down) and a friend's table invite (join, or let it go). In the
// page's style, not the plain shared card.

import { useRouter } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";

import { stillSvg } from "@/components/badges/bake";
import { AppText, Button, StillPicture } from "@/components/ui";
import type { Friend } from "@/data/types";
import { AvatarBorder } from "@/features/cosmetics/AvatarBorder";
import { useFriendActions } from "@/features/friends/hooks";
import { BOARD_RIM, directoryArt } from "@/features/games/lift/art";
import { useGameName } from "@/games/names";
import { fontFamily } from "@/theme";
import { tapHaptic } from "@/utils/haptics";
import { dropInvite, type Mail, type MailInvite } from "./mailbox";

export function MailboxPopup({ visible, mail, onClose }: { visible: boolean; mail: Mail; onClose: () => void }) {
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const w = Math.min(360, width - 32);
  const lines = mail.invites.length + mail.requests.length;
  const empty = lines === 0;
  // as tall as its lines, within reason
  const h = Math.round(Math.min(height * 0.66, empty ? 270 : 150 + lines * 58));
  const board = useMemo(() => stillSvg(`me-mail|${w}x${h}`, w, h, () => directoryArt(w, h)), [w, h]);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel={t("me.close")}>
        <Pressable style={{ width: w, height: h }} onPress={() => {}}>
          <StillPicture picture={board} style={{ width: w, height: h }} />
          <View style={[StyleSheet.absoluteFill, { padding: BOARD_RIM + 12 }]}>
            <AppText style={styles.title}>{t("me.mailbox")}</AppText>
            <View style={styles.rule} />
            {empty ? (
              <View style={styles.empty}>
                <AppText style={styles.emptyTitle}>{t("me.mail.empty")}</AppText>
                <AppText style={styles.emptyText}>{t("me.mail.emptyHint")}</AppText>
              </View>
            ) : (
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 10, paddingVertical: 6 }}>
                {mail.invites.map((invite) => (
                  <InviteLine key={invite.code} invite={invite} onDone={onClose} />
                ))}
                {mail.requests.map((friend) => (
                  <RequestLine key={friend.id} friend={friend} />
                ))}
              </ScrollView>
            )}
            <Button label={t("me.close")} variant="secondary" size="sm" onPress={onClose} style={styles.close} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function InviteLine({ invite, onDone }: { invite: MailInvite; onDone: () => void }) {
  const { t } = useTranslation();
  const router = useRouter();
  const gameName = useGameName();
  const game = invite.game ? gameName(invite.game.key, invite.game.name) : t("tabs.games");
  return (
    <View style={styles.line}>
      <AvatarBorder name={invite.from.username} borderId={invite.from.borderId} avatarUrl={invite.from.avatarUrl} mascot={invite.from.mascot} size={34} />
      <View style={styles.lineText}>
        <AppText style={styles.lineTitle} numberOfLines={1}>
          {invite.from.username}
        </AppText>
        <AppText style={styles.lineSub} numberOfLines={2}>
          {t("me.mail.invite", { game })}
        </AppText>
      </View>
      <Button
        label={t("invite.join")}
        size="sm"
        onPress={() => {
          tapHaptic();
          dropInvite(invite.code);
          onDone();
          router.push(`/join/${invite.code}`);
        }}
      />
    </View>
  );
}

function RequestLine({ friend }: { friend: Friend }) {
  const { t } = useTranslation();
  const actions = useFriendActions(friend);
  return (
    <View style={styles.line}>
      <AvatarBorder name={friend.name} borderId={friend.borderId} avatarUrl={friend.avatarUrl} mascot={friend.mascot} size={34} />
      <View style={styles.lineText}>
        <AppText style={styles.lineTitle} numberOfLines={1}>
          {friend.name}
        </AppText>
        <AppText style={[styles.lineSub, actions.note?.tone === "danger" && styles.bad]} numberOfLines={2}>
          {actions.note?.text ?? t("me.mail.request")}
        </AppText>
      </View>
      <View style={styles.actions}>
        <Button label={t("me.mail.accept")} size="sm" loading={actions.busy} onPress={actions.accept} />
        <Button label="✕" size="sm" variant="secondary" disabled={actions.busy} onPress={actions.removeRequest} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(8,5,3,0.72)" },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 2,
    color: "#F4EEDF",
    textAlign: "center",
    textTransform: "uppercase",
  },
  rule: { height: 1.5, backgroundColor: "#FF8A7A", opacity: 0.7, marginVertical: 8, marginHorizontal: 40 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 12 },
  emptyTitle: { fontFamily: fontFamily.bold, fontSize: 15, color: "#F4EEDF", textAlign: "center" },
  emptyText: { fontFamily: fontFamily.medium, fontSize: 12, lineHeight: 17, color: "#B8B0A0", textAlign: "center" },
  line: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 },
  lineText: { flex: 1, gap: 1 },
  lineTitle: { fontFamily: fontFamily.bold, fontSize: 13.5, color: "#F4EEDF" },
  lineSub: { fontFamily: fontFamily.medium, fontSize: 11.5, lineHeight: 15, color: "#C8C0B0" },
  bad: { color: "#FF8A7A" },
  actions: { flexDirection: "row", gap: 6 },
  close: { alignSelf: "center", marginTop: 8, minWidth: 120 },
});
