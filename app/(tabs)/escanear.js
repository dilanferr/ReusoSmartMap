import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";


const HF_API_KEY = "xxxxxxxxxxxxxxxxxxxxxxxxxxx";

const HF_MODEL = "apple/mobilevit-small";
const BACKEND_URL = "http://192.168.1.7:5000/api";

// =======================================================
// 🧠 NORMALIZADOR UNIVERSAL IA → CATEGORÍAS BD
// =======================================================
const normalizarDispositivo = (label) => {
  const texto = label.toLowerCase();

  // LAPTOPS
  if (
    texto.includes("laptop") ||
    texto.includes("notebook") ||
    texto.includes("portable") ||
    texto.includes("macbook") ||
    texto.includes("computer")
  ) {
    return "laptop";
  }

  // CELULARES
  if (
    texto.includes("phone") ||
    texto.includes("cell") ||
    texto.includes("smart") ||
    texto.includes("iphone") ||
    texto.includes("android") ||
    texto.includes("mobile") ||
    texto.includes("ipod") 
  ) {
    return "phone";
  }

  // POWER BANK
  if (
    texto.includes("power") ||
    texto.includes("bank") ||
    texto.includes("battery")
  ) {
    return "power_bank";
  }

  return texto;
};

// =======================================================
// 🔍 Traducción para mostrar al usuario (sin impactar BD)
// =======================================================
const traducciones = {
  phone: "Teléfono celular",
  laptop: "Computador portátil",
  power_bank: "Batería portátil",
};

