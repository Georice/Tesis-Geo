import { Router } from 'express';
import { CapaController } from '../controllers/CapaController';
import { CapaParcelaRepository } from '../../db/repositories/CapaParcelaRepository';

const router = Router({ mergeParams: true });
const repo = new CapaParcelaRepository();
const controller = new CapaController(repo);

router.get('/',                 (req, res) => controller.getByParcela(req, res));
router.post('/',                (req, res) => controller.create(req, res));
router.put('/:id/ndvi',         (req, res) => controller.updateNdvi(req, res));
router.put('/:id/geometry',     (req, res) => controller.updateGeometry(req, res));
router.delete('/:id',           (req, res) => controller.remove(req, res));

export default router;