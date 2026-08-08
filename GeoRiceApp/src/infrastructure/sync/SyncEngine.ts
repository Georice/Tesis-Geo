import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { apiFetch, STORAGE_KEYS } from '../repositories/ApiClient';

// Snapshot local de todo lo que el usuario puede ver, tal como lo entrega
// GET /api/sync (filas casi crudas, no entidades de dominio mapeadas —
// cada repositorio se encarga de mapearlas igual que hace con la red).
export interface SyncSnapshot {
  parcelas:    any[];
  zonas:       any[];
  capas:       any[];
  actividades: any[];
  ciclos:      any[];
  productos:   any[];
}

const EMPTY_SNAPSHOT: SyncSnapshot = {
  parcelas: [], zonas: [], capas: [], actividades: [], ciclos: [], productos: [],
};

export type QueuedEntity = 'parcela' | 'zona' | 'capa' | 'actividad' | 'ciclo';
export type QueuedMethod = 'POST' | 'PUT' | 'DELETE';

export interface QueuedOperation {
  id:             string;
  entity:         QueuedEntity;
  method:         QueuedMethod;
  path:           string;
  body?:          unknown;
  label:          string; // descripción legible para mostrar al usuario
  createdAt:      string;
  // Si esta operación crea/edita algo que cuelga de uno o más registros
  // creados offline (p. ej. una actividad sobre una parcela que todavía no
  // tiene id real, o que se engancha a un ciclo activo que tampoco se ha
  // sincronizado), `path` y/o `body` contienen el placeholder de
  // `dependencyToken(opId)` en vez del id real, y esta operación no se
  // intenta hasta que TODOS los opId listados aquí se hayan sincronizado —
  // recién ahí se sustituyen por los ids reales devueltos por el servidor
  // (ver flushQueue).
  dependsOnOpIds?: string[];
  // Motivo del último rechazo del servidor (si lo hubo). Se limpia si un
  // reintento posterior sí logra enviarla. Sirve para que el usuario vea
  // POR QUÉ algo se quedó "no enviado" en vez de reintentar en silencio
  // para siempre sin ninguna explicación.
  lastError?: string;
}

// Un registro creado offline que ya se muestra en la UI (con id temporal
// negativo) mientras su POST real sigue en la cola. `queuedOpId` lo liga a
// la QueuedOperation correspondiente para poder borrarlo cuando esa
// operación se sincronice de verdad (ver flushQueue).
export interface LocalRecord {
  tempId:     number;
  entity:     QueuedEntity;
  data:       any;
  queuedOpId: string;
  createdAt:  string;
}

// Entrada de historial para la pantalla "Estado de sincronización" — solo
// para visualizar qué se creó offline, quién lo creó y si ya se envió.
export interface LoggedOperation {
  id:        string; // mismo id que la QueuedOperation que la originó
  entity:    QueuedEntity;
  label:     string;
  usuario:   string;
  createdAt: string;
  estado:    'enviado' | 'no_enviado';
  lastError?: string;
}

// El servidor rechaza "iniciar ciclo" si la parcela ya tiene un ciclo
// activo — mensaje textual exacto que usa el backend (ver
// GeoRiceBackend IniciarCiclo.ts). Cuando eso es lo que hizo fallar una
// operación encolada, se traduce a un mensaje más claro para el usuario en
// vez de mostrar el texto crudo del backend.
function mensajeAmigable(rawError: string): string {
  if (/ciclo activo/i.test(rawError)) {
    return 'Ya inició un ciclo con diferentes actividades. Termine el ciclo para crear una actividad.';
  }
  return rawError;
}

const SYNC_LOG_MAX = 200;

// Se lanza cuando una mutación no pudo llegar al servidor por falta de
// conexión y quedó encolada para reintentarse automáticamente. Las
// pantallas pueden capturarla para dar una UX específica ("guardado
// localmente"), o dejarla propagar como un Error normal con mensaje claro.
export class OfflineQueuedError extends Error {
  constructor(message = 'Sin conexión. Se guardó localmente y se enviará automáticamente cuando vuelva la señal.') {
    super(message);
    this.name = 'OfflineQueuedError';
  }
}

