// /app/(tabs)/recicla.js
import { View, Text, StyleSheet } from "react-native";

export default function Recicla() {
  return (
    <View style={styles.center}>
      <Text style={styles.text}>Historial y certificados de reciclaje ♻️</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { fontSize: 18, fontWeight: "600" },
});
