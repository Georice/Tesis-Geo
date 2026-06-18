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
import { Actividad, UnidadManoObra } from '../domain/entities/Actividad';
import { GetActividades }  from '../application/usecases/actividad/GetActividades';
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
type TipoProducto = 'herbicida'|'fungicida'|'insecticida'|'fertilizante'|'abono'|'corrector'|'bioestimulante'|'otro';
type Estado = 'pendiente' | 'en_proceso' | 'completada';

interface Producto {
  nombre: string; tipo: TipoProducto;
  dosis: string; unidad: string;
  dosisPorTanque: string; dosisHa: string;
  dosisPorUnidadMo: string;
  presentacionMl: string;
  precioPresentacion: string;
  precioUnitario: string;
}

const TIPOS: TipoActividad[] = [
  'preparacion_suelo','inundacion','siembra_boleo','siembra_trasplante',
  'riego','fertilizacion','fumigacion','deshierba',
  'rozar_quemar','soca_riego','soca_fertilizacion','soca_fumigacion',
  'cosecha_soca','cosecha','observacion',
];
const TIPO_EMOJI: Record<TipoActividad,string> = {
  preparacion_suelo:'🚜', inundacion:'🌊', siembra_boleo:'🌱', siembra_trasplante:'🌿',
  riego:'💧', fertilizacion:'🌾', fumigacion:'🧪', deshierba:'✂️', cosecha:'🏆',
  rozar_quemar:'🔥', soca_riego:'💧', soca_fertilizacion:'🌾', soca_fumigacion:'🧪',
  cosecha_soca:'🏆', observacion:'📝',
};
const TIPO_LABEL: Record<TipoActividad,string> = {
  preparacion_suelo:'Preparación del Suelo', inundacion:'Inundación',
  siembra_boleo:'Siembra Boleo', siembra_trasplante:'Siembra Trasplante',
  riego:'Riego', fertilizacion:'Fertilización', fumigacion:'Fumigación',
  deshierba:'Deshierba', cosecha:'Cosecha', rozar_quemar:'Rozar / Quemar',
  soca_riego:'Soca Riego', soca_fertilizacion:'Soca Fertilización',
  soca_fumigacion:'Soca Fumigación', cosecha_soca:'Cosecha Soca',
  observacion:'Observación',
};
const ESTADO_COLOR: Record<Estado,string> = {
  pendiente:'#9ca3af', en_proceso:'#3b82f6', completada: Colors.verde,
};
const ESTADO_LABEL: Record<Estado,string> = {
  pendiente:'⏳ Pendiente', en_proceso:'🔵 En proceso', completada:'✅ Completada',
};

const TIPOS_CON_PRODUCTOS: TipoActividad[]  = ['fertilizacion','fumigacion','soca_fertilizacion','soca_fumigacion'];
const TIPOS_CON_TANQUES: TipoActividad[]    = ['fumigacion','soca_fumigacion'];
const TIPOS_COSECHA: TipoActividad[]        = ['cosecha','cosecha_soca'];
const TIPOS_RIEGO: TipoActividad[]          = ['riego','soca_riego','inundacion'];
const TIPOS_SIEMBRA: TipoActividad[]        = ['siembra_boleo','siembra_trasplante'];
const TIPOS_CON_MAQUINARIA: TipoActividad[] = ['preparacion_suelo','rozar_quemar','cosecha','cosecha_soca','fumigacion','soca_fumigacion'];
const TIPOS_PRODUCTO: TipoProducto[]        = ['herbicida','fungicida','insecticida','fertilizante','abono','corrector','bioestimulante','otro'];

const MO_UNIDAD: Partial<Record<TipoActividad, UnidadManoObra>> = {
  fumigacion:'tanque', soca_fumigacion:'tanque',
  fertilizacion:'saco', soca_fertilizacion:'saco',
  siembra_trasplante:'tarea',
};

const METODOS_PREP: string[]    = ['rastra','maquinaria','canguros','palo','manual'];
const METODOS_RIEGO: string[]   = ['inundacion','aspersion','gravedad'];
const METODOS_APLIC: string[]   = ['al voleo','foliar','incorporado','mochila','drone','tractor'];
const METODOS_COSECHA: string[] = ['manual','mecanica'];
const METODOS_SIEMBRA: string[] = ['manual','mecanico'];
const DESTINOS: string[]        = ['piladora','almacen','directo','otro'];
const NIVELES_DANO: string[]    = ['leve','moderado','severo'];
const NIVELES_ALERTA: string[]  = ['normal','alerta','critico'];
const TIPOS_MAQUINARIA: string[] = ['tractor','drone','cosechadora','bomba','otro'];
const UNIDADES_COBRO: Record<string,string[]> = {
  tractor:['hora'], drone:['hectarea'], cosechadora:['saco'], bomba:['hora'],
  otro:['hora','hectarea','saco'],
};

const PRODUCTO_VACIO: Producto = {
  nombre:'', tipo:'herbicida', dosis:'', unidad:'',
  dosisPorTanque:'', dosisHa:'', dosisPorUnidadMo:'',
  presentacionMl:'', precioPresentacion:'', precioUnitario:'',
};

