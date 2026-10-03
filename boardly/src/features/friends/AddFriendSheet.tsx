import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { forwardRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import {
  AppText,
  BottomSheetModal,
  GorhomBottomSheetModal,
  TextField,
} from "@/components/ui";
import { useTheme } from "@/theme";
import { FriendRow } from "./FriendRow";
import { useFriendSearch } from "./hooks";

const MAX_RESULTS = 6;

/** Bottom sheet: find people by username and send friend requests. */
export const AddFriendSheet = forwardRef<GorhomBottomSheetModal>(
  function AddFriendSheet(_props, ref) {
    const { t } = useTranslation();
    const { colors } = useTheme();
    const [term, setTerm] = useState("");
    const search = useFriendSearch(term);

    const message = search.isTyping
      ? t("friends.add.hint")
      : search.isError
        ? t("common.errorSubtitle")
        : !search.isLoading && search.results.length === 0
          ? t("friends.add.noResults")
          : null;

    return (
      <BottomSheetModal
        ref={ref}
        title={t("friends.add.title")}
        onDismiss={() => setTerm("")}
      >
        <View style={styles.body}>
          <TextField
            label={t("auth.username")}
            value={term}
            onChangeText={setTerm}
            InputComponent={BottomSheetTextInput}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={30}
            placeholder={t("friends.add.placeholder")}
          />
          <View style={styles.results}>
            {message ? (
              <AppText variant="caption" color="textSubtle" align="center">
                {message}
              </AppText>
            ) : search.isLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              search.results
                .slice(0, MAX_RESULTS)
                .map((friend) => <FriendRow key={friend.id} friend={friend} />)
            )}
          </View>
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
    gap: 12,
  },
  results: { minHeight: 120, justifyContent: "center" },
});