// Distingue un fallo de conectividad (fetch no pudo ni siquiera llegar al
// servidor: sin red, DNS, timeout) de un error de negocio devuelto por un
// servidor SÍ alcanzable (validación, 403, etc.) — solo el primero debe
// disparar caché/cola offline.
function isNetworkError(err: unknown): boolean {
  if (err instanceof OfflineQueuedError) return false;
  if (err instanceof Error && err.message === 'SESSION_EXPIRED') return false;
  return true;
}

function toSnapshot(data: any): SyncSnapshot {
  return {
    parcelas:    data?.parcelas    ?? [],
    zonas:       data?.zonas       ?? [],
    capas:       data?.capas       ?? [],
    actividades: data?.actividades ?? [],
    ciclos:      data?.ciclos      ?? [],
    productos:   data?.productos   ?? [],
  };
}

// El sync incremental (?since=) no reporta borrados; los registros
// eliminados en el servidor mientras el dispositivo estuvo offline quedan
// en caché hasta el próximo `resetAndPull()`. Limitación conocida y
// aceptable para el alcance de este proyecto.
function mergeById(prevList: any[], incomingList: any[]): any[] {
  const byId = new Map(prevList.map(item => [item.id, item]));
  for (const item of incomingList) byId.set(item.id, item);
  return Array.from(byId.values());
}

function mergeSnapshots(prev: SyncSnapshot, incoming: any): SyncSnapshot {
  const next = toSnapshot(incoming);
  return {
    parcelas:    mergeById(prev.parcelas, next.parcelas),
    zonas:       mergeById(prev.zonas, next.zonas),
    capas:       mergeById(prev.capas, next.capas),
    actividades: mergeById(prev.actividades, next.actividades),
    ciclos:      mergeById(prev.ciclos, next.ciclos),
    productos:   mergeById(prev.productos, next.productos),
  };
}

