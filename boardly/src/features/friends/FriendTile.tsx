// A friend who is online, at the table: their avatar ringed in their
// presence, their own meeple, what they're doing (a game's lid when
// they're playing), and one tap to invite them to my table.

import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Meeple } from "@/components/tabletop/Meeple";
import { AppText, Texture } from "@/components/ui";
import type { Friend } from "@/data/types";
import { AvatarBorder } from "@/features/cosmetics/AvatarBorder";
import { GameBox } from "@/features/games/GameBox";
import { useGameName } from "@/games/names";
import { TABLE, fontFamily } from "@/theme";
import { tapHaptic } from "@/utils/haptics";
import type { FriendNote } from "./hooks";
import { meepleColor } from "./seat";

const ONLINE = "#7FD672";
const PLAYING = "#E9A92B";

export function FriendTile({
  friend,
  note,
  busy,
  onOpen,
  onInvite,
}: {
  friend: Friend;
  note: FriendNote | null;
  busy: boolean;
  onOpen: () => void;
  onInvite: () => void;
}) {
  const { t } = useTranslation();
  const gameName = useGameName();
  const playing = friend.presence === "inGame";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={friend.name}
      onPress={() => {
        tapHaptic();
        onOpen();
      }}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
    >
      <LinearGradient colors={TABLE.woodButton} style={styles.tile}>
        <Texture radius={14} />
        <View style={styles.avatar}>
          <AvatarBorder
            name={friend.name}
            borderId={friend.borderId}
            avatarUrl={friend.avatarUrl}
            size={52}
            presence={playing ? "inGame" : "online"}
            ringColor={playing ? PLAYING : ONLINE}
          />
        </View>
        <View style={styles.nameRow}>
          <Meeple size={14} color={meepleColor(friend.id)} />
          <AppText numberOfLines={1} style={styles.name}>
            {friend.name}
          </AppText>
        </View>

        {note ? (
          <AppText
            variant="tiny"
            numberOfLines={2}
            align="center"
            style={{ color: note.tone === "success" ? ONLINE : "#F0605D" }}
          >
            {note.text}
          </AppText>
        ) : playing && friend.playing ? (
          <View style={styles.status}>
            <GameBox gameKey={friend.playing} width={16} flat />
            <AppText
              variant="tiny"
              numberOfLines={1}
              style={{ color: PLAYING }}
            >
              {t("friends.table.playing", { game: gameName(friend.playing) })}
            </AppText>
          </View>
        ) : (
          <AppText variant="tiny" style={{ color: ONLINE }}>
            {`● ${t("friends.status.online")}`}
          </AppText>
        )}

        {/* playing already: they can't come to my table now */}
        {!playing ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("common.invite")}
            disabled={busy}
            onPress={() => {
              tapHaptic();
              onInvite();
            }}
            style={({ pressed }) => [
              styles.invite,
              (pressed || busy) && styles.pressed,
            ]}
          >
            <LinearGradient colors={TABLE.button} style={styles.inviteFill}>
              <AppText style={styles.inviteText}>{t("common.invite")}</AppText>
            </LinearGradient>
          </Pressable>
        ) : null}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "48%" },
  pressed: { opacity: 0.8 },
  tile: {
    alignItems: "center",
    gap: 6,
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: TABLE.woodButtonBorder,
    minHeight: 168,
  },
  // room round the avatar for its border
  avatar: { padding: 4 },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    maxWidth: "100%",
  },
  name: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    color: TABLE.cream,
    flexShrink: 1,
  },
  status: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    maxWidth: "100%",
  },
  invite: { alignSelf: "stretch", marginTop: "auto" },
  inviteFill: {
    alignItems: "center",
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: TABLE.buttonBorder,
  },
  inviteText: { fontFamily: fontFamily.bold, fontSize: 13, color: "#FFFFFF" },
});
