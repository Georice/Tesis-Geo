import { Router } from 'express';
import { ZonaController } from '../controllers/ZonaController';

const router = Router();
const controller = new ZonaController();

router.get('/', (req, res) => controller.getAll(req, res));
router.post('/', (req, res) => controller.create(req, res));
router.put('/:id', (req, res) => controller.update(req, res));
router.delete('/:id', (req, res) => controller.remove(req, res));

export default router;