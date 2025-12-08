import React, { useEffect, useState, useMemo } from "react";
import {View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator} from "react-native";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function Puntos() {
  const API_BASE =
    (process.env.EXPO_PUBLIC_API_URL || "http://192.168.100.24:5000").replace(
      /\/+$/,
      ""
    );

  const router = useRouter();

  const [puntos, setPuntos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedComuna, setSelectedComuna] = useState("all");
  const [expanded, setExpanded] = useState(null); // Para acordeón móvil simple

  useEffect(() => {
    fetchPuntos();
  }, []);

  const fetchPuntos = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/puntos`);
      const data = await res.json();
      setPuntos(data);
      setLoading(false);
    } catch (e) {
      console.log("Error cargando puntos:", e);
      setLoading(false);
    }
  };

  const comunas = useMemo(() => {
    const setComunas = new Set(puntos.map((p) => p.comuna_nombre));
    return Array.from(setComunas).sort();
  }, [puntos]);

  const filtered = useMemo(() => {
    return puntos.filter((p) => {
      const materials = Array.isArray(p.materiales_aceptados)
        ? p.materiales_aceptados.join(", ").toLowerCase()
        : "";

      const matchSearch =
        p.nombre_punto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.direccion_completa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        materials.includes(searchTerm.toLowerCase());

      const matchComuna =
        selectedComuna === "all" || p.comuna_nombre === selectedComuna;

      return matchSearch && matchComuna;
    });
  }, [puntos, searchTerm, selectedComuna]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#006D40" />
        <Text style={{ marginTop: 15 }}>Cargando puntos...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Puntos de Reciclaje Tecnológico</Text>

      {/* BUSCADOR */}
      <View style={styles.searchBox}>
        <MaterialIcons
          name="search"
          size={24}
          color="#777"
          style={{ marginRight: 8 }}
        />
        <TextInput
          placeholder="Buscar por nombre, dirección o materiales..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          style={{ flex: 1, fontSize: 16 }}
        />
      </View>

      {/* SELECT COMUNA */}
      <View style={styles.dropdown}>
        <TouchableOpacity
          style={styles.dropdownBtn}
          onPress={() =>
            setExpanded(expanded === "_select" ? null : "_select")
          }
        >
          <Text style={styles.dropdownBtnText}>
            {selectedComuna === "all"
              ? "Filtrar por comuna"
              : selectedComuna}
          </Text>
          <MaterialIcons
            name="keyboard-arrow-down"
            size={26}
            color="#006D40"
          />
        </TouchableOpacity>

        {expanded === "_select" && (
          <View style={styles.dropdownList}>
            <TouchableOpacity
              onPress={() => {
                setSelectedComuna("all");
                setExpanded(null);
              }}
            >
              <Text style={styles.dropdownItem}>Todas las comunas</Text>
            </TouchableOpacity>

            {comunas.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => {
                  setSelectedComuna(c);
                  setExpanded(null);
                }}
              >
                <Text style={styles.dropdownItem}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* RESULTADOS */}
      <Text style={styles.resultCount}>
        Mostrando {filtered.length} de {puntos.length}
      </Text>

      {/* LISTA */}
      {filtered.map((p, idx) => {
        const uid = p._id ?? idx;

        return (
          <View key={uid} style={styles.card}>
            {/* Trigger */}
            <TouchableOpacity
              onPress={() => setExpanded(expanded === uid ? null : uid)}
              style={styles.cardHeader}
            >
              <View style={styles.iconBox}>
                <FontAwesome5 name="recycle" size={20} color="#006D40" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{p.nombre_punto}</Text>
                <Text style={styles.cardSub}>
                  📍 {p.comuna_nombre}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Content */}
            {expanded === uid && (
              <View style={styles.cardContent}>
                <Text style={styles.section}>Dirección</Text>
                <Text>{p.direccion_completa}</Text>
                <Text>{p.region_nombre}</Text>

                {Array.isArray(p.materiales_aceptados) && (
                  <>
                    <Text style={styles.section}>Materiales aceptados</Text>
                    <Text>{p.materiales_aceptados.join(", ")}</Text>
                  </>
                )}

                {p.horario && (
                  <>
                    <Text style={styles.section}>Horario</Text>
                    <Text>{p.horario}</Text>
                  </>
                )}

                {p.telefono && (
                  <>
                    <Text style={styles.section}>Teléfono</Text>
                    <Text>{p.telefono}</Text>
                  </>
                )}

                {p.administrador && (
                  <>
                    <Text style={styles.section}>Administrador</Text>
                    <Text>{p.administrador}</Text>
                  </>
                )}

                {p.encargado && (
                  <>
                    <Text style={styles.section}>Encargado</Text>
                    <Text>{p.encargado}</Text>
                  </>
                )}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

// =============================
// 🎨 ESTILOS
// =============================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F5F8F5",
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#006D40",
    textAlign: "center",
    marginBottom: 20,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Buscador
  searchBox: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
  },

  // Dropdown
  dropdown: {
    marginBottom: 15,
  },
  dropdownBtn: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    elevation: 2,
  },
  dropdownBtnText: {
    fontSize: 16,
    color: "#006D40",
    fontWeight: "bold",
  },
  dropdownList: {
    backgroundColor: "#fff",
    marginTop: 5,
    borderRadius: 12,
    elevation: 3,
    paddingVertical: 8,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    fontSize: 15,
  },

  resultCount: {
    textAlign: "center",
    marginBottom: 10,
    color: "#444",
  },

  // Cards
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBox: {
    backgroundColor: "#E4F4E8",
    padding: 10,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  cardSub: {
    color: "#2d6a4f",
    marginTop: 3,
  },
  cardContent: {
    marginTop: 15,
    gap: 6,
  },
  section: {
    marginTop: 10,
    fontWeight: "bold",
    color: "#006D40",
  },
});