// =======================================================
// 📏 Distancia en km
// =======================================================
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export default function EscanearScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [finalResult, setFinalResult] = useState(null);

  const [selectVisible, setSelectVisible] = useState(false);
  const [pendingRecord, setPendingRecord] = useState(null);

  const [puntos, setPuntos] = useState([]);
  const [search, setSearch] = useState("");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const MAX_PHOTOS = 3;

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // =======================================================
  // 📸 Tomar foto
  // =======================================================
  const takePhoto = async () => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert("Límite alcanzado", "Solo puedes tomar 3 fotos.");
      return;
    }

    if (!cameraRef.current) return;

    setLoading(true);

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.7,
      });

      setPhotos((prev) => [...prev, { uri: photo.uri, base64: photo.base64 }]);
    } catch (err) {
      Alert.alert("Error al tomar foto", err.message);
    } finally {
      setLoading(false);
    }
  };

  // =======================================================
  // 🔍 Analizar TODAS las fotos y generar 1 resultado final
  // =======================================================
  const analyzeAll = async () => {
    if (photos.length === 0) {
      Alert.alert("Sin fotos", "Toma al menos una foto.");
      return;
    }

    setLoading(true);
    setFinalResult(null);

    try {
      const results = [];

      // Enviar cada foto a la IA
      for (const photo of photos) {
        const res = await fetch(
          `https://router.huggingface.co/hf-inference/models/${HF_MODEL}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${HF_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              inputs: `data:image/jpeg;base64,${photo.base64}`,
            }),
          }
        );

        const data = await res.json();
        if (Array.isArray(data)) {
          const normalized = data.map((p) => ({
            label: normalizarDispositivo(p.label),
            score: p.score,
          }));
          results.push(normalized);
        }
      }

      // Unir todos los resultados y promediarlos
      const combined = {};
      results.flat().forEach((r) => {
        if (!combined[r.label]) combined[r.label] = [];
        combined[r.label].push(r.score);
      });

      const avgScores = Object.entries(combined).map(([label, scores]) => ({
        label,
        avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      }));

      const best = avgScores.sort((a, b) => b.avgScore - a.avgScore)[0];

      if (!best) throw new Error("No se obtuvo un resultado claro.");

      const traducido = traducciones[best.label] || best.label;

      setFinalResult({
        label: best.label,
        display: traducido,
        score: (best.avgScore * 100).toFixed(1),
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      await confirmNearestPoint(best.label, best.avgScore);
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  // =======================================================
  // 🌍 Buscar punto más cercano QUE ACEPTE ese material
  // =======================================================
  const confirmNearestPoint = async (tipo, confidence) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted")
        throw new Error("Permiso de ubicación denegado.");

      const loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;

      const puntosResp = await fetch(`${BACKEND_URL}/puntos`).then((r) =>
        r.json()
      );

      setPuntos(puntosResp);

      // FILTRO: solo puntos que aceptan ese material
      const compatibles = puntosResp.filter(
        (p) => p.materiales_aceptados?.includes(tipo)
      );

      if (compatibles.length === 0) {
        Alert.alert(
          "Sin puntos compatibles",
          `No se encontraron puntos que acepten "${tipo}".`
        );
        return;
      }

      // Seleccionar el más cercano
      let nearest = null;
      let minDist = Infinity;

      compatibles.forEach((p) => {
        const dist = getDistance(latitude, longitude, p.latitud, p.longitud);
        if (dist < minDist) {
          minDist = dist;
          nearest = p;
        }
      });

      const distKm = minDist.toFixed(2);

      Alert.alert(
        "♻️ Confirmación",
        `¿Estás en este punto?\n\n📍 ${nearest.direccion_completa}\n🏙️ ${nearest.comuna_nombre}\n🌎 ${nearest.region_nombre}\n📏 ${distKm} km`,
        [
          {
            text: "No",
            onPress: () => {
              setPendingRecord({ tipo, confidence, loc });
              setSelectVisible(true);
            },
          },
          {
            text: "Sí",
            onPress: () =>
              registerRecycling(tipo, confidence, loc, nearest.direccion_completa),
          },
        ]
      );
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  // =======================================================
  // ♻️ Registrar reciclaje
  // =======================================================
  const registerRecycling = async (tipo, confidence, loc, direccion) => {
    try {
      const record = {
        userId: "demo_user",
        deviceName: tipo,
        confidence: (confidence * 100).toFixed(1),
        location: {
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
        },
        direccion_reciclaje: direccion,
        timestamp: new Date().toISOString(),
      };

      const res = await fetch(`${BACKEND_URL}/reciclaje`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
      });

      if (!res.ok) throw new Error("Error al registrar.");

      Alert.alert("✔️ Registrado", "El reciclaje fue guardado correctamente.");
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  // =======================================================
  // 🗑️ Eliminar foto
  // =======================================================
  const deletePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setFinalResult(null);
  };

  // =======================================================
  // 🔎 Filtrar puntos manualmente
  // =======================================================
  const filteredPoints = puntos.filter(
    (p) =>
      p.comuna_nombre?.toLowerCase().includes(search.toLowerCase()) ||
      p.direccion_completa?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectPoint = (p) => {
    registerRecycling(
      pendingRecord.tipo,
      pendingRecord.confidence,
      pendingRecord.loc,
      p.direccion_completa
    );
    setSelectVisible(false);
  };

  // =======================================================
  // UI
  // =======================================================
  if (!permission?.granted) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#fff", marginBottom: 10 }}>
          Se necesita permiso de cámara
        </Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>Dar permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <LinearGradient colors={["#05291f", "#094b39", "#0a5743"]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Cámara */}
          <View style={styles.cameraContainer}>
            <CameraView ref={cameraRef} style={styles.camera} facing="back" />
            <View style={styles.overlay}>
              <View style={styles.frame} />
              <Text style={styles.guide}>📷 Toma hasta 3 fotos</Text>
            </View>
          </View>

          {/* Botón tomar foto */}
          <TouchableOpacity
            style={[styles.captureButton, loading && { backgroundColor: "#007b5f" }]}
            onPress={takePhoto}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="camera" size={20} color="#fff" />
                <Text style={styles.captureText}>
                  Tomar Foto ({photos.length}/3)
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Vista previa fotos */}
          {photos.map((p, i) => (
            <View key={i} style={styles.card}>
              <Image source={{ uri: p.uri }} style={styles.preview} />
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deletePhoto(i)}
              >
                <Ionicons name="trash" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}

          {/* Analizar todas */}
          {photos.length > 0 && !loading && (
            <TouchableOpacity style={styles.analyzeBtn} onPress={analyzeAll}>
              <Ionicons name="sparkles" size={20} color="#fff" />
              <Text style={styles.analyzeText}>Analizar todas</Text>
            </TouchableOpacity>
          )}

          {/* Resultado final */}
          {finalResult && (
            <View style={styles.resultBox}>
              <Text style={styles.resultTitle}>Resultado final:</Text>
              <Text style={styles.resultLabel}>
                {finalResult.display} ({finalResult.score}%)
              </Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Modal seleccionar punto manual */}
      <Modal visible={selectVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBoxLarge}>
            <Text style={styles.modalTitle}>Selecciona tu punto</Text>

            <TextInput
              placeholder="Buscar por comuna o dirección..."
              placeholderTextColor="#ccc"
              style={styles.input}
              value={search}
              onChangeText={setSearch}
            />

            <FlatList
              data={filteredPoints}
              keyExtractor={(item, idx) => idx.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pointItem}
                  onPress={() => handleSelectPoint(item)}
                >
                  <Text style={styles.pointText}>📍 {item.direccion_completa}</Text>
                  <Text style={styles.pointSub}>
                    {item.comuna_nombre} — {item.region_nombre}
                  </Text>
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: "#ff5252" }]}
              onPress={() => setSelectVisible(false)}
            >
              <Text style={styles.modalText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

// =======================================================
// 🎨 ESTILOS
// =======================================================
const styles = StyleSheet.create({
  container: { alignItems: "center", paddingBottom: 80 },
  cameraContainer: { position: "relative", marginTop: 15 },
  camera: { width: 320, height: 380, borderRadius: 20, overflow: "hidden" },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  frame: {
    width: 240,
    height: 240,
    borderWidth: 3,
    borderColor: "#00ffb2",
    borderRadius: 25,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  guide: {
    position: "absolute",
    bottom: 40,
    color: "#e6fff4",
    fontWeight: "bold",
    fontSize: 16,
    backgroundColor: "rgba(0,0,0,0.3)",
    padding: 8,
    borderRadius: 10,
  },
  captureButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00c982",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    marginVertical: 15,
    gap: 8,
  },
  captureText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  card: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: 8,
    marginVertical: 8,
    width: 280,
    alignItems: "center",
  },
  preview: { width: 260, height: 260, borderRadius: 10 },
  deleteButton: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 5,
    borderRadius: 6,
  },
  analyzeBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007b5f",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    marginTop: 10,
    gap: 8,
  },
  analyzeText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  resultBox: {
    backgroundColor: "rgba(0,255,162,0.12)",
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    alignItems: "center",
  },
  resultTitle: { color: "#c7ffe0", fontSize: 15 },
  resultLabel: {
    color: "#00ffb2",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 5,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBoxLarge: {
    backgroundColor: "#0d3a2e",
    width: "90%",
    maxHeight: "80%",
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: { color: "#fff", fontSize: 17, marginBottom: 10, textAlign: "center" },
  input: {
    backgroundColor: "#fff",
    color: "#000",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 15,
  },
  pointItem: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  pointText: { color: "#fff", fontSize: 14 },
  pointSub: { color: "#aaffd8", fontSize: 12 },
  modalBtn: { alignItems: "center", paddingVertical: 10, borderRadius: 8 },
  modalText: { color: "#fff", fontWeight: "bold" },
});
