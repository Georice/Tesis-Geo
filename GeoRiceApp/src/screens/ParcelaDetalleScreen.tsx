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
  onIniciarCiclo: () => void;
}

const ParcelaDetalleScreen: React.FC<Props> = ({
  parcela, onEditarDatos, onEditarGeometria,
  onEliminar, onCerrar, onActividades, onCapas, onIniciarCiclo
}) => (
  <>
    <Text style={s.titulo}>Parcela {parcela?.nombre ?? parcela?.p_nombre}</Text>
    <Text style={s.texto}>Propietario: {parcela?.propietario ?? parcela?.p_propietario}</Text>
    <Text style={s.texto}>Cultivo: {parcela?.cultivo ?? parcela?.p_cultivo}</Text>
    <Text style={s.texto}>Área: {Number(parcela?.area_ha ?? parcela?.p_area_ha ?? 0).toFixed(2)} ha</Text>
    <View style={s.row}>
      <TouchableOpacity style={s.btn} onPress={onEditarDatos}>
        <Text style={s.btnText}>✏️ Editar</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.btn} onPress={onEditarGeometria}>
        <Text style={s.btnText}>📐 Geometría</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[s.btn, { backgroundColor: 'red' }]} onPress={onEliminar}>
        <Text style={s.btnText}>🗑️</Text>
      </TouchableOpacity>
    </View>
    <View style={[s.row, { marginTop: 8 }]}>
      <TouchableOpacity style={[s.btn, { backgroundColor: '#8B5CF6' }]} onPress={onActividades}>
        <Text style={s.btnText}>📋 Actividades</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[s.btn, { backgroundColor: '#FF6B35' }]} onPress={onCapas}>
        <Text style={s.btnText}>🧩 Capas</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[s.btn, { backgroundColor: '#1a5c2a' }]} onPress={onIniciarCiclo}>
        <Text style={s.btnText}>🌱 Ciclo</Text>
      </TouchableOpacity>
    </View>
    <TouchableOpacity style={[s.btn, { marginTop: 8, alignSelf: 'center' }]} onPress={onCerrar}>
      <Text style={s.btnText}>✕ Cerrar</Text>
    </TouchableOpacity>
  </>
);

const s = StyleSheet.create({
  titulo: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  texto:  { fontSize: 13, color: '#333', marginBottom: 3 },
  row:    { flexDirection: 'row', justifyContent: 'space-around' },
  btn:    { backgroundColor: '#007AFF', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  btnText:{ color: '#fff', fontWeight: 'bold', fontSize: 12 },
});

export default ParcelaDetalleScreen;