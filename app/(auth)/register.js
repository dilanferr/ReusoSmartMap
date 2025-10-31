import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function Register() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear Cuenta</Text>

      <TextInput style={styles.input} placeholder="Nombre completo" placeholderTextColor="#999" />
      <TextInput style={styles.input} placeholder="Correo electrónico" placeholderTextColor="#999" />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        secureTextEntry
        placeholderTextColor="#999"
      />

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Registrarse</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
        <Text style={styles.link}>¿Ya tienes cuenta? Inicia sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 30, backgroundColor: "#F8F8F8" },
  title: { fontSize: 26, fontWeight: "bold", color: "#006D40", marginBottom: 30, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    backgroundColor: "white",
  },
  button: {
    backgroundColor: "#006D40",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonText: { color: "white", fontWeight: "bold", textAlign: "center" },
  link: { color: "#006D40", marginTop: 20, textAlign: "center", fontWeight: "500" },
});
