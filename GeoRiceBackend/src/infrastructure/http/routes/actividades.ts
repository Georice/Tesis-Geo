import { Router } from 'express';
import { ActividadController } from '../controllers/ActividadController';
import { ActividadParcelaRepository } from '../../db/repositories/ActividadParcelaRepository';
import { CicloRepository } from '../../db/repositories/CicloRepository';
import { ParcelaRepository } from '../../db/repositories/ParcelaRepository';

const router = Router({ mergeParams: true });
const repo = new ActividadParcelaRepository();
const cicloRepo = new CicloRepository();
const parcelaRepo = new ParcelaRepository();
const controller = new ActividadController(repo, cicloRepo, parcelaRepo);

router.get('/', (req, res) => controller.getByParcela(req, res));
router.post('/', (req, res) => controller.create(req, res));
router.put('/:id', (req, res) => controller.update(req, res));
router.delete('/:id', (req, res) => controller.remove(req, res));

export default router;