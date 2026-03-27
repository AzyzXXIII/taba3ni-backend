/**
 * Seed script — populates the DB with an admin + sample users
 *
 * Run with:
 *   npx ts-node src/seed.ts
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './modules/users/entities/user.entity';
import { Role } from './common/enums/role.enum';
import { UserStatus } from './common/enums/user-status.enum';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'taba3ni_user',
  password: process.env.DB_PASSWORD ?? '123456',
  database: process.env.DB_NAME ?? 'taba3ni_db',
  entities: [User],
  synchronize: false, // Set to false for seeding (don't auto-sync)
  logging: true,
});

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Connected to database');

    const repo = AppDataSource.getRepository(User);

    // Clear existing users (optional - be careful!)
    const count = await repo.count();
    if (count > 0) {
      console.log(`⚠️  Found ${count} existing users. Deleting them...`);
      await repo.delete({});
      console.log('🗑  Cleared users table');
    }

    const hash = (plain: string) => bcrypt.hash(plain, 10);

    const users: Partial<User>[] = [
      // ── Admin ──────────────────────────────────────────
      {
        name: 'Admin User',  // ← Changed from firstName/lastName
        email: 'admin@taba3ni.tn',
        password: await hash('Admin1234!'),
        phone: '+216 71 000 000',
        city: 'Tunis',
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,  // ← Changed from isActive
        notes: 'Primary system administrator',
      },

      // ── Distributors ──────────────────────────────────
      {
        name: 'Ahmed Mahmoudi',  // ← Combined name
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

      // ── Clients ────────────────────────────────────────
      {
        name: 'Carrefour Lac 2',  // ← Combined store name
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
      {
        name: 'Superette Ariana',
        email: 'superette.ariana@email.com',
        password: await hash('Client1234!'),
        phone: '+216 71 456 789',
        city: 'Ariana',
        role: Role.CLIENT,
        status: UserStatus.ACTIVE,
        storeName: 'Superette Ariana',
        taxId: 'TN-456789012',
      },
    ];

    // Insert users
    for (const user of users) {
      const entity = repo.create(user);
      await repo.save(entity);
    }

    console.log(`🌱 Seeded ${users.length} users successfully!`);
    console.log('\n📋 Demo Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  👑 ADMIN:');
    console.log('     Email: admin@taba3ni.tn');
    console.log('     Password: Admin1234!');
    console.log('');
    console.log('  🚚 DISTRIBUTORS:');
    console.log('     Email: ahmed.mahmoudi@taba3ni.tn');
    console.log('     Password: Dist1234!');
    console.log('     Email: mohamed.trabelsi@taba3ni.tn');
    console.log('     Password: Dist1234!');
    console.log('     Email: karim.belaid@taba3ni.tn');
    console.log('     Password: Dist1234!');
    console.log('');
    console.log('  👤 CLIENTS:');
    console.log('     Email: client@taba3ni.tn');
    console.log('     Password: Client1234!');
    console.log('     Email: general.marsa@email.com');
    console.log('     Password: Client1234!');
    console.log('     Email: monoprix.menzah@email.com');
    console.log('     Password: Client1234!');
    console.log('     Email: superette.ariana@email.com');
    console.log('     Password: Client1234!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Optional: Show distribution statistics
    const adminCount = await repo.count({ where: { role: Role.ADMIN } });
    const distributorCount = await repo.count({ where: { role: Role.DISTRIBUTOR } });
    const clientCount = await repo.count({ where: { role: Role.CLIENT } });
    
    console.log('\n📊 Database Statistics:');
    console.log(`   👑 Admins: ${adminCount}`);
    console.log(`   🚚 Distributors: ${distributorCount}`);
    console.log(`   👤 Clients: ${clientCount}`);
    console.log(`   📈 Total: ${users.length}`);

    await AppDataSource.destroy();
    console.log('\n✅ Seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Seed failed:', error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

// Run the seed function
seed();
