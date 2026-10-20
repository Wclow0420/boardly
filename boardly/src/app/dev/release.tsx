// Development only: does what a memory warning does (empties the caches
// of drawn art; utils/memory), to measure how much it frees. Open with
// boardly-dev://dev/release.

import { Redirect, useRouter } from "expo-router";
import { useEffect } from "react";

import { releaseCaches } from "@/utils/memory";

export default function ReleasePage() {
  const router = useRouter();
  useEffect(() => {
    releaseCaches();
    router.back();
  }, [router]);
  if (!__DEV__) return <Redirect href="/" />;
  return null;
}
