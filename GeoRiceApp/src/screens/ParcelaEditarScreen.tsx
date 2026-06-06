import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';

interface Props {
  editingData: any;
  onChangeData: (data: any) => void;
  onCancelar: () => void;
  onGuardar: () => void;
}

const ParcelaEditar: React.FC<Props> = ({ editingData, onChangeData, onCancelar, onGuardar }) => {
  return (
    <>
      <Text style={styles.detailTitle}>Editar datos de parcela {editingData.id ?? editingData.p_id}</Text>
      <Text style={styles.detailText}>Área: {editingData.area_ha ?? editingData.p_area_ha} ha</Text>
      <TextInput
        style={styles.input}
        value={editingData.nombre ?? editingData.p_nombre}
        onChangeText={t => onChangeData({ ...editingData, nombre: t })}
        placeholder="Nombre"
      />
      <TextInput
        style={styles.input}
        value={editingData.propietario ?? editingData.p_propietario}
        onChangeText={t => onChangeData({ ...editingData, propietario: t })}
        placeholder="Propietario"
      />
      <TextInput
        style={styles.input}
        value={editingData.cultivo ?? editingData.p_cultivo}
        onChangeText={t => onChangeData({ ...editingData, cultivo: t })}
        placeholder="Cultivo"
      />
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={onCancelar}>
          <Text style={styles.buttonText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={onGuardar}>
          <Text style={styles.buttonText}>Guardar cambios</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  detailTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  detailText:  { fontSize: 16, marginBottom: 5 },
  input:       { borderWidth: 1, borderColor: '#ccc', borderRadius: 5,
                 paddingHorizontal: 10, paddingVertical: 8, marginBottom: 10, fontSize: 16 },
  buttonRow:   { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
  button:      { backgroundColor: '#007AFF', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  saveButton:  { backgroundColor: '#34C759' },
  buttonText:  { color: 'white', fontWeight: 'bold' },
});

export default ParcelaEditar;