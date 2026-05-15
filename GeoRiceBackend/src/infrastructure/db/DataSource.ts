import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Parcela } from '../../domain/entities/Parcela';
import dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  entities: [Parcela],
  synchronize: false,
});