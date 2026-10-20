// A layer for bordered avatars over everything else on a screen. A
// border draws well outside its avatar (wings, flames, a dragon), and
// anything laid out after it (the next card in a grid, a panel's rim)
// would paint over that. Inside an <AvatarStage>, each AvatarBorder
// leaves a hole of its own size in place and is drawn in the stage's top
// layer at the same spot. Put the stage inside the scrolling content, so
// the layer scrolls with it and nothing has to follow the scroll.

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

interface Staged {
  ref: RefObject<View | null>;
  element: ReactElement;
}

interface Placed {
  element: ReactElement;
  x: number;
  y: number;
}

export interface Stage {
  /** Show `element` over the stage where `ref` sits (again on change). */
  put: (key: string, ref: RefObject<View | null>, element: ReactElement) => void;
  remove: (key: string) => void;
  /** Its hole moved: find it again. */
  moved: (key: string) => void;
}

export const StageContext = createContext<Stage | null>(null);

/** How often the stage looks again for holes that moved without being
 *  told (a card above them grew, a player joined). */
const RECHECK_MS = 400;

export function AvatarStage({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const stageRef = useRef<View>(null);
  const staged = useRef(new Map<string, Staged>());
  const [placed, setPlaced] = useState<Record<string, Placed>>({});

  const measure = useCallback((key: string) => {
    const stage = stageRef.current;
    const item = staged.current.get(key);
    const hole = item?.ref.current;
    if (!stage || !item || !hole) return;
    hole.measureLayout(
      stage,
      (x, y) => {
        setPlaced((all) => {
          const was = all[key];
          if (was && was.x === x && was.y === y && was.element === item.element)
            return all;
          return { ...all, [key]: { element: item.element, x, y } };
        });
      },
      () => {},
    );
  }, []);

  const measureAll = useCallback(() => {
    for (const key of staged.current.keys()) measure(key);
  }, [measure]);

  const stage = useMemo<Stage>(
    () => ({
      put: (key, ref, element) => {
        staged.current.set(key, { ref, element });
        measure(key);
      },
      remove: (key) => {
        staged.current.delete(key);
        setPlaced((all) => {
          if (!(key in all)) return all;
          const next = { ...all };
          delete next[key];
          return next;
        });
      },
      moved: measure,
    }),
    [measure],
  );

  useEffect(() => {
    const timer = setInterval(measureAll, RECHECK_MS);
    return () => clearInterval(timer);
  }, [measureAll]);

  return (
    <View ref={stageRef} collapsable={false} style={style} onLayout={measureAll}>
      <StageContext.Provider value={stage}>{children}</StageContext.Provider>
      {/* the top layer: drawn last, so over everything; touches go to the
          holes underneath */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <StageContext.Provider value={null}>
          {Object.entries(placed).map(([key, { element, x, y }]) => (
            <View key={key} style={{ position: "absolute", left: x, top: y }}>
              {element}
            </View>
          ))}
        </StageContext.Provider>
      </View>
    </View>
  );
}
