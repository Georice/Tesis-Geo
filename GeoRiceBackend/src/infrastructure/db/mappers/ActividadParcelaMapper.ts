import { ActividadParcela } from '../../../domain/entities/ActividadParcela';
import { ProductoActividad } from '../../../domain/entities/ProductoActividad';
import { FaseCiclo } from '../../../domain/entities/FaseCiclo';
import { DetalleRiego } from '../../../domain/entities/DetalleRiego';
import { DetalleFumigacion } from '../../../domain/entities/DetalleFumigacion';
import { DetalleFertilizacion } from '../../../domain/entities/DetalleFertilizacion';
import { DetalleCosecha } from '../../../domain/entities/DetalleCosecha';
import { DetalleManoObra } from '../../../domain/entities/DetalleManoObra';
import { DetalleMaquinaria } from '../../../domain/entities/DetalleMaquinaria';

import { ActividadParcelaModel } from '../models/ActividadParcelaModel';
import { ProductoActividadModel } from '../models/ProductoActividadModel';
import { FaseCicloModel } from '../models/FaseCicloModel';
import { DetalleRiegoModel } from '../models/DetalleRiegoModel';
import { DetalleFumigacionModel } from '../models/DetalleFumigacionModel';
import { DetalleFertilizacionModel } from '../models/DetalleFertilizacionModel';
import { DetalleCosechaModel } from '../models/DetalleCosechaModel';
import { DetalleManoObraModel } from '../models/DetalleManoObraModel';
import { DetalleMaquinariaModel } from '../models/DetalleMaquinariaModel';

function mapProducto(m: ProductoActividadModel): ProductoActividad {
  return ProductoActividad.create({
    id:                 m.id,
    actividadId:        m.actividadId,
    nombre:             m.nombre,
    tipo:               m.tipo ?? null,
    dosis:              m.dosis ?? null,
    unidad:             m.unidad ?? null,
    dosisPorTanque:     m.dosisPorTanque ?? null,
    dosisHa:            m.dosisHa ?? null,
    dosisPorUnidadMo:   m.dosisPorUnidadMo ?? null,
    dosisTotal:         m.dosisTotal ?? null,
    presentacionMl:     m.presentacionMl ?? null,
    precioPresentacion: m.precioPresentacion ?? null,
    frascoUsados:       m.frascoUsados ?? null,
    precioUnitario:     m.precioUnitario ?? null,
    costoTotal:         m.costoTotal ?? null,
    updatedAt:          m.updatedAt,
  });
}

function mapFase(m?: FaseCicloModel | null): FaseCiclo | null {
  return m ? FaseCiclo.create({
    id:             m.id,
    codigo:         m.codigo,
    nombre:         m.nombre,
    tipoCiclo:      m.tipoCiclo,
    ordenFase:      m.ordenFase,
    ordenMin:       m.ordenMin,
    ordenMax:       m.ordenMax,
    tiposActividad: m.tiposActividad,
    descripcion:    m.descripcion ?? null,
    createdAt:      m.createdAt,
  }) : null;
}

function mapDetalleRiego(m?: DetalleRiegoModel | null): DetalleRiego | null {
  return m ? DetalleRiego.create({ actividadId: m.actividadId, laminaAgua: m.laminaAgua ?? null }) : null;
}

function mapDetalleFumigacion(m?: DetalleFumigacionModel | null): DetalleFumigacion | null {
  return m ? DetalleFumigacion.create({
    actividadId:     m.actividadId,
    plagaDetectada:  m.plagaDetectada ?? null,
    nivelDano:       m.nivelDano ?? null,
    capacidadTanque: m.capacidadTanque ?? null,
    numTanques:      m.numTanques ?? null,
  }) : null;
}

function mapDetalleFertilizacion(m?: DetalleFertilizacionModel | null): DetalleFertilizacion | null {
  return m ? DetalleFertilizacion.create({ actividadId: m.actividadId }) : null;
}

