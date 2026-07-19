# Setup Cross-Device Sync

To enable syncing across devices, you need to add your GitHub token once:

## Steps

1. **Create a GitHub token:**
   - Go to https://github.com/settings/tokens/new
   - Description: `DSA Journey Sync`
   - Expiration: Choose your preference (1 year recommended)
   - Select scopes: **Only check "gist"** (for creating/updating gists)
   - Click "Generate token"
   - **Copy the token** (you won't see it again!)

2. **Add token to the code:**
   - Open `js/sync.js`
   - Line 9: Replace `'YOUR_GITHUB_TOKEN_HERE'` with your token
   - Example: `const SYNC_TOKEN = 'ghp_xxxxxxxxxxxxxxxxxxxx';`

3. **Commit and push:**
   ```bash
   git add js/sync.js
   git commit -m "Add sync token"
   git push origin main
   ```

4. **Wait for deployment** (~30 seconds for GitHub Pages to rebuild)

## How it works

- Each user is identified by their name only (no password)
- Each user gets their own gist file: `dsa-journey-{username}.json`
- All users' gists are stored in your GitHub account (you can see them at https://gist.github.com/)
- Users can't see each other's data
- Collision check prevents duplicate names

## Testing

1. Open site on browser 1, enter a name, mark a problem as solved
2. Open site on browser 2 (or phone), enter the **same name**
3. You should see the solved problem synced

## Security Note

- The token will be visible in the public repo
- It can only read/write gists (not your repos or other data)
- You can revoke it anytime from GitHub settings
- Gists are "secret" (not indexed) but anyone with the link can view them
- Only problem statuses and notes are stored (no sensitive data)
