import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import ClusteredMapView from "react-native-map-clustering";
import { Marker, PROVIDER_GOOGLE } from "react-native-maps";

import FilterSheet from "../../components/FilterSheet";
import { BACKEND_URL } from "../../config";
console.log(BACKEND_URL);

export default function HomeScreen() {
  const [location, setLocation] = useState(null);
  const [puntos, setPuntos] = useState([]);
  const [todosPuntos, setTodosPuntos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterVisible, setFilterVisible] = useState(false);

  // filtros dinámicos
  const [regiones, setRegiones] = useState([]);
  const [comunas, setComunas] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [materiales, setMateriales] = useState([]);

  const mapRef = useRef(null);
  const API_URL = `${BACKEND_URL}/puntos`;


  // ================
  // 📍 UBICACIÓN EN TIEMPO REAL
  // ================
  useEffect(() => {
    let subscription;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permiso de ubicación denegado");
          return;
        }

        // 👇 ubicación en tiempo real
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 1000,
            distanceInterval: 2,
          },
          (loc) => {
            setLocation(loc.coords);
          }
        );

        // obtener puntos del backend
        const response = await fetch(API_URL);
        const data = await response.json();

        setTodosPuntos(data);
        setPuntos(data);

        // filtros únicos
        setRegiones([...new Set(data.map((p) => p.region_nombre))]);
        setComunas([...new Set(data.map((p) => p.comuna_nombre))]);
        setTipos([...new Set(data.map((p) => p.tipo_punto))]);

        // materiales normalizados
        const mats = data.flatMap((p) =>
          Array.isArray(p.materiales_aceptados)
            ? p.materiales_aceptados.map((m) => m.toLowerCase())
            : []
        );

        setMateriales([...new Set(mats)]);

        // zoom automático en tu comuna
        setTimeout(() => zoomAComuna(data), 800);
      } catch (err) {
        console.log("Error:", err);
      } finally {
        setLoading(false);
      }
    })();

    return () => subscription && subscription.remove();
  }, []);

  // ================
  // 🔍 ZOOM A TU COMUNA
  // ================
  const zoomAComuna = (data) => {
    if (!mapRef.current || !location) return;

    const cercanos = data.filter((p) => {
      if (!p.latitud || !p.longitud) return false;

      const dx = p.latitud - location.latitude;
      const dy = p.longitud - location.longitude;

      return Math.sqrt(dx * dx + dy * dy) < 0.03; // ~1.5 KM
    });

    if (cercanos.length > 0) {
      mapRef.current.fitToCoordinates(
        cercanos.map((p) => ({
          latitude: parseFloat(p.latitud),
          longitude: parseFloat(p.longitud),
        })),
        {
          edgePadding: { top: 60, bottom: 60, left: 60, right: 60 },
          animated: true,
        }
      );
    } else {
      volverMiUbicacion();
    }
  };

  // ================
  // BOTÓN GPS — RÁPIDO
  // ================
  const volverMiUbicacion = () => {
    if (!location || !mapRef.current) return;

    mapRef.current.animateCamera(
      {
        center: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        zoom: 16,
      },
      { duration: 600 }
    );
  };

  // ================
  // APLICAR FILTROS
  // ================
  const aplicarFiltros = (f) => {
    let filtrados = [...todosPuntos];

    if (f.region) filtrados = filtrados.filter((p) => p.region_nombre === f.region);
    if (f.comuna) filtrados = filtrados.filter((p) => p.comuna_nombre === f.comuna);
    if (f.tipo) filtrados = filtrados.filter((p) => p.tipo_punto === f.tipo);

    if (f.material) {
      const mat = f.material.toLowerCase();
      filtrados = filtrados.filter((p) =>
        Array.isArray(p.materiales_aceptados)
          ? p.materiales_aceptados.map((x) => x.toLowerCase()).includes(mat)
          : false
      );
    }

    setPuntos(filtrados);
    setTimeout(() => zoomAComuna(filtrados), 400);
  };

  // ===================
  // UI
  // ===================
  if (loading || !location) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#006D40" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ClusteredMapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation={true}
        showsMyLocationButton={false} 
        tracksViewChanges={false}
        animateClusters={true}
        clusterColor="#006D40"
        clusterTextColor="#fff"
        radius={60}
        extent={256}
        minPoints={10}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {puntos.map((p) => {
          if (!p.latitud || !p.longitud) return null;

          return (
            <Marker
              key={p._id}
              coordinate={{
                latitude: parseFloat(p.latitud),
                longitude: parseFloat(p.longitud),
              }}
              title={p.nombre_punto}
              description={p.direccion_completa}
            >
              <Image
                source={{
                  uri: "https://res.cloudinary.com/dg233psnj/image/upload/v1762310747/ChatGPT_Image_4_nov_2025_11_45_09_p.m._ij1ufz.png",
                }}
                style={styles.markerImage}
              />
            </Marker>
          );
        })}
      </ClusteredMapView>

      {/* BOTÓN GPS */}
      <TouchableOpacity style={styles.gpsButton} onPress={volverMiUbicacion}>
        <Ionicons name="navigate-circle" size={50} color="#006D40" />
      </TouchableOpacity>

      {/* BOTÓN FILTRO */}
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setFilterVisible(true)}
      >
        <Ionicons name="options" size={30} color="white" />
      </TouchableOpacity>

      {/* BOTTOM SHEET */}
      <FilterSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onApply={aplicarFiltros}
        regiones={regiones}
        comunas={comunas}
        tipos={tipos}
        materiales={materiales}
      />
    </View>
  );
}

// =====================
// ESTILOS
// =====================
const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  gpsButton: {
    position: "absolute",
    bottom: 90,
    right: 20,
    backgroundColor: "white",
    padding: 8,
    borderRadius: 40,
    elevation: 8,
  },

  filterButton: {
    position: "absolute",
    top: 80,
    right: 20,
    backgroundColor: "#006D40",
    padding: 12,
    borderRadius: 30,
    elevation: 8,
  },

  markerImage: { width: 35, height: 35 },
});
