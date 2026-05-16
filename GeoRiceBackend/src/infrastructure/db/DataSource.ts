// import 'reflect-metadata';
// import { DataSource } from 'typeorm';
// import { Parcela } from '../../domain/entities/Parcela';
// import dotenv from 'dotenv';

// dotenv.config();

// export const AppDataSource = new DataSource({
//   type: 'postgres',
//   host: process.env.DB_HOST,
//   port: Number(process.env.DB_PORT),
//   database: process.env.DB_NAME,
//   username: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   entities: [Parcela],
//   synchronize: false,
// });


import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Parcela } from '../../domain/entities/Parcela';
import { Zona } from '../../domain/entities/Zona';
import { CapaParcela } from '../../domain/entities/CapaParcela';
import { ActividadParcela } from '../../domain/entities/ActividadParcela';
import dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  entities: [Parcela, Zona, CapaParcela, ActividadParcela],
  synchronize: false,
});