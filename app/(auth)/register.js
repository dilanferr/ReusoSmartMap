import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Register() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!nombre || !email || !password) {
      Alert.alert("Campos incompletos", "Completa todos los campos.");
      return;
    }

    // Validar formato de contraseña
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(password)) {
      Alert.alert(
        "Contraseña insegura",
        "Debe tener mínimo 8 caracteres, mayúscula, minúscula, número y símbolo."
      );
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://192.168.1.7:5000/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          email,
          password,
          rol: 1,
        }),
      });

      const data = await response.json();
      console.log("📩 Respuesta del backend:", data);

      if (response.ok) {
        Alert.alert("✅ Registro exitoso", "Tu cuenta ha sido creada.", [
          { text: "Iniciar sesión", onPress: () => router.replace("/(auth)/login") },
        ]);
        setNombre("");
        setEmail("");
        setPassword("");
      } else {
        Alert.alert("Error", data.msg || "No se pudo registrar el usuario.");
      }
    } catch (error) {
      console.error("❌ Error al registrar:", error);
      Alert.alert(
        "Error de conexión",
        "No se pudo conectar con el servidor. Verifica tu red."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear Cuenta</Text>

      <TextInput
        style={styles.input}
        placeholder="Nombre completo"
        placeholderTextColor="#999"
        value={nombre}
        onChangeText={setNombre}
      />

      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        placeholderTextColor="#999"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña segura"
        placeholderTextColor="#999"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.7 }]}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Registrarse</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
        <Text style={styles.link}>¿Ya tienes cuenta? Inicia sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 30,
    backgroundColor: "#F8F8F8",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#006D40",
    marginBottom: 30,
    textAlign: "center",
  },
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
  link: {
    color: "#006D40",
    marginTop: 20,
    textAlign: "center",
    fontWeight: "500",
  },
});
