// import express from 'express';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import parcelasRoutes from './routes/parcelas';

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 3000;

// app.use(cors());
// app.use(express.json());

// app.get('/', (req, res) => {
//   res.send('GeoRice Backend funcionando');
// });

// app.use('/api/parcelas', parcelasRoutes);

// app.listen(PORT, () => {
//   console.log(`Servidor corriendo en http://localhost:${PORT}`);
// });


import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AppDataSource } from './infrastructure/db/DataSource';
import parcelasRoutes from './infrastructure/http/routes/parcelas';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('GeoRice Backend funcionando');
});

app.use('/api/parcelas', parcelasRoutes);

AppDataSource.initialize()
  .then(() => {
    console.log('Base de datos conectada con TypeORM');
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error al conectar la base de datos:', error);
  });