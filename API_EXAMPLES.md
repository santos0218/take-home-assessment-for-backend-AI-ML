# API Examples - Backend Enhancement Assessment

This document provides comprehensive examples for all backend enhancements implemented as part of the take-home assessment.

---

## 📊 Feature 1: Cache Statistics Endpoint

### Overview
The cache statistics endpoint provides real-time metrics about the API response cache, including size, hit/miss rates, and timestamps.

### Endpoint
```
GET /api/cache/stats
```

### Example Request
```bash
curl http://localhost:3000/api/cache/stats
```

### Example Response
```json
{
  "success": true,
  "data": {
    "size": 5,
    "maxSize": null,
    "defaultTTL": 300000,
    "hits": 12,
    "misses": 8,
    "hitRate": 0.6,
    "oldestEntry": "2025-11-14T17:00:00.000Z",
    "newestEntry": "2025-11-14T17:15:00.000Z"
  },
  "message": "Cache statistics retrieved successfully",
  "timestamp": "2025-11-14T17:15:00.000Z"
}
```

### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| `size` | number | Current number of cached entries |
| `maxSize` | number/null | Maximum cache size (null = unlimited) |
| `defaultTTL` | number | Default time-to-live in milliseconds (5 minutes) |
| `hits` | number | Total cache hits since server start |
| `misses` | number | Total cache misses since server start |
| `hitRate` | number | Hit rate (0.0 to 1.0, where 1.0 = 100%) |
| `oldestEntry` | string/null | ISO timestamp of oldest cached entry |
| `newestEntry` | string/null | ISO timestamp of newest cached entry |

### Use Cases
- **Monitoring**: Track cache performance in production
- **Debugging**: Identify cache efficiency issues
- **Analytics**: Understand API usage patterns
- **Optimization**: Determine if cache size needs adjustment

---

## 🤖 Feature 2: AI Model Selection

### Overview
AI endpoints now support dynamic model selection. Users can choose between GPT-3.5 Turbo, GPT-4, and GPT-4 Turbo for their requests.

### Available Models
- `gpt-3.5-turbo` (default) - Fast, cost-effective
- `gpt-4` - More capable, higher quality
- `gpt-4-turbo-preview` - Latest GPT-4 with improved speed

### Endpoint 1: Chat Completion

#### Request
```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "What is machine learning?"}
    ],
    "model": "gpt-4"
  }'
```

#### Response
```json
{
  "success": true,
  "data": {
    "response": "Machine learning is a subset of artificial intelligence..."
  },
  "message": "Chat completion successful",
  "timestamp": "2025-11-14T17:15:00.000Z"
}
```

### Endpoint 2: Text Generation

#### Request
```bash
curl -X POST http://localhost:3000/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a haiku about coding",
    "systemPrompt": "You are a creative poet.",
    "model": "gpt-4-turbo-preview"
  }'
```

#### Response
```json
{
  "success": true,
  "data": {
    "response": "Code flows like water\nBugs emerge from hidden depths\nDebug brings peace"
  },
  "message": "Text generated successfully",
  "timestamp": "2025-11-14T17:15:00.000Z"
}
```

### Default Model Behavior
If no `model` parameter is provided, the API defaults to `gpt-3.5-turbo`:

```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

### Invalid Model Handling
If an invalid model is specified, the API returns a validation error:

```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Hello"}],
    "model": "invalid-model"
  }'
```

Response:
```json
{
  "success": false,
  "error": {
    "type": "ValidationError",
    "message": "Validation failed",
    "details": [
      {
        "field": "model",
        "message": "Invalid enum value. Expected 'gpt-3.5-turbo' | 'gpt-4' | 'gpt-4-turbo-preview'"
      }
    ]
  },
  "timestamp": "2025-11-14T17:15:00.000Z"
}
```

### Cache Behavior with Different Models
Each model has its own cache namespace. The same prompt with different models will generate separate cache entries:

```bash
# Request 1 with GPT-3.5
curl -X POST http://localhost:3000/api/ai/chat \
  -d '{"messages":[{"role":"user","content":"Hello"}],"model":"gpt-3.5-turbo"}'

# Request 2 with GPT-4 (different cache entry)
curl -X POST http://localhost:3000/api/ai/chat \
  -d '{"messages":[{"role":"user","content":"Hello"}],"model":"gpt-4"}'
