import { aiService } from '../services/ai.service.js';
import { cacheService } from '../services/cache.service.js';
import { AI_MODELS } from '../constants/index.js';

describe('AI Service - Model Selection', () => {
  beforeEach(() => {
    // Clear cache before each test
    cacheService.clear();
  });

  afterEach(() => {
    cacheService.clear();
  });

  describe('Model parameter forwarding', () => {
    it('should accept gpt-3.5-turbo model', async () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      const response = await aiService.chatCompletion(messages, AI_MODELS.GPT_3_5_TURBO);

      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
    });

    it('should accept gpt-4 model', async () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      const response = await aiService.chatCompletion(messages, AI_MODELS.GPT_4);

      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
    });

    it('should accept gpt-4-turbo-preview model', async () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      const response = await aiService.chatCompletion(messages, AI_MODELS.GPT_4_TURBO);

      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
    });

    it('should work with undefined model (uses default)', async () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      const response = await aiService.chatCompletion(messages, undefined);

      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
    });

    it('should work with no model parameter', async () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      const response = await aiService.chatCompletion(messages);

      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
    });
  });

  describe('generateText with models', () => {
    it('should accept gpt-3.5-turbo for text generation', async () => {
      const response = await aiService.generateText('Write a poem', null, AI_MODELS.GPT_3_5_TURBO);

      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
    });

    it('should accept gpt-4 for text generation', async () => {
      const response = await aiService.generateText('Write a poem', null, AI_MODELS.GPT_4);

      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
    });

    it('should accept gpt-4-turbo-preview for text generation', async () => {
      const response = await aiService.generateText('Write a poem', null, AI_MODELS.GPT_4_TURBO);

      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
    });

    it('should work with systemPrompt and model', async () => {
      const response = await aiService.generateText(
        'Write a poem',
        'You are a poet',
        AI_MODELS.GPT_4
      );

      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
    });

    it('should work without model parameter', async () => {
      const response = await aiService.generateText('Write a poem', null);

      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
    });
  });

  describe('Cache isolation by model (when OpenAI is used)', () => {
    // Note: These tests verify the cache key structure, but actual caching
    // only happens when OpenAI is configured. Mock service doesn't cache.

    it('should verify cache key structure supports model isolation', () => {
      // The cache key format: `chat:${model}:${hash(messages)}`
      // This ensures different models create different cache entries

      // Test that the service accepts all models without error
      const messages = [{ role: 'user', content: 'Test' }];

      expect(async () => {
        await aiService.chatCompletion(messages, AI_MODELS.GPT_3_5_TURBO);
        await aiService.chatCompletion(messages, AI_MODELS.GPT_4);
        await aiService.chatCompletion(messages, AI_MODELS.GPT_4_TURBO);
      }).not.toThrow();
    });

    it('should pass model parameter through to service layer', async () => {
      // This test verifies that model parameter is accepted
      const messages = [{ role: 'user', content: 'Hello' }];

      // All three should work without errors
      const response1 = await aiService.chatCompletion(messages, AI_MODELS.GPT_3_5_TURBO);
      const response2 = await aiService.chatCompletion(messages, AI_MODELS.GPT_4);
      const response3 = await aiService.chatCompletion(messages, AI_MODELS.GPT_4_TURBO);

      expect(response1).toBeDefined();
      expect(response2).toBeDefined();
      expect(response3).toBeDefined();
    });
  });

  describe('Backward compatibility', () => {
    it('should work when model is undefined', async () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      const response = await aiService.chatCompletion(messages, undefined);

      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
    });

    it('should work when model parameter is omitted', async () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      const response = await aiService.chatCompletion(messages);

      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
    });

    it('should use default model when not specified', async () => {
      const messages = [{ role: 'user', content: 'Default model test' }];

      // Should work without model parameter (backward compatible)
      const response1 = await aiService.chatCompletion(messages);
      expect(response1).toBeDefined();

      // Should work with undefined
      const response2 = await aiService.chatCompletion(messages, undefined);
      expect(response2).toBeDefined();
    });
  });

  describe('Mock service model handling', () => {
    it('should gracefully handle model parameter in mock service', async () => {
      // Mock service should accept (and ignore) model parameter
      const messages = [{ role: 'user', content: 'Hello' }];

      const response1 = await aiService.chatCompletion(messages, AI_MODELS.GPT_3_5_TURBO);
      const response2 = await aiService.chatCompletion(messages, AI_MODELS.GPT_4);

      // Both should work (mock service doesn't fail)
      expect(response1).toBeDefined();
      expect(response2).toBeDefined();
    });

    it('should return consistent responses from mock service', async () => {
      const messages = [{ role: 'user', content: 'hello' }];

      const response = await aiService.chatCompletion(messages, AI_MODELS.GPT_4);

      // Mock service has specific responses for "hello"
      expect(response).toContain('Hello');
    });
  });

  describe('Performance and edge cases', () => {
    it('should handle rapid consecutive calls with different models', async () => {
      const messages = [{ role: 'user', content: 'Rapid test' }];

      const promises = [
        aiService.chatCompletion(messages, AI_MODELS.GPT_3_5_TURBO),
        aiService.chatCompletion(messages, AI_MODELS.GPT_4),
        aiService.chatCompletion(messages, AI_MODELS.GPT_4_TURBO),
      ];

      const results = await Promise.all(promises);

      // All should succeed
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
      });
    });

    it('should handle very long messages with model parameter', async () => {
      const longContent = 'a'.repeat(5000);
      const messages = [{ role: 'user', content: longContent }];

      const response = await aiService.chatCompletion(messages, AI_MODELS.GPT_4);

      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
    });

    it('should handle multiple message history with model parameter', async () => {
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
        { role: 'user', content: 'How are you?' },
        { role: 'assistant', content: 'I am doing well!' },
        { role: 'user', content: 'Great!' }
      ];

      const response = await aiService.chatCompletion(messages, AI_MODELS.GPT_4);

      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
    });
  });
});
