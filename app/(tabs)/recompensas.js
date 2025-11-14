import React from "react";
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from "react-native";

export default function Recompensas() {
  // Ejemplo de logros (más adelante se podrán cargar desde la BD)
  const logros = [
    {
      id: "1",
      titulo: "Reciclador principiante",
      puntos: 50,
      icono: "https://cdn-icons-png.flaticon.com/512/616/616408.png",
    },
    {
      id: "2",
      titulo: "Amigo del planeta",
      puntos: 120,
      icono: "https://cdn-icons-png.flaticon.com/512/616/616408.png",
    },
    {
      id: "3",
      titulo: "Héroe verde",
      puntos: 250,
      icono: "https://cdn-icons-png.flaticon.com/512/616/616408.png",
    },
  ];

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.icono }} style={styles.icon} />
      <View style={styles.textBox}>
        <Text style={styles.title}>{item.titulo}</Text>
        <Text style={styles.points}>+{item.puntos} pts</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🏆 Tus Recompensas</Text>
      <Text style={styles.subHeader}>
        Gana puntos cada vez que reciclas y sube de nivel 🌿
      </Text>

      <View style={styles.pointsBox}>
        <Text style={styles.totalPoints}>450 Puntos</Text>
        <Text style={styles.level}>Nivel: Amigo del Planeta</Text>
      </View>

      <FlatList
        data={logros}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Canjear Puntos</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
    padding: 20,
  },
  header: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#006D40",
    textAlign: "center",
    marginTop: 15,
  },
  subHeader: {
    fontSize: 15,
    color: "#555",
    textAlign: "center",
    marginBottom: 20,
  },
  pointsBox: {
    backgroundColor: "#E6F4EE",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    marginBottom: 25,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  totalPoints: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#006D40",
  },
  level: {
    fontSize: 16,
    color: "#333",
    marginTop: 4,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  icon: {
    width: 50,
    height: 50,
    marginRight: 15,
  },
  textBox: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  points: {
    fontSize: 14,
    color: "#006D40",
    marginTop: 2,
  },
  button: {
    backgroundColor: "#006D40",
    paddingVertical: 14,
    borderRadius: 12,
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    width: "90%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
