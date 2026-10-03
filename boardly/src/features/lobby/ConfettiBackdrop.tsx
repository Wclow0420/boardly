import { StyleSheet, View } from "react-native";

// Static confetti pieces scattered over the lobby header, matching the
// design. Positions are fractions of the header area.
const PIECES = [
  { left: 0.08, top: 0.28, color: "#8CC8F0", rotate: "24deg" },
  { left: 0.2, top: 0.14, color: "#F98FA8", rotate: "-40deg" },
  { left: 0.82, top: 0.2, color: "#7ED3A0", rotate: "30deg" },
  { left: 0.92, top: 0.52, color: "#B79BEB", rotate: "-18deg" },
  { left: 0.12, top: 0.68, color: "#FFFFFF", rotate: "42deg" },
  { left: 0.74, top: 0.74, color: "#F98FA8", rotate: "12deg" },
  { left: 0.36, top: 0.84, color: "#8CC8F0", rotate: "-28deg" },
];

export function ConfettiBackdrop() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {PIECES.map((piece, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            left: `${piece.left * 100}%`,
            top: `${piece.top * 100}%`,
            width: 9,
            height: 15,
            borderRadius: 2,
            backgroundColor: piece.color,
            transform: [{ rotate: piece.rotate }],
          }}
        />
      ))}
    </View>
  );
}
