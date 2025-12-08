import { Stack } from "expo-router";
import { ReusoProvider } from "../context/ReusoContext";

export default function RootLayout() {
  return (
    <ReusoProvider>
      <Stack screenOptions={{ headerShown: false }}>

        {/* Pantalla principal */}
        <Stack.Screen name="index" />

        {/* Tus tabs siguen funcionando igual */}
        <Stack.Screen name="(tabs)" />

        {/* Login / registro */}
        <Stack.Screen name="(auth)" />
      </Stack>
    </ReusoProvider>
  );
}
