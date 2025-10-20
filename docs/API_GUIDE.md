# API Reference Guide

Complete documentation for all DeScAi API endpoints.

## Table of Contents
- [Upload API](#post-apiupload)
- [Convert API](#post-apicovert)
- [Analyze API](#post-apianalyze)
- [Push Review API](#apipush-review)
- [Reviews API](#apireviews)
- [Webhook API](#post-apiwebhook) (Base Mini App)
- [Error Handling](#error-handling)
- [Environment Variables](#environment-variables)

---

## POST `/api/upload`

Upload a document file to the server.

### Request

**Method**: `POST`  
**Content-Type**: `multipart/form-data`

**Body**:
```javascript
const formData = new FormData();
formData.append('file', fileObject);
```

**Accepted File Types**:
- `.pdf` - PDF documents
- `.txt` - Plain text files
- `.md` - Markdown files
- `.docx`, `.doc` - Microsoft Word documents
- `.odt` - OpenDocument text
- `.rtf` - Rich Text Format
- `.epub` - eBook format

### Response

**Success (200)**:
```json
{
  "success": true,
  "filename": "document.pdf",
  "size": 1024000
}
```

**Error (400/500)**:
```json
{
  "error": "Error message describing what went wrong"
}
```

### Example Usage

```javascript
const handleUpload = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });
  
  const result = await response.json();
  if (result.success) {
    console.log('Uploaded:', result.filename);
  }
};
```

### Notes
- Files are saved to `public/uploads/` directory
- Original filename is preserved
- Automatic directory creation if missing
- No file size limit currently enforced (add in production)

---

## POST `/api/covert`

Convert an uploaded document file to plaintext.

### Request

**Method**: `POST`  
**Content-Type**: `application/json`

**Body**:
```json
{
  "filename": "document.pdf"
}
```

### Response

**Success (200)**:
```json
{
  "success": true,
  "textFilename": "document.txt",
  "plaintext": "The extracted text content from the document...",
  "length": 15000
}
```

**Error (400/404/500)**:
```json
{
  "error": "File not found in uploads directory"
}
```

### Supported Conversions

| Format | Method | Library |
|--------|--------|---------|
| `.pdf` | Text extraction | pdf-parse |
| `.txt` | Direct read | fs/promises |
| `.md` | Direct read | fs/promises |
| `.docx` | Text extraction | mammoth |
| `.doc` | Not yet implemented | - |
| `.odt` | Not yet implemented | - |

### Example Usage

```javascript
const handleConvert = async (filename) => {
  const response = await fetch('/api/covert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename }),
  });
  
  const result = await response.json();
  if (result.success) {
    console.log('Converted text length:', result.length);
  }
};
```

### Notes
- Original file is deleted after successful conversion
- Converted text saved as `.txt` file with same base name
- UTF-8 encoding used for all text files
- Handles multi-page PDFs

---

## POST `/api/analyze`

Generate an AI-powered review using OpenAI GPT-4o-mini.

### Request

**Method**: `POST`  
**Content-Type**: `application/json`

**Body**:
```json
{
  "filename": "document.txt"
}
```

### Response

**Success (200)**:
```json
{
  "success": true,
  "reviewFilename": "document_review_2025-10-03T12-34-56-789Z.json",
  "analysis": {
    "title": "Paper Title Here",
    "originality_review": {
      "originality_score": 0.75,
      "rationale": "Detailed explanation...",
      "review_statement": "Summary statement...",
      "replication_caveats": "Limitations..."
    },
    "clarity_review": {
      "clarity_score": 0.80,
      "field_familiarity_score": 0.60,
      "rationale": "Detailed explanation...",
      "review_statement": "Summary statement..."
    },
    "rigor_reproducibility_review": {
      "rigor_score": 0.85,
      "reproducibility_score": 0.75,
      "rationale": "Detailed explanation...",
      "review_statement": "Summary statement...",
      "discipline_caveats": "Field-specific notes..."
    },
    "data_transparency_review": {
      "data_transparency_score": 0.70,
      "rationale": "Detailed explanation...",
      "review_statement": "Summary statement..."
    },
    "interpretation_ethics_review": {
      "interpretation_congruence_score": 0.80,
      "rationale": "Detailed explanation...",
      "review_statement": "Summary statement...",
      "conflict_of_interest": false
    }
  },
  "tokensUsed": 1234,
  "validation": {
    "passed": true,
    "warnings": [],
    "errors": []
  },
  "database": {
    "saved": true,
    "recordId": 42,
    "error": null
  }
}
```

**Validation Error (422)**:
```json
{
  "error": "Validation failed",
  "validation": {
    "passed": false,
    "errors": [
      "originality_score must be between 0 and 1"
    ],
    "warnings": [
      "field_familiarity_score is null"
    ]
  },
  "analysis": { /* the problematic data */ }
}
```

**Error (400/404/500)**:
```json
{
  "error": "Error message",
  "details": "Additional context"
}
```

### Score Validation Rules

All scores must be:
- Numeric (not null, undefined, or string)
- Between 0 and 1 (inclusive)
- Present in their respective sections

### Example Usage

```javascript
const handleAnalyze = async (filename) => {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename }),
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log('Review saved:', result.reviewFilename);
    console.log('Database ID:', result.database.recordId);
    console.log('Validation passed:', result.validation.passed);
  }
};
```

### Notes
- Processing time: ~15-30 seconds
- Uses OpenAI GPT-4o-mini model
- Review saved to `public/reviews/` with timestamp
- Automatically calls `/api/push-review` to save to database
- Database failure doesn't fail the entire request (graceful degradation)
- Requires `OPENAI_API_KEY` in environment variables

---

## `/api/push-review`

Handle database operations for review files.

### GET `/api/push-review`

List all available review files in the `public/reviews/` directory.

#### Request

**Method**: `GET`  
**No body required**

#### Response

**Success (200)**:
```json
{
  "success": true,
  "reviews": [
    "document1_review_2025-10-03T12-00-00-000Z.json",
    "document2_review_2025-10-03T13-00-00-000Z.json"
  ]
}
```

**Error (500)**:
```json
{
  "error": "Failed to read reviews directory"
}
```

---

### POST `/api/push-review`

Push a review file to the Supabase database.

#### Request

**Method**: `POST`  
**Content-Type**: `application/json`

**Body**:
```json
{
  "reviewFilename": "document_review_2025-10-03T12-34-56-789Z.json"
}
```

#### Response

**Success (200)**:
```json
{
  "success": true,
  "message": "Review successfully pushed to database",
  "recordId": 42,
  "paperId": "document",
  "title": "Paper Title Here"
}
```

**Error (400/404/500)**:
```json
{
  "error": "Failed to insert review into database",
  "message": "new row violates row-level security policy",
  "code": "42501",
  "hint": "Check your RLS policies or use service role key",
  "details": { /* Supabase error object */ }
}
```

#### Example Usage

```javascript
const handlePushReview = async (reviewFilename) => {
  const response = await fetch('/api/push-review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reviewFilename }),
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log('Pushed to DB with ID:', result.recordId);
  } else {
    console.error('Database error:', result.message);
  }
};
```

#### Notes
- Extracts paper ID from filename (e.g., `document` from `document_review_*.json`)
- Validates all scores before insertion
- Maps nested JSON to flat database schema
- Stores complete review objects as JSONB
- Extracts individual scores to numeric columns
- Requires Supabase credentials in environment variables

---

## `/api/reviews`

Retrieve reviews from the database.

### GET `/api/reviews`

List all reviews from the database.

#### Request

**Method**: `GET`  
**No body required**

#### Response

**Success (200)**:
```json
{
  "success": true,
  "reviews": [
    {
      "id": 42,
      "created_at": "2025-10-03T12:34:56.789Z",
      "paper_id": "document",
      "title": "Paper Title Here",
      "originality_score": 0.75,
      "clarity_score": 0.80,
      "rigor_score": 0.85,
      "reproducibility_score": 0.75,
      "data_transparency_score": 0.70,
      "interpretation_congruence_score": 0.80,
      "field_familiarity_score": 0.60
    }
  ]
}
```

---

### GET `/api/reviews/[id]`

Get a single review with full details.

#### Request

**Method**: `GET`  
**URL**: `/api/reviews/42` (replace 42 with review ID)

#### Response

**Success (200)**:
```json
{
  "success": true,
  "review": {
    "id": 42,
    "created_at": "2025-10-03T12:34:56.789Z",
    "paper_id": "document",
    "title": "Paper Title Here",
    "originality_review": {
      "originality_score": 0.75,
      "rationale": "...",
      "review_statement": "..."
    },
    "clarity_review": { /* ... */ },
    "rigor_reproducibility_review": { /* ... */ },
    "data_transparency_review": { /* ... */ },
    "interpretation_ethics_review": { /* ... */ },
    "originality_score": 0.75,
    "clarity_score": 0.80,
    // ... other scores
  }
}
```

**Error (400)**:
```json
{
  "error": "Invalid review ID"
}
```

**Error (404)**:
```json
{
  "error": "Review not found"
}
```

#### Notes
- Automatically parses JSONB fields from string to JSON
- Returns complete review data including all nested objects

---

## POST `/api/webhook`

Handle Base mini app events and webhooks (feature/base-miniapp branch only).

### Request

**Method**: `POST`  
**Content-Type**: `application/json`

**Body**:
```json
{
  "event": "user_action",
  "userId": "12345",
  "data": {
    // Event-specific data
  }
}
```

### Response

**Success (200)**:
```json
{
  "success": true
}
```

**Error (500)**:
```json
{
  "error": "Webhook processing failed"
}
```

### Example Usage

```javascript
// Base mini app will automatically call this webhook
// when events occur (user actions, notifications, etc.)

// Manual testing:
const handleTestWebhook = async () => {
  const response = await fetch('/api/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'test',
      timestamp: Date.now()
    }),
  });
  
  const result = await response.json();
  console.log('Webhook response:', result);
};
```

### Notes
- Only available in `feature/base-miniapp` branch
- Receives events from Base/Farcaster platform
- Currently logs events for debugging
- Can be extended for notifications, user tracking, etc.
- Webhook URL must be configured in manifest: `public/.well-known/farcaster.json`

---

## Error Handling

### Error Flow

```
Request
   ↓
Parse & Validate Input
   ↓ (if error) → 400 Bad Request
Check Required Environment Variables
   ↓ (if missing) → 500 Server Error
Validate File Exists
   ↓ (if missing) → 404 Not Found
Process Request
   ↓ (if error) → 500 Server Error
Validate Response Structure
   ↓ (if invalid) → 422 Unprocessable Entity
Return Success
```

### HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | Success | Request completed successfully |
| 400 | Bad Request | Missing required fields, invalid JSON |
| 404 | Not Found | File doesn't exist |
| 422 | Unprocessable Entity | Validation failed |
| 500 | Server Error | API key missing, OpenAI error, database error |

### Error Response Format

All errors follow this structure:
```json
{
  "error": "Short error message",
  "message": "Detailed explanation (optional)",
  "details": { /* Additional context (optional) */ }
}
```

---

## Environment Variables

### Required Variables

```bash
# OpenAI Configuration (for /api/analyze)
OPENAI_API_KEY=sk-your_key_here

# Supabase Configuration (for /api/push-review and /api/reviews)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# OR use anon key (requires RLS policies)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### Optional Variables

```bash
# Base URL for internal API calls (defaults to localhost:3000)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Where to Find Values

**OpenAI API Key:**
1. Go to [platform.openai.com](https://platform.openai.com)
2. Navigate to API keys
3. Create new secret key

**Supabase Credentials:**
1. Go to your Supabase project dashboard
2. Navigate to: **Settings → API**
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (recommended)
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY` (alternative)

---

## Testing APIs

### Test Upload
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@document.pdf"
```

### Test Convert
```bash
curl -X POST http://localhost:3000/api/covert \
  -H "Content-Type: application/json" \
  -d '{"filename":"document.pdf"}'
```

### Test Analyze
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"filename":"document.txt"}'
```

### Test Push Review
```bash
# List reviews
curl http://localhost:3000/api/push-review

# Push a review
curl -X POST http://localhost:3000/api/push-review \
  -H "Content-Type: application/json" \
  -d '{"reviewFilename":"document_review_2025-10-03T12-34-56-789Z.json"}'
```

### Test Get Review
```bash
# List all reviews
curl http://localhost:3000/api/reviews

# Get specific review
curl http://localhost:3000/api/reviews/42
```

---

## Rate Limits

### OpenAI API
- Model: gpt-4o-mini
- Default limits vary by account tier
- Check usage at [platform.openai.com](https://platform.openai.com)

### Supabase
- Free tier: 500 MB database, 2 GB bandwidth
- No rate limits on API calls in free tier

### Recommendations
- Implement caching for repeated analyses
- Add request queueing for bulk operations
- Monitor API usage regularly

---

## Internal API Communication

The `/api/analyze` route internally calls `/api/push-review` to save results to the database:

```javascript
// Inside /api/analyze
async function pushReviewToDatabase(reviewFilename) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  const response = await fetch(`${baseUrl}/api/push-review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reviewFilename }),
  });
  
  return await response.json();
}
```

This architecture provides:
- ✅ Separation of concerns
- ✅ Reusability (manual push uses same endpoint)
- ✅ Independent testing
- ✅ Graceful degradation (DB failures don't break analysis)

---

## Best Practices

1. **Always check response.success** before accessing data
2. **Handle all error cases** with user-friendly messages
3. **Validate input** before sending requests
4. **Set timeouts** for long-running operations (analyze can take 30s)
5. **Log errors** for debugging
6. **Use try-catch** for fetch calls
7. **Display validation warnings** to users
8. **Test database connection** with manual push first

---

**Last Updated**: October 2025  
**API Version**: 1.0  
**Status**: Production Ready

For database-specific information, see [DATABASE_GUIDE.md](./DATABASE_GUIDE.md)

