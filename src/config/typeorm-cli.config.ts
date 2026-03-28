import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from '../modules/users/entities/user.entity';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

// ✅ Fix #4: synchronize is false here (CLI/migrations use this config).
// The app itself uses synchronize:true in app.module.ts for dev convenience.
// When you're ready for production: set synchronize:false in app.module.ts too
// and generate migrations with: npx typeorm migration:generate -d src/config/typeorm-cli.config.ts
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'taba3ni_user',
  password: process.env.DB_PASSWORD ?? '123456',
  database: process.env.DB_NAME ?? 'taba3ni_db',
  entities: [
    User,
    // Add future entities here as you build them:
    // Product, Order, OrderItem, Delivery, Invoice
  ],
  migrations: [path.join(__dirname, '../database/migrations/*{.ts,.js}')],
  synchronize: false,
  logging: true,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
