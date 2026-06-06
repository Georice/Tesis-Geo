import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Colors } from '../theme/colors';
import { apiFetch } from '../infrastructure/repositories/ApiClient';

type Nav   = NativeStackNavigationProp<RootStackParamList, 'IniciarCiclo'>;
type Route = RouteProp<RootStackParamList, 'IniciarCiclo'>;

type TipoCiclo = 'siembra_boleo' | 'siembra_trasplante' | 'soca' | 'resoca';

interface InfoCiclo {
  label:       string;
  emoji:       string;
  descripcion: string;
  duracion:    string;
  actividades: number;
  color:       string;
}

const CICLOS: Record<TipoCiclo, InfoCiclo> = {
  siembra_boleo: {
    label:       'Siembra Boleo',
    emoji:       '🌱',
    descripcion: 'Siembra directa al voleo sobre el terreno inundado',
    duracion:    '~110 días',
    actividades: 11,
    color:       Colors.verde,
  },
  siembra_trasplante: {
    label:       'Siembra Trasplante',
    emoji:       '🌿',
    descripcion: 'Trasplante de plántulas desde semillero al campo',
    duracion:    '~120 días',
    actividades: 11,
    color:       Colors.verdeMedio,
  },
  soca: {
    label:       'Soca',
    emoji:       '♻️',
    descripcion: 'Segundo ciclo aprovechando el rebrote del arroz',
    duracion:    '~75 días',
    actividades: 7,
    color:       Colors.dorado,
  },
  resoca: {
    label:       'Resoca',
    emoji:       '🔄',
    descripcion: 'Tercer ciclo de rebrote después de la soca',
    duracion:    '~65 días',
    actividades: 5,
    color:       Colors.tierra,
  },
};

const IniciarCicloScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const parcela    = params.parcela;
  const parcelaId  = parcela?.p_id ?? parcela?.id;
  const parcelaNombre = parcela?.p_nombre ?? parcela?.nombre ?? '';

  const [tipoCiclo, setTipoCiclo]         = useState<TipoCiclo | null>(null);
  const [fechaInicio, setFechaInicio]     = useState(new Date().toISOString().split('T')[0]);
  const [variedad, setVariedad]           = useState('');
  const [area, setArea]                   = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [guardando, setGuardando]         = useState(false);
  const [cicloActivo, setCicloActivo]     = useState<any>(null);
  const [loadingCiclo, setLoadingCiclo]   = useState(true);

  const cargarCicloActivo = useCallback(async () => {
    try {
      setLoadingCiclo(true);
      const res  = await apiFetch(`/parcelas/${parcelaId}/ciclos`);
      const data = await res.json();
      const activo = data.find((c: any) => c.estado === 'activo');
      setCicloActivo(activo ?? null);
} catch (e: any) {
  console.log('ERROR cargarCiclo:', e.message);
  setCicloActivo(null);
} finally {
  setLoadingCiclo(false);
}
  }, [parcelaId]);

  useEffect(() => {
    navigation.setOptions({ title: `Ciclo · ${parcelaNombre}` });
    cargarCicloActivo();
  }, [cargarCicloActivo, navigation, parcelaNombre]);

 const handleIniciar = async () => {
  if (!tipoCiclo)   { Alert.alert('Error', 'Selecciona el tipo de ciclo'); return; }
  if (!fechaInicio) { Alert.alert('Error', 'Ingresa la fecha de inicio');  return; }

  console.log('=== INICIANDO CICLO ===');
  console.log('parcelaId:', parcelaId);
  console.log('tipoCiclo:', tipoCiclo);

  setGuardando(true);
  try {
    const res = await apiFetch(`/parcelas/${parcelaId}/ciclos`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo:            tipoCiclo,
        fechaInicio:     new Date(fechaInicio).toISOString(),
        variedadSemilla: variedad.trim() || undefined,
        areaSembrada:    area ? Number(area) : undefined,
        observaciones:   observaciones.trim() || undefined,
      }),
    });

    console.log('STATUS:', res.status);
    const data = await res.json();
    console.log('RESPUESTA:', JSON.stringify(data).substring(0, 200));

    if (!res.ok) {
      Alert.alert('Error', data.error ?? 'No se pudo iniciar el ciclo');
      return;
    }

    const info = CICLOS[tipoCiclo];
    Alert.alert(
      '✅ Ciclo iniciado',
      `${info.label} iniciado con ${data.actividades?.length ?? 0} actividades generadas automáticamente.`,
      [{ text: 'Ver actividades', onPress: () => navigation.navigate('Actividades', { parcela }) }],
    );
    cargarCicloActivo(); // ← recargar para mostrar ciclo activo
  } catch (e: any) {
    console.log('ERROR CICLO:', e.message);
    Alert.alert('Error de conexión', e.message ?? 'No se pudo conectar al servidor');
  } finally {
    setGuardando(false);
  }
};
  const handleFinalizar = async () => {
    if (!cicloActivo) return;
    Alert.alert('Finalizar ciclo', '¿Estás seguro de finalizar el ciclo activo?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Finalizar', style: 'destructive', onPress: async () => {
        try {
          const res = await apiFetch(`/parcelas/${parcelaId}/ciclos/${cicloActivo.id}/finalizar`, {
            method: 'PUT',
          });
          if (res.ok) {
            Alert.alert('✅ Ciclo finalizado');
            cargarCicloActivo();
          }
        } catch { Alert.alert('Error', 'No se pudo finalizar el ciclo'); }
      }},
    ]);
  };

  if (loadingCiclo) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.verde} />
      </View>
    );
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled">

      {/* Ciclo activo */}
      {cicloActivo && (
        <View style={s.cicloActivoCard}>
          <View style={s.cicloActivoHeader}>
            <Text style={s.cicloActivoEmoji}>
              {CICLOS[cicloActivo.tipo as TipoCiclo]?.emoji ?? '🌾'}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={s.cicloActivoTitulo}>Ciclo activo</Text>
              <Text style={s.cicloActivoTipo}>
                {CICLOS[cicloActivo.tipo as TipoCiclo]?.label ?? cicloActivo.tipo}
              </Text>
              <Text style={s.cicloActivoFecha}>
                Inicio: {cicloActivo.fechaInicio?.split('T')[0]}
              </Text>
            </View>
            <View style={s.estadoBadge}>
              <Text style={s.estadoBadgeText}>ACTIVO</Text>
            </View>
          </View>
          <TouchableOpacity style={s.btnFinalizar} onPress={handleFinalizar}>
            <Text style={s.btnFinalizarText}>🏁 Finalizar ciclo</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Formulario nuevo ciclo */}
      {!cicloActivo && (
        <>
          <View style={s.infoCard}>
            <Text style={s.infoText}>
              🌾 Al iniciar un ciclo se generan automáticamente todas las actividades
              del calendario agrícola según el tipo de siembra.
            </Text>
          </View>

          {/* Selección de tipo */}
          <Text style={s.secTitulo}>Tipo de ciclo *</Text>
          <View style={s.ciclosGrid}>
            {(Object.entries(CICLOS) as [TipoCiclo, InfoCiclo][]).map(([key, info]) => (
              <TouchableOpacity key={key}
                style={[s.cicloCard, tipoCiclo === key && { borderColor: info.color, borderWidth: 2 }]}
                onPress={() => setTipoCiclo(key)}>
                <Text style={s.cicloEmoji}>{info.emoji}</Text>
                <Text style={s.cicloLabel}>{info.label}</Text>
                <Text style={s.cicloDesc}>{info.descripcion}</Text>
                <View style={s.cicloStats}>
                  <Text style={[s.cicloStat, { color: info.color }]}>⏱ {info.duracion}</Text>
                  <Text style={[s.cicloStat, { color: info.color }]}>📋 {info.actividades} act.</Text>
                </View>
                {tipoCiclo === key && (
                  <View style={[s.cicloCheck, { backgroundColor: info.color }]}>
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Datos del ciclo */}
          <Text style={s.secTitulo}>Datos del ciclo</Text>
          <View style={s.formCard}>
            <Text style={s.label}>Fecha de inicio *</Text>
            <TextInput style={s.input} value={fechaInicio}
              onChangeText={setFechaInicio}
              placeholder="YYYY-MM-DD" placeholderTextColor={Colors.grisTexto} />

            <Text style={s.label}>Variedad de semilla</Text>
            <TextInput style={s.input} value={variedad}
              onChangeText={setVariedad}
              placeholder="Ej: IR-42, Fedearroz 60..." placeholderTextColor={Colors.grisTexto} />

            <Text style={s.label}>Área sembrada (ha)</Text>
            <TextInput style={s.input} value={area}
              onChangeText={setArea}
              placeholder="Ej: 2.5" placeholderTextColor={Colors.grisTexto}
              keyboardType="numeric" />

            <Text style={s.label}>Observaciones</Text>
            <TextInput style={[s.input, { height: 70, textAlignVertical: 'top' }]}
              value={observaciones} onChangeText={setObservaciones}
              placeholder="Condiciones del terreno, notas..." placeholderTextColor={Colors.grisTexto}
              multiline />
          </View>

          {/* Preview de actividades */}
          {tipoCiclo && (
            <View style={s.previewCard}>
              <Text style={s.previewTitulo}>
                📋 Se generarán {CICLOS[tipoCiclo].actividades} actividades:
              </Text>
              {getActividadesPreview(tipoCiclo).map((act, i) => (
                <View key={i} style={s.previewItem}>
                  <Text style={s.previewNum}>{i + 1}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.previewNombre}>{act.nombre}</Text>
                    <Text style={s.previewDia}>Día ~{act.dia}</Text>
                  </View>
                  {act.obligatoria
                    ? <Text style={s.previewOblig}>obligatoria</Text>
                    : <Text style={s.previewOpcional}>opcional</Text>}
                </View>
              ))}
            </View>
          )}

          {/* Botón iniciar */}
          <TouchableOpacity
            style={[s.btnIniciar, (!tipoCiclo || guardando) && { opacity: 0.4 }]}
            onPress={handleIniciar}
            disabled={!tipoCiclo || guardando}>
            <Text style={s.btnIniciarText}>
              {guardando ? 'Iniciando ciclo...' : '🌱 Iniciar ciclo'}
            </Text>
          </TouchableOpacity>
        </>
      )}

    </ScrollView>
  );
};

// Preview de actividades por tipo de ciclo
const PREVIEW: Record<TipoCiclo, { nombre: string; dia: number; obligatoria: boolean }[]> = {
  siembra_boleo: [
    { nombre: 'Preparación del suelo', dia: 0,   obligatoria: true  },
    { nombre: 'Inundación',            dia: 3,   obligatoria: true  },
    { nombre: 'Siembra al boleo',      dia: 7,   obligatoria: true  },
    { nombre: 'Riego',                 dia: 15,  obligatoria: true  },
    { nombre: 'Fertilización 1',       dia: 20,  obligatoria: true  },
    { nombre: 'Deshierba',             dia: 25,  obligatoria: false },
    { nombre: 'Fumigación 1',          dia: 35,  obligatoria: false },
    { nombre: 'Fertilización 2',       dia: 45,  obligatoria: true  },
    { nombre: 'Fumigación 2',          dia: 60,  obligatoria: false },
    { nombre: 'Riego llenado',         dia: 70,  obligatoria: true  },
    { nombre: 'Cosecha',               dia: 110, obligatoria: true  },
  ],
  siembra_trasplante: [
    { nombre: 'Preparación del suelo', dia: 0,   obligatoria: true  },
    { nombre: 'Inundación',            dia: 3,   obligatoria: true  },
    { nombre: 'Trasplante',            dia: 25,  obligatoria: true  },
    { nombre: 'Riego',                 dia: 30,  obligatoria: true  },
    { nombre: 'Fertilización 1',       dia: 35,  obligatoria: true  },
    { nombre: 'Deshierba',             dia: 40,  obligatoria: false },
    { nombre: 'Fumigación 1',          dia: 50,  obligatoria: false },
    { nombre: 'Fertilización 2',       dia: 60,  obligatoria: true  },
    { nombre: 'Fumigación 2',          dia: 75,  obligatoria: false },
    { nombre: 'Riego llenado',         dia: 85,  obligatoria: true  },
    { nombre: 'Cosecha',               dia: 120, obligatoria: true  },
  ],
  soca: [
    { nombre: 'Rozar y quemar',        dia: 0,  obligatoria: true  },
    { nombre: 'Riego soca',            dia: 5,  obligatoria: true  },
    { nombre: 'Fertilización soca',    dia: 15, obligatoria: true  },
    { nombre: 'Fumigación soca',       dia: 25, obligatoria: false },
    { nombre: 'Riego 2 soca',          dia: 35, obligatoria: true  },
    { nombre: 'Fumigación 2 soca',     dia: 50, obligatoria: false },
    { nombre: 'Cosecha soca',          dia: 75, obligatoria: true  },
  ],
  resoca: [
    { nombre: 'Rozar y quemar',        dia: 0,  obligatoria: true  },
    { nombre: 'Riego resoca',          dia: 5,  obligatoria: true  },
    { nombre: 'Fertilización resoca',  dia: 15, obligatoria: true  },
    { nombre: 'Riego 2 resoca',        dia: 30, obligatoria: true  },
    { nombre: 'Cosecha resoca',        dia: 65, obligatoria: true  },
  ],
};

const getActividadesPreview = (tipo: TipoCiclo) => PREVIEW[tipo] ?? [];

const s = StyleSheet.create({
  container:          { flex: 1, backgroundColor: Colors.grisFondo },
  content:            { padding: 16, gap: 12 },
  infoCard:           { backgroundColor: Colors.verdeClaro, borderRadius: 12, padding: 12,
                        borderWidth: 0.5, borderColor: Colors.verdeBorder },
  infoText:           { fontSize: 12, color: Colors.verde },
  secTitulo:          { fontSize: 14, fontWeight: '600', color: '#333' },
  ciclosGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cicloCard:          { width: '47%', backgroundColor: Colors.blanco, borderRadius: 14,
                        borderWidth: 0.5, borderColor: Colors.grisBorde, padding: 12, gap: 4 },
  cicloEmoji:         { fontSize: 24 },
  cicloLabel:         { fontSize: 13, fontWeight: '600', color: '#1a2b16' },
  cicloDesc:          { fontSize: 11, color: Colors.grisTexto },
  cicloStats:         { flexDirection: 'row', gap: 8, marginTop: 4 },
  cicloStat:          { fontSize: 11, fontWeight: '500' },
  cicloCheck:         { position: 'absolute', top: 8, right: 8, width: 22, height: 22,
                        borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  formCard:           { backgroundColor: Colors.blanco, borderRadius: 14, borderWidth: 0.5,
                        borderColor: Colors.grisBorde, padding: 14 },
  label:              { fontSize: 12, fontWeight: '500', color: Colors.grisTexto,
                        marginBottom: 4, marginTop: 10 },
  input:              { borderWidth: 0.5, borderColor: Colors.grisBorde, borderRadius: 8,
                        paddingHorizontal: 12, paddingVertical: 10, fontSize: 15,
                        backgroundColor: Colors.grisFondo },
  previewCard:        { backgroundColor: Colors.blanco, borderRadius: 14, borderWidth: 0.5,
                        borderColor: Colors.grisBorde, padding: 14 },
  previewTitulo:      { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 10 },
  previewItem:        { flexDirection: 'row', alignItems: 'center', gap: 10,
                        paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: Colors.grisBorde },
  previewNum:         { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.verdeClaro,
                        textAlign: 'center', lineHeight: 22, fontSize: 11,
                        fontWeight: '600', color: Colors.verde },
  previewNombre:      { fontSize: 13, fontWeight: '500', color: '#1a2b16' },
  previewDia:         { fontSize: 11, color: Colors.grisTexto },
  previewOblig:       { fontSize: 10, color: Colors.verde, fontWeight: '500' },
  previewOpcional:    { fontSize: 10, color: Colors.grisTexto },
  btnIniciar:         { backgroundColor: Colors.verde, borderRadius: 14,
                        padding: 16, alignItems: 'center', marginBottom: 20 },
  btnIniciarText:     { color: '#fff', fontWeight: '700', fontSize: 16 },
  cicloActivoCard:    { backgroundColor: Colors.verdeClaro, borderRadius: 14, borderWidth: 0.5,
                        borderColor: Colors.verdeBorder, padding: 16 },
  cicloActivoHeader:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  cicloActivoEmoji:   { fontSize: 32 },
  cicloActivoTitulo:  { fontSize: 12, color: Colors.grisTexto },
  cicloActivoTipo:    { fontSize: 16, fontWeight: '700', color: Colors.verde },
  cicloActivoFecha:   { fontSize: 12, color: Colors.grisTexto, marginTop: 2 },
  estadoBadge:        { backgroundColor: Colors.verde, borderRadius: 20,
                        paddingHorizontal: 10, paddingVertical: 4 },
  estadoBadgeText:    { color: '#fff', fontSize: 10, fontWeight: '700' },
  btnFinalizar:       { backgroundColor: Colors.blanco, borderRadius: 10, borderWidth: 0.5,
                        borderColor: Colors.rojo, padding: 12, alignItems: 'center' },
  btnFinalizarText:   { color: Colors.rojo, fontWeight: '600', fontSize: 14 },
});

export default IniciarCicloScreen;