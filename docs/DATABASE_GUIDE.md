# Database Integration Guide

Complete guide for Supabase database setup, schema, and troubleshooting.

## Table of Contents
- [Overview](#overview)
- [Quick Setup](#quick-setup)
- [Database Schema](#database-schema)
- [Data Flow](#data-flow)
- [Manual Push Feature](#manual-push-feature)
- [RLS Policies](#row-level-security-rls)
- [Troubleshooting](#troubleshooting)
- [Advanced Configuration](#advanced-configuration)

---

## Overview

DeScAi uses Supabase (PostgreSQL) for storing structured review data. The system employs a **dual storage** approach:

- **Local Files**: JSON reviews saved in `public/reviews/`
- **Database**: Structured data in Supabase with JSONB + numeric columns

### Architecture Benefits

```
┌──────────────────────────────────────────────────────┐
│  Two-API Architecture for Database Operations        │
├──────────────────────────────────────────────────────┤
│                                                       │
│  /api/analyze                /api/push-review        │
│  ├── AI generation          ├── File reading         │
│  ├── Validation             ├── Score validation     │
│  ├── File saving            ├── Schema mapping       │
│  └── Calls push-review  →   └── Supabase insertion   │
│                                                       │
└──────────────────────────────────────────────────────┘
```

**Benefits:**
- ✅ Separation of concerns (AI vs. database logic)
- ✅ Reusability (manual push, batch operations)
- ✅ Independent testing
- ✅ Graceful degradation (DB failures don't break AI)
- ✅ Error isolation (clear failure points)

---

## Quick Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project (free tier is fine)
3. Wait for database provisioning (~2 minutes)

### 2. Create Database Table

Go to **SQL Editor** in Supabase dashboard and run:

```sql
CREATE TABLE reviews (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paper_id TEXT NOT NULL,
  title TEXT NOT NULL,
  
  -- JSONB columns for complete review objects
  originality_review JSONB,
  clarity_review JSONB,
  rigor_reproducibility_review JSONB,
  data_transparency_review JSONB,
  interpretation_ethics_review JSONB,
  
  -- Extracted numeric scores for querying
  originality_score NUMERIC,
  clarity_score NUMERIC,
  rigor_score NUMERIC,
  reproducibility_score NUMERIC,
  data_transparency_score NUMERIC,
  interpretation_congruence_score NUMERIC,
  field_familiarity_score NUMERIC
);

-- Create index for faster paper_id lookups
CREATE INDEX idx_paper_id ON reviews(paper_id);

-- Create index for created_at (for sorting)
CREATE INDEX idx_created_at ON reviews(created_at DESC);
```

### 3. Configure Environment Variables

Create or update `.env.local` in the `descai` directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Where to find these:**
1. Supabase Dashboard → **Settings** → **API**
2. Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
3. Copy **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

### 4. Restart Development Server

```bash
# Environment variables only load on startup
npm run dev
```

### 5. Test Connection

1. Go to `http://localhost:3000`
2. Scroll to "Manual Database Push" section
3. Click "Load Existing Reviews"
4. Click "Push to DB" on any review
5. Check for success message

✅ If successful, your database is ready!

---

## Database Schema

### Table: `reviews`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | bigint | No | Auto-incrementing primary key |
| `created_at` | timestamp | No | Auto-generated timestamp |
| `paper_id` | text | No | Extracted from filename (e.g., "document") |
| `title` | text | No | Paper title from AI analysis |
| `originality_review` | jsonb | Yes | Complete originality section |
| `clarity_review` | jsonb | Yes | Complete clarity section |
| `rigor_reproducibility_review` | jsonb | Yes | Complete rigor/reproducibility section |
| `data_transparency_review` | jsonb | Yes | Complete data transparency section |
| `interpretation_ethics_review` | jsonb | Yes | Complete interpretation/ethics section |
| `originality_score` | numeric | Yes | Extracted score (0-1) |
| `clarity_score` | numeric | Yes | Extracted score (0-1) |
| `rigor_score` | numeric | Yes | Extracted score (0-1) |
| `reproducibility_score` | numeric | Yes | Extracted score (0-1) |
| `data_transparency_score` | numeric | Yes | Extracted score (0-1) |
| `interpretation_congruence_score` | numeric | Yes | Extracted score (0-1) |
| `field_familiarity_score` | numeric | Yes | Extracted score (0-1) |

### Schema Design Rationale

**JSONB Columns:**
- Store complete review objects with all details
- Preserve nested structure (rationale, review_statement, caveats)
- Flexible schema (no migration needed for new fields)
- Supports complex queries on nested data

**Numeric Score Columns:**
- Enable fast filtering (e.g., "find papers with originality > 0.8")
- Support sorting and aggregation
- Improve query performance vs. JSONB path queries
- Enable analytics and dashboards

### Data Mapping

How AI-generated JSON maps to database:

```javascript
// AI Response (from /api/analyze)
{
  "title": "Paper Title",
  "originality_review": {
    "originality_score": 0.75,
    "rationale": "Detailed explanation...",
    "review_statement": "Summary...",
    "replication_caveats": "Limitations..."
  },
  // ... other sections
}

// Database Record
{
  paper_id: "document",                    // Extracted from filename
  title: "Paper Title",                     // Direct mapping
  originality_review: { /* full object */ }, // JSONB storage
  originality_score: 0.75,                  // Extracted for querying
  // ... other fields
}
```

---

## Data Flow

### Automatic Flow (Upload → Database)

```
1. User uploads PDF/DOCX
         ↓
2. /api/upload
   - Save to /public/uploads/
         ↓
3. /api/covert
   - Convert to plaintext
   - Save as .txt file
         ↓
4. /api/analyze
   - Send text to OpenAI GPT-4o-mini
   - Validate AI response
   - Save review.json locally
         ↓
   - Call /api/push-review internally
         ↓
5. /api/push-review
   - Read review.json
   - Extract paper_id from filename
   - Validate scores (0-1 range)
   - Map to database schema
   - Insert into Supabase
         ↓
6. Return comprehensive response
   {
     analysis: { /* review data */ },
     validation: { passed: true },
     database: { saved: true, recordId: 42 }
   }
```

### Manual Push Flow (Testing/Recovery)

```
1. User clicks "Load Existing Reviews"
         ↓
2. GET /api/push-review
   - List all .json files in /public/reviews/
         ↓
3. User selects a review
         ↓
4. User clicks "Push to DB"
         ↓
5. POST /api/push-review
   - Read specified review.json
   - Extract paper_id from filename
   - Validate all scores
   - Map nested JSON to flat schema
   - Insert to Supabase
         ↓
6. Return result
   {
     success: true,
     recordId: 42,
     paperId: "document",
     title: "Paper Title"
   }
```

---

## Manual Push Feature

### Why Use Manual Push?

- **Test Database Connection**: Verify Supabase credentials independently
- **Troubleshoot RLS Issues**: Debug Row-Level Security policies
- **Recover from Failures**: Retry failed automatic pushes
- **Migrate Existing Data**: Push old reviews to database
- **Batch Operations**: Push multiple reviews without re-analyzing

### How to Use

1. **Load Reviews**
   - Click "Load Existing Reviews" button
   - System scans `public/reviews/` directory
   - Lists all `.json` review files

2. **Push to Database**
   - Find the review you want to push
   - Click "Push to DB" button
   - Confirm in dialog
   - Wait for result

3. **Check Results**
   - ✅ Success: Shows record ID and paper title
   - ❌ Error: Shows detailed error with hints

### API Endpoints

**GET `/api/push-review`**
```javascript
// Response
{
  "success": true,
  "reviews": [
    "doc1_review_2025-10-03T12-00-00-000Z.json",
    "doc2_review_2025-10-03T13-00-00-000Z.json"
  ]
}
```

**POST `/api/push-review`**
```javascript
// Request
{
  "reviewFilename": "doc1_review_2025-10-03T12-00-00-000Z.json"
}

// Success Response
{
  "success": true,
  "message": "Review successfully pushed to database",
  "recordId": 42,
  "paperId": "doc1",
  "title": "Paper Title"
}

// Error Response
{
  "error": "Failed to insert review",
  "message": "new row violates row-level security policy",
  "code": "42501",
  "hint": "Check your RLS policies or use service role key"
}
```

---

## Row-Level Security (RLS)

### Understanding RLS

Row-Level Security is a PostgreSQL feature that restricts which rows users can access. By default, Supabase enables RLS on all tables.

### Option 1: Use Service Role Key (Recommended)

The service role key **bypasses RLS** and has full access.

```bash
# .env.local
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Pros:**
- ✅ No RLS policies needed
- ✅ Full database access
- ✅ Simpler setup

**Cons:**
- ⚠️ Keep this key secret (never expose to frontend)
- ⚠️ Only use in backend API routes

### Option 2: Use Anon Key with RLS Policies

The anon key respects RLS policies.

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Required RLS Policy:**

```sql
-- Allow all inserts (development)
CREATE POLICY "Allow all inserts"
ON reviews
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow all selects (for reading reviews)
CREATE POLICY "Allow all selects"
ON reviews
FOR SELECT
TO anon, authenticated
USING (true);
```

**Pros:**
- ✅ More secure for production
- ✅ Fine-grained access control

**Cons:**
- ⚠️ Requires policy configuration
- ⚠️ More complex setup

### Option 3: Disable RLS (Development Only)

**⚠️ NOT RECOMMENDED FOR PRODUCTION**

```sql
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
```

This removes all access restrictions.

### Production Recommendations

For production deployments:

1. **Use service role key** in backend API routes only
2. **Use anon key** for frontend/client-side operations
3. **Enable RLS** with appropriate policies
4. **Create specific policies** for insert, select, update, delete
5. **Implement authentication** and user-based policies

---

## Troubleshooting

### Error: "RLS policy violation" (42501)

**Problem**: Anon key used without proper RLS policies.

**Solutions:**

1. **Use Service Role Key** (easiest)
```bash
# In .env.local
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

2. **Create RLS Policy**
```sql
CREATE POLICY "Allow inserts"
ON reviews FOR INSERT
TO anon, authenticated
WITH CHECK (true);
```

3. **Disable RLS** (dev only)
```sql
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
```

⚠️ **Important**: Restart dev server after changing `.env.local`!

---

### Error: "Supabase credentials not configured"

**Problem**: Missing environment variables.

**Solution:**
1. Check `.env.local` exists in `descai` directory
2. Verify these variables are set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` OR `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Restart dev server: `npm run dev`

---

### Error: "Review file not found"

**Problem**: File doesn't exist in `public/reviews/` directory.

**Solutions:**
1. Check filename spelling
2. Ensure file was generated by `/api/analyze`
3. Check file has `.json` extension
4. Verify path: `descai/public/reviews/filename.json`

---

### Error: "Invalid JSON in review file"

**Problem**: Review file is corrupted or malformed.

**Solutions:**
1. Open the file and check JSON syntax
2. Use a JSON validator (jsonlint.com)
3. Re-generate review with `/api/analyze`
4. Check for encoding issues (must be UTF-8)

---

### Database push fails but analysis succeeds

**Status**: This is expected behavior (graceful degradation).

**What happens:**
1. AI analysis completes successfully
2. Review saves to local file
3. Database push fails (logged as warning)
4. Response includes `database.saved: false`

**Solution:**
1. Fix database connection/credentials
2. Use manual push to retry
3. No need to re-run expensive AI analysis

---

### Reviews not appearing in UI

**Check:**
1. Supabase credentials are correct
2. RLS policies allow SELECT operations
3. Browser console for JavaScript errors
4. Network tab for failed API calls

**RLS Policy for SELECT:**
```sql
CREATE POLICY "Allow all selects"
ON reviews
FOR SELECT
TO anon, authenticated
USING (true);
```

---

### Scores showing "NaN%" or null

**Possible causes:**
1. Scores not numeric in database
2. Scores outside 0-1 range
3. JSONB fields stored as strings
4. Validation bypassed somehow

**Check:**
```sql
-- Check data types
SELECT 
  originality_score, 
  pg_typeof(originality_score) 
FROM reviews 
LIMIT 1;

-- Check for nulls
SELECT * FROM reviews 
WHERE originality_score IS NULL;
```

---

## Advanced Configuration

### Connection Pooling

For high-traffic applications, configure connection pooling:

```javascript
// In API routes
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    db: { pool: { max: 10 } }
  }
);
```

### Custom Validation Rules

Add custom validation in `/api/push-review/route.js`:

```javascript
function validateScore(score, fieldName) {
  if (score === null || score === undefined) {
    return { valid: false, error: `${fieldName} is required` };
  }
  if (typeof score !== 'number') {
    return { valid: false, error: `${fieldName} must be numeric` };
  }
  if (score < 0 || score > 1) {
    return { valid: false, error: `${fieldName} must be 0-1` };
  }
  return { valid: true };
}
```

### Batch Insertion

For pushing multiple reviews at once:

```javascript
// Example batch push (not implemented yet)
async function batchPushReviews(reviewFilenames) {
  const results = await Promise.all(
    reviewFilenames.map(filename => 
      pushReview(filename)
    )
  );
  return results;
}
```

### Database Backups

Supabase provides automatic backups:
- Free tier: Daily backups (7 days retention)
- Pro tier: Configurable backup schedule

**Manual backup:**
```bash
# Export to SQL
pg_dump -h db.your-project.supabase.co \
  -U postgres \
  -d postgres > backup.sql
```

### Query Optimization

Create additional indexes for common queries:

```sql
-- Index for score range queries
CREATE INDEX idx_originality_score 
ON reviews(originality_score DESC);

-- Composite index for filtering + sorting
CREATE INDEX idx_score_date 
ON reviews(originality_score DESC, created_at DESC);

-- Full-text search on title
CREATE INDEX idx_title_search 
ON reviews USING gin(to_tsvector('english', title));
```

### Monitoring

Enable Supabase monitoring:
1. Go to **Reports** in dashboard
2. Monitor:
   - Database size
   - API requests
   - Response times
   - Error rates

---

## Data Migration

### Migrating Existing Reviews

If you have reviews in `public/reviews/` before database setup:

1. **Use Manual Push UI**
   - Click "Load Existing Reviews"
   - Push each review individually
   - Verify success for each

2. **Write a Migration Script**
```javascript
// migrate-reviews.js
const fs = require('fs/promises');
const path = require('path');

async function migrateAll() {
  const reviewsDir = path.join(__dirname, 'public/reviews');
  const files = await fs.readdir(reviewsDir);
  
  for (const file of files) {
    if (file.endsWith('.json')) {
      console.log(`Migrating ${file}...`);
      
      const response = await fetch('http://localhost:3000/api/push-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewFilename: file }),
      });
      
      const result = await response.json();
      console.log(result.success ? '✅' : '❌', result);
    }
  }
}

migrateAll();
```

---

## Best Practices

### 1. Always Use Service Role Key in Backend
```javascript
// ✅ Good - backend API route
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // Backend only
);

// ❌ Bad - exposing service key to frontend
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // Never in client components!
);
```

### 2. Validate Before Inserting
```javascript
// Always validate scores and required fields
const validation = validateReviewStructure(reviewData);
if (!validation.passed) {
  return { error: 'Validation failed', ...validation };
}
```

### 3. Handle Errors Gracefully
```javascript
try {
  const { data, error } = await supabase
    .from('reviews')
    .insert(payload);
  
  if (error) {
    console.error('DB Error:', error);
    return { success: false, error: error.message };
  }
  
  return { success: true, data };
} catch (err) {
  console.error('Unexpected error:', err);
  return { success: false, error: 'Database operation failed' };
}
```

### 4. Use Indexes Wisely
- Index frequently queried columns
- Don't over-index (slows down inserts)
- Monitor query performance

### 5. Regular Backups
- Enable automatic backups in Supabase
- Test backup restoration process
- Keep recent backups of critical data

---

## Summary

### What You've Learned
- ✅ Database schema and design rationale
- ✅ Setting up Supabase integration
- ✅ Configuring RLS policies
- ✅ Using manual push for testing
- ✅ Troubleshooting common errors
- ✅ Best practices for production

### Quick Reference

**Environment Variables:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

**Test Connection:**
1. Manual push → Load reviews → Push to DB

**Fix RLS Error:**
1. Use service role key, OR
2. Create INSERT policy, OR
3. Disable RLS (dev only)

**Migrate Data:**
1. Use manual push UI for each file

---

**Last Updated**: October 2025  
**Database Version**: PostgreSQL 15 (Supabase)  
**Status**: Production Ready

For API documentation, see [API_GUIDE.md](./API_GUIDE.md)  
For general information, see [README.md](./README.md)

