import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* 🚀 Abre siempre las pestañas primero */}
      <Stack.Screen name="(tabs)" />
      
      {/* 🔐 Pantallas de autenticación (accesibles desde Perfil) */}
      <Stack.Screen name="(auth)" />
    </Stack>
  );
}