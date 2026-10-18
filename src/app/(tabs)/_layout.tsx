import { Tabs } from "expo-router";
import { NativeTabs } from "expo-router/build/native-tabs";

export default function TabsLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index"/>
      
    </NativeTabs>
  )
}