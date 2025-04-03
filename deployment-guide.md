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

### 2. Vercel Setup

1. Log in to Vercel and create a new project
2. Connect your GitHub repository (https://github.com/omkarjoshi9/pictagram)
3. Configure the following settings:
   - Framework Preset: `Other`
   - Build Command: `./vercel-build.sh`
   - Output Directory: `client/dist`
   - Install Command: `npm install`
   - Development Command: `npm run dev`

4. Add all the required environment variables listed above
5. Deploy the application

### 3. Vercel Configuration Files

The project includes the following Vercel-specific configuration files:

1. **vercel.json**: Defines build settings and API routes
   ```json
   {
     "buildCommand": "./vercel-build.sh",
     "outputDirectory": "client/dist",
     "installCommand": "npm install",
     "framework": null,
     "rewrites": [
       {
         "source": "/api/(.*)",
         "destination": "/api"
       },
       {
         "source": "/(.*)",
         "destination": "/"
       }
     ]
   }
   ```

2. **vercel-build.sh**: Custom build script for Vercel deployment
   ```bash
   # Builds the frontend for production and prepares the API for serverless functions
   npm run build
   ```

3. **tsconfig.vercel.json**: TypeScript configuration with less strict checking for Vercel
   - Used to bypass some TypeScript errors during deployment
   - Includes configuration for module resolution and type definitions

## Troubleshooting

### Common Issues

#### Database Connection Errors

- **Error: "relation 'users' does not exist"**
  - Solution: Run `npm run db:push` to create all required database tables
  - Verify that your DATABASE_URL and PostgreSQL credentials are correct

- **Error: "connection refused"**
  - Solution: Check if your database server allows connections from Vercel's IP ranges
  - Ensure your database is running and accessible from public networks

#### TypeScript Errors

- **Error: "TS2322: Type X is not assignable to type Y"**
  - Solution: The project includes `tsconfig.vercel.json` with less strict type checking
  - This is automatically used during deployment via vercel-build.sh

- **Error: "No index signature with a parameter of type 'string'"**
  - Solution: These errors are bypassed in production builds using tsconfig.vercel.json

#### WebSocket Connection Issues

- **Error: "WebSocket connection failed"**
  - Solution: Ensure WS_URL environment variable uses the `wss://` protocol, not `ws://`
  - Check that your VITE_WS_URL is correctly set for the frontend

- **Error: "Failed to create WebSocket connection: net::ERR_CONNECTION_REFUSED"**
  - Solution: Vercel serverless functions have limitations with WebSockets
  - Consider using a dedicated WebSocket service for production deployments

## Production Recommendations

1. **Database Performance**
   - Use connection pooling with your PostgreSQL database
   - Set up proper indexing for frequently queried columns

2. **Security**
   - Ensure SESSION_SECRET is sufficiently long and random
   - Set up proper CORS settings for production
   - Consider using a Web Application Firewall (WAF)

3. **Monitoring**
   - Set up error tracking with a service like Sentry
   - Configure application performance monitoring
   - Set up database query performance tracking

4. **Scaling**
   - For WebSocket scalability, consider services like Pusher or Socket.io Cloud
   - For high-traffic applications, consider adding a caching layer

## Rolling Back Deployments

If a deployment causes issues:
1. Go to your Vercel project dashboard
2. Navigate to the "Deployments" tab
3. Find a previous working deployment
4. Click the three dots menu and select "Promote to Production"

## Support

If you continue to face deployment issues, check:
- [Vercel documentation](https://vercel.com/docs)
- [PostgreSQL documentation](https://www.postgresql.org/docs/)
- [Neon Database documentation](https://neon.tech/docs/)
- [Drizzle ORM documentation](https://orm.drizzle.team/docs/overview)

For project-specific questions, refer to the README or open an issue on the GitHub repository.