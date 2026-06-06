import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, Modal,
  StyleSheet, Alert, ActivityIndicator, ScrollView,
  KeyboardAvoidingView, Platform, TextInput,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Colors } from '../theme/colors';
import { Actividad } from '../domain/entities/Actividad';
import { GetActividades } from '../application/usecases/actividad/GetActividades';
import { CreateActividad } from '../application/usecases/actividad/CreateActividad';
import { UpdateActividad } from '../application/usecases/actividad/UpdateActividad';
import { DeleteActividad } from '../application/usecases/actividad/DeleteActividad';

type Nav   = NativeStackNavigationProp<RootStackParamList, 'Actividades'>;
type Route = RouteProp<RootStackParamList, 'Actividades'>;
type Vista = 'lista' | 'nueva' | 'editando';
type TipoActividad =
  | 'preparacion_suelo' | 'inundacion' | 'siembra_boleo' | 'siembra_trasplante'
  | 'riego' | 'fertilizacion' | 'fumigacion' | 'deshierba' | 'cosecha'
  | 'rozar_quemar' | 'soca_riego' | 'soca_fertilizacion' | 'soca_fumigacion'
  | 'cosecha_soca' | 'observacion';
type TipoProducto = 'herbicida' | 'fungicida' | 'insecticida' | 'fertilizante' | 'abono' | 'corrector' | 'bioestimulante' | 'otro';
type Estado = 'pendiente' | 'en_proceso' | 'completada';

interface Producto { nombre: string; tipo: TipoProducto; dosis: string; unidad: string; dosisPorTanque: string; }

const TIPOS: TipoActividad[] = [
  'preparacion_suelo','inundacion','siembra_boleo','siembra_trasplante',
  'riego','fertilizacion','fumigacion','deshierba',
  'rozar_quemar','soca_riego','soca_fertilizacion','soca_fumigacion',
  'cosecha_soca','cosecha','observacion',
];
const TIPO_EMOJI: Record<TipoActividad, string> = {
  preparacion_suelo:'🚜', inundacion:'🌊', siembra_boleo:'🌱', siembra_trasplante:'🌿',
  riego:'💧', fertilizacion:'🌾', fumigacion:'🧪', deshierba:'✂️', cosecha:'🏆',
  rozar_quemar:'🔥', soca_riego:'💧', soca_fertilizacion:'🌾', soca_fumigacion:'🧪',
  cosecha_soca:'🏆', observacion:'📝',
};
const TIPO_LABEL: Record<TipoActividad, string> = {
  preparacion_suelo:'Preparación del Suelo', inundacion:'Inundación',
  siembra_boleo:'Siembra Boleo', siembra_trasplante:'Siembra Trasplante',
  riego:'Riego', fertilizacion:'Fertilización', fumigacion:'Fumigación',
  deshierba:'Deshierba', cosecha:'Cosecha', rozar_quemar:'Rozar / Quemar',
  soca_riego:'Soca Riego', soca_fertilizacion:'Soca Fertilización',
  soca_fumigacion:'Soca Fumigación', cosecha_soca:'Cosecha Soca',
  observacion:'Observación',
};
const ESTADO_COLOR: Record<Estado, string> = {
  pendiente:  '#9ca3af',
  en_proceso: '#3b82f6',
  completada: Colors.verde,
};

// const ESTADO_BG: Record<Estado, string> = {
//   pendiente:  '#f3f4f6',
//   en_proceso: '#eff6ff',
//   completada: '#f0fdf4',
// };


const ESTADO_LABEL: Record<Estado, string> = {
  pendiente:  '⏳ Pendiente',
  en_proceso: '🔵 En proceso',
  completada: '✅ Completada',
};

const TIPOS_CON_PRODUCTOS: TipoActividad[] = ['fertilizacion','fumigacion','soca_fertilizacion','soca_fumigacion'];
const TIPOS_CON_TANQUES: TipoActividad[]   = ['fumigacion','soca_fumigacion'];
const TIPOS_COSECHA: TipoActividad[]       = ['cosecha','cosecha_soca'];
const TIPOS_RIEGO: TipoActividad[]         = ['riego','soca_riego','inundacion'];
const TIPOS_SIEMBRA: TipoActividad[]       = ['siembra_boleo','siembra_trasplante'];
const TIPOS_CON_MAQUINARIA: TipoActividad[] = ['preparacion_suelo','rozar_quemar','cosecha','cosecha_soca','fumigacion','soca_fumigacion'];
const TIPOS_PRODUCTO: TipoProducto[]       = ['herbicida','fungicida','insecticida','fertilizante','abono','corrector','bioestimulante','otro'];
const METODOS_PREP: string[]    = ['rastra','maquinaria','canguros','palo','manual'];
const METODOS_RIEGO: string[]   = ['inundacion','aspersion','gravedad'];
const METODOS_APLIC: string[]   = ['al voleo','foliar','incorporado','mochila','drone','tractor'];
const METODOS_COSECHA: string[] = ['manual','mecanica'];
const METODOS_SIEMBRA: string[] = ['manual','mecanico'];
const DESTINOS: string[]        = ['piladora','almacen','directo','otro'];
const NIVELES_DANO: string[]    = ['leve','moderado','severo'];
const NIVELES_ALERTA: string[]  = ['normal','alerta','critico'];
const TIPOS_MAQUINARIA: string[] = ['tractor','drone','cosechadora','bomba','otro'];
const UNIDADES_COBRO: Record<string, string[]> = {
  tractor: ['hora'], drone: ['hectarea'], cosechadora: ['saco'], bomba: ['hora'],
  otro: ['hora','hectarea','saco'],
};
const PRODUCTO_VACIO: Producto = { nombre:'', tipo:'herbicida', dosis:'', unidad:'L/ha', dosisPorTanque:'' };
const ORDEN_TIPO: Record<TipoActividad, number> = {
  preparacion_suelo:0, inundacion:1, siembra_boleo:2, siembra_trasplante:3,
  riego:4, fertilizacion:5, fumigacion:6, deshierba:7,
  rozar_quemar:8, soca_riego:9, soca_fertilizacion:10, soca_fumigacion:11,
  cosecha_soca:12, cosecha:13, observacion:14,
};

