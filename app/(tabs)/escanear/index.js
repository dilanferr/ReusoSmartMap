// /app/(tabs)/escanear/index.js
import { useFocusEffect } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useRouter } from "expo-router";

import { BACKEND_URL, HF_API_KEY, HF_MODEL } from "../../../config";
import { useReuso } from "../../../context/ReusoContext";


// =======================================================
// TRADUCCIONES
// =======================================================
const traducciones = {
  Laptop: "Laptop",
  Celular: "Teléfono móvil",
  Pila: "Batería portátil",
  Monitor: "Monitor",
  Tablet: "Tablet",
  TV: "Televisor",
  Dispositivo: "Dispositivo",
};

// =======================================================
// NORMALIZACIÓN IA → BD
// =======================================================
const normalizarDispositivo = (label) => {
  const t = label.toLowerCase();

  if (t.includes("monitor") || t.includes("tv") || t.includes("screen")) return "Monitor";
  if (t.includes("tablet") || t.includes("ipad")) return "Tablet";
  if (
    t.includes("laptop") ||
    t.includes("notebook") ||
    t.includes("macbook") ||
    t.includes("computer")
  )
    return "Laptop";
  if (t.includes("phone") || t.includes("smart") || t.includes("iphone")) return "Celular";
  if (t.includes("battery") || t.includes("powerbank")) return "Pila";

  return "Dispositivo";
};

