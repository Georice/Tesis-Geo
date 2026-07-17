import ExcelJS from 'exceljs';
import { ReporteResumen } from '../../domain/repositories/IReporteRepository';

export async function buildExcelReport(resumen: ReporteResumen): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'GeoRice';
  wb.created = new Date();

  const boldRow = (row: ExcelJS.Row) => { row.font = { bold: true }; };

  // ── Resumen ────────────────────────────────────────────────────────────
  const sResumen = wb.addWorksheet('Resumen');
  sResumen.columns = [{ header: 'Campo', key: 'campo', width: 32 }, { header: 'Valor', key: 'valor', width: 30 }];
  boldRow(sResumen.getRow(1));
  sResumen.addRows([
    { campo: 'Rango de fechas',      valor: `${resumen.filtros.fechaInicio} a ${resumen.filtros.fechaFin}` },
    { campo: 'Socio',                valor: resumen.filtros.socioNombre ?? 'Todos los socios' },
    { campo: 'Total actividades',    valor: resumen.resumen.totalActividades },
    { campo: 'Total ciclos',         valor: resumen.resumen.totalCiclos },
    { campo: 'Costo total',          valor: resumen.resumen.costoTotal },
    { campo: 'Área trabajada (ha)',  valor: resumen.resumen.areaTrabajada },
  ]);
  sResumen.addRow({});
  const rEstadoHeader = sResumen.addRow({ campo: 'Actividades por estado' });
  boldRow(rEstadoHeader);
  resumen.actividadesPorEstado.forEach(e => sResumen.addRow({ campo: e.estado, valor: e.cantidad }));

  // ── Costo por tipo ─────────────────────────────────────────────────────
  const sCosto = wb.addWorksheet('Costo por tipo');
  sCosto.columns = [
    { header: 'Tipo de actividad', key: 'tipo', width: 28 },
    { header: 'Cantidad',          key: 'cantidad', width: 14 },
    { header: 'Costo total',       key: 'costoTotal', width: 16 },
  ];
  boldRow(sCosto.getRow(1));
  resumen.costoPorTipo.forEach(t => sCosto.addRow(t));

  // ── Ciclos ─────────────────────────────────────────────────────────────
  const sCiclos = wb.addWorksheet('Ciclos');
  sCiclos.columns = [
    { header: 'ID',           key: 'id', width: 8 },
    { header: 'Tipo',         key: 'tipo', width: 20 },
    { header: 'Estado',       key: 'estado', width: 14 },
    { header: 'Fecha inicio', key: 'fechaInicio', width: 16 },
    { header: 'Fecha fin',    key: 'fechaFin', width: 16 },
    { header: 'Área (ha)',    key: 'areaSembrada', width: 12 },
    { header: 'Parcela',      key: 'parcelaNombre', width: 22 },
    { header: 'Costo total',  key: 'costoTotal', width: 16 },
  ];
  boldRow(sCiclos.getRow(1));
  resumen.ciclos.forEach(c => sCiclos.addRow(c));

  // ── Actividades ────────────────────────────────────────────────────────
  const sAct = wb.addWorksheet('Actividades');
  sAct.columns = [
    { header: 'ID',           key: 'id', width: 8 },
    { header: 'Fecha',        key: 'fecha', width: 16 },
    { header: 'Tipo',         key: 'tipo', width: 20 },
    { header: 'Estado',       key: 'estado', width: 14 },
    { header: 'Parcela',      key: 'parcelaNombre', width: 22 },
    { header: 'Ciclo',        key: 'cicloTipo', width: 18 },
    { header: 'Socio',        key: 'socioNombre', width: 24 },
    { header: 'Costo insumos', key: 'costoInsumos', width: 16 },
    { header: 'Costo total',  key: 'costoTotal', width: 16 },
  ];
  boldRow(sAct.getRow(1));
  resumen.actividades.forEach(a => sAct.addRow(a));

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
