import { requestId } from '../middleware/requestId.js';

describe('Request ID Middleware', () => {
  let req, res, next, setHeaderCalls, nextCalls;

  beforeEach(() => {
    setHeaderCalls = [];
    nextCalls = 0;

    req = {
      headers: {},
    };
    res = {
      setHeader: (name, value) => {
        setHeaderCalls.push({ name, value });
      },
    };
    next = () => {
      nextCalls++;
    };
  });

  describe('UUID Generation', () => {
    it('should generate a new UUID when no header is present', () => {
      requestId(req, res, next);

      expect(req.requestId).toBeDefined();
      expect(typeof req.requestId).toBe('string');
      expect(req.requestId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it('should generate different UUIDs for different requests', () => {
      const req1 = { headers: {} };
      const req2 = { headers: {} };
      const res1 = { setHeader: () => {} };
      const res2 = { setHeader: () => {} };

      requestId(req1, res1, next);
      requestId(req2, res2, next);

      expect(req1.requestId).not.toBe(req2.requestId);
    });

    it('should generate valid UUID v4', () => {
      requestId(req, res, next);

      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      // where x is any hexadecimal digit and y is one of 8, 9, A, or B
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(req.requestId).toMatch(uuidPattern);
    });
  });

  describe('Existing Request ID Preservation', () => {
    it('should preserve existing request ID from lowercase header', () => {
      const existingId = 'custom-request-id-123';
      req.headers['x-request-id'] = existingId;

      requestId(req, res, next);

      expect(req.requestId).toBe(existingId);
    });

    it('should preserve existing request ID from uppercase header', () => {
      const existingId = 'custom-request-id-456';
      req.headers['X-Request-ID'] = existingId;

      requestId(req, res, next);

      expect(req.requestId).toBe(existingId);
    });

    it('should prefer lowercase header when both present', () => {
      const lowercaseId = 'lowercase-id';
      const uppercaseId = 'uppercase-id';
      req.headers['x-request-id'] = lowercaseId;
      req.headers['X-Request-ID'] = uppercaseId;

      requestId(req, res, next);

      expect(req.requestId).toBe(lowercaseId);
    });

    it('should preserve UUID from load balancer', () => {
      const loadBalancerId = '550e8400-e29b-41d4-a716-446655440000';
      req.headers['x-request-id'] = loadBalancerId;

      requestId(req, res, next);

      expect(req.requestId).toBe(loadBalancerId);
    });
  });

  describe('Response Header', () => {
    it('should set X-Request-ID response header', () => {
      requestId(req, res, next);

      expect(setHeaderCalls.length).toBe(1);
      expect(setHeaderCalls[0].name).toBe('X-Request-ID');
      expect(setHeaderCalls[0].value).toBe(req.requestId);
    });

    it('should set response header with existing request ID', () => {
      const existingId = 'existing-id';
      req.headers['x-request-id'] = existingId;

      requestId(req, res, next);

      expect(setHeaderCalls.length).toBe(1);
      expect(setHeaderCalls[0].name).toBe('X-Request-ID');
      expect(setHeaderCalls[0].value).toBe(existingId);
    });

    it('should set response header before calling next', () => {
      let setHeaderCalled = false;
      let nextCalled = false;

      res.setHeader = () => {
        setHeaderCalled = true;
      };
      next = () => {
        nextCalled = true;
      };

      requestId(req, res, next);

      expect(setHeaderCalled).toBe(true);
      expect(nextCalled).toBe(true);
    });
  });

  describe('Middleware Flow', () => {
    it('should call next middleware', () => {
      requestId(req, res, next);

      expect(nextCalls).toBe(1);
    });

    it('should call next exactly once', () => {
      requestId(req, res, next);

      expect(nextCalls).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string request ID', () => {
      req.headers['x-request-id'] = '';

      requestId(req, res, next);

      // Should generate new UUID for empty string
      expect(req.requestId).toBeDefined();
      expect(req.requestId).not.toBe('');
      expect(req.requestId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it('should handle very long request ID', () => {
      const longId = 'x'.repeat(1000);
      req.headers['x-request-id'] = longId;

      requestId(req, res, next);

      expect(req.requestId).toBe(longId);
      expect(setHeaderCalls[0].name).toBe('X-Request-ID');
      expect(setHeaderCalls[0].value).toBe(longId);
    });

    it('should handle request ID with special characters', () => {
      const specialId = 'req-id-!@#$%^&*()_+-={}[]|;:,.<>?';
      req.headers['x-request-id'] = specialId;

      requestId(req, res, next);

      expect(req.requestId).toBe(specialId);
    });

    it('should handle null header value', () => {
      req.headers['x-request-id'] = null;

      requestId(req, res, next);

      // Should generate new UUID for null
      expect(req.requestId).toBeDefined();
      expect(req.requestId).not.toBeNull();
      expect(req.requestId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it('should handle undefined header value', () => {
      req.headers['x-request-id'] = undefined;

      requestId(req, res, next);

      // Should generate new UUID for undefined
      expect(req.requestId).toBeDefined();
      expect(req.requestId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it('should handle numeric request ID', () => {
      req.headers['x-request-id'] = 12345;

      requestId(req, res, next);

      expect(req.requestId).toBe(12345);
    });

    it('should attach requestId to req object', () => {
      requestId(req, res, next);

      expect(req).toHaveProperty('requestId');
      expect(req.requestId).toBeDefined();
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle concurrent requests with unique IDs', () => {
      const requests = Array.from({ length: 10 }, () => ({ headers: {} }));
      const responses = Array.from({ length: 10 }, () => ({ setHeader: () => {} }));

      requests.forEach((r, i) => {
        requestId(r, responses[i], next);
      });

      const requestIds = requests.map(r => r.requestId);

      // All should be defined
      requestIds.forEach(id => expect(id).toBeDefined());

      // All should be unique
      const uniqueIds = new Set(requestIds);
      expect(uniqueIds.size).toBe(10);
    });
  });

  describe('Request Object Integrity', () => {
    it('should not modify other request properties', () => {
      req.method = 'POST';
      req.url = '/api/test';
      req.body = { test: 'data' };

      requestId(req, res, next);

      expect(req.method).toBe('POST');
      expect(req.url).toBe('/api/test');
      expect(req.body).toEqual({ test: 'data' });
    });

    it('should not modify headers object', () => {
      const originalHeaders = { ...req.headers };

      requestId(req, res, next);

      expect(req.headers).toEqual(originalHeaders);
    });
  });
});
