import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Colors } from '../theme/colors';
import { Capa } from '../domain/entities/Capa';
import { GetCapas } from '../application/usecases/capa/GetCapas';
import { DeleteCapa } from '../application/usecases/capa/DeleteCapa';

type Nav   = NativeStackNavigationProp<RootStackParamList, 'Capas'>;
type Route = RouteProp<RootStackParamList, 'Capas'>;

const TIPO_COLOR: Record<string, string> = {
  activo:   Colors.verde,
  descanso: Colors.dorado,
  lindero:  '#3b82f6',
};

const CapasScreen: React.FC = () => {
  const navigation    = useNavigation<Nav>();
  const { params }    = useRoute<Route>();
  const parcela       = params.parcela;
  const parcelaId     = parcela?.p_id ?? parcela?.id;
  const parcelaNombre = parcela?.p_nombre ?? parcela?.nombre ?? '';

  const [capas, setCapas]     = useState<Capa[]>([]);
  const [loading, setLoading] = useState(false);

  const cargar = useCallback(async () => {
    if (!parcelaId) return;
    setLoading(true);
    try { setCapas(await GetCapas(parcelaId)); }
    catch (e: any) { Alert.alert('Error', e.message); }
    finally { setLoading(false); }
  }, [parcelaId]);

  useEffect(() => {
    navigation.setOptions({ title: `Capas · ${parcelaNombre}` });
    cargar();
  }, [cargar, navigation, parcelaNombre]);

  const handleEliminar = (capa: Capa) => {
    Alert.alert('Eliminar capa', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try { await DeleteCapa(capa.id); await cargar(); }
        catch (e: any) { Alert.alert('Error', e.message); }
      }},
    ]);
  };

  return (
    <View style={s.container}>
      <View style={s.infoCard}>
        <Text style={s.infoText}>
          🌿 NDVI mide la salud del cultivo. Valores cercanos a 1.0 indican vegetación muy saludable.
        </Text>
      </View>

      <View style={s.header}>
        <Text style={s.titulo}>Capas</Text>
        <TouchableOpacity style={s.btnPrimario} onPress={() => {
          navigation.navigate('Dashboard', {
            accion: 'dibujarCapa',
            parcela: {
              ...parcela,
              p_id: parcela?.p_id ?? parcela?.id,
              id:   parcela?.p_id ?? parcela?.id,
            },
            ts: Date.now(),
          });
        }}>
          <Text style={s.btnText}>✏️ Dibujar capa</Text>
        </TouchableOpacity>
      </View>

      {loading
        ? <ActivityIndicator size="large" color={Colors.verde} style={{ marginTop: 40 }} />
        : capas.length === 0
          ? <View style={s.vacio}><Text style={s.vacioText}>No hay capas registradas</Text></View>
          : <FlatList
              data={capas}
              keyExtractor={c => String(c.id)}
              renderItem={({ item }) => (
                <View style={s.card}>
                  <View style={s.cardRow}>
                    <View style={[s.tipoBadge, { backgroundColor: TIPO_COLOR[item.tipo] ?? Colors.grisBorde }]}>
                      <Text style={s.tipoBadgeText}>
                        {item.tipo.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.cardTitulo}>
                        {item.tipo.charAt(0).toUpperCase() + item.tipo.slice(1)}
                      </Text>
                      {item.ndviEstimado != null && (
                        <>
                          <Text style={s.ndviLabel}>NDVI: {item.ndviEstimado}</Text>
                          <View style={s.ndviBarWrap}>
                            <View style={[s.ndviBarFill, { width: `${Number(item.ndviEstimado) * 100}%` }]} />
                          </View>
                        </>
                      )}
                      <Text style={s.cardSub}>
                        Actualizado: {item.fechaActualizacion?.split('T')[0]}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row' }}>
                      <TouchableOpacity
                        onPress={() => navigation.navigate('Dashboard', {
                          accion: 'editarCapa',
                          parcela: {
                            ...parcela,
                            p_id: parcela?.p_id ?? parcela?.id,
                            id:   parcela?.p_id ?? parcela?.id,
                          },
                          capa: item,
                          ts: Date.now(),
                        })}
                        style={s.iconBtn}>
                        <Text>✏️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleEliminar(item)} style={s.iconBtn}>
                        <Text>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            />
      }
    </View>
  );
};

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.grisFondo, padding: 16 },
  header:       { flexDirection: 'row', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: 12 },
  titulo:       { fontSize: 20, fontWeight: '600', color: '#1a2b16' },
  btnPrimario:  { backgroundColor: Colors.verde, borderRadius: 10,
                  paddingVertical: 10, paddingHorizontal: 16 },
  btnText:      { color: '#fff', fontWeight: '600', fontSize: 13 },
  infoCard:     { backgroundColor: Colors.verdeClaro, borderRadius: 12, padding: 12,
                  borderWidth: 0.5, borderColor: Colors.verdeBorder, marginBottom: 12 },
  infoText:     { fontSize: 12, color: Colors.verde },
  card:         { backgroundColor: Colors.blanco, borderRadius: 12, padding: 14,
                  marginBottom: 10, borderWidth: 0.5, borderColor: Colors.grisBorde },
  cardRow:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tipoBadge:    { width: 42, height: 42, borderRadius: 21,
                  justifyContent: 'center', alignItems: 'center' },
  tipoBadgeText:{ color: '#fff', fontWeight: '700', fontSize: 18 },
  cardTitulo:   { fontSize: 15, fontWeight: '600', color: '#1a2b16' },
  cardSub:      { fontSize: 12, color: Colors.grisTexto, marginTop: 4 },
  ndviLabel:    { fontSize: 12, color: Colors.grisTexto, marginTop: 4 },
  ndviBarWrap:  { height: 7, backgroundColor: Colors.grisBorde, borderRadius: 20,
                  overflow: 'hidden', marginTop: 4, marginBottom: 2 },
  ndviBarFill:  { height: '100%', backgroundColor: Colors.verde, borderRadius: 20 },
  iconBtn:      { padding: 6 },
  vacio:        { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60 },
  vacioText:    { fontSize: 15, color: '#999' },
});

export default CapasScreen;