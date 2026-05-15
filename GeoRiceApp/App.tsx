import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import Mapbox from '@rnmapbox/maps';
import turfArea from '@turf/area';
import { type Polygon } from 'geojson';
import AsyncStorage from '@react-native-async-storage/async-storage';

Mapbox.setAccessToken('pk.eyJ1IjoiYmhlcnJlcmEyOCIsImEiOiJjbW90bTBjdTIwNWkzMnlwdnZpZzI3NXR4In0.Z0BnykgEo2A1MH_F-R_mxA');

const App = () => {
  const [vertices, setVertices] = useState<number[][]>([]);
  const [nombre, setNombre] = useState<string>('');
  const [propietario, setPropietario] = useState<string>('');
  const [parcelas, setParcelas] = useState<any[]>([]);
  const [selectedParcela, setSelectedParcela] = useState<any>(null);
  const [editingData, setEditingData] = useState<any>(null);
  const [editingGeometry, setEditingGeometry] = useState<number[][]>([]);
  const [parcelaEditandoId, setParcelaEditandoId] = useState<number | null>(null);

  const fetchParcelas = async () => {
    try {
      const response = await fetch('http://192.168.100.6:3000/api/parcelas');
      if (response.ok) {
        const data = await response.json();
//         setParcelas(data);
        const parcelasFormateadas = data.map((p: any) => ({
          id: p.p_id,
          nombre: p.p_nombre,
          propietario: p.p_propietario,
          cultivo: p.p_cultivo,
          area_ha: p.p_area_ha,
          geometria: JSON.parse(p.p_geometria),
        }));

        setParcelas(parcelasFormateadas);
        console.log('Parcelas cargadas:', data.length);
    if (data.length > 0) {
    //   console.log('Ejemplo de geometría:', JSON.stringify(data[0].geometria));
    // console.log(JSON.stringify(data, null, 2));
        console.log(
                'Ejemplo geometría:',
                JSON.stringify(parcelasFormateadas[0].geometria, null, 2)
              );
    }
      }
    } catch (_error) {
      console.error('Error al cargar parcelas:', _error);
    }
  };

  // Sincronizar parcelas guardadas offline cuando vuelve la conexión
  const syncOfflineParcelas = async () => {
    try {
      const stored = await AsyncStorage.getItem('offlineParcelas');
      if (!stored) return;
      const offlineList = JSON.parse(stored);
      if (offlineList.length === 0) return;

      const remaining: any[] = [];
      for (const p of offlineList) {
        try {
          const response = await fetch('http://192.168.100.6:3000/api/parcelas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(p),
          });
          if (!response.ok) {
            remaining.push(p);
          }
        } catch {
          remaining.push(p);
        }
      }

      if (remaining.length === 0) {
        await AsyncStorage.removeItem('offlineParcelas');
        Alert.alert('Sincronización completa', 'Todas las parcelas pendientes fueron enviadas.');
        fetchParcelas();
      } else {
        await AsyncStorage.setItem('offlineParcelas', JSON.stringify(remaining));
      }
    } catch (_error) {
      console.error('Error en sincronización:', _error);
    }
  };

  // useEffect(() => {
  //   fetchParcelas();
  //   syncOfflineParcelas(); // intenta enviar lo pendiente al cargar la app
  // }, []);
    useEffect(() => {
    fetchParcelas();
    syncOfflineParcelas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMapPress = (event: any) => {
    const {geometry} = event;
    if (editingGeometry.length > 0 || parcelaEditandoId) {
      setEditingGeometry(current => [...current, geometry.coordinates]);
      return;
    }
    if (selectedParcela || editingData) {
      setSelectedParcela(null);
      setEditingData(null);
      return;
    }
    setVertices(current => [...current, geometry.coordinates]);
  };

  const clearVertices = () => {
    setVertices([]);
    setSelectedParcela(null);
    setEditingData(null);
    setEditingGeometry([]);
    setParcelaEditandoId(null);
  };

  const getArea = (verts: number[][]): string => {
    if (verts.length < 3) return '0.00';
    const polygon: Polygon = {
      type: 'Polygon',
      coordinates: [[...verts, verts[0]]],
    };
    const areaM2 = turfArea(polygon);
    const areaHa = areaM2 / 10000;
    return areaHa.toFixed(2);
  };

  const polygonGeoJSON = {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [[...vertices, vertices[0]]],
      },
    }],
  } as GeoJSON.FeatureCollection;

  const editingPolygonGeoJSON = editingGeometry.length >= 3 ? {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [editingGeometry],
      },
    }],
  } as GeoJSON.FeatureCollection : null;

  const parcelasGeoJSON: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: parcelas.map(p => ({
      type: 'Feature',
      properties: {
        id: p.id,
        nombre: p.nombre,
        propietario: p.propietario,
        cultivo: p.cultivo,
        area_ha: p.area_ha,
      },
      geometry: p.geometria,
    })),
  };

  // Guardar localmente si falla la conexión
  const saveOfflineParcel = async (parcelaData: any) => {
    try {
      const stored = await AsyncStorage.getItem('offlineParcelas');
      const offlineList = stored ? JSON.parse(stored) : [];
      offlineList.push(parcelaData);
      await AsyncStorage.setItem('offlineParcelas', JSON.stringify(offlineList));
      Alert.alert('Sin conexión', 'La parcela se guardó localmente y se sincronizará cuando haya internet.');
      setVertices([]);
      setNombre('');
      setPropietario('');
    } catch (_error) {
      console.error('Error al guardar offline:', _error);
    }
  };

  const saveParcel = async () => {
    if (vertices.length < 3) {
      Alert.alert('Error', 'Necesitas al menos 3 vértices.');
      return;
    }
    if (!nombre.trim()) {
      Alert.alert('Error', 'Ingresa un nombre.');
      return;
    }
    const geometria = { type: 'Polygon', coordinates: [vertices] };
    const parcelaData = {
      nombre: nombre.trim(),
      propietario: propietario.trim() || 'Sin asignar',
      cultivo: 'Arroz',
      geometria,
    };

    try {
      const response = await fetch('http://192.168.100.6:3000/api/parcelas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parcelaData),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Parcela guardada', `Área: ${data.area_ha} ha (ID: ${data.id})`);
        setVertices([]);
        setNombre('');
        setPropietario('');
         setEditingGeometry([]);        // ← NUEVO
  setParcelaEditandoId(null);
        fetchParcelas();
      } else {
        Alert.alert('Error', data.error || 'No se pudo guardar');
      }
    // } catch (_error) {
    //   // Si falla la conexión, guarda offline
    //   saveOfflineParcel(parcelaData);
    // }

    //  } catch (error) {
    //   Alert.alert('Error de conexión', '¿Está corriendo el backend?');
    //   console.error(error);
    // }
    } catch {
      // Si falla la conexión, guarda offline
      saveOfflineParcel(parcelaData);
    }
  };

  const updateParcelData = async () => {
    if (!editingData) return;
    const { id, nombre: n, propietario: p, cultivo: c } = editingData;
    try {
      const response = await fetch(`http://192.168.100.6:3000/api/parcelas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: n?.trim() || undefined,
          propietario: p?.trim() || undefined,
          cultivo: c?.trim() || undefined,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Datos actualizados', `ID: ${data.id}`);
        setEditingData(null);
        setSelectedParcela(null);
        fetchParcelas();
      } else {
        Alert.alert('Error', data.error || 'No se pudo actualizar');
      }
    // } catch (_error) {
    //   Alert.alert('Error de conexión', '¿Está corriendo el backend?');
    // }
     } catch (error) {
      Alert.alert('Error de conexión', '¿Está corriendo el backend?');
      console.error(error);
    }
  };

  const saveGeometryChanges = async () => {
    if (!parcelaEditandoId) return;
    if (editingGeometry.length < 3) {
      Alert.alert('Error', 'Necesitas al menos 3 vértices.');
      return;
    }
    const geometria = { type: 'Polygon', coordinates: [editingGeometry] };
    try {
      const response = await fetch(`http://192.168.100.6:3000/api/parcelas/${parcelaEditandoId}/geometry`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geometria }),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Geometría actualizada', `Área: ${data.area_ha} ha`);
        setEditingGeometry([]);
        setParcelaEditandoId(null);
        setSelectedParcela(null);
        fetchParcelas();
      } else {
        Alert.alert('Error', data.error || 'No se pudo actualizar geometría');
      }
    } catch (error) {
      Alert.alert('Error de conexión', '¿Está corriendo el backend?');
      console.error(error);
    }
  };

  const startEditGeometry = () => {
    if (!selectedParcela) return;
    const coords = selectedParcela.geometria?.coordinates?.[0] || [];
    setEditingGeometry(coords);
    setParcelaEditandoId(selectedParcela.id);
  };

  const removeLastVertex = () => {
    setEditingGeometry(current => current.slice(0, -1));
  };

  const deleteParcel = (id: number) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`http://192.168.100.6:3000/api/parcelas/${id}`, {
                method: 'DELETE',
              });
              const data = await response.json();
              if (response.ok) {
                Alert.alert('Parcela eliminada', `ID: ${data.id}`);
                setSelectedParcela(null);
                setEditingData(null);
                setEditingGeometry([]);
                setParcelaEditandoId(null);
                fetchParcelas();
              } else {
                Alert.alert('Error', data.error || 'No se pudo eliminar');
              }
            } catch (error) {
      Alert.alert('Error de conexión', '¿Está corriendo el backend?');
      console.error(error);
    }
          },
        },
      ]
    );
  };

  console.log('editingGeometry.length:', editingGeometry.length, 'parcelas.length:', parcelas.length);
  return (
    <View style={styles.container}>
      <Mapbox.MapView
        style={styles.map}
        styleURL={Mapbox.StyleURL.SatelliteStreet}
        localizeLabels={{locale: 'es'}}
        onPress={handleMapPress}
        // @ts-ignore
        maxZoomLevel={18}>
        <Mapbox.Camera
          defaultSettings={{
            centerCoordinate: [-79.98893505962573, -1.9325948991925863],
            zoomLevel: 16,
          }}
        />

        {vertices.map((coord, index) => (
          <Mapbox.PointAnnotation key={`new-${index}`} id={`new-${index}`} coordinate={coord}>
            <View style={styles.marker}>
              <Text style={styles.markerText}>{index + 1}</Text>
            </View>
          </Mapbox.PointAnnotation>
        ))}

        {vertices.length >= 3 && (
          <Mapbox.ShapeSource id="polygonSource" shape={polygonGeoJSON}>
            <Mapbox.FillLayer id="polygonFill" style={{fillColor: 'rgba(0, 128, 0, 0.3)'}} />
            <Mapbox.LineLayer id="polygonOutline" style={{lineColor: 'green', lineWidth: 2}} />
          </Mapbox.ShapeSource>
        )}

        {editingGeometry.length > 0 && editingGeometry.map((coord, index) => (
          <Mapbox.PointAnnotation
            key={`edit-${index}`}
            id={`edit-${index}`}
            coordinate={coord}
            draggable
            onDragEnd={(e) => {
              const newCoords = e.geometry.coordinates;
              setEditingGeometry(current => {
                const updated = [...current];
                updated[index] = newCoords;
                return updated;
              });
            }}>
            <View style={styles.editMarker}>
              <Text style={styles.markerText}>{index + 1}</Text>
            </View>
          </Mapbox.PointAnnotation>
        ))}

        {editingPolygonGeoJSON && (
          <Mapbox.ShapeSource id="editingPolygonSource" shape={editingPolygonGeoJSON}>
            <Mapbox.FillLayer id="editingPolygonFill" style={{fillColor: 'rgba(255, 165, 0, 0.4)'}} />
            <Mapbox.LineLayer id="editingPolygonOutline" style={{lineColor: 'orange', lineWidth: 2}} />
          </Mapbox.ShapeSource>
        )}

        {parcelas.length > 0 && !editingGeometry.length && (
          <Mapbox.ShapeSource
            id="parcelasGuardadas"
            shape={parcelasGeoJSON}
            onPress={async (event: any) => {
              const feature: any = event?.features?.[0];
              if (feature?.properties) {
                const props = feature.properties;
                const parcelaCompleta = parcelas.find(p => p.id === props.id);
                setSelectedParcela({
                  ...parcelaCompleta,
                  actividades: [],
                });
                setEditingData(null);
                setEditingGeometry([]);
                setParcelaEditandoId(null);
              }
            }}>
            <Mapbox.FillLayer id="parcelasFill" style={{fillColor: 'rgba(0, 0, 255, 0.2)'}} />
            <Mapbox.LineLayer id="parcelasOutline" style={{lineColor: 'blue', lineWidth: 2}} />
          </Mapbox.ShapeSource>
        )}
      </Mapbox.MapView>

      <View style={styles.panel}>
        {editingData ? (
          <>
            <Text style={styles.detailTitle}>Editar datos de parcela {editingData.id}</Text>
            <Text style={styles.detailText}>Área: {editingData.area_ha} ha</Text>
            <TextInput
              style={styles.input}
              value={editingData.nombre}
              onChangeText={text => setEditingData({...editingData, nombre: text})}
              placeholder="Nombre"
            />
            <TextInput
              style={styles.input}
              value={editingData.propietario}
              onChangeText={text => setEditingData({...editingData, propietario: text})}
              placeholder="Propietario"
            />
            <TextInput
              style={styles.input}
              value={editingData.cultivo}
              onChangeText={text => setEditingData({...editingData, cultivo: text})}
              placeholder="Cultivo"
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.button} onPress={() => setEditingData(null)}>
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={updateParcelData}>
                <Text style={styles.buttonText}>Guardar cambios</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : editingGeometry.length > 0 ? (
          <>
            <Text style={styles.detailTitle}>Editando geometría</Text>
            <Text style={styles.detailText}>Vértices: {editingGeometry.length}</Text>
            <Text style={styles.detailText}>Área: {getArea(editingGeometry)} ha</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.button} onPress={removeLastVertex}>
                <Text style={styles.buttonText}>Eliminar último punto</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => { setEditingGeometry([]); setParcelaEditandoId(null); }}>
                <Text style={styles.buttonText}>Cancelar edición</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.button, styles.saveButton, {marginTop: 10}]}
              onPress={saveGeometryChanges}>
              <Text style={styles.buttonText}>Guardar cambios</Text>
            </TouchableOpacity>
          </>
        ) : selectedParcela ? (
          <>
            <Text style={styles.detailTitle}>Parcela {selectedParcela.nombre}</Text>
            <Text style={styles.detailText}>ID: {selectedParcela.id}</Text>
            <Text style={styles.detailText}>Propietario: {selectedParcela.propietario}</Text>
            <Text style={styles.detailText}>Cultivo: {selectedParcela.cultivo}</Text>
            <Text style={styles.detailText}>Área: {selectedParcela.area_ha} ha</Text>
            <Text style={styles.detailText}>
              Actividades: {selectedParcela.actividades?.length > 0 ? selectedParcela.actividades.join(', ') : 'Ninguna registrada'}
            </Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.button} onPress={() => setEditingData({...selectedParcela})}>
                <Text style={styles.buttonText}>Editar datos</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={startEditGeometry}>
                <Text style={styles.buttonText}>Editar geometría</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, {backgroundColor: 'red'}]}
                onPress={() => deleteParcel(selectedParcela.id)}>
                <Text style={styles.buttonText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.button, {marginTop: 10}]}
              onPress={() => setSelectedParcela(null)}>
              <Text style={styles.buttonText}>Cerrar</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.areaText}>Área: {getArea(vertices)} ha</Text>
            <Text style={styles.vertexText}>Vértices: {vertices.length}</Text>
            <TextInput style={styles.input} placeholder="Nombre de la parcela" value={nombre} onChangeText={setNombre} />
            <TextInput style={styles.input} placeholder="Propietario" value={propietario} onChangeText={setPropietario} />
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.button} onPress={clearVertices}>
                <Text style={styles.buttonText}>Limpiar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={saveParcel}>
                <Text style={styles.buttonText}>Guardar Parcela</Text>
              </TouchableOpacity>
            </View>
            {/* Botón para sincronizar manualmente */}
            <TouchableOpacity
              style={[styles.button, {marginTop: 10, backgroundColor: '#FFA500'}]}
              onPress={syncOfflineParcelas}>
              <Text style={styles.buttonText}>Sincronizar offline</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  map: {flex: 1},
  marker: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'red',
    justifyContent: 'center', alignItems: 'center',
  },
  editMarker: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'orange',
    justifyContent: 'center', alignItems: 'center',
  },
  markerText: {color: 'white', fontWeight: 'bold', fontSize: 12},
  panel: {
    position: 'absolute', bottom: 30, left: 10, right: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10, padding: 15,
  },
  areaText: {fontSize: 20, fontWeight: 'bold', textAlign: 'center'},
  vertexText: {textAlign: 'center', marginVertical: 5, color: 'gray'},
  detailTitle: {fontSize: 18, fontWeight: 'bold', marginBottom: 10},
  detailText: {fontSize: 16, marginBottom: 5},
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 5,
    paddingHorizontal: 10, paddingVertical: 8, marginBottom: 10, fontSize: 16,
  },
  buttonRow: {flexDirection: 'row', justifyContent: 'space-around', marginTop: 10},
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8,
  },
  saveButton: {backgroundColor: '#34C759'},
  buttonText: {color: 'white', fontWeight: 'bold'},
});

export default App;