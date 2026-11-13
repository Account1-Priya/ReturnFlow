"use strict";
/**
 * ReturnFlow – Unified Database Reset Script
 * -------------------------------------------
 * Supports PostgreSQL and SQLite (fallback) seamlessly based on DATABASE_URL.
 *
 * For Postgres: Drops/recreates public schema, runs migrations, seeds.
 * For SQLite: Deletes dev.db, pushes schema, seeds.
 *
 * Run:  npm run db:reset
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const root = path_1.default.resolve(__dirname, '..');
const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
const isSqlite = dbUrl.startsWith('file:') || process.env.USE_SQLITE === 'true';
async function reset() {
    console.log(`🔄 Resetting ReturnFlow database (${isSqlite ? 'SQLite' : 'PostgreSQL'})...\n`);
    if (isSqlite) {
        // 1. Ensure SQLite schema is active
        const sqliteSchema = path_1.default.join(__dirname, 'schema.sqlite.prisma');
        const activeSchema = path_1.default.join(__dirname, 'schema.prisma');
        fs_1.default.copyFileSync(sqliteSchema, activeSchema);
        // 2. Remove existing dev.db file if it exists
        const dbFilePath = path_1.default.resolve(root, 'dev.db');
        if (fs_1.default.existsSync(dbFilePath)) {
            try {
                fs_1.default.unlinkSync(dbFilePath);
                console.log('  ✓ Deleted existing SQLite dev.db');
            }
            catch (err) {
                console.warn('  ⚠️ Could not delete dev.db (may be locked), clearing records via seed...');
            }
        }
        // 3. Generate client and push schema
        console.log('  Generating Prisma Client...');
        (0, child_process_1.execSync)('npx prisma generate', { stdio: 'inherit', cwd: root });
        console.log('  Pushing SQLite schema...');
        (0, child_process_1.execSync)('npx prisma db push --skip-generate', { stdio: 'inherit', cwd: root });
        console.log('  ✓ SQLite schema pushed');
    }
    else {
        // PostgreSQL mode
        const pgSchema = path_1.default.join(__dirname, 'schema.postgresql.prisma');
        const activeSchema = path_1.default.join(__dirname, 'schema.prisma');
        if (fs_1.default.existsSync(pgSchema)) {
            fs_1.default.copyFileSync(pgSchema, activeSchema);
        }
        const prisma = new client_1.PrismaClient();
        try {
            await prisma.$executeRawUnsafe('DROP SCHEMA IF EXISTS public CASCADE');
            await prisma.$executeRawUnsafe('CREATE SCHEMA public');
            await prisma.$executeRawUnsafe('GRANT ALL ON SCHEMA public TO PUBLIC');
            console.log('  ✓ Public schema dropped and recreated');
        }
        finally {
            await prisma.$disconnect();
        }
        console.log('  Generating Prisma Client...');
        (0, child_process_1.execSync)('npx prisma generate', { stdio: 'inherit', cwd: root });
        console.log('  Running migrations...');
        (0, child_process_1.execSync)('npx prisma migrate deploy', { stdio: 'inherit', cwd: root });
        console.log('  ✓ Migrations applied');
    }
    // Seed database
    console.log('  Seeding database baseline...');
    (0, child_process_1.execSync)('npx ts-node prisma/seed.ts', { stdio: 'inherit', cwd: root });
    console.log('\n✅ Database reset complete!');
}
reset().catch((e) => {
    console.error('❌ Reset failed:', e);
    process.exit(1);
});
//# sourceMappingURL=reset.js.map