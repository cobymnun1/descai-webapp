# Base Mini App Integration Guide

Complete guide for deploying DeScAi as a Base/Farcaster mini app.

## Table of Contents
- [Overview](#overview)
- [What Changed](#what-changed)
- [Local Setup](#local-setup)
- [Deployment to Vercel](#deployment-to-vercel)
- [Base Registration](#base-registration)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Overview

The `feature/base-miniapp` branch transforms DeScAi into a **hybrid web/mini app** that works both as a standalone website and as a Base mini app within the Farcaster ecosystem.

### Key Features

- **Dual Mode**: Works as both traditional web app and Base mini app
- **Context Detection**: Automatically detects environment and adapts
- **SDK Integration**: Full Farcaster mini app SDK integration
- **Graceful Degradation**: Falls back to web mode if SDK unavailable
- **Webhook Support**: Receives events from Base platform

### Architecture

```
┌─────────────────────────────────────────────────┐
│              DeScAi Application                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  Web Browser         Farcaster Base App        │
│       │                      │                  │
│       └──────┬───────────────┘                  │
│              │                                   │
│       ┌──────▼──────┐                          │
│       │ MiniAppSDK  │ (Context Detection)      │
│       └──────┬──────┘                          │
│              │                                   │
│         App Loads                               │
│       (page.js with                             │
│        useMiniApp hook)                         │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## What Changed

### New Files Created

1. **`app/contexts/MiniAppContext.js`**
   - React context provider for Farcaster SDK
   - Handles SDK initialization
   - Provides context to entire app

2. **`app/api/webhook/route.js`**
   - Receives events from Base platform
   - Logs events for debugging
   - Extensible for notifications/tracking

3. **`public/.well-known/farcaster.json`**
   - Manifest file for Base registration
   - Contains app metadata, icons, webhooks
   - Required for mini app discovery

4. **`public/miniapp/`** (Image assets)
   - `icon.svg` - App icon (256x256)
   - `splash.svg` - Splash screen (1125x2436)
   - `hero.svg` - OG/social image (1200x630)
   - `screenshot1-3.svg` - App screenshots (1170x2532)

### Modified Files

1. **`app/layout.js`**
   - Wrapped with `MiniAppProvider`
   - Added Frame metadata tags
   - Updated title/description

2. **`app/page.js`**
   - Integrated `useMiniApp` hook
   - Added SDK loading state
   - Context-aware rendering

3. **`next.config.mjs`**
   - Added headers for manifest file
   - CORS configuration for `.well-known`

4. **`package.json`**
   - Added `@farcaster/miniapp-sdk` v0.2.1

---

## Local Setup

### Prerequisites

- Existing DeScAi installation (see main README.md)
- Node.js v18 or higher
- All environment variables configured

### Installation Steps

1. **Switch to Mini App Branch**
```bash
git checkout feature/base-miniapp
```

2. **Install Dependencies**
```bash
npm install
# This installs @farcaster/miniapp-sdk
```

3. **Start Development Server**
```bash
npm run dev
```

4. **Verify Setup**
- Visit `http://localhost:3000` - app should load normally
- Visit `http://localhost:3000/.well-known/farcaster.json` - should show manifest
- Check browser console for SDK initialization logs

### Expected Behavior

**In Web Browser:**
```
Console: "Running in web mode (not mini app): [error]"
```
This is normal! The SDK gracefully fails when not in a mini app context.

**App loads normally** and functions identically to main branch.

---

## Deployment to Vercel

### Step 1: Create Separate Deployment

Keep both versions by deploying mini app separately:

1. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com)
   - Click "Add New Project"

2. **Import Repository**
   - Select your GitHub repository
   - Click "Import"

3. **Configure Deployment**
   - **Branch**: Select `feature/base-miniapp`
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `.` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

4. **Environment Variables**

Add all your existing environment variables:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-your_openai_api_key_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Application URL (use placeholder initially)
NEXT_PUBLIC_APP_URL=https://placeholder.vercel.app
```

5. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete (~2-3 minutes)
   - Copy your deployment URL (e.g., `https://descai-miniapp.vercel.app`)

### Step 2: Update Manifest with Actual URL

Now that you have your deployment URL, update the manifest:

1. **Edit** `public/.well-known/farcaster.json`

2. **Replace all instances** of `https://your-domain-placeholder.vercel.app` with your actual Vercel URL

   Before:
   ```json
   "homeUrl": "https://your-domain-placeholder.vercel.app",
   ```

   After:
   ```json
   "homeUrl": "https://descai-miniapp.vercel.app",
   ```

   Update these fields:
   - `homeUrl`
   - `iconUrl`
   - `splashImageUrl`
   - `webhookUrl`
   - `screenshotUrls` (all 3)
   - `heroImageUrl`
   - `ogImageUrl`

3. **Update Environment Variable** `NEXT_PUBLIC_APP_URL` in Vercel:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Edit `NEXT_PUBLIC_APP_URL`
   - Change to your actual URL: `https://descai-miniapp.vercel.app`
   - Save

4. **Commit and Redeploy**
```bash
git add public/.well-known/farcaster.json
git commit -m "Update manifest with production URLs"
git push origin feature/base-miniapp
```

Vercel will automatically redeploy.

---

## Base Registration

### Step 1: Generate Account Association

1. **Go to Base Build Tool**
   - Visit [build.base.org](https://build.base.org) (if available)
   - Or use Farcaster's account association generator

2. **Enter Your App URL**
   ```
   https://descai-miniapp.vercel.app
   ```

3. **Connect Your Wallet/Account**
   - Sign with your Base account
   - Authorize the association

4. **Copy Generated Credentials**
   You'll receive three values:
   ```json
   {
     "header": "eyJmaWQiOjEsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHg1NDE5...",
     "payload": "eyJkb21haW4iOiJkZXNjYWktbWluaWFwcC52ZXJjZWwuYXBwIn0=",
     "signature": "MHhhNGIyYzNkNGU1ZjZhN2I4YzlkMGUxZjJhM2I0..."
   }
   ```

5. **Update Manifest**
   - Edit `public/.well-known/farcaster.json`
   - Replace the `accountAssociation` fields:
   ```json
   {
     "accountAssociation": {
       "header": "paste_header_here",
       "payload": "paste_payload_here",
       "signature": "paste_signature_here"
     },
     // rest of manifest...
   }
   ```

6. **Update Base Builder Address**
   - Also add your Base account address to `baseBuilder.allowedAddresses`:
   ```json
   {
     "baseBuilder": {
       "allowedAddresses": ["your_base_address_here"]
     },
     // rest of manifest...
   }
   ```

7. **Commit and Deploy**
```bash
git add public/.well-known/farcaster.json
git commit -m "Add Base account association credentials"
git push origin feature/base-miniapp
```

### Step 2: Update Production Settings

Before final publication:

1. **Change** `"noindex": true` to `"noindex": false` in manifest
2. **Verify** all URLs are correct
3. **Test** manifest validation

### Step 3: Submit to Base

1. **Preview Your App**
   - Use Base Build Preview tool
   - Enter your app URL
   - Verify:
     - Metadata displays correctly
     - Images load
     - Account association is valid
     - Launch button works

2. **Publish**
   - Create a post in the Base app with your URL
   - App will be indexed and discoverable
   - Monitor Base Build dashboard for approval status

---

## Testing

### Local Testing

**Test Web Mode:**
1. Visit `http://localhost:3000` in browser
2. Should work exactly like main branch
3. Check console for SDK initialization message

**Test Manifest:**
```bash
curl http://localhost:3000/.well-known/farcaster.json
```
Should return valid JSON with all fields.

**Test Webhook:**
```bash
curl -X POST http://localhost:3000/api/webhook \
  -H "Content-Type: application/json" \
  -d '{"event":"test","data":"hello"}'
```
Should return `{"success":true}`.

### Production Testing

**Test Deployment:**
1. Visit your Vercel URL
2. App should load and function normally
3. Upload and analyze a paper
4. Verify database integration works

**Test Manifest:**
```bash
curl https://your-app.vercel.app/.well-known/farcaster.json
```

**Validate Mini App:**
1. Go to Base Build Preview tool
2. Enter your app URL
3. Check validation results:
   - ✅ Manifest accessible
   - ✅ Account association valid
   - ✅ Images load correctly
   - ✅ Metadata complete

### Mini App Testing

**If you have access to Base/Farcaster mini app environment:**
1. Launch app from within Base
2. Verify SDK loads without errors
3. Check that context is properly detected
4. Test full workflow (upload → analyze → view)

---

## Troubleshooting

### Manifest Not Accessible

**Problem**: `/well-known/farcaster.json` returns 404

**Solutions:**
1. Verify file exists at `public/.well-known/farcaster.json`
2. Check `next.config.mjs` has headers configuration
3. Restart dev server
4. Clear Vercel cache and redeploy

### SDK Initialization Errors

**Problem**: Console shows SDK errors even in web mode

**Solution**: This is expected! The SDK gracefully fails when not in mini app context. App should still work normally.

### Images Not Loading

**Problem**: Icons/screenshots don't appear in preview

**Solutions:**
1. Verify images exist in `public/miniapp/`
2. Check URLs in manifest match deployment URL
3. Test image URLs directly in browser
4. Ensure images are accessible (not behind auth)

### Account Association Invalid

**Problem**: Base Build shows "Invalid account association"

**Solutions:**
1. Regenerate association using correct app URL
2. Verify all three fields (header, payload, signature) are filled
3. Check for typos or whitespace
4. Ensure domain in payload matches your actual domain

### Webhook Not Receiving Events

**Problem**: No events logged when testing

**Solutions:**
1. Verify webhook URL in manifest matches deployment
2. Check Vercel logs for incoming requests
3. Test webhook manually with curl
4. Ensure endpoint is publicly accessible

### App Works Locally But Not in Mini App

**Checklist:**
- ✅ Manifest accessible at `/well-known/farcaster.json`
- ✅ All URLs in manifest are correct
- ✅ Account association is valid
- ✅ Images are accessible
- ✅ Webhook URL is correct
- ✅ CORS headers configured
- ✅ App deployed to Vercel successfully

---

## Advanced Configuration

### Custom SDK Configuration

Modify `app/contexts/MiniAppContext.js` for custom behavior:

```javascript
useEffect(() => {
  const load = async () => {
    try {
      const ctx = await sdk.context;
      setContext(ctx);
      
      // Add custom initialization logic here
      if (ctx.user) {
        console.log('Mini app user:', ctx.user);
        // Track user, send analytics, etc.
      }
      
      sdk.actions.ready({ 
        // Custom ready options
      });
      
      setIsSDKLoaded(true);
    } catch (error) {
      console.log('Running in web mode:', error);
      setIsSDKLoaded(true);
    }
  };

  load();
}, []);
```

### Extended Webhook Handling

Add custom logic to `app/api/webhook/route.js`:

```javascript
export async function POST(request) {
  try {
    const body = await request.json();
    console.log('MiniApp webhook event:', body);
    
    // Handle specific events
    switch (body.event) {
      case 'user_action':
        // Process user action
        break;
      case 'notification':
        // Handle notification
        break;
      default:
        console.log('Unknown event:', body.event);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
```

### Analytics Integration

Track mini app vs web usage:

```javascript
// In MiniAppContext.js
useEffect(() => {
  const isMiniApp = !!context;
  
  // Send analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'app_environment', {
      environment: isMiniApp ? 'miniapp' : 'web',
      platform: context?.platform || 'unknown'
    });
  }
}, [context]);
```

---

## Maintenance

### Updating Image Assets

To replace placeholder SVGs with real images:

1. **Create images** matching specifications:
   - icon.png (256x256px)
   - splash.png (1125x2436px)
   - hero.png (1200x630px)
   - screenshot1-3.png (1170x2532px)

2. **Add to** `public/miniapp/`

3. **Update manifest** to use `.png` instead of `.svg`

4. **Commit and redeploy**

### Syncing with Main Branch

To keep mini app updated with main branch changes:

```bash
git checkout feature/base-miniapp
git merge main
# Resolve any conflicts
git push origin feature/base-miniapp
```

Vercel will automatically redeploy.

### Monitoring

**Check Vercel Logs:**
- Monitor for errors
- Track webhook events
- Check API performance

**Base Build Dashboard:**
- Monitor app status
- Check approval state
- View user engagement metrics

---

## Production Checklist

Before launching:

- [ ] All placeholder URLs replaced with production URL
- [ ] Account association generated and added to manifest
- [ ] `noindex` set to `false` in manifest
- [ ] All images loading correctly
- [ ] Webhook receiving events (if testable)
- [ ] Environment variables configured
- [ ] App tested in production
- [ ] Database integration verified
- [ ] Preview validated in Base Build tool
- [ ] Documentation updated
- [ ] Team notified of deployment

---

## Resources

### Documentation

- [Farcaster Mini App Docs](https://docs.farcaster.xyz/developers/miniapps)
- [Base Build Platform](https://build.base.org)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)

### Support

- DeScAi main documentation: [README.md](./README.md)
- API reference: [API_GUIDE.md](./API_GUIDE.md)
- Database guide: [DATABASE_GUIDE.md](./DATABASE_GUIDE.md)

---

**Version**: 0.1.0 (Mini App)  
**Branch**: feature/base-miniapp  
**Last Updated**: October 2025  
**Status**: Ready for Deployment

For questions or issues, consult the main DeScAi documentation or reach out to the development team.

