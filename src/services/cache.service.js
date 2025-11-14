class CacheService {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 5 * 60 * 1000;
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    this.hits = 0;
    this.misses = 0;
  }

  set(key, value, ttl) {
    const now = Date.now();
    this.cache.set(key, {
      data: value,
      expiresAt: now + (ttl || this.defaultTTL),
      createdAt: now,
    });
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.data;
  }

  has(key) {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  size() {
    return this.cache.size;
  }

  /**
   * Get comprehensive cache statistics
   * @returns {Object} Statistics including size, hits, misses, hit rate, and entry timestamps
   */
  getStats() {
    // Calculate hit rate (handle division by zero)
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests === 0 ? 0 : (this.hits / totalRequests) * 100;

    // Find oldest and newest entries (excluding expired)
    let oldestEntry = null;
    let newestEntry = null;
    const now = Date.now();

    for (const [, entry] of this.cache.entries()) {
      // Skip expired entries
      if (now > entry.expiresAt) continue;

      if (!oldestEntry || entry.createdAt < oldestEntry) {
        oldestEntry = entry.createdAt;
      }
      if (!newestEntry || entry.createdAt > newestEntry) {
        newestEntry = entry.createdAt;
      }
    }

    return {
      size: this.cache.size,
      maxSize: null, // No hard limit in current implementation (null = unlimited)
      defaultTTL: this.defaultTTL,
      hits: this.hits,
      misses: this.misses,
      hitRate: parseFloat(hitRate.toFixed(2)),
      oldestEntry: oldestEntry,
      newestEntry: newestEntry,
    };
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }
}

export { CacheService };
export const cacheService = new CacheService();

export function destroyCacheService() {
  cacheService.destroy();
}