export const SyncEngine = {
  isNetworkError,
  OfflineQueuedError,

  async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return !!state.isConnected && state.isInternetReachable !== false;
  },

  // Ejecuta `onReconnect` cada vez que la app pasa de sin-señal a con-señal.
  // Devuelve la función para des-suscribirse.
  subscribeConnectivity(onReconnect: () => void): () => void {
    let wasOffline = false;
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = !!state.isConnected && state.isInternetReachable !== false;
      if (online && wasOffline) onReconnect();
      wasOffline = !online;
    });
    return unsubscribe;
  },

  // ── Descarga (pull) ──────────────────────────────────────────────
  // Login/reconexión: descarga incremental si ya hay un timestamp previo,
  // completa si es la primera vez.
  async pull(): Promise<SyncSnapshot> {
    const since = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_TIMESTAMP);
    const query = since ? `?since=${encodeURIComponent(since)}` : '';
    const res   = await apiFetch(`/sync${query}`);
    if (!res.ok) {
      await res.text().catch(() => {});
      throw new Error(`GET /sync falló: ${res.status}`);
    }
    const data = await res.json();

    const merged = since
      ? mergeSnapshots(await this.getCached(), data)
      : toSnapshot(data);

    await AsyncStorage.setItem(STORAGE_KEYS.SYNC_DATA, JSON.stringify(merged));
    await AsyncStorage.setItem(STORAGE_KEYS.SYNC_TIMESTAMP, data.timestamp ?? new Date().toISOString());
    return merged;
  },

  // Fuerza una descarga completa (ignora el timestamp incremental).
  async resetAndPull(): Promise<SyncSnapshot> {
    await AsyncStorage.removeItem(STORAGE_KEYS.SYNC_TIMESTAMP);
    return this.pull();
  },

  async getCached(): Promise<SyncSnapshot> {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_DATA);
    return raw ? JSON.parse(raw) : EMPTY_SNAPSHOT;
  },

  // Corrige en el snapshot cacheado un registro puntual justo después de una
  // mutación ONLINE exitosa que no dispara un pull() completo (p. ej.
  // finalizar un ciclo). Sin esto, una lectura offline inmediatamente
  // después (getByParcela cae a getCached() sin red) seguiría mostrando el
  // estado viejo hasta el próximo login/resetAndPull — p. ej. un ciclo ya
  // finalizado en el servidor pero que la caché todavía marca "activo".
  async patchCachedEntity(field: keyof SyncSnapshot, id: number, patch: Record<string, any>): Promise<void> {
    const cached = await this.getCached();
    const list = cached[field] as any[];
    const idx = list.findIndex(item => item.id === id);
    if (idx === -1) return;
    list[idx] = { ...list[idx], ...patch };
    await AsyncStorage.setItem(STORAGE_KEYS.SYNC_DATA, JSON.stringify(cached));
  },

  // Igual necesidad que patchCachedEntity, pero para creaciones/ediciones
  // online donde ya se tiene el objeto completo que devolvió el servidor:
  // lo reemplaza si ya existía (por id) o lo agrega si es nuevo. Llamar
  // justo después de un create()/update() exitoso evita que una lectura
  // offline inmediatamente después (getCached()) siga mostrando el estado
  // de antes de esa mutación hasta el próximo login/resetAndPull.
  async upsertCachedEntity(field: keyof SyncSnapshot, item: any): Promise<void> {
    if (item?.id == null) return;
    const cached = await this.getCached();
    const list = cached[field] as any[];
    const idx = list.findIndex(i => i.id === item.id);
    if (idx === -1) list.push(item); else list[idx] = item;
    await AsyncStorage.setItem(STORAGE_KEYS.SYNC_DATA, JSON.stringify(cached));
  },

  // Contraparte de upsertCachedEntity para eliminaciones online exitosas —
  // sin esto, un registro borrado en el servidor reaparecería en cualquier
  // lectura offline posterior (cae a esta misma caché) hasta el próximo
  // pull() completo.
  async removeCachedEntity(field: keyof SyncSnapshot, id: number): Promise<void> {
    const cached = await this.getCached();
    const list = cached[field] as any[];
    const next = list.filter(i => i.id !== id);
    if (next.length === list.length) return;
    (cached as any)[field] = next;
    await AsyncStorage.setItem(STORAGE_KEYS.SYNC_DATA, JSON.stringify(cached));
  },

  // ── Cola de mutaciones pendientes ───────────────────────────────
  // Devuelve el id generado para la operación, para poder ligarla a un
  // LocalRecord (ver addLocalRecord) cuando la mutación es una creación, o
  // para que otra operación dependiente la referencie vía dependsOnOpId.
  async enqueue(op: Omit<QueuedOperation, 'id' | 'createdAt'>): Promise<string> {
    const queue = await this.getQueue();
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const createdAt = new Date().toISOString();
    queue.push({ ...op, id, createdAt });
    await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
    await this.logOperation(id, op.entity, op.label, createdAt);
    return id;
  },

  async getQueue(): Promise<QueuedOperation[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
    return raw ? JSON.parse(raw) : [];
  },

  // Placeholder a usar en `path` cuando una operación depende de un id que
  // todavía no existe (p. ej. `/parcelas/${dependencyToken(opId)}/actividades`).
  // flushQueue lo sustituye por el id real una vez que esa operación padre
  // se sincroniza.
  //
  // Cuando la operación padre es "iniciar ciclo", UNA sola operación crea
  // el ciclo Y hasta 11 actividades de la plantilla — no alcanza con el
  // opId para identificar a cuál de esas actividades se refiere. En ese
  // caso se pasa además `ordenPlantilla` para formar una clave compuesta
  // (`opId:orden`) que sí distingue cada actividad generada (ver
  // flushQueue, donde se resuelve una entrada por cada una).
  dependencyToken(opId: string, ordenPlantilla?: number): string {
    return ordenPlantilla != null ? `{{${opId}:${ordenPlantilla}}}` : `{{${opId}}}`;
  },

  // Sustituye cualquier placeholder `{{key}}` presente en `path` por el id
  // real ya resuelto (key es el opId solo, o `opId:ordenPlantilla`).
  substitutePathTokens(path: string, resolvedIds: Map<string, number>): string {
    let out = path;
    for (const [key, realId] of resolvedIds) {
      out = out.split(`{{${key}}}`).join(String(realId));
    }
    return out;
  },

  // Igual que arriba pero para un campo del body (p. ej. `cicloId` de una
  // actividad que se engancha a un ciclo todavía sin id real). El
  // placeholder viaja como STRING dentro del JSON (`"cicloId":"{{key}}"`);
  // acá se sustituye por el número real sin comillas, para que quede como
  // un id numérico válido en vez de un string.
  substituteBodyTokens(body: unknown, resolvedIds: Map<string, number>): unknown {
    if (body === undefined) return body;
    let json = JSON.stringify(body);
    for (const [key, realId] of resolvedIds) {
      json = json.split(`"{{${key}}}"`).join(String(realId));
    }
    return JSON.parse(json);
  },

  // Reintenta cada operación pendiente, respetando dependencias: una
  // operación con `dependsOnOpIds` no se intenta hasta que TODAS esas otras
  // se hayan sincronizado y se conozca su id real (por eso se procesa en
  // pasadas). Las que fallan por red se conservan; las que el servidor
  // rechaza (validación) también se conservan para revisión manual, ya que
  // reintentarlas indefinidamente sin cambios no serviría de nada.
  async flushQueue(): Promise<{ sent: number; pending: number }> {
    let queue = await this.getQueue();
    if (!queue.length) return { sent: 0, pending: 0 };

    const resolvedIds = new Map<string, number>(); // opId de la op padre -> id real
    let sent = 0;
    let progress = true;

    while (progress && queue.length > 0) {
      progress = false;
      const stillPending: QueuedOperation[] = [];

      for (const op of queue) {
        if (op.dependsOnOpIds?.some(id => !resolvedIds.has(id))) {
          stillPending.push(op);
          continue;
        }

        const path = this.substitutePathTokens(op.path, resolvedIds);
        const body = this.substituteBodyTokens(op.body, resolvedIds);

        try {
          const res = await apiFetch(path, {
            method: op.method,
            body:   body !== undefined ? JSON.stringify(body) : undefined,
          });
          if (res.ok) {
            sent++;
            progress = true;
            if (op.method === 'POST') {
              const json = await res.json().catch(() => null);
              // "Iniciar ciclo" responde { ciclo: {...}, actividades: [...] }
              // en vez de un objeto plano con `id` — hay que mirar ahí
              // también, si no, el id real nunca se captura y cualquier
              // operación dependiente (p. ej. una actividad enganchada a
              // este ciclo) se queda pendiente para siempre.
              const realId = json?.id ?? json?.ciclo?.id;
              if (realId != null) resolvedIds.set(op.id, realId);
              // Además de la ciclo en sí, "iniciar ciclo" crea de una vez
              // las actividades de su plantilla. Cada una se resuelve por
              // separado (clave compuesta `opId:ordenPlantilla`) para que
              // una edición hecha offline sobre una de esas actividades
              // (ver ActividadRepository.update) sepa a cuál id real
              // apuntar una vez sincronizado el ciclo.
              if (Array.isArray(json?.actividades)) {
                for (const act of json.actividades) {
                  if (act?.ordenPlantilla != null && act?.id != null) {
                    resolvedIds.set(`${op.id}:${act.ordenPlantilla}`, act.id);
                  }
                }
              }
            }
            // El registro local temporal (si lo había) ya cumplió su
            // función: el siguiente pull() trae la versión real del servidor.
            await this.removeLocalRecordByOpId(op.id);
            await this.markLogSent(op.id);
          } else {
            // El servidor SÍ respondió pero rechazó la operación (no es un
            // problema de red) — se guarda el motivo para que el usuario
            // pueda verlo en vez de quedarse "pendiente" sin explicación.
            const json = await res.json().catch(() => ({}));
            const mensaje = mensajeAmigable(json?.error || `No se pudo completar (código ${res.status})`);
            op.lastError = mensaje;
            await this.markLogError(op.id, mensaje);
            stillPending.push(op);
          }
        } catch {
          stillPending.push(op);
        }
      }

      queue = stillPending;
    }

    await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));

    if (sent > 0) {
      try { await this.pull(); } catch { /* se reintentará en la próxima sync */ }
    }

    return { sent, pending: queue.length };
  },

  // Descarta una operación pendiente que nunca va a poder sincronizarse
  // (rechazada por el servidor de forma permanente, o dependía de algo que
  // ya no aplica) junto con su registro local asociado, si lo tiene. Es una
  // salida de emergencia manual — no se llama automáticamente.
  async discardOperation(opId: string): Promise<void> {
    const queue = await this.getQueue();
    await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue.filter(op => op.id !== opId)));
    await this.removeLocalRecordByOpId(opId);
    const log = await this.getLog();
    await AsyncStorage.setItem(STORAGE_KEYS.SYNC_LOG, JSON.stringify(log.filter(l => l.id !== opId)));
  },

  // ── Historial para "Estado de sincronización" (solo lectura) ───────
  async logOperation(opId: string, entity: QueuedEntity, label: string, createdAt: string): Promise<void> {
    const userRaw = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    const usuario = userRaw ? (JSON.parse(userRaw).nombreCompleto ?? 'Desconocido') : 'Desconocido';
    const log = await this.getLog();
    log.unshift({ id: opId, entity, label, usuario, createdAt, estado: 'no_enviado' });
    await AsyncStorage.setItem(STORAGE_KEYS.SYNC_LOG, JSON.stringify(log.slice(0, SYNC_LOG_MAX)));
  },

  async markLogSent(opId: string): Promise<void> {
    const log = await this.getLog();
    const entry = log.find(l => l.id === opId);
    if (entry) {
      entry.estado = 'enviado';
      entry.lastError = undefined;
      await AsyncStorage.setItem(STORAGE_KEYS.SYNC_LOG, JSON.stringify(log));
    }
  },

  async markLogError(opId: string, mensaje: string): Promise<void> {
    const log = await this.getLog();
    const entry = log.find(l => l.id === opId);
    if (entry) {
      entry.lastError = mensaje;
      await AsyncStorage.setItem(STORAGE_KEYS.SYNC_LOG, JSON.stringify(log));
    }
  },

  async getLog(): Promise<LoggedOperation[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_LOG);
    return raw ? JSON.parse(raw) : [];
  },

  // ── Registros locales optimistas (creados offline, aún sin id real) ──
  // Genera un id temporal negativo único para usar como p_id/id mientras
  // el registro real no existe en el servidor.
  nextTempId(): number {
    return -(Date.now() * 1000 + Math.floor(Math.random() * 1000));
  },

  async addLocalRecord(entity: QueuedEntity, tempId: number, data: any, queuedOpId: string): Promise<void> {
    const all = await this.getAllLocalRecords();
    all.push({ tempId, entity, data, queuedOpId, createdAt: new Date().toISOString() });
    await AsyncStorage.setItem(STORAGE_KEYS.LOCAL_RECORDS, JSON.stringify(all));
  },

  async getLocalRecords(entity: QueuedEntity): Promise<LocalRecord[]> {
    const all = await this.getAllLocalRecords();
    return all.filter(r => r.entity === entity);
  },

  // Para resolver de qué operación depende crear algo sobre un registro
  // todavía-no-sincronizado (p. ej. una actividad sobre una parcela con id
  // temporal): dado el id temporal del padre, devuelve el opId que hay que
  // referenciar con dependsOnOpId + dependencyToken.
  async findLocalRecord(entity: QueuedEntity, tempId: number): Promise<LocalRecord | undefined> {
    const records = await this.getLocalRecords(entity);
    return records.find(r => r.tempId === tempId);
  },

  async getAllLocalRecords(): Promise<LocalRecord[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.LOCAL_RECORDS);
    return raw ? JSON.parse(raw) : [];
  },

  async removeLocalRecordByOpId(queuedOpId: string): Promise<void> {
    const all = await this.getAllLocalRecords();
    const next = all.filter(r => r.queuedOpId !== queuedOpId);
    if (next.length !== all.length) {
      await AsyncStorage.setItem(STORAGE_KEYS.LOCAL_RECORDS, JSON.stringify(next));
    }
  },

  // A diferencia de removeLocalRecordByOpId, borra solo ESE registro por su
  // tempId — necesario cuando varios registros comparten queuedOpId (las
  // actividades de una plantilla de ciclo) y se quiere descartar solo uno.
  async removeLocalRecord(entity: QueuedEntity, tempId: number): Promise<void> {
    const all = await this.getAllLocalRecords();
    const next = all.filter(r => !(r.entity === entity && r.tempId === tempId));
    if (next.length !== all.length) {
      await AsyncStorage.setItem(STORAGE_KEYS.LOCAL_RECORDS, JSON.stringify(next));
    }
  },

  // Aplica una edición hecha offline directamente sobre el registro local
  // (para que la UI la refleje de inmediato) sin tocar su `queuedOpId` — la
  // operación PUT real que la sincroniza se encola aparte (ver
  // ActividadRepository.update).
  async updateLocalRecord(entity: QueuedEntity, tempId: number, patch: any): Promise<LocalRecord | undefined> {
    const all = await this.getAllLocalRecords();
    const record = all.find(r => r.entity === entity && r.tempId === tempId);
    if (!record) return undefined;
    record.data = { ...record.data, ...patch };
    await AsyncStorage.setItem(STORAGE_KEYS.LOCAL_RECORDS, JSON.stringify(all));
    return record;
  },
};
