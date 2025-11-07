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
    logger.info('🔄 Starting database migration...');

    logger.info('📋 Creating database schema...');

    // Read schema file (relative to backend directory in Railway)
    const schemaPath = process.cwd() + '/../database/schema.sql';
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

  } catch (error) {
    logger.error('❌ Database migration failed:', error);
    throw error;
  }
}
