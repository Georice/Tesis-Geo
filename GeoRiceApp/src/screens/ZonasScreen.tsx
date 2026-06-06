import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, FlatList,
  StyleSheet, Alert, ActivityIndicator, ScrollView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Colors } from '../theme/colors';
import { Zona } from '../domain/entities/Zona';
import { Parcela } from '../domain/entities/Parcela';
import { GetZonas } from '../application/usecases/zona/GetZonas';
import { UpdateZona } from '../application/usecases/zona/UpdateZona';
import { DeleteZona } from '../application/usecases/zona/DeleteZona';
import { GetParcelas } from '../application/usecases/parcela/GetParcelas';
//import { UpdateParcela } from '../application/usecases/parcela/UpdateParcela';

type Nav  = NativeStackNavigationProp<RootStackParamList, 'Zonas'>;
type Vista = 'lista' | 'editando' | 'detalle';

const ZonasScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();

  const [zonas, setZonas]                         = useState<Zona[]>([]);
  const [parcelas, setParcelas]                   = useState<Parcela[]>([]);
  const [loading, setLoading]                     = useState(false);
  const [vista, setVista]                         = useState<Vista>('lista');
  const [zonaSeleccionada, setZonaSeleccionada]   = useState<Zona | null>(null);
  const [formNombre, setFormNombre]               = useState('');
  const [formDescripcion, setFormDescripcion]     = useState('');
  const [guardando, setGuardando]                 = useState(false);

  const zonaId     = (z: Zona) => z.id     ?? z.z_id     ?? 0;
  const zonaNombre = (z: Zona) => z.nombre ?? z.z_nombre ?? '';
  const zonaDesc   = (z: Zona) => z.descripcion ?? z.z_descripcion ?? '';
  const pId        = (p: Parcela) => p.p_id;
  const pNombre    = (p: Parcela) => p.p_nombre;
  const pZonaId    = (p: Parcela) => p.p_zona_id;

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [z, p] = await Promise.all([GetZonas(), GetParcelas()]);
      setZonas(z); setParcelas(p);
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const abrirDetalle = (zona: Zona) => {
    setZonaSeleccionada(zona); setVista('detalle');
  };

  const abrirEditar = (zona: Zona) => {
    setZonaSeleccionada(zona);
    setFormNombre(zonaNombre(zona));
    setFormDescripcion(zonaDesc(zona));
    setVista('editando');
  };

  const handleActualizar = async () => {
    if (!zonaSeleccionada) return;
    setGuardando(true);
    try {
      await UpdateZona(zonaId(zonaSeleccionada), {
        nombre: formNombre, descripcion: formDescripcion,
      });
      await cargar(); setVista('lista');
      Alert.alert('✅ Zona actualizada');
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setGuardando(false); }
  };

  const handleEliminar = (zona: Zona) => {
    Alert.alert('Eliminar zona', `¿Eliminar "${zonaNombre(zona)}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try {
          await DeleteZona(zonaId(zona));
          await cargar(); setVista('lista');
          Alert.alert('✅ Zona eliminada');
        } catch (e: any) { Alert.alert('Error', e.message); }
      }},
    ]);
  };

  // const toggleAsignacion = async (parcela: Parcela) => {
  //   if (!zonaSeleccionada) return;
  //   const yaAsignada  = pZonaId(parcela) === zonaId(zonaSeleccionada);
  //   const nuevoZonaId = yaAsignada ? null : zonaId(zonaSeleccionada);
  //   try {
  //     await UpdateParcela(pId(parcela), { zonaId: nuevoZonaId });
  //     await cargar();
  //   } catch (e: any) { Alert.alert('Error', e.message); }
  // };

  // ── LISTA ────────────────────────────────────────────
  const renderLista = () => (
    <>
      <View style={s.header}>
        <Text style={s.titulo}>Zonas</Text>
        <TouchableOpacity style={s.btnPrimario} onPress={() => {
  navigation.navigate('Dashboard', { accion: 'dibujarZona' });
}}>
          <Text style={s.btnText}>✏️ Dibujar zona</Text>
        </TouchableOpacity>
      </View>
      <Text style={s.infoText}>
        ℹ️ Toca "Dibujar zona" para trazar el área en el mapa.
      </Text>
      {loading
        ? <ActivityIndicator size="large" color={Colors.verde} style={{ marginTop: 40 }} />
        : zonas.length === 0
          ? <View style={s.vacio}><Text style={s.vacioText}>No hay zonas creadas</Text></View>
          : <FlatList
              data={zonas}
              keyExtractor={z => String(zonaId(z))}
              renderItem={({ item }) => {
                const count = parcelas.filter(p => pZonaId(p) === zonaId(item)).length;
                return (
                  <TouchableOpacity style={s.card} onPress={() => abrirDetalle(item)}>
                    <View style={s.cardRow}>
                      <View style={s.badge}>
                        <Text style={s.badgeText}>Z</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.cardTitulo}>{zonaNombre(item)}</Text>
                        {zonaDesc(item) ? <Text style={s.cardSub}>{zonaDesc(item)}</Text> : null}
                        <Text style={s.cardMeta}>{count} parcela{count !== 1 ? 's' : ''}</Text>
                      </View>
                      <View>
                        <TouchableOpacity onPress={() => abrirEditar(item)} style={s.iconBtn}>
                          <Text>✏️</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleEliminar(item)} style={s.iconBtn}>
                          <Text>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
      }
    </>
  );

  // ── EDITAR ───────────────────────────────────────────
  const renderEditar = () => (
    <ScrollView keyboardShouldPersistTaps="handled">
      <View style={s.header}>
        <TouchableOpacity onPress={() => setVista('lista')}>
          <Text style={s.link}>← Volver</Text>
        </TouchableOpacity>
        <Text style={s.titulo}>Editar zona</Text>
      </View>
      <Text style={s.label}>Nombre *</Text>
      <TextInput style={s.input} value={formNombre} onChangeText={setFormNombre}
        placeholder="Ej: Zona Norte" placeholderTextColor="#aaa" />
      <Text style={s.label}>Descripción</Text>
      <TextInput style={[s.input, { height: 80, textAlignVertical: 'top' }]}
        value={formDescripcion} onChangeText={setFormDescripcion}
        placeholder="Descripción opcional" placeholderTextColor="#aaa" multiline />
      <TouchableOpacity
        style={[s.btnPrimario, { marginTop: 20 }, guardando && { opacity: 0.5 }]}
        onPress={handleActualizar} disabled={guardando}>
        <Text style={[s.btnText, { textAlign: 'center' }]}>
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // ── DETALLE ──────────────────────────────────────────
  const renderDetalle = () => {
  if (!zonaSeleccionada) return null;
  const idZona = zonaId(zonaSeleccionada);
  const parcelasEnZona = parcelas.filter(p => pZonaId(p) === idZona);

  return (
    <>
      <View style={s.header}>
        <TouchableOpacity onPress={() => setVista('lista')}>
          <Text style={s.link}>← Volver</Text>
        </TouchableOpacity>
        <Text style={s.titulo}>{zonaNombre(zonaSeleccionada)}</Text>
        <TouchableOpacity onPress={() => handleEliminar(zonaSeleccionada)}>
          <Text style={[s.link, { color: Colors.rojo }]}>Eliminar</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[s.btnPrimario, { marginBottom: 12 }]}
        onPress={() => navigation.navigate('Dashboard', { accion: 'editarZona', zona: zonaSeleccionada })}>
        <Text style={[s.btnText, { textAlign: 'center' }]}>🗺️ Editar geometría en el mapa</Text>
      </TouchableOpacity>

      {zonaDesc(zonaSeleccionada)
        ? <Text style={s.desc}>{zonaDesc(zonaSeleccionada)}</Text>
        : null}

      <Text style={s.secTitulo}>
        Parcelas en esta zona ({parcelasEnZona.length})
      </Text>

      {parcelasEnZona.length === 0
        ? <View style={s.vacio}>
            <Text style={s.vacioText}>No hay parcelas en esta zona</Text>
          </View>
        : <FlatList
            data={parcelasEnZona}
            keyExtractor={p => String(pId(p))}
            renderItem={({ item }) => (
              <View style={[s.parcelaRow, s.parcelaOn]}>
                <View style={{ flex: 1 }}>
                  <Text style={s.parcelaNombre}>{pNombre(item)}</Text>
                  <Text style={s.parcelaMeta}>
                    {item.p_propietario} · {Number(item.p_area_ha ?? 0).toFixed(2)} ha
                  </Text>
                </View>
                <View style={[s.check, s.checkOn]}>
                  <Text style={s.checkMark}>✓</Text>
                </View>
              </View>
            )}
          />
      }
    </>
  );
};

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={s.container}>
        {vista === 'lista'    && renderLista()}
        {vista === 'editando' && renderEditar()}
        {vista === 'detalle'  && renderDetalle()}
      </View>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: Colors.grisFondo, padding: 16 },
  header:        { flexDirection: 'row', justifyContent: 'space-between',
                   alignItems: 'center', marginBottom: 8 },
  titulo:        { fontSize: 20, fontWeight: '600', color: '#1a2b16' },
  link:          { fontSize: 14, color: Colors.verde, fontWeight: '500' },
  infoText:      { fontSize: 12, color: Colors.grisTexto, marginBottom: 12, fontStyle: 'italic' },
  btnPrimario:   { backgroundColor: Colors.verde, borderRadius: 10,
                   paddingVertical: 12, paddingHorizontal: 16 },
  btnText:       { color: '#fff', fontWeight: '600', fontSize: 13 },
  card:          { backgroundColor: Colors.blanco, borderRadius: 12, padding: 14,
                   marginBottom: 10, borderWidth: 0.5, borderColor: Colors.grisBorde },
  cardRow:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  badge:         { width: 42, height: 42, borderRadius: 21,
                   backgroundColor: Colors.verdeClaro, justifyContent: 'center', alignItems: 'center' },
  badgeText:     { fontSize: 18, color: Colors.verde, fontWeight: '700' },
  cardTitulo:    { fontSize: 15, fontWeight: '600', color: '#1a2b16' },
  cardSub:       { fontSize: 13, color: Colors.grisTexto, marginTop: 2 },
  cardMeta:      { fontSize: 12, color: Colors.verde, marginTop: 4 },
  iconBtn:       { padding: 4, marginBottom: 2 },
  vacio:         { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60 },
  vacioText:     { fontSize: 15, color: '#999' },
  label:         { fontSize: 13, fontWeight: '500', color: '#444', marginBottom: 4, marginTop: 12 },
  input:         { borderWidth: 0.5, borderColor: Colors.grisBorde, borderRadius: 8,
                   paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8, fontSize: 15,
                   backgroundColor: Colors.blanco },
  desc:          { fontSize: 14, color: Colors.grisTexto, marginBottom: 16 },
  secTitulo:     { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 12 },
  parcelaRow:    { flexDirection: 'row', alignItems: 'center', padding: 12,
                   borderRadius: 10, marginBottom: 8, borderWidth: 0.5,
                   borderColor: Colors.grisBorde, backgroundColor: Colors.blanco },
  parcelaOn:     { borderColor: Colors.verde, backgroundColor: Colors.verdeClaro },
  parcelaOff:    { opacity: 0.5 },
  parcelaNombre: { fontSize: 14, fontWeight: '600', color: '#1a2b16' },
  parcelaMeta:   { fontSize: 12, color: Colors.grisTexto, marginTop: 2 },
  otraZona:      { fontSize: 11, color: '#999', marginTop: 2, fontStyle: 'italic' },
  check:         { width: 24, height: 24, borderRadius: 6, borderWidth: 2,
                   borderColor: Colors.grisBorde, justifyContent: 'center', alignItems: 'center' },
  checkOn:       { backgroundColor: Colors.verde, borderColor: Colors.verde },
  checkMark:     { color: '#fff', fontSize: 14, fontWeight: '700' },
});

export default ZonasScreen;