// Dynamic Expo config — replaces app.json.
// The build profile (eas.json) sets APP_ENV, which drives the app name,
// bundle identifier, package name and scheme per environment.

import { readFileSync } from "fs";

let appVersion = "1.0.0";
try {
  appVersion = JSON.parse(
    readFileSync(new URL("./package.json", import.meta.url), "utf8")
  ).version;
} catch (e) {
  console.warn("Could not read version from package.json:", e);
}

const EAS_PROJECT_ID = "8075bfed-ede2-4e59-ba38-b56b15caa9c6";
const OWNER = "boardly-app";
const PROJECT_SLUG = "boardly";

// --- Production values ---
const PROD_APP_NAME = "Boardly";
const PROD_BUNDLE_IDENTIFIER = "com.boardly.lol";
const PROD_PACKAGE_NAME = "com.boardly.lol";
const PROD_SCHEME = "boardly";
// Invite links are https://boardly.lol/join/CODE. The website (see
// /website) vouches for the production app only, so only production
// builds claim the domain; the others keep their own scheme links.
const LINK_HOST = "boardly.lol";

// Environment-specific identity (name / ids / scheme).
// All environments share the same icons for now — add per-env icons in
// assets/images and switch on `environment` here when you have them.
const getDynamicAppConfig = (environment) => {
  if (environment === "production") {
    return {
      name: PROD_APP_NAME,
      bundleIdentifier: PROD_BUNDLE_IDENTIFIER,
      packageName: PROD_PACKAGE_NAME,
      scheme: PROD_SCHEME,
    };
  }

  if (environment === "preview") {
    return {
      name: `${PROD_APP_NAME} Preview`,
      bundleIdentifier: `${PROD_BUNDLE_IDENTIFIER}.preview`,
      packageName: `${PROD_PACKAGE_NAME}.preview`,
      scheme: `${PROD_SCHEME}-preview`,
    };
  }

  // Default: development
  return {
    name: `${PROD_APP_NAME} Dev`,
    bundleIdentifier: `${PROD_BUNDLE_IDENTIFIER}.dev`,
    packageName: `${PROD_PACKAGE_NAME}.dev`,
    scheme: `${PROD_SCHEME}-dev`,
  };
};

export default ({ config }) => {
  const environment = process.env.APP_ENV || "development";
  console.log(`⚙️ Building app for environment: ${environment}`);

  // EXPO_PUBLIC_API_URL is not in eas.json: it comes from the EAS
  // environment of the build profile (expo.dev → Environment variables),
  // or from .env.local on your own machine. Without it the app would
  // quietly talk to localhost, so a cloud build stops here instead.
  if (!process.env.EXPO_PUBLIC_API_URL && environment !== "development") {
    const message = `EXPO_PUBLIC_API_URL is not set for the "${environment}" environment. Add it on expo.dev (Environment variables).`;
    if (process.env.EAS_BUILD === "true") throw new Error(message);
    console.warn(`⚠️ ${message}`);
  }

  const { name, bundleIdentifier, packageName, scheme } =
    getDynamicAppConfig(environment);

  return {
    ...config,
    name,
    slug: PROJECT_SLUG,
    version: appVersion,
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme,
    userInterfaceStyle: "automatic",
    assetBundlePatterns: ["**/*"],

    // === iOS ===
    ios: {
      ...(config.ios ?? {}),
      supportsTablet: false,
      bundleIdentifier,
      ...(environment === "production"
        ? { associatedDomains: [`applinks:${LINK_HOST}`] }
        : {}),
      buildNumber: config.ios?.buildNumber ?? appVersion,
      infoPlist: {
        ...(config.ios?.infoPlist ?? {}),
        ITSAppUsesNonExemptEncryption: false,
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: false,
          // Allow http://localhost:5005 (Flask backend) in development
          NSAllowsLocalNetworking: environment === "development",
        },
      },
    },

    // === Android ===
    android: {
      ...(config.android ?? {}),
      package: packageName,
      adaptiveIcon: {
        ...(config.android?.adaptiveIcon ?? {}),
        backgroundColor: "#18202B",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      predictiveBackGestureEnabled: false,
      ...(environment === "production"
        ? {
            intentFilters: [
              {
                action: "VIEW",
                autoVerify: true,
                data: [{ scheme: "https", host: LINK_HOST, pathPrefix: "/join/" }],
                category: ["BROWSABLE", "DEFAULT"],
              },
            ],
          }
        : {}),
      permissions: Array.from(
        new Set([
          ...(config.android?.permissions ?? []),
          "android.permission.INTERNET",
          "android.permission.VIBRATE",
        ])
      ),
    },

    // === Web ===
    web: {
      ...(config.web ?? {}),
      bundler: "metro",
      // Single-page app: every screen sits behind login and table URLs
      // (/join/CODE, /lobby/CODE, /game/CODE) are dynamic, so there is
      // nothing to pre-render. The host must serve index.html for
      // unknown paths.
      output: "single",
      favicon: "./assets/images/favicon.png",
    },

    // === Plugins ===
    plugins: [
      ...(config.plugins ?? []),
      "expo-router",
      "expo-audio",
      [
        "expo-image-picker",
        {
          // Only the photo library is used, for profile pictures
          photosPermission:
            "Boardly uses your photos so you can pick a profile picture.",
          cameraPermission: false,
          microphonePermission: false,
        },
      ],
      [
        "expo-splash-screen",
        {
          backgroundColor: "#18202B",
          image: "./assets/images/splash-icon.png",
          imageWidth: 300,
        },
      ],
    ].filter((plugin, index, self) => {
      // De-duplicate plugins merged from the base config
      const pluginName = Array.isArray(plugin) ? plugin[0] : plugin;
      return (
        self.findIndex(
          (p) => (Array.isArray(p) ? p[0] : p) === pluginName
        ) === index
      );
    }),

    // === Experiments ===
    experiments: {
      ...(config.experiments ?? {}),
      typedRoutes: true,
      reactCompiler: true,
    },

    // === Extra ===
    extra: {
      ...(config.extra ?? {}),
      APP_ENV: environment,
      // Where shared invite links point; null = use the app's own scheme
      LINK_ORIGIN: environment === "production" ? `https://${LINK_HOST}` : null,
      router: {
        ...(config.extra?.router ?? {}),
        origin: false,
      },
      eas: {
        ...(config.extra?.eas ?? {}),
        projectId: EAS_PROJECT_ID,
      },
    },

    owner: OWNER,

    // === EAS Update ===
    updates: {
      ...(config.updates ?? {}),
      url: `https://u.expo.dev/${EAS_PROJECT_ID}`,
    },
    runtimeVersion: {
      policy: "appVersion",
    },
  };
};
