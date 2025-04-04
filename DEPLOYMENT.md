# PICTagram Deployment Guide

This document provides comprehensive instructions for deploying the PICTagram application on Vercel. Follow these steps to ensure a successful deployment with proper TypeScript configuration and database connectivity.

## Prerequisites

Before deploying to Vercel, ensure:

1. You have a [Vercel account](https://vercel.com/signup)
2. You have a [GitHub account](https://github.com/signup) with access to the repository
3. You have a PostgreSQL database (we recommend [Neon](https://neon.tech/) for serverless PostgreSQL)
4. You have MetaMask installed for wallet authentication testing

## Preparation Script

For a quick deployment preparation, you can run:

```bash
./prepare-vercel-deploy.sh
```

This script will:
1. Ensure vercel-build.sh is executable
2. Create a .env file from .env.example if needed
3. Validate the existence of required Vercel deployment files
4. Test the build process with the Vercel-specific TypeScript configuration

## Environment Variables

The following environment variables are required for the application to function properly:

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:password@host:port/database` |
| `PGHOST` | PostgreSQL host | `db.example.neon.tech` |
| `PGPORT` | PostgreSQL port | `5432` |
| `PGUSER` | PostgreSQL username | `databaseuser` |
| `PGPASSWORD` | PostgreSQL password | `your-password` |
| `PGDATABASE` | PostgreSQL database name | `pictagram` |
| `NODE_ENV` | Environment | `production` |
| `SESSION_SECRET` | Secret for session encryption | `your-secure-session-secret` |
| `DEPLOYMENT_URL` | URL of your deployment | `https://pictagram.vercel.app` |
| `WS_URL` | WebSocket URL | `wss://pictagram.vercel.app/ws` |

### Frontend Variables (Required)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | API URL for frontend | `https://pictagram.vercel.app/api` |
| `VITE_WS_URL` | WebSocket URL for frontend | `wss://pictagram.vercel.app/ws` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PUBLIC_URL` | Public URL if different from DEPLOYMENT_URL | Same as DEPLOYMENT_URL |
| `WS_PATH` | WebSocket endpoint path | `/ws` |
| `WS_COMPRESSION` | Enable WebSocket compression | `false` |
| `UPLOAD_DIR` | Directory for storing uploads | `uploads` |

## Deployment Steps

### 1. Database Setup

1. Create a PostgreSQL database on Neon or another provider
   - For Neon, follow their [quickstart guide](https://neon.tech/docs/get-started-with-neon/quickstart)
   - Create a database named `pictagram` (or your preferred name)
   - Get your connection string and credentials

2. Create database tables using the project's schema:
   ```bash
   # This will push the schema from shared/schema.ts to your database
   npm run db:push
   ```

## Troubleshooting

### Common Issues

#### Database Connection Errors

- Verify your `DATABASE_URL` is correct and accessible from Vercel
- Check if IP restrictions are preventing connections
- Verify database credentials are correct

**Error: "relation 'users' does not exist"**
- Run `npm run db:push` to create the database schema

#### Build Errors

- **TypeScript Errors**: Use the less strict `tsconfig.vercel.json` provided in the project
- **Module Not Found**: Check your import paths and ensure all dependencies are installed

#### Runtime Errors

- **Blank Screen**: Check browser console for JavaScript errors
- **API Errors**: Verify backend routes are properly defined in `server/routes.ts`
- **WebSocket Connection Failed**: Ensure WS_URL is properly set to a secure WebSocket URL (`wss://`)

## Production Recommendations

1. Set up proper logging with a service like Datadog or Sentry
2. Configure rate limiting to prevent abuse
3. Set up monitoring for the application
4. Consider using Vercel's serverless functions for cost optimization

## Rolling Back

If a deployment causes issues:
1. Go to your Vercel project dashboard
2. Navigate to the "Deployments" tab
3. Find a previous working deployment and click on the three dots menu
4. Select "Promote to Production"

## Support

If you continue to face deployment issues, check:
- [Vercel documentation](https://vercel.com/docs)
- [PostgreSQL documentation](https://www.postgresql.org/docs/)
- [Node.js documentation](https://nodejs.org/en/docs/)

For project-specific questions, refer to the README or open an issue on the GitHub repository.