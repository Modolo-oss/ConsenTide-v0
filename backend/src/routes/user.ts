/**
 * User API routes
 */

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import {
  UserRegistrationRequest,
  UserRegistrationResponse,
  APIError
} from '@consentire/shared';
import { databaseService } from '../services/databaseService';
import { logger } from '../utils/logger';

export const userRouter = Router();

/**
 * POST /api/v1/users/register
 * Register a new user
 */
userRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, publicKey, password, metadata }: UserRegistrationRequest = req.body;

    // Validate required fields
    if (!email || !publicKey || !password) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Missing required fields: email, publicKey, and password are required',
        timestamp: Date.now()
      } as APIError);
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

    // Generate user identifiers
    const userId = `user_${crypto.createHash('sha256').update(email.toLowerCase()).digest('hex').substring(0, 32)}`;
    const emailHash = crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex').substring(0, 64);
    const did = `did:consentire:${crypto.createHash('sha256').update(publicKey).digest('hex').substring(0, 32)}`;

    // Check if user already exists
    const existingUser = await databaseService.query(
      'SELECT id FROM users WHERE email_hash = $1',
      [emailHash]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        code: 'USER_EXISTS',
        message: 'User with this email already exists',
        timestamp: Date.now()
      } as APIError);
    }

    // Insert user into users table
    await databaseService.query(`
      INSERT INTO users (id, email_hash, public_key, did, created_at)
      VALUES ($1, $2, $3, $4, NOW())
    `, [userId, emailHash, publicKey, did]);

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert auth credentials
    await databaseService.query(`
      INSERT INTO auth_credentials (user_id, email, password_hash, role, user_type, created_at)
      VALUES ($1, $2, $3, 'user', 'individual', NOW())
    `, [userId, email, passwordHash]);

    logger.info(`User registered successfully: ${email} (ID: ${userId})`);

    const response: UserRegistrationResponse = {
      success: true,
      userId,
      did,
      message: 'User registered successfully. You can now login with your credentials.',
      timestamp: Date.now()
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
userRouter.get('/me/profile', authenticateUser, async (req: Request, res: Response) => {
  try {
    // TODO: Implement user profile retrieval using PostgreSQL pool
    res.status(501).json({
      code: 'NOT_IMPLEMENTED',
      message: 'User profile retrieval needs PostgreSQL implementation',
      timestamp: Date.now()
    } as APIError);
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
userRouter.get('/:userId', authenticateUser, requireOwnership('userId'), async (req: Request, res: Response) => {
  try {
    // TODO: Implement user retrieval using PostgreSQL pool
    res.status(501).json({
      code: 'NOT_IMPLEMENTED',
      message: 'User retrieval needs PostgreSQL implementation',
      timestamp: Date.now()
    } as APIError);
  } catch (error: any) {
    logger.error('Error getting user', { error: error.message });
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: error.message || 'Failed to get user',
      timestamp: Date.now()
    } as APIError);
  }
});
