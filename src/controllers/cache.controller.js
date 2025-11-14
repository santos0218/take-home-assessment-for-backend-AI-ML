import { cacheService } from '../services/cache.service.js';
import { sendSuccess } from '../utils/response.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { logger } from '../utils/logger.js';

/**
 * Cache Controller
 * Handles cache-related HTTP requests
 */
export const cacheController = {
  /**
   * Get cache statistics
   * GET /api/cache/stats
   */
  getStats: asyncHandler(async (req, res) => {
    logger.debug('Cache stats request received');
    const stats = cacheService.getStats();
    sendSuccess(res, stats, 'Cache statistics retrieved successfully');
  }),
};
