import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, Alert, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import Mapbox from '@rnmapbox/maps';
import turfArea from '@turf/area';
import { type Polygon } from 'geojson';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Parcela } from './src/domain/entities/Parcela';
import { Zona }    from './src/domain/entities/Zona';

import { GetParcelas }           from './src/application/usecases/parcela/GetParcelas';
import { CreateParcela }         from './src/application/usecases/parcela/CreateParcela';
import { UpdateParcela }         from './src/application/usecases/parcela/UpdateParcela';
import { UpdateParcelaGeometry } from './src/application/usecases/parcela/UpdateParcelaGeometry';
import { DeleteParcela }         from './src/application/usecases/parcela/DeleteParcela';
import { GetZonas }              from './src/application/usecases/zona/GetZonas';
import { CreateZona }            from './src/application/usecases/zona/CreateZona';
import { UpdateZona }            from './src/application/usecases/zona/UpdateZona';
import { CreateCapa }            from './src/application/usecases/capa/CreateCapa';
import { GetCapas }              from './src/application/usecases/capa/GetCapas';

import NuevaParcela     from './src/screens/NuevaParcela';
import ParcelaDetalle   from './src/screens/ParcelaDetalle';
import ParcelaEditar    from './src/screens/ParcelaEditar';
import ParcelaGeometria from './src/screens/ParcelaGeometria';
import ZonasModal       from './src/screens/ZonasModal';
import ActividadesModal from './src/screens/ActividadesModal';
import CapasModal       from './src/screens/CapasModal';

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

