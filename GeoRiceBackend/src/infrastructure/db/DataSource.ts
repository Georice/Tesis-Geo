import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { ParcelaModel }           from './models/ParcelaModel';
import { ZonaModel }              from './models/ZonaModel';
import { CapaParcelaModel }       from './models/CapaParcelaModel';
import { ActividadParcelaModel }  from './models/ActividadParcelaModel';
import { ProductoActividadModel } from './models/ProductoActividadModel';
import { CicloActividadModel }    from './models/CicloActividadModel';
import { UsuarioModel }           from './models/UsuarioModel';
import { RefreshTokenModel }      from './models/RefreshTokenModel';
import { FaseCicloModel }         from './models/FaseCicloModel';
import { DetalleRiegoModel }      from './models/DetalleRiegoModel';
import { DetalleFumigacionModel } from './models/DetalleFumigacionModel';
import { DetalleFertilizacionModel } from './models/DetalleFertilizacionModel';
import { DetalleCosechaModel }    from './models/DetalleCosechaModel';
import { DetalleManoObraModel }   from './models/DetalleManoObraModel';
import { DetalleMaquinariaModel } from './models/DetalleMaquinariaModel';
import dotenv from 'dotenv';

dotenv.config();

// Únicas clases de esta capa acopladas a TypeORM (decoradores @Entity).
// El dominio (src/domain/entities) no aparece aquí: son clases puras.
export const AppDataSource = new DataSource({
  type:     'postgres',
  host:     process.env.DB_HOST,
  port:     Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // La DB comparte "usuarios"/"tokens_actualizacion" (y otras tablas de
  // MagnaRice) entre el schema "public" (datos reales) y "managerice_desa"
  // (vacío). El search_path de la conexión resuelve "managerice_desa"
  // primero, así que sin calificar el schema aquí, TypeORM (a diferencia
  // del SQL crudo, que ya usa "public." explícito) escribía/leía en el
  // schema vacío y violaba la FK de tokens_actualizacion en cada login.
  schema: 'public',
  entities: [
    ParcelaModel, ZonaModel, CapaParcelaModel, ActividadParcelaModel,
    ProductoActividadModel, CicloActividadModel, UsuarioModel, RefreshTokenModel,
    FaseCicloModel, DetalleRiegoModel, DetalleFumigacionModel, DetalleFertilizacionModel,
    DetalleCosechaModel, DetalleManoObraModel, DetalleMaquinariaModel,
  ],
  synchronize: false,
});
