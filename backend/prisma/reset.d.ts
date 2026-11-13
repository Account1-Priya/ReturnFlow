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
export {};
