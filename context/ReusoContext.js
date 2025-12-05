// /context/ReusoContext.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";

const ReusoContext = createContext();

export const ReusoProvider = ({ children }) => {
  const [carritoObjetos, setCarritoObjetos] = useState([]);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [ubicacionUsuario, setUbicacionUsuario] = useState(null);

  // controla qué vista está mostrando Escanear
  const [step, setStep] = useState("scan");

  // =====================================================
  // CARGAR ESTADO SALVADO
  // =====================================================
  useEffect(() => {
    const cargar = async () => {
      try {
        const carritoGuardado = await AsyncStorage.getItem("carrito");
        const puntoGuardado = await AsyncStorage.getItem("selectedPoint");

        if (carritoGuardado) setCarritoObjetos(JSON.parse(carritoGuardado));
        if (puntoGuardado) setSelectedPoint(JSON.parse(puntoGuardado));
      } catch (err) {
        console.log("❌ Error cargando estado:", err);
      }
    };
    cargar();
  }, []);

  // =====================================================
  // AUTO-SAVE CARRITO
  // =====================================================
  useEffect(() => {
    AsyncStorage.setItem("carrito", JSON.stringify(carritoObjetos)).catch((err) =>
      console.log("❌ Error guardando carrito:", err)
    );
  }, [carritoObjetos]);

  // =====================================================
  // AUTO-SAVE PUNTO
  // =====================================================
  useEffect(() => {
    if (selectedPoint) {
      AsyncStorage.setItem("selectedPoint", JSON.stringify(selectedPoint)).catch((err) =>
        console.log("❌ Error guardando punto:", err)
      );
    }
  }, [selectedPoint]);

  // =====================================================
  // OPERACIONES
  // =====================================================
  const agregarObjeto = (obj) => setCarritoObjetos((prev) => [...prev, obj]);

  const eliminarObjeto = (i) =>
    setCarritoObjetos((prev) => prev.filter((_, idx) => idx !== i));

  const vaciarCarrito = () => {
    setCarritoObjetos([]);
    AsyncStorage.removeItem("carrito");
  };

  const seleccionarPunto = (punto) => {
    setSelectedPoint(punto);
  };

  const limpiarPunto = () => {
    setSelectedPoint(null);
    AsyncStorage.removeItem("selectedPoint");
  };

  // =====================================================
  // ✔ VALIDACIÓN GLOBAL
  // =====================================================
  const canReciclar = () => {
    return carritoObjetos.length > 0 && selectedPoint;
  };

  return (
    <ReusoContext.Provider
      value={{
        carritoObjetos,
        agregarObjeto,
        eliminarObjeto,
        vaciarCarrito,

        selectedPoint,
        seleccionarPunto,
        limpiarPunto,

        ubicacionUsuario,
        setUbicacionUsuario,

        step,
        setStep,

        canReciclar, // <-- NUEVO!
      }}
    >
      {children}
    </ReusoContext.Provider>
  );
};

export const useReuso = () => useContext(ReusoContext);
