import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#00b894" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Mapa de Reciclaje",
        }}
      />
      <Stack.Screen
        name="login"
        options={{
          title: "Iniciar Sesión",
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          title: "Registro",
        }}
      />
    </Stack>
  );
}
