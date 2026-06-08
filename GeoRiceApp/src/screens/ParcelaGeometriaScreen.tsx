import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  editingGeometry: number[][];
  area: string;
  onEliminarUltimo: () => void;
  onCancelar: () => void;
  onGuardar: () => void;
}

const ParcelaGeometriaScreen: React.FC<Props> = ({
  editingGeometry, area, onEliminarUltimo, onCancelar, onGuardar,
}) => (
  <>
    <Text style={s.titulo}>Editar geometría</Text>
    <Text style={s.info}>Arrastra vértices o toca el mapa para agregar</Text>
    <Text style={s.info}>Vértices: {editingGeometry.length} · Área: {area} ha</Text>
    <View style={s.row}>
      <TouchableOpacity style={s.btnSec} onPress={onEliminarUltimo}>
        <Text style={s.btnSecText}>↩ Deshacer</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.btnSec} onPress={onCancelar}>
        <Text style={[s.btnSecText, { color: 'red' }]}>✕ Cancelar</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[s.btn, editingGeometry.length < 3 && { opacity: 0.4 }]}
        onPress={onGuardar} disabled={editingGeometry.length < 3}>
        <Text style={s.btnText}>💾 Guardar</Text>
      </TouchableOpacity>
    </View>
  </>
);

const s = StyleSheet.create({
  titulo: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  info:   { fontSize: 12, color: '#999', marginBottom: 4 },
  row:    { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 8 },
  btn:    { backgroundColor: '#1a5c2a', borderRadius: 8, paddingVertical: 10,
            paddingHorizontal: 16, flex: 1, alignItems: 'center' },
  btnText:{ color: '#fff', fontWeight: 'bold', fontSize: 13 },
  btnSec: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
            paddingVertical: 10, paddingHorizontal: 12, alignItems: 'center' },
  btnSecText: { fontSize: 13, color: '#444' },
});

export default ParcelaGeometriaScreen;