import { Pressable, StyleSheet, Text, View } from "react-native";

import { moveHaptic } from "@/utils/haptics";
import type { GameBoardProps } from "../types";
import { isLegalMove, winningLine, type TicTacToeState } from "./logic";

export function TicTacToeBoard({
  state,
  isMyTurn,
  onMove,
}: GameBoardProps<TicTacToeState>) {
  const winLine = winningLine(state);

  return (
    <View style={styles.board}>
      {state.board.map((cell, i) => {
        const highlighted = winLine?.includes(i) ?? false;
        return (
          <Pressable
            key={i}
            accessibilityRole="button"
            accessibilityLabel={`cell-${i}`}
            style={[styles.cell, highlighted && styles.winningCell]}
            disabled={!isMyTurn || !isLegalMove(state, i) || winLine !== null}
            onPress={() => {
              moveHaptic();
              onMove({ cell: i });
            }}
          >
            <Text style={styles.symbol}>{cell ?? ""}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 300,
    height: 300,
    alignSelf: "center",
  },
  cell: {
    width: "33.333%",
    height: "33.333%",
    borderWidth: 1,
    borderColor: "#94a3b8",
    alignItems: "center",
    justifyContent: "center",
  },
  winningCell: {
    backgroundColor: "#bbf7d0",
  },
  symbol: {
    fontSize: 48,
    fontWeight: "700",
  },
});
