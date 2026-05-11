import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import parcelasRoutes from './routes/parcelas';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('GeoRice Backend funcionando');
});

app.use('/api/parcelas', parcelasRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});