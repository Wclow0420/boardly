import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  api,
  setAccessToken,
  setUnauthorizedHandler,
  type AuthUser,
} from "@/api/client";
import { connectUserSocket, disconnectUserSocket } from "@/api/socket";
import { tokenStorage } from "@/api/tokenStorage";

export type SessionStatus = "loading" | "signedOut" | "signedIn";

interface SessionContextValue {
  user: AuthUser | null;
  status: SessionStatus;
  /** Throw ApiError on failure — screens surface the message. */
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (current: string, next: string) => Promise<void>;
  /** Replaces the signed-in user with a fresher copy from the server. */
  updateUser: (user: AuthUser) => void;
  /** Spends coins to unlock a profile border. */
  buyBorder: (borderId: string) => Promise<void>;
  /** Changes the profile border everyone sees around this player. */
  setBorder: (borderId: string) => Promise<void>;
  /** Sets the profile picture (base64 JPEG/PNG/WebP), or null to remove it. */
  setAvatar: (image: string | null) => Promise<void>;
  /** Permanently deletes the account, then signs out. */
  deleteAccount: (password: string) => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<SessionStatus>("loading");

  const signOutLocally = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setStatus("signedOut");
    tokenStorage.clear().catch(() => {});
  }, []);

  // Bootstrap: restore tokens and validate them against /auth/me.
  // request() refreshes automatically if the access token expired.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await tokenStorage.getAccessToken();
      if (!stored) {
        if (!cancelled) setStatus("signedOut");
        return;
      }
      setAccessToken(stored);
      try {
        const { user: me } = await api.auth.me();
        if (!cancelled) {
          setUser(me);
          setStatus("signedIn");
        }
      } catch {
        if (!cancelled) signOutLocally();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [signOutLocally]);

  // The socket follows the session: connected = online for friends.
  useEffect(() => {
    if (status === "signedIn") connectUserSocket();
    else if (status === "signedOut") disconnectUserSocket();
  }, [status]);

  // Any API call that stays 401 after a refresh signs the user out.
  useEffect(() => {
    setUnauthorizedHandler(signOutLocally);
    return () => setUnauthorizedHandler(null);
  }, [signOutLocally]);

  const applyAuthResult = useCallback(
    async (result: Awaited<ReturnType<typeof api.auth.login>>) => {
      setAccessToken(result.accessToken);
      await tokenStorage.setTokens(result.accessToken, result.refreshToken);
      setUser(result.user);
      setStatus("signedIn");
    },
    []
  );

  const login = useCallback(
    async (username: string, password: string) => {
      await applyAuthResult(await api.auth.login(username, password));
    },
    [applyAuthResult]
  );

  const register = useCallback(
    async (username: string, password: string) => {
      await applyAuthResult(await api.auth.register(username, password));
    },
    [applyAuthResult]
  );

  const logout = useCallback(async () => {
    signOutLocally();
  }, [signOutLocally]);

  const changePassword = useCallback(
    async (current: string, next: string) => {
      await applyAuthResult(await api.auth.changePassword(current, next));
    },
    [applyAuthResult]
  );

  const updateUser = useCallback((next: AuthUser) => setUser(next), []);

  const buyBorder = useCallback(async (borderId: string) => {
    const { user: updated } = await api.auth.buyBorder(borderId);
    setUser(updated);
  }, []);

  const setBorder = useCallback(async (borderId: string) => {
    const { user: updated } = await api.auth.setBorder(borderId);
    setUser(updated);
  }, []);

  const setAvatar = useCallback(async (image: string | null) => {
    const { user: updated } =
      image === null
        ? await api.auth.removeAvatar()
        : await api.auth.uploadAvatar(image);
    setUser(updated);
  }, []);

  const deleteAccount = useCallback(
    async (password: string) => {
      await api.auth.deleteAccount(password);
      signOutLocally();
    },
    [signOutLocally]
  );

  const value = useMemo(
    () => ({
      user,
      status,
      login,
      register,
      logout,
      changePassword,
      updateUser,
      buyBorder,
      setBorder,
      setAvatar,
      deleteAccount,
    }),
    [
      user,
      status,
      login,
      register,
      logout,
      changePassword,
      updateUser,
      buyBorder,
      setBorder,
      setAvatar,
      deleteAccount,
    ]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
