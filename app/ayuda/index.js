// /app/(tabs)/perfil/ayuda/index.js
import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function Ayuda() {
  return (
    <ScrollView style={styles.container}>
      
      {/* TÍTULO */}
      <Text style={styles.title}>Ayuda y Soporte</Text>

      {/* ¿QUÉ ES REUSOSMART? */}
      <View style={styles.block}>
        <Text style={styles.subtitle}>¿Qué es ReusoSmart?</Text>
        <Text style={styles.text}>
          ReusoSmart es una aplicación que te ayuda a encontrar puntos de 
          reciclaje de aparatos electrónicos (AEE) cercanos, ver su información,
          escanear códigos QR y reciclar de manera segura y responsable.
        </Text>
      </View>

      {/* FUNCIONALIDADES */}
      <View style={styles.block}>
        <Text style={styles.subtitle}>¿Qué puedo hacer en la aplicación?</Text>

        <View style={styles.row}>
          <Ionicons name="location" size={22} color="#4CAF50" />
          <Text style={styles.text}>
            Buscar puntos de reciclaje en el mapa y ver su información completa.
          </Text>
        </View>

        <View style={styles.row}>
          <Ionicons name="qr-code-outline" size={22} color="#4CAF50" />
          <Text style={styles.text}>
            Escanear códigos QR para validar puntos reales.
          </Text>
        </View>

        <View style={styles.row}>
          <Ionicons name="navigate" size={22} color="#4CAF50" />
          <Text style={styles.text}>
            Navegar hacia un punto usando Google Maps u otra app.
          </Text>
        </View>

        <View style={styles.row}>
          <Ionicons name="person-circle" size={22} color="#4CAF50" />
          <Text style={styles.text}>
            Administrar tu perfil y actualizar información personal.
          </Text>
        </View>
      </View>

      {/* FAQ */}
      <View style={styles.block}>
        <Text style={styles.subtitle}>Preguntas Frecuentes</Text>

        <Text style={styles.question}>¿Por qué no veo puntos en el mapa?</Text>
        <Text style={styles.text}>
          Puede deberse a que la ubicación está desactivada, no hay internet o 
          aún no se han agregado puntos en tu región.
        </Text>

        <Text style={styles.question}>¿El QR no funciona?</Text>
        <Text style={styles.text}>
          Verifica que la cámara tenga permisos, que el código no esté dañado 
          y que haya buena luz para escanear.
        </Text>
      </View>

      {/* REPORTES */}
      <View style={styles.block}>
        <Text style={styles.subtitle}>Reportar un problema</Text>
        <Text style={styles.text}>
          Si un punto está cerrado, movido o con información incorrecta, puedes 
          reportarlo al equipo de soporte.
        </Text>

        <Text style={styles.email}>📧 soporte@reusosmart.cl</Text>
      </View>

      {/* CONSEJOS */}
      <View style={styles.block}>
        <Text style={styles.subtitle}>Consejos para Reciclar Mejor</Text>
        <Text style={styles.text}>• Separa tus residuos en casa.</Text>
        <Text style={styles.text}>• Verifica qué materiales acepta cada punto.</Text>
        <Text style={styles.text}>• Evita botar electrónicos en la basura común.</Text>
        <Text style={styles.text}>• Prefiere siempre puntos certificados.</Text>
      </View>

      <Text style={styles.footer}>ReusoSmart © 2025</Text>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 14,
    color: "#000",
  },
  block: {
    marginBottom: 22,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 6,
    color: "#333",
  },
  text: {
    fontSize: 15,
    color: "#444",
    marginBottom: 8,
    lineHeight: 22,
  },
  question: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 10,
    color: "#2E7D32",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  email: {
    marginTop: 4,
    fontSize: 16,
    color: "#4CAF50",
    fontWeight: "600",
  },
  footer: {
    textAlign: "center",
    color: "#777",
    marginVertical: 20,
  },
});
