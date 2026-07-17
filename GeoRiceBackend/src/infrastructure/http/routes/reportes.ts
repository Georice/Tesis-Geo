import { Router } from 'express';
import { ReporteController } from '../controllers/ReporteController';
import { authenticate } from '../middleware/authenticate';
import { authenticateFlexible } from '../middleware/authenticateFlexible';

const router     = Router();
const controller = new ReporteController();

router.get('/resumen',      authenticate,         (req, res) => controller.getResumen(req, res));
router.get('/export/excel', authenticateFlexible, (req, res) => controller.exportExcel(req, res));
router.get('/export/pdf',   authenticateFlexible, (req, res) => controller.exportPdf(req, res));

export default router;
