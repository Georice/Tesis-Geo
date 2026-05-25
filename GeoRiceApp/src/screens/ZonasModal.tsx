import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, FlatList,
  StyleSheet, Alert, ActivityIndicator, Modal, ScrollView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Zona } from '../domain/entities/Zona';
import { Parcela } from '../domain/entities/Parcela';
import { GetZonas } from '../application/usecases/zona/GetZonas';
//import { CreateZona } from '../application/usecases/zona/CreateZona';
import { UpdateZona } from '../application/usecases/zona/UpdateZona';
import { DeleteZona } from '../application/usecases/zona/DeleteZona';
import { GetParcelas } from '../application/usecases/parcela/GetParcelas';
import { UpdateParcela } from '../application/usecases/parcela/UpdateParcela';

interface Props {
  visible: boolean;
  onClose: () => void;
  onZonasChanged: () => void;
  onNuevaZona: () => void;
  onEditarZona: (zona: Zona) => void;   // ✅ CORREGIDO: nombre correcto y tipado
}

type Vista = 'lista' | 'editando' | 'detalle';

const ZonasModal: React.FC<Props> = ({ 
  visible, onClose, onZonasChanged, onNuevaZona, onEditarZona 
}) => {
  const [zonas, setZonas]                       = useState<Zona[]>([]);
  const [parcelas, setParcelas]                 = useState<Parcela[]>([]);
  const [loading, setLoading]                   = useState(false);
  const [vista, setVista]                       = useState<Vista>('lista');
  const [zonaSeleccionada, setZonaSeleccionada] = useState<Zona | null>(null);
  const [formNombre, setFormNombre]             = useState('');
  const [formDescripcion, setFormDescripcion]   = useState('');
  const [guardando, setGuardando]               = useState(false);

  const zonaId     = (z: Zona) => z.id     ?? z.z_id     ?? 0;
  const zonaNombre = (z: Zona) => z.nombre ?? z.z_nombre ?? '';
  const zonaDesc   = (z: Zona) => z.descripcion ?? z.z_descripcion ?? '';
  const pId        = (p: Parcela) => p.p_id;
  const pNombre    = (p: Parcela) => p.p_nombre;
  const pZonaId    = (p: Parcela) => p.p_zona_id;

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const [z, p] = await Promise.all([GetZonas(), GetParcelas()]);
      setZonas(z);
      setParcelas(p);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (visible) {
      cargarDatos();
      setVista('lista');
      setZonaSeleccionada(null);
    }
  }, [visible, cargarDatos]);

  const abrirDetalle = (zona: Zona) => {
    setZonaSeleccionada(zona);
    setVista('detalle');
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
      await UpdateZona(zonaId(zonaSeleccionada), { nombre: formNombre, descripcion: formDescripcion });
      await cargarDatos(); onZonasChanged(); setVista('lista');
      Alert.alert('Zona actualizada');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally { setGuardando(false); }
  };

  const handleEliminar = (zona: Zona) => {
    Alert.alert('Eliminar zona', `¿Eliminar "${zonaNombre(zona)}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try {
          await DeleteZona(zonaId(zona));
          await cargarDatos(); onZonasChanged(); setVista('lista');
          Alert.alert('Zona eliminada');
        } catch (e: any) { Alert.alert('Error', e.message); }
      }},
    ]);
  };

  const toggleAsignacion = async (parcela: Parcela) => {
    if (!zonaSeleccionada) return;
    const yaAsignada  = pZonaId(parcela) === zonaId(zonaSeleccionada);
    const nuevoZonaId = yaAsignada ? null : zonaId(zonaSeleccionada);
    try {
      await UpdateParcela(pId(parcela), { zonaId: nuevoZonaId });
      await cargarDatos(); onZonasChanged();
    } catch (e: any) { Alert.alert('Error al asignar', e.message); }
  };

  // ── LISTA ─────────────────────────────────────────────────────────────────
  const renderLista = () => (
    <>
      <View style={s.header}>
        <Text style={s.titulo}>Zonas</Text>
        <TouchableOpacity style={s.btnPrimario}
          onPress={() => { onClose(); onNuevaZona(); }}>
          <Text style={s.btnTexto}>✏️ Dibujar zona</Text>
        </TouchableOpacity>
      </View>
      <Text style={s.infoTexto}>
        ℹ️ Toca "Dibujar zona" para trazar el área en el mapa. Las parcelas dentro se asignan automáticamente.
      </Text>
      {loading
        ? <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />
        : zonas.length === 0
          ? <View style={s.vacio}><Text style={s.vacioTexto}>No hay zonas creadas</Text></View>
          : <FlatList
              data={zonas}
              keyExtractor={z => String(zonaId(z))}
              renderItem={({ item }) => {
                const count = parcelas.filter(p => pZonaId(p) === zonaId(item)).length;
                return (
                  <TouchableOpacity style={s.card} onPress={() => abrirDetalle(item)}>
                    <View style={s.cardBody}>
                      <View style={s.badge}><Text style={s.badgeText}>Z</Text></View>
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

  // ── EDITAR ────────────────────────────────────────────────────────────────
  const renderEditar = () => (
    <ScrollView keyboardShouldPersistTaps="handled">
      <View style={s.header}>
        <TouchableOpacity onPress={() => setVista('lista')}>
          <Text style={s.link}>← Volver</Text>
        </TouchableOpacity>
        <Text style={s.titulo}>Editar zona</Text>
      </View>
      <Text style={s.label}>Nombre *</Text>
      <TextInput
        style={s.input} value={formNombre} onChangeText={setFormNombre}
        placeholder="Ej: Zona Norte" placeholderTextColor="#aaa"
      />
      <Text style={s.label}>Descripción</Text>
      <TextInput
        style={[s.input, { height: 80, textAlignVertical: 'top' }]}
        value={formDescripcion} onChangeText={setFormDescripcion}
        placeholder="Descripción opcional" placeholderTextColor="#aaa" multiline
      />
      <TouchableOpacity
        style={[s.btnPrimario, { marginTop: 20, alignSelf: 'stretch' }, guardando && { opacity: 0.5 }]}
        onPress={handleActualizar} disabled={guardando}>
        <Text style={[s.btnTexto, { textAlign: 'center' }]}>
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // ── DETALLE ───────────────────────────────────────────────────────────────
  const renderDetalle = () => {
    if (!zonaSeleccionada) return null;
    const idZona = zonaId(zonaSeleccionada);
    return (
      <>
        <View style={s.header}>
          <TouchableOpacity onPress={() => setVista('lista')}>
            <Text style={s.link}>← Volver</Text>
          </TouchableOpacity>
          <Text style={s.titulo}>{zonaNombre(zonaSeleccionada)}</Text>
          <TouchableOpacity onPress={() => handleEliminar(zonaSeleccionada)}>
            <Text style={[s.link, { color: 'red' }]}>Eliminar</Text>
          </TouchableOpacity>
        </View>

        {/* ✅ NUEVO BOTÓN: Editar geometría en el mapa */}
        <TouchableOpacity
          style={[s.btnPrimario, { marginVertical: 12, alignSelf: 'stretch' }]}
          onPress={() => {
            onClose();                    // cierra el modal
            onEditarZona(zonaSeleccionada); // abre edición geométrica en App
          }}>
          <Text style={[s.btnTexto, { textAlign: 'center' }]}>🗺️ Editar geometría en el mapa</Text>
        </TouchableOpacity>

        {zonaDesc(zonaSeleccionada)
          ? <Text style={s.desc}>{zonaDesc(zonaSeleccionada)}</Text>
          : null}
        <Text style={s.secTitulo}>Parcelas en esta zona</Text>
        <FlatList
          data={parcelas}
          keyExtractor={p => String(pId(p))}
          renderItem={({ item }) => {
            const asignada = pZonaId(item) === idZona;
            const otraZona = pZonaId(item) !== null && pZonaId(item) !== idZona;
            return (
              <TouchableOpacity
                style={[s.parcelaRow, asignada && s.parcelaOn, otraZona && s.parcelaOff]}
                onPress={() => !otraZona && toggleAsignacion(item)}
                disabled={otraZona}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.parcelaNombre, otraZona && { color: '#bbb' }]}>{pNombre(item)}</Text>
                  <Text style={s.parcelaMeta}>
                    {item.p_propietario} · {Number(item.p_area_ha).toFixed(2)} ha
                  </Text>
                  {otraZona && <Text style={s.otraZona}>Asignada a otra zona</Text>}
                </View>
                {!otraZona && (
                  <View style={[s.check, asignada && s.checkOn]}>
                    {asignada && <Text style={s.checkMark}>✓</Text>}
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={s.container}>
          <View style={s.topBar}>
            <Text style={s.topBarTitulo}>🌾 GeoRice — Zonas</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={[s.link, { color: 'red' }]}>✕ Cerrar</Text>
            </TouchableOpacity>
          </View>
          <View style={s.body}>
            {vista === 'lista'    && renderLista()}
            {vista === 'editando' && renderEditar()}
            {vista === 'detalle'  && renderDetalle()}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#fff' },
  topBar:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12,
                  borderBottomWidth: 1, borderBottomColor: '#ccc' },
  topBarTitulo: { fontSize: 17, fontWeight: '600' },
  body:         { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  titulo:       { fontSize: 20, fontWeight: 'bold' },
  link:         { fontSize: 14, color: '#007AFF', fontWeight: '500' },
  btnPrimario:  { backgroundColor: '#007AFF', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16 },
  btnTexto:     { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  card:         { backgroundColor: '#f9f9f9', borderRadius: 10, padding: 14,
                  marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  cardBody:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  badge:        { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e0f0ff',
                  justifyContent: 'center', alignItems: 'center' },
  badgeText:    { fontSize: 18, color: '#007AFF', fontWeight: '700' },
  cardTitulo:   { fontSize: 15, fontWeight: '600' },
  cardSub:      { fontSize: 13, color: '#666', marginTop: 2 },
  cardMeta:     { fontSize: 12, color: '#007AFF', marginTop: 4 },
  iconBtn:      { padding: 4, marginBottom: 2 },
  vacio:        { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60 },
  vacioTexto:   { fontSize: 15, color: '#999' },
  infoTexto:    { fontSize: 12, color: '#999', marginBottom: 12, fontStyle: 'italic' },
  label:        { fontSize: 13, fontWeight: '500', color: '#444', marginBottom: 4, marginTop: 12 },
  input:        { borderWidth: 1, borderColor: '#ccc', borderRadius: 5,
                  paddingHorizontal: 10, paddingVertical: 8, marginBottom: 10, fontSize: 16 },
  desc:         { fontSize: 14, color: '#666', marginBottom: 16 },
  secTitulo:    { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 12 },
  parcelaRow:   { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10,
                  marginBottom: 8, borderWidth: 1, borderColor: '#eee', backgroundColor: '#fafafa' },
  parcelaOn:    { borderColor: '#34C759', backgroundColor: '#f0fff4' },
  parcelaOff:   { opacity: 0.5 },
  parcelaNombre:{ fontSize: 14, fontWeight: '600' },
  parcelaMeta:  { fontSize: 12, color: '#666', marginTop: 2 },
  otraZona:     { fontSize: 11, color: '#999', marginTop: 2, fontStyle: 'italic' },
  check:        { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#ccc',
                  justifyContent: 'center', alignItems: 'center' },
  checkOn:      { backgroundColor: '#34C759', borderColor: '#34C759' },
  checkMark:    { color: '#fff', fontSize: 14, fontWeight: '700' },
});

export default ZonasModal;