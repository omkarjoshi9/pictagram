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

### 4. Deploy

Click "Deploy" and Vercel will build and deploy your application.

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

- Database connection issues: Verify DATABASE_URL is correct
- WebSocket connection failures: Check environment variables and platform support
- Build failures: Review Vercel build logs

For more assistance, refer to Vercel's documentation.
