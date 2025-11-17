import { useLocalSearchParams, useRouter } from "expo-router";
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
import { BACKEND_URL } from "../../config";

export default function ResetPassword() {
  const router = useRouter();
  const { email } = useLocalSearchParams();

  const [code, setCode] = useState("");
  const [pass1, setPass1] = useState("");
  const [pass2, setPass2] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!code || !pass1 || !pass2) {
      Alert.alert("Campos incompletos", "Completa todos los campos.");
      return;
    }

    if (pass1 !== pass2) {
      Alert.alert("Contraseña no coincide", "Las contraseñas deben ser iguales.");
      return;
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(pass1)) {
      Alert.alert(
        "Contraseña insegura",
        "Debe tener mínimo 8 caracteres, mayúscula, minúscula, número y símbolo."
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/users/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          resetCode: code,
          newPassword: pass1,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert("Contraseña actualizada", "Inicia sesión con tu nueva contraseña.", [
          { text: "Ir a login", onPress: () => router.replace("/(auth)/login") },
        ]);
      } else {
        Alert.alert("Error", data.msg);
      }
    } catch (err) {
      Alert.alert("Error", "No se pudo cambiar la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Restablecer contraseña</Text>
      <Text style={styles.subtitle}>Código enviado a: {email}</Text>

      <TextInput
        style={styles.input}
        placeholder="Código de verificación"
        placeholderTextColor="#999"
        value={code}
        onChangeText={setCode}
        keyboardType="numeric"
      />

      <TextInput
        style={styles.input}
        placeholder="Nueva contraseña"
        placeholderTextColor="#999"
        secureTextEntry
        value={pass1}
        onChangeText={setPass1}
      />

      <TextInput
        style={styles.input}
        placeholder="Confirmar contraseña"
        placeholderTextColor="#999"
        secureTextEntry
        value={pass2}
        onChangeText={setPass2}
      />

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.6 }]}
        onPress={handleReset}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Actualizar contraseña</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 30,
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#F8F8F8",
  },
  title: {
    fontSize: 27,
    fontWeight: "bold",
    textAlign: "center",
    color: "#006D40",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: 25,
  },
  input: {
    borderWidth: 1,
    borderColor: "#CCC",
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#FFF",
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#006D40",
    paddingVertical: 14,
    borderRadius: 10,
  },
  buttonText: {
    textAlign: "center",
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});
