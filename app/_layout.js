import { Stack } from "expo-router";
import { ReusoProvider } from "../context/ReusoContext";

export default function RootLayout() {
  return (
    <ReusoProvider>
      <Stack screenOptions={{ headerShown: false }}>

        {/* Tus tabs */}
        <Stack.Screen name="(tabs)" />

        {/* Login / registro */}
        <Stack.Screen name="(auth)" />

      </Stack>
    </ReusoProvider>
  );
}