function mapDetalleCosecha(m?: DetalleCosechaModel | null): DetalleCosecha | null {
  return m ? DetalleCosecha.create({
    actividadId:   m.actividadId,
    rendimientoHa: m.rendimientoHa ?? null,
    totalSacos:    m.totalSacos ?? null,
    humedad:       m.humedad ?? null,
    precioQq:      m.precioQq ?? null,
    ingresoTotal:  m.ingresoTotal ?? null,
    costoCosecha:  m.costoCosecha ?? null,
    destino:       m.destino ?? null,
  }) : null;
}

function mapDetalleManoObra(m?: DetalleManoObraModel | null): DetalleManoObra | null {
  return m ? DetalleManoObra.create({
    actividadId:         m.actividadId,
    numJornales:         m.numJornales ?? null,
    pagoJornal:          m.pagoJornal ?? null,
    costoManoObra:       m.costoManoObra ?? null,
    unidadManoObra:      m.unidadManoObra ?? null,
    cantidadUnidadMo:    m.cantidadUnidadMo ?? null,
    precioUnidadMo:      m.precioUnidadMo ?? null,
    numTrabajadores:     m.numTrabajadores ?? null,
    pagoPorTrabajador:   m.pagoPorTrabajador ?? null,
    descripcionUnidadMo: m.descripcionUnidadMo ?? null,
    numTareas:           m.numTareas ?? null,
    precioTarea:         m.precioTarea ?? null,
    costoSembradores:    m.costoSembradores ?? null,
  }) : null;
}

function mapDetalleMaquinaria(m?: DetalleMaquinariaModel | null): DetalleMaquinaria | null {
  return m ? DetalleMaquinaria.create({
    actividadId:      m.actividadId,
    tipoMaquinaria:   m.tipoMaquinaria ?? null,
    unidadCobro:      m.unidadCobro ?? null,
    cantidadUnidades: m.cantidadUnidades ?? null,
    costoPorUnidad:   m.costoPorUnidad ?? null,
    costoMaquinaria:  m.costoMaquinaria ?? null,
  }) : null;
}

export class ActividadParcelaMapper {
  static toDomain(model: ActividadParcelaModel): ActividadParcela {
    return ActividadParcela.create({
      id:                    model.id,
      parcelaId:             model.parcelaId,
      capaId:                model.capaId ?? null,
      tipo:                  model.tipo,
      fecha:                 model.fecha,
      metodo:                model.metodo ?? null,
      insumo:                model.insumo ?? null,
      cantidad:              model.cantidad ?? null,
      unidad:                model.unidad ?? null,
      nivelAlerta:           model.nivelAlerta,
      observaciones:         model.observaciones ?? null,
      productos:             (model.productos ?? []).map(mapProducto),
      fechaRegistro:         model.fechaRegistro,
      cicloId:               model.cicloId ?? null,
      ordenPlantilla:        model.ordenPlantilla ?? null,
      faseId:                model.faseId ?? null,
      fase:                  mapFase(model.fase),
      estado:                model.estado,
      fechaInicio:           model.fechaInicio ?? null,
      fechaFin:              model.fechaFin ?? null,
      updatedAt:             model.updatedAt,
      createdBy:             model.createdBy,
      updatedBy:             model.updatedBy,
      numeroActividad:       model.numeroActividad ?? null,
      costoInsumos:          model.costoInsumos ?? null,
      costoTotalActividad:   model.costoTotalActividad ?? null,
      detalleRiego:          mapDetalleRiego(model.detalleRiego),
      detalleFumigacion:     mapDetalleFumigacion(model.detalleFumigacion),
      detalleFertilizacion:  mapDetalleFertilizacion(model.detalleFertilizacion),
      detalleCosecha:        mapDetalleCosecha(model.detalleCosecha),
      detalleManoObra:       mapDetalleManoObra(model.detalleManoObra),
      detalleMaquinaria:     mapDetalleMaquinaria(model.detalleMaquinaria),
    });
  }
}
