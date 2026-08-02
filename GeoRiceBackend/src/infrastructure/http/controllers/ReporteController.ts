import { Request, Response } from 'express';
import { ReporteRepository } from '../../db/repositories/ReporteRepository';
import { GetResumenReporte, ReporteFiltrosInput } from '../../../application/usecases/reportes/GetResumenReporte';
import { buildExcelReport } from '../../reports/ExcelReportBuilder';
import { buildPdfReport } from '../../reports/PdfReportBuilder';
import { AuthContext } from '../../../shared/types/AuthContext';
import { logger } from '../../../shared/logger';

const repo = new ReporteRepository();

function buildCtx(req: Request): AuthContext {
  return {
    usuarioId:      req.user!.sub,
    rol:            req.user!.rol,
    nombreCompleto: `${req.user!.nombre} ${req.user!.apellido}`,
  };
}

function parseFiltros(req: Request): ReporteFiltrosInput {
  const { fechaInicio, fechaFin, usuarioId } = req.query;
  return {
    fechaInicio: typeof fechaInicio === 'string' ? fechaInicio : undefined,
    fechaFin:    typeof fechaFin    === 'string' ? fechaFin    : undefined,
    usuarioId:   typeof usuarioId   === 'string' && usuarioId ? usuarioId : undefined,
  };
}

export class ReporteController {
  async getResumen(req: Request, res: Response): Promise<void> {
    try {
      const ctx     = buildCtx(req);
      const resumen = await new GetResumenReporte(repo).execute(ctx, parseFiltros(req));
      res.json(resumen);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al generar el reporte';
      logger.error('Error al generar reporte:', message);
      res.status(400).json({ error: message });
    }
  }

  async exportExcel(req: Request, res: Response): Promise<void> {
    try {
      const ctx     = buildCtx(req);
      const resumen = await new GetResumenReporte(repo).execute(ctx, parseFiltros(req));
      const buffer  = await buildExcelReport(resumen);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="reporte_georice_${resumen.filtros.fechaInicio}_${resumen.filtros.fechaFin}.xlsx"`);
      res.send(buffer);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al generar el Excel';
      logger.error('Error al exportar reporte a Excel:', message);
      res.status(400).json({ error: message });
    }
  }

  async exportPdf(req: Request, res: Response): Promise<void> {
    try {
      const ctx     = buildCtx(req);
      const resumen = await new GetResumenReporte(repo).execute(ctx, parseFiltros(req));

      // Se arma el PDF completo en memoria (en vez de doc.pipe(res)) para
      // poder mandar Content-Length. Sin Content-Length, la respuesta va
      // con Transfer-Encoding: chunked, y eso causa "Download interrupted"
      // en react-native-blob-util al descargar a través del túnel de ngrok
      // (el cliente no puede verificar que la descarga terminó completa).
      const doc     = buildPdfReport(resumen);
      const buffer  = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        doc.end();
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="reporte_georice_${resumen.filtros.fechaInicio}_${resumen.filtros.fechaFin}.pdf"`);
      res.send(buffer);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al generar el PDF';
      logger.error('Error al exportar reporte a PDF:', message);
      res.status(400).json({ error: message });
    }
  }
}
