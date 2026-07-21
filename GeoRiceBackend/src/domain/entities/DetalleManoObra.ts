import { ActividadParcela } from './ActividadParcela';

export interface DetalleManoObra {
  actividadId: number;
  actividad: ActividadParcela;
  numJornales: number;
  pagoJornal: number;
  costoManoObra: number;
  unidadManoObra: 'jornal' | 'tanque' | 'saco' | 'tarea' | 'otro';
  cantidadUnidadMo: number;
  precioUnidadMo: number;
  numTrabajadores: number;
  pagoPorTrabajador: number;
  descripcionUnidadMo: string;
  numTareas: number;
  precioTarea: number;
  costoSembradores: number;
}
