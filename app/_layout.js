import { Stack } from "expo-router";
import { ReusoProvider } from "../context/ReusoContext";

export default function RootLayout() {
  return (
    <ReusoProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
      </Stack>
    </ReusoProvider>
  );
}
