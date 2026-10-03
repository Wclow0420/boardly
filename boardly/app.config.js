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
const PROD_BUNDLE_IDENTIFIER = "com.boardly.app";
const PROD_PACKAGE_NAME = "com.boardly.app";
const PROD_SCHEME = "boardly";

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
      icon: "./assets/expo.icon",
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
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      predictiveBackGestureEnabled: false,
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
      output: "static",
      favicon: "./assets/images/favicon.png",
    },

    // === Plugins ===
    plugins: [
      ...(config.plugins ?? []),
      "expo-router",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#208AEF",
          image: "./assets/images/splash-icon.png",
          imageWidth: 76,
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
