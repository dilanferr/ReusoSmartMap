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


import { BACKEND_URL, HF_API_KEY, HF_MODEL } from "../../config";


console.log(HF_API_KEY);
console.log(BACKEND_URL);


// =======================================================
// 🧠 NORMALIZADOR UNIVERSAL IA → CATEGORÍAS BD
// (CLAVES QUE MATCHEAN CON materiales_aceptados EN LA BD)
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
    return "Laptop";
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
    return "Celular";
  }

  // POWER BANK / PILA PORTÁTIL
  if (
    texto.includes("power") ||
    texto.includes("bank") ||
    texto.includes("battery")
  ) {
    return "Pila";
  }

  return texto;
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
  // Tomar foto
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
  // Analizar TODAS las fotos y generar 1 resultado final
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

      const displayName = traducciones[best.label] || best.label;

      setFinalResult({
        label: best.label,
        display: displayName,
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
  // Buscar punto más cercano QUE ACEPTE ese material
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
      const compatibles = puntosResp.filter((p) =>
        (p.materiales_aceptados || []).includes(tipo)
      );

      if (compatibles.length === 0) {
        const displayName = traducciones[tipo] || tipo;
        Alert.alert(
          "Sin puntos compatibles",
          `No se encontraron puntos que acepten "${displayName}".`
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
      const displayName = traducciones[tipo] || tipo;

      Alert.alert(
        "♻️ Confirmación de punto",
        `Material detectado: ${displayName}\n\n¿Estás en este punto?\n\n📍 ${nearest.direccion_completa}\n🏙️ ${nearest.comuna_nombre}\n🌎 ${nearest.region_nombre}\n📏 ${distKm} km`,
        [
          {
            text: "No, elegir otro",
            onPress: () => {
              setPendingRecord({ tipo, confidence, loc });
              setSelectVisible(true);
            },
          },
          {
            text: "Sí, confirmar",
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
  // Registrar reciclaje
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
  // Eliminar foto
  // =======================================================
  const deletePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setFinalResult(null);
  };

  // =======================================================
  // Filtrar puntos manualmente
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
  // UI PERMISOS
  // =======================================================
  if (!permission?.granted) {
    return (
      <LinearGradient colors={["#021510", "#04271f", "#06352a"]} style={{ flex: 1 }}>
        <View style={styles.center}>
          <View style={styles.permCard}>
            <Ionicons name="camera" size={40} color="#00f5a0" />
            <Text style={styles.permTitle}>Permiso de cámara</Text>
            <Text style={styles.permText}>
              Para escanear tus dispositivos y ayudarte a reciclar mejor,
              necesitamos acceso a la cámara.
            </Text>
            <TouchableOpacity onPress={requestPermission} style={styles.button}>
              <Text style={styles.buttonText}>Conceder permiso</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    );
  }

  // =======================================================
  // UI PRINCIPAL
  // =======================================================
  return (
    <LinearGradient colors={["#021510", "#04271f", "#06352a"]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* HEADER */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Escanear dispositivo</Text>
              <Text style={styles.subtitle}>
                Usa la cámara para identificar qué estás reciclando y te mostramos
                el punto más cercano que lo acepta.
              </Text>
            </View>
            <View style={styles.headerIconWrap}>
              <Ionicons name="scan" size={26} color="#00f5a0" />
            </View>
          </View>

          <View style={styles.chipsRow}>
            <View style={styles.chip}>
              <Ionicons name="camera-outline" size={14} color="#c7ffe0" />
              <Text style={styles.chipText}>Hasta 3 fotos</Text>
            </View>
            <View style={styles.chip}>
              <Ionicons name="sparkles-outline" size={14} color="#c7ffe0" />
              <Text style={styles.chipText}>IA de reconocimiento</Text>
            </View>
            <View style={styles.chip}>
              <Ionicons name="location-outline" size={14} color="#c7ffe0" />
              <Text style={styles.chipText}>Punto más cercano</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Cámara */}
          <View style={styles.cameraWrapper}>
            <View style={styles.cameraShadow}>
              <CameraView ref={cameraRef} style={styles.camera} facing="back" />
              <View style={styles.overlay}>
                <View style={styles.frame} />
                <Text style={styles.guide}>Enfoca el dispositivo dentro del marco</Text>
              </View>
            </View>

            <Text style={styles.tipText}>
              Consejo: intenta que el dispositivo ocupe la mayor parte del cuadro y
              evita fondos muy cargados.
            </Text>
          </View>

          {/* Botón tomar foto */}
          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={[
                styles.captureButton,
                loading && { backgroundColor: "rgba(0, 201, 130, 0.4)" },
              ]}
              onPress={takePhoto}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <View style={styles.captureInnerCircle}>
                    <Ionicons name="camera" size={22} color="#021510" />
                  </View>
                  <View>
                    <Text style={styles.captureText}>Capturar foto</Text>
                    <Text style={styles.captureSubText}>
                      {photos.length}/{MAX_PHOTOS} usadas
                    </Text>
                  </View>
                </>
              )}
            </TouchableOpacity>

            {photos.length > 0 && !loading && (
              <TouchableOpacity style={styles.analyzeBtn} onPress={analyzeAll}>
                <Ionicons name="sparkles" size={20} color="#fff" />
                <Text style={styles.analyzeText}>Analizar con IA</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Vista previa fotos */}
          {photos.length > 0 && (
            <View style={styles.previewSection}>
              <Text style={styles.sectionTitle}>Fotos capturadas</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 4 }}
              >
                {photos.map((p, i) => (
                  <View key={i} style={styles.card}>
                    <Image source={{ uri: p.uri }} style={styles.preview} />
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deletePhoto(i)}
                    >
                      <Ionicons name="trash" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Resultado final */}
          {finalResult && (
            <View style={styles.resultBox}>
              <View style={styles.resultHeader}>
                <Ionicons name="checkmark-circle" size={22} color="#00f5a0" />
                <Text style={styles.resultTitle}>Resultado de la IA</Text>
              </View>

              <View style={styles.resultContent}>
                <Text style={styles.resultLabel}>{finalResult.display}</Text>
                <Text style={styles.resultScore}>
                  Confianza: {finalResult.score}%
                </Text>
              </View>

              <Text style={styles.resultHint}>
                Ahora buscamos un punto de reciclaje cercano que acepte este tipo de
                dispositivo.
              </Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Modal seleccionar punto manual */}
      <Modal visible={selectVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBoxLarge}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>Selecciona tu punto</Text>
                <Text style={styles.modalSubtitle}>
                  Elige manualmente el punto donde estás reciclando.
                </Text>
              </View>
              <View style={styles.modalIconWrap}>
                <Ionicons name="location-outline" size={22} color="#00f5a0" />
              </View>
            </View>

            <TextInput
              placeholder="Buscar por comuna o dirección..."
              placeholderTextColor="#9fb3aa"
              style={styles.input}
              value={search}
              onChangeText={setSearch}
            />

            <FlatList
              data={filteredPoints}
              keyExtractor={(item, idx) => idx.toString()}
              style={{ maxHeight: 260 }}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  No se encontraron puntos con ese filtro.
                </Text>
              }
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
// ESTILOS
// =======================================================

const styles = StyleSheet.create({
  container: {
    alignItems: "stretch",
    paddingBottom: 40,
    paddingTop: 12,
    paddingHorizontal: 16,
    gap: 18,
  },

  // HEADER
  header: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: "rgba(0, 245, 160, 0.22)",
    backgroundColor: "rgba(1, 20, 15, 0.88)",
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 50,
    backgroundColor: "rgba(0, 245, 160, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(0, 245, 160, 0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#f8fffd",
    fontSize: 19,
    fontWeight: "700",
  },
  subtitle: {
    color: "#ccefe2",
    fontSize: 13,
    marginTop: 4,
    opacity: 0.9,
  },
  chipsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 6,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(3, 55, 43, 0.85)",
    borderColor: "rgba(0, 245, 160, 0.28)",
    borderWidth: 0.6,
  },
  chipText: {
    color: "#d2ffef",
    fontSize: 10.5,
    letterSpacing: 0.2,
  },

  // CÁMARA
  cameraWrapper: {
    marginTop: 4,
    alignItems: "center",
  },
  cameraShadow: {
    borderRadius: 28,
    padding: 3,
    backgroundColor: "rgba(0, 245, 160, 0.20)",
  },
  camera: {
    width: 320,
    height: 380,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  overlay: {
    position: "absolute",
    inset: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  frame: {
    width: 235,
    height: 235,
    borderWidth: 2,
    borderColor: "#00f5a0",
    borderRadius: 26,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  guide: {
    position: "absolute",
    bottom: 32,
    color: "#e6fff4",
    fontWeight: "600",
    fontSize: 14,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    letterSpacing: 0.3,
  },
  tipText: {
    marginTop: 10,
    color: "#b8e8d7",
    fontSize: 12,
    textAlign: "center",
  },

  // BOTONES PRINCIPALES
  buttonsRow: {
    marginTop: 16,
    flexDirection: "column",
    gap: 12,
    alignItems: "center",
  },
  captureButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00c982",
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 999,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 4 },
  },
  captureInnerCircle: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: "#e6fff4",
    alignItems: "center",
    justifyContent: "center",
  },
  captureText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14.5,
    letterSpacing: 0.3,
  },
  captureSubText: {
    color: "#f0fff9",
    fontSize: 11.5,
    opacity: 0.8,
  },
  analyzeBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#064a37",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 999,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 245, 160, 0.4)",
  },
  analyzeText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
    letterSpacing: 0.3,
  },

  // PREVIEW FOTOS
  previewSection: {
    marginTop: 18,
    gap: 8,
  },
  sectionTitle: {
    color: "#e6fff4",
    fontSize: 15,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "rgba(3, 37, 30, 0.95)",
    borderRadius: 16,
    padding: 6,
    marginRight: 10,
    width: 175,
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 4 },
  },
  preview: {
    width: "100%",
    height: 150,
    borderRadius: 12,
  },
  deleteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.55)",
    padding: 5,
    borderRadius: 999,
  },

  // RESULTADO
  resultBox: {
    marginTop: 20,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "rgba(3, 40, 30, 0.98)",
    borderWidth: 1,
    borderColor: "rgba(0, 245, 160, 0.28)",
    gap: 12,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  resultTitle: {
    color: "#c7ffe0",
    fontSize: 15,
    fontWeight: "600",
  },
  resultContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  resultLabel: {
    color: "#00f5a0",
    fontSize: 19,
    fontWeight: "700",
  },
  resultScore: {
    color: "#e6fff4",
    fontSize: 13,
  },
  resultHint: {
    color: "#b8e8d4",
    fontSize: 12,
    marginTop: 4,
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  modalBoxLarge: {
    backgroundColor: "#041d17",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(0, 245, 160, 0.25)",
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalTitle: {
    color: "#f8fffd",
    fontSize: 16,
    fontWeight: "700",
  },
  modalSubtitle: {
    color: "#c0e5d4",
    fontSize: 12,
    marginTop: 2,
  },
  input: {
    backgroundColor: "#0a2a22",
    color: "#e6fff4",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(150,210,190,0.6)",
    fontSize: 13,
  },
  pointItem: {
    backgroundColor: "rgba(7,44,34,0.95)",
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "rgba(0,245,160,0.22)",
  },
  pointText: {
    color: "#f8fffd",
    fontSize: 13,
  },
  pointSub: {
    color: "#b7e1cf",
    fontSize: 11,
    marginTop: 3,
  },
  modalBtn: {
    marginTop: 12,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalText: {
    color: "#fff",
    fontWeight: "700",
  },
  emptyText: {
    color: "#a5c7ba",
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
  },
});
