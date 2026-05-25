import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, Alert, ActivityIndicator, Modal,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Capa } from '../domain/entities/Capa';
import { GetCapas } from '../application/usecases/capa/GetCapas';
import { DeleteCapa } from '../application/usecases/capa/DeleteCapa';

interface Props {
  visible: boolean;
  parcela: any;
  onClose: () => void;
  onNuevaCapa: () => void;
}

const TIPO_COLOR: Record<string, string> = {
  activo:   '#34C759',
  descanso: '#FFA500',
  lindero:  '#007AFF',
};

const CapasModal: React.FC<Props> = ({ visible, parcela, onClose, onNuevaCapa }) => {
  const [capas, setCapas]     = useState<Capa[]>([]);
  const [loading, setLoading] = useState(false);

  const parcelaId     = parcela?.p_id ?? parcela?.id;
  const parcelaNombre = parcela?.p_nombre ?? parcela?.nombre ?? '';

  const cargarCapas = useCallback(async () => {
    if (!parcelaId) return;
    setLoading(true);
    try {
      const data = await GetCapas(parcelaId);
      setCapas(data);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally { setLoading(false); }
  }, [parcelaId]);

  useEffect(() => {
    if (visible) cargarCapas();
  }, [visible, cargarCapas]);

  const handleEliminar = (capa: Capa) => {
    Alert.alert('Eliminar capa', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try {
          await DeleteCapa(capa.id);
          await cargarCapas();
          Alert.alert('Capa eliminada');
        } catch (e: any) { Alert.alert('Error', e.message); }
      }},
    ]);
  };

  const handleNuevaCapa = () => {
    onClose();       // cierra el modal
    onNuevaCapa();   // activa modo dibujo en mapa
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={s.container}>
          <View style={s.topBar}>
            <Text style={s.topBarTitulo}>🌾 GeoRice — Capas</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={[s.link, { color: 'red' }]}>✕ Cerrar</Text>
            </TouchableOpacity>
          </View>
          <View style={s.body}>
            <View style={s.header}>
              <View>
                <Text style={s.titulo}>Capas</Text>
                <Text style={s.subtitulo}>📍 {parcelaNombre}</Text>
              </View>
              <TouchableOpacity style={s.btnPrimario} onPress={handleNuevaCapa}>
                <Text style={s.btnTexto}>✏️ Dibujar capa</Text>
              </TouchableOpacity>
            </View>

            <Text style={s.infoTexto}>
              ℹ️ Toca "Dibujar capa" para trazar una subdivisión dentro de la parcela en el mapa.
            </Text>

            {loading
              ? <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />
              : capas.length === 0
                ? <View style={s.vacio}><Text style={s.vacioTexto}>No hay capas registradas</Text></View>
                : <FlatList
                    data={capas}
                    keyExtractor={c => String(c.id)}
                    renderItem={({ item }) => (
                      <View style={s.card}>
                        <View style={s.cardBody}>
                          <View style={[s.tipoBadge, { backgroundColor: TIPO_COLOR[item.tipo] ?? '#ccc' }]}>
                            <Text style={s.tipoBadgeTexto}>{item.tipo.charAt(0).toUpperCase()}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={s.cardTitulo}>
                              {item.tipo.charAt(0).toUpperCase() + item.tipo.slice(1)}
                            </Text>
                            <Text style={s.cardSub}>
                              Actualizado: {item.fechaActualizacion?.split('T')[0]}
                            </Text>
                          </View>
                          <TouchableOpacity onPress={() => handleEliminar(item)} style={s.iconBtn}>
                            <Text>🗑️</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  />
            }
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#fff' },
  topBar:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12,
                    borderBottomWidth: 1, borderBottomColor: '#ccc' },
  topBarTitulo:   { fontSize: 17, fontWeight: '600' },
  body:           { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  titulo:         { fontSize: 20, fontWeight: 'bold' },
  subtitulo:      { fontSize: 13, color: '#666', marginTop: 2 },
  link:           { fontSize: 14, color: '#007AFF', fontWeight: '500' },
  btnPrimario:    { backgroundColor: '#007AFF', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16 },
  btnTexto:       { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  card:           { backgroundColor: '#f9f9f9', borderRadius: 10, padding: 14,
                    marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  cardBody:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tipoBadge:      { width: 40, height: 40, borderRadius: 20,
                    justifyContent: 'center', alignItems: 'center' },
  tipoBadgeTexto: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cardTitulo:     { fontSize: 15, fontWeight: '600' },
  cardSub:        { fontSize: 12, color: '#666', marginTop: 2 },
  iconBtn:        { padding: 4 },
  vacio:          { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60 },
  vacioTexto:     { fontSize: 15, color: '#999' },
  infoTexto:      { fontSize: 12, color: '#999', marginBottom: 16, fontStyle: 'italic' },
});

export default CapasModal;