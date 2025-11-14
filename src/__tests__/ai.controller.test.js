import request from 'supertest';
import express from 'express';
import { aiController } from '../controllers/ai.controller.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { AI_MODELS } from '../constants/index.js';

const app = express();
app.use(express.json());

// Setup routes
app.post('/api/ai/chat', aiController.chat);
app.post('/api/ai/generate', aiController.generate);

// Error handler must be last
app.use(errorHandler);

describe('AI Controller - Model Selection', () => {
  describe('POST /api/ai/chat', () => {
    describe('Valid models', () => {
      it('should accept gpt-3.5-turbo', async () => {
        const response = await request(app)
          .post('/api/ai/chat')
          .send({
            messages: [{ role: 'user', content: 'Hello' }],
            model: AI_MODELS.GPT_3_5_TURBO,
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('response');
      });

      it('should accept gpt-4', async () => {
        const response = await request(app)
          .post('/api/ai/chat')
          .send({
            messages: [{ role: 'user', content: 'Hello' }],
            model: AI_MODELS.GPT_4,
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('response');
      });

      it('should accept gpt-4-turbo-preview', async () => {
        const response = await request(app)
          .post('/api/ai/chat')
          .send({
            messages: [{ role: 'user', content: 'Hello' }],
            model: AI_MODELS.GPT_4_TURBO,
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('response');
      });

      it('should use default model when not provided', async () => {
        const response = await request(app)
          .post('/api/ai/chat')
          .send({
            messages: [{ role: 'user', content: 'Hello' }],
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('response');
      });
    });

    describe('Invalid models', () => {
      it('should reject invalid model string', async () => {
        const response = await request(app)
          .post('/api/ai/chat')
          .send({
            messages: [{ role: 'user', content: 'Hello' }],
            model: 'invalid-model',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      });

      it('should reject wrong case model name', async () => {
        const response = await request(app)
          .post('/api/ai/chat')
          .send({
            messages: [{ role: 'user', content: 'Hello' }],
            model: 'GPT-4', // uppercase
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should reject model with extra spaces', async () => {
        const response = await request(app)
          .post('/api/ai/chat')
          .send({
            messages: [{ role: 'user', content: 'Hello' }],
            model: ' gpt-4 ',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should reject empty string model', async () => {
        const response = await request(app)
          .post('/api/ai/chat')
          .send({
            messages: [{ role: 'user', content: 'Hello' }],
            model: '',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should reject null model (should omit instead)', async () => {
        const response = await request(app)
          .post('/api/ai/chat')
          .send({
            messages: [{ role: 'user', content: 'Hello' }],
            model: null,
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should reject numeric model', async () => {
        const response = await request(app)
          .post('/api/ai/chat')
          .send({
            messages: [{ role: 'user', content: 'Hello' }],
            model: 123,
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('POST /api/ai/generate', () => {
    describe('Valid models', () => {
      it('should accept gpt-3.5-turbo', async () => {
        const response = await request(app).post('/api/ai/generate').send({
          prompt: 'Write a poem',
          model: AI_MODELS.GPT_3_5_TURBO,
        });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('response');
      });

      it('should accept gpt-4', async () => {
        const response = await request(app).post('/api/ai/generate').send({
          prompt: 'Write a poem',
          model: AI_MODELS.GPT_4,
        });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('response');
      });

      it('should accept gpt-4-turbo-preview', async () => {
        const response = await request(app).post('/api/ai/generate').send({
          prompt: 'Write a poem',
          model: AI_MODELS.GPT_4_TURBO,
        });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('response');
      });

      it('should use default model when not provided', async () => {
        const response = await request(app).post('/api/ai/generate').send({
          prompt: 'Write a poem',
        });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('response');
      });

      it('should accept model with systemPrompt', async () => {
        const response = await request(app).post('/api/ai/generate').send({
          prompt: 'Write a poem',
          systemPrompt: 'You are a poet',
          model: AI_MODELS.GPT_4,
        });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('response');
      });
    });

    describe('Invalid models', () => {
      it('should reject invalid model string', async () => {
        const response = await request(app).post('/api/ai/generate').send({
          prompt: 'Write a poem',
          model: 'invalid-model',
        });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should reject wrong case model name', async () => {
        const response = await request(app).post('/api/ai/generate').send({
          prompt: 'Write a poem',
          model: 'GPT-3.5-TURBO',
        });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('Backward compatibility', () => {
    it('should work with existing API calls (no model parameter)', async () => {
      const chatResponse = await request(app)
        .post('/api/ai/chat')
        .send({
          messages: [{ role: 'user', content: 'Hello' }],
        });

      expect(chatResponse.status).toBe(200);
      expect(chatResponse.body.success).toBe(true);

      const generateResponse = await request(app).post('/api/ai/generate').send({
        prompt: 'Write a poem',
      });

      expect(generateResponse.status).toBe(200);
      expect(generateResponse.body.success).toBe(true);
    });

    it('should maintain existing request structure', async () => {
      const response = await request(app)
        .post('/api/ai/chat')
        .send({
          messages: [{ role: 'user', content: 'Hello' }],
          temperature: 0.5,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('message');
    });
  });
});
