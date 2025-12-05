// /app/(tabs)/index.js
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";

import ClusteredMapView from "react-native-map-clustering";
import { Marker, PROVIDER_GOOGLE } from "react-native-maps";

import FilterSheet from "../../components/FilterSheet";
import { BACKEND_URL } from "../../config";

// =======================================================
// COMPONENTE PRINCIPAL
// =======================================================
export default function HomeScreen() {
  const router = useRouter();
  const { goto, point } = useLocalSearchParams();

  // Solo moverá el mapa una vez
  const [alreadyMoved, setAlreadyMoved] = useState(false);

  const selectedPoint = point ? JSON.parse(point) : null;

  const [location, setLocation] = useState(null);
  const [puntos, setPuntos] = useState([]);
  const [todosPuntos, setTodosPuntos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterVisible, setFilterVisible] = useState(false);

  const [regiones, setRegiones] = useState([]);
  const [comunas, setComunas] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [materiales, setMateriales] = useState([]);

  const mapRef = useRef(null);
  const API_URL = `${BACKEND_URL}/puntos`;

  // =======================================================
  // CARGAR UBICACIÓN Y PUNTOS
  // =======================================================
  useEffect(() => {
    let subscription;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permiso de ubicación denegado");
          return;
        }

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Highest,
            timeInterval: 1200,
            distanceInterval: 2,
          },
          (loc) => setLocation(loc.coords)
        );

        const response = await fetch(API_URL);
        const data = await response.json();

        setTodosPuntos(data);
        setPuntos(data);

        setRegiones([...new Set(data.map((p) => p.region_nombre))]);
        setComunas([...new Set(data.map((p) => p.comuna_nombre))]);
        setTipos([...new Set(data.map((p) => p.tipo_punto))]);

        const mats = data.flatMap((p) =>
          Array.isArray(p.materiales_aceptados)
            ? p.materiales_aceptados.map((m) => m.toLowerCase())
            : []
        );
        setMateriales([...new Set(mats)]);
      } catch (err) {
        console.log("Error:", err);
      } finally {
        setLoading(false);
      }
    })();

    return () => subscription && subscription.remove();
  }, []);

  // =======================================================
  // MOVER AL PUNTO — SOLO UNA VEZ
  // =======================================================
  useEffect(() => {
    if (!goto || goto !== "1") return;
    if (!selectedPoint) return;
    if (!mapRef.current) return;
    if (alreadyMoved) return; // Previene loops

    const lat = Number(selectedPoint.latitud);
    const lng = Number(selectedPoint.longitud);

    // Mover cámara una única vez
    mapRef.current.animateCamera(
      {
        center: { latitude: lat, longitude: lng },
        zoom: 18,
      },
      { duration: 900 }
    );

    // Marcamos como ya movido
    setAlreadyMoved(true);

  }, [goto, selectedPoint, mapRef.current]);

  // =======================================================
  // ZOOM AUTOMÁTICO SI NO VINO NADA DE ESCANEAR
  // =======================================================
  useEffect(() => {
    if (!location || !mapRef.current) return;
    if (goto === "1") return; // NO AUTOZOOM después de seleccionar punto

    mapRef.current.animateCamera(
      {
        center: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        zoom: 15,
      },
      { duration: 800 }
    );
  }, [location]);

  // =======================================================
  // APLICAR FILTROS
  // =======================================================
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
  };

  // =======================================================
  // LOADING
  // =======================================================
  if (loading || !location) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#006D40" />
      </View>
    );
  }

  // =======================================================
  // UI
  // =======================================================
  return (
    <View style={styles.container}>
      <ClusteredMapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation
        showsMyLocationButton={false}
        clusterColor="#006D40"
        radius={60}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {puntos.map((p) => (
          <Marker
            key={p._id}
            coordinate={{
              latitude: Number(p.latitud),
              longitude: Number(p.longitud),
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
        ))}
      </ClusteredMapView>

      {/* BOTÓN GPS */}
      <TouchableOpacity
        style={styles.gpsButton}
        onPress={() => {
          setAlreadyMoved(true); // evita re-mover automáticamente
          mapRef.current?.animateCamera(
            {
              center: {
                latitude: location.latitude,
                longitude: location.longitude,
              },
              zoom: 15.5,
            },
            { duration: 600 }
          );
        }}
      >
        <Ionicons name="navigate-circle" size={50} color="#006D40" />
      </TouchableOpacity>

      {/* BOTÓN FILTRO */}
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setFilterVisible(true)}
      >
        <Ionicons name="options" size={30} color="#fff" />
      </TouchableOpacity>

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

// =======================================================
// ESTILOS
// =======================================================
const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

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
