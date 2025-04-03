# PICTagram Deployment Guide

This guide provides step-by-step instructions for deploying PICTagram to Vercel.

## Prerequisites

- A GitHub/GitLab repository with your code
- A PostgreSQL database (Neon DB recommended)
- Node.js 22+ installed locally

## Database Setup

1. Create a Neon Database account at neon.tech
2. Create a new PostgreSQL database project
3. Copy your connection string

## Testing Database Connection

To verify database connectivity before deployment:

1. Use the connection string to connect to your database
2. Run a simple test query:

```sql
CREATE TABLE IF NOT EXISTS connection_test (id SERIAL PRIMARY KEY, test_time TIMESTAMP DEFAULT NOW());
INSERT INTO connection_test (test_time) VALUES (NOW());
SELECT * FROM connection_test ORDER BY test_time DESC LIMIT 5;
```

If this succeeds, your database is properly configured.

## Vercel Deployment Steps

### 1. Prepare Your Repository

The project is already configured with:
- vercel.json - Build and routing configuration
- vercel-build.sh - Build steps
- server/vercel.ts - Entry point for Vercel
- server/vercel.package.json - Dependencies for serverless function

Run the preparation script:
```
./prepare-vercel-deploy.sh
```

This script:
- Confirms vercel-build.sh is executable
- Checks for required files
- Runs a test build

### 2. Connect to Vercel

1. Create an account on vercel.com
2. Import your GitHub/GitLab repository
3. Configure with default settings (build command is already in vercel.json)

### 3. Configure Environment Variables

Set these variables in Vercel project settings:

Required:
- DATABASE_URL: PostgreSQL connection string
- PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE: Database configuration
- NODE_ENV: Set to "production"

For WebSocket and client configuration:
- DEPLOYMENT_URL: Your Vercel URL 
- WS_URL: WebSocket URL
- PUBLIC_URL: Public URL
- VITE_API_URL: API URL
- VITE_WS_URL: WebSocket URL for client

Important: For Neon database, make sure your DATABASE_URL includes `?sslmode=require` if connecting from Vercel.

### 4. Deploy

Click "Deploy" and Vercel will build and deploy your application.

### 5. Verify Database Connection

After deployment:
1. Visit `/api/health` on your deployed application
2. This endpoint will show database connection status and errors
3. If no connection, check your environment variables

## WebSocket Limitations with Vercel

Vercel serverless functions have limitations for WebSocket connections:
- Limited execution time
- No persistent connections between invocations
- Cold starts can cause connection delays

For production with WebSocket requirements, consider:
1. Using a dedicated WebSocket service (Pusher, Socket.io Cloud)
2. Deploying a separate WebSocket server
3. Using an alternative platform with better WebSocket support

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL is correctly formatted 
- Check for proper SSL configuration (`?sslmode=require`)
- Ensure database server allows connections from Vercel
- Confirm database user has correct permissions
- Try connecting from another client to validate credentials

### API Errors
- Check `/api/health` endpoint for detailed diagnostic information
- Review Vercel Function logs for server-side errors
- Verify all environment variables are set correctly

### WebSocket Connection Failures
- Check environment variables related to websocket configuration
- Understand Vercel's limitations with persistent connections
- Consider alternative WebSocket solutions for production

### Build Failures
- Review Vercel build logs for detailed error messages
- Ensure the correct Node.js version (22.x) is specified
- Check that all dependencies can be installed during build

For more assistance, refer to Vercel's documentation.
