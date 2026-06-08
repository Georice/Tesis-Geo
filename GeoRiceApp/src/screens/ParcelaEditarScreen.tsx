import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';

interface Props {
  editingData: any;
  onChangeData: (v: any) => void;
  onCancelar: () => void;
  onGuardar: () => void;
}

const ParcelaEditarScreen: React.FC<Props> = ({ editingData, onChangeData, onCancelar, onGuardar }) => {
  const propietario = editingData?.propietario ?? editingData?.p_propietario ?? '';
  return (
    <>
      <Text style={s.titulo}>Editar parcela</Text>
      <TextInput style={s.input} value={editingData?.nombre ?? editingData?.p_nombre ?? ''}
        onChangeText={v => onChangeData({ ...editingData, nombre: v })}
        placeholder="Nombre" placeholderTextColor="#aaa" />
      {propietario ? (
        <View style={s.readOnly}>
          <Text style={s.readOnlyLabel}>Propietario</Text>
          <Text style={s.readOnlyValue}>{propietario}</Text>
        </View>
      ) : null}
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
};

const s = StyleSheet.create({
  titulo:         { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  input:          { borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
                    paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8, fontSize: 15 },
  readOnly:       { borderWidth: 1, borderColor: '#e8e8e8', borderRadius: 8,
                    paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8, backgroundColor: '#f7f7f7' },
  readOnlyLabel:  { fontSize: 10, color: '#aaa', marginBottom: 2 },
  readOnlyValue:  { fontSize: 15, color: '#555' },
  row:            { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  btn:            { backgroundColor: '#1a5c2a', borderRadius: 8, paddingVertical: 10,
                    paddingHorizontal: 16, flex: 1, alignItems: 'center' },
  btnText:        { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  btnSec:         { borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
                    paddingVertical: 10, paddingHorizontal: 12, alignItems: 'center' },
  btnSecText:     { fontSize: 13, color: '#444' },
});

export default ParcelaEditarScreen;
