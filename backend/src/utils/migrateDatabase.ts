/**
 * Database Migration Script
 * Auto-creates database schema on startup
 */

import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { databaseService } from '../services/databaseService';
import { logger } from './logger';

export async function migrateDatabase(): Promise<void> {
  try {
    logger.info('🔄 Checking database schema...');

    // Check if users table exists
    const result = await databaseService.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'users'
      );
    `);

    const schemaExists = result.rows[0].exists;

    if (schemaExists) {
      logger.info('✅ Database schema already exists');
      return;
    }

    logger.info('📋 Creating database schema...');

    // Read schema file (relative to project root)
    const schemaPath = process.cwd() + '/database/schema.sql';
    const schemaSQL = readFileSync(schemaPath, 'utf8');

    // Split SQL commands and execute them
    const commands = schemaSQL
      .split(';')
      .map((cmd: string) => cmd.trim())
      .filter((cmd: string) => cmd.length > 0 && !cmd.startsWith('--'));

    for (const command of commands) {
      if (command.trim()) {
        await databaseService.query(command);
      }
    }

    logger.info('✅ Database schema created successfully');

    // Create demo account
    await databaseService.query(`
      INSERT INTO users (email, password, name)
      VALUES ('demo@example.com', 'password123', 'Demo User');
    `);

    logger.info('✅ Demo account created successfully');

  } catch (error) {
    logger.error('❌ Database migration failed:', error);
    throw error;
  }
}
