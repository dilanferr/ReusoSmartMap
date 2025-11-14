import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Campos incompletos", "Por favor completa todos los campos.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://192.168.1.7:5000/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log("📥 Respuesta del backend:", data);

      if (response.ok && data.token) {
        const userData = {
          nombre: data.usuario.nombre,
          email: data.usuario.email,
          rol: data.usuario.rol,
          token: data.token,
        };

        await AsyncStorage.setItem("user", JSON.stringify(userData));
        console.log("✅ Usuario guardado:", userData);

        Alert.alert("✅ Bienvenido", `Hola ${data.usuario.nombre}`);
        router.replace("/(tabs)/perfil");
      } else {
        Alert.alert("Error", data.msg || "Credenciales incorrectas.");
      }
    } catch (error) {
      console.error("❌ Error al conectar:", error);
      Alert.alert(
        "Error de conexión",
        "No se pudo conectar con el servidor. Verifica tu red Wi-Fi."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{
            uri: "https://res.cloudinary.com/dg233psnj/image/upload/v1761606971/logo_grpepa.png",
          }}
          style={styles.logo}
        />
        <Text style={styles.title}>Bienvenido a ReusoSmart</Text>
        <Text style={styles.subtitle}>
          Inicia sesión para continuar reciclando ♻️
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Correo electrónico</Text>
        <TextInput
          style={styles.input}
          placeholder="ejemplo@correo.com"
          placeholderTextColor="#aaa"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          style={styles.input}
          placeholder="********"
          placeholderTextColor="#aaa"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>Iniciar Sesión</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
          <Text style={styles.link}>
            ¿No tienes cuenta?{" "}
            <Text style={{ fontWeight: "bold", color: "#006D40" }}>
              Regístrate
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 25,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 15,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#006D40",
  },
  subtitle: {
    fontSize: 15,
    color: "#555",
    marginTop: 5,
    textAlign: "center",
  },
  form: {
    backgroundColor: "#F9F9F9",
    borderRadius: 15,
    padding: 25,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  label: { fontSize: 14, color: "#333", marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  button: {
    backgroundColor: "#006D40",
    marginTop: 25,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
  link: { color: "#333", textAlign: "center", marginTop: 20, fontSize: 14 },
});
