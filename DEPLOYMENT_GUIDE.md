# Deployment Guide for Vercel

## Migration Complete ✅

Your application has been successfully migrated from local filesystem storage to Supabase Storage. All file operations now use Supabase Storage buckets, making your app fully compatible with Vercel's serverless architecture.

## What Changed

### 1. **Storage Architecture**
- **Before**: Files saved to `public/uploads/` and `public/reviews/`
- **After**: Files stored in Supabase Storage buckets

### 2. **File Flow**
1. User uploads file → Saved to Supabase Storage `uploads` bucket
2. File converted to text → Saved to Supabase Storage `uploads` bucket
3. AI analyzes text → Review saved to Supabase Database
4. Text file automatically deleted from Storage after successful analysis
5. Original upload file deleted during conversion

### 3. **Modified Files**
- ✅ Created `/app/api/lib/storage.js` - Supabase Storage utilities
- ✅ Updated `/app/api/upload/route.js` - Upload to Storage
- ✅ Updated `/app/api/covert/route.js` - Read/write/delete from Storage
- ✅ Updated `/app/api/analyze/route.js` - Read from Storage, auto-cleanup
- ✅ Updated `/app/api/push-review/route.js` - Accepts review data directly
- ✅ Updated `/app/test/page.js` - Removed filesystem dependencies

### 4. **What Stayed the Same**
- ✅ `prompt.md` stays in codebase (works fine on Vercel)
- ✅ Frontend pages unchanged (page.js, viewall/page.js, review/[id]/page.js)
- ✅ Database structure unchanged

## Required Environment Variables

Create a `.env.local` file in the `descai` folder with:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Update to Vercel URL after deployment
```

## Supabase Storage Setup

### 1. **Verify Storage Buckets**
Go to Supabase Dashboard → Storage and ensure these buckets exist:
- ✅ `uploads` - For uploaded files and converted text
- ✅ `reviews` - (Optional, not currently used)
- ✅ `prompts` - (Optional, not currently used)

### 2. **Set Bucket Policies**
For the `uploads` bucket, configure RLS policies:

**Option A: Public Upload/Download (Simpler for testing)**
```sql
-- Allow authenticated API calls to upload
CREATE POLICY "Allow service role to upload"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'uploads');

-- Allow service role to download
CREATE POLICY "Allow service role to download"
ON storage.objects FOR SELECT
TO service_role
USING (bucket_id = 'uploads');

-- Allow service role to delete
CREATE POLICY "Allow service role to delete"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'uploads');
```

**Option B: More Restrictive (Production)**
- Adjust policies based on your security requirements
- Consider adding user authentication if needed

## Local Testing

1. **Install dependencies** (if not already done):
```bash
cd descai
npm install
```

2. **Set up environment variables**:
Create `.env.local` with the values above

3. **Run development server**:
```bash
npm run dev
```

4. **Test the workflow**:
   - Upload a file (should appear in Supabase Storage)
   - Convert file (should create .txt file in Storage, delete original)
   - Analyze file (should save review to database, delete .txt file)
   - Check Supabase Storage - should be empty after successful analysis

## Deploying to Vercel

### Step 1: Push to GitHub

```bash
cd descai
git add .
git commit -m "Migrate to Supabase Storage for Vercel compatibility"
git push origin main
```

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. **Important**: Set "Root Directory" to `descai`

### Step 3: Configure Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables, add:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon key | All |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key | All |
| `OPENAI_API_KEY` | Your OpenAI key | All |
| `NEXT_PUBLIC_APP_URL` | https://your-app.vercel.app | Production |

**Note**: For `NEXT_PUBLIC_APP_URL`, initially use a placeholder, then update it after your first deployment when you know the actual Vercel URL.

### Step 4: Deploy

1. Click "Deploy"
2. Wait for deployment to complete
3. Copy your Vercel URL (e.g., `https://your-app.vercel.app`)
4. Go back to Settings → Environment Variables
5. Update `NEXT_PUBLIC_APP_URL` with your actual Vercel URL
6. Redeploy: Deployments → click menu → "Redeploy"

## Verification Checklist

After deployment, test the following:

- [ ] Visit your Vercel URL - homepage loads correctly
- [ ] Upload a file - check Supabase Storage `uploads` bucket
- [ ] Convert file - original should be deleted, .txt should appear
- [ ] Analyze file - review appears in database
- [ ] Check Storage - .txt file should be deleted
- [ ] View all reviews page works
- [ ] Individual review pages load correctly
- [ ] Search functionality works

## Troubleshooting

### Files not uploading to Storage
- Check `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Verify Storage bucket policies allow service role access
- Check Supabase logs for errors

### Analysis fails
- Verify `OPENAI_API_KEY` is valid and has credits
- Check API logs in Vercel Dashboard
- Ensure `NEXT_PUBLIC_APP_URL` matches your actual URL

### Database insertion fails
- Review RLS policies on `reviews` table
- Check Supabase logs for policy violations
- Verify all required columns exist in database

## Storage Costs

With this architecture:
- **Supabase Storage**: Files are temporary and deleted after processing
- **Database**: Only review data is stored permanently
- **Expected storage usage**: ~50KB per review (database only)
- **Vercel**: No filesystem usage, stays within free tier limits

## Need Help?

- Supabase Docs: https://supabase.com/docs/guides/storage
- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs

---

**Migration completed successfully!** 🎉
Your app is now ready for Vercel deployment with zero filesystem dependencies.

