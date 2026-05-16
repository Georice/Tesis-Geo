import { Router } from 'express';
import { CapaController } from '../controllers/CapaController';

const router = Router({ mergeParams: true });
const controller = new CapaController();

router.get('/', (req, res) => controller.getByParcela(req, res));
router.post('/', (req, res) => controller.create(req, res));
router.put('/:id/ndvi', (req, res) => controller.updateNdvi(req, res));
router.delete('/:id', (req, res) => controller.remove(req, res));

export default router;