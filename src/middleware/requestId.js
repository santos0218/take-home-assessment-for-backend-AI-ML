import { randomUUID } from 'crypto';

/**
 * Request ID Middleware
 *
 * Generates or preserves a unique request ID for distributed tracing.
 * - Generates a new UUID if no X-Request-ID header is present
 * - Preserves existing request ID from header (case-insensitive)
 * - Attaches request ID to req.requestId
 * - Sets X-Request-ID response header
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export function requestId(req, res, next) {
  // Check for existing request ID in header (case-insensitive)
  const existingId = req.headers['x-request-id'] || req.headers['X-Request-ID'];

  // Generate new UUID if no existing ID, otherwise use existing
  const id = existingId || randomUUID();

  // Attach to request object
  req.requestId = id;

  // Set response header
  res.setHeader('X-Request-ID', id);

  next();
}
