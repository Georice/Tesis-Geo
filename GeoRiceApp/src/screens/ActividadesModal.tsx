import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, FlatList,
  StyleSheet, Alert, ActivityIndicator, Modal, ScrollView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Actividad } from '../domain/entities/Actividad';
import { GetActividades } from '../application/usecases/actividad/GetActividades';
import { CreateActividad } from '../application/usecases/actividad/CreateActividad';
import { UpdateActividad } from '../application/usecases/actividad/UpdateActividad';
import { DeleteActividad } from '../application/usecases/actividad/DeleteActividad';

interface Props {
  visible: boolean;
  parcela: any;
  onClose: () => void;
}

type Vista = 'lista' | 'nueva' | 'editando';

type TipoActividad =
  | 'preparacion_suelo' | 'inundacion' | 'siembra_boleo' | 'siembra_trasplante'
  | 'riego' | 'fertilizacion' | 'fumigacion' | 'deshierba' | 'cosecha'
  | 'rozar_quemar' | 'soca_riego' | 'soca_fertilizacion' | 'soca_fumigacion'
  | 'cosecha_soca' | 'observacion';

type TipoProducto = 'herbicida' | 'fungicida' | 'insecticida' | 'fertilizante' | 'abono' | 'corrector' | 'bioestimulante' | 'otro';

interface Producto {
  nombre: string;
  tipo: TipoProducto;
  dosis: string;
  unidad: string;
}

const TIPOS: TipoActividad[] = [
  'preparacion_suelo', 'inundacion', 'siembra_boleo', 'siembra_trasplante',
  'riego', 'fertilizacion', 'fumigacion', 'deshierba', 'cosecha',
  'rozar_quemar', 'soca_riego', 'soca_fertilizacion', 'soca_fumigacion',
  'cosecha_soca', 'observacion',
];

const TIPO_EMOJI: Record<TipoActividad, string> = {
  preparacion_suelo:   '🚜',
  inundacion:          '🌊',
  siembra_boleo:       '🌱',
  siembra_trasplante:  '🌿',
  riego:               '💧',
  fertilizacion:       '🌾',
  fumigacion:          '🧪',
  deshierba:           '✂️',
  cosecha:             '🏆',
  rozar_quemar:        '🔥',
  soca_riego:          '💧',
  soca_fertilizacion:  '🌾',
  soca_fumigacion:     '🧪',
  cosecha_soca:        '🏆',
  observacion:         '📝',
};

const TIPO_LABEL: Record<TipoActividad, string> = {
  preparacion_suelo:   'Prep. Suelo',
  inundacion:          'Inundación',
  siembra_boleo:       'Siembra Boleo',
  siembra_trasplante:  'Trasplante',
  riego:               'Riego',
  fertilizacion:       'Fertilización',
  fumigacion:          'Fumigación',
  deshierba:           'Deshierba',
  cosecha:             'Cosecha',
  rozar_quemar:        'Rozar/Quemar',
  soca_riego:          'Soca Riego',
  soca_fertilizacion:  'Soca Fertil.',
  soca_fumigacion:     'Soca Fumig.',
  cosecha_soca:        'Cosecha Soca',
  observacion:         'Observación',
};

const TIPOS_CON_PRODUCTOS: TipoActividad[] = [
  'fertilizacion', 'fumigacion', 'soca_fertilizacion', 'soca_fumigacion',
];

const TIPOS_COSECHA: TipoActividad[] = ['cosecha', 'cosecha_soca'];

const TIPOS_RIEGO: TipoActividad[] = ['riego', 'soca_riego', 'inundacion'];

const TIPOS_SIEMBRA: TipoActividad[] = ['siembra_boleo', 'siembra_trasplante'];

const TIPOS_PRODUCTO: TipoProducto[] = [
  'herbicida', 'fungicida', 'insecticida', 'fertilizante', 'abono', 'corrector', 'bioestimulante', 'otro',
];

const METODOS_PREP: string[]    = ['rastra', 'maquinaria', 'canguros', 'palo', 'manual'];
const METODOS_RIEGO: string[]   = ['inundacion', 'aspersion', 'gravedad'];
const METODOS_APLIC: string[]   = ['al voleo', 'foliar', 'incorporado', 'mochila', 'drone', 'tractor'];
const METODOS_COSECHA: string[] = ['manual', 'mecanica'];
const METODOS_SIEMBRA: string[] = ['manual', 'mecanico'];
const DESTINOS: string[]        = ['piladora', 'almacen', 'directo', 'otro'];
const NIVELES_DANO: string[]    = ['leve', 'moderado', 'severo'];
const NIVELES_ALERTA: string[]  = ['normal', 'alerta', 'critico'];

