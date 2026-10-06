import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from "@expo-google-fonts/poppins";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import {
  QueryClient,
  QueryClientProvider,
  focusManager,
} from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import Head from "expo-router/head";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { ActivityIndicator, AppState, Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { WebFrame } from "@/components/ui";
import { SessionProvider, useSession } from "@/context/SessionContext";
import { FriendsRealtime } from "@/features/friends/FriendsRealtime";
import { useOtaUpdates } from "@/hooks/useOtaUpdates";
import { LocaleProvider } from "@/i18n/LocaleContext";
import "@/i18n";
import { TABLE_COLORS, ThemeProvider, ThemeScope } from "@/theme";

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

// Web: an invite link (/join/CODE) opened by someone who isn't signed
// in lands on the login screen. Remember it so they end up at the table
// once they've logged in or registered.
const invitePath =
  Platform.OS === "web" &&
  typeof window !== "undefined" &&
  /^\/join\/[A-Za-z0-9]{6}\/?$/.test(window.location.pathname)
    ? window.location.pathname
    : null;

function RootNavigator() {
  const { status } = useSession();
  const router = useRouter();
  useOtaUpdates();

  const pendingInvite = useRef<string | null>(null);
  useEffect(() => {
    if (status === "signedOut" && invitePath && pendingInvite.current === null) {
      pendingInvite.current = invitePath;
    } else if (status === "signedIn" && pendingInvite.current) {
      const path = pendingInvite.current;
      pendingInvite.current = "";
      router.replace(path as never);
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  const signedIn = status === "signedIn";

  return (
    <>
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
        </Stack.Protected>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
      {signedIn ? <FriendsRealtime /> : null}
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
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
                  <BottomSheetModalProvider>
                    <RootNavigator />
                  </BottomSheetModalProvider>
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
