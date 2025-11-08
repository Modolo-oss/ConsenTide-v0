/**
 * Test Migration Script
 * Manually test database migration and demo account creation
 */

import { migrateDatabase } from '../utils/migrateDatabase';
import { createDemoAccounts } from '../utils/demoSetup';
import { databaseService } from '../services/databaseService';
import { logger } from '../utils/logger';

async function testMigration() {
  try {
    logger.info('🧪 Testing database migration and demo setup...');

    // Test database connection
    logger.info('📡 Testing database connection...');
    const testResult = await databaseService.query('SELECT 1 as test');
    logger.info('✅ Database connection successful');

    // Run migration
    logger.info('🔄 Running database migration...');
    await migrateDatabase();

    // Create demo accounts
    logger.info('🎭 Creating demo accounts...');
    await createDemoAccounts();

    // Verify tables exist
    logger.info('🔍 Verifying tables exist...');
    const tables = [
      'users',
      'auth_credentials',
      'controllers',
      'consents',
      'audit_logs',
      'governance_proposals',
      'votes'
    ];

    for (const table of tables) {
      try {
        await databaseService.query(`SELECT 1 FROM ${table} LIMIT 1`);
        logger.info(`✅ Table '${table}' exists`);
      } catch (error) {
        logger.error(`❌ Table '${table}' does not exist:`, error);
      }
    }

    // Verify demo accounts
    logger.info('🔍 Verifying demo accounts...');
    const accountsResult = await databaseService.query('SELECT email, role FROM auth_credentials');
    logger.info(`📊 Found ${accountsResult.rows.length} accounts:`, accountsResult.rows.map((r: any) => `${r.email} (${r.role})`));

    logger.info('🎉 Migration test completed successfully!');

  } catch (error) {
    logger.error('❌ Migration test failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  testMigration().catch(console.error);
}

export { testMigration };
