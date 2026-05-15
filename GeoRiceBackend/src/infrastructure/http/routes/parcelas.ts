import { Router } from 'express';
import { ParcelaController } from '../controllers/ParcelaController';

const router = Router();
const controller = new ParcelaController();

router.get('/', (req, res) => controller.getAll(req, res));
router.post('/', (req, res) => controller.create(req, res));
router.put('/:id', (req, res) => controller.update(req, res));
router.put('/:id/geometry', (req, res) => controller.updateGeometry(req, res));
router.delete('/:id', (req, res) => controller.remove(req, res));

export default router;