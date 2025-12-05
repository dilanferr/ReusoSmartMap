// /app/(tabs)/recicla.js
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { jwtDecode } from "jwt-decode";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { BACKEND_URL, HF_API_KEY, HF_MODEL } from "../../config";
import { useReuso } from "../../context/ReusoContext";

// =======================================================
// TRADUCCIONES IA
// =======================================================
const traducciones = {
  Laptop: "Computador portátil",
  Celular: "Teléfono móvil",
  Pila: "Batería portátil",
};

// =======================================================
// NORMALIZADOR IA → BD
// =======================================================
const normalizarDispositivo = (label) => {
  const t = label.toLowerCase();

  if (t.includes("laptop") || t.includes("notebook") || t.includes("computer"))
    return "Laptop";

  if (
    t.includes("phone") ||
    t.includes("cell") ||
    t.includes("smart") ||
    t.includes("iphone") ||
    t.includes("android")
  )
    return "Celular";

  if (t.includes("battery") || t.includes("power"))
    return "Pila";

  return "Dispositivo";
};

export default function Recicla() {
  const router = useRouter();
  const { carritoObjetos, vaciarCarrito, selectedPoint } = useReuso();

  const [permission, requestPermission] = useCameraPermissions();

  const [checkingLogin, setCheckingLogin] = useState(true);
  const [userInfo, setUserInfo] = useState(null);

  const [userLocation, setUserLocation] = useState(null);

  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [qrValidated, setQrValidated] = useState(false);
  const qrCameraRef = useRef(null);

  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [validationPhotos, setValidationPhotos] = useState([]);
  const photoCameraRef = useRef(null);

  const [validatingIA, setValidatingIA] = useState(false);
  const MAX_VALIDATION_PHOTOS = 3;

  // =======================================================
  // AUTO LOGIN
  // =======================================================
  useEffect(() => {
    const checkUser = async () => {
      const raw = await AsyncStorage.getItem("user");
      if (raw) {
        console.log("🟢 USER STORAGE CONTENT:", raw);
        setUserInfo(JSON.parse(raw));
      }
      setCheckingLogin(false);
    };
    checkUser();
  }, []);

  // =======================================================
  // Permisos y ubicación
  // =======================================================
  useEffect(() => {
    (async () => {
      if (!permission) await requestPermission();
      const g = await Location.requestForegroundPermissionsAsync();
      if (g.status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        setUserLocation(loc.coords);
      }
    })();
  }, []);

  if (checkingLogin) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00c982" />
      </View>
    );
  }

  if (!userInfo) {
    return (
      <LinearGradient colors={["#021510", "#04271f", "#06352a"]} style={{ flex: 1 }}>
        <View style={styles.center}>
          <Text style={styles.title}>Inicia sesión para reciclar</Text>
        </View>
      </LinearGradient>
    );
  }

  // =======================================================
  // QR
  // =======================================================
  const abrirQR = () => {
    if (!selectedPoint) return Alert.alert("Selecciona un punto primero");
    setQrValidated(false);
    setQrModalVisible(true);
  };

  const handleQRScanned = async ({ data }) => {
    try {
      let parsed = null;
      try {
        parsed = JSON.parse(data);
      } catch {
        Alert.alert("QR incorrecto", "El QR no contiene un JSON válido.");
        setQrModalVisible(false);
        return;
      }

      const { point_id, pointId, id, _id, token, qr_token } = parsed || {};
      const puntoId = point_id || pointId || id || _id;
      const tokenFinal = token || qr_token;

      if (!puntoId || !tokenFinal) {
        Alert.alert("QR incorrecto", "Faltan datos en el QR.");
        setQrModalVisible(false);
        return;
      }

      const res = await fetch(`${BACKEND_URL}/puntos/validar-qr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ point_id: puntoId, token: tokenFinal }),
      });

      const j = await res.json();
      if (!j.ok) {
        Alert.alert("QR incorrecto", j.message || "Token inválido.");
        setQrModalVisible(false);
        return;
      }

      setQrValidated(true);
      setQrModalVisible(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Error", "No se pudo validar el QR");
      setQrModalVisible(false);
    }
  };

  // =======================================================
  // Cámara validación IA
  // =======================================================
  const abrirCamaraValidacion = () => {
    if (!qrValidated) return Alert.alert("Primero valida el QR");
    setPhotoModalVisible(true);
  };

  const tomarFotoValidacion = async () => {
    if (validationPhotos.length >= MAX_VALIDATION_PHOTOS)
      return Alert.alert("Máximo 3 fotos");

    const photo = await photoCameraRef.current.takePictureAsync({
      base64: true,
      quality: 0.7,
    });

    setValidationPhotos((prev) => [...prev, photo]);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const borrarFotoValidacion = (i) => {
    setValidationPhotos((prev) => prev.filter((_, idx) => idx !== i));
  };

  // =======================================================
  // VALIDAR IA Y SUBIR
  // =======================================================
  const validarYSubirReciclaje = async () => {
    if (!qrValidated) return Alert.alert("Debes validar el QR primero.");
    if (validationPhotos.length < 3) return Alert.alert("Se requieren 3 fotos.");
    if (!carritoObjetos.length) return Alert.alert("Tu carrito está vacío.");

    setValidatingIA(true);

    try {
      /** ============================
       * OBTENER USER ID DESDE TOKEN
       * ============================ */
      const decoded = jwtDecode(userInfo.token);
      const realUserId = decoded.id; // <-- ESTE ES TU USER ID REAL

      const expectedLabel = normalizarDispositivo(carritoObjetos[0]);
      const results = [];

      console.log("========================================");
      console.log("📸 VALIDACIÓN IA — Analizando fotos...");
      console.log("Objeto esperado:", expectedLabel);
      console.log("========================================");

      /** ================
       * PROCESO IA
       * ================ */
      for (const p of validationPhotos) {
        console.log("🔍 FOTO ENVIADA A LA IA...");

        try {
          const respuesta = await fetch(
            `https://router.huggingface.co/hf-inference/models/${HF_MODEL}`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${HF_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                inputs: `data:image/jpeg;base64,${p.base64}`,
              }),
            }
          );

          const raw = await respuesta.text();

          if (raw.trim().startsWith("<")) {
            console.log("❌ HTML detectado, ignorando esta foto...");
            continue;
          }

          let data = null;
          try {
            data = JSON.parse(raw);
          } catch {
            console.log("❌ JSON inválido:", raw.slice(0, 150));
            continue;
          }

          if (Array.isArray(data)) {
            results.push(
              data.map((r) => ({
                label: normalizarDispositivo(r.label),
                score: r.score,
              }))
            );
          }
        } catch (err) {
          console.log("❌ Error IA:", err.message);
          continue;
        }
      }

      if (results.length === 0) {
        setValidatingIA(false);
        return Alert.alert("Error IA", "La IA no pudo procesar ninguna foto.");
      }

      const combined = {};
      results.flat().forEach((r) => {
        combined[r.label] = combined[r.label] || [];
        combined[r.label].push(r.score);
      });

      const avg = Object.entries(combined).map(([label, scores]) => ({
        label,
        avg: scores.reduce((a, b) => a + b, 0) / scores.length,
      }));

      const best = avg.sort((a, b) => b.avg - a.avg)[0];

      console.log("🏆 MEJOR DETECCIÓN IA:", best);
      console.log("Esperado:", expectedLabel);

      if (!best || best.avg < 0.12 || best.label !== expectedLabel) {
        setValidatingIA(false);
        return Alert.alert(
          "Validación fallida",
          `Esperado: ${expectedLabel}\nDetectado: ${best?.label}`
        );
      }

      console.log("✅ VALIDACIÓN IA EXITOSA");

      /** ====================
       * ENVÍO AL BACKEND
       * ==================== */
      const payload = {
        userId: realUserId,
        puntoId: selectedPoint._id,
        objetos: carritoObjetos,
        validadoQR: true,
        validadoIA: true,
        ubicacion_usuario: userLocation
          ? { lat: userLocation.latitude, lng: userLocation.longitude }
          : null,
      };

      console.log("📤 ENVIANDO RECICLAJE AL BACKEND:", payload);

      const resp = await fetch(`${BACKEND_URL}/reciclaje`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userInfo.token}`,
        },
        body: JSON.stringify(payload),
      });

      const text = await resp.text();
      console.log("RESP RAW TEXT:", text);

      let j = null;
      try {
        j = JSON.parse(text);
      } catch {
        throw new Error("El backend no devolvió JSON válido.");
      }

      if (!j.ok) {
        setValidatingIA(false);
        return Alert.alert("Error", j.msg || "No se pudo guardar el reciclaje.");
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("♻️ Reciclaje guardado correctamente.");

      vaciarCarrito();
      setValidationPhotos([]);
      setQrValidated(false);

      router.push("/(tabs)/escanear");

      qrCameraRef.current = null;
      photoCameraRef.current = null;

    } catch (err) {
      Alert.alert("Error IA", err.message);
    } finally {
      setValidatingIA(false);
    }
  };

  // =======================================================
  // UI
  // =======================================================
  return (
    <LinearGradient colors={["#021510", "#04271f", "#06352a"]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>

        <View style={styles.header}>
          <Text style={styles.title}>Reciclar y validar</Text>
          <Text style={styles.subtitle}>
            Escanea el QR, toma 3 fotos y la IA verificará el dispositivo.
          </Text>
        </View>

        <View style={styles.box}>
          <Text style={styles.boxTitle}>Carrito</Text>
          {carritoObjetos.length === 0 ? (
            <Text style={styles.textMuted}>No tienes objetos agregados.</Text>
          ) : (
            carritoObjetos.map((o, i) => (
              <Text key={i} style={styles.cartText}>
                • {traducciones[o] || o}
              </Text>
            ))
          )}
        </View>

        <View style={styles.box}>
          <Text style={styles.boxTitle}>Punto seleccionado</Text>
          {selectedPoint ? (
            <>
              <Text style={styles.pointText}>📍 {selectedPoint.direccion_completa}</Text>
              <Text style={styles.pointSub}>
                {selectedPoint.comuna_nombre} — {selectedPoint.region_nombre}
              </Text>
            </>
          ) : (
            <Text style={styles.textMuted}>Aún no seleccionas un punto.</Text>
          )}
        </View>

        <View style={styles.box}>
          <Text style={styles.boxTitle}>Paso 1 — Escanear QR</Text>

          <TouchableOpacity style={styles.primaryBtn} onPress={abrirQR}>
            <Ionicons name="qr-code" size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>
              {qrValidated ? "QR validado ✓" : "Escanear QR del punto"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.box}>
          <Text style={styles.boxTitle}>Paso 2 — Fotos</Text>

          <TouchableOpacity
            style={[styles.secondaryBtn, !qrValidated && { opacity: 0.3 }]}
            onPress={abrirCamaraValidacion}
            disabled={!qrValidated}
          >
            <Ionicons name="camera" size={18} color="#fff" />
            <Text style={styles.secondaryBtnText}>
              Tomar fotos ({validationPhotos.length}/3)
            </Text>
          </TouchableOpacity>

          {validationPhotos.length > 0 && (
            <ScrollView horizontal style={{ marginTop: 10 }}>
              {validationPhotos.map((p, i) => (
                <View key={i} style={styles.photoThumb}>
                  <Image source={{ uri: p.uri }} style={styles.photoImg} />
                  <TouchableOpacity
                    style={styles.photoDelete}
                    onPress={() => borrarFotoValidacion(i)}
                  >
                    <Ionicons name="close" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.box}>
          <Text style={styles.boxTitle}>Paso 3 — Validar y guardar</Text>

          <TouchableOpacity
            style={[
              styles.primaryBtn,
              (!qrValidated || validationPhotos.length < 3 || validatingIA) && {
                opacity: 0.5,
              },
            ]}
            disabled={!qrValidated || validationPhotos.length < 3 || validatingIA}
            onPress={validarYSubirReciclaje}
          >
            {validatingIA ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>
                  Validar con IA y guardar reciclaje
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* MODAL QR */}
      <Modal visible={qrModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBoxLarge, { height: "80%" }]}>
            <Text style={styles.modalTitle}>Escanear QR</Text>
            <Text style={styles.modalSubtitle}>Apunta al QR del contenedor.</Text>
            
            {qrModalVisible && (
              <CameraView
                ref={qrCameraRef}
                style={{ flex: 1 }}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                onBarcodeScanned={handleQRScanned}
              />
            )}
            

            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: "#ff5252" }]}
              onPress={() => {
                setQrModalVisible(false);
                setTimeout(() => (qrCameraRef.current = null), 200);
              }}
            >
              <Text style={styles.modalText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL FOTOS */}
      <Modal visible={photoModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBoxLarge, { height: "85%" }]}>
            <Text style={styles.modalTitle}>Fotos de validación</Text>

            <View style={styles.modalCameraBox}>
              {photoModalVisible && (
              <CameraView ref={photoCameraRef} style={{ flex: 1 }} facing="back" />
              )}
              <View style={styles.shutterWrapper}>
                <TouchableOpacity style={styles.shutterBtn} onPress={tomarFotoValidacion}>
                  <Ionicons name="camera" size={26} color="#021510" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: "#2a3b36" }]}
              onPress={() =>{
                setPhotoModalVisible(false);
                
                setTimeout(() => {
                  if (photoCameraRef.current) {
                    photoCameraRef.current = null;
                  }
                }, 300);
              }}
            >
              <Text style={styles.modalText}>Listo</Text>
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
  container: { padding: 16, paddingBottom: 40, gap: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: "rgba(0,30,20,0.9)",
    borderWidth: 1,
    borderColor: "rgba(0,245,160,0.25)",
  },
  title: { color: "#fff", fontSize: 20, fontWeight: "700" },
  subtitle: { color: "#b8e8d7", fontSize: 13, marginTop: 4 },

  box: {
    backgroundColor: "rgba(0,30,20,0.9)",
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(0,245,160,0.2)",
  },

  boxTitle: { color: "#c7ffe0", fontSize: 15, fontWeight: "600", marginBottom: 6 },
  textMuted: { color: "#a5c7ba", fontSize: 12 },

  cartText: { color: "#fff", fontSize: 13, marginVertical: 2 },

  pointText: { color: "#fff", fontSize: 13 },
  pointSub: { color: "#b7e1cf", fontSize: 12 },

  primaryBtn: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#00c982",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#064a37",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,245,160,0.3)",
    marginTop: 10,
  },
  secondaryBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },

  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: "hidden",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(0,245,160,0.3)",
  },
  photoImg: { width: "100%", height: "100%" },
  photoDelete: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 999,
    padding: 3,
  },

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
    borderColor: "rgba(0,245,160,0.25)",
  },
  modalTitle: { color: "#f8fffd", fontSize: 16, fontWeight: "700" },
  modalSubtitle: { color: "#c0e5d4", fontSize: 12, marginTop: 4 },

  modalCameraBox: {
    flex: 1,
    marginTop: 12,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#000",
  },

  modalBtn: {
    marginTop: 12,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalText: { color: "#fff", fontWeight: "700" },

  shutterWrapper: {
    position: "absolute",
    bottom: 20,
    width: "100%",
    alignItems: "center",
  },
  shutterBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#e6fff4",
    alignItems: "center",
    justifyContent: "center",
  },
});
