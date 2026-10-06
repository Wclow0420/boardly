// Auth token storage — SECURITY STANDARD (see NEW_PROJECT_PLAYBOOK.md):
// on device, tokens live in the Keychain/Keystore via expo-secure-store,
// NEVER in AsyncStorage (which is plain text on disk). AsyncStorage is
// only for non-sensitive preferences (theme, language).
// On web SecureStore doesn't exist, so tokens live in localStorage —
// the usual trade-off for a browser SPA (readable by any script on the
// page, so keep third-party scripts off it). Access tokens are short
// lived and changing the password revokes every session.

import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const ACCESS_TOKEN_KEY = "boardly.accessToken";
const REFRESH_TOKEN_KEY = "boardly.refreshToken";

const webStore = {
  async getItemAsync(key: string) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  async setItemAsync(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch {}
  },
  async deleteItemAsync(key: string) {
    try {
      localStorage.removeItem(key);
    } catch {}
  },
};

const store = Platform.OS === "web" ? webStore : SecureStore;

export const tokenStorage = {
  getAccessToken: () => store.getItemAsync(ACCESS_TOKEN_KEY),
  getRefreshToken: () => store.getItemAsync(REFRESH_TOKEN_KEY),

  setTokens: async (accessToken: string, refreshToken?: string) => {
    await store.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) {
      await store.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    }
  },

  clear: async () => {
    await store.deleteItemAsync(ACCESS_TOKEN_KEY);
    await store.deleteItemAsync(REFRESH_TOKEN_KEY);
  },
};
