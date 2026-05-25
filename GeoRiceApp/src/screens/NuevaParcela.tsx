import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';

interface Props {
  vertices: number[][];
  nombre: string;
  propietario: string;
  area: string;
  onNombreChange: (t: string) => void;
  onPropietarioChange: (t: string) => void;
  onLimpiar: () => void;
  onGuardar: () => void;
  onSyncOffline: () => void;
}

const NuevaParcela: React.FC<Props> = ({
  vertices, nombre, propietario, area,
  onNombreChange, onPropietarioChange,
  onLimpiar, onGuardar, onSyncOffline,
}) => {
  return (
    <>
      <Text style={styles.areaText}>Área: {area} ha</Text>
      <Text style={styles.vertexText}>Vértices: {vertices.length}</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre de la parcela"
        value={nombre}
        onChangeText={onNombreChange}
      />
      <TextInput
        style={styles.input}
        placeholder="Propietario"
        value={propietario}
        onChangeText={onPropietarioChange}
      />
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={onLimpiar}>
          <Text style={styles.buttonText}>Limpiar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={onGuardar}>
          <Text style={styles.buttonText}>Guardar Parcela</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={[styles.button, { marginTop: 10, backgroundColor: '#FFA500' }]}
        onPress={onSyncOffline}>
        <Text style={styles.buttonText}>Sincronizar offline</Text>
      </TouchableOpacity>
    </>
  );
};

const styles = StyleSheet.create({
  areaText:   { fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  vertexText: { textAlign: 'center', marginVertical: 5, color: 'gray' },
  input:      { borderWidth: 1, borderColor: '#ccc', borderRadius: 5,
                paddingHorizontal: 10, paddingVertical: 8, marginBottom: 10, fontSize: 16 },
  buttonRow:  { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
  button:     { backgroundColor: '#007AFF', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  saveButton: { backgroundColor: '#34C759' },
  buttonText: { color: 'white', fontWeight: 'bold' },
});

export default NuevaParcela;