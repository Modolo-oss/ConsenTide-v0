/**
 * Analytics API routes for real-time consent metrics
 */

import { Router, Request, Response } from 'express';
import { authenticateUser } from '../middleware/supabaseAuth';
import { databaseService } from '../services/databaseService';
import { logger } from '../utils/logger';
import { APIError } from '@consentire/shared';

export const analyticsRouter = Router();

/**
 * GET /api/v1/analytics/trends
 * Get consent trends over time
 */
analyticsRouter.get('/trends', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { controllerHash, days = '30' } = req.query;
    const daysNum = parseInt(days as string);

    let query = `
      SELECT 
        DATE(granted_at) as date,
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'granted' THEN 1 END) as granted,
        COUNT(CASE WHEN status = 'revoked' THEN 1 END) as revoked,
        COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired
      FROM consents
      WHERE granted_at >= NOW() - INTERVAL '${daysNum} days'
    `;

    const params: any[] = [];
    if (controllerHash) {
      query += ' AND controller_hash = $1';
      params.push(controllerHash);
    }

    query += ' GROUP BY DATE(granted_at) ORDER BY date DESC';

    const result = await databaseService.query(query, params);

    res.json({
      trends: result.rows.map(row => ({
        date: row.date,
        total: parseInt(row.total),
        granted: parseInt(row.granted),
        revoked: parseInt(row.revoked),
        expired: parseInt(row.expired)
      }))
    });
  } catch (error: any) {
    logger.error('Error fetching consent trends', { error: error.message });
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: error.message || 'Failed to fetch trends',
      timestamp: Date.now()
    } as APIError);
  }
});

/**
 * GET /api/v1/analytics/purposes
 * Get consent breakdown by purpose
 */
analyticsRouter.get('/purposes', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { controllerHash } = req.query;

    let query = `
      SELECT 
        purpose_hash,
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'granted' THEN 1 END) as active
      FROM consents
    `;

    const params: any[] = [];
    if (controllerHash) {
      query += ' WHERE controller_hash = $1';
      params.push(controllerHash);
    }

    query += ' GROUP BY purpose_hash ORDER BY total DESC';

    const result = await databaseService.query(query, params);

    res.json({
      purposes: result.rows.map(row => ({
        purpose: row.purpose_hash.substring(0, 16) + '...',
        total: parseInt(row.total),
        active: parseInt(row.active)
      }))
    });
  } catch (error: any) {
    logger.error('Error fetching purpose breakdown', { error: error.message });
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: error.message || 'Failed to fetch purposes',
      timestamp: Date.now()
    } as APIError);
  }
});

/**
 * GET /api/v1/analytics/status-distribution
 * Get distribution of consent statuses
 */
analyticsRouter.get('/status-distribution', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { controllerHash } = req.query;

    let query = `
      SELECT 
        status,
        COUNT(*) as count
      FROM consents
    `;

    const params: any[] = [];
    if (controllerHash) {
      query += ' WHERE controller_hash = $1';
      params.push(controllerHash);
    }

    query += ' GROUP BY status';

    const result = await databaseService.query(query, params);

    res.json({
      distribution: result.rows.map(row => ({
        status: row.status,
        count: parseInt(row.count)
      }))
    });
  } catch (error: any) {
    logger.error('Error fetching status distribution', { error: error.message });
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: error.message || 'Failed to fetch distribution',
      timestamp: Date.now()
    } as APIError);
  }
});

/**
 * GET /api/v1/analytics/controller/:controllerHash
 * Get comprehensive analytics for a specific controller
 */
analyticsRouter.get('/controller/:controllerHash', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { controllerHash } = req.params;

    const summaryQuery = `
      SELECT 
        COUNT(*) as total_consents,
        COUNT(CASE WHEN status = 'granted' THEN 1 END) as active_consents,
        COUNT(CASE WHEN status = 'revoked' THEN 1 END) as revoked_consents,
        COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_consents,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT purpose_hash) as unique_purposes
      FROM consents
      WHERE controller_hash = $1
    `;

    const recentQuery = `
      SELECT granted_at, status
      FROM consents
      WHERE controller_hash = $1
      ORDER BY granted_at DESC
      LIMIT 100
    `;

    const [summaryResult, recentResult] = await Promise.all([
      databaseService.query(summaryQuery, [controllerHash]),
      databaseService.query(recentQuery, [controllerHash])
    ]);

    const summary = summaryResult.rows[0];
    const recentConsents = recentResult.rows;

    const last30Days = recentConsents.filter(c => {
      const grantedDate = new Date(c.granted_at);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return grantedDate >= thirtyDaysAgo;
    });

    res.json({
      summary: {
        totalConsents: parseInt(summary.total_consents),
        activeConsents: parseInt(summary.active_consents),
        revokedConsents: parseInt(summary.revoked_consents),
        expiredConsents: parseInt(summary.expired_consents),
        uniqueUsers: parseInt(summary.unique_users),
        uniquePurposes: parseInt(summary.unique_purposes)
      },
      recentActivity: {
        last30DaysCount: last30Days.length,
        last30DaysGranted: last30Days.filter(c => c.status === 'granted').length,
        last30DaysRevoked: last30Days.filter(c => c.status === 'revoked').length
      }
    });
  } catch (error: any) {
    logger.error('Error fetching controller analytics', { error: error.message });
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: error.message || 'Failed to fetch controller analytics',
      timestamp: Date.now()
    } as APIError);
  }
});
