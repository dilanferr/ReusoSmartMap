import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { BACKEND_URL } from "../../config";

export default function Register() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const fadeAnim = new Animated.Value(0);

  // Animación de entrada
  Animated.timing(fadeAnim, {
    toValue: 1,
    duration: 600,
    useNativeDriver: true,
  }).start();

  const handleRegister = async () => {
    if (!nombre || !email || !password) {
      return Alert.alert(
        "Campos incompletos",
        "Por favor completa todos los campos."
      );
    }

    // Validación de contraseña
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

    if (!passwordRegex.test(password)) {
      return Alert.alert(
        "Contraseña insegura",
        "Debe tener mínimo 8 caracteres, una letra mayúscula, una minúscula, un número y un símbolo."
      );
    }

    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/users/register`, {
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
        Alert.alert("🎉 Registro exitoso", "Tu cuenta ha sido creada correctamente.", [
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
      Alert.alert("Error de conexión", "No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <Text style={styles.title}>Crear Cuenta</Text>
        <Text style={styles.subtitle}>
          Únete a ReusoSmart y comienza a reciclar con impacto.
        </Text>

        <View style={styles.card}>
          <TextInput
            style={styles.input}
            placeholder="Nombre completo"
            placeholderTextColor="#aaa"
            value={nombre}
            onChangeText={setNombre}
          />

          <TextInput
            style={styles.input}
            placeholder="Correo electrónico"
            placeholderTextColor="#aaa"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="Contraseña segura"
            placeholderTextColor="#aaa"
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
        </View>

        <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
          <Text style={styles.link}>¿Ya tienes cuenta? Inicia sesión</Text>
        </TouchableOpacity>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 28,
    backgroundColor: "#F8F9F8",
    justifyContent: "center",
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#006D40",
    textAlign: "center",
  },

  subtitle: {
    textAlign: "center",
    color: "#555",
    fontSize: 14,
    marginBottom: 25,
  },

  card: {
    backgroundColor: "white",
    padding: 22,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    marginBottom: 20,
    elevation: 2,
  },

  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#DCDCDC",
    paddingVertical: 12,
    marginBottom: 22,
    fontSize: 15,
    color: "#333",
  },

  button: {
    backgroundColor: "#006D40",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 15,
    alignItems: "center",
  },

  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },

  link: {
    color: "#006D40",
    textAlign: "center",
    marginTop: 10,
    fontWeight: "bold",
  },
});