const App = () => {
  const [vertices, setVertices]                   = useState<number[][]>([]);
  const [nombre, setNombre]                       = useState('');
  const [propietario, setPropietario]             = useState('');
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

  const [dibujandoZona, setDibujandoZona]         = useState(false);
  const [verticesZona, setVerticesZona]           = useState<number[][]>([]);
  const [nombreZona, setNombreZona]               = useState('');
  const [descripcionZona, setDescripcionZona]     = useState('');

  const [editandoZonaId, setEditandoZonaId]           = useState<number | null>(null);
  const [editandoZonaNombre, setEditandoZonaNombre]   = useState('');
  const [verticesZonaEdit, setVerticesZonaEdit]       = useState<number[][]>([]);

  const [zonasVisible, setZonasVisible]           = useState(false);
  const [actividadesVisible, setActividadesVisible] = useState(false);
  const [capasVisible, setCapasVisible]           = useState(false);

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

  const syncOfflineParcelas = async () => {
    try {
      const stored = await AsyncStorage.getItem('offlineParcelas');
      if (!stored) return;
      const offlineList = JSON.parse(stored);
      if (!offlineList.length) return;
      const remaining: any[] = [];
      for (const p of offlineList) {
        try { await CreateParcela(p); }
        catch { remaining.push(p); }
      }
      if (!remaining.length) {
        await AsyncStorage.removeItem('offlineParcelas');
        Alert.alert('Sincronización completa', 'Parcelas pendientes enviadas.');
        fetchParcelas();
      } else {
        await AsyncStorage.setItem('offlineParcelas', JSON.stringify(remaining));
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchParcelas();
    fetchZonas();
    syncOfflineParcelas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    if (dibujandoCapa)  { setVerticesCapa(c => [...c, coord]); return; }
    if (dibujandoZona)  { setVerticesZona(c => [...c, coord]); return; }
    if (editandoZonaId) { setVerticesZonaEdit(c => [...c, coord]); return; }
    if (editingGeometry.length > 0 || parcelaEditandoId) return;
    if (selectedParcela || editingData) {
      setSelectedParcela(null); setEditingData(null); return;
    }
    setVertices(c => [...c, coord]);
  };

  const clearAll = () => {
    setVertices([]); setNombre(''); setPropietario('');
    setSelectedParcela(null); setEditingData(null);
    setEditingGeometry([]); setParcelaEditandoId(null);
    setDibujandoCapa(false); setVerticesCapa([]); setParcelaParaCapa(null);
    setDibujandoZona(false); setVerticesZona([]); setNombreZona(''); setDescripcionZona('');
    setEditandoZonaId(null); setEditandoZonaNombre(''); setVerticesZonaEdit([]);
  };

  const saveParcel = async () => {
    if (vertices.length < 3) { Alert.alert('Error', 'Necesitas al menos 3 vértices.'); return; }
    if (!nombre.trim())       { Alert.alert('Error', 'Ingresa un nombre.'); return; }
    const geometria   = { type: 'Polygon', coordinates: [[...vertices, vertices[0]]] };
    const parcelaData = { nombre: nombre.trim(), propietario: propietario.trim() || 'Sin asignar',
                          cultivo: 'Arroz', estado: 'activo', geometria };
    try {
      await CreateParcela(parcelaData);
      Alert.alert('✅ Parcela guardada', `Área: ${getArea(vertices)} ha`);
      setVertices([]); setNombre(''); setPropietario('');
      fetchParcelas();
    } catch {
      try {
        const stored = await AsyncStorage.getItem('offlineParcelas');
        const list   = stored ? JSON.parse(stored) : [];
        list.push(parcelaData);
        await AsyncStorage.setItem('offlineParcelas', JSON.stringify(list));
        Alert.alert('Sin conexión', 'Guardado localmente.');
        setVertices([]); setNombre(''); setPropietario('');
      } catch (e) { console.error(e); }
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
      Alert.alert('✅ Datos actualizados');
      setEditingData(null); setSelectedParcela(null); fetchParcelas();
    } catch { Alert.alert('Error de conexión'); }
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
      Alert.alert('✅ Geometría actualizada', area ? `Área: ${area} ha` : '');
      setEditingGeometry([]); setParcelaEditandoId(null); setSelectedParcela(null);
      fetchParcelas();
    } catch { Alert.alert('Error de conexión'); }
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
    clearAll(); setDibujandoCapa(true); setParcelaParaCapa(parcela); setSelectedParcela(parcela);
  };

  const saveCapa = async () => {
    if (verticesCapa.length < 3) { Alert.alert('Error', 'Necesitas al menos 3 vértices.'); return; }
    const parcelaId = parcelaParaCapa?.p_id ?? parcelaParaCapa?.id;
    const geometria = { type: 'Polygon', coordinates: [[...verticesCapa, verticesCapa[0]]] };
    try {
      await CreateCapa(parcelaId, { tipo: tipoCapa, geometria });
      Alert.alert('✅ Capa guardada');
      setDibujandoCapa(false); setVerticesCapa([]); setParcelaParaCapa(null); setSelectedParcela(null);
      fetchCapas(parcelaId);
    } catch (e: any) { Alert.alert('Error', e.message ?? 'La capa debe estar dentro de la parcela'); }
  };

  const activarDibujoZona = () => { clearAll(); setDibujandoZona(true); };

  const saveZona = async () => {
    if (verticesZona.length < 3) { Alert.alert('Error', 'Necesitas al menos 3 vértices.'); return; }
    if (!nombreZona.trim())       { Alert.alert('Error', 'Ingresa un nombre.'); return; }
    const geometria = { type: 'Polygon', coordinates: [[...verticesZona, verticesZona[0]]] };
    try {
      const result = await CreateZona({ nombre: nombreZona.trim(), descripcion: descripcionZona.trim(), geometria });
      Alert.alert('✅ Zona guardada', `${(result as any).parcelasAsignadas ?? 0} parcelas asignadas`);
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
      Alert.alert('✅ Zona actualizada', `${(result as any).parcelasAsignadas ?? 0} parcelas asignadas`);
      setEditandoZonaId(null); setEditandoZonaNombre(''); setVerticesZonaEdit([]);
      fetchZonas(); fetchParcelas();
    } catch (e: any) { Alert.alert('Error', e.message ?? 'Error al actualizar zona'); }
  };

    // ── Render ────────────────────────────────────────────────────────────────
  console.log('MODO PANEL:', modoPanel);
  console.log('PARCELAS:', parcelas.length);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.container}>

        <Mapbox.MapView
          style={styles.map}
          styleURL={Mapbox.StyleURL.SatelliteStreet}
          localizeLabels={{ locale: 'es' }}
          onPress={handleMapPress}
          // @ts-ignore
          maxZoomLevel={18}>

          <Mapbox.Camera defaultSettings={{
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
                const feature: any = event?.features?.[0];
                if (feature?.properties) {
                  const props           = feature.properties;
                  const parcelaCompleta = parcelas.find(p => p.p_id === props.id);
                  setSelectedParcela({ ...parcelaCompleta, ...props, actividades: [] });
                  setEditingData(null); setEditingGeometry([]); setParcelaEditandoId(null);
                  setDibujandoCapa(false); setDibujandoZona(false);
                  setEditandoZonaId(null); setVerticesZonaEdit([]);
                  const pid = parcelaCompleta?.p_id ?? props.id;
                  if (pid) fetchCapas(pid);
                }
              }}>
              <Mapbox.FillLayer id="parcelasFill" style={{ fillColor: 'rgba(0,0,255,0.2)' }} />
              <Mapbox.LineLayer id="parcelasOutline" style={{ lineColor: 'blue', lineWidth: 2 }} />
            </Mapbox.ShapeSource>
          )}
        </Mapbox.MapView>

        {!dibujandoCapa && !dibujandoZona && !editandoZonaId && (
          <TouchableOpacity style={styles.btnZonas} onPress={() => setZonasVisible(true)}>
            <Text style={styles.btnZonasTexto}>🗺 Zonas</Text>
          </TouchableOpacity>
        )}

        <View style={styles.panel}>
          {modoPanel === 'nuevaCapa' && (
            <>
              <Text style={styles.panelTitulo}>🧩 Nueva capa — toca el mapa para dibujar</Text>
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
                  <Text style={styles.btnSecTexto}>↩ Deshacer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnSecundario}
                  onPress={() => { setDibujandoCapa(false); setVerticesCapa([]); setParcelaParaCapa(null); }}>
                  <Text style={[styles.btnSecTexto, { color: 'red' }]}>✕ Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btnPrimario, verticesCapa.length < 3 && { opacity: 0.4 }]}
                  onPress={saveCapa} disabled={verticesCapa.length < 3}>
                  <Text style={styles.btnTexto}>💾 Guardar</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {modoPanel === 'nuevaZona' && (
            <>
              <Text style={styles.panelTitulo}>🗺 Nueva zona — toca el mapa para dibujar</Text>
              <TextInput style={styles.input} value={nombreZona} onChangeText={setNombreZona}
                placeholder="Nombre de la zona *" placeholderTextColor="#aaa" />
              <TextInput style={styles.input} value={descripcionZona} onChangeText={setDescripcionZona}
                placeholder="Descripción (opcional)" placeholderTextColor="#aaa" />
              <Text style={styles.panelInfo}>Vértices: {verticesZona.length} · Área: {getArea(verticesZona)} ha</Text>
              <View style={styles.btnRow}>
                <TouchableOpacity style={styles.btnSecundario} onPress={() => setVerticesZona(v => v.slice(0, -1))}>
                  <Text style={styles.btnSecTexto}>↩ Deshacer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnSecundario}
                  onPress={() => { setDibujandoZona(false); setVerticesZona([]); setNombreZona(''); setDescripcionZona(''); }}>
                  <Text style={[styles.btnSecTexto, { color: 'red' }]}>✕ Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btnPrimario, (verticesZona.length < 3 || !nombreZona.trim()) && { opacity: 0.4 }]}
                  onPress={saveZona} disabled={verticesZona.length < 3 || !nombreZona.trim()}>
                  <Text style={styles.btnTexto}>💾 Guardar</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {modoPanel === 'editarZona' && (
            <>
              <Text style={styles.panelTitulo}>🗺 Editando: {editandoZonaNombre}</Text>
              <Text style={styles.panelSub}>Arrastra vértices o toca el mapa para agregar</Text>
              <Text style={styles.panelInfo}>Vértices: {verticesZonaEdit.length} · Área: {getArea(verticesZonaEdit)} ha</Text>
              <View style={styles.btnRow}>
                <TouchableOpacity style={styles.btnSecundario} onPress={() => setVerticesZonaEdit(v => v.slice(0, -1))}>
                  <Text style={styles.btnSecTexto}>↩ Deshacer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnSecundario}
                  onPress={() => { setEditandoZonaId(null); setEditandoZonaNombre(''); setVerticesZonaEdit([]); }}>
                  <Text style={[styles.btnSecTexto, { color: 'red' }]}>✕ Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btnPrimario, verticesZonaEdit.length < 3 && { opacity: 0.4 }]}
                  onPress={saveZonaGeometry} disabled={verticesZonaEdit.length < 3}>
                  <Text style={styles.btnTexto}>💾 Guardar</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {modoPanel === 'editarDatos' && (
            <ParcelaEditar editingData={editingData} onChangeData={setEditingData}
              onCancelar={() => setEditingData(null)} onGuardar={updateParcelData} />
          )}

          {modoPanel === 'editarGeom' && (
            <ParcelaGeometria editingGeometry={editingGeometry} area={getArea(editingGeometry)}
              onEliminarUltimo={() => setEditingGeometry(v => v.slice(0, -1))}
              onCancelar={() => { setEditingGeometry([]); setParcelaEditandoId(null); }}
              onGuardar={saveGeometryChanges} />
          )}

          {modoPanel === 'detalle' && selectedParcela && (
            <ParcelaDetalle parcela={selectedParcela}
              onEditarDatos={() => setEditingData({ ...selectedParcela })}
              onEditarGeometria={startEditGeometry}
              onEliminar={() => deleteParcel(selectedParcela.id ?? selectedParcela.p_id)}
              onCerrar={() => setSelectedParcela(null)}
              onActividades={() => setActividadesVisible(true)}
              onCapas={() => setCapasVisible(true)} />
          )}

          {modoPanel === 'parcela' && (
            <NuevaParcela vertices={vertices} nombre={nombre} propietario={propietario}
              area={getArea(vertices)} onNombreChange={setNombre}
              onPropietarioChange={setPropietario} onLimpiar={clearAll}
              onGuardar={saveParcel} onSyncOffline={syncOfflineParcelas} />
          )}
        </View>

        <ZonasModal visible={zonasVisible} onClose={() => setZonasVisible(false)}
          onZonasChanged={() => { fetchParcelas(); fetchZonas(); }}
          onNuevaZona={() => { setZonasVisible(false); activarDibujoZona(); }}
          onEditarZona={(zona) => { setZonasVisible(false); activarEditarZona(zona); }} />
        <ActividadesModal visible={actividadesVisible} parcela={selectedParcela}
          onClose={() => setActividadesVisible(false)} />
        <CapasModal visible={capasVisible} parcela={selectedParcela}
          onClose={() => setCapasVisible(false)}
          onNuevaCapa={() => { setCapasVisible(false); activarDibujoCapa(selectedParcela); }} />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container:    { flex: 1 },
  map:          { flex: 1 },
  marker:       { width: 24, height: 24, borderRadius: 12, backgroundColor: 'red',
                  justifyContent: 'center', alignItems: 'center' },
  editMarker:   { width: 24, height: 24, borderRadius: 12, backgroundColor: 'orange',
                  justifyContent: 'center', alignItems: 'center' },
  markerText:   { color: 'white', fontWeight: 'bold', fontSize: 12 },
  panel:        { position: 'absolute', bottom: 30, left: 10, right: 10,
                  backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 15 },
  panelTitulo:  { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  panelSub:     { fontSize: 12, color: '#666', marginBottom: 6 },
  panelInfo:    { fontSize: 12, color: '#999', marginBottom: 8 },
  tipoRow:      { flexDirection: 'row', gap: 8, marginBottom: 10 },
  tipoBtn:      { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 14 },
  tipoBtnTexto: { fontSize: 13, color: '#444' },
  btnRow:       { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  btnPrimario:  { backgroundColor: '#007AFF', borderRadius: 8, paddingVertical: 10,
                  paddingHorizontal: 16, flex: 1, alignItems: 'center' },
  btnTexto:     { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  btnSecundario:{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
                  paddingVertical: 10, paddingHorizontal: 12, alignItems: 'center' },
  btnSecTexto:  { fontSize: 13, color: '#444' },
  input:        { borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
                  paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8, fontSize: 15 },
  btnZonas:     { position: 'absolute', top: 50, right: 12, backgroundColor: 'rgba(255,255,255,0.95)',
                  paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20,
                  shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2, shadowRadius: 4, elevation: 5 },
  btnZonasTexto:{ fontSize: 14, fontWeight: '600', color: '#007AFF' },
});

export default App;