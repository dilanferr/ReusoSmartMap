import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function Perfil() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>👤 Perfil de Usuario</Text>

      <View style={styles.box}>
        <Text style={styles.info}>Nombre: —</Text>
        <Text style={styles.info}>Correo: —</Text>
      </View>

      <TouchableOpacity
        style={styles.loginButton}
        onPress={() => router.push("/(auth)/login")}
      >
        <Text style={styles.buttonText}>Iniciar Sesión</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.registerButton}
        onPress={() => router.push("/(auth)/register")}
      >
        <Text style={styles.buttonText}>Crear Cuenta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#006D40",
    marginBottom: 30,
  },
  box: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 30,
  },
  info: {
    fontSize: 16,
    color: "#333",
    marginBottom: 8,
  },
  loginButton: {
    backgroundColor: "#006D40",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginBottom: 15,
  },
  registerButton: {
    backgroundColor: "#0984E3",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
