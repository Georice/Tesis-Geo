export type TipoActividad =
  | 'preparacion_suelo' | 'inundacion'
  | 'siembra_boleo'     | 'siembra_trasplante'
  | 'riego'             | 'fertilizacion'
  | 'fumigacion'        | 'deshierba'
  | 'cosecha'           | 'rozar_quemar'
  | 'soca_riego'        | 'soca_fertilizacion'
  | 'soca_fumigacion'   | 'cosecha_soca'
  | 'observacion';

export type NivelAlerta = 'normal' | 'alerta' | 'critico';

export type EstadoActividad = 'pendiente' | 'en_proceso' | 'completada';

// Tipos de actividad para los que se muestran TODAS las fases del ciclo
// (en vez de filtrar solo las fases donde ese tipo tiene sentido).
export const TIPOS_ACTIVIDAD_TODAS_FASES: TipoActividad[] = ['riego', 'soca_riego'];
