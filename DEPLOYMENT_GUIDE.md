# Pictagram Deployment Guide

This guide provides detailed instructions for deploying Pictagram to Vercel. Follow these steps carefully to ensure a successful deployment.

## Prerequisites

1. A Vercel account
2. A GitHub account with the repository cloned
3. A Neon or other PostgreSQL database provisioned

## Required Environment Variables

Ensure the following environment variables are configured in your Vercel project:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Your PostgreSQL connection string |
| `PGHOST` | PostgreSQL host |
| `PGPORT` | PostgreSQL port |
| `PGUSER` | PostgreSQL username |
| `PGPASSWORD` | PostgreSQL password |
| `PGDATABASE` | PostgreSQL database name |
| `NODE_ENV` | Set to `production` for production deployment |
| `DEPLOYMENT_URL` | Your Vercel deployment URL (e.g., https://your-app.vercel.app) |
| `WS_URL` | WebSocket URL (same as DEPLOYMENT_URL but with wss:// protocol) |
| `PUBLIC_URL` | Same as DEPLOYMENT_URL |
| `SESSION_SECRET` | Random string for session encryption |
| `VITE_API_URL` | URL for API access (same as DEPLOYMENT_URL) |
| `VITE_WS_URL` | Same as WS_URL |
| `UPLOAD_DIR` | Directory for file uploads (usually `/tmp/uploads`) |

## Deployment Steps

### 1. Connect Repository to Vercel

1. Log in to your Vercel account
2. Click "Add New..." and select "Project"
3. Import your GitHub repository
4. Configure the project settings:
   - Framework Preset: Select "Other"
   - Build Command: `npm run vercel-build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### 2. Configure Environment Variables

1. On your project settings page, go to the "Environment Variables" tab
2. Add all the required environment variables listed above
3. Make sure to set `NODE_ENV` to `production`

### 3. Deploy

1. Click "Deploy" and wait for the build process to complete
2. Once deployed, Vercel will provide a deployment URL
3. Update `DEPLOYMENT_URL`, `WS_URL`, `PUBLIC_URL`, `VITE_API_URL`, and `VITE_WS_URL` with your actual deployment URL

### 4. Verify Deployment

1. Visit your deployment URL to verify the frontend is working
2. Try logging in with MetaMask to verify the authentication flow
3. Check WebSocket connections for real-time messaging functionality
4. Test image uploads to ensure file handling is working correctly

## Troubleshooting

### Database Connection Issues

If you encounter database connection issues:

1. Double-check all database environment variables
2. Ensure your database is accessible from Vercel's servers
3. Check the Vercel logs for any specific error messages

### WebSocket Connection Issues

If WebSocket connections are failing:

1. Verify your `WS_URL` and `VITE_WS_URL` are correct
2. Ensure they use the `wss://` protocol, not `ws://`
3. Check browser console logs for connection errors

### Image Upload Issues

If image uploads aren't working:

1. Verify the `UPLOAD_DIR` is set correctly
2. Check if Vercel allows writing to this directory
3. Consider using a cloud storage solution instead for production

## Vercel Configuration Specifics

Pictagram uses special scripts for Vercel deployment:

1. `vercel-build.sh`: Handles the build process
2. `prepare-vercel-deploy.sh`: Prepares the environment for deployment
3. `vercel-vite-patch.js`: Patches the Vite configuration for Vercel compatibility

These scripts automatically run during the deployment process and should not be modified.