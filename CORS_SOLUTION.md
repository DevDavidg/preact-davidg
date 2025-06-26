# CORS Error Solution

## Problem

You're encountering a CORS error when trying to fetch data from `https://drfapiprojects.onrender.com/projectcards/` due to browser security restrictions.

## Solution Implemented

I've implemented multiple solutions to handle this CORS issue:

### 1. Vite Development Proxy ✅

Added proxy configuration in `vite.config.ts` that automatically routes `/api/proxy` requests to the external API during development.

### 2. Enhanced Server-Side Proxy ✅

Improved `api/proxy.ts` with:

- Better CORS headers
- Timeout handling (10 seconds)
- Proper error responses
- Support for OPTIONS preflight requests

### 3. Development Proxy Server ✅

Created `dev-proxy.js` as a standalone proxy server running on port 3001.

### 4. Smart Fallback Logic ✅

Updated the Projects component to:

- Try the primary proxy first
- Fall back to development proxy (localhost:3001) if primary fails
- Use static fallback data if all proxies fail

## How to Use

### Option 1: Standard Development (Recommended)

```bash
npm install
npm run dev
```

The Vite proxy will handle CORS automatically at `http://localhost:5173`.

### Option 2: With Standalone Proxy

```bash
npm install
npm run dev:with-proxy
```

This runs both the main dev server and the proxy server simultaneously.

### Option 3: Manual Proxy Server

```bash
# Terminal 1
npm run proxy

# Terminal 2
npm run dev
```

## Architecture

```
Browser → Vite Dev Server (localhost:5173)
         ↓
         /api/proxy → External API (drfapiprojects.onrender.com)
         ↓ (if fails)
         Proxy Server (localhost:3001) → External API
         ↓ (if fails)
         Static Fallback Data
```

## Testing the Solution

1. Start the development server: `npm run dev`
2. Open `http://localhost:5173`
3. Navigate to the Projects section
4. You should see data loaded without CORS errors

## Deployment Notes

- For production, ensure your hosting platform supports API routes or server-side proxies
- The `api/proxy.ts` file is designed to work with Vercel's serverless functions
- The CSP headers in `vercel.json` are already configured to allow the external API connection

## Troubleshooting

- If you still see CORS errors, try running `npm run dev:with-proxy`
- Check browser console for detailed error messages
- Ensure the external API (`https://drfapiprojects.onrender.com/projectcards/`) is accessible
- Verify that port 3001 is not being used by another service