const fmt = (d: Date) => d.toISOString().split('T')[0];

const ActividadesScreen: React.FC = () => {
  const navigation    = useNavigation<Nav>();
  const { params }    = useRoute<Route>();
  const parcela       = params.parcela;
  const parcelaId     = parcela?.p_id ?? parcela?.id;
  const parcelaNombre = parcela?.p_nombre ?? parcela?.nombre ?? '';

  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loading, setLoading]         = useState(false);
  const [vista, setVista]             = useState<Vista>('lista');
  const [actividadSel, setActividadSel] = useState<Actividad | null>(null);
  const [guardando, setGuardando]     = useState(false);
  const [modalTipo, setModalTipo]     = useState(false);

  // DatePicker
  const [showPickerInicio, setShowPickerInicio] = useState(false);
  const [showPickerFin, setShowPickerFin]       = useState(false);
  const [dateInicio, setDateInicio]             = useState<Date | null>(null);
  const [dateFin, setDateFin]                   = useState<Date | null>(null);

  // Secciones colapsables
  const [secMaquinaria, setSecMaquinaria] = useState(false);
  const [secJornales, setSecJornales]     = useState(false);

  const [tipo, setTipo]               = useState<TipoActividad>('preparacion_suelo');
  const [estado, setEstado]           = useState<Estado>('pendiente');
  const [metodo, setMetodo]           = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [insumo, setInsumo]           = useState('');
  const [cantidad, setCantidad]       = useState('');
  const [unidad, setUnidad]           = useState('');
  const [laminaAgua, setLaminaAgua]   = useState('');
  const [rendimientoHa, setRendimientoHa] = useState('');
  const [totalSacos, setTotalSacos]   = useState('');
  const [humedad, setHumedad]         = useState('');
  const [precioQq, setPrecioQq]       = useState('');
  const [costoCosecha, setCostoCosecha] = useState('');
  const [destino, setDestino]         = useState('');
  const [plagaDetectada, setPlagaDetectada] = useState('');
  const [nivelDano, setNivelDano]     = useState('');
  const [nivelAlerta, setNivelAlerta] = useState('normal');
  const [productos, setProductos]     = useState<Producto[]>([{ ...PRODUCTO_VACIO }]);
  const [capacidadTanque, setCapacidadTanque] = useState('200');
  const [numTanques, setNumTanques]   = useState('');
  const [numJornales, setNumJornales] = useState('');
  const [pagoJornal, setPagoJornal]   = useState('');
  const [tipoMaquinaria, setTipoMaquinaria]     = useState('');
  const [unidadCobro, setUnidadCobro]           = useState('');
  const [cantidadUnidades, setCantidadUnidades] = useState('');
  const [costoPorUnidad, setCostoPorUnidad]     = useState('');

//   const cargar = useCallback(async () =>
//      {
//     if (!parcelaId) return;
//     setLoading(true);
//     try {
//       const data = await GetActividades(parcelaId);
//       // const ordenadas = [...data].sort((a, b) =>
//       //   (ORDEN_TIPO[a.tipo as TipoActividad] ?? 99) - (ORDEN_TIPO[b.tipo as TipoActividad] ?? 99)
//       // );
//       const ordenadas = [...data].sort((a, b) => {
//   const ordenEstado: Record<string, number> = {
//     en_proceso: 0,
//     pendiente: 1,
//     completada: 2,
//   };
//   const ea = ordenEstado[a.estado ?? 'pendiente'] ?? 1;
//   const eb = ordenEstado[b.estado ?? 'pendiente'] ?? 1;
//   if (ea !== eb) return ea - eb;
//   return (ORDEN_TIPO[a.tipo as TipoActividad] ?? 99) - (ORDEN_TIPO[b.tipo as TipoActividad] ?? 99);
// });

//       setActividades(ordenadas);
//     } catch (e: any) { Alert.alert('Error', e.message); }
//     finally { setLoading(false); }
//   }, [parcelaId]);