const ORDEN_TIPO: Record<TipoActividad,number> = {
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
  const parcelaAreaHa = parcela?.p_area_ha ?? parcela?.area_ha ?? 0;
  const parcelaNombre = parcela?.p_nombre ?? parcela?.nombre ?? '';

  const [actividades, setActividades]   = useState<Actividad[]>([]);
  const [loading, setLoading]           = useState(false);
  const [vista, setVista]               = useState<Vista>('lista');
  const [actividadSel, setActividadSel] = useState<Actividad | null>(null);
  const [guardando, setGuardando]       = useState(false);
  const [modalTipo, setModalTipo]       = useState(false);

  const [showPickerInicio, setShowPickerInicio] = useState(false);
  const [showPickerFin, setShowPickerFin]       = useState(false);
  const [dateInicio, setDateInicio]             = useState<Date | null>(null);
  const [dateFin, setDateFin]                   = useState<Date | null>(null);

  const [secMaquinaria, setSecMaquinaria] = useState(false);
  const [secManoObra, setSecManoObra]     = useState(false);

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
  const [tipoMaquinaria, setTipoMaquinaria]     = useState('');
  const [unidadCobro, setUnidadCobro]           = useState('');
  const [cantidadUnidades, setCantidadUnidades] = useState('');
  const [costoPorUnidad, setCostoPorUnidad]     = useState('');
  const [unidadManoObra, setUnidadManoObra]     = useState<UnidadManoObra>('jornal');
  const [cantidadUnidadMo, setCantidadUnidadMo] = useState('');
  const [precioUnidadMo, setPrecioUnidadMo]     = useState('');
  const [numTrabajadores, setNumTrabajadores]   = useState('');
  const [descripcionUnidadMo, setDescripcionUnidadMo] = useState('');
  const [precioTarea, setPrecioTarea] = useState('');

  useEffect(() => {
    const u = MO_UNIDAD[tipo] ?? 'jornal';
    setUnidadManoObra(u);
    if (u === 'tanque')       setPrecioUnidadMo('15');
    else if (u === 'saco')    setPrecioUnidadMo('2.50');
    else if (u === 'jornal')  setPrecioUnidadMo('15');
    else                      setPrecioUnidadMo('');
  }, [tipo]);

  const cargar = useCallback(async () => {
    const pid = parcela?.p_id ?? parcela?.id;
    if (!pid) return;
    setLoading(true);
    try {
      const data = await GetActividades(pid);
      const ordenadas = [...data].sort((a, b) => {
        const oe: Record<string,number> = { en_proceso:0, pendiente:1, completada:2 };
        const ea = oe[a.estado ?? 'pendiente'] ?? 1;
        const eb = oe[b.estado ?? 'pendiente'] ?? 1;
        if (ea !== eb) return ea - eb;
        if (a.numeroActividad && b.numeroActividad) return a.numeroActividad - b.numeroActividad;
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
    setTipoMaquinaria(''); setUnidadCobro('');
    setCantidadUnidades(''); setCostoPorUnidad('');
    setUnidadManoObra('jornal'); setCantidadUnidadMo('');
    setPrecioUnidadMo('15'); setNumTrabajadores('');
    setDescripcionUnidadMo(''); setPrecioTarea('');
    setSecMaquinaria(false); setSecManoObra(false);
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
    setDestino(a.destino ?? '');
    setPlagaDetectada(a.plagaDetectada ?? '');
    setNivelDano(a.nivelDano ?? '');
    setNivelAlerta(a.nivelAlerta ?? 'normal');
    setCapacidadTanque(a.capacidadTanque?.toString() ?? '200');
    setNumTanques(a.numTanques?.toString() ?? '');
    setTipoMaquinaria(a.tipoMaquinaria ?? '');
    setUnidadCobro(a.unidadCobro ?? '');
    setCantidadUnidades(a.cantidadUnidades?.toString() ?? '');
    setCostoPorUnidad(a.costoPorUnidad?.toString() ?? '');
    setUnidadManoObra((a.unidadManoObra as UnidadManoObra) ?? (MO_UNIDAD[a.tipo as TipoActividad] ?? 'jornal'));
    setCantidadUnidadMo(a.cantidadUnidadMo?.toString() ?? '');
    setPrecioUnidadMo(a.precioUnidadMo?.toString() ?? '');
    setNumTrabajadores(a.numTrabajadores?.toString() ?? '');
    setDescripcionUnidadMo(a.descripcionUnidadMo ?? '');
    setPrecioTarea(a.precioTarea?.toString() ?? '');
    setSecMaquinaria(!!a.tipoMaquinaria);
    setSecManoObra(!!(a.cantidadUnidadMo || a.numTrabajadores));
    setProductos(a.productos?.length
      ? a.productos.map((p: any) => ({
          nombre:             p.nombre,
          tipo:               p.tipo,
          dosis:              p.dosis?.toString() ?? '',
          unidad:             p.unidad ?? '',
          dosisPorTanque:     p.dosisPorTanque     ? Number(p.dosisPorTanque).toFixed(0)     : '',
          dosisHa:            p.dosisHa            ? Number(p.dosisHa).toFixed(2)            : '',
          dosisPorUnidadMo:   p.dosisPorUnidadMo   ? Number(p.dosisPorUnidadMo).toFixed(2)   : '',
          presentacionMl:     p.presentacionMl     ? String(p.presentacionMl)                : '',
          precioPresentacion: p.precioPresentacion ? Number(p.precioPresentacion).toFixed(2) : '',
          precioUnitario:     p.precioUnitario     ? Number(p.precioUnitario).toFixed(2)     : '',
        }))
      : [{ ...PRODUCTO_VACIO }]);
    setVista('editando');
  };

  const numTareasCalculado = tipo === 'siembra_trasplante' && parcelaAreaHa
    ? (Number(parcelaAreaHa) * 16).toFixed(1) : null;

  // ── Cálculo costo insumos con presentación ────────────────────
  const costoInsumosCalc = productos.reduce((sum, p) => {
    if (!p.precioPresentacion || !p.presentacionMl) return sum;
    const precioUnit = Number(p.precioPresentacion) / (Number(p.presentacionMl) / 1000);
    let cant = 0;
    if (TIPOS_CON_TANQUES.includes(tipo)) {
      cant = p.dosisPorTanque
        ? (Number(p.dosisPorTanque) / 1000) * Number(numTanques || 0) : 0;
    } else {
      cant = p.dosisPorUnidadMo && cantidadUnidadMo
        ? Number(p.dosisPorUnidadMo) * Number(cantidadUnidadMo)
        : (p.dosisHa ? Number(p.dosisHa) : 0);
    }
    return sum + (cant * precioUnit);
  }, 0);

  const costoManoObraCalc = (() => {
    if (tipo === 'siembra_trasplante' && numTareasCalculado && precioTarea)
      return Number(numTareasCalculado) * Number(precioTarea);
    if (cantidadUnidadMo && precioUnidadMo)
      return Number(cantidadUnidadMo) * Number(precioUnidadMo);
    return 0;
  })();

  const costoMaquinariaCalc = cantidadUnidades && costoPorUnidad
    ? Number(cantidadUnidades) * Number(costoPorUnidad) : 0;

  const costoTotalCalc = costoManoObraCalc + costoMaquinariaCalc + costoInsumosCalc;

  const buildPayload = () => {
    const numTareasVal = tipo === 'siembra_trasplante' && parcelaAreaHa
      ? Number((Number(parcelaAreaHa) * 16).toFixed(2)) : undefined;

    return {
      tipo, estado,
      fecha: new Date().toISOString(),
      fechaInicio: dateInicio ? dateInicio.toISOString() : undefined,
      fechaFin:    dateFin    ? dateFin.toISOString()    : undefined,
      metodo:      metodo || undefined,
      insumo:      insumo || undefined,
      cantidad:    cantidad    ? Number(cantidad)    : undefined,
      unidad:      unidad || undefined,
      laminaAgua:  laminaAgua  ? Number(laminaAgua)  : undefined,
      rendimientoHa: rendimientoHa ? Number(rendimientoHa) : undefined,
      totalSacos:  totalSacos  ? Number(totalSacos)  : undefined,
      humedad:     humedad     ? Number(humedad)     : undefined,
      precioQq:    precioQq    ? Number(precioQq)    : undefined,
      costoCosecha: costoCosecha ? Number(costoCosecha) : undefined,
      destino:     destino || undefined,
      plagaDetectada: plagaDetectada || undefined,
      nivelDano:   nivelDano   || undefined,
      nivelAlerta: nivelAlerta || undefined,
      observaciones: observaciones || undefined,
      capacidadTanque: capacidadTanque ? Number(capacidadTanque) : 200,
      numTanques:  numTanques  ? Number(numTanques)  : undefined,
      tipoMaquinaria:   tipoMaquinaria   || undefined,
      unidadCobro:      unidadCobro      || undefined,
      cantidadUnidades: cantidadUnidades ? Number(cantidadUnidades) : undefined,
      costoPorUnidad:   costoPorUnidad   ? Number(costoPorUnidad)   : undefined,
      costoMaquinaria:  costoMaquinariaCalc || undefined,
      unidadManoObra,
      cantidadUnidadMo:    cantidadUnidadMo ? Number(cantidadUnidadMo) : undefined,
      precioUnidadMo:      precioUnidadMo   ? Number(precioUnidadMo)   : undefined,
      numTrabajadores:     numTrabajadores  ? Number(numTrabajadores)  : undefined,
      descripcionUnidadMo: descripcionUnidadMo || undefined,
      costoManoObra:       costoManoObraCalc || undefined,
      numTareas:       numTareasVal,
      precioTarea:     precioTarea ? Number(precioTarea) : undefined,
      costoSembradores: tipo === 'siembra_trasplante' && numTareasVal && precioTarea
        ? numTareasVal * Number(precioTarea) : undefined,
      costoInsumos:        costoInsumosCalc  || undefined,
      costoTotalActividad: costoTotalCalc    || undefined,
      productos: TIPOS_CON_PRODUCTOS.includes(tipo)
        ? productos.filter(p => p.nombre.trim()).map(p => {
            const presentMl    = p.presentacionMl     ? Number(p.presentacionMl)     : null;
            const precioFrasco = p.precioPresentacion ? Number(p.precioPresentacion) : null;
            const precioUnit   = presentMl && precioFrasco
              ? precioFrasco / (presentMl / 1000) : null;

            let dosisTotal: number | undefined;
            if (TIPOS_CON_TANQUES.includes(tipo) && p.dosisPorTanque && numTanques)
              dosisTotal = (Number(p.dosisPorTanque) / 1000) * Number(numTanques);
            else if (p.dosisPorUnidadMo && cantidadUnidadMo)
              dosisTotal = Number(p.dosisPorUnidadMo) * Number(cantidadUnidadMo);
            else if (p.dosisHa)
              dosisTotal = Number(p.dosisHa);

            const frascoUsados = dosisTotal && presentMl
              ? dosisTotal / (presentMl / 1000) : undefined;

            return {
              nombre:             p.nombre.trim(),
              tipo:               p.tipo,
              dosis:              p.dosis             ? Number(p.dosis)             : undefined,
              unidad:             p.unidad            || undefined,
              dosisPorTanque:     p.dosisPorTanque    ? Number(p.dosisPorTanque)    : undefined,
              dosisHa:            p.dosisHa           ? Number(p.dosisHa)           : undefined,
              dosisPorUnidadMo:   p.dosisPorUnidadMo  ? Number(p.dosisPorUnidadMo)  : undefined,
              presentacionMl:     presentMl           ?? undefined,
              precioPresentacion: precioFrasco        ?? undefined,
              precioUnitario:     precioUnit          ? Number(precioUnit.toFixed(4)) : undefined,
              dosisTotal,
              frascoUsados,
              costoTotal: dosisTotal && precioUnit
                ? Number((dosisTotal * precioUnit).toFixed(2)) : undefined,
            };
          })
        : undefined,
    };
  };

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
      <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:10 }}>
        {opciones.map(op => (
          <TouchableOpacity key={op} style={[s.chip, valor===op && s.chipOn]} onPress={() => onChange(op)}>
            <Text style={[s.chipText, valor===op && { color:'#fff' }]}>{op}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );

  const renderInput = (label: string, value: string, onChange: (v: string) => void,
    opts?: { placeholder?: string; numeric?: boolean; multiline?: boolean }) => (
    <>
      <Text style={s.label}>{label}</Text>
      <TextInput style={[s.input, opts?.multiline && { height:70, textAlignVertical:'top' }]}
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
        <Text style={{ fontSize:16 }}>📅</Text>
      </TouchableOpacity>
    </>
  );

  const renderSeccion = (titulo: string, abierta: boolean, toggle: () => void, children: React.ReactNode) => (
    <View style={s.seccionCard}>
      <TouchableOpacity style={s.seccionHeader} onPress={toggle}>
        <Text style={s.seccionTitulo}>{titulo}</Text>
        <Text style={{ color:Colors.grisTexto, fontSize:16 }}>{abierta ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {abierta && <View style={{ marginTop:8 }}>{children}</View>}
    </View>
  );

  const renderManoObra = () => {
    if (tipo === 'siembra_trasplante') {
      return renderSeccion('👷 Sembradores (por tarea)', secManoObra, () => setSecManoObra(v => !v), (
        <>
          <View style={s.calcBox}>
            <Text style={s.calcLabel}>📐 Tareas calculadas:</Text>
            <Text style={s.calcValor}>{numTareasCalculado ?? '—'} tareas ({parcelaAreaHa} ha × 16)</Text>
          </View>
          <View style={{ flexDirection:'row', gap:8, marginTop:8 }}>
            <View style={{ flex:1 }}>
              {renderInput('Precio por tarea ($)', precioTarea, setPrecioTarea, { numeric:true, placeholder:'Ej: 8.00' })}
            </View>
          </View>
          {numTareasCalculado && precioTarea && (
            <View style={s.ingresoBox}>
              <Text style={s.ingresoLabel}>💰 Total al grupo:</Text>
              <Text style={s.ingresoValor}>${(Number(numTareasCalculado) * Number(precioTarea)).toFixed(2)}</Text>
            </View>
          )}
          <Text style={s.noteText}>El líder del grupo se encarga de dividir internamente.</Text>
        </>
      ));
    }

    if (TIPOS_CON_TANQUES.includes(tipo)) {
      return renderSeccion('👷 Mano de obra (por tanque)', secManoObra, () => setSecManoObra(v => !v), (
        <>
          <View style={{ flexDirection:'row', gap:8 }}>
            <View style={{ flex:1 }}>
              {renderInput('N° trabajadores', numTrabajadores, setNumTrabajadores, { numeric:true, placeholder:'Ej: 2' })}
            </View>
            <View style={{ flex:1 }}>
              {renderInput('Total tanques aplicados', cantidadUnidadMo, setCantidadUnidadMo, { numeric:true, placeholder:'Ej: 4' })}
            </View>
          </View>
          {renderInput('$ por tanque', precioUnidadMo, setPrecioUnidadMo, { numeric:true, placeholder:'15.00' })}
          {cantidadUnidadMo && precioUnidadMo && (
            <>
              <View style={s.calcBox}>
                <Text style={s.calcLabel}>Tanques por persona:</Text>
                <Text style={s.calcValor}>
                  {numTrabajadores ? (Number(cantidadUnidadMo)/Number(numTrabajadores)).toFixed(1) : cantidadUnidadMo} tanques
                </Text>
              </View>
              <View style={[s.ingresoBox,{marginTop:6}]}>
                <Text style={s.ingresoLabel}>💰 Total mano de obra:</Text>
                <Text style={s.ingresoValor}>${costoManoObraCalc.toFixed(2)}</Text>
              </View>
              {numTrabajadores && (
                <View style={s.calcBox}>
                  <Text style={s.calcLabel}>Le toca a cada uno:</Text>
                  <Text style={s.calcValor}>${(costoManoObraCalc/Number(numTrabajadores)).toFixed(2)}</Text>
                </View>
              )}
            </>
          )}
        </>
      ));
    }

    if (TIPOS_CON_PRODUCTOS.includes(tipo)) {
      return renderSeccion('👷 Mano de obra (por saco)', secManoObra, () => setSecManoObra(v => !v), (
        <>
          <View style={{ flexDirection:'row', gap:8 }}>
            <View style={{ flex:1 }}>
              {renderInput('N° trabajadores', numTrabajadores, setNumTrabajadores, { numeric:true, placeholder:'Ej: 4' })}
            </View>
            <View style={{ flex:1 }}>
              {renderInput('Total sacos echados', cantidadUnidadMo, setCantidadUnidadMo, { numeric:true, placeholder:'Ej: 25' })}
            </View>
          </View>
          {renderInput('$ por saco', precioUnidadMo, setPrecioUnidadMo, { numeric:true, placeholder:'2.50' })}
          {cantidadUnidadMo && precioUnidadMo && (
            <>
              <View style={s.calcBox}>
                <Text style={s.calcLabel}>Sacos por persona:</Text>
                <Text style={s.calcValor}>
                  {numTrabajadores ? (Number(cantidadUnidadMo)/Number(numTrabajadores)).toFixed(1) : cantidadUnidadMo} sacos
                </Text>
              </View>
              <View style={[s.ingresoBox,{marginTop:6}]}>
                <Text style={s.ingresoLabel}>💰 Total mano de obra:</Text>
                <Text style={s.ingresoValor}>${costoManoObraCalc.toFixed(2)}</Text>
              </View>
              {numTrabajadores && (
                <View style={s.calcBox}>
                  <Text style={s.calcLabel}>Le toca a cada uno:</Text>
                  <Text style={s.calcValor}>${(costoManoObraCalc/Number(numTrabajadores)).toFixed(2)}</Text>
                </View>
              )}
            </>
          )}
        </>
      ));
    }

    return renderSeccion('👷 Mano de obra (jornales)', secManoObra, () => setSecManoObra(v => !v), (
      <>
        <View style={{ flexDirection:'row', gap:8 }}>
          <View style={{ flex:1 }}>
            {renderInput('N° trabajadores', numTrabajadores, setNumTrabajadores, { numeric:true, placeholder:'Ej: 3' })}
          </View>
          <View style={{ flex:1 }}>
            {renderInput('N° días trabajados', cantidadUnidadMo, setCantidadUnidadMo, { numeric:true, placeholder:'Ej: 2' })}
          </View>
        </View>
        {renderInput('Pago por jornal ($)', precioUnidadMo, setPrecioUnidadMo, { numeric:true, placeholder:'15.00' })}
        {cantidadUnidadMo && precioUnidadMo && numTrabajadores && (
          <>
            <View style={s.calcBox}>
              <Text style={s.calcLabel}>Total jornales:</Text>
              <Text style={s.calcValor}>{(Number(numTrabajadores)*Number(cantidadUnidadMo)).toFixed(0)} jornales</Text>
            </View>
            <View style={[s.ingresoBox,{marginTop:6}]}>
              <Text style={s.ingresoLabel}>💰 Total mano de obra:</Text>
              <Text style={s.ingresoValor}>${costoManoObraCalc.toFixed(2)}</Text>
            </View>
            <View style={s.calcBox}>
              <Text style={s.calcLabel}>Le toca a cada uno:</Text>
              <Text style={s.calcValor}>${(Number(cantidadUnidadMo)*Number(precioUnidadMo)).toFixed(2)}</Text>
            </View>
          </>
        )}
        {unidadManoObra === 'otro' && renderInput('Descripción', descripcionUnidadMo, setDescripcionUnidadMo)}
      </>
    ));
  };

  const renderModalTipo = () => (
    <Modal visible={modalTipo} transparent animationType="slide">
      <View style={s.modalOverlay}>
        <View style={s.modalBox}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitulo}>Seleccionar tipo</Text>
            <TouchableOpacity onPress={() => setModalTipo(false)}>
              <Text style={{ color:Colors.rojo, fontSize:16, fontWeight:'600' }}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView>
            {TIPOS.map(t => (
              <TouchableOpacity key={t} style={[s.modalItem, tipo===t && s.modalItemOn]}
                onPress={() => { setTipo(t); setModalTipo(false); }}>
                <Text style={s.modalItemEmoji}>{TIPO_EMOJI[t]}</Text>
                <Text style={[s.modalItemText, tipo===t && { color:Colors.verde, fontWeight:'600' }]}>
                  {TIPO_LABEL[t]}
                </Text>
                {tipo === t && <Text style={{ color:Colors.verde }}>✓</Text>}
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
        ? <ActivityIndicator size="large" color={Colors.verde} style={{ marginTop:40 }} />
        : actividades.length === 0
          ? <View style={s.vacio}><Text style={s.vacioText}>No hay actividades registradas</Text></View>
          : <FlatList
              data={actividades}
              keyExtractor={a => `${a.id}-${a.estado}`}
              extraData={actividades}
              renderItem={({ item }) => {
                const est = (item.estado ?? 'pendiente') as Estado;
                return (
                  <View style={[s.card,{borderLeftWidth:4,borderLeftColor:ESTADO_COLOR[est]}]}>
                    <View style={s.cardRow}>
                      <View style={s.numBadge}>
                        <Text style={s.numText}>#{item.numeroActividad ?? '—'}</Text>
                      </View>
                      <Text style={s.emoji}>{TIPO_EMOJI[item.tipo as TipoActividad] ?? '📌'}</Text>
                      <View style={{ flex:1 }}>
                        <Text style={s.cardTitulo}>{TIPO_LABEL[item.tipo as TipoActividad] ?? item.tipo}</Text>
                        {item.fechaInicio && (
                          <Text style={s.cardSub}>
                            📅 {item.fechaInicio?.split('T')[0]}
                            {item.fechaFin ? ` → ${item.fechaFin?.split('T')[0]}` : ''}
                          </Text>
                        )}
                        {item.metodo     && <Text style={s.cardMeta}>Método: {item.metodo}</Text>}
                        {item.laminaAgua && <Text style={s.cardMeta}>💧 Lámina: {item.laminaAgua} cm</Text>}
                        {item.numTanques && <Text style={s.cardMeta}>🪣 {Number(item.numTanques).toFixed(1)} tanques × {Number(item.capacidadTanque ?? 200).toFixed(0)}L</Text>}
                        {/* Mano de obra */}
                        {item.unidadManoObra==='tarea'  && item.numTareas    && <Text style={s.cardMeta}>👷 {Number(item.numTareas).toFixed(1)} tareas × ${Number(item.precioTarea).toFixed(2)}/tarea</Text>}
                        {item.unidadManoObra==='tanque' && item.cantidadUnidadMo && <Text style={s.cardMeta}>👷 {item.numTrabajadores ?? '?'} pers. · {Number(item.cantidadUnidadMo).toFixed(1)} tanques × ${Number(item.precioUnidadMo).toFixed(2)}</Text>}
                        {item.unidadManoObra==='saco'   && item.cantidadUnidadMo && <Text style={s.cardMeta}>👷 {item.numTrabajadores ?? '?'} pers. · {Number(item.cantidadUnidadMo).toFixed(0)} sacos × ${Number(item.precioUnidadMo).toFixed(2)}</Text>}
                        {item.unidadManoObra==='jornal' && item.cantidadUnidadMo && <Text style={s.cardMeta}>👷 {item.numTrabajadores ?? '?'} pers. · {Number(item.cantidadUnidadMo).toFixed(0)} días × ${Number(item.precioUnidadMo).toFixed(2)}</Text>}
                        {item.costoManoObra && <Text style={[s.cardMeta,{color:Colors.tierra}]}>💰 Mano obra: ${Number(item.costoManoObra).toFixed(2)}</Text>}
                        {/* Maquinaria */}
                        {item.tipoMaquinaria && <Text style={s.cardMeta}>🚜 {item.tipoMaquinaria}: {Number(item.cantidadUnidades).toFixed(1)} {item.unidadCobro} × ${Number(item.costoPorUnidad).toFixed(2)}</Text>}
                        {item.costoMaquinaria && <Text style={[s.cardMeta,{color:Colors.tierra}]}>⚙️ Maquinaria: ${Number(item.costoMaquinaria).toFixed(2)}</Text>}
                        {/* Insumos con desglose */}
                        {(item.productos?.length ?? 0) > 0 && (() => {
                          let totalIns = 0;
                          const lineas = (item.productos ?? []).map((p: any, idx: number) => {
                            if (!p.precioUnitario || !p.dosisTotal) return null;
                            const costo = Number(p.dosisTotal) * Number(p.precioUnitario);
                            totalIns += costo;
                            const esTanque = !!p.dosisPorTanque;
                            const detalle = esTanque
                              ? `${Number(p.dosisPorTanque).toFixed(0)}cc × ${Number(item.numTanques ?? 0).toFixed(1)} tanques = ${(Number(p.dosisTotal)*1000).toFixed(0)}cc = ${Number(p.dosisTotal).toFixed(2)}L × $${Number(p.precioUnitario).toFixed(2)}/L`
                              : `${Number(p.dosisPorUnidadMo ?? 0).toFixed(1)}kg × ${Number(item.cantidadUnidadMo ?? 0).toFixed(0)} sacos = ${Number(p.dosisTotal).toFixed(1)}kg × $${Number(p.precioUnitario).toFixed(2)}/kg`;
                            const frascos = p.frascoUsados
                              ? ` · ${Number(p.frascoUsados).toFixed(2)} ${esTanque ? 'frascos' : 'sacos'}`
                              : '';
                            return (
                              <View key={idx} style={{ marginTop:3 }}>
                                <Text style={[s.cardMeta,{fontWeight:'600'}]}>🧪 {p.nombre}</Text>
                                <Text style={[s.cardMeta,{color:'#666',fontSize:11}]}>{detalle}{frascos}</Text>
                                <Text style={[s.cardMeta,{color:Colors.tierra}]}>= ${costo.toFixed(2)}</Text>
                              </View>
                            );
                          }).filter(Boolean);
                          return lineas.length > 0 ? (
                            <>
                              {lineas}
                              <Text style={[s.cardMeta,{color:Colors.tierra,fontWeight:'700',marginTop:4}]}>
                                🧴 Total insumos: ${totalIns.toFixed(2)}
                              </Text>
                            </>
                          ) : null;
                        })()}
                        {/* Cosecha */}
                        {item.totalSacos   && <Text style={s.cardMeta}>📦 {Number(item.totalSacos).toFixed(0)} qq</Text>}
                        {item.ingresoTotal && <Text style={[s.cardMeta,{color:Colors.verde,fontWeight:'700'}]}>💵 Ingreso: ${Number(item.ingresoTotal).toFixed(2)}</Text>}
                        {/* Plagas */}
                        {item.plagaDetectada && <Text style={[s.cardMeta,{color:Colors.rojo}]}>🐛 {item.plagaDetectada} — {item.nivelDano}</Text>}
                        {item.observaciones && <Text style={s.cardMeta}>📝 {item.observaciones}</Text>}
                        {/* Costo total */}
                        {(() => {
                          const mo  = Number(item.costoManoObra   ?? 0);
                          const maq = Number(item.costoMaquinaria ?? 0);
                          const ins = (item.productos ?? []).reduce((sum: number, p: any) => {
                            if (!p.precioUnitario || !p.dosisTotal) return sum;
                            return sum + Number(p.dosisTotal) * Number(p.precioUnitario);
                          }, 0);
                          const total = mo + maq + ins;
                          return total > 0 ? (
                            <View style={[s.calcBox,{marginTop:6}]}>
                              <Text style={s.calcLabel}>💰 COSTO TOTAL:</Text>
                              <Text style={s.calcValor}>${total.toFixed(2)}</Text>
                            </View>
                          ) : null;
                        })()}
                        {/* Badge estado */}
                        <TouchableOpacity
                          style={[s.estadoBtn,{backgroundColor:ESTADO_COLOR[est],borderColor:ESTADO_COLOR[est],marginTop:8,alignSelf:'flex-start'}]}
                          onPress={() => {
                            const sig: Record<Estado,Estado> = { pendiente:'en_proceso', en_proceso:'completada', completada:'pendiente' };
                            cambiarEstadoRapido(item, sig[est]);
                          }}>
                          <Text style={[s.estadoBtnText,{color:'#fff'}]}>{ESTADO_LABEL[est]}</Text>
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
      }
    </>
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

      <Text style={s.label}>Estado</Text>
      <View style={{ flexDirection:'row', gap:8, marginBottom:10, flexWrap:'wrap' }}>
        {(['pendiente','en_proceso','completada'] as Estado[]).map(e => (
          <TouchableOpacity key={e}
            style={[s.chip, estado===e && { backgroundColor:ESTADO_COLOR[e], borderColor:ESTADO_COLOR[e] }]}
            onPress={() => setEstado(e)}>
            <Text style={[s.chipText, estado===e && { color:'#fff' }]}>{ESTADO_LABEL[e]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flexDirection:'row', gap:8 }}>
        <View style={{ flex:1 }}>{renderDatePicker('📅 Fecha inicio', dateInicio, () => setShowPickerInicio(true))}</View>
        <View style={{ flex:1 }}>{renderDatePicker('📅 Fecha fin',    dateFin,    () => setShowPickerFin(true))}</View>
      </View>
      {showPickerInicio && (
        <DateTimePicker value={dateInicio ?? new Date()} mode="date" display="default"
          onChange={(_, d) => { setShowPickerInicio(false); if (d) setDateInicio(d); }} />
      )}
      {showPickerFin && (
        <DateTimePicker value={dateFin ?? new Date()} mode="date" display="default"
          onChange={(_, d) => { setShowPickerFin(false); if (d) setDateFin(d); }} />
      )}

      {(tipo==='preparacion_suelo'||tipo==='rozar_quemar') && renderChips(METODOS_PREP, metodo, setMetodo, 'Método')}

      {TIPOS_SIEMBRA.includes(tipo) && (
        <>
          {renderChips(METODOS_SIEMBRA, metodo, setMetodo, 'Método')}
          {tipo==='siembra_boleo' && (
            <>
              {renderInput('Variedad / Insumo', insumo, setInsumo, { placeholder:'Ej: IR-42' })}
              {renderInput('Cantidad (kg)', cantidad, setCantidad, { numeric:true })}
            </>
          )}
        </>
      )}

      {TIPOS_RIEGO.includes(tipo) && (
        <>
          {renderChips(METODOS_RIEGO, metodo, setMetodo, 'Tipo de riego')}
          {renderInput('Lámina de agua (cm)', laminaAgua, setLaminaAgua, { numeric:true })}
          {renderInput('Duración (horas)', cantidad, setCantidad, { numeric:true })}
        </>
      )}

      {/* Productos */}
      {TIPOS_CON_PRODUCTOS.includes(tipo) && (
        <>
          {renderChips(METODOS_APLIC, metodo, setMetodo, 'Método aplicación')}
          <Text style={s.label}>Productos *</Text>
          {productos.map((prod, i) => (
            <View key={i} style={s.prodCard}>
              <View style={s.prodHeader}>
                <Text style={s.prodNum}>Producto {i + 1}</Text>
                {productos.length > 1 && (
                  <TouchableOpacity onPress={() => setProductos(p => p.filter((_,idx) => idx !== i))}>
                    <Text style={{ color:Colors.rojo, fontSize:12 }}>✕ Quitar</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Nombre */}
              <TextInput style={s.input} value={prod.nombre}
                onChangeText={v => setProductos(p => p.map((x,idx) => idx===i ? {...x,nombre:v} : x))}
                placeholder="Nombre del producto" placeholderTextColor="#aaa" />

              {/* Tipo */}
              <View style={{ flexDirection:'row', flexWrap:'wrap', gap:6, marginBottom:8 }}>
                {TIPOS_PRODUCTO.map(tp => (
                  <TouchableOpacity key={tp} style={[s.chip, prod.tipo===tp && s.chipOn]}
                    onPress={() => setProductos(p => p.map((x,idx) => idx===i ? {...x,tipo:tp} : x))}>
                    <Text style={[s.chipText, prod.tipo===tp && { color:'#fff' }]}>{tp}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Dosis */}
              <View style={{ flexDirection:'row', gap:8 }}>
                {TIPOS_CON_TANQUES.includes(tipo) ? (
                  <View style={{ flex:1 }}>
                    <Text style={s.labelSmall}>Dosis/tanque (cc)</Text>
                    <TextInput style={s.input} value={prod.dosisPorTanque}
                      onChangeText={v => setProductos(p => p.map((x,idx) => idx===i ? {...x,dosisPorTanque:v} : x))}
                      placeholder="Ej: 500" placeholderTextColor="#aaa" keyboardType="numeric" />
                  </View>
                ) : (
                  <View style={{ flex:1 }}>
                    <Text style={s.labelSmall}>Dosis/saco echado (kg)</Text>
                    <TextInput style={s.input} value={prod.dosisPorUnidadMo}
                      onChangeText={v => setProductos(p => p.map((x,idx) => idx===i ? {...x,dosisPorUnidadMo:v} : x))}
                      placeholder="Ej: 2" placeholderTextColor="#aaa" keyboardType="numeric" />
                  </View>
                )}
                <View style={{ flex:1 }}>
                  <Text style={s.labelSmall}>Unidad</Text>
                  <TextInput style={s.input} value={prod.unidad}
                    onChangeText={v => setProductos(p => p.map((x,idx) => idx===i ? {...x,unidad:v} : x))}
                    placeholder={TIPOS_CON_TANQUES.includes(tipo) ? 'cc' : 'kg'} placeholderTextColor="#aaa" />
                </View>
              </View>

              {/* Presentación y precio */}
              <View style={{ flexDirection:'row', gap:8 }}>
                <View style={{ flex:1 }}>
                  <Text style={s.labelSmall}>
                    {TIPOS_CON_TANQUES.includes(tipo) ? 'Presentación (ml)' : 'Presentación (g ej:50000=50kg)'}
                  </Text>
                  <TextInput style={s.input} value={prod.presentacionMl}
                    onChangeText={v => setProductos(p => p.map((x,idx) => idx===i ? {...x,presentacionMl:v} : x))}
                    placeholder={TIPOS_CON_TANQUES.includes(tipo) ? 'Ej: 1000' : 'Ej: 50000'}
                    placeholderTextColor="#aaa" keyboardType="numeric" />
                </View>
                <View style={{ flex:1 }}>
                  <Text style={s.labelSmall}>Precio frasco/saco ($)</Text>
                  <TextInput style={s.input} value={prod.precioPresentacion}
                    onChangeText={v => setProductos(p => p.map((x,idx) => idx===i ? {...x,precioPresentacion:v} : x))}
                    placeholder="Ej: 17.00" placeholderTextColor="#aaa" keyboardType="numeric" />
                </View>
              </View>

              {/* Precio unitario calculado */}
              {prod.presentacionMl && prod.precioPresentacion && (
                <View style={s.calcBox}>
                  <Text style={s.calcLabel}>
                    {TIPOS_CON_TANQUES.includes(tipo) ? '$/L calculado:' : '$/kg calculado:'}
                  </Text>
                  <Text style={s.calcValor}>
                    ${(Number(prod.precioPresentacion)/(Number(prod.presentacionMl)/1000)).toFixed(2)}
                  </Text>
                </View>
              )}

              {/* Desglose y costo */}
              {prod.precioPresentacion && prod.presentacionMl &&
               (prod.dosisPorTanque || prod.dosisPorUnidadMo) &&
               (numTanques || cantidadUnidadMo) && (() => {
                const precioUnit = Number(prod.precioPresentacion)/(Number(prod.presentacionMl)/1000);
                let cant = 0; let detalle = ''; let frascosTxt = '';
                if (TIPOS_CON_TANQUES.includes(tipo) && prod.dosisPorTanque && numTanques) {
                  cant = (Number(prod.dosisPorTanque)/1000)*Number(numTanques);
                  const f = cant/(Number(prod.presentacionMl)/1000);
                  detalle = `${Number(prod.dosisPorTanque).toFixed(0)}cc × ${numTanques} tanq = ${(cant*1000).toFixed(0)}cc = ${cant.toFixed(2)}L`;
                  frascosTxt = ` · ${f.toFixed(2)} frascos de ${prod.presentacionMl}ml`;
                } else if (prod.dosisPorUnidadMo && cantidadUnidadMo) {
                  cant = Number(prod.dosisPorUnidadMo)*Number(cantidadUnidadMo);
                  const f = cant/(Number(prod.presentacionMl)/1000);
                  detalle = `${Number(prod.dosisPorUnidadMo).toFixed(1)}kg × ${cantidadUnidadMo} sacos = ${cant.toFixed(1)}kg`;
                  frascosTxt = ` · ${f.toFixed(2)} sacos de ${Number(prod.presentacionMl)/1000}kg`;
                }
                const costo = cant*precioUnit;
                return (
                  <>
                    <Text style={[s.noteText,{marginTop:4}]}>{detalle}{frascosTxt}</Text>
                    <View style={[s.calcBox,{marginTop:4}]}>
                      <Text style={s.calcLabel}>Costo {prod.nombre||'producto'}:</Text>
                      <Text style={s.calcValor}>${costo.toFixed(2)}</Text>
                    </View>
                  </>
                );
              })()}
            </View>
          ))}
          <TouchableOpacity style={s.btnAgregar} onPress={() => setProductos(p => [...p, { ...PRODUCTO_VACIO }])}>
            <Text style={s.btnAgregarText}>+ Agregar producto</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Tanques */}
      {TIPOS_CON_TANQUES.includes(tipo) && (
        <View style={s.seccionCard}>
          <Text style={s.seccionTitulo}>🪣 Datos del tanque</Text>
          <View style={{ flexDirection:'row', gap:8 }}>
            <View style={{ flex:1 }}>
              {renderInput('Capacidad (L)', capacidadTanque, setCapacidadTanque, { numeric:true, placeholder:'200' })}
            </View>
            <View style={{ flex:1 }}>
              {renderInput('Nº tanques', numTanques, setNumTanques, { numeric:true, placeholder:'Ej: 4' })}
            </View>
          </View>
          {capacidadTanque && numTanques && (
            <View style={s.calcBox}>
              <Text style={s.calcLabel}>Total aplicado:</Text>
              <Text style={s.calcValor}>{(Number(capacidadTanque)*Number(numTanques)).toFixed(0)} L</Text>
            </View>
          )}
        </View>
      )}

      {tipo==='deshierba' && renderChips(['manual','quimica'], metodo, setMetodo, 'Método')}

      {/* Cosecha */}
      {TIPOS_COSECHA.includes(tipo) && (
        <>
          {renderChips(METODOS_COSECHA, metodo, setMetodo, 'Método cosecha')}
          {renderInput('Rendimiento (t/ha)', rendimientoHa, setRendimientoHa, { numeric:true })}
          {renderInput('Total sacos (qq)', totalSacos, setTotalSacos, { numeric:true })}
          {renderInput('Humedad (%)', humedad, setHumedad, { numeric:true })}
          {renderInput('Precio por quintal ($)', precioQq, setPrecioQq, { numeric:true })}
          {renderInput('Costo de cosecha ($)', costoCosecha, setCostoCosecha, { numeric:true })}
          {renderChips(DESTINOS, destino, setDestino, 'Destino')}
          {totalSacos && precioQq && (
            <View style={s.ingresoBox}>
              <Text style={s.ingresoLabel}>💰 Ingreso estimado:</Text>
              <Text style={s.ingresoValor}>${(Number(totalSacos)*Number(precioQq)).toFixed(2)}</Text>
            </View>
          )}
        </>
      )}

      {(tipo==='fumigacion'||tipo==='soca_fumigacion'||tipo==='observacion') && (
        <>
          {renderInput('Plaga detectada', plagaDetectada, setPlagaDetectada, { placeholder:'Ej: sogata' })}
          {plagaDetectada ? renderChips(NIVELES_DANO, nivelDano, setNivelDano, 'Nivel de daño') : null}
        </>
      )}
      {tipo==='observacion' && renderChips(NIVELES_ALERTA, nivelAlerta, setNivelAlerta, 'Nivel de alerta')}

      {/* Maquinaria */}
      {TIPOS_CON_MAQUINARIA.includes(tipo) && renderSeccion('🚜 Maquinaria', secMaquinaria, () => setSecMaquinaria(v => !v), (
        <>
          {renderChips(TIPOS_MAQUINARIA, tipoMaquinaria, (v) => {
            setTipoMaquinaria(v);
            const u = UNIDADES_COBRO[v];
            if (u?.length===1) setUnidadCobro(u[0]); else setUnidadCobro('');
          }, 'Tipo')}
          {tipoMaquinaria && (
            <>
              {renderChips(UNIDADES_COBRO[tipoMaquinaria]??['hora','hectarea','saco'], unidadCobro, setUnidadCobro, 'Unidad de cobro')}
              <View style={{ flexDirection:'row', gap:8 }}>
                <View style={{ flex:1 }}>{renderInput(`Cantidad (${unidadCobro||'u'})`, cantidadUnidades, setCantidadUnidades, { numeric:true })}</View>
                <View style={{ flex:1 }}>{renderInput(`$ por ${unidadCobro||'u'}`, costoPorUnidad, setCostoPorUnidad, { numeric:true })}</View>
              </View>
              {cantidadUnidades && costoPorUnidad && (
                <View style={s.calcBox}>
                  <Text style={s.calcLabel}>⚙️ Costo maquinaria:</Text>
                  <Text style={s.calcValor}>${costoMaquinariaCalc.toFixed(2)}</Text>
                </View>
              )}
            </>
          )}
        </>
      ))}

      {renderManoObra()}

      {/* Resumen */}
      {costoTotalCalc > 0 && (
        <View style={[s.seccionCard,{backgroundColor:Colors.verdeClaro,borderColor:Colors.verdeBorder}]}>
          <Text style={[s.seccionTitulo,{color:Colors.verde,marginBottom:8}]}>💰 Resumen de costos</Text>
          {costoManoObraCalc   > 0 && <Text style={s.resumenFila}>👷 Mano de obra:  ${costoManoObraCalc.toFixed(2)}</Text>}
          {costoMaquinariaCalc > 0 && <Text style={s.resumenFila}>🚜 Maquinaria:    ${costoMaquinariaCalc.toFixed(2)}</Text>}
          {costoInsumosCalc    > 0 && <Text style={s.resumenFila}>🧴 Insumos:       ${costoInsumosCalc.toFixed(2)}</Text>}
          <View style={[s.calcBox,{marginTop:6}]}>
            <Text style={[s.calcLabel,{fontSize:14,fontWeight:'700'}]}>TOTAL ACTIVIDAD:</Text>
            <Text style={[s.calcValor,{fontSize:16}]}>${costoTotalCalc.toFixed(2)}</Text>
          </View>
        </View>
      )}

      {renderInput('Observaciones', observaciones, setObservaciones, { multiline:true, placeholder:'Notas...' })}

      <TouchableOpacity
        style={[s.btnPrimario,{marginTop:20,marginBottom:30},guardando&&{opacity:0.5}]}
        onPress={esEdicion ? handleActualizar : handleCrear}
        disabled={guardando}>
        <Text style={[s.btnText,{textAlign:'center'}]}>
          {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Registrar actividad'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS==='ios' ? 'padding' : 'height'}>
      <View style={s.container}>
        {renderModalTipo()}
        {vista==='lista'    && renderLista()}
        {vista==='nueva'    && renderFormulario(false)}
        {vista==='editando' && renderFormulario(true)}
      </View>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  container:     { flex:1, backgroundColor:Colors.grisFondo, paddingHorizontal:16, paddingTop:12 },
  header:        { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 },
  titulo:        { fontSize:20, fontWeight:'600', color:'#1a2b16' },
  link:          { fontSize:14, color:Colors.verde, fontWeight:'500' },
  btnPrimario:   { backgroundColor:Colors.verde, borderRadius:10, paddingVertical:12, paddingHorizontal:20 },
  btnText:       { color:'#fff', fontWeight:'600', fontSize:14 },
  card:          { backgroundColor:Colors.blanco, borderRadius:12, padding:14, marginBottom:10, borderWidth:0.5, borderColor:Colors.grisBorde },
  cardRow:       { flexDirection:'row', alignItems:'flex-start', gap:10 },
  numBadge:      { backgroundColor:Colors.verde, borderRadius:6, paddingHorizontal:6, paddingVertical:2, alignSelf:'flex-start' },
  numText:       { color:'#fff', fontSize:11, fontWeight:'700' },
  emoji:         { fontSize:26, marginTop:2 },
  cardTitulo:    { fontSize:15, fontWeight:'600', color:'#1a2b16' },
  cardSub:       { fontSize:12, color:Colors.grisTexto, marginTop:2 },
  cardMeta:      { fontSize:12, color:'#444', marginTop:2 },
  iconBtn:       { padding:4, marginBottom:2 },
  vacio:         { flex:1, justifyContent:'center', alignItems:'center', marginTop:60 },
  vacioText:     { fontSize:15, color:'#999' },
  label:         { fontSize:13, fontWeight:'500', color:'#444', marginBottom:4, marginTop:12 },
  labelSmall:    { fontSize:11, fontWeight:'500', color:'#666', marginBottom:3 },
  noteText:      { fontSize:11, color:Colors.grisTexto, fontStyle:'italic', marginTop:4 },
  input:         { borderWidth:0.5, borderColor:Colors.grisBorde, borderRadius:8, paddingHorizontal:12, paddingVertical:10, marginBottom:8, fontSize:15, backgroundColor:Colors.blanco },
  chip:          { borderWidth:0.5, borderColor:Colors.grisBorde, borderRadius:20, paddingVertical:6, paddingHorizontal:14, backgroundColor:Colors.blanco },
  chipOn:        { backgroundColor:Colors.verde, borderColor:Colors.verde },
  chipText:      { fontSize:13, color:'#444' },
  dropdown:      { flexDirection:'row', alignItems:'center', backgroundColor:Colors.blanco, borderWidth:0.5, borderColor:Colors.grisBorde, borderRadius:10, paddingHorizontal:14, paddingVertical:14, marginBottom:8, gap:10 },
  dropdownEmoji: { fontSize:20 },
  dropdownText:  { flex:1, fontSize:15, color:'#1a2b16', fontWeight:'500' },
  dropdownArrow: { fontSize:12, color:Colors.grisTexto },
  modalOverlay:  { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'flex-end' },
  modalBox:      { backgroundColor:Colors.blanco, borderTopLeftRadius:20, borderTopRightRadius:20, maxHeight:'75%', paddingBottom:30 },
  modalHeader:   { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:16, borderBottomWidth:0.5, borderBottomColor:Colors.grisBorde },
  modalTitulo:   { fontSize:16, fontWeight:'600', color:'#1a2b16' },
  modalItem:     { flexDirection:'row', alignItems:'center', gap:12, paddingHorizontal:16, paddingVertical:14, borderBottomWidth:0.5, borderBottomColor:Colors.grisBorde },
  modalItemOn:   { backgroundColor:Colors.verdeClaro },
  modalItemEmoji:{ fontSize:22 },
  modalItemText: { flex:1, fontSize:15, color:'#333' },
  prodCard:      { backgroundColor:Colors.blanco, borderRadius:10, padding:12, marginBottom:10, borderWidth:0.5, borderColor:Colors.grisBorde },
  prodHeader:    { flexDirection:'row', justifyContent:'space-between', marginBottom:8 },
  prodNum:       { fontSize:13, fontWeight:'600', color:'#333' },
  btnAgregar:    { borderWidth:0.5, borderColor:Colors.verde, borderRadius:8, paddingVertical:10, alignItems:'center', marginBottom:10 },
  btnAgregarText:{ color:Colors.verde, fontWeight:'600' },
  seccionCard:   { backgroundColor:Colors.blanco, borderRadius:12, borderWidth:0.5, borderColor:Colors.grisBorde, padding:14, marginTop:12 },
  seccionHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  seccionTitulo: { fontSize:13, fontWeight:'600', color:'#333' },
  calcBox:       { backgroundColor:Colors.doradoClaro, borderRadius:8, padding:10, flexDirection:'row', justifyContent:'space-between', borderWidth:0.5, borderColor:Colors.doradoBorder },
  calcLabel:     { fontSize:13, color:Colors.tierra },
  calcValor:     { fontSize:14, fontWeight:'700', color:Colors.tierra },
  ingresoBox:    { backgroundColor:Colors.verdeClaro, borderRadius:8, padding:12, flexDirection:'row', justifyContent:'space-between', marginTop:4, borderWidth:0.5, borderColor:Colors.verdeBorder },
  ingresoLabel:  { fontSize:14, color:'#333' },
  ingresoValor:  { fontSize:16, fontWeight:'700', color:Colors.verde },
  resumenFila:   { fontSize:13, color:'#333', marginBottom:4 },
  estadoBtn:     { borderWidth:1, borderColor:Colors.grisBorde, borderRadius:20, paddingVertical:4, paddingHorizontal:10, backgroundColor:Colors.blanco },
  estadoBtnText: { fontSize:11, color:'#666' },
  dateBtn:       { flexDirection:'row', justifyContent:'space-between', alignItems:'center', borderWidth:0.5, borderColor:Colors.grisBorde, borderRadius:8, paddingHorizontal:12, paddingVertical:10, marginBottom:8, backgroundColor:Colors.blanco },
  dateBtnText:   { fontSize:14, color:'#333' },
});

export default ActividadesScreen;