import request from 'supertest';
import express from 'express';
import cacheRoutes from '../routes/cache.routes.js';
import { cacheService } from '../services/cache.service.js';
import { errorHandler } from '../middleware/errorHandler.js';

// Create a test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/cache', cacheRoutes);
  app.use(errorHandler);
  return app;
};

describe('Cache Routes Integration Tests', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
    // Clear cache before each test
    cacheService.clear();
  });

  afterEach(() => {
    // Clean up
    cacheService.clear();
  });

  describe('GET /cache/stats', () => {
    it('should return 200 OK with empty cache stats', async () => {
      const response = await request(app)
        .get('/cache/stats')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Cache statistics retrieved successfully');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.size).toBe(0);
      expect(response.body.data.hits).toBe(0);
      expect(response.body.data.misses).toBe(0);
      expect(response.body.data.hitRate).toBe(0);
    });

    it('should return 200 OK with populated cache stats', async () => {
      // Populate cache
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2');
      cacheService.set('key3', 'value3');

      // Generate some hits and misses
      cacheService.get('key1'); // hit
      cacheService.get('key2'); // hit
      cacheService.get('nonexistent'); // miss

      const response = await request(app)
        .get('/cache/stats')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.size).toBe(3);
      expect(response.body.data.hits).toBe(2);
      expect(response.body.data.misses).toBe(1);
      expect(response.body.data.hitRate).toBe(66.67); // 2/3
    });

    it('should return correct data structure', async () => {
      cacheService.set('test', 'value');

      const response = await request(app)
        .get('/cache/stats')
        .expect(200);

      const { data } = response.body;
      expect(data).toHaveProperty('size');
      expect(data).toHaveProperty('maxSize');
      expect(data).toHaveProperty('defaultTTL');
      expect(data).toHaveProperty('hits');
      expect(data).toHaveProperty('misses');
      expect(data).toHaveProperty('hitRate');
      expect(data).toHaveProperty('oldestEntry');
      expect(data).toHaveProperty('newestEntry');
    });

    it('should return stats with 100% hit rate', async () => {
      cacheService.set('key1', 'value1');
      cacheService.get('key1');
      cacheService.get('key1');
      cacheService.get('key1');

      const response = await request(app)
        .get('/cache/stats')
        .expect(200);

      expect(response.body.data.hits).toBe(3);
      expect(response.body.data.misses).toBe(0);
      expect(response.body.data.hitRate).toBe(100);
    });

    it('should return stats with 0% hit rate', async () => {
      cacheService.get('key1'); // miss
      cacheService.get('key2'); // miss
      cacheService.get('key3'); // miss

      const response = await request(app)
        .get('/cache/stats')
        .expect(200);

      expect(response.body.data.hits).toBe(0);
      expect(response.body.data.misses).toBe(3);
      expect(response.body.data.hitRate).toBe(0);
    });

    it('should return oldest and newest entry timestamps', async () => {
      cacheService.set('key1', 'value1');
      await new Promise(resolve => setTimeout(resolve, 10));
      cacheService.set('key2', 'value2');

      const response = await request(app)
        .get('/cache/stats')
        .expect(200);

      const { oldestEntry, newestEntry } = response.body.data;
      expect(oldestEntry).not.toBeNull();
      expect(newestEntry).not.toBeNull();
      expect(newestEntry).toBeGreaterThan(oldestEntry);
    });

    it('should return null for oldest/newest with empty cache', async () => {
      const response = await request(app)
        .get('/cache/stats')
        .expect(200);

      expect(response.body.data.oldestEntry).toBeNull();
      expect(response.body.data.newestEntry).toBeNull();
    });

    it('should handle large number of cache entries', async () => {
      // Add 100 entries
      for (let i = 0; i < 100; i++) {
        cacheService.set(`key${i}`, `value${i}`);
      }

      const response = await request(app)
        .get('/cache/stats')
        .expect(200);

      expect(response.body.data.size).toBe(100);
    });

    it('should return correct defaultTTL', async () => {
      const response = await request(app)
        .get('/cache/stats')
        .expect(200);

      expect(response.body.data.defaultTTL).toBe(5 * 60 * 1000); // 5 minutes
    });

    it('should return maxSize as null (unlimited)', async () => {
      const response = await request(app)
        .get('/cache/stats')
        .expect(200);

      expect(response.body.data.maxSize).toBeNull();
    });

    it('should handle concurrent requests', async () => {
      cacheService.set('key1', 'value1');

      // Make 5 concurrent requests
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(request(app).get('/cache/stats').expect(200));
      }

      const responses = await Promise.all(promises);

      // All should succeed
      responses.forEach(response => {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
      });
    });

    it('should include success field in response', async () => {
      const response = await request(app)
        .get('/cache/stats')
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(true);
    });

    it('should include message field in response', async () => {
      const response = await request(app)
        .get('/cache/stats')
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Cache statistics retrieved successfully');
    });

    it('should return JSON content type', async () => {
      const response = await request(app)
        .get('/cache/stats')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('Invalid Routes', () => {
    it('should return 404 for POST to /cache/stats', async () => {
      await request(app)
        .post('/cache/stats')
        .expect(404);
    });

    it('should return 404 for PUT to /cache/stats', async () => {
      await request(app)
        .put('/cache/stats')
        .expect(404);
    });

    it('should return 404 for DELETE to /cache/stats', async () => {
      await request(app)
        .delete('/cache/stats')
        .expect(404);
    });

    it('should return 404 for unknown cache routes', async () => {
      await request(app)
        .get('/cache/unknown')
        .expect(404);
    });
  });
});
