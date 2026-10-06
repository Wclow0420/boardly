// App entry for web. Skia draws through CanvasKit (WebAssembly) in the
// browser, and it has to be loaded before any screen that imports Skia
// (or a library built on it, like react-native-animated-glow) is
// evaluated — so the app is only mounted once it is ready.
//
// `@expo/metro-runtime` MUST be the first import to ensure Fast Refresh
// works on web.
import "@expo/metro-runtime";

import { LoadSkiaWeb } from "@shopify/react-native-skia/lib/module/web";
import { App } from "expo-router/build/qualified-entry";
import { renderRootComponent } from "expo-router/build/renderRootComponent";

// public/canvaskit.wasm is served from the site root. Re-copy it with
// `npm run setup:skia-web` after upgrading @shopify/react-native-skia.
LoadSkiaWeb({ locateFile: (file) => `/${file}` })
  .catch((error) => {
    // Start anyway: only the Skia-drawn effects will be missing
    console.error("Skia failed to load", error);
  })
  .then(() => renderRootComponent(App));
