import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Stop,
} from "react-native-svg";

/** The game coin, drawn in code so it looks the same on every device. */
export function CoinIcon({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        <LinearGradient id="coinFace" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFE680" />
          <Stop offset="1" stopColor="#F2A81D" />
        </LinearGradient>
      </Defs>
      <Circle cx={12} cy={12} r={11} fill="#B3700F" />
      <Circle cx={12} cy={11.2} r={10.2} fill="url(#coinFace)" />
      <Circle
        cx={12}
        cy={11.2}
        r={7.4}
        fill="none"
        stroke="#C9830F"
        strokeWidth={1.2}
        opacity={0.8}
      />
      {/* a four-point star stamped in the middle */}
      <Path
        d="M12 6.4 L13.5 9.7 L16.8 11.2 L13.5 12.7 L12 16 L10.5 12.7 L7.2 11.2 L10.5 9.7 Z"
        fill="#C9830F"
      />
      <Path
        d="M6.2 7.4 A8 8 0 0 1 11 3.6"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.3}
        strokeLinecap="round"
        opacity={0.7}
      />
    </Svg>
  );
}