```

---

## 🔍 Feature 3: Request ID Tracking

### Overview
Every API request now includes a unique request ID for distributed tracing. Request IDs can be auto-generated or provided by clients (e.g., load balancers).

### Auto-Generated Request ID

#### Request
```bash
curl -i http://localhost:3000/health
```

#### Response Headers
```
HTTP/1.1 200 OK
X-Request-ID: 13ba7b59-e886-406f-95da-02d23436f34e
Content-Type: application/json
```

### Custom Request ID (Preservation)

Clients can provide their own request ID, which will be preserved throughout the request lifecycle:

#### Request
```bash
curl -i http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: my-custom-request-12345" \
  -d '{
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

#### Response Headers
```
HTTP/1.1 200 OK
X-Request-ID: my-custom-request-12345
Content-Type: application/json
```

### Request ID in Logs

Request IDs appear in all server logs for easy tracing:

```
[2025-11-14T17:15:00.000Z] [INFO] [13ba7b59-e886-406f-95da-02d23436f34e] POST /api/ai/chat 200 - 150ms
[2025-11-14T17:15:01.000Z] [INFO] [my-custom-request-12345] GET /health 200 - 2ms
```

### Use Cases
- **Debugging**: Trace a specific request through logs
- **Monitoring**: Track request flow across microservices
- **Support**: Users can provide request ID for troubleshooting
- **Analytics**: Analyze request patterns and performance

### Request ID Format
- **Auto-generated**: UUID v4 format (e.g., `550e8400-e29b-41d4-a716-446655440000`)
- **Custom**: Any string format accepted (e.g., `req-123`, `custom-id-abc`)

---

## 🔗 Complete Workflow Example

This example demonstrates all three features working together:

### Step 1: Check Initial Cache Stats
```bash
curl http://localhost:3000/api/cache/stats
```

Response:
```json
{
  "success": true,
  "data": {
    "size": 0,
    "hits": 0,
    "misses": 0,
    "hitRate": 0
  },
  "message": "Cache statistics retrieved successfully"
}
```

### Step 2: Make AI Request with Custom Request ID and Model Selection
```bash
curl -i -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: workflow-demo-123" \
  -d '{
    "messages": [
      {"role": "user", "content": "Explain caching in 20 words"}
    ],
    "model": "gpt-4"
  }'
```

Response Headers:
```
HTTP/1.1 200 OK
X-Request-ID: workflow-demo-123
Content-Type: application/json
```

Response Body:
```json
{
  "success": true,
  "data": {
    "response": "Caching stores frequently accessed data temporarily, reducing computation time and improving performance by avoiding repeated expensive operations."
  },
  "message": "Chat completion successful"
}
```

Server Log:
```
[INFO] [workflow-demo-123] Chat request received
[INFO] [workflow-demo-123] POST /api/ai/chat 200 - 250ms
```

### Step 3: Check Updated Cache Stats
```bash
curl -H "X-Request-ID: workflow-demo-456" http://localhost:3000/api/cache/stats
```

Response:
```json
{
  "success": true,
  "data": {
    "size": 1,
    "hits": 0,
    "misses": 1,
    "hitRate": 0,
    "oldestEntry": "2025-11-14T17:15:00.000Z",
    "newestEntry": "2025-11-14T17:15:00.000Z"
  },
  "message": "Cache statistics retrieved successfully"
}
```

### Step 4: Make Same Request Again (Cache Hit)
```bash
curl -i -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: workflow-demo-789" \
  -d '{
    "messages": [
      {"role": "user", "content": "Explain caching in 20 words"}
    ],
    "model": "gpt-4"
  }'
```

Response (faster, from cache):
```json
{
  "success": true,
  "data": {
    "response": "Caching stores frequently accessed data temporarily, reducing computation time and improving performance by avoiding repeated expensive operations."
  },
  "message": "Chat completion successful"
}
```

Server Log:
```
[INFO] [workflow-demo-789] Cache hit for chat request
[INFO] [workflow-demo-789] POST /api/ai/chat 200 - 3ms
```

### Step 5: Verify Cache Hit in Stats
```bash
curl http://localhost:3000/api/cache/stats
```

Response:
```json
{
  "success": true,
  "data": {
    "size": 1,
    "hits": 1,
    "misses": 1,
    "hitRate": 0.5
  },
  "message": "Cache statistics retrieved successfully"
}
```

