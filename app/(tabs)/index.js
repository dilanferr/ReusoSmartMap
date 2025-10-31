import React, { useEffect, useState } from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import MapView, { Marker, UrlTile } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen() {
  const [location, setLocation] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Permiso de ubicación denegado");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
    })();
  }, []);

  const puntos = [
    { id: 1, lat: -33.4489, lon: -70.6693 },
    { id: 2, lat: -33.4492, lon: -70.6688 },
    { id: 3, lat: -33.4479, lon: -70.6705 },
    { id: 4, lat: -33.4485, lon: -70.6710 },
  ];

  return (
    <View style={styles.container}>
      {/* Barra superior */}
      <View style={styles.header}>
        <Text style={styles.headerText}>REUSA SMART</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color="#006D40" />
        </TouchableOpacity>
      </View>

      {/* Mapa */}
      <MapView
        style={styles.map}
        region={{
          latitude: location ? location.latitude : -33.4489,
          longitude: location ? location.longitude : -70.6693,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={true}
      >
        <UrlTile
          urlTemplate={`https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=akMCXvGQEqblTr1h6UqF`}
          maximumZ={19}
          tileSize={256}
        />

        {puntos.map((p) => (
          <Marker
            key={p.id}
            coordinate={{ latitude: p.lat, longitude: p.lon }}
            title="Punto de reciclaje"
          >
            <Ionicons name="location-sharp" size={32} color="#006D40" />
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: "#006D40",
    zIndex: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 25,
  },
  headerText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
  },
  addButton: {
    position: "absolute",
    right: 20,
    top: 30,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 4,
  },
});