const PRODUCTO_VACIO: Producto = { nombre: '', tipo: 'herbicida', dosis: '', unidad: 'L/ha' };

const ActividadesModal: React.FC<Props> = ({ visible, parcela, onClose }) => {
  const [actividades, setActividades]                     = useState<Actividad[]>([]);
  const [loading, setLoading]                             = useState(false);
  const [vista, setVista]                                 = useState<Vista>('lista');
  const [actividadSeleccionada, setActividadSeleccionada] = useState<Actividad | null>(null);
  const [guardando, setGuardando]                         = useState(false);

  // Campos comunes
  const [tipo, setTipo]               = useState<TipoActividad>('preparacion_suelo');
  const [fecha, setFecha]             = useState('');
  const [metodo, setMetodo]           = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Siembra
  const [insumo, setInsumo]     = useState('');
  const [cantidad, setCantidad] = useState('');
  const [unidad, setUnidad]     = useState('');

  // Riego
  const [laminaAgua, setLaminaAgua] = useState('');

  // Cosecha
  const [rendimientoHa, setRendimientoHa]   = useState('');
  const [totalSacos, setTotalSacos]         = useState('');
  const [humedad, setHumedad]               = useState('');
  const [precioQq, setPrecioQq]             = useState('');
  const [costoCosecha, setCostoCosecha]     = useState('');
  const [destino, setDestino]               = useState('');

  // Fumigación/Observación
  const [plagaDetectada, setPlagaDetectada] = useState('');
  const [nivelDano, setNivelDano]           = useState('');
  const [nivelAlerta, setNivelAlerta]       = useState('normal');

  // Productos
  const [productos, setProductos] = useState<Producto[]>([{ ...PRODUCTO_VACIO }]);

  const parcelaId     = parcela?.p_id ?? parcela?.id;
  const parcelaNombre = parcela?.p_nombre ?? parcela?.nombre ?? '';

  const cargarActividades = useCallback(async () => {
    if (!parcelaId) return;
    setLoading(true);
    try {
      const data = await GetActividades(parcelaId);
      setActividades(data);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally { setLoading(false); }
  }, [parcelaId]);

  useEffect(() => {
    if (visible) {
      cargarActividades();
      setVista('lista');
      setActividadSeleccionada(null);
    }
  }, [visible, cargarActividades]);

  const resetForm = () => {
    setTipo('preparacion_suelo');
    setFecha(new Date().toISOString().split('T')[0]);
    setMetodo(''); setObservaciones('');
    setInsumo(''); setCantidad(''); setUnidad('');
    setLaminaAgua('');
    setRendimientoHa(''); setTotalSacos(''); setHumedad('');
    setPrecioQq(''); setCostoCosecha(''); setDestino('');
    setPlagaDetectada(''); setNivelDano(''); setNivelAlerta('normal');
    setProductos([{ ...PRODUCTO_VACIO }]);
  };

  const abrirNueva = () => { resetForm(); setActividadSeleccionada(null); setVista('nueva'); };

  const abrirEditar = (a: Actividad) => {
    setActividadSeleccionada(a);
    setTipo(a.tipo as TipoActividad);
    setFecha(a.fecha?.split('T')[0] ?? '');
    setMetodo(a.metodo ?? '');
    setObservaciones(a.observaciones ?? '');
    setInsumo(a.insumo ?? '');
    setCantidad(a.cantidad?.toString() ?? '');
    setUnidad(a.unidad ?? '');
    setLaminaAgua(a.laminaAgua?.toString() ?? '');
    setRendimientoHa(a.rendimientoHa?.toString() ?? '');
    setTotalSacos(a.totalSacos?.toString() ?? '');
    setHumedad(a.humedad?.toString() ?? '');
    setPrecioQq(a.precioQq?.toString() ?? '');
    setCostoCosecha(a.costoCosecha?.toString() ?? '');
    setDestino(a.destino ?? '');
    setPlagaDetectada(a.plagaDetectada ?? '');
    setNivelDano(a.nivelDano ?? '');
    setNivelAlerta(a.nivelAlerta ?? 'normal');
    setProductos(
      a.productos?.length
        ? a.productos.map((p: any) => ({
            nombre: p.nombre, tipo: p.tipo, dosis: p.dosis?.toString() ?? '', unidad: p.unidad,
          }))
        : [{ ...PRODUCTO_VACIO }]
    );
    setVista('editando');
  };

  const agregarProducto = () => setProductos(p => [...p, { ...PRODUCTO_VACIO }]);

  const eliminarProducto = (i: number) =>
    setProductos(p => p.filter((_, idx) => idx !== i));

  const updateProducto = (i: number, campo: keyof Producto, valor: string) =>
    setProductos(p => p.map((prod, idx) =>
      idx === i ? { ...prod, [campo]: valor } : prod
    ));

  const handleCrear = async () => {
    if (!fecha.trim()) { Alert.alert('Error', 'La fecha es obligatoria'); return; }
    if (TIPOS_CON_PRODUCTOS.includes(tipo) && productos.every(p => !p.nombre.trim())) {
      Alert.alert('Error', 'Agrega al menos un producto'); return;
    }
    setGuardando(true);
    try {
      const productosValidos = TIPOS_CON_PRODUCTOS.includes(tipo)
        ? productos.filter(p => p.nombre.trim()).map(p => ({
            nombre: p.nombre.trim(), tipo: p.tipo,
            dosis: p.dosis ? Number(p.dosis) : undefined, unidad: p.unidad,
          }))
        : undefined;

      await CreateActividad(parcelaId, {
        tipo, fecha: new Date(fecha).toISOString(),
        metodo:        metodo        || undefined,
        insumo:        insumo        || undefined,
        cantidad:      cantidad      ? Number(cantidad)      : undefined,
        unidad:        unidad        || undefined,
        laminaAgua:    laminaAgua    ? Number(laminaAgua)    : undefined,
        rendimientoHa: rendimientoHa ? Number(rendimientoHa) : undefined,
        totalSacos:    totalSacos    ? Number(totalSacos)    : undefined,
        humedad:       humedad       ? Number(humedad)       : undefined,
        precioQq:      precioQq      ? Number(precioQq)      : undefined,
        costoCosecha:  costoCosecha  ? Number(costoCosecha)  : undefined,
        destino:       destino       || undefined,
        plagaDetectada: plagaDetectada || undefined,
        nivelDano:     nivelDano     || undefined,
        nivelAlerta:   nivelAlerta   || undefined,
        observaciones: observaciones || undefined,
        productos:     productosValidos,
      } as any);
      await cargarActividades();
      setVista('lista');
      Alert.alert('✅ Actividad registrada');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally { setGuardando(false); }
  };

  const handleActualizar = async () => {
    if (!actividadSeleccionada) return;
    setGuardando(true);
    try {
      const productosValidos = TIPOS_CON_PRODUCTOS.includes(tipo)
        ? productos.filter(p => p.nombre.trim()).map(p => ({
            nombre: p.nombre.trim(), tipo: p.tipo,
            dosis: p.dosis ? Number(p.dosis) : undefined, unidad: p.unidad,
          }))
        : undefined;

      await UpdateActividad(actividadSeleccionada.id, {
        metodo:        metodo        || undefined,
        insumo:        insumo        || undefined,
        cantidad:      cantidad      ? Number(cantidad)      : undefined,
        unidad:        unidad        || undefined,
        laminaAgua:    laminaAgua    ? Number(laminaAgua)    : undefined,
        rendimientoHa: rendimientoHa ? Number(rendimientoHa) : undefined,
        totalSacos:    totalSacos    ? Number(totalSacos)    : undefined,
        humedad:       humedad       ? Number(humedad)       : undefined,
        precioQq:      precioQq      ? Number(precioQq)      : undefined,
        costoCosecha:  costoCosecha  ? Number(costoCosecha)  : undefined,
        destino:       destino       || undefined,
        plagaDetectada: plagaDetectada || undefined,
        nivelDano:     nivelDano     || undefined,
        nivelAlerta:   nivelAlerta   || undefined,
        observaciones: observaciones || undefined,
        productos:     productosValidos,
      } as any);
      await cargarActividades();
      setVista('lista');
      Alert.alert('✅ Actividad actualizada');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally { setGuardando(false); }
  };

  const handleEliminar = (a: Actividad) => {
    Alert.alert('Eliminar actividad', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try {
          await DeleteActividad(a.id);
          await cargarActividades();
          Alert.alert('Actividad eliminada');
        } catch (e: any) { Alert.alert('Error', e.message); }
      }},
    ]);
  };

  // ── HELPERS UI ────────────────────────────────────────────────────────────
  const renderSelector = (
    opciones: string[], valor: string, onChange: (v: string) => void, label: string
  ) => (
    <>
      <Text style={s.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {opciones.map(op => (
            <TouchableOpacity
              key={op}
              style={[s.chip, valor === op && s.chipActivo]}
              onPress={() => onChange(op)}>
              <Text style={[s.chipTexto, valor === op && { color: '#fff' }]}>{op}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </>
  );

  const renderInput = (
    label: string, value: string, onChange: (v: string) => void,
    opts?: { placeholder?: string; numeric?: boolean; multiline?: boolean }
  ) => (
    <>
      <Text style={s.label}>{label}</Text>
      <TextInput
        style={[s.input, opts?.multiline && { height: 70, textAlignVertical: 'top' }]}
        value={value} onChangeText={onChange}
        placeholder={opts?.placeholder ?? ''}
        placeholderTextColor="#aaa"
        keyboardType={opts?.numeric ? 'numeric' : 'default'}
        multiline={opts?.multiline}
      />
    </>
  );

  // ── LISTA ─────────────────────────────────────────────────────────────────
  const renderLista = () => (
    <>
      <View style={s.header}>
        <Text style={s.titulo}>Actividades</Text>
        <TouchableOpacity style={s.btnPrimario} onPress={abrirNueva}>
          <Text style={s.btnTexto}>+ Nueva</Text>
        </TouchableOpacity>
      </View>
      <Text style={s.subtitulo}>📍 {parcelaNombre}</Text>
      {loading
        ? <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />
        : actividades.length === 0
          ? <View style={s.vacio}><Text style={s.vacioTexto}>No hay actividades registradas</Text></View>
          : <FlatList
              data={actividades}
              keyExtractor={a => String(a.id)}
              renderItem={({ item }) => (
                <View style={s.card}>
                  <View style={s.cardBody}>
                    <Text style={s.emoji}>{TIPO_EMOJI[item.tipo as TipoActividad] ?? '📋'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={s.cardTitulo}>{TIPO_LABEL[item.tipo as TipoActividad] ?? item.tipo}</Text>
                      <Text style={s.cardSub}>{item.fecha?.split('T')[0]}</Text>
                      {item.metodo        && <Text style={s.cardMeta}>Método: {item.metodo}</Text>}
                      {item.insumo        && <Text style={s.cardMeta}>Insumo: {item.insumo}</Text>}
                      {item.laminaAgua    && <Text style={s.cardMeta}>Lámina: {item.laminaAgua} cm</Text>}
                      {item.totalSacos    && <Text style={s.cardMeta}>Sacos: {item.totalSacos} qq</Text>}
                      {item.ingresoTotal  && <Text style={[s.cardMeta, { color: '#34C759', fontWeight: '700' }]}>Ingreso: ${item.ingresoTotal}</Text>}
                      {item.plagaDetectada && <Text style={[s.cardMeta, { color: '#E24B4A' }]}>🐛 {item.plagaDetectada} — {item.nivelDano}</Text>}
                   {(item.productos?.length ?? 0) > 0 && (
  <Text style={s.cardMeta}>
    🧪 {item.productos?.map((p: any) => p.nombre).join(', ')}
  </Text>
)}
                      {item.observaciones && <Text style={s.cardMeta}>📝 {item.observaciones}</Text>}
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
                </View>
              )}
            />
      }
    </>
  );

  // ── FORMULARIO ────────────────────────────────────────────────────────────
  const renderFormulario = (esEdicion: boolean) => (
    <ScrollView keyboardShouldPersistTaps="handled">
      <View style={s.header}>
        <TouchableOpacity onPress={() => setVista('lista')}>
          <Text style={s.link}>← Volver</Text>
        </TouchableOpacity>
        <Text style={s.titulo}>{esEdicion ? 'Editar' : 'Nueva actividad'}</Text>
      </View>

      {/* Tipo — solo en nueva */}
      {!esEdicion && (
        <>
          <Text style={s.label}>Tipo *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {TIPOS.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[s.chip, tipo === t && s.chipActivo]}
                  onPress={() => setTipo(t)}>
                  <Text style={[s.chipTexto, tipo === t && { color: '#fff' }]}>
                    {TIPO_EMOJI[t]} {TIPO_LABEL[t]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          {renderInput('Fecha *', fecha, setFecha, { placeholder: 'YYYY-MM-DD' })}
        </>
      )}

      {/* Preparación suelo / Rozar */}
      {(tipo === 'preparacion_suelo' || tipo === 'rozar_quemar') &&
        renderSelector(METODOS_PREP, metodo, setMetodo, 'Método')}

      {/* Siembra */}
      {TIPOS_SIEMBRA.includes(tipo) && (
        <>
          {renderSelector(METODOS_SIEMBRA, metodo, setMetodo, 'Método')}
          {renderInput('Variedad / Insumo', insumo, setInsumo, { placeholder: 'Ej: IR-42, Impacto' })}
          {renderInput('Cantidad (kg)', cantidad, setCantidad, { numeric: true, placeholder: 'Ej: 120' })}
          {renderInput('Unidad', unidad, setUnidad, { placeholder: 'kg, kg/ha' })}
        </>
      )}

      {/* Riego */}
      {TIPOS_RIEGO.includes(tipo) && (
        <>
          {renderSelector(METODOS_RIEGO, metodo, setMetodo, 'Tipo de riego')}
          {renderInput('Lámina de agua (cm)', laminaAgua, setLaminaAgua, { numeric: true, placeholder: 'Ej: 15' })}
          {renderInput('Duración (horas)', cantidad, setCantidad, { numeric: true, placeholder: 'Ej: 24' })}
        </>
      )}

      {/* Fertilización / Fumigación */}
      {TIPOS_CON_PRODUCTOS.includes(tipo) && (
        <>
          {renderSelector(METODOS_APLIC, metodo, setMetodo, 'Método aplicación')}
          <Text style={s.label}>Productos *</Text>
          {productos.map((prod, i) => (
            <View key={i} style={s.productoCard}>
              <View style={s.productoHeader}>
                <Text style={s.productoNum}>Producto {i + 1}</Text>
                {productos.length > 1 && (
                  <TouchableOpacity onPress={() => eliminarProducto(i)}>
                    <Text style={{ color: 'red', fontSize: 12 }}>✕ Quitar</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TextInput
                style={s.input}
                value={prod.nombre}
                onChangeText={v => updateProducto(i, 'nombre', v)}
                placeholder="Nombre del producto"
                placeholderTextColor="#aaa"
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {TIPOS_PRODUCTO.map(tp => (
                    <TouchableOpacity
                      key={tp}
                      style={[s.chip, prod.tipo === tp && s.chipActivo]}
                      onPress={() => updateProducto(i, 'tipo', tp)}>
                      <Text style={[s.chipTexto, prod.tipo === tp && { color: '#fff' }]}>{tp}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  style={[s.input, { flex: 1 }]}
                  value={prod.dosis}
                  onChangeText={v => updateProducto(i, 'dosis', v)}
                  placeholder="Dosis"
                  placeholderTextColor="#aaa"
                  keyboardType="numeric"
                />
                <TextInput
                  style={[s.input, { flex: 1 }]}
                  value={prod.unidad}
                  onChangeText={v => updateProducto(i, 'unidad', v)}
                  placeholder="Unidad"
                  placeholderTextColor="#aaa"
                />
              </View>
            </View>
          ))}
          <TouchableOpacity style={s.btnAgregarProducto} onPress={agregarProducto}>
            <Text style={s.btnAgregarProductoTexto}>+ Agregar producto</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Deshierba */}
      {tipo === 'deshierba' &&
        renderSelector(['manual', 'quimica'], metodo, setMetodo, 'Método')}

      {/* Cosecha */}
      {TIPOS_COSECHA.includes(tipo) && (
        <>
          {renderSelector(METODOS_COSECHA, metodo, setMetodo, 'Método cosecha')}
          {renderInput('Rendimiento (t/ha)', rendimientoHa, setRendimientoHa, { numeric: true, placeholder: 'Ej: 7.2' })}
          {renderInput('Total sacos (qq)', totalSacos, setTotalSacos, { numeric: true, placeholder: 'Ej: 216' })}
          {renderInput('Humedad del grano (%)', humedad, setHumedad, { numeric: true, placeholder: 'Ej: 21' })}
          {renderInput('Precio por quintal ($)', precioQq, setPrecioQq, { numeric: true, placeholder: 'Ej: 39' })}
          {renderInput('Costo de cosecha ($)', costoCosecha, setCostoCosecha, { numeric: true, placeholder: 'Ej: 420' })}
          {renderSelector(DESTINOS, destino, setDestino, 'Destino')}
          {totalSacos && precioQq ? (
            <View style={s.ingresoBox}>
              <Text style={s.ingresoLabel}>Ingreso estimado:</Text>
              <Text style={s.ingresoValor}>
                ${(Number(totalSacos) * Number(precioQq)).toFixed(2)}
              </Text>
            </View>
          ) : null}
        </>
      )}

      {/* Plagas — fumigacion y observacion */}
      {(tipo === 'fumigacion' || tipo === 'soca_fumigacion' || tipo === 'observacion') && (
        <>
          {renderInput('Plaga detectada', plagaDetectada, setPlagaDetectada, { placeholder: 'Ej: sogata, pyricularia' })}
          {plagaDetectada ? renderSelector(NIVELES_DANO, nivelDano, setNivelDano, 'Nivel de daño') : null}
        </>
      )}

      {/* Nivel alerta — observacion */}
      {tipo === 'observacion' &&
        renderSelector(NIVELES_ALERTA, nivelAlerta, setNivelAlerta, 'Nivel de alerta')}

      {/* Observaciones — siempre */}
      {renderInput('Observaciones', observaciones, setObservaciones, {
        placeholder: 'Notas adicionales...', multiline: true,
      })}

      <TouchableOpacity
        style={[s.btnPrimario, { marginTop: 20, alignSelf: 'stretch', marginBottom: 30 }, guardando && { opacity: 0.5 }]}
        onPress={esEdicion ? handleActualizar : handleCrear}
        disabled={guardando}>
        <Text style={[s.btnTexto, { textAlign: 'center' }]}>
          {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Registrar actividad'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={s.container}>
          <View style={s.topBar}>
            <Text style={s.topBarTitulo}>🌾 GeoRice — Actividades</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={[s.link, { color: 'red' }]}>✕ Cerrar</Text>
            </TouchableOpacity>
          </View>
          <View style={s.body}>
            {vista === 'lista'    && renderLista()}
            {vista === 'nueva'    && renderFormulario(false)}
            {vista === 'editando' && renderFormulario(true)}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const s = StyleSheet.create({
  container:           { flex: 1, backgroundColor: '#fff' },
  topBar:              { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                         paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12,
                         borderBottomWidth: 1, borderBottomColor: '#ccc' },
  topBarTitulo:        { fontSize: 17, fontWeight: '600' },
  body:                { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  header:              { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  titulo:              { fontSize: 20, fontWeight: 'bold' },
  subtitulo:           { fontSize: 13, color: '#666', marginBottom: 12 },
  link:                { fontSize: 14, color: '#007AFF', fontWeight: '500' },
  btnPrimario:         { backgroundColor: '#007AFF', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 20 },
  btnTexto:            { color: '#fff', fontWeight: 'bold' },
  card:                { backgroundColor: '#f9f9f9', borderRadius: 10, padding: 14,
                         marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  cardBody:            { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  emoji:               { fontSize: 26, marginTop: 2 },
  cardTitulo:          { fontSize: 15, fontWeight: '600' },
  cardSub:             { fontSize: 12, color: '#666', marginTop: 2 },
  cardMeta:            { fontSize: 12, color: '#444', marginTop: 2 },
  iconBtn:             { padding: 4, marginBottom: 2 },
  vacio:               { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60 },
  vacioTexto:          { fontSize: 15, color: '#999' },
  label:               { fontSize: 13, fontWeight: '500', color: '#444', marginBottom: 4, marginTop: 12 },
  input:               { borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
                         paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8, fontSize: 15 },
  chip:                { borderWidth: 1, borderColor: '#ccc', borderRadius: 20,
                         paddingVertical: 6, paddingHorizontal: 14 },
  chipActivo:          { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  chipTexto:           { fontSize: 13, color: '#444' },
  productoCard:        { backgroundColor: '#f5f5f5', borderRadius: 10, padding: 12,
                         marginBottom: 10, borderWidth: 1, borderColor: '#e0e0e0' },
  productoHeader:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  productoNum:         { fontSize: 13, fontWeight: '600', color: '#333' },
  btnAgregarProducto:  { borderWidth: 1, borderColor: '#007AFF', borderRadius: 8,
                         paddingVertical: 10, alignItems: 'center', marginBottom: 10 },
  btnAgregarProductoTexto: { color: '#007AFF', fontWeight: '600' },
  ingresoBox:          { backgroundColor: '#f0fff4', borderRadius: 8, padding: 12,
                         flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  ingresoLabel:        { fontSize: 14, color: '#333' },
  ingresoValor:        { fontSize: 16, fontWeight: '700', color: '#34C759' },
});

export default ActividadesModal;