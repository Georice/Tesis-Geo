import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, Alert, TextInput,
  KeyboardAvoidingView, Platform, Modal, FlatList,
} from 'react-native';
import AppHeader from '../components/AppHeader';
import AppDrawer from '../components/AppDrawer';
import { GetUserMenuByRole } from '../application/usecases/auth/GetUserMenuByRole';
import { MenuAction } from '../domain/entities/MenuItem';
import Icon from '../components/Icon';
import IconLabel from '../components/IconLabel';
import Mapbox from '@rnmapbox/maps';
import turfArea from '@turf/area';
import { booleanWithin, booleanIntersects, booleanTouches } from '@turf/turf';
import { type Polygon } from 'geojson';
import { useNavigation, useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import { SyncEngine, LoggedOperation } from '../infrastructure/sync/SyncEngine';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';

import { Parcela } from '../domain/entities/Parcela';
import { Zona }    from '../domain/entities/Zona';

import { GetParcelas }           from '../application/usecases/parcela/GetParcelas';
import { CreateParcela }         from '../application/usecases/parcela/CreateParcela';
import { UpdateParcela }         from '../application/usecases/parcela/UpdateParcela';
import { UpdateParcelaGeometry } from '../application/usecases/parcela/UpdateParcelaGeometry';
import { DeleteParcela }         from '../application/usecases/parcela/DeleteParcela';
import { GetZonas }              from '../application/usecases/zona/GetZonas';
import { CreateZona }            from '../application/usecases/zona/CreateZona';
import { UpdateZona }            from '../application/usecases/zona/UpdateZona';
import { CreateCapa }            from '../application/usecases/capa/CreateCapa';
import { UpdateCapa }            from '../application/usecases/capa/UpdateNdvi';
import { GetCapas }              from '../application/usecases/capa/GetCapas';

import NuevaParcelaScreen     from './NuevaParcelaScreen';
import ParcelaDetalleScreen   from './ParcelaDetalleScreen';
import ParcelaEditarScreen    from './ParcelaEditarScreen';
import ParcelaGeometriaScreen from './ParcelaGeometriaScreen';

Mapbox.setAccessToken('pk.eyJ1IjoiYmhlcnJlcmEyOCIsImEiOiJjbW90bTBjdTIwNWkzMnlwdnZpZzI3NXR4In0.Z0BnykgEo2A1MH_F-R_mxA');

const getArea = (verts: number[][]): string => {
  if (verts.length < 3) return '0.00';
  const closed = [...verts, verts[0]];
  const polygon: Polygon = { type: 'Polygon', coordinates: [closed] };
  return (turfArea(polygon) / 10000).toFixed(2);
};

const parseGeom = (raw: string | object | null): object | null => {
  if (!raw) return null;
  if (typeof raw === 'string') { try { return JSON.parse(raw); } catch { return null; } }
  return raw;
};

type ModoPanel =
  | 'parcela' | 'editarDatos' | 'editarGeom' | 'detalle'
  | 'nuevaCapa' | 'nuevaZona' | 'editarZona';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

const CAPA_COLOR: Record<string, string> = {
  activo:   'rgba(52,199,89,0.4)',
  descanso: 'rgba(255,165,0,0.4)',
  lindero:  'rgba(0,122,255,0.4)',
};
const CAPA_BORDER: Record<string, string> = {
  activo:   '#34C759',
  descanso: '#FFA500',
  lindero:  '#007AFF',
};

const ENTIDAD_LABEL: Record<string, string> = {
  parcela: 'Parcela', zona: 'Zona', capa: 'Capa', actividad: 'Actividad',
};

const fmtFechaCorta = (iso: string): string => {
  const d = new Date(iso);
  return [
    String(d.getDate()).padStart(2, '0'),
    String(d.getMonth() + 1).padStart(2, '0'),
    d.getFullYear(),
  ].join('/');
};

const MENSAJE_SUPERPOSICION =
  'Considerar que la parcela/zona no esté por encima de otra, caso contrario se borra lo registrado';

// Misma regla que usa el backend (ST_Intersects AND NOT ST_Touches): se
// consideran superpuestas si comparten área real, no solo un borde/punto
// en contacto. Se revisa client-side porque offline no hay forma de que el
// servidor lo valide hasta que se sincronice — y para entonces ya sería
// tarde para avisar.
const seSuperponen = (geomA: any, geomB: any): boolean => {
  try {
    const featA = { type: 'Feature' as const, properties: {}, geometry: geomA };
    const featB = { type: 'Feature' as const, properties: {}, geometry: geomB };
    return booleanIntersects(featA, featB) && !booleanTouches(featA, featB);
  } catch {
    return false;
  }
};

const DashboardScreen = () => {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<RouteProp<RootStackParamList, 'Dashboard'>>();
  const parcelaRef = useRef<any>(null);
  const cameraRef  = useRef<any>(null);
  const { user, logout } = useAuth();

  const [vertices, setVertices]                   = useState<number[][]>([]);
  const [nombre, setNombre]                       = useState('');
  const [guardandoParcela, setGuardandoParcela]   = useState(false);
  const [parcelas, setParcelas]                   = useState<Parcela[]>([]);
  const [zonas, setZonas]                         = useState<Zona[]>([]);
  const [selectedParcela, setSelectedParcela]     = useState<any>(null);
  const [editingData, setEditingData]             = useState<any>(null);
  const [editingGeometry, setEditingGeometry]     = useState<number[][]>([]);
  const [parcelaEditandoId, setParcelaEditandoId] = useState<number | null>(null);

  const [dibujandoCapa, setDibujandoCapa]         = useState(false);
  const [parcelaParaCapa, setParcelaParaCapa]     = useState<any>(null);
  const [verticesCapa, setVerticesCapa]           = useState<number[][]>([]);
  const [tipoCapa, setTipoCapa]                   = useState<'activo'|'descanso'|'lindero'>('activo');
  const [capas, setCapas]                         = useState<any[]>([]);
  const [editandoCapaId, setEditandoCapaId]       = useState<number | null>(null);

  const [dibujandoZona, setDibujandoZona]         = useState(false);
  const [verticesZona, setVerticesZona]           = useState<number[][]>([]);
  const [nombreZona, setNombreZona]               = useState('');
  const [descripcionZona, setDescripcionZona]     = useState('');

  const [editandoZonaId, setEditandoZonaId]         = useState<number | null>(null);
  const [editandoZonaNombre, setEditandoZonaNombre] = useState('');
  const [verticesZonaEdit, setVerticesZonaEdit]     = useState<number[][]>([]);

  const [menuParcela, setMenuParcela] = useState<any>(null);
  const [activeTab,   setActiveTab]  = useState<'mapa' | 'parcelas'>('mapa');
  const [drawerOpen,  setDrawerOpen] = useState(false);

  const [opcionesVisible, setOpcionesVisible]     = useState(false);
  const [estadoSyncVisible, setEstadoSyncVisible] = useState(false);
  const [syncLog, setSyncLog] = useState<LoggedOperation[]>([]);

  const menuItems = useMemo(
    () => (user ? GetUserMenuByRole(user.rol) : []),
    [user],
  );

  const handleDrawerAction = (action: MenuAction) => {
    if (action === 'adminUsuarios') {
      navigation.navigate('AdminUsuarios');
    } else if (action === 'reportes') {
      navigation.navigate('Reportes');
    } else if (action === 'logout') {
      Alert.alert(
        'Cerrar sesión',
        `¿Deseas salir, ${user?.nombres}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Salir', style: 'destructive', onPress: logout },
        ],
      );
    }
  };

  const fetchParcelas = async () => {
    try { setParcelas(await GetParcelas()); }
    catch (e) { console.error('fetchParcelas:', e); }
  };

  const fetchZonas = async () => {
    try { setZonas(await GetZonas()); }
    catch (e) { console.error('fetchZonas:', e); }
  };

  const fetchCapas = async (parcelaId: number) => {
    try { setCapas(await GetCapas(parcelaId)); }
    catch (e) { console.error('fetchCapas:', e); }
  };

  // Reintenta manualmente toda la cola offline (parcelas, zonas, capas y
  // actividades creadas/editadas sin conexión) — la cola en sí ya se
  // reintenta automáticamente al recuperar señal (ver App.tsx), esto es
  // un botón de "forzar ahora" para el usuario.
  const syncOfflineParcelas = async (opts: { silent?: boolean } = {}) => {
    try {
      const { sent, pending } = await SyncEngine.flushQueue();
      if (sent === 0 && pending === 0) {
        if (!opts.silent) Alert.alert('Sin pendientes', 'No hay cambios guardados localmente por enviar.');
        return;
      }
      Alert.alert(
        'Sincronización',
        pending > 0
          ? `Se enviaron ${sent} cambio(s). ${pending} siguen pendientes (sin conexión o no se pudieron completar).`
          : `Se enviaron ${sent} cambio(s) pendiente(s).`,
      );
      fetchParcelas();
      fetchZonas();
    } catch (e) { console.error(e); }
  };

  // Mantener presionado "Sincronizar" para revisar/vaciar la cola pendiente
  // — útil cuando algo queda atascado (el servidor lo rechaza siempre, p.
  // ej. una actividad sin ciclo activo) y se repite en cada intento sin
  // avanzar nunca.
  // El dispositivo puede haber tenido más de un usuario logeado (admin y
  // socio probando en el mismo celular, por ejemplo) — tanto la cola como
  // el log de sincronización son compartidos a nivel de AsyncStorage, así
  // que hay que filtrar por el usuario actual antes de mostrar o borrar
  // nada, para no tocar (ni mostrar) lo que otro usuario dejó pendiente.
  const misOperacionesPendientes = async () => {
    const [queue, log] = await Promise.all([SyncEngine.getQueue(), SyncEngine.getLog()]);
    const misIds = new Set(
      log.filter(l => l.usuario === (user?.nombreCompleto ?? '')).map(l => l.id),
    );
    return queue.filter(op => misIds.has(op.id));
  };

  const verColaPendiente = async () => {
    const misPendientes = await misOperacionesPendientes();
    if (!misPendientes.length) {
      Alert.alert('Sin pendientes', 'No tienes cambios guardados localmente por enviar.');
      return;
    }
    const detalle = misPendientes
      .map(op => `• ${op.label}${op.lastError ? `\n   ⚠ ${op.lastError}` : ''}`)
      .join('\n');
    Alert.alert(
      `${misPendientes.length} pendiente(s) sin sincronizar`,
      `${detalle}\n\nSi alguno lleva mucho tiempo sin poder enviarse, puedes vaciar toda la cola. Esto DESCARTA los cambios pendientes — solo hazlo si ya no los necesitas.`,
      [
        { text: 'Cerrar', style: 'cancel' },
        { text: 'Vaciar cola', style: 'destructive', onPress: async () => {
          for (const op of misPendientes) await SyncEngine.discardOperation(op.id);
          Alert.alert('Cola vaciada');
          fetchParcelas(); fetchZonas();
        }},
      ],
    );
  };

  const abrirEstadoSync = async () => {
    const log = await SyncEngine.getLog();
    setSyncLog(log.filter(l => l.usuario === (user?.nombreCompleto ?? '')));
    setEstadoSyncVisible(true);
  };

  // "Borrar caché" del menú de opciones: borra SOLO lo que el usuario
  // actual todavía no ha enviado (cola pendiente + sus registros locales
  // optimistas + su entrada en el log de "Estado de sincronización"). No
  // toca los datos ya sincronizados, ni lo pendiente de otros usuarios.
  const borrarCacheNoEnviada = async () => {
    const misPendientes = await misOperacionesPendientes();
    if (!misPendientes.length) {
      Alert.alert('Nada que borrar', 'No tienes registros pendientes de sincronizar guardados en este dispositivo.');
      return;
    }
    Alert.alert(
      'Borrar caché',
      `Vas a borrar ${misPendientes.length} registro(s) tuyo(s) que todavía NO se han enviado. Los datos ya sincronizados y los pendientes de otros usuarios no se ven afectados. Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Borrar', style: 'destructive', onPress: async () => {
          for (const op of misPendientes) await SyncEngine.discardOperation(op.id);
          Alert.alert('Listo', 'Se borraron tus registros pendientes no enviados.');
          fetchParcelas(); fetchZonas();
        }},
      ],
    );
  };

  const mostrarVersionApp = () => {
    const hoy = new Date();
    const fecha = [
      String(hoy.getDate()).padStart(2, '0'),
      String(hoy.getMonth() + 1).padStart(2, '0'),
      hoy.getFullYear(),
    ].join('/');
    Alert.alert('Versión app', `Fecha: ${fecha}\nUsuario: ${user?.nombreCompleto ?? '—'}`);
  };

  useEffect(() => {
    fetchParcelas();
    fetchZonas();
    syncOfflineParcelas({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchParcelas();
      fetchZonas();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  useEffect(() => {
    const params = route.params as any;
    if (!params?.accion) return;
    if (params.accion === 'dibujarZona') { clearAll(); setDibujandoZona(true); }
    if (params.accion === 'editarZona' && params.zona) { activarEditarZona(params.zona); }
    if (params.accion === 'dibujarCapa' && params.parcela) { activarDibujoCapa(params.parcela); }
    if (params.accion === 'editarCapa' && params.parcela && params.capa) { activarEditarCapa(params.parcela, params.capa); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params]);

  const polygonGeoJSON = useMemo(() => {
    if (vertices.length < 3) return null;
    return { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {},
      geometry: { type: 'Polygon', coordinates: [[...vertices, vertices[0]]] } }],
    } as GeoJSON.FeatureCollection;
  }, [vertices]);

  const editingPolygonGeoJSON = useMemo(() => {
    if (editingGeometry.length < 3) return null;
    return { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {},
      geometry: { type: 'Polygon', coordinates: [[...editingGeometry, editingGeometry[0]]] } }],
    } as GeoJSON.FeatureCollection;
  }, [editingGeometry]);

  const capaGeoJSON = useMemo(() => {
    if (verticesCapa.length < 3) return null;
    return { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {},
      geometry: { type: 'Polygon', coordinates: [[...verticesCapa, verticesCapa[0]]] } }],
    } as GeoJSON.FeatureCollection;
  }, [verticesCapa]);

  const zonaGeoJSON = useMemo(() => {
    if (verticesZona.length < 3) return null;
    return { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {},
      geometry: { type: 'Polygon', coordinates: [[...verticesZona, verticesZona[0]]] } }],
    } as GeoJSON.FeatureCollection;
  }, [verticesZona]);

  const zonaEditGeoJSON = useMemo(() => {
    if (verticesZonaEdit.length < 3) return null;
    return { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {},
      geometry: { type: 'Polygon', coordinates: [[...verticesZonaEdit, verticesZonaEdit[0]]] } }],
    } as GeoJSON.FeatureCollection;
  }, [verticesZonaEdit]);

  const parcelasGeoJSON = useMemo((): GeoJSON.FeatureCollection => ({
    type: 'FeatureCollection',
    features: parcelas.map(p => {
      const geom = parseGeom(p.p_geometria);
      if (!geom) return null;
      return { type: 'Feature', properties: {
        id: p.p_id, nombre: p.p_nombre, propietario: p.p_propietario,
        cultivo: p.p_cultivo, area_ha: p.p_area_ha, zona_id: p.p_zona_id,
      }, geometry: geom };
    }).filter(Boolean) as GeoJSON.Feature[],
  }), [parcelas]);

  const zonasGeoJSON = useMemo((): GeoJSON.FeatureCollection => ({
    type: 'FeatureCollection',
    features: zonas.map(z => {
      const geomRaw = z.geometria ?? z.z_geometria;
      if (!geomRaw) return null;
      const geom = typeof geomRaw === 'string' ? JSON.parse(geomRaw) : geomRaw;
      return { type: 'Feature',
        properties: { id: z.id ?? z.z_id, nombre: z.nombre ?? z.z_nombre },
        geometry: geom };
    }).filter(Boolean) as GeoJSON.Feature[],
  }), [zonas]);

  const capasGeoJSON = useMemo((): GeoJSON.FeatureCollection => ({
    type: 'FeatureCollection',
    features: capas.map(c => {
      const geom = parseGeom(c.geometria);
      if (!geom) return null;
      return { type: 'Feature', properties: { id: c.id, tipo: c.tipo }, geometry: geom };
    }).filter(Boolean) as GeoJSON.Feature[],
  }), [capas]);

  const modoPanel: ModoPanel = (() => {
    if (dibujandoCapa)          return 'nuevaCapa';
    if (dibujandoZona)          return 'nuevaZona';
    if (editandoZonaId)         return 'editarZona';
    if (editingData)            return 'editarDatos';
    if (editingGeometry.length) return 'editarGeom';
    if (selectedParcela)        return 'detalle';
    return 'parcela';
  })();

  const handleMapPress = (event: any) => {
    const coord = event.geometry.coordinates;
    if (dibujandoCapa)     { setVerticesCapa(c => [...c, coord]); return; }
    if (dibujandoZona)     { setVerticesZona(c => [...c, coord]); return; }
    if (editandoZonaId)    { setVerticesZonaEdit(c => [...c, coord]); return; }
    if (parcelaEditandoId) { setEditingGeometry(c => [...c, coord]); return; }
    if (selectedParcela || editingData) {
      setSelectedParcela(null); setEditingData(null); return;
    }
    if (activeTab === 'parcelas') setVertices(c => [...c, coord]);
  };

  const clearAll = () => {
    setVertices([]); setNombre('');
    setSelectedParcela(null); setEditingData(null);
    setEditingGeometry([]); setParcelaEditandoId(null);
    setDibujandoCapa(false); setVerticesCapa([]); setParcelaParaCapa(null);
    setEditandoCapaId(null);
    setDibujandoZona(false); setVerticesZona([]); setNombreZona(''); setDescripcionZona('');
    setEditandoZonaId(null); setEditandoZonaNombre(''); setVerticesZonaEdit([]);
  };

  const saveParcel = async () => {
    if (guardandoParcela) return; // evita doble-envío si tocan "Guardar" dos veces rápido
    if (vertices.length < 3) { Alert.alert('Error', 'Necesitas al menos 3 vértices.'); return; }
    if (!nombre.trim())       { Alert.alert('Error', 'Ingresa un nombre.'); return; }

    if (zonas.length > 0) {
      const parcelaFeature = {
        type: 'Feature' as const, properties: {},
        geometry: { type: 'Polygon' as const, coordinates: [[...vertices, vertices[0]]] },
      };
      const dentroDeZona = zonas.some(z => {
        const geomRaw = (z as any).geometria ?? (z as any).z_geometria;
        if (!geomRaw) return false;
        try {
          const geom = typeof geomRaw === 'string' ? JSON.parse(geomRaw) : geomRaw;
          return booleanWithin(parcelaFeature, { type: 'Feature', properties: {}, geometry: geom });
        } catch { return false; }
      });
      if (!dentroDeZona) {
        Alert.alert('Fuera de zona',
          'La parcela debe estar completamente dentro de una zona registrada.',
          [
            { text: 'Ir a Zonas', onPress: () => navigation.navigate('Zonas') },
            { text: 'Cancelar', style: 'cancel' },
          ]
        );
        return;
      }
    }

    const geometria = { type: 'Polygon', coordinates: [[...vertices, vertices[0]]] };

    const seSuperponeConOtraParcela = parcelas.some(p => {
      const gRaw = (p as any).p_geometria ?? (p as any).geometria;
      if (!gRaw) return false;
      try {
        const g = typeof gRaw === 'string' ? JSON.parse(gRaw) : gRaw;
        return seSuperponen(geometria, g);
      } catch { return false; }
    });
    if (seSuperponeConOtraParcela) {
      Alert.alert('Atención', MENSAJE_SUPERPOSICION);
      return;
    }

    const parcelaData = { nombre: nombre.trim(), cultivo: 'Arroz', estado: 'activo', geometria };
    setGuardandoParcela(true);
    try {
      const creada = await CreateParcela(parcelaData);
      if (creada.p_pending_sync) {
        // Sin conexión: ParcelaRepository ya la encoló y ya la agregó a la
        // caché local, así que fetchParcelas() de abajo va a mostrarla de
        // inmediato (con id temporal) — ya se puede trabajar con ella.
        Alert.alert('Sin conexión', 'Parcela guardada localmente. Ya puedes verla y trabajar con ella; se enviará sola cuando vuelva la señal.');
      } else {
        Alert.alert('Parcela guardada', `Área: ${getArea(vertices)} ha`);
      }
      setVertices([]); setNombre('');
      fetchParcelas();
    } catch (e: any) {
      const msg = e.message ?? 'Error al guardar';
      if (msg.includes('zona')) {
        Alert.alert('Fuera de zona',
          'La parcela debe estar dentro de una zona registrada.',
          [
            { text: 'Ir a Zonas', onPress: () => navigation.navigate('Zonas') },
            { text: 'Cancelar', style: 'cancel' },
          ]
        );
      } else if (msg.includes('superpone')) {
        Alert.alert('Solapamiento', 'La parcela se superpone con una existente.');
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setGuardandoParcela(false);
    }
  };

  const updateParcelData = async () => {
    if (!editingData) return;
    const id = editingData.p_id ?? editingData.id;
    try {
      await UpdateParcela(id, {
        nombre:      editingData.nombre?.trim()      || undefined,
        propietario: editingData.propietario?.trim() || undefined,
        cultivo:     editingData.cultivo?.trim()     || undefined,
      });
      Alert.alert('Datos actualizados');
      setEditingData(null); setSelectedParcela(null); fetchParcelas();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo actualizar la parcela');
    }
  };

  const startEditGeometry = () => {
    if (!selectedParcela) return;
    const geom = parseGeom(selectedParcela.p_geometria ?? selectedParcela.geometria);
    let coords = (geom as any)?.coordinates?.[0] ?? [];
    if (coords.length > 1) {
      const f = coords[0]; const l = coords[coords.length - 1];
      if (f[0] === l[0] && f[1] === l[1]) coords = coords.slice(0, -1);
    }
    setEditingGeometry(coords);
    setParcelaEditandoId(selectedParcela.p_id ?? selectedParcela.id);
  };

  const saveGeometryChanges = async () => {
    if (!parcelaEditandoId || editingGeometry.length < 3) return;
    const geometria = { type: 'Polygon', coordinates: [[...editingGeometry, editingGeometry[0]]] };
    try {
      const data = await UpdateParcelaGeometry(parcelaEditandoId, geometria);
      const area = (data as any).area_ha ?? '';
      Alert.alert('Geometría actualizada', area ? `Área: ${area} ha` : '');
      setEditingGeometry([]); setParcelaEditandoId(null); setSelectedParcela(null);
      fetchParcelas();
    } catch (e: any) {
      const msg = e.message ?? '';
      if (msg.includes('zona')) Alert.alert('Fuera de zona', 'La parcela debe estar dentro de una zona.');
      else if (msg.includes('superpone')) Alert.alert('Solapamiento', 'Se superpone con otra parcela.');
      else Alert.alert('Error de conexión');
    }
  };

  const deleteParcel = (id: number) => {
    Alert.alert('Confirmar eliminación', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try { await DeleteParcela(id); Alert.alert('Parcela eliminada'); clearAll(); fetchParcelas(); }
        catch { Alert.alert('Error de conexión'); }
      }},
    ]);
  };

  const activarDibujoCapa = (parcela: any) => {
    const p = {
      ...parcela,
      p_id: parcela?.p_id ?? parcela?.id,
      id:   parcela?.p_id ?? parcela?.id,
    };
    setVertices([]); setNombre('');
    setSelectedParcela(null); setEditingData(null);
    setEditingGeometry([]); setParcelaEditandoId(null);
    setDibujandoZona(false); setVerticesZona([]);
    setEditandoZonaId(null); setVerticesZonaEdit([]);
    setEditandoCapaId(null); setVerticesCapa([]);
    setDibujandoCapa(true);
    setParcelaParaCapa(p);
  };

  const activarEditarCapa = (parcela: any, capa: any) => {
    const p = {
      ...parcela,
      p_id: parcela?.p_id ?? parcela?.id,
      id:   parcela?.p_id ?? parcela?.id,
    };
    const geomRaw = capa.geometria;
    const geom    = typeof geomRaw === 'string' ? JSON.parse(geomRaw) : geomRaw;
    let coords    = geom?.coordinates?.[0] ?? [];
    if (coords.length > 1) {
      const f = coords[0]; const l = coords[coords.length - 1];
      if (f[0] === l[0] && f[1] === l[1]) coords = coords.slice(0, -1);
    }
    setVertices([]); setNombre('');
    setSelectedParcela(null); setEditingData(null);
    setEditingGeometry([]); setParcelaEditandoId(null);
    setDibujandoZona(false); setVerticesZona([]);
    setEditandoZonaId(null); setVerticesZonaEdit([]);
    setEditandoCapaId(capa.id);
    setParcelaParaCapa(p);
    setVerticesCapa(coords);
    setTipoCapa(capa.tipo ?? 'activo');
    setDibujandoCapa(true);
  };

  const saveCapa = async () => {
    if (verticesCapa.length < 3) { Alert.alert('Error', 'Necesitas al menos 3 vértices.'); return; }
    const parcelaId = parcelaParaCapa?.p_id ?? parcelaParaCapa?.id;
    const geometria = { type: 'Polygon', coordinates: [[...verticesCapa, verticesCapa[0]]] };
    try {
      if (editandoCapaId) {
        await UpdateCapa(editandoCapaId, parcelaId, { tipo: tipoCapa, geometria });
        Alert.alert('Capa actualizada');
      } else {
        await CreateCapa(parcelaId, { tipo: tipoCapa, geometria });
        Alert.alert('Capa guardada');
      }
      setDibujandoCapa(false); setVerticesCapa([]); setParcelaParaCapa(null);
      setEditandoCapaId(null); setSelectedParcela(null);
      fetchCapas(parcelaId);
    } catch (e: any) { Alert.alert('Error', e.message ?? 'La capa debe estar dentro de la parcela'); }
  };

  const activarDibujoZona = () => { clearAll(); setDibujandoZona(true); };

  const saveZona = async () => {
    if (verticesZona.length < 3) { Alert.alert('Error', 'Necesitas al menos 3 vértices.'); return; }
    if (!nombreZona.trim())       { Alert.alert('Error', 'Ingresa un nombre.'); return; }
    const geometria = { type: 'Polygon', coordinates: [[...verticesZona, verticesZona[0]]] };

    const seSuperponeConOtraZona = zonas.some(z => {
      const gRaw = (z as any).geometria ?? (z as any).z_geometria;
      if (!gRaw) return false;
      try {
        const g = typeof gRaw === 'string' ? JSON.parse(gRaw) : gRaw;
        return seSuperponen(geometria, g);
      } catch { return false; }
    });
    if (seSuperponeConOtraZona) {
      Alert.alert('Atención', MENSAJE_SUPERPOSICION);
      return;
    }

    try {
      const result = await CreateZona({ nombre: nombreZona.trim(), descripcion: descripcionZona.trim(), geometria });
      if ((result as any).pendingSync) {
        Alert.alert('Sin conexión', 'Zona guardada localmente. Ya puedes verla y crear parcelas dentro de ella; se enviará sola cuando vuelva la señal.');
      } else {
        Alert.alert('Zona guardada', `${(result as any).parcelasAsignadas ?? 0} parcelas asignadas`);
      }
      setDibujandoZona(false); setVerticesZona([]); setNombreZona(''); setDescripcionZona('');
      fetchZonas(); fetchParcelas();
    } catch (e: any) { Alert.alert('Error', e.message ?? 'Error al guardar zona'); }
  };

  const activarEditarZona = (zona: any) => {
    clearAll();
    const id      = zona.id ?? zona.z_id;
    const nomb    = zona.nombre ?? zona.z_nombre ?? '';
    const geomRaw = zona.geometria ?? zona.z_geometria;
    const geom    = typeof geomRaw === 'string' ? JSON.parse(geomRaw) : geomRaw;
    let coords    = geom?.coordinates?.[0] ?? [];
    if (coords.length > 1) {
      const f = coords[0]; const l = coords[coords.length - 1];
      if (f[0] === l[0] && f[1] === l[1]) coords = coords.slice(0, -1);
    }
    setEditandoZonaId(id); setEditandoZonaNombre(nomb);
    setVerticesZonaEdit(coords.length ? coords : []);
  };

  const saveZonaGeometry = async () => {
    if (!editandoZonaId || verticesZonaEdit.length < 3) {
      Alert.alert('Error', 'Necesitas al menos 3 vértices.'); return;
    }
    const geometria = { type: 'Polygon', coordinates: [[...verticesZonaEdit, verticesZonaEdit[0]]] };
    try {
      const result = await UpdateZona(editandoZonaId, { geometria });
      Alert.alert('Zona actualizada', `${(result as any).parcelasAsignadas ?? 0} parcelas asignadas`);
      setEditandoZonaId(null); setEditandoZonaNombre(''); setVerticesZonaEdit([]);
      fetchZonas(); fetchParcelas();
    } catch (e: any) { Alert.alert('Error', e.message ?? 'Error al actualizar zona'); }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _activarDibujoZona = activarDibujoZona;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.container}>

        <AppHeader onMenuPress={() => setDrawerOpen(true)} onOpcionesPress={() => setOpcionesVisible(true)} />

        <View style={{ flex: 1 }}>

        <Mapbox.MapView
          style={styles.map}
          styleURL={Mapbox.StyleURL.SatelliteStreet}
          localizeLabels={{ locale: 'es' }}
          onPress={handleMapPress}
          // @ts-ignore
          maxZoomLevel={18}>

          <Mapbox.Camera ref={cameraRef} defaultSettings={{
            centerCoordinate: [-79.98893505962573, -1.9325948991925863],
            zoomLevel: 16,
          }} />

          {vertices.map((coord, i) => (
            <Mapbox.PointAnnotation key={`new-${i}`} id={`new-${i}`} coordinate={coord}>
              <View style={styles.marker}><Text style={styles.markerText}>{i + 1}</Text></View>
            </Mapbox.PointAnnotation>
          ))}

          {vertices.length >= 3 && polygonGeoJSON && (
            <Mapbox.ShapeSource id="polygonSource" shape={polygonGeoJSON}>
              <Mapbox.FillLayer id="polygonFill" style={{ fillColor: 'rgba(0,128,0,0.3)' }} />
              <Mapbox.LineLayer id="polygonOutline" style={{ lineColor: 'green', lineWidth: 2 }} />
            </Mapbox.ShapeSource>
          )}

          {editingGeometry.map((coord, i) => (
            <Mapbox.PointAnnotation key={`edit-${i}`} id={`edit-${i}`} coordinate={coord} draggable
              onDragEnd={e => {
                const nc = e.geometry.coordinates;
                setEditingGeometry(curr => { const u = [...curr]; u[i] = nc; return u; });
              }}>
              <View style={styles.editMarker}><Text style={styles.markerText}>{i + 1}</Text></View>
            </Mapbox.PointAnnotation>
          ))}

          {editingPolygonGeoJSON && (
            <Mapbox.ShapeSource id="editingPolygonSource" shape={editingPolygonGeoJSON}>
              <Mapbox.FillLayer id="editingPolygonFill" style={{ fillColor: 'rgba(255,165,0,0.4)' }} />
              <Mapbox.LineLayer id="editingPolygonOutline" style={{ lineColor: 'orange', lineWidth: 2 }} />
            </Mapbox.ShapeSource>
          )}

          {editandoZonaId !== null && verticesZonaEdit.map((coord, i) => (
            <Mapbox.PointAnnotation key={`zedit-${i}`} id={`zedit-${i}`} coordinate={coord} draggable
              onDragEnd={e => {
                const nc = e.geometry.coordinates;
                setVerticesZonaEdit(curr => { const u = [...curr]; u[i] = nc; return u; });
              }}>
              <View style={[styles.editMarker, { backgroundColor: '#FF9500' }]}>
                <Text style={styles.markerText}>{i + 1}</Text>
              </View>
            </Mapbox.PointAnnotation>
          ))}

          {zonaEditGeoJSON && (
            <Mapbox.ShapeSource id="zonaEditSource" shape={zonaEditGeoJSON}>
              <Mapbox.FillLayer id="zonaEditFill" style={{ fillColor: 'rgba(255,200,0,0.3)' }} />
              <Mapbox.LineLayer id="zonaEditOutline" style={{ lineColor: '#FF9500', lineWidth: 2 }} />
            </Mapbox.ShapeSource>
          )}

          {dibujandoCapa && verticesCapa.map((coord, i) => (
            <Mapbox.PointAnnotation key={`capa-${i}`} id={`capa-${i}`} coordinate={coord}>
              <View style={[styles.marker, { backgroundColor: CAPA_BORDER[tipoCapa] }]}>
                <Text style={styles.markerText}>{i + 1}</Text>
              </View>
            </Mapbox.PointAnnotation>
          ))}

          {dibujandoCapa && capaGeoJSON && (
            <Mapbox.ShapeSource id="capaSource" shape={capaGeoJSON}>
              <Mapbox.FillLayer id="capaFill" style={{ fillColor: CAPA_COLOR[tipoCapa] }} />
              <Mapbox.LineLayer id="capaOutline" style={{ lineColor: CAPA_BORDER[tipoCapa], lineWidth: 2 }} />
            </Mapbox.ShapeSource>
          )}

          {dibujandoZona && verticesZona.map((coord, i) => (
            <Mapbox.PointAnnotation key={`zona-${i}`} id={`zona-${i}`} coordinate={coord}>
              <View style={[styles.marker, { backgroundColor: '#FF9500' }]}>
                <Text style={styles.markerText}>{i + 1}</Text>
              </View>
            </Mapbox.PointAnnotation>
          ))}

          {dibujandoZona && zonaGeoJSON && (
            <Mapbox.ShapeSource id="zonaDrawSource" shape={zonaGeoJSON}>
              <Mapbox.FillLayer id="zonaDrawFill" style={{ fillColor: 'rgba(255,200,0,0.25)' }} />
              <Mapbox.LineLayer id="zonaDrawOutline" style={{ lineColor: '#FF9500', lineWidth: 2, lineDasharray: [4, 2] }} />
            </Mapbox.ShapeSource>
          )}

          {zonas.length > 0 && (
            <Mapbox.ShapeSource id="zonasSource" shape={zonasGeoJSON}>
              <Mapbox.FillLayer id="zonasFill" style={{ fillColor: 'rgba(255,200,0,0.15)' }} />
              <Mapbox.LineLayer id="zonasOutline" style={{ lineColor: 'rgba(255,165,0,0.8)', lineWidth: 2, lineDasharray: [4, 2] }} />
            </Mapbox.ShapeSource>
          )}

          {capas.length > 0 && (
            <Mapbox.ShapeSource id="capasSource" shape={capasGeoJSON}>
              <Mapbox.FillLayer id="capasFill" style={{ fillColor: [
                'match', ['get', 'tipo'],
                'activo',   'rgba(52,199,89,0.35)',
                'descanso', 'rgba(255,165,0,0.35)',
                'lindero',  'rgba(0,122,255,0.35)',
                'rgba(200,200,200,0.35)',
              ] as any }} />
              <Mapbox.LineLayer id="capasOutline" style={{ lineColor: [
                'match', ['get', 'tipo'],
                'activo',   '#34C759',
                'descanso', '#FFA500',
                'lindero',  '#007AFF',
                '#ccc',
              ] as any, lineWidth: 2 }} />
            </Mapbox.ShapeSource>
          )}

          {parcelas.length > 0 && !editingGeometry.length && (
            <Mapbox.ShapeSource
              id="parcelasGuardadas"
              shape={parcelasGeoJSON}
              onPress={(event: any) => {
                if (dibujandoCapa || dibujandoZona || editandoZonaId !== null || parcelaEditandoId !== null) {
                  const c = event.coordinates;
                  if (c) handleMapPress({ geometry: { coordinates: [c.longitude, c.latitude] } });
                  return;
                }
                const feature: any = event?.features?.[0];
                if (feature?.properties) {
                  const props           = feature.properties;
                  const parcelaCompleta = parcelas.find(p => p.p_id === props.id);
                  const p = {
                    ...parcelaCompleta, ...props,
                    p_id: parcelaCompleta?.p_id,
                    id:   parcelaCompleta?.p_id,
                    actividades: [],
                  };
                  parcelaRef.current = p;
                  setMenuParcela(p);
                }
              }}>
              <Mapbox.FillLayer id="parcelasFill" style={{ fillColor: 'rgba(0,0,255,0.2)' }} />
              <Mapbox.LineLayer id="parcelasOutline" style={{ lineColor: 'blue', lineWidth: 2 }} />
            </Mapbox.ShapeSource>
          )}
        </Mapbox.MapView>

        <TouchableOpacity style={styles.btnUbicacion}
          onPress={() => cameraRef.current?.setCamera({
            centerCoordinate: [-79.98893505962573, -1.9325948991925863],
            zoomLevel: 16,
            animationMode: 'flyTo',
            animationDuration: 1000,
          })}>
          <Icon name="map-marker" size={20} color="#1a5c2a" />
        </TouchableOpacity>

        {modoPanel !== 'parcela' && !dibujandoCapa && !dibujandoZona && !editandoZonaId && (
          <TouchableOpacity style={styles.btnZonas}
            onPress={() => navigation.navigate('Zonas')}>
            <IconLabel icon="map" label="Zonas" textStyle={styles.btnZonasTexto} />
          </TouchableOpacity>
        )}

        {!menuParcela && <View style={styles.bottomStack} pointerEvents="box-none">


          <View style={[
            styles.panel,
            modoPanel === 'nuevaCapa'  && { maxHeight: 240 },
            (modoPanel === 'nuevaZona' || modoPanel === 'editarZona') && { maxHeight: 200 },
          ]} pointerEvents={
            modoPanel === 'nuevaCapa' || modoPanel === 'nuevaZona' ||
            modoPanel === 'editarZona' || modoPanel === 'editarGeom'
              ? 'box-none' : 'auto'
          }>
            {modoPanel === 'nuevaCapa' && (
              <>
                <IconLabel
                  icon="puzzle"
                  label={editandoCapaId ? 'Editando capa' : 'Nueva capa — toca el mapa para dibujar'}
                  textStyle={styles.panelTitulo}
                />
                <Text style={styles.panelSub}>Parcela: {parcelaParaCapa?.p_nombre ?? parcelaParaCapa?.nombre}</Text>
                <View style={styles.tipoRow}>
                  {(['activo','descanso','lindero'] as const).map(t => (
                    <TouchableOpacity key={t}
                      style={[styles.tipoBtn, tipoCapa === t && { backgroundColor: CAPA_BORDER[t], borderColor: CAPA_BORDER[t] }]}
                      onPress={() => setTipoCapa(t)}>
                      <Text style={[styles.tipoBtnTexto, tipoCapa === t && { color: '#fff' }]}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.panelInfo}>Vértices: {verticesCapa.length} · Área: {getArea(verticesCapa)} ha</Text>
                <View style={styles.btnRow}>
                  <TouchableOpacity style={styles.btnSecundario} onPress={() => setVerticesCapa(v => v.slice(0, -1))}>
                    <IconLabel icon="undo" label="Deshacer" textStyle={styles.btnSecTexto} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnSecundario}
                    onPress={() => { setDibujandoCapa(false); setVerticesCapa([]); setParcelaParaCapa(null); setEditandoCapaId(null); }}>
                    <IconLabel icon="close" label="Cancelar" textStyle={[styles.btnSecTexto, { color: 'red' }]} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.btnPrimario, verticesCapa.length < 3 && { opacity: 0.4 }]}
                    onPress={saveCapa} disabled={verticesCapa.length < 3}>
                    <IconLabel icon="content-save" label="Guardar" textStyle={styles.btnTexto} />
                  </TouchableOpacity>
                </View>
              </>
            )}

            {modoPanel === 'nuevaZona' && (
              <>
                <IconLabel icon="map" label="Nueva zona — toca el mapa para dibujar" textStyle={styles.panelTitulo} />
                <TextInput style={styles.input} value={nombreZona} onChangeText={setNombreZona}
                  placeholder="Nombre de la zona *" placeholderTextColor="#aaa" />
                <TextInput style={styles.input} value={descripcionZona} onChangeText={setDescripcionZona}
                  placeholder="Descripción (opcional)" placeholderTextColor="#aaa" />
                <Text style={styles.panelInfo}>Vértices: {verticesZona.length} · Área: {getArea(verticesZona)} ha</Text>
                <View style={styles.btnRow}>
                  <TouchableOpacity style={styles.btnSecundario} onPress={() => setVerticesZona(v => v.slice(0, -1))}>
                    <IconLabel icon="undo" label="Deshacer" textStyle={styles.btnSecTexto} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnSecundario}
                    onPress={() => { setDibujandoZona(false); setVerticesZona([]); setNombreZona(''); setDescripcionZona(''); }}>
                    <IconLabel icon="close" label="Cancelar" textStyle={[styles.btnSecTexto, { color: 'red' }]} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.btnPrimario, (verticesZona.length < 3 || !nombreZona.trim()) && { opacity: 0.4 }]}
                    onPress={saveZona} disabled={verticesZona.length < 3 || !nombreZona.trim()}>
                    <IconLabel icon="content-save" label="Guardar" textStyle={styles.btnTexto} />
                  </TouchableOpacity>
                </View>
              </>
            )}

            {modoPanel === 'editarZona' && (
              <>
                <IconLabel icon="map" label={`Editando: ${editandoZonaNombre}`} textStyle={styles.panelTitulo} />
                <Text style={styles.panelSub}>Arrastra vértices o toca el mapa para agregar</Text>
                <Text style={styles.panelInfo}>Vértices: {verticesZonaEdit.length} · Área: {getArea(verticesZonaEdit)} ha</Text>
                <View style={styles.btnRow}>
                  <TouchableOpacity style={styles.btnSecundario} onPress={() => setVerticesZonaEdit(v => v.slice(0, -1))}>
                    <IconLabel icon="undo" label="Deshacer" textStyle={styles.btnSecTexto} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnSecundario}
                    onPress={() => { setEditandoZonaId(null); setEditandoZonaNombre(''); setVerticesZonaEdit([]); }}>
                    <IconLabel icon="close" label="Cancelar" textStyle={[styles.btnSecTexto, { color: 'red' }]} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.btnPrimario, verticesZonaEdit.length < 3 && { opacity: 0.4 }]}
                    onPress={saveZonaGeometry} disabled={verticesZonaEdit.length < 3}>
                    <IconLabel icon="content-save" label="Guardar" textStyle={styles.btnTexto} />
                  </TouchableOpacity>
                </View>
              </>
            )}

            {modoPanel === 'editarDatos' && (
              <ParcelaEditarScreen editingData={editingData} onChangeData={setEditingData}
                onCancelar={() => setEditingData(null)} onGuardar={updateParcelData} />
            )}

            {modoPanel === 'editarGeom' && (
              <ParcelaGeometriaScreen editingGeometry={editingGeometry} area={getArea(editingGeometry)}
                onEliminarUltimo={() => setEditingGeometry(v => v.slice(0, -1))}
                onCancelar={() => { setEditingGeometry([]); setParcelaEditandoId(null); }}
                onGuardar={saveGeometryChanges} />
            )}

            {modoPanel === 'detalle' && selectedParcela && (
              <ParcelaDetalleScreen parcela={selectedParcela}
                onEditarDatos={() => setEditingData({ ...selectedParcela })}
                onEditarGeometria={startEditGeometry}
                onEliminar={() => deleteParcel(selectedParcela.id ?? selectedParcela.p_id)}
                onCerrar={() => setSelectedParcela(null)}
                onActividades={() => {
                  parcelaRef.current = selectedParcela;
                  navigation.navigate('Actividades', { parcela: parcelaRef.current });
                }}
                onCapas={() => {
                  parcelaRef.current = selectedParcela;
                  navigation.navigate('Capas', { parcela: parcelaRef.current });
                }}
                onIniciarCiclo={() => {
                  parcelaRef.current = selectedParcela;
                  navigation.navigate('IniciarCiclo', { parcela: parcelaRef.current });
                }} />
            )}

            {modoPanel === 'parcela' && activeTab === 'mapa' && (
              <>
                <IconLabel icon="map" label="Vista general" textStyle={[styles.panelTitulo, { marginBottom: 4 }]} />
                <View style={[styles.infoRow, { marginVertical: 10 }]}>
                  <View style={styles.infoStat}>
                    <Text style={styles.infoNum}>{parcelas.length}</Text>
                    <Text style={styles.infoLabel}>Parcelas</Text>
                  </View>
                  <View style={styles.infoSep} />
                  <View style={styles.infoStat}>
                    <Text style={styles.infoNum}>{zonas.length}</Text>
                    <Text style={styles.infoLabel}>Zonas activas</Text>
                  </View>
                </View>
                <Text style={styles.panelSub}>Toca una parcela en el mapa para ver sus detalles</Text>
              </>
            )}

            {modoPanel === 'parcela' && activeTab === 'parcelas' && (
              <NuevaParcelaScreen vertices={vertices} nombre={nombre}
              area={getArea(vertices)} onNombreChange={setNombre}
              guardando={guardandoParcela}
              onLimpiar={clearAll} onGuardar={saveParcel} onSyncOffline={syncOfflineParcelas}
              propietario={user?.nombreCompleto ?? ''}
              onPropietarioChange={(_v: string) => {}}/>
            )}
          </View>

          {modoPanel === 'parcela' && (
            <View style={styles.tabBar}>
              <TouchableOpacity
                style={[styles.tabItem, activeTab === 'mapa' && styles.tabActive]}
                onPress={() => { setActiveTab('mapa'); setVertices([]); }}>
                <Icon name="map" size={18} color="#2563eb" style={styles.tabIcon} />
                <Text style={[styles.tabLabel, activeTab === 'mapa' && styles.tabLabelActive]}>Mapa</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.tabItem}
                onPress={() => navigation.navigate('Zonas')}>
                <Icon name="map-marker" size={18} color="#f59e0b" style={styles.tabIcon} />
                <Text style={styles.tabLabel}>Zonas</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabItem, activeTab === 'parcelas' && styles.tabActive]}
                onPress={() => setActiveTab('parcelas')}>
                <Icon name="barley" size={18} color="#16a34a" style={styles.tabIcon} />
                <Text style={[styles.tabLabel, activeTab === 'parcelas' && styles.tabLabelActive]}>Parcelas</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.tabItem}
                onPress={() => syncOfflineParcelas()}
                onLongPress={verColaPendiente}>
                <Icon name="weather-cloudy" size={18} color="#0891b2" style={styles.tabIcon} />
                <Text style={styles.tabLabel}>Sincronizar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>}

        {menuParcela && (
  <View style={styles.parcelaSheet} pointerEvents="box-none">
    <ParcelaDetalleScreen

      parcela={menuParcela}
      onEditarDatos={() => {
        setMenuParcela(null);
        setSelectedParcela(parcelaRef.current);
        setEditingData({ ...parcelaRef.current });
        const pid = parcelaRef.current?.p_id;
        if (pid) fetchCapas(pid);
      }}
      onEditarGeometria={() => {
        const parcela = parcelaRef.current;
        const geom = parseGeom(parcela?.p_geometria ?? parcela?.geometria);
        let coords = (geom as any)?.coordinates?.[0] ?? [];
        if (coords.length > 1) {
          const f = coords[0]; const l = coords[coords.length - 1];
          if (f[0] === l[0] && f[1] === l[1]) coords = coords.slice(0, -1);
        }
        setMenuParcela(null);
        setEditingGeometry(coords.length ? coords : []);
        setParcelaEditandoId(parcela?.p_id ?? parcela?.id);
      }}
      onEliminar={() => {
        setMenuParcela(null);
        deleteParcel(parcelaRef.current?.p_id ?? parcelaRef.current?.id);
      }}
      onCerrar={() => setMenuParcela(null)}
      onActividades={() => {
        setMenuParcela(null);
        navigation.navigate('Actividades', { parcela: parcelaRef.current });
      }}
      onCapas={() => {
        setMenuParcela(null);
        navigation.navigate('Capas', { parcela: parcelaRef.current });
      }}
      onIniciarCiclo={() => {
        setMenuParcela(null);
        navigation.navigate('IniciarCiclo', { parcela: parcelaRef.current });
      }}
    />
  </View>
)}
        </View>{/* END map container */}

        <AppDrawer
          visible={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          menuItems={menuItems}
          userName={user?.nombreCompleto ?? ''}
          userRole={user?.rol ?? 'socio'}
          onAction={handleDrawerAction}
        />

        {/* Menú de opciones (⋮) */}
        <Modal visible={opcionesVisible} transparent animationType="fade" onRequestClose={() => setOpcionesVisible(false)}>
          <TouchableOpacity style={styles.opcionesOverlay} activeOpacity={1} onPress={() => setOpcionesVisible(false)}>
            <View style={styles.opcionesDropdown}>
              <TouchableOpacity style={styles.opcionesItem} onPress={() => { setOpcionesVisible(false); abrirEstadoSync(); }}>
                <Icon name="cloud-sync-outline" size={18} color="#333" />
                <Text style={styles.opcionesItemText}>Estado de sincronización</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.opcionesItem} onPress={() => { setOpcionesVisible(false); borrarCacheNoEnviada(); }}>
                <Icon name="trash-can-outline" size={18} color="#333" />
                <Text style={styles.opcionesItemText}>Borrar caché</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.opcionesItem} onPress={() => { setOpcionesVisible(false); mostrarVersionApp(); }}>
                <Icon name="information-outline" size={18} color="#333" />
                <Text style={styles.opcionesItemText}>Versión app</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Estado de sincronización */}
        <Modal visible={estadoSyncVisible} transparent animationType="slide" onRequestClose={() => setEstadoSyncVisible(false)}>
          <View style={styles.syncModalOverlay}>
            <View style={styles.syncModalPanel}>
              <View style={styles.syncModalHeader}>
                <Text style={styles.syncModalTitulo}>Estado de sincronización</Text>
                <TouchableOpacity onPress={() => setEstadoSyncVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Icon name="close" size={22} color="#333" />
                </TouchableOpacity>
              </View>
              {syncLog.length === 0 ? (
                <Text style={styles.syncModalVacio}>Todavía no hay registros creados en este dispositivo.</Text>
              ) : (
                <FlatList
                  data={syncLog}
                  keyExtractor={item => item.id}
                  renderItem={({ item }: { item: LoggedOperation }) => (
                    <View style={styles.syncRow}>
                      <View style={[
                        styles.syncEstadoBadge,
                        item.estado === 'enviado' ? styles.syncEstadoEnviado : styles.syncEstadoNoEnviado,
                      ]}>
                        <Text style={styles.syncEstadoText}>
                          {item.estado === 'enviado' ? 'ENVIADO' : 'NO ENVIADO'}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.syncRowTipo}>
                          {ENTIDAD_LABEL[item.entity] ?? item.entity} · {item.label}
                        </Text>
                        <Text style={styles.syncRowMeta}>
                          {fmtFechaCorta(item.createdAt)} · {item.usuario}
                        </Text>
                        {item.lastError && (
                          <Text style={styles.syncRowError}>⚠ {item.lastError}</Text>
                        )}
                      </View>
                    </View>
                  )}
                />
              )}
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container:    { flex: 1 },
  map:          { flex: 1 },
  opcionesOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.15)' },
  opcionesDropdown:  { position: 'absolute', top: 60, right: 10, backgroundColor: '#fff',
                       borderRadius: 10, paddingVertical: 4, minWidth: 220, elevation: 6,
                       shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                       shadowOpacity: 0.2, shadowRadius: 6 },
  opcionesItem:      { flexDirection: 'row', alignItems: 'center', gap: 10,
                       paddingHorizontal: 16, paddingVertical: 12 },
  opcionesItemText:  { fontSize: 14, color: '#333', fontWeight: '500' },
  syncModalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
  syncModalPanel:    { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16,
                       maxHeight: '70%', paddingBottom: 20 },
  syncModalHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                       padding: 16, borderBottomWidth: 0.5, borderBottomColor: '#e5e5e5' },
  syncModalTitulo:   { fontSize: 16, fontWeight: '700', color: '#1a2b16' },
  syncModalVacio:    { padding: 24, textAlign: 'center', color: '#999', fontSize: 13 },
  syncRow:           { flexDirection: 'row', alignItems: 'center', gap: 10,
                       paddingHorizontal: 16, paddingVertical: 10,
                       borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0' },
  syncEstadoBadge:   { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  syncEstadoEnviado:   { backgroundColor: '#dcfce7' },
  syncEstadoNoEnviado: { backgroundColor: '#fef3c7' },
  syncEstadoText:    { fontSize: 10, fontWeight: '700', color: '#333' },
  syncRowTipo:       { fontSize: 13, fontWeight: '600', color: '#1a2b16' },
  syncRowMeta:       { fontSize: 11, color: '#999', marginTop: 2 },
  syncRowError:      { fontSize: 11, color: '#b91c1c', marginTop: 3, fontWeight: '500' },
  marker:       { width: 24, height: 24, borderRadius: 12, backgroundColor: 'red',
                  justifyContent: 'center', alignItems: 'center' },
  editMarker:   { width: 24, height: 24, borderRadius: 12, backgroundColor: 'orange',
                  justifyContent: 'center', alignItems: 'center' },
  markerText:   { color: 'white', fontWeight: 'bold', fontSize: 12 },
  bottomStack:  { position: 'absolute', bottom: 10, left: 10, right: 10 },
  panel:        { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 15, marginBottom: 8 },
  infoCard:     { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 12, marginBottom: 8 },
  infoRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  infoStat:     { alignItems: 'center', flex: 1 },
  infoNum:      { fontSize: 22, fontWeight: '700', color: '#1a5c2a' },
  infoLabel:    { fontSize: 11, color: '#666', marginTop: 2 },
  infoSep:      { width: 1, height: 32, backgroundColor: '#e0e0e0' },
  tabBar:       { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 12,
                  flexDirection: 'row', padding: 6 },
  tabItem:      { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8 },
  tabActive:    { backgroundColor: 'rgba(26,92,42,0.1)' },
  tabIcon:      { fontSize: 18, marginBottom: 2 },
  tabLabel:     { fontSize: 11, color: '#888' },
  tabLabelActive: { color: '#1a5c2a', fontWeight: '700' },
  panelTitulo:  { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  panelSub:     { fontSize: 12, color: '#666', marginBottom: 6 },
  panelInfo:    { fontSize: 12, color: '#999', marginBottom: 8 },
  tipoRow:      { flexDirection: 'row', gap: 8, marginBottom: 10 },
  tipoBtn:      { borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
                  paddingVertical: 6, paddingHorizontal: 14 },
  tipoBtnTexto: { fontSize: 13, color: '#444' },
  btnRow:       { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  btnPrimario:  { backgroundColor: '#1a5c2a', borderRadius: 8, paddingVertical: 10,
                  paddingHorizontal: 16, flex: 1, alignItems: 'center' },
  btnTexto:     { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  btnSecundario:{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
                  paddingVertical: 10, paddingHorizontal: 12, alignItems: 'center' },
  btnSecTexto:  { fontSize: 13, color: '#444' },
  input:        { borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
                  paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8, fontSize: 15 },
  parcelaSheet: { position: 'absolute', bottom: 10, left: 10, right: 10 },
  btnUbicacion: { position: 'absolute', top: 10, right: 12,
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  width: 42, height: 42, borderRadius: 21,
                  justifyContent: 'center', alignItems: 'center', elevation: 5 },
  btnZonas:     { position: 'absolute', top: 62, right: 12,
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  paddingVertical: 8, paddingHorizontal: 14,
                  borderRadius: 20, elevation: 5 },
  btnZonasTexto:{ fontSize: 14, fontWeight: '600', color: '#1a5c2a' },
});

export default DashboardScreen;