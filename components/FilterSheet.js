import { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function FilterSheet({
  visible,
  onClose,
  onApply,
  regiones = [],
  comunas = [],
  tipos = [],
  materiales = [],
}) {
  // Normalizar LO QUE VIENE DE LA BD
  const safeRegiones = Array.isArray(regiones) ? regiones : [];
  const safeComunas = Array.isArray(comunas) ? comunas : [];
  const safeTipos = Array.isArray(tipos) ? tipos : [];
  const safeMateriales = Array.isArray(materiales)
    ? materiales.map((m) => m.toLowerCase())
    : [];

  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedComuna, setSelectedComuna] = useState(null);
  const [selectedTipo, setSelectedTipo] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  const applyFilters = () => {
    onApply({
      region: selectedRegion,
      comuna: selectedComuna,
      tipo: selectedTipo,
      material: selectedMaterial,
    });
    onClose();
  };

  const renderOption = (label, selected, setSelected) => {
    if (!label) return null;

    return (
      <TouchableOpacity
        key={label}
        onPress={() => setSelected(selected === label ? null : label)}
        style={[
          styles.option,
          selected === label && styles.optionSelected,
        ]}
      >
        <Text
          style={[
            styles.optionText,
            selected === label && styles.optionTextSelected,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Filtros</Text>

          <ScrollView style={{ flex: 1 }}>
            <Text style={styles.section}>Región</Text>
            {safeRegiones.map((r) =>
              renderOption(r, selectedRegion, setSelectedRegion)
            )}

            <Text style={styles.section}>Comuna</Text>
            {safeComunas.map((c) =>
              renderOption(c, selectedComuna, setSelectedComuna)
            )}


            <Text style={styles.section}>Material</Text>
            {safeMateriales.map((m) =>
              renderOption(m, selectedMaterial, setSelectedMaterial)
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cerrar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
              <Text style={styles.applyText}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    height: "80%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 15 },
  section: { fontSize: 16, fontWeight: "bold", marginTop: 15 },
  option: {
    backgroundColor: "#eee",
    padding: 10,
    borderRadius: 8,
    marginTop: 5,
  },
  optionSelected: { backgroundColor: "#006D40" },
  optionText: { color: "#333" },
  optionTextSelected: { color: "#fff", fontWeight: "bold" },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  applyBtn: {
    backgroundColor: "#006D40",
    padding: 12,
    borderRadius: 10,
    width: "48%",
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: "#ddd",
    padding: 12,
    borderRadius: 10,
    width: "48%",
    alignItems: "center",
  },
  applyText: { color: "white", fontWeight: "bold" },
  cancelText: { color: "#333" },
});
