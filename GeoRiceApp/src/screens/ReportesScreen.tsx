import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal,
  ActivityIndicator, RefreshControl, Alert, Platform,
} from 'react-native';
import RNBlobUtil from 'react-native-blob-util';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '../theme/colors';
import Icon from '../components/Icon';
import IconLabel from '../components/IconLabel';
import { useAuth } from '../context/AuthContext';
import { GetResumenReporte } from '../application/usecases/reportes/GetResumenReporte';
import { GetUsers } from '../application/usecases/usuarios/GetUsers';
import { ReporteResumen } from '../domain/entities/Reporte';
import { Usuario } from '../domain/entities/Usuario';
import { BASE_URL, STORAGE_KEYS } from '../infrastructure/repositories/ApiClient';

// OJO: nunca usar toISOString() para el filtro de fechas (solo interesa el
// día, no la hora) — convierte a UTC y en Ecuador (UTC-5) eso corre el día
// seleccionado hacia adelante o hacia atrás según la hora local, haciendo
// que el rango enviado al backend no coincida con el que se ve en pantalla.
const fmt = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const fmtDisplay = (iso: string) => new Date(iso).toLocaleDateString('es-EC');

const TIPO_LABEL: Record<string, string> = {
  preparacion_suelo:   'Preparación de suelo',
  inundacion:          'Inundación',
  siembra_boleo:       'Siembra al boleo',
  siembra_trasplante:  'Trasplante',
  riego:               'Riego',
  fertilizacion:       'Fertilización',
  fumigacion:          'Fumigación',
  deshierba:           'Deshierba',
  cosecha:             'Cosecha',
  rozar_quemar:        'Rozar y quemar',
  soca_riego:          'Riego (soca)',
  soca_fertilizacion:  'Fertilización (soca)',
  soca_fumigacion:     'Fumigación (soca)',
  cosecha_soca:        'Cosecha (soca)',
  observacion:         'Observación',
};
const tipoLabel = (t: string) => TIPO_LABEL[t] ?? t.replace(/_/g, ' ');

const ESTADO_LABEL: Record<string, string> = {
  pendiente:   'Pendiente',
  en_proceso:  'En proceso',
  completada:  'Completada',
};
const ESTADO_COLOR: Record<string, string> = {
  pendiente:   Colors.dorado,
  en_proceso:  '#2563eb',
  completada:  Colors.verde,
};

const money = (n: number) => `$${n.toFixed(2)}`;

