import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from "@expo-google-fonts/poppins";
import { rememberChanges, restore } from "@/api/remember";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import {
  QueryClient,
  QueryClientProvider,
  focusManager,
} from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import * as Linking from "expo-linking";
import Head from "expo-router/head";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, AppState, Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

import {
  AppIntro,
  useIntroAppStyle,
  useIntroScale,
} from "@/components/AppIntro";
import { WebFrame } from "@/components/ui";
import { BorderClockProvider } from "@/features/cosmetics/art";
import { SessionProvider, useSession } from "@/context/SessionContext";
import { FriendsRealtime } from "@/features/friends/FriendsRealtime";
import { MeepleTransitionProvider } from "@/features/mascot/MeepleTransition";
import { PlayerCardProvider } from "@/features/players/PlayerCardProvider";
import { useOtaUpdates } from "@/hooks/useOtaUpdates";
import { LocaleProvider } from "@/i18n/LocaleContext";
import "@/i18n";
import { TABLE_COLORS, ThemeProvider, ThemeScope } from "@/theme";
import { invitePathFromLink } from "@/utils/share";

SplashScreen.preventAutoHideAsync();

// React Native has no window focus events — drive TanStack Query's
// refetchOnWindowFocus from AppState instead.
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (status) => {
    focusManager.setFocused(status === "active");
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
    },
  },
});
// the game list, my tables and my card come back from last time at once
// (refreshed as soon as they're shown), and are kept as they change
const restored = restore(queryClient);
rememberChanges(queryClient);

// An invite link (/join/CODE) opened by someone who isn't signed in
// lands on the login screen. It is remembered so they end up at the
// table once they've logged in or registered.
const INVITE_PATH = /^\/join\/[A-Za-z0-9]{6}\/?$/;

// Web: the address the page was loaded with.
const webInvitePath =
  Platform.OS === "web" &&
  typeof window !== "undefined" &&
  INVITE_PATH.test(window.location.pathname)
    ? window.location.pathname
    : null;

function RootNavigator() {
  const { status } = useSession();
  const router = useRouter();
  useOtaUpdates();

  // Phones: the link that opened the app (or arrived while it was open)
  const linkUrl = Linking.useLinkingURL();
  const invitePath =
    Platform.OS === "web" ? webInvitePath : invitePathFromLink(linkUrl);

  const pendingInvite = useRef<string | null>(null);
  // The last invite dealt with, so one link is only ever followed once
  const handledInvite = useRef<string | null>(null);
  useEffect(() => {
    if (status === "loading") return;
    if (invitePath && handledInvite.current !== invitePath) {
      handledInvite.current = invitePath;
      // Signed in: the router has already opened the table by itself
      if (status === "signedOut") pendingInvite.current = invitePath;
    }
    if (status === "signedIn" && pendingInvite.current) {
      const path = pendingInvite.current;
      pendingInvite.current = null;
      router.replace(path as never);
    }
  }, [status, router, invitePath]);

  // Phones open by flying in through the logo; the app zooms along
  const introScale = useIntroScale();
  const appStyle = useIntroAppStyle(introScale);
  const signedIn = status === "signedIn";

  // The intro keeps one place in this list whatever the status, so it is
  // never mounted twice
  return (
    <>
      {status === "loading" ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator />
        </View>
      ) : (
        <Animated.View style={appStyle}>
          {Platform.OS === "web" ? (
            <Head>
              <title>Boardly</title>
            </Head>
          ) : null}
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Protected guard={signedIn}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="lobby/[code]" />
              <Stack.Screen name="game/[code]" />
              <Stack.Screen name="join/[code]" />
              <Stack.Screen name="borders" />
              {/* opened through the meeple, like the wardrobe */}
              <Stack.Screen
                name="badges"
                options={{ animation: "none", gestureEnabled: false }}
              />
              {/* the wardrobe brings its own way in and out (MeepleReveal);
                  only its back button closes it */}
              <Stack.Screen
                name="wardrobe"
                options={{ animation: "none", gestureEnabled: false }}
              />
            </Stack.Protected>
            <Stack.Protected guard={!signedIn}>
              <Stack.Screen name="(auth)" />
            </Stack.Protected>
          </Stack>
        </Animated.View>
      )}
      {signedIn ? <FriendsRealtime /> : null}
      {Platform.OS === "web" ? null : (
        <AppIntro ready={status !== "loading"} scale={introScale} />
      )}
    </>
  );
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    restored.finally(() => setReady(true));
  }, []);
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    // On phones the intro (AppIntro) takes over from the splash itself
    if (fontsLoaded && Platform.OS === "web") {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded || !ready) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            {/* One look for the whole app; games with a skin layer their
                own colours on top inside their screens. */}
            <ThemeScope colors={TABLE_COLORS}>
              <LocaleProvider>
                <SessionProvider>
                  <WebFrame>
                    <BorderClockProvider>
                      <BottomSheetModalProvider>
                        <PlayerCardProvider>
                          {/* moving between some screens goes through the meeple,
                              over everything (MeepleTransition) */}
                          <MeepleTransitionProvider>
                            <RootNavigator />
                          </MeepleTransitionProvider>
                        </PlayerCardProvider>
                      </BottomSheetModalProvider>
                    </BorderClockProvider>
                  </WebFrame>
                </SessionProvider>
              </LocaleProvider>
            </ThemeScope>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
