# PICTagram Deployment Guide

This guide provides step-by-step instructions for deploying the PICTagram application to different platforms, with a focus on Vercel deployment.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Vercel Deployment](#vercel-deployment)
4. [WebSocket Considerations](#websocket-considerations)
5. [Alternative Deployment Options](#alternative-deployment-options)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

- A GitHub or GitLab repository with your PICTagram code
- A PostgreSQL database (Neon DB recommended for Vercel deployment)
- Node.js 18+ installed locally for testing

## Database Setup

### Neon Database (Recommended for Vercel)

1. Create an account at [Neon](https://neon.tech/)
2. Create a new PostgreSQL database project
3. Note your connection string in the format: `postgres://user:password@hostname:port/database`
4. Run database migrations with:
   ```
   npm run db:push
   ```

### Alternative: Railway PostgreSQL

1. Create an account at [Railway](https://railway.app/)
2. Start a new PostgreSQL instance
3. Note your connection details provided by Railway
4. Run database migrations with the same command as above

## Vercel Deployment

### Step 1: Prepare Your Repository

Ensure your repository contains the following files:
- `vercel.json` - Contains build and routing configuration
- `vercel-build.sh` - Contains build steps
- `server/vercel.ts` - Entry point for Vercel serverless functions
- `server/vercel.package.json` - Dependencies for the serverless function

### Step 2: Connect to Vercel

1. Create an account on [Vercel](https://vercel.com/)
2. Import your GitHub/GitLab repository
3. Configure the project:
   - Build Command: `./vercel-build.sh` (already specified in vercel.json)
   - Output Directory: Leave default
   - Framework Preset: None (custom setup)

### Step 3: Configure Environment Variables

Set the following environment variables in your Vercel project settings:

**Required:**
- `DATABASE_URL`: Your PostgreSQL connection string
- `PGHOST`: Database hostname
- `PGPORT`: Database port
- `PGUSER`: Database username
- `PGPASSWORD`: Database password
- `PGDATABASE`: Database name
- `NODE_ENV`: Set to `production`

**For WebSocket and Client Configuration:**
- `DEPLOYMENT_URL`: Your Vercel deployment URL (https://your-app-name.vercel.app)
- `WS_URL`: WebSocket URL (wss://your-app-name.vercel.app/ws)
- `PUBLIC_URL`: Your public URL (same as DEPLOYMENT_URL)
- `VITE_API_URL`: API URL (https://your-app-name.vercel.app/api)
- `VITE_WS_URL`: WebSocket URL for client (wss://your-app-name.vercel.app/ws)

### Step 4: Deploy

1. Click the "Deploy" button
2. Vercel will run the build process defined in `vercel-build.sh`
3. Once deployed, your app will be available at the provided Vercel URL

## WebSocket Considerations

### Limitations with Vercel

Vercel serverless functions have limitations for WebSocket connections:
- Limited execution time (10-60 seconds based on plan)
- No persistent connections between function invocations
- Cold starts can cause connection delays

### Solutions for Production

For a production deployment with WebSocket requirements, consider these options:

1. **External WebSocket Service:**
   - Use a dedicated service like [Pusher](https://pusher.com/) or [Socket.io Cloud](https://socket.io/cloud)
   - Update client code to connect to this service
   - Modify server code to use the service's API for sending messages

2. **Dedicated WebSocket Server:**
   - Deploy a separate WebSocket server on a platform that supports persistent connections
   - Update client code to connect to this server
   - Configure CORS appropriately

3. **Edge Functions:**
   - For simpler WebSocket needs, consider Vercel Edge Functions which may offer better support for WebSockets

## Alternative Deployment Options

For applications with intensive WebSocket requirements, consider these platforms:

### Heroku

1. Add a `Procfile` with: `web: npm start`
2. Configure PostgreSQL add-on
3. Deploy with Heroku CLI or GitHub integration

### Railway

1. Connect your repository
2. Add PostgreSQL service
3. Configure environment variables
4. Railway auto-detects Node.js and deploys accordingly

### Render

1. Create a Web Service
2. Connect your repository
3. Add PostgreSQL database
4. Configure environment variables
5. Set build command to `npm install && npm run build`
6. Set start command to `npm start`

## Troubleshooting

### Database Connection Issues

- Verify your `DATABASE_URL` and individual PostgreSQL environment variables
- Check that your database allows connections from the deployment platform
- For Neon Database, ensure you've enabled the "Pooled connection" option

### WebSocket Connection Failures

- Confirm `WS_URL` and `VITE_WS_URL` are correctly set
- Check browser console for connection errors
- Verify your deployment platform's WebSocket support
- Consider using the external WebSocket service approach

### Build Failures

- Review Vercel build logs for specific errors
- Ensure all dependencies are properly listed in package.json
- Check that your Node.js version is compatible (18+ recommended)

### Static Assets Not Loading

- Verify the routes in vercel.json are correctly configured
- Check that assets are properly built and included in the build output
- Look for CORS issues in browser console

For further assistance, refer to Vercel's documentation or contact platform support.