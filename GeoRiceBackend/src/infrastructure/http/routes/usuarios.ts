import { Router }            from 'express';
import { UsuarioController } from '../controllers/UsuarioController';
import { authenticate }      from '../middleware/authenticate';
import { authorize }         from '../middleware/authorize';
import { LocalUserRepository } from '../../db/repositories/LocalUserRepository';

const router     = Router();
const repo       = new LocalUserRepository();
const controller = new UsuarioController(repo);
const adminOnly  = [authenticate, authorize('administrador')];

// Público: auto-registro desde LoginScreen. La cuenta queda inactiva
// hasta que un administrador la habilite (ver RegistrarUsuario).
router.post('/registro', (req, res) => controller.register(req, res));

router.get('/',              ...adminOnly, (req, res) => controller.getAll(req, res));
router.post('/',             ...adminOnly, (req, res) => controller.create(req, res));
router.put('/:id',           ...adminOnly, (req, res) => controller.update(req, res));
router.put('/:id/activar',   ...adminOnly, (req, res) => controller.activate(req, res));
router.put('/:id/desactivar',...adminOnly, (req, res) => controller.deactivate(req, res));

export default router;
