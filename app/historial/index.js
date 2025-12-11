// /app/(tabs)/historial.js
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { BACKEND_URL } from "../../config";

export default function Historial() {
  const [loading, setLoading] = useState(true);
  const [reciclajes, setReciclajes] = useState([]);

  useEffect(() => {
    cargarHistorial();
  }, []);

  const cargarHistorial = async () => {
    try {
      const raw = await AsyncStorage.getItem("user");
      if (!raw) return;

      const parsed = JSON.parse(raw);
      const decoded = jwtDecode(parsed.token);
      const uid = decoded.id;

      const res = await fetch(`${BACKEND_URL}/reciclaje/usuario/${uid}`);
      const data = await res.json();

      if (!data.ok) {
        setReciclajes([]);
        setLoading(false);
        return;
      }

      const registros = data.data;

      // Obtener info de cada punto
      const registrosConPunto = await Promise.all(
        registros.map(async (rec) => {
          try {
            const r2 = await fetch(`${BACKEND_URL}/puntos/${rec.puntoId}`);
            const j2 = await r2.json();

            return {
              ...rec,
              punto: j2?.punto || null,
            };
          } catch {
            return { ...rec, punto: null };
          }
        })
      );

      setReciclajes(registrosConPunto);
      setLoading(false);
    } catch (e) {
      console.log("Error historial:", e);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#008f5a" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>

      <Text style={styles.title}>🧾 Historial de Reciclajes</Text>

      {reciclajes.length === 0 ? (
        <Text style={styles.empty}>Aún no has reciclado nada.</Text>
      ) : (
        reciclajes.map((item, index) => (
          <View key={index} style={styles.card}>
            {/* FECHA */}
            <Text style={styles.date}>
              {new Date(item.fecha).toLocaleString()}
            </Text>

            {/* NOMBRE PUNTO */}
            <Text style={styles.pointName}>
              📍 {item.punto?.nombre_punto || "Punto desconocido"}
            </Text>

            {/* DIRECCIÓN */}
            <Text style={styles.pointDir}>
              {item.punto?.direccion_completa || ""}
            </Text>

            {/* OBJETOS */}
            <View style={styles.row}>
              <FontAwesome5 name="recycle" size={16} color="#0a8458" />
              <Text style={styles.objText}>Objetos: {item.objetos.join(", ")}</Text>
            </View>

            {/* PUNTOS */}
            <View style={styles.row}>
              <Ionicons name="star" size={18} color="#f7c600" />
              <Text style={styles.points}>+{item.puntos_obtenidos} puntos</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F7F6",
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#006D40",
    marginBottom: 20,
    textAlign: "center",
  },
  empty: {
    textAlign: "center",
    fontSize: 15,
    color: "#777",
    marginTop: 20,
  },
  card: {
    backgroundColor: "#fff",
    padding: 14,
    marginBottom: 14,
    borderRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  date: {
    fontSize: 12,
    color: "#666",
    marginBottom: 6,
  },
  pointName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0a8458",
  },
  pointDir: {
    fontSize: 14,
    color: "#444",
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  objText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#333",
  },
  points: {
    marginLeft: 6,
    fontSize: 15,
    fontWeight: "bold",
    color: "#cc8a00",
  },
});
