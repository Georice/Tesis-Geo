import 'reflect-metadata';
import express from 'express';
import cors    from 'cors';
import dotenv  from 'dotenv';

import { AppDataSource }   from './infrastructure/db/DataSource';
import { authenticate }    from './infrastructure/http/middleware/authenticate';
import { SyncController }  from './infrastructure/http/controllers/SyncController';
import { logger }          from './shared/logger';

import authRoutes       from './infrastructure/http/routes/auth';
import usuariosRoutes   from './infrastructure/http/routes/usuarios';
import parcelasRoutes   from './infrastructure/http/routes/parcelas';
import zonasRoutes      from './infrastructure/http/routes/zonas';
import capasRoutes      from './infrastructure/http/routes/capas';
import actividadesRoutes from './infrastructure/http/routes/actividades';
import ciclosRoutes     from './infrastructure/http/routes/ciclos';

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 3000;
const sync = new SyncController();

app.use(cors());
app.use(express.json());
app.use((req, _res, next) => { logger.info(`${req.method} ${req.path}`); next(); });

// ── Salud ───────────────────────────────────────────────────────────────
app.get('/', (_req, res) => res.send('GeoRice Backend funcionando'));

// ── Auth (público) ──────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);

// ── Sincronización (autenticado, filtrado internamente por rol) ─────────
app.get('/api/sync', authenticate, (req, res) => sync.syncData(req, res));

// ── Usuarios (solo administrador) ───────────────────────────────────────
app.use('/api/usuarios', usuariosRoutes);

// ── Datos agrícolas (autenticados) ──────────────────────────────────────
// Rutas específicas PRIMERO (con parcelaId)
app.use('/api/parcelas/:parcelaId/capas',        authenticate, capasRoutes);
app.use('/api/parcelas/:parcelaId/actividades',  authenticate, actividadesRoutes);
app.use('/api/parcelas/:parcelaId/ciclos',       authenticate, ciclosRoutes);

// Rutas genéricas DESPUÉS
app.use('/api/parcelas',    authenticate, parcelasRoutes);
app.use('/api/zonas',       authenticate, zonasRoutes);
app.use('/api/capas',       authenticate, capasRoutes);
app.use('/api/actividades', authenticate, actividadesRoutes);

// ── Iniciar ─────────────────────────────────────────────────────────────
AppDataSource.initialize()
  .then(() => {
    logger.success('Base de datos conectada con TypeORM');
    app.listen(PORT, () => {
      //cambiar por su propia ip, chino mmvrg XDDDDDDDDDD
//       logger.success(`Servidor corriendo en http://192.168.1.213:${PORT}`);
        logger.success(`Servidor corriendo en 192.168.100.6:${PORT}`);
      logger.info('Auth:   POST /api/auth/login | POST /api/auth/refresh | POST /api/auth/logout');
      logger.info('Sync:   GET  /api/sync | GET /api/sync?since=ISO8601');
      logger.info('Users:  GET/POST /api/usuarios (admin only)');
      logger.info('Data:   /api/parcelas | /api/zonas | /api/capas | /api/actividades');
    });
  })
  .catch((error) => logger.error('Error al conectar la base de datos:', error));
