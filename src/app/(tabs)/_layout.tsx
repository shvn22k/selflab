import { Tabs } from 'expo-router';
import { TabBar, type TabBarProps } from '@/components/TabBar';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...(props as unknown as TabBarProps)} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="activity" />
      <Tabs.Screen name="nutrition" />
      <Tabs.Screen name="workouts" />
      <Tabs.Screen name="coach" />
    </Tabs>
  );
}
