import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { forwardRef, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { ApiError } from "@/api/client";
import {
  AppText,
  BottomSheetModal,
  Button,
  GorhomBottomSheetModal,
  TextField,
} from "@/components/ui";
import { useAlreadyInRoomRedirect, useJoinRoom } from "./hooks";

/** Bottom sheet: enter a table code to join a friend's room. */
export const JoinTableSheet = forwardRef<GorhomBottomSheetModal>(
  function JoinTableSheet(_props, ref) {
    const { t } = useTranslation();
    const router = useRouter();
    const join = useJoinRoom();
    const redirectIfInRoom = useAlreadyInRoomRedirect();

    const [code, setCode] = useState("");
    const [error, setError] = useState<string | null>(null);
    // ref to dismiss after a successful join
    const selfRef = useRef<GorhomBottomSheetModal | null>(null);

    const handleJoin = () => {
      setError(null);
      join.mutate(
        { code: code.trim().toUpperCase() },
        {
          onSuccess: ({ room }) => {
            selfRef.current?.dismiss();
            setCode("");
            router.push(`/lobby/${room.code}`);
          },
          onError: async (err) => {
            if (await redirectIfInRoom(err)) {
              selfRef.current?.dismiss();
              return;
            }
            if (err instanceof ApiError) {
              setError(t([`errors.${err.code}`, err.message]));
            } else {
              setError(t("common.errorTitle"));
            }
          },
        }
      );
    };

    return (
      <BottomSheetModal
        ref={(node) => {
          selfRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        title={t("join.title")}
      >
        <View style={styles.body}>
          <TextField
            label={t("join.codeLabel")}
            value={code}
            onChangeText={(text) => setCode(text.toUpperCase())}
            InputComponent={BottomSheetTextInput}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={6}
            placeholder="ABC123"
          />
          {error ? (
            <AppText variant="caption" color="danger">
              {error}
            </AppText>
          ) : null}
          <Button
            label={t("join.cta")}
            onPress={handleJoin}
            loading={join.isPending}
            disabled={code.trim().length < 6}
          />
        </View>
      </BottomSheetModal>
    );
  }
);

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 16,
  },
});
