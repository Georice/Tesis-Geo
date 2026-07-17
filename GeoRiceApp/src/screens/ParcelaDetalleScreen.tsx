import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from '../components/Icon';

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
    <View style={s.infoCard}>
      <View style={s.infoHeader}>
        <Text style={s.titulo} numberOfLines={1}>
          Parcela {parcela?.nombre ?? parcela?.p_nombre}
        </Text>
        <TouchableOpacity
          style={s.btnCerrar}
          onPress={onCerrar}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon name="close" size={20} color="#666" />
        </TouchableOpacity>
      </View>
      <Text style={s.texto}>Propietario: {parcela?.propietario ?? parcela?.p_propietario}</Text>
      <Text style={s.texto}>Cultivo: {parcela?.cultivo ?? parcela?.p_cultivo}</Text>
      <Text style={s.texto}>Área: {Number(parcela?.area_ha ?? parcela?.p_area_ha ?? 0).toFixed(2)} ha</Text>
    </View>

    <View style={s.card}>
      <TouchableOpacity style={s.item} onPress={onEditarDatos}>
        <Icon name="pencil" size={18} color="#2563eb" style={s.itemIcon} />
        <Text style={s.itemLabel}>Editar</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.item} onPress={onEditarGeometria}>
        <Icon name="ruler-square" size={18} color="#f59e0b" style={s.itemIcon} />
        <Text style={s.itemLabel}>Geometría</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.item} onPress={onEliminar}>
        <Icon name="delete" size={18} color="#dc2626" style={s.itemIcon} />
        <Text style={s.itemLabel}>Eliminar</Text>
      </TouchableOpacity>
    </View>

    <View style={[s.card, { marginTop: 8 }]}>
      <TouchableOpacity style={s.item} onPress={onIniciarCiclo}>
        <Icon name="sprout" size={18} color="#1a5c2a" style={s.itemIcon} />
        <Text style={s.itemLabel}>Ciclo</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.item} onPress={onActividades}>
        <Icon name="clipboard-text" size={18} color="#8B5CF6" style={s.itemIcon} />
        <Text style={s.itemLabel}>Actividades</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.item} onPress={onCapas}>
        <Icon name="puzzle" size={18} color="#FF6B35" style={s.itemIcon} />
        <Text style={s.itemLabel}>Capas</Text>
      </TouchableOpacity>
    </View>
  </>
);

const s = StyleSheet.create({
  infoCard:   { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 12,
                padding: 12, marginBottom: 8, elevation: 5,
                shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1, shadowRadius: 4 },
  infoHeader: { flexDirection: 'row', alignItems: 'center',
                justifyContent: 'space-between', marginBottom: 8 },
  titulo:     { fontSize: 16, fontWeight: 'bold', flex: 1, marginRight: 8 },
  btnCerrar:  { width: 32, height: 32, borderRadius: 16,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.06)' },
  texto:      { fontSize: 13, color: '#333', marginBottom: 3 },
  card:       { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 12,
                flexDirection: 'row', padding: 6, elevation: 5,
                shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1, shadowRadius: 4 },
  item:       { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8 },
  itemIcon:   { marginBottom: 4 },
  itemLabel:  { fontSize: 11, color: '#444', fontWeight: '600' },
});

export default ParcelaDetalleScreen;