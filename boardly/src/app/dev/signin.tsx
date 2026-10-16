// Development only: signs a simulator in as the local test account, so
// agents testing screens needn't type its password anywhere. The account's
// name and password are read by the local server (DEV_TEST_USERNAME /
// DEV_TEST_PASSWORD in backend/.env.example) and handed over on
// localhost only. Open boardly-dev://dev/signin.

import { Redirect, useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { AppText, Screen } from "@/components/ui";
import { useSession } from "@/context/SessionContext";

export default function DevSignIn() {
  const { login } = useSession();
  const router = useRouter();
  const [note, setNote] = useState("Signing in…");
  useEffect(() => {
    if (!__DEV__) return;
    fetch("http://localhost:8098/dev-account")
      .then((r) => r.json())
      .then(({ username, password }: { username: string; password: string }) => login(username, password))
      .then(() => router.replace("/"))
      .catch((err) => setNote(`Couldn't sign in: ${String(err)} (run node scripts/dev-account.mjs)`));
  }, [login, router]);
  if (!__DEV__) return <Redirect href="/" />;
  return (
    <Screen>
      <AppText>{note}</AppText>
    </Screen>
  );
}
