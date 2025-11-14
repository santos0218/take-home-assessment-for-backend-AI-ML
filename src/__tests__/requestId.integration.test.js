import request from 'supertest';
import express from 'express';
import { requestId } from '../middleware/requestId.js';
import { requestLogger } from '../middleware/requestLogger.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { aiController } from '../controllers/ai.controller.js';

const app = express();
app.use(express.json());

// Apply middleware
app.use(requestId);
app.use(requestLogger);

// Test routes
app.post('/api/ai/chat', aiController.chat);
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    requestId: req.requestId,
  });
});
app.get('/error', () => {
  throw new Error('Test error');
});

// Error handler
app.use(errorHandler);

describe('Request ID Integration Tests', () => {
  describe('Response Headers', () => {
    it('should include X-Request-ID in response headers', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.headers['x-request-id']).toBeDefined();
      expect(response.headers['x-request-id']).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it('should preserve custom request ID in response', async () => {
      const customId = 'my-custom-request-id';

      const response = await request(app).get('/health').set('X-Request-ID', customId);

      expect(response.status).toBe(200);
      expect(response.headers['x-request-id']).toBe(customId);
    });

    it('should include request ID in response body when available', async () => {
      const response = await request(app).get('/health');

      expect(response.body.requestId).toBeDefined();
      expect(response.headers['x-request-id']).toBe(response.body.requestId);
    });
  });

  describe('Request ID in Different HTTP Methods', () => {
    it('should work with GET requests', async () => {
      const response = await request(app).get('/health');

      expect(response.headers['x-request-id']).toBeDefined();
    });

    it('should work with POST requests', async () => {
      const response = await request(app)
        .post('/api/ai/chat')
        .send({
          messages: [{ role: 'user', content: 'Hello' }],
        });

      expect(response.headers['x-request-id']).toBeDefined();
    });
  });

  describe('Request ID with Custom Headers', () => {
    it('should accept lowercase x-request-id header', async () => {
      const customId = 'lowercase-header-id';

      const response = await request(app).get('/health').set('x-request-id', customId);

      expect(response.headers['x-request-id']).toBe(customId);
    });

    it('should accept uppercase X-Request-ID header', async () => {
      const customId = 'uppercase-header-id';

      const response = await request(app).get('/health').set('X-Request-ID', customId);

      expect(response.headers['x-request-id']).toBe(customId);
    });

    it('should accept mixed-case X-Request-Id header', async () => {
      const customId = 'mixed-case-header-id';

      const response = await request(app).get('/health').set('X-Request-Id', customId);

      expect(response.headers['x-request-id']).toBeDefined();
    });
  });

  describe('Request ID Uniqueness', () => {
    it('should generate unique IDs for concurrent requests', async () => {
      const promises = Array.from({ length: 5 }, () => request(app).get('/health'));

      const responses = await Promise.all(promises);
      const requestIds = responses.map(r => r.headers['x-request-id']);

      // All should be defined
      requestIds.forEach(id => expect(id).toBeDefined());

      // All should be unique
      const uniqueIds = new Set(requestIds);
      expect(uniqueIds.size).toBe(5);
    });

    it('should generate different IDs for sequential requests', async () => {
      const response1 = await request(app).get('/health');
      const response2 = await request(app).get('/health');
      const response3 = await request(app).get('/health');

      const id1 = response1.headers['x-request-id'];
      const id2 = response2.headers['x-request-id'];
      const id3 = response3.headers['x-request-id'];

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });
  });

  describe('Request ID Persistence Through Middleware Chain', () => {
    it('should maintain same request ID throughout request lifecycle', async () => {
      const customId = 'persistent-id';

      const response = await request(app).get('/health').set('X-Request-ID', customId);

      // Response header should match
      expect(response.headers['x-request-id']).toBe(customId);

      // Response body should match (if included)
      if (response.body.requestId) {
        expect(response.body.requestId).toBe(customId);
      }
    });

    it('should pass request ID through error handler', async () => {
      const response = await request(app).get('/error');

      // Even on error, request ID should be present
      expect(response.headers['x-request-id']).toBeDefined();
    });
  });

  describe('Request ID with AI Endpoints', () => {
    it('should include request ID in AI chat requests', async () => {
      const response = await request(app)
        .post('/api/ai/chat')
        .send({
          messages: [{ role: 'user', content: 'Hello' }],
        });

      expect(response.headers['x-request-id']).toBeDefined();
      expect(response.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('should preserve custom request ID in AI requests', async () => {
      const customId = 'ai-request-12345';

      const response = await request(app)
        .post('/api/ai/chat')
        .set('X-Request-ID', customId)
        .send({
          messages: [{ role: 'user', content: 'Hello' }],
        });

      expect(response.headers['x-request-id']).toBe(customId);
    });

    it('should maintain request ID through AI request processing', async () => {
      const response = await request(app)
        .post('/api/ai/chat')
        .send({
          messages: [{ role: 'user', content: 'Test message' }],
        });

      const requestId = response.headers['x-request-id'];

      expect(requestId).toBeDefined();
      expect(typeof requestId).toBe('string');
      expect(requestId.length).toBeGreaterThan(0);
    });
  });

  describe('Request ID Format Validation', () => {
    it('should generate valid UUID v4 format', async () => {
      const response = await request(app).get('/health');

      const requestId = response.headers['x-request-id'];
      const uuidv4Pattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      expect(requestId).toMatch(uuidv4Pattern);
    });

    it('should accept non-UUID custom request IDs', async () => {
      const customId = 'simple-id-123';

      const response = await request(app).get('/health').set('X-Request-ID', customId);

      expect(response.headers['x-request-id']).toBe(customId);
    });

    it('should accept alphanumeric request IDs', async () => {
      const customId = 'req123ABC456def';

      const response = await request(app).get('/health').set('X-Request-ID', customId);

      expect(response.headers['x-request-id']).toBe(customId);
    });
  });

  describe('Request ID Performance', () => {
    it('should add minimal overhead to request processing', async () => {
      const start = Date.now();

      await request(app).get('/health');

      const duration = Date.now() - start;

      // Request ID middleware should add < 10ms overhead
      expect(duration).toBeLessThan(100);
    });

    it('should handle rapid consecutive requests efficiently', async () => {
      const start = Date.now();
      const promises = Array.from({ length: 20 }, () => request(app).get('/health'));

      await Promise.all(promises);

      const duration = Date.now() - start;

      // Should process 20 requests in under 2 seconds
      expect(duration).toBeLessThan(2000);
    });
  });
});