---

## 📝 Additional Examples

### Sentiment Analysis (with Request ID)
```bash
curl -X POST http://localhost:3000/api/ai/sentiment \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: sentiment-request-001" \
  -d '{
    "text": "I absolutely love this product! It exceeded my expectations."
  }'
```

### Text Summarization (with Model Selection)
```bash
curl -X POST http://localhost:3000/api/ai/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Long article text here...",
    "maxLength": 100,
    "model": "gpt-4-turbo-preview"
  }'
```

### Health Check (with Request ID)
```bash
curl -H "X-Request-ID: health-check-001" http://localhost:3000/health
```

---

## 🚀 Testing with Different HTTP Clients

### Using HTTPie
```bash
# Cache stats
http GET localhost:3000/api/cache/stats

# AI chat with custom request ID
http POST localhost:3000/api/ai/chat \
  X-Request-ID:my-request-123 \
  messages:='[{"role":"user","content":"Hello"}]' \
  model=gpt-4
```

### Using Postman
1. **Cache Stats**:
   - Method: GET
   - URL: `http://localhost:3000/api/cache/stats`

2. **AI Chat with Model Selection**:
   - Method: POST
   - URL: `http://localhost:3000/api/ai/chat`
   - Headers: `Content-Type: application/json`, `X-Request-ID: postman-test-123`
   - Body (JSON):
     ```json
     {
       "messages": [{"role": "user", "content": "Hello"}],
       "model": "gpt-4"
     }
     ```

### Using JavaScript (fetch)
```javascript
// Cache stats
const stats = await fetch('http://localhost:3000/api/cache/stats')
  .then(res => res.json());
console.log('Cache hit rate:', stats.data.hitRate);

// AI chat with model selection and request ID
const chat = await fetch('http://localhost:3000/api/ai/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Request-ID': 'js-client-123'
  },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Hello' }],
    model: 'gpt-4'
  })
});

const response = await chat.json();
console.log('Request ID:', chat.headers.get('X-Request-ID'));
console.log('AI Response:', response.data.response);
```

---

## 🔧 Environment Configuration

### Required Environment Variables
```bash
# Optional: OpenAI API key for real AI responses
OPENAI_API_KEY=sk-your-key-here

# Optional: CORS origin (default: *)
CORS_ORIGIN=https://yourdomain.com

# Optional: Server port (default: 3000)
PORT=3000

# Optional: Node environment (default: development)
NODE_ENV=production
```

### Running with Environment Variables
```bash
# Using .env file
cp .env.example .env
# Edit .env with your values
npm run dev

# Using inline environment variables
OPENAI_API_KEY=sk-xxx npm run dev
```

---

## 📊 Performance Considerations

### Cache TTL
- Default: 5 minutes (300,000ms)
- Configurable in `src/services/cache.service.js`

### Request ID Overhead
- Negligible (<1ms per request)
- UUID generation is extremely fast

### Model Selection Impact
- Different models have different response times:
  - GPT-3.5 Turbo: ~500ms-1s
  - GPT-4: ~1-3s
  - GPT-4 Turbo: ~800ms-2s
- Cache dramatically reduces response time for repeated requests (~3ms)

---

## ❓ Troubleshooting

### Cache Not Populating
- **Issue**: Cache stats show size=0 even after requests
- **Solution**: Ensure using real OpenAI API (mock service doesn't cache)
- **Workaround**: Set `OPENAI_API_KEY` environment variable

### Request ID Not Appearing
- **Issue**: No X-Request-ID header in response
- **Solution**: Restart server to load middleware changes
- **Verify**: Check server logs for request ID middleware registration

### Invalid Model Error
- **Issue**: Model validation fails
- **Solution**: Use exact model name (case-sensitive):
  - ✅ `gpt-4`
  - ❌ `GPT-4`
  - ❌ `gpt4`

---

## 📚 Related Documentation
- [README.md](./README.md) - Project overview and setup
- [IMPLEMENTATION_NOTES.md](./IMPLEMENTATION_NOTES.md) - Technical implementation details
- [SUBMISSION_SUMMARY.md](./SUBMISSION_SUMMARY.md) - Assessment completion summary

---

**Last Updated**: 2025-11-14
**Assessment Version**: 1.0
**Author**: Backend Enhancement Assessment