const cargar = useCallback(async () => {
  const pid = parcela?.p_id ?? parcela?.id;
  console.log('CARGANDO pid:', pid);
  if (!pid) return;
  setLoading(true);
  try {
    const data = await GetActividades(pid);
    console.log('TOTAL:', data.length, data.map((a:any) => a.id));
    const ordenadas = [...data].sort((a, b) => {
      const ordenEstado: Record<string, number> = {
        en_proceso: 0, pendiente: 1, completada: 2,
      };
      const ea = ordenEstado[a.estado ?? 'pendiente'] ?? 1;
      const eb = ordenEstado[b.estado ?? 'pendiente'] ?? 1;
      if (ea !== eb) return ea - eb;
      return (ORDEN_TIPO[a.tipo as TipoActividad] ?? 99) - (ORDEN_TIPO[b.tipo as TipoActividad] ?? 99);
    });
    setActividades(ordenadas);
  } catch (e: any) { Alert.alert('Error', e.message); }
  finally { setLoading(false); }
}, [parcela]);

  useEffect(() => {
    navigation.setOptions({ title: `Actividades · ${parcelaNombre}` });
    cargar();
  }, [cargar, navigation, parcelaNombre]);

  const resetForm = () => {
    setTipo('preparacion_suelo'); setEstado('pendiente');
    setDateInicio(null); setDateFin(null);
    setMetodo(''); setObservaciones('');
    setInsumo(''); setCantidad(''); setUnidad('');
    setLaminaAgua(''); setRendimientoHa(''); setTotalSacos('');
    setHumedad(''); setPrecioQq(''); setCostoCosecha(''); setDestino('');
    setPlagaDetectada(''); setNivelDano(''); setNivelAlerta('normal');
    setProductos([{ ...PRODUCTO_VACIO }]);
    setCapacidadTanque('200'); setNumTanques('');
    setNumJornales(''); setPagoJornal('');
    setTipoMaquinaria(''); setUnidadCobro('');
    setCantidadUnidades(''); setCostoPorUnidad('');
    setSecMaquinaria(false); setSecJornales(false);
  };

  const abrirNueva = () => { resetForm(); setActividadSel(null); setVista('nueva'); };

  const abrirEditar = (a: Actividad) => {
    setActividadSel(a);
    setTipo(a.tipo as TipoActividad);
    setEstado((a.estado as Estado) ?? 'pendiente');
    setDateInicio(a.fechaInicio ? new Date(a.fechaInicio) : null);
    setDateFin(a.fechaFin ? new Date(a.fechaFin) : null);
    setMetodo(a.metodo ?? ''); setObservaciones(a.observaciones ?? '');
    setInsumo(a.insumo ?? ''); setCantidad(a.cantidad?.toString() ?? '');
    setUnidad(a.unidad ?? ''); setLaminaAgua(a.laminaAgua?.toString() ?? '');
    setRendimientoHa(a.rendimientoHa?.toString() ?? '');
    setTotalSacos(a.totalSacos?.toString() ?? '');
    setHumedad(a.humedad?.toString() ?? '');
    setPrecioQq(a.precioQq?.toString() ?? '');
    setCostoCosecha(a.costoCosecha?.toString() ?? '');
    setDestino(a.destino ?? ''); setPlagaDetectada(a.plagaDetectada ?? '');
    setNivelDano(a.nivelDano ?? ''); setNivelAlerta(a.nivelAlerta ?? 'normal');
    setCapacidadTanque(a.capacidadTanque?.toString() ?? '200');
    setNumTanques(a.numTanques?.toString() ?? '');
    setNumJornales(a.numJornales?.toString() ?? '');
    setPagoJornal(a.pagoJornal?.toString() ?? '');
    setTipoMaquinaria(a.tipoMaquinaria ?? '');
    setUnidadCobro(a.unidadCobro ?? '');
    setCantidadUnidades(a.cantidadUnidades?.toString() ?? '');
    setCostoPorUnidad(a.costoPorUnidad?.toString() ?? '');
    setSecMaquinaria(!!a.tipoMaquinaria);
    setSecJornales(!!a.numJornales);
    setProductos(a.productos?.length
      ? a.productos.map((p: any) => ({
          nombre: p.nombre, tipo: p.tipo,
          dosis: p.dosis?.toString() ?? '',
          unidad: p.unidad,
          dosisPorTanque: p.dosisPorTanque?.toString() ?? '',
        }))
      : [{ ...PRODUCTO_VACIO }]);
    setVista('editando');
  };

  const buildPayload = () => ({
    tipo, estado,
    fecha: new Date().toISOString(),
    fechaInicio: dateInicio ? dateInicio.toISOString() : undefined,
    fechaFin: dateFin ? dateFin.toISOString() : undefined,
    metodo: metodo || undefined,
    insumo: insumo || undefined,
    cantidad: cantidad ? Number(cantidad) : undefined,
    unidad: unidad || undefined,
    laminaAgua: laminaAgua ? Number(laminaAgua) : undefined,
    rendimientoHa: rendimientoHa ? Number(rendimientoHa) : undefined,
    totalSacos: totalSacos ? Number(totalSacos) : undefined,
    humedad: humedad ? Number(humedad) : undefined,
    precioQq: precioQq ? Number(precioQq) : undefined,
    costoCosecha: costoCosecha ? Number(costoCosecha) : undefined,
    destino: destino || undefined,
    plagaDetectada: plagaDetectada || undefined,
    nivelDano: nivelDano || undefined,
    nivelAlerta: nivelAlerta || undefined,
    observaciones: observaciones || undefined,
    capacidadTanque: capacidadTanque ? Number(capacidadTanque) : 200,
    numTanques: numTanques ? Number(numTanques) : undefined,
    numJornales: numJornales ? Number(numJornales) : undefined,
    pagoJornal: pagoJornal ? Number(pagoJornal) : undefined,
    costoManoObra: numJornales && pagoJornal
      ? Number(numJornales) * Number(pagoJornal) : undefined,
    tipoMaquinaria: tipoMaquinaria || undefined,
    unidadCobro: unidadCobro || undefined,
    cantidadUnidades: cantidadUnidades ? Number(cantidadUnidades) : undefined,
    costoPorUnidad: costoPorUnidad ? Number(costoPorUnidad) : undefined,
    costoMaquinaria: cantidadUnidades && costoPorUnidad
      ? Number(cantidadUnidades) * Number(costoPorUnidad) : undefined,
    productos: TIPOS_CON_PRODUCTOS.includes(tipo)
      ? productos.filter(p => p.nombre.trim()).map(p => ({
          nombre: p.nombre.trim(), tipo: p.tipo,
          dosis: p.dosis ? Number(p.dosis) : undefined,
          unidad: p.unidad,
          dosisPorTanque: p.dosisPorTanque ? Number(p.dosisPorTanque) : undefined,
        }))
      : undefined,
  });

  const handleCrear = async () => {
    setGuardando(true);
    try {
      await CreateActividad(parcelaId, buildPayload() as any);
      await cargar(); setVista('lista');
      Alert.alert('✅ Actividad registrada');
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setGuardando(false); }
  };

  const handleActualizar = async () => {
    if (!actividadSel) return;
    setGuardando(true);
    try {
      await UpdateActividad(actividadSel.id, buildPayload() as any);
      await cargar(); setVista('lista');
      Alert.alert('✅ Actividad actualizada');
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setGuardando(false); }
  };

  const handleEliminar = (a: Actividad) => {
    Alert.alert('Eliminar', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try { await DeleteActividad(a.id); await cargar(); }
        catch (e: any) { Alert.alert('Error', e.message); }
      }},
    ]);
  };

  const cambiarEstadoRapido = async (a: Actividad, nuevoEstado: Estado) => {
    try {
      await UpdateActividad(a.id, { estado: nuevoEstado } as any);
      await cargar();
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const renderChips = (opciones: string[], valor: string, onChange: (v: string) => void, label: string) => (
    <>
      <Text style={s.label}>{label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        {opciones.map(op => (
          <TouchableOpacity key={op} style={[s.chip, valor === op && s.chipOn]} onPress={() => onChange(op)}>
            <Text style={[s.chipText, valor === op && { color: '#fff' }]}>{op}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );

  const renderInput = (label: string, value: string, onChange: (v: string) => void,
    opts?: { placeholder?: string; numeric?: boolean; multiline?: boolean }) => (
    <>
      <Text style={s.label}>{label}</Text>
      <TextInput style={[s.input, opts?.multiline && { height: 70, textAlignVertical: 'top' }]}
        value={value} onChangeText={onChange}
        placeholder={opts?.placeholder ?? ''} placeholderTextColor="#aaa"
        keyboardType={opts?.numeric ? 'numeric' : 'default'}
        multiline={opts?.multiline} />
    </>
  );

  const renderDatePicker = (label: string, date: Date | null, onShow: () => void) => (
    <>
      <Text style={s.label}>{label}</Text>
      <TouchableOpacity style={s.dateBtn} onPress={onShow}>
        <Text style={s.dateBtnText}>{date ? fmt(date) : 'Seleccionar fecha'}</Text>
        <Text style={{ fontSize: 16 }}>📅</Text>
      </TouchableOpacity>
    </>
  );

  const renderSeccion = (titulo: string, abierta: boolean, toggle: () => void, children: React.ReactNode) => (
    <View style={s.seccionCard}>
      <TouchableOpacity style={s.seccionHeader} onPress={toggle}>
        <Text style={s.seccionTitulo}>{titulo}</Text>
        <Text style={{ color: Colors.grisTexto, fontSize: 16 }}>{abierta ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {abierta && <View style={{ marginTop: 8 }}>{children}</View>}
    </View>
  );

  const renderModalTipo = () => (
    <Modal visible={modalTipo} transparent animationType="slide">
      <View style={s.modalOverlay}>
        <View style={s.modalBox}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitulo}>Seleccionar tipo</Text>
            <TouchableOpacity onPress={() => setModalTipo(false)}>
              <Text style={{ color: Colors.rojo, fontSize: 16, fontWeight: '600' }}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView>
            {TIPOS.map(t => (
              <TouchableOpacity key={t} style={[s.modalItem, tipo === t && s.modalItemOn]}
                onPress={() => { setTipo(t); setModalTipo(false); }}>
                <Text style={s.modalItemEmoji}>{TIPO_EMOJI[t]}</Text>
                <Text style={[s.modalItemText, tipo === t && { color: Colors.verde, fontWeight: '600' }]}>
                  {TIPO_LABEL[t]}
                </Text>
                {tipo === t && <Text style={{ color: Colors.verde }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderLista = () => (
    <>
        <View style={s.header}>
      <Text style={s.titulo}>Actividades</Text>
      <TouchableOpacity style={s.btnPrimario} onPress={abrirNueva}>
        <Text style={s.btnText}>+ Nueva</Text>
      </TouchableOpacity>
    </View>
    {loading
      ? <ActivityIndicator size="large" color={Colors.verde} style={{ marginTop: 40 }} />
      : actividades.length === 0
        ? <View style={s.vacio}><Text style={s.vacioText}>No hay actividades registradas</Text></View>
        : <FlatList
            data={actividades}
            keyExtractor={a => `${a.id}-${a.estado}`}
            extraData={actividades}
  renderItem={({ item }) => {
    const est = (item.estado ?? 'pendiente') as Estado;
    return (
      <View style={[s.card, { borderLeftWidth: 4, borderLeftColor: ESTADO_COLOR[est] }]}>
        <View style={s.cardRow}>
          <Text style={s.emoji}>{TIPO_EMOJI[item.tipo as TipoActividad] ?? '📌'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitulo}>{TIPO_LABEL[item.tipo as TipoActividad] ?? item.tipo}</Text>
            {item.fechaInicio && (
              <Text style={s.cardSub}>
                📅 {item.fechaInicio?.split('T')[0]}
                {item.fechaFin ? ` → ${item.fechaFin?.split('T')[0]}` : ''}
              </Text>
            )}
            {item.metodo       && <Text style={s.cardMeta}>Método: {item.metodo}</Text>}
            {item.laminaAgua   && <Text style={s.cardMeta}>Lámina: {item.laminaAgua} cm</Text>}
            {item.numTanques   && <Text style={s.cardMeta}>🪣 {item.numTanques} × {item.capacidadTanque ?? 200}L</Text>}
            {item.numJornales  && <Text style={s.cardMeta}>👷 {item.numJornales} jornales × ${item.pagoJornal}</Text>}
            {item.costoManoObra && <Text style={[s.cardMeta,{color:Colors.tierra}]}>💰 Mano obra: ${item.costoManoObra}</Text>}
            {item.tipoMaquinaria && <Text style={s.cardMeta}>🚜 {item.tipoMaquinaria}: {item.cantidadUnidades} {item.unidadCobro} × ${item.costoPorUnidad}</Text>}
            {item.costoMaquinaria && <Text style={[s.cardMeta,{color:Colors.tierra}]}>⚙️ Maquinaria: ${item.costoMaquinaria}</Text>}
            {item.totalSacos   && <Text style={s.cardMeta}>Sacos: {item.totalSacos} qq</Text>}
            {item.ingresoTotal && <Text style={[s.cardMeta,{color:Colors.verde,fontWeight:'700'}]}>Ingreso: ${item.ingresoTotal}</Text>}
            {item.plagaDetectada && <Text style={[s.cardMeta,{color:Colors.rojo}]}>🐛 {item.plagaDetectada} — {item.nivelDano}</Text>}
            {(item.productos?.length ?? 0) > 0 && (
              <Text style={s.cardMeta}>🧪 {item.productos?.map((p: any) => p.nombre).join(', ')}</Text>
            )}
            {item.observaciones && <Text style={s.cardMeta}>📝 {item.observaciones}</Text>}

            {/* Badge tocable — solo estado actual */}
            <TouchableOpacity
              style={[s.estadoBtn, { 
                backgroundColor: ESTADO_COLOR[est], 
                borderColor: ESTADO_COLOR[est], 
                marginTop: 8, 
                alignSelf: 'flex-start' 
              }]}
              onPress={() => {
                const siguiente: Record<Estado, Estado> = {
                  pendiente: 'en_proceso',
                  en_proceso: 'completada',
                  completada: 'pendiente',
                };
                cambiarEstadoRapido(item, siguiente[est]);
              }}>
              <Text style={[s.estadoBtnText, { color: '#fff' }]}>{ESTADO_LABEL[est]}</Text>
            </TouchableOpacity>
          </View>
          <View>
            <TouchableOpacity onPress={() => abrirEditar(item)} style={s.iconBtn}><Text>✏️</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => handleEliminar(item)} style={s.iconBtn}><Text>🗑️</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }} 
/>
    }</>
  );

  const renderFormulario = (esEdicion: boolean) => (
    <ScrollView keyboardShouldPersistTaps="handled">
      <View style={s.header}>
        <TouchableOpacity onPress={() => setVista('lista')}>
          <Text style={s.link}>← Volver</Text>
        </TouchableOpacity>
        <Text style={s.titulo}>{esEdicion ? 'Editar' : 'Nueva actividad'}</Text>
      </View>

      <Text style={s.label}>Tipo de actividad *</Text>
      <TouchableOpacity style={s.dropdown} onPress={() => setModalTipo(true)}>
        <Text style={s.dropdownEmoji}>{TIPO_EMOJI[tipo]}</Text>
        <Text style={s.dropdownText}>{TIPO_LABEL[tipo]}</Text>
        <Text style={s.dropdownArrow}>▼</Text>
      </TouchableOpacity>

      {/* Estado */}
      <Text style={s.label}>Estado</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        {(['pendiente','en_proceso','completada'] as Estado[]).map(e => (
          <TouchableOpacity key={e}
            style={[s.chip, estado === e && { backgroundColor: ESTADO_COLOR[e], borderColor: ESTADO_COLOR[e] }]}
            onPress={() => setEstado(e)}>
            <Text style={[s.chipText, estado === e && { color: '#fff' }]}>{ESTADO_LABEL[e]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Fechas con picker */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          {renderDatePicker('📅 Fecha inicio', dateInicio, () => setShowPickerInicio(true))}
        </View>
        <View style={{ flex: 1 }}>
          {renderDatePicker('📅 Fecha fin', dateFin, () => setShowPickerFin(true))}
        </View>
      </View>

      {showPickerInicio && (
        <DateTimePicker value={dateInicio ?? new Date()} mode="date" display="default"
          onChange={(_, d) => { setShowPickerInicio(false); if (d) setDateInicio(d); }} />
      )}
      {showPickerFin && (
        <DateTimePicker value={dateFin ?? new Date()} mode="date" display="default"
          onChange={(_, d) => { setShowPickerFin(false); if (d) setDateFin(d); }} />
      )}

      {(tipo === 'preparacion_suelo' || tipo === 'rozar_quemar') &&
        renderChips(METODOS_PREP, metodo, setMetodo, 'Método')}

      {TIPOS_SIEMBRA.includes(tipo) && (
        <>
          {renderChips(METODOS_SIEMBRA, metodo, setMetodo, 'Método')}
          {renderInput('Variedad / Insumo', insumo, setInsumo, { placeholder: 'Ej: IR-42' })}
          {renderInput('Cantidad (kg)', cantidad, setCantidad, { numeric: true })}
          {renderInput('Unidad', unidad, setUnidad)}
        </>
      )}

      {TIPOS_RIEGO.includes(tipo) && (
        <>
          {renderChips(METODOS_RIEGO, metodo, setMetodo, 'Tipo de riego')}
          {renderInput('Lámina de agua (cm)', laminaAgua, setLaminaAgua, { numeric: true })}
          {renderInput('Duración (horas)', cantidad, setCantidad, { numeric: true })}
        </>
      )}

      {TIPOS_CON_PRODUCTOS.includes(tipo) && (
        <>
          {renderChips(METODOS_APLIC, metodo, setMetodo, 'Método aplicación')}
          <Text style={s.label}>Productos *</Text>
          {productos.map((prod, i) => (
            <View key={i} style={s.prodCard}>
              <View style={s.prodHeader}>
                <Text style={s.prodNum}>Producto {i + 1}</Text>
                {productos.length > 1 && (
                  <TouchableOpacity onPress={() => setProductos(p => p.filter((_, idx) => idx !== i))}>
                    <Text style={{ color: Colors.rojo, fontSize: 12 }}>✕ Quitar</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TextInput style={s.input} value={prod.nombre}
                onChangeText={v => setProductos(p => p.map((x, idx) => idx === i ? { ...x, nombre: v } : x))}
                placeholder="Nombre del producto" placeholderTextColor="#aaa" />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {TIPOS_PRODUCTO.map(tp => (
                  <TouchableOpacity key={tp} style={[s.chip, prod.tipo === tp && s.chipOn]}
                    onPress={() => setProductos(p => p.map((x, idx) => idx === i ? { ...x, tipo: tp } : x))}>
                    <Text style={[s.chipText, prod.tipo === tp && { color: '#fff' }]}>{tp}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.labelSmall}>Dosis</Text>
                  <TextInput style={s.input} value={prod.dosis}
                    onChangeText={v => setProductos(p => p.map((x, idx) => idx === i ? { ...x, dosis: v } : x))}
                    placeholder="Dosis" placeholderTextColor="#aaa" keyboardType="numeric" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.labelSmall}>Unidad</Text>
                  <TextInput style={s.input} value={prod.unidad}
                    onChangeText={v => setProductos(p => p.map((x, idx) => idx === i ? { ...x, unidad: v } : x))}
                    placeholder="L/ha" placeholderTextColor="#aaa" />
                </View>
              </View>
              {TIPOS_CON_TANQUES.includes(tipo) && (
                <View style={{ flex: 1 }}>
                  <Text style={s.labelSmall}>Dosis por tanque</Text>
                  <TextInput style={s.input} value={prod.dosisPorTanque}
                    onChangeText={v => setProductos(p => p.map((x, idx) => idx === i ? { ...x, dosisPorTanque: v } : x))}
                    placeholder="Dosis por tanque" placeholderTextColor="#aaa" keyboardType="numeric" />
                </View>
              )}
            </View>
          ))}
          <TouchableOpacity style={s.btnAgregar} onPress={() => setProductos(p => [...p, { ...PRODUCTO_VACIO }])}>
            <Text style={s.btnAgregarText}>+ Agregar producto</Text>
          </TouchableOpacity>
        </>
      )}

      {TIPOS_CON_TANQUES.includes(tipo) && (
        <View style={s.seccionCard}>
          <Text style={s.seccionTitulo}>🪣 Datos del tanque</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              {renderInput('Capacidad (L)', capacidadTanque, setCapacidadTanque, { numeric: true, placeholder: '200' })}
            </View>
            <View style={{ flex: 1 }}>
              {renderInput('Nº tanques', numTanques, setNumTanques, { numeric: true, placeholder: 'Ej: 2.5' })}
            </View>
          </View>
          {capacidadTanque && numTanques && (
            <View style={s.calcBox}>
              <Text style={s.calcLabel}>Total aplicado:</Text>
              <Text style={s.calcValor}>{(Number(capacidadTanque) * Number(numTanques)).toFixed(0)} L</Text>
            </View>
          )}
        </View>
      )}

      {tipo === 'deshierba' && renderChips(['manual','quimica'], metodo, setMetodo, 'Método')}

      {TIPOS_COSECHA.includes(tipo) && (
        <>
          {renderChips(METODOS_COSECHA, metodo, setMetodo, 'Método cosecha')}
          {renderInput('Rendimiento (t/ha)', rendimientoHa, setRendimientoHa, { numeric: true })}
          {renderInput('Total sacos (qq)', totalSacos, setTotalSacos, { numeric: true })}
          {renderInput('Humedad (%)', humedad, setHumedad, { numeric: true })}
          {renderInput('Precio por quintal ($)', precioQq, setPrecioQq, { numeric: true })}
          {renderInput('Costo de cosecha ($)', costoCosecha, setCostoCosecha, { numeric: true })}
          {renderChips(DESTINOS, destino, setDestino, 'Destino')}
          {totalSacos && precioQq ? (
            <View style={s.ingresoBox}>
              <Text style={s.ingresoLabel}>💰 Ingreso estimado:</Text>
              <Text style={s.ingresoValor}>${(Number(totalSacos) * Number(precioQq)).toFixed(2)}</Text>
            </View>
          ) : null}
        </>
      )}

      {(tipo === 'fumigacion' || tipo === 'soca_fumigacion' || tipo === 'observacion') && (
        <>
          {renderInput('Plaga detectada', plagaDetectada, setPlagaDetectada, { placeholder: 'Ej: sogata' })}
          {plagaDetectada ? renderChips(NIVELES_DANO, nivelDano, setNivelDano, 'Nivel de daño') : null}
        </>
      )}

      {tipo === 'observacion' && renderChips(NIVELES_ALERTA, nivelAlerta, setNivelAlerta, 'Nivel de alerta')}

      {/* Maquinaria colapsable */}
      {TIPOS_CON_MAQUINARIA.includes(tipo) && renderSeccion('🚜 Maquinaria', secMaquinaria, () => setSecMaquinaria(v => !v), (
        <>
          {renderChips(TIPOS_MAQUINARIA, tipoMaquinaria, (v) => {
            setTipoMaquinaria(v);
            const u = UNIDADES_COBRO[v];
            if (u?.length === 1) setUnidadCobro(u[0]);
            else setUnidadCobro('');
          }, 'Tipo')}
          {tipoMaquinaria && (
            <>
              {renderChips(UNIDADES_COBRO[tipoMaquinaria] ?? ['hora','hectarea','saco'], unidadCobro, setUnidadCobro, 'Unidad de cobro')}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  {renderInput(`Cantidad (${unidadCobro||'u'})`, cantidadUnidades, setCantidadUnidades, { numeric: true })}
                </View>
                <View style={{ flex: 1 }}>
                  {renderInput(`$ por ${unidadCobro||'u'}`, costoPorUnidad, setCostoPorUnidad, { numeric: true })}
                </View>
              </View>
              {cantidadUnidades && costoPorUnidad && (
                <View style={s.calcBox}>
                  <Text style={s.calcLabel}>⚙️ Costo maquinaria:</Text>
                  <Text style={s.calcValor}>${(Number(cantidadUnidades) * Number(costoPorUnidad)).toFixed(2)}</Text>
                </View>
              )}
            </>
          )}
        </>
      ))}

      {/* Jornales colapsable */}
      {renderSeccion('👷 Mano de obra (jornales)', secJornales, () => setSecJornales(v => !v), (
        <>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              {renderInput('Nº jornales', numJornales, setNumJornales, { numeric: true, placeholder: 'Ej: 3' })}
            </View>
            <View style={{ flex: 1 }}>
              {renderInput('Pago por jornal ($)', pagoJornal, setPagoJornal, { numeric: true, placeholder: 'Ej: 15.00' })}
            </View>
          </View>
          {numJornales && pagoJornal ? (
            <View style={s.ingresoBox}>
              <Text style={s.ingresoLabel}>💰 Costo mano de obra:</Text>
              <Text style={s.ingresoValor}>${(Number(numJornales) * Number(pagoJornal)).toFixed(2)}</Text>
            </View>
          ) : null}
        </>
      ))}

      {renderInput('Observaciones', observaciones, setObservaciones, { multiline: true, placeholder: 'Notas...' })}

      <TouchableOpacity
        style={[s.btnPrimario, { marginTop: 20, marginBottom: 30 }, guardando && { opacity: 0.5 }]}
        onPress={esEdicion ? handleActualizar : handleCrear}
        disabled={guardando}>
        <Text style={[s.btnText, { textAlign: 'center' }]}>
          {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Registrar actividad'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={s.container}>
        {renderModalTipo()}
        {vista === 'lista'    && renderLista()}
        {vista === 'nueva'    && renderFormulario(false)}
        {vista === 'editando' && renderFormulario(true)}
      </View>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: Colors.grisFondo, paddingHorizontal: 16, paddingTop: 12 },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  titulo:         { fontSize: 20, fontWeight: '600', color: '#1a2b16' },
  link:           { fontSize: 14, color: Colors.verde, fontWeight: '500' },
  btnPrimario:    { backgroundColor: Colors.verde, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 20 },
  btnText:        { color: '#fff', fontWeight: '600', fontSize: 14 },
  card:           { backgroundColor: Colors.blanco, borderRadius: 12, padding: 14,
                    marginBottom: 10, borderWidth: 0.5, borderColor: Colors.grisBorde },
  cardRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  emoji:          { fontSize: 26, marginTop: 2 },
  cardTitulo:     { fontSize: 15, fontWeight: '600', color: '#1a2b16' },
  cardSub:        { fontSize: 12, color: Colors.grisTexto, marginTop: 2 },
  cardMeta:       { fontSize: 12, color: '#444', marginTop: 2 },
  iconBtn:        { padding: 4, marginBottom: 2 },
  vacio:          { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60 },
  vacioText:      { fontSize: 15, color: '#999' },
  label:          { fontSize: 13, fontWeight: '500', color: '#444', marginBottom: 4, marginTop: 12 },
  labelSmall:     { fontSize: 11, fontWeight: '500', color: '#666', marginBottom: 3 },
  input:          { borderWidth: 0.5, borderColor: Colors.grisBorde, borderRadius: 8,
                    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8, fontSize: 15,
                    backgroundColor: Colors.blanco },
  chip:           { borderWidth: 0.5, borderColor: Colors.grisBorde, borderRadius: 20,
                    paddingVertical: 6, paddingHorizontal: 14, backgroundColor: Colors.blanco },
  chipOn:         { backgroundColor: Colors.verde, borderColor: Colors.verde },
  chipText:       { fontSize: 13, color: '#444' },
  dropdown:       { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.blanco,
                    borderWidth: 0.5, borderColor: Colors.grisBorde, borderRadius: 10,
                    paddingHorizontal: 14, paddingVertical: 14, marginBottom: 8, gap: 10 },
  dropdownEmoji:  { fontSize: 20 },
  dropdownText:   { flex: 1, fontSize: 15, color: '#1a2b16', fontWeight: '500' },
  dropdownArrow:  { fontSize: 12, color: Colors.grisTexto },
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox:       { backgroundColor: Colors.blanco, borderTopLeftRadius: 20, borderTopRightRadius: 20,
                    maxHeight: '75%', paddingBottom: 30 },
  modalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                    padding: 16, borderBottomWidth: 0.5, borderBottomColor: Colors.grisBorde },
  modalTitulo:    { fontSize: 16, fontWeight: '600', color: '#1a2b16' },
  modalItem:      { flexDirection: 'row', alignItems: 'center', gap: 12,
                    paddingHorizontal: 16, paddingVertical: 14,
                    borderBottomWidth: 0.5, borderBottomColor: Colors.grisBorde },
  modalItemOn:    { backgroundColor: Colors.verdeClaro },
  modalItemEmoji: { fontSize: 22 },
  modalItemText:  { flex: 1, fontSize: 15, color: '#333' },
  prodCard:       { backgroundColor: Colors.blanco, borderRadius: 10, padding: 12,
                    marginBottom: 10, borderWidth: 0.5, borderColor: Colors.grisBorde },
  prodHeader:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  prodNum:        { fontSize: 13, fontWeight: '600', color: '#333' },
  btnAgregar:     { borderWidth: 0.5, borderColor: Colors.verde, borderRadius: 8,
                    paddingVertical: 10, alignItems: 'center', marginBottom: 10 },
  btnAgregarText: { color: Colors.verde, fontWeight: '600' },
  seccionCard:    { backgroundColor: Colors.blanco, borderRadius: 12, borderWidth: 0.5,
                    borderColor: Colors.grisBorde, padding: 14, marginTop: 12 },
  seccionHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  seccionTitulo:  { fontSize: 13, fontWeight: '600', color: '#333' },
  calcBox:        { backgroundColor: Colors.doradoClaro, borderRadius: 8, padding: 10,
                    flexDirection: 'row', justifyContent: 'space-between',
                    borderWidth: 0.5, borderColor: Colors.doradoBorder },
  calcLabel:      { fontSize: 13, color: Colors.tierra },
  calcValor:      { fontSize: 14, fontWeight: '700', color: Colors.tierra },
  ingresoBox:     { backgroundColor: Colors.verdeClaro, borderRadius: 8, padding: 12,
                    flexDirection: 'row', justifyContent: 'space-between', marginTop: 4,
                    borderWidth: 0.5, borderColor: Colors.verdeBorder },
  ingresoLabel:   { fontSize: 14, color: '#333' },
  ingresoValor:   { fontSize: 16, fontWeight: '700', color: Colors.verde },
  estadoBtn:      { borderWidth: 1, borderColor: Colors.grisBorde, borderRadius: 20,
                    paddingVertical: 4, paddingHorizontal: 10, backgroundColor: Colors.blanco },
  estadoBtnText:  { fontSize: 11, color: '#666' },
  dateBtn:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                    borderWidth: 0.5, borderColor: Colors.grisBorde, borderRadius: 8,
                    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8,
                    backgroundColor: Colors.blanco },
  dateBtnText:    { fontSize: 14, color: '#333' },
});

export default ActividadesScreen;