// =======================================================
// DISTANCIA
// =======================================================
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// =======================================================
// COMPONENTE PRINCIPAL
// =======================================================
export default function Escanear() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  const {
    carritoObjetos,
    agregarObjeto,
    eliminarObjeto,
    selectedPoint,
    seleccionarPunto,
    setUbicacionUsuario,
    step,
    setStep,
    canReciclar,
  } = useReuso();

  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingRec, setLoadingRec] = useState(false);
  const [recomendados, setRecomendados] = useState([]);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const MAX_PHOTOS = 3;

  // =======================================================
  // 🔥 FIX: DETECTAR SI ESTA PANTALLA ESTÁ ENFOCADA
  // =======================================================
  const [screenFocused, setScreenFocused] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      setScreenFocused(true);
      return () => {
        setScreenFocused(false);
      };
    }, [])
  );

  // =======================================================
  // PERMISOS
  // =======================================================
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
  // FOTO
  // =======================================================
  const takePhoto = async () => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert("Máximo 3 fotos");
      return;
    }

    setLoading(true);

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.7,
      });

      setPhotos((prev) => [...prev, photo]);
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  // =======================================================
  // IA
  // =======================================================
  const analyzeAll = async () => {
    if (photos.length === 0) {
      Alert.alert("Sin fotos", "Toma al menos una foto.");
      return;
    }

    setLoading(true);

    try {
      const results = [];

      for (const p of photos) {
        const res = await fetch(
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

        const data = await res.json();

        if (Array.isArray(data)) {
          results.push(
            data.map((r) => ({
              label: normalizarDispositivo(r.label),
              score: r.score,
            }))
          );
        }
      }

      const combined = {};

      results.flat().forEach((r) => {
        if (!combined[r.label]) combined[r.label] = [];
        combined[r.label].push(r.score);
      });

      const avg = Object.entries(combined).map(([label, scores]) => ({
        label,
        avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      }));

      const best = avg.sort((a, b) => b.avgScore - a.avgScore)[0];

      agregarObjeto(best.label);
      setPhotos([]);
      setStep("scan");

      Alert.alert(
        "Agregado",
        `${traducciones[best.label] || best.label} agregado al carrito.`
      );
    } catch (err) {
      Alert.alert("Error IA", err.message);
    } finally {
      setLoading(false);
    }
  };

  // =======================================================
  // RECOMENDADOS
  // =======================================================
  const buscarRecomendados = async () => {
    if (!carritoObjetos.length) {
      Alert.alert("Carrito vacío", "Escanea un dispositivo.");
      return;
    }

    setLoadingRec(true);

    try {
      const loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;

      setUbicacionUsuario({ lat: latitude, lng: longitude });

      const lista = await fetch(`${BACKEND_URL}/puntos`).then((r) => r.json());

      const total = carritoObjetos.length;

      const recomendaciones = lista
        .map((p) => {
          const aceptados = carritoObjetos.filter((obj) =>
            (p.materiales_aceptados || []).includes(obj)
          );

          const score = aceptados.length / total;
          const dist = getDistanceKm(
            latitude,
            longitude,
            Number(p.latitud),
            Number(p.longitud)
          );

          return { ...p, aceptados, score, dist };
        })
        .filter((p) => p.score > 0)
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return a.dist - b.dist;
        });

      setRecomendados(recomendaciones);
      setStep("puntos");
    } catch (err) {
      Alert.alert("Error puntos", err.message);
    } finally {
      setLoadingRec(false);
    }
  };

  // =======================================================
  // SELECCIONAR PUNTO
  // =======================================================
  const selectPoint = (p) => {
    seleccionarPunto(p);
    setStep("verMapa");
  };

  // =======================================================
  // IR AL MAPA
  // =======================================================
  const irAlMapa = () => {
    router.push({
      pathname: "/(tabs)/",
      params: {
        goto: "1",
        point: JSON.stringify(selectedPoint),
      },
    });
  };

  // =======================================================
  // UI
  // =======================================================
  if (!permission?.granted) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#fff" }}>Debe activar la cámara</Text>
        <TouchableOpacity onPress={requestPermission}>
          <Text style={{ color: "cyan" }}>Dar permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <LinearGradient colors={["#021510", "#04271f", "#06352a"]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <Text style={styles.title}>Escanear dispositivo</Text>
          <Text style={styles.subtitle}>Máximo 3 fotos.</Text>
        </Animated.View>

        {/* 🔥 FIX: SOLO RENDERIZA CÁMARA SI LA PANTALLA ESTÁ ACTIVA */}
        <View style={styles.cameraWrapper}>
          {screenFocused ? (
            <CameraView ref={cameraRef} style={styles.camera} facing="back" />
          ) : (
            <View style={[styles.camera, { backgroundColor: "#000" }]} />
          )}
        </View>

        <TouchableOpacity style={styles.captureBtn} onPress={takePhoto}>
          <Ionicons name="camera" size={20} color="#fff" />
          <Text style={styles.captureText}>Tomar foto ({photos.length}/3)</Text>
        </TouchableOpacity>

        {photos.length > 0 && (
          <TouchableOpacity style={styles.analyzeBtn} onPress={analyzeAll}>
            <Ionicons name="sparkles" size={20} color="#fff" />
            <Text style={styles.analyzeText}>Analizar con IA</Text>
          </TouchableOpacity>
        )}

        <View style={styles.resultBox}>
          <Text style={styles.resultHeader}>
            Carrito ({carritoObjetos.length})
          </Text>

          {carritoObjetos.map((obj, i) => (
            <View key={i} style={styles.cartItem}>
              <Text style={styles.cartText}>• {traducciones[obj] || obj}</Text>
              <TouchableOpacity onPress={() => eliminarObjeto(i)}>
                <Ionicons name="trash" size={20} color="#ff4444" />
              </TouchableOpacity>
            </View>
          ))}

          {carritoObjetos.length > 0 && (
            <TouchableOpacity style={styles.analyzeBtn} onPress={buscarRecomendados}>
              <Ionicons name="location" size={20} color="#fff" />
              <Text style={styles.analyzeText}>Buscar punto recomendado</Text>
            </TouchableOpacity>
          )}
        </View>

        {step === "puntos" && (
          <View style={styles.resultBox}>
            <Text style={styles.resultHeader}>Puntos recomendados</Text>

            {loadingRec && <ActivityIndicator color="white" />}

            {!loadingRec &&
              recomendados.map((p, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => selectPoint(p)}
                  style={styles.card}
                >
                  <Text style={styles.cardTitle}>{p.nombre_punto}</Text>
                  <Text style={styles.cardDir}>{p.direccion_completa}</Text>
                  <Text style={styles.cardInfo}>
                    📏 {p.dist.toFixed(2)} km — ♻️ {Math.round(p.score * 100)}%
                  </Text>
                  <Text style={styles.cardMaterials}>
                    Acepta: {p.aceptados.join(", ")}
                  </Text>
                </TouchableOpacity>
              ))}
          </View>
        )}

        {step === "verMapa" && selectedPoint && (
          <View style={styles.resultBox}>
            <Text style={styles.resultHeader}>Punto seleccionado</Text>
            <Text style={styles.cartText}>
              📍 {selectedPoint.direccion_completa}
            </Text>

            <TouchableOpacity style={styles.analyzeBtn} onPress={irAlMapa}>
              <Ionicons name="map" size={20} color="#fff" />
              <Text style={styles.analyzeText}>Ver punto en el mapa</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ✔ NUEVO — IR A RECICLAR */}
        {canReciclar() && (
          <TouchableOpacity
            style={[styles.analyzeBtn, { backgroundColor: "#00c982", marginTop: 10 }]}
            onPress={() => {
              router.push("/(tabs)/recicla");
              Haptics.selectionAsync();
            }}
          >
            <Ionicons name="recycle" size={20} color="#fff" />
            <Text style={styles.analyzeText}>Ir a reciclar ahora</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

// =======================================================
// ESTILOS
// =======================================================
const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  title: { color: "#fff", fontSize: 22, fontWeight: "700" },
  subtitle: { color: "#b8e8d7", fontSize: 13 },

  cameraWrapper: { marginTop: 10, alignItems: "center" },
  camera: { width: 320, height: 380, borderRadius: 20, overflow: "hidden" },

  captureBtn: {
    backgroundColor: "#00c982",
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  captureText: { color: "#fff", fontWeight: "700" },

  analyzeBtn: {
    marginTop: 6,
    backgroundColor: "#064a37",
    padding: 12,
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  analyzeText: { color: "#fff", fontWeight: "700" },

  resultBox: {
    backgroundColor: "rgba(0,30,20,0.8)",
    padding: 16,
    borderRadius: 18,
    marginTop: 15,
  },
  resultHeader: { color: "#00f5a0", fontSize: 16, marginBottom: 8 },

  cartItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  cartText: { color: "#fff" },

  card: {
    backgroundColor: "rgba(0,0,0,0.25)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  cardTitle: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  cardDir: { color: "#ddd", fontSize: 13 },
  cardInfo: { color: "#00f5a0", marginTop: 4 },
  cardMaterials: { color: "#bbb", fontSize: 12 },
});
