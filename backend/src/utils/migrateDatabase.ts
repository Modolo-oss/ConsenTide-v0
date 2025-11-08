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

    // Read schema file (from project root database folder)
    const schemaPath = process.cwd() + '/../database/schema.sql';
    const schemaSQL = readFileSync(schemaPath, 'utf8');

    // Split SQL commands and execute them
    const commands = schemaSQL
      .split(';')
      .map((cmd: string) => cmd.trim())
      .filter((cmd: string) => cmd.length > 0 && !cmd.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (const command of commands) {
      if (command.trim()) {
        try {
          await databaseService.query(command);
          successCount++;
        } catch (error: any) {
          // Log but continue - some statements might fail if tables already exist
          if (error.code === '42P07') { // duplicate_table
            logger.info(`⚠️ Table already exists, skipping: ${command.substring(0, 50)}...`);
          } else if (error.code === '42710') { // duplicate_object (index)
            logger.info(`⚠️ Index already exists, skipping: ${command.substring(0, 50)}...`);
          } else {
            logger.warn(`⚠️ Command failed (continuing): ${command.substring(0, 50)}...`, error.message);
            errorCount++;
          }
        }
      }
    }

    logger.info(`✅ Database schema created: ${successCount} successful, ${errorCount} skipped/failed`);

  } catch (error) {
    logger.error('❌ Database migration failed:', error);
    throw error;
  }
}
