import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  parcela: any;
  onEditarDatos: () => void;
  onEditarGeometria: () => void;
  onEliminar: () => void;
  onCerrar: () => void;
  onActividades: () => void;
  onCapas: () => void;
}



const ParcelaDetalle: React.FC<Props> = ({
  parcela, onEditarDatos, onEditarGeometria,
  onEliminar, onCerrar, onActividades,onCapas
}) => {
  return (
    <>
      <Text style={styles.detailTitle}>Parcela {parcela.nombre ?? parcela.p_nombre}</Text>
      <Text style={styles.detailText}>ID: {parcela.id ?? parcela.p_id}</Text>
      <Text style={styles.detailText}>Propietario: {parcela.propietario ?? parcela.p_propietario}</Text>
      <Text style={styles.detailText}>Cultivo: {parcela.cultivo ?? parcela.p_cultivo}</Text>
      <Text style={styles.detailText}>Área: {Number(parcela.area_ha ?? parcela.p_area_ha).toFixed(2)} ha</Text>
      {(parcela.zona_id ?? parcela.p_zona_id) && (
        <Text style={[styles.detailText, { color: '#1D9E75' }]}>
          Zona ID: {parcela.zona_id ?? parcela.p_zona_id}
        </Text>
      )}
      <Text style={styles.detailText}>
        Actividades: {parcela.actividades?.length > 0 ? parcela.actividades.join(', ') : 'Ninguna registrada'}
      </Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={onEditarDatos}>
          <Text style={styles.buttonText}>Editar datos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={onEditarGeometria}>
          <Text style={styles.buttonText}>Editar geometría</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, { backgroundColor: 'red' }]} onPress={onEliminar}>
          <Text style={styles.buttonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.buttonRow, { marginTop: 10 }]}>
        <TouchableOpacity style={[styles.button, { backgroundColor: '#8B5CF6' }]} onPress={onActividades}>
          <Text style={styles.buttonText}>📋 Actividades</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, { backgroundColor: '#FF6B35' }]} onPress={onCapas}>
  <Text style={styles.buttonText}>🧩 Capas</Text>
</TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={onCerrar}>
          <Text style={styles.buttonText}>Cerrar</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  detailTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  detailText:  { fontSize: 16, marginBottom: 5 },
  buttonRow:   { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
  button:      { backgroundColor: '#007AFF', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  buttonText:  { color: 'white', fontWeight: 'bold' },
});

export default ParcelaDetalle;