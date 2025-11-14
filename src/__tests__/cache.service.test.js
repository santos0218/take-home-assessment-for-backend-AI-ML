import { CacheService } from '../services/cache.service.js';

describe('CacheService', () => {
  let cacheService;

  beforeEach(() => {
    // Create a fresh instance for each test
    cacheService = new CacheService();
  });

  afterEach(() => {
    // Clean up to prevent memory leaks and timer issues
    cacheService.destroy();
  });

  describe('constructor', () => {
    it('should initialize with zero hits and misses', () => {
      expect(cacheService.hits).toBe(0);
      expect(cacheService.misses).toBe(0);
    });

    it('should set default TTL to 5 minutes', () => {
      expect(cacheService.defaultTTL).toBe(5 * 60 * 1000);
    });

    it('should create an empty cache', () => {
      expect(cacheService.size()).toBe(0);
    });
  });

  describe('set and get', () => {
    it('should store and retrieve a value', () => {
      cacheService.set('key1', 'value1');
      expect(cacheService.get('key1')).toBe('value1');
    });

    it('should track cache hit when value exists', () => {
      cacheService.set('key1', 'value1');
      cacheService.get('key1');
      expect(cacheService.hits).toBe(1);
      expect(cacheService.misses).toBe(0);
    });

    it('should track cache miss when value does not exist', () => {
      cacheService.get('nonexistent');
      expect(cacheService.hits).toBe(0);
      expect(cacheService.misses).toBe(1);
    });

    it('should track cache miss when value is expired', async () => {
      cacheService.set('key1', 'value1', 10); // 10ms TTL
      await new Promise(resolve => setTimeout(resolve, 20)); // Wait for expiration
      const result = cacheService.get('key1');
      expect(result).toBeNull();
      expect(cacheService.hits).toBe(0);
      expect(cacheService.misses).toBe(1);
    });

    it('should track multiple hits and misses correctly', () => {
      cacheService.set('key1', 'value1');
      cacheService.get('key1'); // hit
      cacheService.get('key1'); // hit
      cacheService.get('key2'); // miss
      cacheService.get('key3'); // miss
      expect(cacheService.hits).toBe(2);
      expect(cacheService.misses).toBe(2);
    });

    it('should store creation timestamp', () => {
      const before = Date.now();
      cacheService.set('key1', 'value1');
      const after = Date.now();

      const entry = cacheService.cache.get('key1');
      expect(entry.createdAt).toBeGreaterThanOrEqual(before);
      expect(entry.createdAt).toBeLessThanOrEqual(after);
    });
  });

  describe('getStats', () => {
    it('should return correct structure', () => {
      const stats = cacheService.getStats();
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('maxSize');
      expect(stats).toHaveProperty('defaultTTL');
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('oldestEntry');
      expect(stats).toHaveProperty('newestEntry');
    });

    it('should return correct size for empty cache', () => {
      const stats = cacheService.getStats();
      expect(stats.size).toBe(0);
      expect(stats.oldestEntry).toBeNull();
      expect(stats.newestEntry).toBeNull();
    });

    it('should return correct size for cache with one item', () => {
      cacheService.set('key1', 'value1');
      const stats = cacheService.getStats();
      expect(stats.size).toBe(1);
      expect(stats.oldestEntry).not.toBeNull();
      expect(stats.newestEntry).not.toBeNull();
      expect(stats.oldestEntry).toBe(stats.newestEntry);
    });

    it('should return correct size for cache with multiple items', () => {
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2');
      cacheService.set('key3', 'value3');
      const stats = cacheService.getStats();
      expect(stats.size).toBe(3);
    });

    it('should calculate 0% hit rate with no requests', () => {
      const stats = cacheService.getStats();
      expect(stats.hitRate).toBe(0);
    });

    it('should calculate 100% hit rate with all hits', () => {
      cacheService.set('key1', 'value1');
      cacheService.get('key1');
      cacheService.get('key1');
      const stats = cacheService.getStats();
      expect(stats.hitRate).toBe(100);
    });

    it('should calculate 0% hit rate with all misses', () => {
      cacheService.get('key1');
      cacheService.get('key2');
      const stats = cacheService.getStats();
      expect(stats.hitRate).toBe(0);
    });

    it('should calculate 50% hit rate with equal hits and misses', () => {
      cacheService.set('key1', 'value1');
      cacheService.get('key1'); // hit
      cacheService.get('key2'); // miss
      const stats = cacheService.getStats();
      expect(stats.hitRate).toBe(50);
    });

    it('should calculate hit rate with floating point precision', () => {
      cacheService.set('key1', 'value1');
      cacheService.get('key1'); // hit
      cacheService.get('key2'); // miss
      cacheService.get('key3'); // miss
      const stats = cacheService.getStats();
      expect(stats.hitRate).toBe(33.33); // 1/3 = 33.33%
    });

    it('should return Infinity for maxSize', () => {
      const stats = cacheService.getStats();
      expect(stats.maxSize).toBeNull();
    });

    it('should return correct defaultTTL', () => {
      const stats = cacheService.getStats();
      expect(stats.defaultTTL).toBe(5 * 60 * 1000);
    });

    it('should track oldest entry correctly', async () => {
      const time1 = Date.now();
      cacheService.set('key1', 'value1');
      await new Promise(resolve => setTimeout(resolve, 10));
      cacheService.set('key2', 'value2');
      await new Promise(resolve => setTimeout(resolve, 10));
      cacheService.set('key3', 'value3');

      const stats = cacheService.getStats();
      expect(stats.oldestEntry).toBeGreaterThanOrEqual(time1);
      expect(stats.oldestEntry).toBeLessThan(stats.newestEntry);
    });

    it('should track newest entry correctly', async () => {
      cacheService.set('key1', 'value1');
      await new Promise(resolve => setTimeout(resolve, 10));
      const time2 = Date.now();
      cacheService.set('key2', 'value2');

      const stats = cacheService.getStats();
      expect(stats.newestEntry).toBeGreaterThanOrEqual(time2);
    });

    it('should exclude expired entries from oldest/newest calculation', async () => {
      cacheService.set('key1', 'value1', 10); // 10ms TTL (will expire)
      await new Promise(resolve => setTimeout(resolve, 20));
      cacheService.set('key2', 'value2'); // Won't expire

      const stats = cacheService.getStats();
      // Only key2 should be counted
      expect(stats.size).toBe(2); // Both still in Map
      expect(stats.oldestEntry).not.toBeNull();
      expect(stats.newestEntry).not.toBeNull();
    });

    it('should handle division by zero gracefully', () => {
      const stats = cacheService.getStats();
      expect(stats.hitRate).toBe(0);
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });

  describe('clear', () => {
    it('should reset cache size to zero', () => {
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2');
      cacheService.clear();
      expect(cacheService.size()).toBe(0);
    });

    it('should reset hits to zero', () => {
      cacheService.set('key1', 'value1');
      cacheService.get('key1'); // 1 hit
      cacheService.clear();
      expect(cacheService.hits).toBe(0);
    });

    it('should reset misses to zero', () => {
      cacheService.get('nonexistent'); // 1 miss
      cacheService.clear();
      expect(cacheService.misses).toBe(0);
    });

    it('should reset both hits and misses', () => {
      cacheService.set('key1', 'value1');
      cacheService.get('key1'); // hit
      cacheService.get('key2'); // miss
      cacheService.clear();
      expect(cacheService.hits).toBe(0);
      expect(cacheService.misses).toBe(0);
    });
  });

  describe('destroy', () => {
    it('should clear the cache', () => {
      cacheService.set('key1', 'value1');
      cacheService.destroy();
      expect(cacheService.size()).toBe(0);
    });

    it('should reset hits to zero', () => {
      cacheService.set('key1', 'value1');
      cacheService.get('key1');
      cacheService.destroy();
      expect(cacheService.hits).toBe(0);
    });

    it('should reset misses to zero', () => {
      cacheService.get('nonexistent');
      cacheService.destroy();
      expect(cacheService.misses).toBe(0);
    });

    it('should clear cleanup interval', () => {
      const intervalId = cacheService.cleanupInterval;
      expect(intervalId).not.toBeNull();
      cacheService.destroy();
      expect(cacheService.cleanupInterval).toBeNull();
    });
  });

  describe('has', () => {
    it('should return true for existing key', () => {
      cacheService.set('key1', 'value1');
      expect(cacheService.has('key1')).toBe(true);
    });

    it('should return false for non-existent key', () => {
      expect(cacheService.has('nonexistent')).toBe(false);
    });

    it('should return false for expired key', async () => {
      cacheService.set('key1', 'value1', 10); // 10ms TTL
      await new Promise(resolve => setTimeout(resolve, 20)); // Wait for expiration
      expect(cacheService.has('key1')).toBe(false);
    });

    it('should delete expired entries when checking has()', async () => {
      cacheService.set('key1', 'value1', 10);
      await new Promise(resolve => setTimeout(resolve, 20));
      cacheService.has('key1');
      expect(cacheService.cache.has('key1')).toBe(false); // Should be deleted
    });
  });

  describe('delete', () => {
    it('should remove key from cache', () => {
      cacheService.set('key1', 'value1');
      cacheService.delete('key1');
      expect(cacheService.get('key1')).toBeNull();
    });

    it('should not throw error when deleting non-existent key', () => {
      expect(() => cacheService.delete('nonexistent')).not.toThrow();
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', async () => {
      cacheService.set('key1', 'value1', 10); // 10ms TTL
      cacheService.set('key2', 'value2', 10000); // 10s TTL
      await new Promise(resolve => setTimeout(resolve, 20));
      cacheService.cleanup();
      expect(cacheService.cache.has('key1')).toBe(false);
      expect(cacheService.cache.has('key2')).toBe(true);
    });

    it('should not remove non-expired entries', () => {
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2');
      cacheService.cleanup();
      expect(cacheService.size()).toBe(2);
    });

    it('should handle empty cache', () => {
      expect(() => cacheService.cleanup()).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle rapid consecutive gets', () => {
      cacheService.set('key1', 'value1');
      for (let i = 0; i < 100; i++) {
        cacheService.get('key1');
      }
      expect(cacheService.hits).toBe(100);
      expect(cacheService.misses).toBe(0);
    });

    it('should handle empty string as key', () => {
      cacheService.set('', 'value');
      expect(cacheService.get('')).toBe('value');
      expect(cacheService.hits).toBe(1);
    });

    it('should handle null value', () => {
      cacheService.set('key1', null);
      expect(cacheService.get('key1')).toBeNull();
      expect(cacheService.hits).toBe(1); // Should be a hit, not a miss
    });

    it('should handle undefined value', () => {
      cacheService.set('key1', undefined);
      expect(cacheService.get('key1')).toBeUndefined();
      expect(cacheService.hits).toBe(1); // Should be a hit
    });

    it('should handle large number of entries', () => {
      for (let i = 0; i < 1000; i++) {
        cacheService.set(`key${i}`, `value${i}`);
      }
      const stats = cacheService.getStats();
      expect(stats.size).toBe(1000);
    });

    it('should handle concurrent gets correctly', () => {
      cacheService.set('key1', 'value1');
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(Promise.resolve(cacheService.get('key1')));
      }
      return Promise.all(promises).then(() => {
        expect(cacheService.hits).toBe(10);
      });
    });
  });
});

// Test the destroyCacheService function separately
import {
  destroyCacheService,
  cacheService as globalCacheService,
} from '../services/cache.service.js';

describe('destroyCacheService', () => {
  it('should destroy the global cache service', () => {
    globalCacheService.set('test', 'value');
    destroyCacheService();
    expect(globalCacheService.size()).toBe(0);
    expect(globalCacheService.cleanupInterval).toBeNull();
  });
});
