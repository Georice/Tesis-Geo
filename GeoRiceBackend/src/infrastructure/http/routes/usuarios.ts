import { Router }            from 'express';
import { UsuarioController } from '../controllers/UsuarioController';
import { authenticate }      from '../middleware/authenticate';
import { authorize }         from '../middleware/authorize';

const router     = Router();
const controller = new UsuarioController();
const adminOnly  = [authenticate, authorize('administrador')];

router.get('/',              ...adminOnly, (req, res) => controller.getAll(req, res));
router.post('/',             ...adminOnly, (req, res) => controller.create(req, res));
router.put('/:id',           ...adminOnly, (req, res) => controller.update(req, res));
router.put('/:id/activar',   ...adminOnly, (req, res) => controller.activate(req, res));
router.put('/:id/desactivar',...adminOnly, (req, res) => controller.deactivate(req, res));

export default router;
