import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, StyleSheet, TouchableOpacity, View } from "react-native";
import MapView, { Marker, UrlTile } from "react-native-maps";

export default function HomeScreen() {
  const [location, setLocation] = useState(null);
  const [puntos, setPuntos] = useState([]); // puntos visibles actualmente
  const [todosPuntos, setTodosPuntos] = useState([]); // todos los puntos recibidos
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);

  const API_URL = "http://192.168.1.7:5000/api/puntos"; //cambiar IP segun tu ipv4

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permiso de ubicación denegado");
          setLoading(false);
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc.coords);

        // 🔹 Obtener todos los puntos del backend
        const response = await fetch(API_URL);
        const data = await response.json();
        console.log("✅ Total de puntos recibidos:", data.length);
        setTodosPuntos(data);

        // 🔹 Ajustar cámara después de cargar
        setTimeout(() => ajustarVista(data), 1000);

        // 🔹 Iniciar carga por etapas
        cargarPorEtapas(data);
      } catch (error) {
        console.error("❌ Error al obtener puntos:", error);
        Alert.alert("Error al conectar con el servidor", error.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 🧭 Centrar el mapa según los puntos
  const ajustarVista = (data) => {
    if (!mapRef.current || data.length === 0) return;

    const coords = data
      .filter((p) => p.latitud && p.longitud)
      .map((p) => ({
        latitude: parseFloat(p.latitud),
        longitude: parseFloat(p.longitud),
      }));

    if (coords.length > 0) {
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
        animated: true,
      });
    }
  };

  // ⚡ Cargar marcadores en lotes
  const cargarPorEtapas = async (data) => {
    const CHUNK_SIZE = 50; // cantidad por etapa
    let index = 0;
    while (index < data.length) {
      const nextChunk = data.slice(index, index + CHUNK_SIZE);
      setPuntos((prev) => [...prev, ...nextChunk]);
      index += CHUNK_SIZE;
      await new Promise((resolve) => setTimeout(resolve, 100)); // pausa entre etapas
    }
  };

  // 📍 Volver a ubicación actual
  const volverMiUbicacion = async () => {
    const loc = await Location.getCurrentPositionAsync({});
    setLocation(loc.coords);
    mapRef.current.animateToRegion({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
  };

  if (loading || !location) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#006D40" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation={true}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        }}
      >
        <UrlTile
          urlTemplate={`https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=akMCXvGQEqblTr1h6UqF`}
          maximumZ={19}
          tileSize={256}
        />

        {/* ♻️ Marcadores por etapas */}
        {puntos.map((p) => {
          if (!p.latitud || !p.longitud) return null;
          return (
            <Marker
              key={p._id}
              coordinate={{
                latitude: parseFloat(p.latitud),
                longitude: parseFloat(p.longitud),
              }}
              title={p.comuna_nombre || "Punto de reciclaje"}
              description={p.direccion_completa || "Dirección no disponible"}
            >
              <Image
                source={{
                  uri: "https://res.cloudinary.com/dg233psnj/image/upload/v1762310747/ChatGPT_Image_4_nov_2025_11_45_09_p.m._ij1ufz.png",
                }}
                style={styles.markerImage}
                resizeMode="contain"
              />
            </Marker>
          );
        })}
      </MapView>

      {/* 📍 Botón GPS */}
      <TouchableOpacity style={styles.gpsButton} onPress={volverMiUbicacion}>
        <Ionicons name="navigate-circle" size={48} color="#006D40" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  gpsButton: {
    position: "absolute",
    bottom: 90,
    right: 20,
    backgroundColor: "white",
    borderRadius: 30,
    padding: 8,
    elevation: 5,
  },
  markerImage: {
    width: 30,
    height: 30,
  },
});
