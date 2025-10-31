// login.js
import { View, Text, StyleSheet } from "react-native";

export default function Login() {
  return (
    <View style={styles.center}>
      <Text style={styles.text}>Pantalla de Login</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { fontSize: 20, fontWeight: "bold" },
});
