import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Parcela }           from '../../domain/entities/Parcela';
import { Zona }              from '../../domain/entities/Zona';
import { CapaParcela }       from '../../domain/entities/CapaParcela';
import { ActividadParcela }  from '../../domain/entities/ActividadParcela';
import { ProductoActividad } from '../../domain/entities/ProductoActividad';
import { CicloActividad }    from '../../domain/entities/CicloActividad';
import { Usuario }           from '../../domain/entities/Usuario';
import { RefreshToken }      from '../../domain/entities/RefreshToken';
import { FaseCiclo }         from '../../domain/entities/FaseCiclo';
import { DetalleRiego }      from '../../domain/entities/DetalleRiego';
import { DetalleFumigacion } from '../../domain/entities/DetalleFumigacion';
import { DetalleFertilizacion } from '../../domain/entities/DetalleFertilizacion';
import { DetalleCosecha }    from '../../domain/entities/DetalleCosecha';
import { DetalleManoObra }   from '../../domain/entities/DetalleManoObra';
import { DetalleMaquinaria } from '../../domain/entities/DetalleMaquinaria';
import dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type:     'postgres',
  host:     process.env.DB_HOST,
  port:     Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  entities: [
    Parcela, Zona, CapaParcela, ActividadParcela,
    ProductoActividad, CicloActividad, Usuario, RefreshToken,
    FaseCiclo, DetalleRiego, DetalleFumigacion, DetalleFertilizacion,
    DetalleCosecha, DetalleManoObra, DetalleMaquinaria,
  ],
  synchronize: false,
});