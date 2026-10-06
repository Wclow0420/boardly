// Home screen artwork and palette. Every image slot is optional: without
// a file the screen draws a flat placeholder. To add art, put the file in
// assets/ui/home/ (sizes in that folder's README) and register it here:
//
//   export const BACKGROUND: ImageSourcePropType | undefined =
//     require("../../../assets/ui/home/background.webp");

import type { ImageSourcePropType } from "react-native";

/** The quick-play panel as one picture (uploaded as scene-top.png,
 *  cropped to the panel itself). Drawn at its own proportions, so it
 *  scales with the screen width instead of stretching. */
export const QUICK_PANEL: ImageSourcePropType | undefined = require("../../../assets/ui/home/quick-panel.webp");
/** Width ÷ height of QUICK_PANEL. */
export const QUICK_PANEL_RATIO = 1086 / 344;
export const SCENE_TOP: ImageSourcePropType | undefined = undefined;
export const SCENE_BOTTOM: ImageSourcePropType | undefined = undefined;
export const DICE: ImageSourcePropType | undefined = undefined;
export const CHAIR: ImageSourcePropType | undefined = undefined;
export const INVITE_DICE: ImageSourcePropType | undefined = undefined;
export const MEEPLE: ImageSourcePropType | undefined = undefined;
export const CROWN_COIN: ImageSourcePropType | undefined = undefined;

/** The home screen uses the app-wide table palette. */
export { TABLE as HOME } from "@/theme";
