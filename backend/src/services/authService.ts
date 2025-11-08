import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { logger } from '../utils/logger';

// In-memory user store for temporary simplified auth - matching frontend demo accounts
const TEMP_USERS = [
  {
    id: 'user_demo',
    email: 'user@consentire.io',
    password: 'password123',
    role: 'user',
    did: 'did:consentire:user',
    organizationId: null,
    publicKey: '04user',
    walletAddress: null,
  },
  {
    id: 'user_controller',
    email: 'org@consentire.io',
    password: 'password123',
    role: 'controller',
    did: 'did:consentire:org',
    organizationId: null,
    publicKey: '04org',
    walletAddress: null,
  },
  {
    id: 'user_regulator',
    email: 'regulator@consentire.io',
    password: 'password123',
    role: 'regulator',
    did: 'did:consentire:regulator',
    organizationId: null,
    publicKey: '04regulator',
    walletAddress: null,
  },
  // Keep original demo accounts for backward compatibility
  {
    id: 'user_demo_old',
    email: 'demo@consentire.com',
    password: 'demo123',
    role: 'user',
    did: 'did:consentire:demo',
    organizationId: null,
    publicKey: '04demo',
    walletAddress: null,
  },
  {
    id: 'user_admin_old',
    email: 'admin@consentire.com',
    password: 'admin123',
    role: 'admin',
    did: 'did:consentire:admin',
    organizationId: null,
    publicKey: '04admin',
    walletAddress: null,
  },
  {
    id: 'user_controller_old',
    email: 'controller@consentire.com',
    password: 'controller123',
    role: 'controller',
    did: 'did:consentire:controller',
    organizationId: null,
    publicKey: '04controller',
    walletAddress: null,
  },
];

const JWT_SECRET: string = process.env.JWT_SECRET || 'default-secret-change-in-production';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '24h';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    email: string;
    role: string;
    did: string;
    organizationId?: string;
  };
  message?: string;
}

export class AuthService {
  async login(loginData: LoginRequest): Promise<AuthResponse> {
    try {
      const { email, password } = loginData;

      // Find user in temp store
      const user = TEMP_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!user) {
        logger.warn(`Login attempt failed: user not found - ${email}`);
        return {
          success: false,
          message: 'Invalid email or password',
        };
      }

      // Simple password check (no bcrypt for temp users)
      if (password !== user.password) {
        logger.warn(`Login attempt failed: invalid password - ${email}`);
        return {
          success: false,
          message: 'Invalid email or password',
        };
      }

      const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        did: user.did,
        organizationId: user.organizationId,
      };

      // @ts-ignore - JWT_EXPIRES_IN is a valid string format for expiresIn
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

      logger.info(`User logged in successfully: ${email}`);

      return {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          did: user.did,
          organizationId: user.organizationId || undefined,
        },
      };
    } catch (error) {
      logger.error('Login error:', error);
      return {
        success: false,
        message: 'An error occurred during login',
      };
    }
  }

  async verifyToken(token: string): Promise<any> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return decoded;
    } catch (error) {
      logger.error('Token verification failed:', error);
      return null;
    }
  }

  async getUserById(userId: string): Promise<any> {
    try {
      // Find user in temp store
      const user = TEMP_USERS.find(u => u.id === userId);

      if (!user) {
        return null;
      }

      // Return user data in same format as database
      return {
        id: user.id,
        email: user.email,
        role: user.role,
        organization_id: user.organizationId,
        did: user.did,
        public_key: user.publicKey,
        wallet_address: user.walletAddress,
        created_at: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error fetching user:', error);
      return null;
    }
  }
}

export const authService = new AuthService();
