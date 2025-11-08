import { Router, Request, Response } from 'express';
import {
  UserRegistrationRequest,
  UserRegistrationResponse,
  APIError
} from '@consentire/shared';
import { logger } from '../utils/logger';

// TEMPORARY: In-memory user store (same as authService)
const TEMP_USERS = [
  {
    id: 'user_demo',
    email: 'demo@consentire.com',
    password: 'demo123',
    role: 'user',
    did: 'did:consentire:demo',
    organizationId: null,
    publicKey: '04demo',
    walletAddress: null,
  },
  {
    id: 'user_admin',
    email: 'admin@consentire.com',
    password: 'admin123',
    role: 'admin',
    did: 'did:consentire:admin',
    organizationId: null,
    publicKey: '04admin',
    walletAddress: null,
  },
  {
    id: 'user_controller',
    email: 'controller@consentire.com',
    password: 'controller123',
    role: 'controller',
    did: 'did:consentire:controller',
    organizationId: null,
    publicKey: '04controller',
    walletAddress: null,
  },
];

export const userRouter = Router();

/**
 * POST /api/v1/users/register
 * Register a new user
 */
userRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, publicKey, password, metadata }: any = req.body;

    // Validate required fields
    if (!email || !publicKey || !password) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Missing required fields: email, publicKey, and password are required',
        timestamp: Date.now()
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid email format',
        timestamp: Date.now()
      } as APIError);
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Password must be at least 8 characters long',
        timestamp: Date.now()
      } as APIError);
    }

    // Check if user already exists in temp store
    const existingUser = TEMP_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return res.status(409).json({
        code: 'USER_EXISTS',
        message: 'User with this email already exists',
        timestamp: Date.now()
      } as APIError);
    }

    // Generate user ID and DID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const did = `did:consentire:${userId}`;

    // Create new user in memory
    const newUser = {
      id: userId,
      email: email.toLowerCase(),
      password: password, // Plain text for temp auth
      role: 'user',
      did: did,
      organizationId: null,
      publicKey: publicKey,
      walletAddress: null,
    };

    // Add to temp users store
    TEMP_USERS.push(newUser);

    logger.info(`User registered successfully: ${email} (ID: ${userId})`);

    const response: UserRegistrationResponse = {
      userId,
      did,
      walletAddress: '',
      createdAt: Date.now()
    };

    res.status(201).json(response);

  } catch (error: any) {
    logger.error('Error registering user', { error: error.message, stack: error.stack });
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: error.message || 'Failed to register user',
      timestamp: Date.now()
    } as APIError);
  }
});

/**
 * GET /api/v1/users/me/profile
 * Get current authenticated user's profile
 */
userRouter.get('/me/profile', async (req: Request, res: Response) => {
  try {
    // TEMPORARY: Return basic profile for demo
    const profile = {
      userId: 'user_demo',
      email: 'demo@consentire.com',
      role: 'user',
      did: 'did:consentire:demo'
    };
    
    res.status(200).json({
      success: true,
      profile,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('Error getting current user profile', { error: error.message });
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: error.message || 'Failed to get profile',
      timestamp: Date.now()
    } as APIError);
  }
});

/**
 * GET /api/v1/users/:userId
 * Get user information
 */
userRouter.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // TEMPORARY: Return basic user info for demo
    const user = {
      userId,
      email: 'demo@consentire.com',
      role: 'user',
      did: `did:consentire:${userId}`
    };
    
    res.status(200).json({
      success: true,
      user,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('Error getting user', { error: error.message });
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: error.message || 'Failed to get user',
      timestamp: Date.now()
    } as APIError);
  }
});
