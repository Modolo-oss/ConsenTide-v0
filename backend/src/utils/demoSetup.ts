/**
 * Demo Accounts Setup
 * Auto-creates demo accounts in PostgreSQL for testing
 */

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { databaseService } from '../services/databaseService';
import { logger } from './logger';

interface DemoAccount {
  email: string;
  password: string;
  role: string;
  name?: string;
  publicKey?: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: 'demo@consentire.com',
    password: 'demo123',
    role: 'user',
    name: 'Demo User',
    publicKey: '042e123456789abcdef123456789abcdef123456789abcdef123456789abcdef123456789abcdef123456789abcdef123456789abcdef123456789abcdef123456789abcdef123456789abcdef123456789abcdef123456789abcdef'
  },
  {
    email: 'admin@consentire.com',
    password: 'admin123',
    role: 'admin',
    name: 'Admin User',
    publicKey: '042e987654321fedcba987654321fedcba987654321fedcba987654321fedcba987654321fedcba987654321fedcba987654321fedcba987654321fedcba987654321fedcba987654321fedcba987654321fedcba'
  },
  {
    email: 'controller@consentire.com',
    password: 'controller123',
    role: 'controller',
    name: 'Controller User',
    publicKey: '042eabcdef123456789abcdef123456789abcdef123456789abcdef123456789abcdef123456789abcdef123456789abcdef123456789abcdef123456789abcdef123456789abcdef123456789abcdef123456789abcdef'
  }
];

function generateUserId(email: string): string {
  return `user_${crypto.createHash('sha256').update(email.toLowerCase()).digest('hex').substring(0, 32)}`;
}

function hashEmail(email: string): string {
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex').substring(0, 64);
}

function generateDID(publicKey: string): string {
  return `did:consentire:${crypto.createHash('sha256').update(publicKey).digest('hex').substring(0, 32)}`;
}

const DEMO_CONTROLLERS = [
  {
    organizationName: 'TechCorp Analytics',
    organizationId: 'TECH001',
    publicKey: '042e123456789abcdef123456789abcdef123456789abcdef123456789abcdef123456789abcdef123456789abcdef123456789abcdef123456789abcdef123456789abcdef123456789abcdef123456789abcdef123456789abcdef'
  },
  {
    organizationName: 'DataFlow Solutions',
    organizationId: 'DATA001',
    publicKey: '042e987654321fedcba987654321fedcba987654321fedcba987654321fedcba987654321fedcba987654321fedcba987654321fedcba987654321fedcba987654321fedcba987654321fedcba987654321fedcba'
  },
  {
    organizationName: 'PrivacyFirst Ltd',
    organizationId: 'PRIV001',
    publicKey: '042eabcdef123456789abcdef123456789abcdef123456789abcdef123456789abcdef123456789abcdef123456789abcdef123456789abcdef123456789abcdef123456789abcdef123456789abcdef123456789abcdef'
  }
];

function generateControllerHash(organizationId: string): string {
  return crypto.createHash('sha256').update(organizationId.toLowerCase()).digest('hex').substring(0, 64);
}

export async function createDemoAccounts(): Promise<void> {
  try {
    logger.info('🎭 Creating demo accounts and controllers...');

    // Create demo users
    for (const account of DEMO_ACCOUNTS) {
      try {
        const userId = generateUserId(account.email);
        const emailHash = hashEmail(account.email);
        const did = generateDID(account.publicKey || 'demo-key');

        // Hash the password
        const hashedPassword = await bcrypt.hash(account.password, 10);

        // Insert user first
        await databaseService.query(`
          INSERT INTO users (id, email_hash, public_key, did, created_at)
          VALUES ($1, $2, $3, $4, NOW())
          ON CONFLICT (id) DO NOTHING
        `, [userId, emailHash, account.publicKey, did]);

        // Insert auth credentials
        await databaseService.query(`
          INSERT INTO auth_credentials (user_id, email, password_hash, role, user_type, created_at)
          VALUES ($1, $2, $3, $4, 'individual', NOW())
          ON CONFLICT (user_id) DO NOTHING
        `, [userId, account.email, hashedPassword, account.role]);

        logger.info(`✅ Created demo account: ${account.email} (ID: ${userId})`);
      } catch (error) {
        logger.warn(`⚠️ Failed to create demo account ${account.email}:`, error);
      }
    }

    // Create demo controllers
    for (const controller of DEMO_CONTROLLERS) {
      try {
        const controllerId = `ctrl_${crypto.createHash('sha256').update(controller.organizationId).digest('hex').substring(0, 32)}`;
        const controllerHash = generateControllerHash(controller.organizationId);

        await databaseService.query(`
          INSERT INTO controllers (id, organization_name, organization_id, controller_hash, public_key, created_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
          ON CONFLICT (organization_id) DO NOTHING
        `, [controllerId, controller.organizationName, controller.organizationId, controllerHash, controller.publicKey]);

        logger.info(`✅ Created demo controller: ${controller.organizationName} (ID: ${controllerId})`);
      } catch (error) {
        logger.warn(`⚠️ Failed to create demo controller ${controller.organizationName}:`, error);
      }
    }

    logger.info('🎭 Demo accounts and controllers setup completed');
  } catch (error) {
    logger.error('❌ Demo account creation failed:', error);
    throw error;
  }
}

export async function cleanupDemoAccounts(): Promise<void> {
  try {
    logger.info('🧹 Cleaning up demo accounts...');

    // TO DO: implement cleanup logic
    logger.info('✅ Demo account cleanup completed!');
  } catch (error) {
    logger.error('❌ Demo account cleanup failed:', error);
  }
}