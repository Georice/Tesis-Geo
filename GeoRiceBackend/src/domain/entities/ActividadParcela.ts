import { Parcela }        from './Parcela';
import { CapaParcela }    from './CapaParcela';
import { ProductoActividad } from './ProductoActividad';
import { CicloActividad } from './CicloActividad';
import { FaseCiclo } from './FaseCiclo';
import { DetalleRiego } from './DetalleRiego';
import { DetalleFumigacion } from './DetalleFumigacion';
import { DetalleFertilizacion } from './DetalleFertilizacion';
import { DetalleCosecha } from './DetalleCosecha';
import { DetalleManoObra } from './DetalleManoObra';
import { DetalleMaquinaria } from './DetalleMaquinaria';

export interface ActividadParcela {
  id: number;
  parcelaId: number;
  parcela: Parcela;
  capaId: number;
  capa: CapaParcela;
  tipo:
    | 'preparacion_suelo' | 'inundacion'
    | 'siembra_boleo'     | 'siembra_trasplante'
    | 'riego'             | 'fertilizacion'
    | 'fumigacion'        | 'deshierba'
    | 'cosecha'           | 'rozar_quemar'
    | 'soca_riego'        | 'soca_fertilizacion'
    | 'soca_fumigacion'   | 'cosecha_soca'
    | 'observacion';
  fecha: Date;
  metodo: string;
  insumo: string;
  cantidad: number;
  unidad: string;
  nivelAlerta: 'normal' | 'alerta' | 'critico';
  observaciones: string;
  productos: ProductoActividad[];
  fechaRegistro: Date;
  cicloId: number;
  ciclo: CicloActividad;
  ordenPlantilla: number;
  faseId: number;
  fase: FaseCiclo;
  estado: 'pendiente' | 'en_proceso' | 'completada';
  fechaInicio: Date;
  fechaFin: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
  numeroActividad: number;
  costoInsumos: number;
  costoTotalActividad: number;
  detalleRiego: DetalleRiego;
  detalleFumigacion: DetalleFumigacion;
  detalleFertilizacion: DetalleFertilizacion;
  detalleCosecha: DetalleCosecha;
  detalleManoObra: DetalleManoObra;
  detalleMaquinaria: DetalleMaquinaria;
}
