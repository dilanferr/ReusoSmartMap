// /app/(tabs)/perfil.js
import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { jwtDecode } from "jwt-decode";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { BACKEND_URL } from "../../config";

export default function Perfil() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [totalReciclajes, setTotalReciclajes] = useState(0);
  const [puntos, setPuntos] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ======================================================
  // CARGA DE USUARIO + RECICLAJES + PUNTOS
  // ======================================================
  useEffect(() => {
    const load = async () => {
      const raw = await AsyncStorage.getItem("user");
      if (!raw) return;

      const parsed = JSON.parse(raw);
      setUser(parsed);

      let uid = null;
      try {
        const decoded = jwtDecode(parsed.token);
        uid = decoded.id;
      } catch {
        console.log("❌ No se pudo leer el ID del token");
      }

      if (uid) obtenerReciclajesYpuntos(uid);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }).start();
    };

    load();
  }, []);

  // ======================================================
  // OBTENER RECICLAJES Y PUNTOS SUMADOS
  // ======================================================
  const obtenerReciclajesYpuntos = async (uid) => {
    try {
      const res = await fetch(`${BACKEND_URL}/reciclaje/usuario/${uid}`);
      const data = await res.json();

      if (!data?.ok) {
        setTotalReciclajes(0);
        setPuntos(0);
        return;
      }

      // Total de reciclajes
      setTotalReciclajes(data.total);

      // SUMA de todos los puntos obtenidos
      const sumaPuntos = data.data.reduce(
        (acc, item) => acc + (item.puntos_obtenidos || 0),
        0
      );

      setPuntos(sumaPuntos);
    } catch (err) {
      console.log("Error cargando reciclajes/puntos:", err);
      setTotalReciclajes(0);
      setPuntos(0);
    }
  };

  // ======================================================
  // LOGOUT
  // ======================================================
  const logout = async () => {
    await AsyncStorage.removeItem("user");
    router.push("/(auth)/login");
  };

  // ======================================================
  // VISTA SIN SESIÓN
  // ======================================================
  if (!user) {
    return (
      <View style={styles.noUserContainer}>
        <Image
          source={{
            uri: "https://cdn-icons-png.flaticon.com/512/6596/6596121.png",
          }}
          style={styles.noUserImage}
        />

        <Text style={styles.noUserTitle}>¡Bienvenido! 👋</Text>
        <Text style={styles.noUserText}>
          Inicia sesión o crea una cuenta para ver tu progreso.
        </Text>

        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => router.push("/(auth)/login")}
        >
          <Text style={styles.loginBtnText}>Iniciar sesión</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerBtn}
          onPress={() => router.push("/(auth)/register")}
        >
          <Text style={styles.registerBtnText}>Crear cuenta</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ========================================
  // MANEJO SEGURO DEL NOMBRE
  // ========================================
  const nombreSeguro =
    user.name || user.fullname || user.nombre || user.username || "Usuario";

  // ======================================================
  // PERFIL COMPLETO
  // ======================================================
  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <View style={styles.header}>
          <Image
            source={{
              uri:
                user.avatar ||
                "https://cdn-icons-png.flaticon.com/512/456/456212.png",
            }}
            style={styles.avatar}
          />

          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{nombreSeguro}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>
        </View>

        {/* ESTADÍSTICAS */}
        <View style={styles.statsContainer}>
          {/* Reciclajes */}
          <View style={styles.statBox}>
            <FontAwesome5 name="recycle" size={22} color="#006D40" />
            <Text style={styles.statNumber}>{totalReciclajes}</Text>
            <Text style={styles.statLabel}>Reciclajes</Text>
          </View>

          {/* Puntos */}
          <View style={styles.statBox}>
            <MaterialIcons name="stars" size={24} color="#FFD700" />
            <Text style={styles.statNumber}>{puntos}</Text>
            <Text style={styles.statLabel}>Puntos</Text>
          </View>
        </View>

        {/* MEDALLAS */}
        <Text style={styles.sectionTitle}>🏅 Tus Medallas</Text>
        <View style={styles.badgesContainer}>
          <Image
            source={{ uri: "https://cdn-icons-png.flaticon.com/512/2583/2583383.png" }}
            style={styles.badge}
          />
          <Image
            source={{ uri: "https://cdn-icons-png.flaticon.com/512/2583/2583311.png" }}
            style={styles.badge}
          />
          <Image
            source={{ uri: "https://cdn-icons-png.flaticon.com/512/2583/2583363.png" }}
            style={styles.badge}
          />
        </View>

        {/* OPCIONES */}
        <Text style={styles.sectionTitle}>⚙️ Opciones</Text>

        {/* Historial */}
        <TouchableOpacity
          style={styles.optionRow}
          onPress={() => router.push("/historial")}
        >
          <Ionicons name="time-outline" size={26} color="#006D40" />
          <Text style={styles.optionText}>Historial de Reciclajes</Text>
        </TouchableOpacity>

        {/* Editar perfil */}
        <TouchableOpacity
          style={styles.optionRow}
          onPress={() => router.push("/editar-perfil")}
        >
          <Ionicons name="person-circle-outline" size={26} color="#006D40" />
          <Text style={styles.optionText}>Editar perfil</Text>
        </TouchableOpacity>

        {/* Ayuda */}
        <TouchableOpacity style={styles.optionRow}>
          <Ionicons name="help-circle-outline" size={26} color="#006D40" />
          <Text style={styles.optionText}>Ayuda</Text>
        </TouchableOpacity>

        {/* LOGOUT */}
        <TouchableOpacity style={styles.logoutBtn2} onPress={logout}>
          <Ionicons name="log-out-outline" size={26} color="#fff" />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

      </ScrollView>
    </Animated.View>
  );
}

//
// 🎨 ESTILOS — MANTENIDOS IGUAL
//
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAF9",
    paddingHorizontal: 20,
    paddingTop: 30,
  },

  // SIN USUARIO
  noUserContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    backgroundColor: "#F9FAF9",
  },
  noUserImage: { width: 150, height: 150, marginBottom: 25 },
  noUserTitle: { fontSize: 28, fontWeight: "bold", color: "#006D40" },
  noUserText: {
    fontSize: 15,
    color: "#666",
    marginTop: 10,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  loginBtn: {
    backgroundColor: "#006D40",
    width: "85%",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
  },
  loginBtnText: { color: "#fff", fontWeight: "bold" },
  registerBtn: {
    borderColor: "#006D40",
    borderWidth: 2,
    width: "85%",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 12,
  },
  registerBtnText: { color: "#006D40", fontWeight: "bold" },

  // HEADER
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
    gap: 15,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#006D40",
  },
  name: { fontSize: 23, fontWeight: "bold", color: "#006D40" },
  email: { fontSize: 14, color: "#777", marginTop: 3 },

  // ESTADÍSTICAS
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: "white",
    paddingVertical: 20,
    borderRadius: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#006D40",
    marginTop: 4,
  },
  statLabel: { fontSize: 12, color: "#666" },

  // MEDALLAS
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#006D40",
    marginBottom: 12,
    marginTop: 20,
  },
  badgesContainer: { flexDirection: "row", gap: 12, marginBottom: 25 },
  badge: { width: 60, height: 60 },

  // OPCIONES
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  optionText: { fontSize: 16, marginLeft: 12, color: "#333" },

  // LOGOUT
  logoutBtn2: {
    marginTop: 25,
    backgroundColor: "#E74C3C",
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 20,
  },
  logoutText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
