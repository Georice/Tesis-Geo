import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';

interface Props {
  editingData: any;
  onChangeData: (v: any) => void;
  onCancelar: () => void;
  onGuardar: () => void;
}

const ParcelaEditarScreen: React.FC<Props> = ({ editingData, onChangeData, onCancelar, onGuardar }) => (
  <>
    <Text style={s.titulo}>Editar parcela</Text>
    <TextInput style={s.input} value={editingData?.nombre ?? editingData?.p_nombre ?? ''}
      onChangeText={v => onChangeData({ ...editingData, nombre: v })}
      placeholder="Nombre" placeholderTextColor="#aaa" />
    <TextInput style={s.input} value={editingData?.propietario ?? editingData?.p_propietario ?? ''}
      onChangeText={v => onChangeData({ ...editingData, propietario: v })}
      placeholder="Propietario" placeholderTextColor="#aaa" />
    <TextInput style={s.input} value={editingData?.cultivo ?? editingData?.p_cultivo ?? ''}
      onChangeText={v => onChangeData({ ...editingData, cultivo: v })}
      placeholder="Cultivo" placeholderTextColor="#aaa" />
    <View style={s.row}>
      <TouchableOpacity style={s.btnSec} onPress={onCancelar}>
        <Text style={s.btnSecText}>✕ Cancelar</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.btn} onPress={onGuardar}>
        <Text style={s.btnText}>💾 Guardar</Text>
      </TouchableOpacity>
    </View>
  </>
);

const s = StyleSheet.create({
  titulo: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  input:  { borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
            paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8, fontSize: 15 },
  row:    { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  btn:    { backgroundColor: '#1a5c2a', borderRadius: 8, paddingVertical: 10,
            paddingHorizontal: 16, flex: 1, alignItems: 'center' },
  btnText:{ color: '#fff', fontWeight: 'bold', fontSize: 13 },
  btnSec: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
            paddingVertical: 10, paddingHorizontal: 12, alignItems: 'center' },
  btnSecText: { fontSize: 13, color: '#444' },
});

export default ParcelaEditarScreen;