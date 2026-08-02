import PDFDocument from 'pdfkit';
import { ReporteResumen } from '../../domain/repositories/IReporteRepository';

const VERDE      = '#1a5c2a';
const GRIS       = '#444444';
const FILA_PAR   = '#f3f4f6';
const BORDE      = '#d0d5dd';

function formatFecha(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

function money(n: number): string {
  return `$${n.toFixed(2)}`;
}

interface Columna {
  header: string;
  width:  number;
  key:    string;
  align?: 'left' | 'right' | 'center';
}

// Dibuja una tabla simple (encabezado verde + filas con sombreado alterno),
// con salto de página automático repitiendo el encabezado.
function drawTable(doc: PDFKit.PDFDocument, x: number, startY: number, columnas: Columna[], filas: any[]): number {
  const anchoTotal   = columnas.reduce((a, c) => a + c.width, 0);
  const altoFila      = 18;
  const altoHeader     = 20;
  const pageBottom     = doc.page.height - doc.page.margins.bottom;
  let y = startY;

  const dibujarHeader = () => {
    doc.rect(x, y, anchoTotal, altoHeader).fill(VERDE);
    doc.fillColor('#fff').fontSize(8).font('Helvetica-Bold');
    let cx = x;
    columnas.forEach(col => {
      doc.text(col.header, cx + 4, y + 6, { width: col.width - 8, align: col.align ?? 'left', lineBreak: false });
      cx += col.width;
    });
    doc.font('Helvetica');
    y += altoHeader;
  };

  dibujarHeader();

  if (filas.length === 0) {
    doc.fillColor(GRIS).fontSize(9).text('Sin datos en el rango seleccionado.', x + 4, y + 5);
    return y + altoFila + 10;
  }

  filas.forEach((fila, i) => {
    if (y + altoFila > pageBottom) {
      doc.addPage();
      y = doc.page.margins.top;
      dibujarHeader();
    }

    if (i % 2 === 1) {
      doc.rect(x, y, anchoTotal, altoFila).fill(FILA_PAR);
    }

    doc.fillColor('#333').fontSize(8);
    let cx = x;
    columnas.forEach(col => {
      const valor = fila[col.key];
      doc.text(valor == null ? '' : String(valor), cx + 4, y + 5, {
        width: col.width - 8,
        align: col.align ?? 'left',
        lineBreak: false,
        ellipsis: true,
      });
      cx += col.width;
    });

    doc.strokeColor(BORDE).lineWidth(0.5)
      .moveTo(x, y + altoFila).lineTo(x + anchoTotal, y + altoFila).stroke();

    y += altoFila;
  });

  return y + 14;
}

export function buildPdfReport(resumen: ReporteResumen) {
  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
  const left = doc.page.margins.left;

  doc.fontSize(18).fillColor(VERDE).text('GeoRice — Reporte de actividades', { align: 'center' });
  doc.moveDown(0.3);
  doc.fontSize(10).fillColor(GRIS)
    .text(`Rango: ${resumen.filtros.fechaInicio} al ${resumen.filtros.fechaFin}`, { align: 'center' })
    .text(`Socio: ${resumen.filtros.socioNombre ?? 'Todos los socios'}`, { align: 'center' });
  doc.moveDown(1);

  doc.fontSize(13).fillColor('#000').text('Resumen general');
  doc.fontSize(10).fillColor(GRIS);
  doc.text(`Total actividades: ${resumen.resumen.totalActividades}    |    Total ciclos: ${resumen.resumen.totalCiclos}    |    Costo total: ${money(resumen.resumen.costoTotal)}    |    Área trabajada: ${resumen.resumen.areaTrabajada.toFixed(2)} ha`);
  doc.moveDown(0.8);

  doc.fontSize(13).fillColor('#000').text('Actividades por estado');
  let y = doc.y + 4;
  y = drawTable(doc, left, y, [
    { header: 'Estado',   width: 200, key: 'estado' },
    { header: 'Cantidad', width: 100, key: 'cantidad', align: 'right' },
  ], resumen.actividadesPorEstado);

  doc.fontSize(13).fillColor('#000').text('Costo por tipo de actividad', left, y);
  y = doc.y + 4;
  y = drawTable(doc, left, y, [
    { header: 'Tipo de actividad', width: 300, key: 'tipo' },
    { header: 'Cantidad',          width: 100, key: 'cantidad',   align: 'right' },
    { header: 'Costo total',       width: 120, key: 'costoTotalFmt', align: 'right' },
  ], resumen.costoPorTipo.map(t => ({ ...t, costoTotalFmt: money(t.costoTotal) })));

  doc.fontSize(13).fillColor('#000').text(`Ciclos (${resumen.ciclos.length})`, left, y);
  y = doc.y + 4;
  y = drawTable(doc, left, y, [
    { header: 'ID',           width: 35,  key: 'id', align: 'right' },
    { header: 'Tipo',         width: 130, key: 'tipo' },
    { header: 'Estado',       width: 80,  key: 'estado' },
    { header: 'Fecha inicio', width: 75,  key: 'fechaInicioFmt' },
    { header: 'Fecha fin',    width: 75,  key: 'fechaFinFmt' },
    { header: 'Área (ha)',    width: 65,  key: 'areaFmt', align: 'right' },
    { header: 'Parcela',      width: 140, key: 'parcelaNombre' },
    { header: 'Costo total',  width: 100, key: 'costoTotalFmt', align: 'right' },
  ], resumen.ciclos.map(c => ({
    ...c,
    fechaInicioFmt: formatFecha(c.fechaInicio),
    fechaFinFmt:    c.fechaFin ? formatFecha(c.fechaFin) : 'en curso',
    areaFmt:        c.areaSembrada != null ? Number(c.areaSembrada).toFixed(2) : '-',
    costoTotalFmt:  money(c.costoTotal),
  })));

  if (y + 40 > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
    y = doc.page.margins.top;
  }
  doc.fontSize(13).fillColor('#000').text(`Actividades (${resumen.actividades.length})`, left, y);
  y = doc.y + 4;
  drawTable(doc, left, y, [
    { header: 'Fecha',           width: 70,  key: 'fechaFmt' },
    { header: 'Tipo',            width: 120, key: 'tipo' },
    { header: 'Estado',          width: 80,  key: 'estado' },
    { header: 'Parcela',         width: 110, key: 'parcelaNombre' },
    { header: 'Ciclo',           width: 110, key: 'cicloTipo' },
    { header: 'Socio',           width: 130, key: 'socioNombre' },
    { header: 'Costo insumos',   width: 90,  key: 'costoInsumosFmt', align: 'right' },
    { header: 'Costo total',     width: 90,  key: 'costoTotalFmt',   align: 'right' },
  ], resumen.actividades.map(a => ({
    ...a,
    fechaFmt:          formatFecha(a.fecha),
    cicloTipo:         a.cicloTipo ?? '-',
    costoInsumosFmt:   money(a.costoInsumos),
    costoTotalFmt:     money(a.costoTotal),
  })));

  return doc;
}
