// Boardly icon set — hand-drawn strokes matching the design language
// (1.8pt rounded strokes). Every icon takes { size, color, strokeWidth }
// so screens stay theme-agnostic.

import Svg, { Circle, Path, Rect } from "react-native-svg";

export interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const defaults = { size: 24, strokeWidth: 1.8 };

export function HomeIcon({ size = defaults.size, color = "#000" }: IconProps) {
  return (
    <Svg width={size} height={(size * 20) / 22} viewBox="0 0 22 20">
      <Path
        d="M11 0L22 8.4V20H13.6V12.4H8.4V20H0V8.4L11 0Z"
        fill={color}
      />
    </Svg>
  );
}

export function GamesIcon({
  size = defaults.size,
  color = "#000",
  strokeWidth = defaults.strokeWidth,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={(size * 18) / 24}
      viewBox="0 0 24 18"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    >
      <Rect x={1.2} y={4} width={21.6} height={11.5} rx={5.7} />
      <Path d="M7 7.6v4.3M4.9 9.8h4.2" />
      <Circle cx={16.6} cy={8.8} r={1.1} fill={color} stroke="none" />
      <Circle cx={19.2} cy={11.4} r={1.1} fill={color} stroke="none" />
    </Svg>
  );
}

export function FriendsIcon({
  size = defaults.size,
  color = "#000",
  strokeWidth = defaults.strokeWidth,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={(size * 18) / 24}
      viewBox="0 0 24 18"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    >
      <Circle cx={9} cy={6} r={3.2} />
      <Path d="M3.2 15c0-3 2.6-4.7 5.8-4.7s5.8 1.7 5.8 4.7" />
      <Circle cx={17.6} cy={7.2} r={2.3} />
      <Path d="M17.2 11.6c2.5 0 4.3 1.4 4.3 3.4" />
    </Svg>
  );
}

export function ProfileIcon({
  size = defaults.size,
  color = "#000",
  strokeWidth = defaults.strokeWidth,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    >
      <Circle cx={10} cy={10} r={8.4} />
      <Circle cx={7.2} cy={8.6} r={1} fill={color} stroke="none" />
      <Circle cx={12.8} cy={8.6} r={1} fill={color} stroke="none" />
      <Path d="M6.9 12.7c.9 1.1 1.9 1.6 3.1 1.6s2.2-.5 3.1-1.6" />
    </Svg>
  );
}

export function BellIcon({
  size = defaults.size,
  color = "#000",
  strokeWidth = 2,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <Path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </Svg>
  );
}

export function PlusIcon({
  size = defaults.size,
  color = "#000",
  strokeWidth = 2,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    >
      <Path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function SearchIcon({
  size = defaults.size,
  color = "#000",
  strokeWidth = 2,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    >
      <Circle cx={11} cy={11} r={7} />
      <Path d="M16.5 16.5L21 21" />
    </Svg>
  );
}

export function SortIcon({
  size = defaults.size,
  color = "#000",
  strokeWidth = 2,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    >
      <Path d="M4 6h16M4 12h11M4 18h7" />
    </Svg>
  );
}

export function ChevronRightIcon({
  size = defaults.size,
  color = "#000",
  strokeWidth = 2.2,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M9 5l7 7-7 7" />
    </Svg>
  );
}

export function BackIcon({
  size = defaults.size,
  color = "#000",
  strokeWidth = 2.4,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M15 5l-7 7 7 7" />
    </Svg>
  );
}

export function DotsIcon({ size = defaults.size, color = "#000" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Circle cx={5} cy={12} r={2.2} />
      <Circle cx={12} cy={12} r={2.2} />
      <Circle cx={19} cy={12} r={2.2} />
    </Svg>
  );
}

export function CopyIcon({
  size = defaults.size,
  color = "#000",
  strokeWidth = 1.8,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Rect x={9} y={9} width={11} height={12} rx={2.5} />
      <Path d="M5 15H4.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V5" />
    </Svg>
  );
}

export function LinkIcon({
  size = defaults.size,
  color = "#000",
  strokeWidth = 2,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
      <Path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
    </Svg>
  );
}

export function MailIcon({
  size = defaults.size,
  color = "#000",
  strokeWidth = 1.8,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={(size * 18) / 22}
      viewBox="0 0 22 18"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Rect x={1.5} y={2} width={19} height={14} rx={3.5} />
      <Path d="M2.5 4.5L11 10.5L19.5 4.5" />
    </Svg>
  );
}

export function StarIcon({ size = 14, color = "#FFC83D" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8L12 2z" />
    </Svg>
  );
}
