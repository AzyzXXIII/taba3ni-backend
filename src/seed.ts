/**
 * Seed script — populates the DB with an admin + sample users
 *
 * Run with:
 *   npx ts-node src/seed.ts
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs'; // ✅ Fix #3: was importing 'bcrypt', app uses 'bcryptjs'
import { User } from './modules/users/entities/user.entity';
import { Role } from './common/enums/role.enum';
import { UserStatus } from './common/enums/user-status.enum';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'taba3ni_user',
  password: process.env.DB_PASSWORD ?? '123456',
  database: process.env.DB_NAME ?? 'taba3ni_db',
  entities: [User],
  synchronize: false,
  logging: false,
});

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Connected to database');

    const repo = AppDataSource.getRepository(User);

    const count = await repo.count();
    if (count > 0) {
      console.log(`⚠️  Found ${count} existing users. Deleting them...`);
      await repo.delete({});
      console.log('🗑  Cleared users table');
    }

    const hash = (plain: string) => bcrypt.hash(plain, 10);

    const users: Partial<User>[] = [
      // ── Admin ──────────────────────────────────────────────
      {
        name: 'Admin User',
        email: 'admin@taba3ni.tn',
        password: await hash('Admin1234!'),
        phone: '+216 71 000 000',
        city: 'Tunis',
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
        notes: 'Primary system administrator',
      },

      // ── Distributors ───────────────────────────────────────
      {
        name: 'Ahmed Mahmoudi',
        email: 'ahmed.mahmoudi@taba3ni.tn',
        password: await hash('Dist1234!'),
        phone: '+216 98 123 456',
        city: 'Tunis',
        role: Role.DISTRIBUTOR,
        status: UserStatus.ACTIVE,
        vehicle: 'Refrigerated Truck — 123 TU 1234',
        zones: ['Tunis', 'Lac 1', 'Lac 2', 'Les Berges du Lac'],
      },
      {
        name: 'Mohamed Trabelsi',
        email: 'mohamed.trabelsi@taba3ni.tn',
        password: await hash('Dist1234!'),
        phone: '+216 98 234 567',
        city: 'Ariana',
        role: Role.DISTRIBUTOR,
        status: UserStatus.ACTIVE,
        vehicle: 'Van — 456 TU 5678',
        zones: ['Ariana', 'Manouba', 'Ennasr'],
      },
      {
        name: 'Karim Belaid',
        email: 'karim.belaid@taba3ni.tn',
        password: await hash('Dist1234!'),
        phone: '+216 98 345 678',
        city: 'Ben Arous',
        role: Role.DISTRIBUTOR,
        status: UserStatus.ACTIVE,
        vehicle: 'Refrigerated Van — 789 TU 9012',
        zones: ['Ben Arous', 'La Marsa', 'Carthage'],
      },

      // ── Clients ────────────────────────────────────────────
      {
        name: 'Carrefour Lac 2',
        email: 'client@taba3ni.tn',
        password: await hash('Client1234!'),
        phone: '+216 71 123 456',
        city: 'Tunis',
        role: Role.CLIENT,
        status: UserStatus.ACTIVE,
        storeName: 'Carrefour Lac 2',
        taxId: 'TN-123456789',
      },
      {
        name: 'Magasin Général Marsa',
        email: 'general.marsa@email.com',
        password: await hash('Client1234!'),
        phone: '+216 71 234 567',
        city: 'La Marsa',
        role: Role.CLIENT,
        status: UserStatus.INACTIVE,
        storeName: 'Magasin Général Marsa',
        taxId: 'TN-234567890',
      },
      {
        name: 'Monoprix Menzah',
        email: 'monoprix.menzah@email.com',
        password: await hash('Client1234!'),
        phone: '+216 71 345 678',
        city: 'Ariana',
        role: Role.CLIENT,
        status: UserStatus.ACTIVE,
        storeName: 'Monoprix Menzah',
        taxId: 'TN-345678901',
      },
    ];

    for (const userData of users) {
      const entity = repo.create(userData);
      await repo.save(entity);
    }

    console.log(`\n🌱 Seeded ${users.length} users successfully!`);
    console.log('\n📋 Demo Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  👑 ADMIN:    admin@taba3ni.tn       / Admin1234!');
    console.log('  🚚 DIST:     ahmed.mahmoudi@...     / Dist1234!');
    console.log('  👤 CLIENT:   client@taba3ni.tn      / Client1234!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await AppDataSource.destroy();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

seed();
