import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { ParcelaEntity }           from './entities/ParcelaEntity';
import { ZonaEntity }              from './entities/ZonaEntity';
import { CapaParcelaEntity }       from './entities/CapaParcelaEntity';
import { ActividadParcelaEntity }  from './entities/ActividadParcelaEntity';
import { ProductoActividadEntity } from './entities/ProductoActividadEntity';
import { CicloActividadEntity }    from './entities/CicloActividadEntity';
import { UsuarioEntity }           from './entities/UsuarioEntity';
import { RefreshTokenEntity }      from './entities/RefreshTokenEntity';
import { FaseCicloEntity }         from './entities/FaseCicloEntity';
import { DetalleRiegoEntity }      from './entities/DetalleRiegoEntity';
import { DetalleFumigacionEntity } from './entities/DetalleFumigacionEntity';
import { DetalleFertilizacionEntity } from './entities/DetalleFertilizacionEntity';
import { DetalleCosechaEntity }    from './entities/DetalleCosechaEntity';
import { DetalleManoObraEntity }   from './entities/DetalleManoObraEntity';
import { DetalleMaquinariaEntity } from './entities/DetalleMaquinariaEntity';
import dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type:     'postgres',
  host:     process.env.DB_HOST,
  port:     Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // Railway (y la mayoría de proveedores cloud de Postgres) requieren SSL
  // en la conexión pública. rejectUnauthorized:false porque no siempre
  // se dispone del certificado CA del proveedor.
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: [
    ParcelaEntity, ZonaEntity, CapaParcelaEntity, ActividadParcelaEntity,
    ProductoActividadEntity, CicloActividadEntity, UsuarioEntity, RefreshTokenEntity,
    FaseCicloEntity, DetalleRiegoEntity, DetalleFumigacionEntity, DetalleFertilizacionEntity,
    DetalleCosechaEntity, DetalleManoObraEntity, DetalleMaquinariaEntity,
  ],
  synchronize: false,
});