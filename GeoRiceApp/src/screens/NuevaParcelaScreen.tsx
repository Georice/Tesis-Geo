import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';

interface Props {
  vertices:       number[][];
  nombre:         string;
  area:           string;
  onNombreChange: (v: string) => void;
  onLimpiar:      () => void;
  onGuardar:      () => void;
  onSyncOffline:  () => void;
}

const NuevaParcelaScreen: React.FC<Props> = ({
  vertices, nombre, area,
  onNombreChange, onLimpiar, onGuardar, onSyncOffline,
}) => (
  <>
    <Text style={s.titulo}>Nueva parcela</Text>
    <Text style={s.info}>Vértices: {vertices.length} · Área: {area} ha</Text>
    <TextInput style={s.input} value={nombre} onChangeText={onNombreChange}
      placeholder="Nombre *" placeholderTextColor="#aaa" />
    <View style={s.row}>
      <TouchableOpacity style={s.btnSec} onPress={onLimpiar}>
        <Text style={s.btnSecText}>🗑 Limpiar</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.btnSec} onPress={onSyncOffline}>
        <Text style={s.btnSecText}>☁ Sync</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[s.btn, vertices.length < 3 && { opacity: 0.4 }]}
        onPress={onGuardar} disabled={vertices.length < 3}>
        <Text style={s.btnText}>💾 Guardar</Text>
      </TouchableOpacity>
    </View>
  </>
);

const s = StyleSheet.create({
  titulo:     { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  info:       { fontSize: 12, color: '#999', marginBottom: 8 },
  input:      { borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
                paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8, fontSize: 15 },
  row:        { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  btn:        { backgroundColor: '#1a5c2a', borderRadius: 8, paddingVertical: 10,
                paddingHorizontal: 16, flex: 1, alignItems: 'center' },
  btnText:    { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  btnSec:     { borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
                paddingVertical: 10, paddingHorizontal: 12, alignItems: 'center' },
  btnSecText: { fontSize: 13, color: '#444' },
});

export default NuevaParcelaScreen;
