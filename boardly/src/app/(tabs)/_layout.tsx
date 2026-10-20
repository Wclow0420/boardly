import { Tabs } from "expo-router/js-tabs";

import { TabBar } from "@/components/navigation/TabBar";
import { useWarmProfile } from "@/features/profile/warm";

export default function TabsLayout() {
  // the profile made ready in the background once the app has settled
  useWarmProfile();
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="games" />
      <Tabs.Screen name="mascot" />
      <Tabs.Screen name="friends" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
