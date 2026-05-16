import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AppDataSource } from './infrastructure/db/DataSource';
import parcelasRoutes from './infrastructure/http/routes/parcelas';
import zonasRoutes from './infrastructure/http/routes/zonas';
import capasRoutes from './infrastructure/http/routes/capas';
import actividadesRoutes from './infrastructure/http/routes/actividades';
import { logger } from './shared/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

app.get('/', (req, res) => {
  res.send('GeoRice Backend funcionando');
});

app.use('/api/parcelas', parcelasRoutes);
app.use('/api/zonas', zonasRoutes);
app.use('/api/parcelas/:parcelaId/capas', capasRoutes);
app.use('/api/parcelas/:parcelaId/actividades', actividadesRoutes);
app.use('/api/capas', capasRoutes);
app.use('/api/actividades', actividadesRoutes);

AppDataSource.initialize()
  .then(() => {
    logger.success('Base de datos conectada con TypeORM');
    app.listen(PORT, () => {
      logger.success(`Servidor corriendo en http://localhost:${PORT}`);
      logger.info('Endpoints disponibles:');
      logger.info('  GET    /api/parcelas');
      logger.info('  POST   /api/parcelas');
      logger.info('  PUT    /api/parcelas/:id');
      logger.info('  DELETE /api/parcelas/:id');
      logger.info('  GET    /api/zonas');
      logger.info('  POST   /api/zonas');
      logger.info('  GET    /api/parcelas/:parcelaId/capas');
      logger.info('  POST   /api/parcelas/:parcelaId/capas');
      logger.info('  PUT    /api/capas/:id/ndvi');
      logger.info('  DELETE /api/capas/:id');
      logger.info('  GET    /api/parcelas/:parcelaId/actividades');
      logger.info('  POST   /api/parcelas/:parcelaId/actividades');
      logger.info('  PUT    /api/actividades/:id');
      logger.info('  DELETE /api/actividades/:id');
    });
  })
  .catch((error) => {
    logger.error('Error al conectar la base de datos:', error);
  });