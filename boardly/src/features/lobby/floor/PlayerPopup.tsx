// Someone in the room, tapped by the host while the table waits: a popup
// in the room's style with their name on its sign, their meeple's head
// and shoulders, and what the host can do: look at their player card, or
// take them off the table. A person is asked about first (they can join
// again with the code); a bot simply goes.

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { AppText, Button } from "@/components/ui";
import { Popup } from "@/features/game/Popup";
import { shortName } from "@/features/game/stage/PlayerName";
import { MascotPortrait } from "@/features/mascot/MascotPortrait";
import { fontFamily } from "@/theme";
import { heavyHaptic, tapHaptic } from "@/utils/haptics";
import type { RoomLook } from "./rooms";
import type { RoomPerson } from "./RoomScene";

const PORTRAIT = 112;

export function PlayerPopup({
  person,
  asking: askingFirst = false,
  look,
  onClose,
  onProfile,
  onRemove,
}: {
  /** Who was tapped; null when the popup is shut. */
  person: RoomPerson | null;
  /** Open straight on the ask (the long press). */
  asking?: boolean;
  look: RoomLook;
  onClose: () => void;
  onProfile: (person: RoomPerson) => void;
  onRemove: (person: RoomPerson) => void;
}) {
  const { t } = useTranslation();
  // the ask starts over for each person opened
  const [asking, setAsking] = useState({ id: person?.id, on: askingFirst });
  if (person && asking.id !== person.id) setAsking({ id: person.id, on: askingFirst });
  const ask = asking.on && asking.id === person?.id;

  const remove = (who: RoomPerson) => {
    heavyHaptic();
    onRemove(who);
  };

  return (
    <Popup visible={person !== null} title={person ? shortName(person.name, 16) : ""} onClose={onClose} look={look.popup}>
      {person ? (
        <View style={styles.body}>
          <MascotPortrait look={person.look} size={PORTRAIT} />
          <AppText style={styles.tag}>{person.bot ? t("lobby.floor.player.bot") : person.host ? t("lobby.host") : " "}</AppText>
          {ask ? (
            <>
              <AppText style={styles.ask}>{t("lobby.floor.player.removeAsk", { name: shortName(person.name) })}</AppText>
              <AppText style={styles.hint}>{t("lobby.floor.player.removeHint")}</AppText>
              <Button
                label={t("lobby.floor.player.removeConfirm")}
                variant="danger"
                size="md"
                style={styles.button}
                onPress={() => remove(person)}
              />
              <Button
                label={t("common.cancel")}
                variant="secondary"
                size="md"
                style={styles.button}
                onPress={() => {
                  tapHaptic();
                  setAsking({ id: person.id, on: false });
                }}
              />
            </>
          ) : (
            <>
              {person.bot ? null : (
                <Button
                  label={t("lobby.floor.player.profile")}
                  variant="secondary"
                  size="md"
                  style={styles.button}
                  onPress={() => onProfile(person)}
                />
              )}
              <Button
                label={t("lobby.floor.player.remove")}
                variant="danger"
                size="md"
                style={styles.button}
                onPress={() => {
                  if (person.bot) remove(person);
                  else {
                    tapHaptic();
                    setAsking({ id: person.id, on: true });
                  }
                }}
              />
            </>
          )}
        </View>
      ) : null}
    </Popup>
  );
}

const styles = StyleSheet.create({
  body: { alignItems: "center", alignSelf: "stretch" },
  tag: {
    marginTop: 6,
    fontFamily: fontFamily.bold,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 1.4,
    color: "#E8C88A",
    textTransform: "uppercase",
  },
  ask: {
    marginTop: 10,
    fontFamily: fontFamily.bold,
    fontSize: 16,
    lineHeight: 21,
    color: "#FFF2D8",
    textAlign: "center",
  },
  hint: {
    marginTop: 4,
    fontFamily: fontFamily.medium,
    fontSize: 12.5,
    lineHeight: 17,
    color: "#D8C6A6",
    textAlign: "center",
  },
  button: { alignSelf: "stretch", marginTop: 12 },
});
