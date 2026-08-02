import { Router } from 'express';
import { ZonaController } from '../controllers/ZonaController';
import { ZonaRepository } from '../../db/repositories/ZonaRepository';

const router = Router();
const repo = new ZonaRepository();
const controller = new ZonaController(repo);

router.get('/', (req, res) => controller.getAll(req, res));
router.post('/', (req, res) => controller.create(req, res));
router.put('/:id', (req, res) => controller.update(req, res));
router.delete('/:id', (req, res) => controller.remove(req, res));

export default router;