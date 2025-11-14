import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Perfil() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    const checkSession = async () => {
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    };
    checkSession();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem("user");
    setUser(null);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  // 🌱 Vista moderna cuando no hay sesión iniciada
  if (!user) {
    return (
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <View style={styles.headerBox}>
          <Image
            source={{
              uri: "https://cdn-icons-png.flaticon.com/512/6596/6596121.png",
            }}
            style={styles.illustration}
          />
          <Text style={styles.welcome}>¡Hola, visitante! 👋</Text>
          <Text style={styles.subtitle}>
            Inicia sesión o crea una cuenta para guardar tus puntos y recompensas.
          </Text>
        </View>

        <View style={styles.buttonsBox}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push("/(auth)/login")}
          >
            <Text style={styles.primaryText}>Iniciar Sesión</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push("/(auth)/register")}
          >
            <Text style={styles.secondaryText}>Crear Cuenta</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }

  // 👤 Vista de perfil si hay usuario logeado
  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Text style={styles.title}>👤 Perfil de Usuario</Text>

      <View style={styles.profileCard}>
        <Image
          source={{
            uri: "https://cdn-icons-png.flaticon.com/512/456/456212.png",
          }}
          style={styles.avatar}
        />
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAF9",
    paddingHorizontal: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAF9",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  headerBox: {
    alignItems: "center",
    marginBottom: 40,
  },
  illustration: {
    width: 130,
    height: 130,
    marginBottom: 20,
  },
  welcome: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#006D40",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#555",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 22,
  },
  buttonsBox: {
    width: "100%",
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#006D40",
    width: "90%",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#006D40",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 5,
  },
  primaryText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  secondaryButton: {
    width: "90%",
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#006D40",
  },
  secondaryText: {
    color: "#006D40",
    fontWeight: "bold",
    fontSize: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#006D40",
    marginBottom: 25,
  },
  profileCard: {
    backgroundColor: "white",
    width: "90%",
    borderRadius: 20,
    alignItems: "center",
    paddingVertical: 30,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#006D40",
  },
  email: {
    fontSize: 15,
    color: "#555",
    marginTop: 5,
  },
  logoutButton: {
    backgroundColor: "#E74C3C",
    width: "90%",
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  logoutText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
