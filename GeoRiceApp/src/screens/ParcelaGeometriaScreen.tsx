import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  editingGeometry: number[][];
  area: string;
  onEliminarUltimo: () => void;
  onCancelar: () => void;
  onGuardar: () => void;
}

const ParcelaGeometria: React.FC<Props> = ({
  editingGeometry, area, onEliminarUltimo, onCancelar, onGuardar,
}) => {
  return (
    <>
      <Text style={styles.detailTitle}>Editando geometría</Text>
      <Text style={styles.detailText}>Vértices: {editingGeometry.length}</Text>
      <Text style={styles.detailText}>Área: {area} ha</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={onEliminarUltimo}>
          <Text style={styles.buttonText}>Eliminar último punto</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={onCancelar}>
          <Text style={styles.buttonText}>Cancelar edición</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={[styles.button, styles.saveButton, { marginTop: 10 }]}
        onPress={onGuardar}>
        <Text style={styles.buttonText}>Guardar cambios</Text>
      </TouchableOpacity>
    </>
  );
};

const styles = StyleSheet.create({
  detailTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  detailText:  { fontSize: 16, marginBottom: 5 },
  buttonRow:   { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
  button:      { backgroundColor: '#007AFF', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  saveButton:  { backgroundColor: '#34C759' },
  buttonText:  { color: 'white', fontWeight: 'bold' },
});

export default ParcelaGeometria;