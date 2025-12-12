// /app/medallas/index.js
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import {
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { BACKEND_URL } from "../../config";

export default function Medallas() {
  const [medallas, setMedallas] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [medallaSeleccionada, setMedallaSeleccionada] = useState(null);

  useEffect(() => {
    cargarMedallasUsuario();
  }, []);

  // ======================================================
  // CARGAR MEDALLAS: CATÁLOGO + DESBLOQUEADAS DEL USUARIO
  // ======================================================
  const cargarMedallasUsuario = async () => {
    try {
      const raw = await AsyncStorage.getItem("user");
      if (!raw) return;

      const parsed = JSON.parse(raw);

      let uid = null;
      try {
        const decoded = jwtDecode(parsed.token);
        uid = decoded.id;
      } catch (e) {
        return;
      }

      // 1️⃣ Obtener todas las medallas del sistema
      const resCatalogo = await fetch(`${BACKEND_URL}/medallas`);
      const dataCatalogo = await resCatalogo.json();

      // 2️⃣ Obtener las medallas desbloqueadas del usuario
      const resUsuario = await fetch(`${BACKEND_URL}/medallas/usuario/${uid}`);
      const dataUsuario = await resUsuario.json();

      const medallasDesbloqueadas =
        dataUsuario?.data?.map((m) => String(m.id_medalla._id)) || [];

      // 3️⃣ Unir catálogo + estado del usuario
      const medallasFinal = dataCatalogo.data.map((m) => ({
        id: m._id,
        nombre: m.nombre,
        descripcion: m.descripcion,
        requisito: m.requisito,
        categoria: m.categoria,
        icono: m.icono || "https://cdn-icons-png.flaticon.com/512/2583/2583383.png",
        desbloqueada: medallasDesbloqueadas.includes(String(m._id)),
      }));

      setMedallas(medallasFinal);
    } catch (err) {
      console.log("❌ Error cargando medallas:", err);
    }
  };

  const abrirDetalle = (medalla) => {
    setMedallaSeleccionada(medalla);
    setModalVisible(true);
  };

  // ======================================================
  // INTERFAZ
  // ======================================================
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏅 Tus Medallas</Text>

      <ScrollView contentContainerStyle={styles.grid}>
        {medallas.map((m) => (
          <TouchableOpacity
            key={m.id}
            style={styles.medallaBox}
            onPress={() => abrirDetalle(m)}
          >
            <Image
              source={{ uri: m.icono }}
              style={[
                styles.medallaIcon,
                !m.desbloqueada && { opacity: 0.25, tintColor: "gray" },
              ]}
            />

            <Text
              style={[
                styles.medallaNombre,
                !m.desbloqueada && { opacity: 0.5 },
              ]}
            >
              {m.nombre}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ====================== MODAL ====================== */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Ionicons
              name="close"
              size={28}
              style={styles.closeBtn}
              onPress={() => setModalVisible(false)}
            />

            {medallaSeleccionada && (
              <>
                <Image
                  source={{ uri: medallaSeleccionada.icono }}
                  style={[
                    styles.modalIcon,
                    !medallaSeleccionada.desbloqueada && {
                      opacity: 0.3,
                      tintColor: "gray",
                    },
                  ]}
                />

                <Text style={styles.modalTitle}>
                  {medallaSeleccionada.nombre}
                </Text>

                <Text style={styles.modalDesc}>
                  {medallaSeleccionada.descripcion}
                </Text>

                <Text style={styles.modalReq}>
                  🎯 Requisito: {medallaSeleccionada.requisito}
                </Text>

                {!medallaSeleccionada.desbloqueada && (
                  <Text style={styles.bloqueadaText}>
                    🔒 Aún no está desbloqueada
                  </Text>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ======================================================
// ESTILOS
// ======================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAF9",
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#006D40",
    marginBottom: 20,
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 20,
  },
  medallaBox: {
    width: "40%",
    alignItems: "center",
  },
  medallaIcon: {
    width: 80,
    height: 80,
    marginBottom: 8,
  },
  medallaNombre: {
    textAlign: "center",
    fontSize: 14,
    color: "#006D40",
    fontWeight: "600",
  },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    width: "80%",
    backgroundColor: "white",
    padding: 25,
    borderRadius: 15,
    alignItems: "center",
    position: "relative",
  },
  closeBtn: { position: "absolute", right: 10, top: 10 },
  modalIcon: { width: 100, height: 100, marginBottom: 15 },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#006D40" },
  modalDesc: {
    textAlign: "center",
    marginTop: 10,
    color: "#555",
    fontSize: 15,
  },
  modalReq: {
    marginTop: 10,
    color: "#333",
    fontSize: 14,
  },
  bloqueadaText: {
    marginTop: 15,
    color: "gray",
    fontStyle: "italic",
  },
});
