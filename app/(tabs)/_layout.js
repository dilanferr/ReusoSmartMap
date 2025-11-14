import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#FFFFFF",
        tabBarInactiveTintColor: "#B0B0B0",
        tabBarStyle: {
          backgroundColor: "#1F1F1F",
          borderTopColor: "#1F1F1F",
          height: route.name === "escanear" ? 0 : 70,
          paddingBottom: 5,
          paddingTop: 5,
          display: route.name === "escanear" ? "none" : "flex",
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="recicla"
        options={{
          title: "Reciclajes",
          tabBarIcon: ({ color }) => (
            <Ionicons name="leaf" size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="escanear"
        options={{
          title: "",
          tabBarIcon: () => (
            <View style={styles.centerButton}>
              <Ionicons name="camera" size={30} color="#FFFFFF" />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="recompensas"
        options={{
          title: "Recompensas",
          tabBarIcon: ({ color }) => (
            <Ionicons name="trophy" size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centerButton: {
    position: "absolute",
    bottom: 20,
    backgroundColor: "#006D40",
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
    elevation: 5,
  },
});
