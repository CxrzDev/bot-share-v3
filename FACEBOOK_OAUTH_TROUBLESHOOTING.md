# Facebook OAuth Troubleshooting Guide

## Overview
This guide helps debug and fix issues with the "Connect with Facebook" feature in Bot Share V3.

## Recent Fixes Applied

### 1. Enhanced Error Logging
- Added comprehensive console logging throughout the OAuth flow
- All logs are prefixed with `[FB_OAUTH]` for easy filtering
- Error details are now captured and logged for debugging

### 2. Improved Error Handling
- Added validation for Facebook API error responses
- Wrapped all operations in try-catch blocks
- Better error messages with context

### 3. Request Validation
- Validates environment variables before making API calls
- Checks for error parameters from Facebook
- Validates state token to prevent CSRF attacks

## Testing the Facebook OAuth Flow

### Step 1: Verify Environment Variables
Check that these variables are set in your `.env` or `.env.local`:

```bash
FACEBOOK_APP_ID="your_app_id"
FACEBOOK_APP_SECRET="your_app_secret"
NEXTAUTH_URL="http://localhost:3000"  # or your production URL
NEXTAUTH_SECRET="your_secret_key"
```

### Step 2: Verify Facebook App Configuration
1. Go to https://developers.facebook.com
2. Select your app
3. Go to **Facebook Login** → **Settings**
4. Verify **Valid OAuth Redirect URIs** includes:
   - `http://localhost:3000/api/connect/facebook/callback` (for local dev)
   - `https://your-domain.com/api/connect/facebook/callback` (for production)

### Step 3: Test the OAuth Flow
1. Start your development server: `npm run dev`
2. Log in to your application
3. Navigate to the Accounts page
4. Click "เพิ่มบัญชี" (Add Account)
5. Select "เชื่อมต่อด้วย OAuth" tab
6. Click "เชื่อมต่อกับ Facebook"
7. Monitor the console for `[FB_OAUTH]` logs

### Step 4: Check Server Logs
Look for these log messages in your terminal:

**Successful Flow:**
```
[FB_OAUTH] Initiating OAuth for user: <user_id>
[FB_OAUTH] OAuth configuration: { baseUrl, redirectUri, appId, userId }
[FB_OAUTH] Redirecting to Facebook OAuth dialog
[FB_OAUTH] Callback received { hasCode: true, hasState: true, error: null }
[FB_OAUTH] State validated for user: <user_id>
[FB_OAUTH] Exchanging code for token...
[FB_OAUTH] Token received, exchanging for long-lived token...
[FB_OAUTH] Using token (long-lived): true
[FB_OAUTH] Fetching user pages...
[FB_OAUTH] Pages found: <count>
[FB_OAUTH] User quota check: { currentAccounts, maxAllowed, pagesAvailable }
[FB_OAUTH] Creating new page: <page_name>
[FB_OAUTH] Successfully saved <count> new pages
```

**Error Flow:**
```
[FB_OAUTH_ERROR] <error_type> <error_details>
```

## Common Issues and Solutions

### Issue 1: "Redirect URI mismatch"
**Symptoms:** Facebook shows error about redirect URI
**Solution:**
1. Check that `NEXTAUTH_URL` matches your actual domain
2. Verify redirect URI in Facebook App Settings matches exactly
3. Ensure no trailing slashes in URLs

### Issue 2: "State mismatch" or "invalid_state"
**Symptoms:** Error after Facebook redirects back
**Solution:**
1. Check that `NEXTAUTH_SECRET` is set and consistent
2. Verify the state token hasn't expired (15-minute timeout)
3. Try the flow again - don't reuse old callback URLs

### Issue 3: "No access token in response"
**Symptoms:** `[FB_OAUTH_ERROR] fb_token Token exchange failed`
**Solution:**
1. Verify `FACEBOOK_APP_SECRET` is correct
2. Check Facebook app is not in Development Mode restrictions
3. Ensure your Facebook account has the necessary permissions

### Issue 4: "No Facebook Pages to manage"
**Symptoms:** `[FB_OAUTH_ERROR] no_pages`
**Solution:**
1. User must have at least one Facebook Page they manage
2. User must grant permissions during OAuth flow
3. Check that the app has requested correct scopes

### Issue 5: "Missing Facebook credentials in environment"
**Symptoms:** `[FB_OAUTH_ERROR] fb_config`
**Solution:**
1. Add `FACEBOOK_APP_ID` and `FACEBOOK_APP_SECRET` to `.env`
2. Restart the development server
3. Verify variables are loaded: `console.log(process.env.FACEBOOK_APP_ID)`

## Required Facebook Permissions

The app requests these permissions:
- `pages_manage_posts` - Post to Pages
- `pages_show_list` - List Pages user manages
- `publish_to_groups` - Post to Groups
- `pages_read_engagement` - Read Page engagement data

## Database Schema

Accounts are stored with these fields:
```typescript
{
  id: string
  userId: string
  platform: "FACEBOOK"
  accountName: string          // Page name
  token: string                // Page access token (long-lived)
  platformAccountId: string    // Facebook Page ID
  avatarUrl: string | null     // Page profile picture
  connectedViaOAuth: true      // Marks OAuth-connected accounts
  status: "ACTIVE"             // Account status
  lastChecked: DateTime        // Last validation time
}
```

## Debugging Tips

### Enable Verbose Logging
All Facebook OAuth operations log to console with `[FB_OAUTH]` prefix.
Filter logs in your terminal:
```bash
# In development
npm run dev | grep FB_OAUTH
```

### Check Network Requests
Use browser DevTools → Network tab to inspect:
1. Initial redirect to Facebook
2. Callback from Facebook with code
3. Token exchange requests to Graph API
4. Pages fetch request

### Verify Token Validity
Test the access token manually:
```bash
curl "https://graph.facebook.com/v18.0/me/accounts?access_token=YOUR_TOKEN&fields=id,name"
```

## Next Steps After Fixing

1. **Test with multiple users** - Ensure quota limits work correctly
2. **Test token refresh** - Verify long-lived tokens are properly stored
3. **Test error scenarios** - Cancel OAuth, deny permissions, etc.
4. **Monitor production logs** - Watch for any new error patterns

## Contact

If issues persist after following this guide, check:
- Facebook Developer Console for app status
- Database connectivity and schema
- Server logs for additional error context
