import 'reflect-metadata';
import express from 'express';
import cors    from 'cors';
import helmet  from 'helmet';
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
import reportesRoutes   from './infrastructure/http/routes/reportes';

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 3000;
const sync = new SyncController();

app.use(helmet());

// CORS: solo aplica a peticiones de navegador (la app móvil no envía header
// Origin, así que no se ve afectada). Orígenes permitidos vía CORS_ORIGIN
// (separados por coma) en las variables de entorno; vacío = ninguno.
const allowedOrigins = (process.env.CORS_ORIGIN ?? '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Origen no permitido por CORS'));
    }
  },
}));
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

// Reportes: cada ruta interna trae su propio middleware (/resumen exige el
// header Authorization; /export/* aceptan también ?token= porque se abren
// con Linking.openURL desde el navegador del dispositivo).
app.use('/api/reportes', reportesRoutes);

// ── Iniciar ─────────────────────────────────────────────────────────────
AppDataSource.initialize()
  .then(() => {
    logger.success('Base de datos conectada con TypeORM');
    app.listen(PORT, () => {

//     logger.success(`Servidor de Brando corriendo en http://192.168.1.213:${PORT}`);
   logger.success(`Servidor corriendo en 192.168.100.6:${PORT}`);
//    logger.success(`Servidor corriendo en 10.8.246.102:${PORT}`);
      logger.info('Auth:   POST /api/auth/login | POST /api/auth/refresh | POST /api/auth/logout');
      logger.info('Sync:   GET  /api/sync | GET /api/sync?since=ISO8601');
      logger.info('Users:  GET/POST /api/usuarios (admin only)');
      logger.info('Data:   /api/parcelas | /api/zonas | /api/capas | /api/actividades');
      logger.info('Reportes: GET /api/reportes/resumen | /api/reportes/export/excel | /api/reportes/export/pdf');
    });
  })
  .catch((error) => logger.error('Error al conectar la base de datos:', error));
