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

export async function createDemoAccounts(): Promise<void> {
  try {
    logger.info('🎭 Creating demo accounts...');

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

    logger.info('🎭 Demo accounts setup completed');
  } catch (error) {
    logger.error('❌ Demo account creation failed:', error);
    throw error;
  }
}

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      logger.warn('Supabase credentials not found, skipping demo account creation');
      logger.info('💡 To enable demo accounts, add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your .env file');
      return;
    }

    // Create admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    logger.info('🔄 Checking and creating demo accounts...');

    for (const account of DEMO_ACCOUNTS) {
      try {
        // Check if user already exists
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const userExists = existingUsers.users.some(user => user.email === account.email);

        if (userExists) {
          logger.info(`✅ Demo account ${account.email} already exists`);
          continue;
        }

        // Create new user
        const { data, error } = await supabase.auth.admin.createUser({
          email: account.email,
          password: account.password,
          email_confirm: true, // Auto-confirm email for demo
          user_metadata: {
            role: account.role,
            full_name: account.fullName,
            organization_name: account.organizationName,
            source: 'demo_setup'
          }
        });

        if (error) {
          logger.error(`❌ Failed to create demo account ${account.email}:`, error);
        } else {
          logger.info(`✅ Created demo account: ${account.email} (${account.role})`);
        }
      } catch (error) {
        logger.error(`❌ Error processing demo account ${account.email}:`, error);
      }
    }

    logger.info('🎉 Demo account setup completed!');
  } catch (error) {
    logger.error('❌ Demo account setup failed:', error);
  }
}

export async function cleanupDemoAccounts(): Promise<void> {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      logger.warn('Supabase credentials not found, skipping cleanup');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    logger.info('🧹 Cleaning up demo accounts...');

    const { data: users } = await supabase.auth.admin.listUsers();

    for (const user of users.users) {
      const isDemoAccount = DEMO_ACCOUNTS.some(account => account.email === user.email);
      const isDemoSource = user.user_metadata?.source === 'demo_setup';

      if (isDemoAccount || isDemoSource) {
        await supabase.auth.admin.deleteUser(user.id);
        logger.info(`🗑️ Deleted demo account: ${user.email}`);
      }
    }

    logger.info('✅ Demo account cleanup completed!');
  } catch (error) {
    logger.error('❌ Demo account cleanup failed:', error);
  }
}