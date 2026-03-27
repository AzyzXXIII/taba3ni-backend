import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from '../modules/users/entities/user.entity';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  username: process.env.DB_USERNAME ?? 'taba3ni_user',
  password: process.env.DB_PASSWORD ?? '123456',
  database: process.env.DB_NAME ?? 'taba3ni_db',
  entities: [User],
  migrations: [path.join(__dirname, '../database/migrations/*{.ts,.js}')],
  synchronize: false,
  logging: true,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