const ReportesScreen: React.FC = () => {
  const { user } = useAuth();
  const esAdmin = user?.rol === 'administrador';

  const hace30 = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - 30); return d; }, []);

  const [fechaInicio, setFechaInicio] = useState<Date>(hace30);
  const [fechaFin,    setFechaFin]    = useState<Date>(new Date());
  const [showPickerInicio, setShowPickerInicio] = useState(false);
  const [showPickerFin,    setShowPickerFin]    = useState(false);

  const [socios,  setSocios]  = useState<Usuario[]>([]);
  const [socioId, setSocioId] = useState<string | undefined>(undefined); // undefined = todos
  const [modalSocio, setModalSocio] = useState(false);

  const [resumen,    setResumen]    = useState<ReporteResumen | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exportando, setExportando] = useState<'pdf' | 'excel' | null>(null);

  useEffect(() => {
    if (!esAdmin) return;
    GetUsers()
      .then(list => setSocios(list.filter(u => u.rol === 'socio')))
      .catch(() => {});
  }, [esAdmin]);

  const cargar = useCallback(async () => {
    try {
      const data = await GetResumenReporte({
        fechaInicio: fmt(fechaInicio),
        fechaFin:    fmt(fechaFin),
        usuarioId:   esAdmin ? socioId : undefined,
      });
      setResumen(data);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo generar el reporte');
    }
  }, [fechaInicio, fechaFin, socioId, esAdmin]);

  useEffect(() => {
    setLoading(true);
    cargar().finally(() => setLoading(false));
  }, [cargar]);

  const onRefresh = async () => {
    setRefreshing(true);
    await cargar();
    setRefreshing(false);
  };

  const descargar = async (tipo: 'pdf' | 'excel') => {
    try {
      setExportando(tipo);
      const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (!token) { Alert.alert('Error', 'Sesión no válida'); return; }

      const params = new URLSearchParams({
        fechaInicio: fmt(fechaInicio),
        fechaFin:    fmt(fechaFin),
        token,
        'ngrok-skip-browser-warning': 'true',
      });
      if (esAdmin && socioId) params.set('usuarioId', socioId);

      const url = `${BASE_URL}/reportes/export/${tipo}?${params.toString()}`;
      const ext  = tipo === 'pdf' ? 'pdf' : 'xlsx';
      const mime = tipo === 'pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const dest = `${RNBlobUtil.fs.dirs.CacheDir}/reporte_${fmt(fechaInicio)}_${fmt(fechaFin)}.${ext}`;

      // No se puede usar Linking.openURL aquí: al abrir la URL en el
      // navegador del sistema, ngrok (plan free) detecta el User-Agent de
      // navegador y devuelve su página de aviso HTML en vez de reenviar la
      // petición al backend — el header ngrok-skip-browser-warning solo
      // sirve si viaja en la petición saliente, algo que Linking.openURL no
      // permite. Por eso se descarga con fetch (sí acepta headers) y se
      // abre el archivo ya guardado con el visor nativo del dispositivo.
      const res = await RNBlobUtil.config({ path: dest }).fetch('GET', url, {
        Authorization: `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true',
      });

      const status = res.info().status;
      if (status !== 200) throw new Error(`No se pudo descargar el reporte (HTTP ${status})`);

      if (Platform.OS === 'android') {
        await RNBlobUtil.android.actionViewIntent(dest, mime);
      } else {
        await RNBlobUtil.ios.previewDocument(dest);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo descargar el reporte');
    } finally {
      setExportando(null);
    }
  };

  const socioNombreSeleccionado = socioId
    ? socios.find(s => s.id === socioId)
    : null;

  return (
    <ScrollView
      style={s.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.verde]} />}>

      {/* Filtros */}
      <View style={s.card}>
        <Text style={s.seccionTitulo}>Filtros</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>Desde</Text>
            <TouchableOpacity style={s.dateBtn} onPress={() => setShowPickerInicio(true)}>
              <Text style={s.dateBtnText}>{fmt(fechaInicio)}</Text>
              <Icon name="calendar-month" size={16} color={Colors.grisTexto} />
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>Hasta</Text>
            <TouchableOpacity style={s.dateBtn} onPress={() => setShowPickerFin(true)}>
              <Text style={s.dateBtnText}>{fmt(fechaFin)}</Text>
              <Icon name="calendar-month" size={16} color={Colors.grisTexto} />
            </TouchableOpacity>
          </View>
        </View>
        {showPickerInicio && (
          <DateTimePicker value={fechaInicio} mode="date" display="default"
            onChange={(_, d) => { setShowPickerInicio(false); if (d) setFechaInicio(d); }} />
        )}
        {showPickerFin && (
          <DateTimePicker value={fechaFin} mode="date" display="default"
            onChange={(_, d) => { setShowPickerFin(false); if (d) setFechaFin(d); }} />
        )}

        {esAdmin && (
          <>
            <Text style={s.label}>Socio</Text>
            <TouchableOpacity style={s.dropdown} onPress={() => setModalSocio(true)}>
              <Text style={s.dropdownText}>
                {socioNombreSeleccionado
                  ? `${socioNombreSeleccionado.nombre} ${socioNombreSeleccionado.apellido}`
                  : 'Todos los socios'}
              </Text>
              <Text style={s.dropdownArrow}>V</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.verde} style={{ marginTop: 40 }} />
      ) : !resumen ? (
        <View style={s.vacio}><Text style={s.vacioText}>No se pudo cargar el reporte</Text></View>
      ) : (
        <>
          {/* Tarjetas resumen */}
          <View style={s.gridResumen}>
            <View style={[s.tarjeta, { backgroundColor: Colors.verdeClaro }]}>
              <Text style={s.tarjetaValor}>{resumen.resumen.totalActividades}</Text>
              <Text style={s.tarjetaLabel}>Actividades</Text>
            </View>
            <View style={[s.tarjeta, { backgroundColor: Colors.doradoClaro }]}>
              <Text style={s.tarjetaValor}>{resumen.resumen.totalCiclos}</Text>
              <Text style={s.tarjetaLabel}>Ciclos</Text>
            </View>
            <View style={[s.tarjeta, { backgroundColor: '#dbeafe' }]}>
              <Text style={s.tarjetaValor}>{money(resumen.resumen.costoTotal)}</Text>
              <Text style={s.tarjetaLabel}>Costo total</Text>
            </View>
            <View style={[s.tarjeta, { backgroundColor: '#ede9fe' }]}>
              <Text style={s.tarjetaValor}>{resumen.resumen.areaTrabajada.toFixed(2)} ha</Text>
              <Text style={s.tarjetaLabel}>Área trabajada</Text>
            </View>
          </View>

          {/* Actividades por estado */}
          <View style={s.card}>
            <Text style={s.seccionTitulo}>Actividades por estado</Text>
            {resumen.actividadesPorEstado.length === 0
              ? <Text style={s.vacioTextSm}>Sin actividades en el rango.</Text>
              : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                  {resumen.actividadesPorEstado.map(e => (
                    <View key={e.estado} style={[s.badge, { backgroundColor: ESTADO_COLOR[e.estado] ?? Colors.grisTexto }]}>
                      <Text style={s.badgeText}>{ESTADO_LABEL[e.estado] ?? e.estado}: {e.cantidad}</Text>
                    </View>
                  ))}
                </View>
              )}
          </View>

          {/* Costo por tipo */}
          <View style={s.card}>
            <Text style={s.seccionTitulo}>Costo por tipo de actividad</Text>
            {resumen.costoPorTipo.length === 0
              ? <Text style={s.vacioTextSm}>Sin actividades en el rango.</Text>
              : resumen.costoPorTipo.map(t => (
                <View key={t.tipo} style={s.filaLista}>
                  <Text style={s.filaListaTexto}>{tipoLabel(t.tipo)} ({t.cantidad})</Text>
                  <Text style={s.filaListaValor}>{money(t.costoTotal)}</Text>
                </View>
              ))}
          </View>

          {/* Ciclos */}
          <View style={s.card}>
            <Text style={s.seccionTitulo}>Ciclos ({resumen.ciclos.length})</Text>
            {resumen.ciclos.length === 0
              ? <Text style={s.vacioTextSm}>Sin ciclos en el rango.</Text>
              : resumen.ciclos.map(c => (
                <View key={c.id} style={s.filaCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.filaTitulo}>{tipoLabel(c.tipo)} — {c.parcelaNombre}</Text>
                    <Text style={s.filaSub}>
                      {fmtDisplay(c.fechaInicio)} a {c.fechaFin ? fmtDisplay(c.fechaFin) : 'en curso'} · {c.estado}
                      {c.areaSembrada != null ? ` · ${Number(c.areaSembrada).toFixed(2)} ha` : ''}
                    </Text>
                  </View>
                  <Text style={s.filaListaValor}>{money(c.costoTotal)}</Text>
                </View>
              ))}
          </View>

          {/* Actividades */}
          <View style={s.card}>
            <Text style={s.seccionTitulo}>Actividades ({resumen.actividades.length})</Text>
            {resumen.actividades.length === 0
              ? <Text style={s.vacioTextSm}>Sin actividades en el rango.</Text>
              : resumen.actividades.map(a => (
                <View key={a.id} style={s.filaCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.filaTitulo}>{tipoLabel(a.tipo)} — {a.parcelaNombre}</Text>
                    <Text style={s.filaSub}>
                      {fmtDisplay(a.fecha)} · {ESTADO_LABEL[a.estado] ?? a.estado}
                      {esAdmin ? ` · ${a.socioNombre}` : ''}
                    </Text>
                  </View>
                  <Text style={s.filaListaValor}>{money(a.costoTotal)}</Text>
                </View>
              ))}
          </View>

          {/* Descargas */}
          <View style={[s.card, { marginBottom: 32 }]}>
            <Text style={s.seccionTitulo}>Descargar reporte</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              <TouchableOpacity
                style={[s.btnDescarga, { backgroundColor: Colors.verde }, exportando && { opacity: 0.6 }]}
                disabled={!!exportando}
                onPress={() => descargar('pdf')}>
                {exportando === 'pdf'
                  ? <ActivityIndicator color="#fff" />
                  : <IconLabel icon="file-pdf-box" label="PDF" textStyle={s.btnDescargaText} color="#fff" />}
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.btnDescarga, { backgroundColor: '#1d6f42' }, exportando && { opacity: 0.6 }]}
                disabled={!!exportando}
                onPress={() => descargar('excel')}>
                {exportando === 'excel'
                  ? <ActivityIndicator color="#fff" />
                  : <IconLabel icon="file-excel-box" label="Excel" textStyle={s.btnDescargaText} color="#fff" />}
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {/* Modal selector de socio */}
      <Modal visible={modalSocio} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitulo}>Seleccionar socio</Text>
              <TouchableOpacity onPress={() => setModalSocio(false)}>
                <Text style={{ color: Colors.rojo, fontSize: 16, fontWeight: '600' }}>X</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              <TouchableOpacity
                style={[s.modalItem, !socioId && s.modalItemOn]}
                onPress={() => { setSocioId(undefined); setModalSocio(false); }}>
                <Text style={[s.modalItemText, !socioId && { color: Colors.verde, fontWeight: '600' }]}>
                  Todos los socios
                </Text>
              </TouchableOpacity>
              {socios.map(soc => (
                <TouchableOpacity key={soc.id}
                  style={[s.modalItem, socioId === soc.id && s.modalItemOn]}
                  onPress={() => { setSocioId(soc.id); setModalSocio(false); }}>
                  <Text style={[s.modalItemText, socioId === soc.id && { color: Colors.verde, fontWeight: '600' }]}>
                    {soc.nombre} {soc.apellido}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.grisFondo, padding: 12 },
  card:        { backgroundColor: Colors.blanco, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 0.5, borderColor: Colors.grisBorde },
  seccionTitulo: { fontSize: 15, fontWeight: '700', color: '#222', marginBottom: 6 },
  label:       { fontSize: 13, fontWeight: '500', color: '#444', marginBottom: 4, marginTop: 10 },

  dateBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.grisFondo, borderWidth: 0.5, borderColor: Colors.grisBorde, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12 },
  dateBtnText: { fontSize: 14, color: '#333' },

  dropdown:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.grisFondo, borderWidth: 0.5, borderColor: Colors.grisBorde, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 14 },
  dropdownText:  { fontSize: 14, color: '#333' },
  dropdownArrow: { fontSize: 12, color: Colors.grisTexto },

  gridResumen: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  tarjeta:     { width: '48%', borderRadius: 12, padding: 14 },
  tarjetaValor:{ fontSize: 20, fontWeight: '800', color: '#1a1a1a' },
  tarjetaLabel:{ fontSize: 12, color: '#555', marginTop: 2 },

  badge:     { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  filaLista:       { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: Colors.grisBorde },
  filaListaTexto:  { fontSize: 13, color: '#333', flex: 1 },
  filaListaValor:  { fontSize: 13, fontWeight: '700', color: Colors.verde },

  filaCard:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: Colors.grisBorde, gap: 8 },
  filaTitulo:{ fontSize: 13, fontWeight: '600', color: '#222' },
  filaSub:   { fontSize: 11, color: Colors.grisTexto, marginTop: 2 },

  vacio:       { padding: 30, alignItems: 'center' },
  vacioText:   { color: Colors.grisTexto, fontSize: 14 },
  vacioTextSm: { color: Colors.grisTexto, fontSize: 12, marginTop: 4 },

  btnDescarga:     { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  btnDescargaText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalBox:     { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '70%', padding: 16 },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalTitulo:  { fontSize: 16, fontWeight: '700', color: '#222' },
  modalItem:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: Colors.grisBorde },
  modalItemOn:  { backgroundColor: Colors.verdeClaro },
  modalItemText:{ fontSize: 14, color: '#333' },
});

export default ReportesScreen;
