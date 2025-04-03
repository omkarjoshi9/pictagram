# PICTagram

A blockchain-powered social media platform that reimagines digital interactions through seamless wallet authentication and real-time content sharing, focusing on user engagement and innovative social experiences.

## Features

- User authentication with MetaMask wallet
- Real-time messaging via WebSockets
- Image uploading and post creation
- Social interactions (likes, comments, bookmarks)
- User profiles with editable information
- Category-based content exploration
- Dark/light mode theme support

## Tech Stack

- Frontend: React with TypeScript
- Backend: Node.js with Express
- Database: PostgreSQL with Drizzle ORM
- Authentication: MetaMask wallet integration
- Real-time: WebSocket communication
- Styling: Tailwind CSS with shadcn/ui
- State Management: React Query

## Screenshots

![PICTagram Screenshot](attached_assets/image_1743703419150.png)

## Development

1. Clone the repository
2. Install dependencies with `npm install`
3. Set up environment variables by copying `.env.example` to `.env` and updating values
4. Start the development server with `npm run dev`
5. The application will be available at `http://localhost:5000`

## Deployment

### Environment Variables

The following environment variables must be configured for deployment:

#### Required
- **Database Configuration**
  - `DATABASE_URL`: PostgreSQL connection string
  - `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`: Individual database connection parameters

- **Server Configuration**
  - `PORT`: Server port (defaults to 5000)
  - `NODE_ENV`: Set to 'production' for production deployment

- **File Storage**
  - `UPLOAD_DIR`: Directory for user uploads (profile pictures, post images)

#### Optional
- **WebSocket Configuration**
  - `WS_PATH`: WebSocket endpoint path (defaults to '/ws')
  - `WS_COMPRESSION`: Enable WebSocket compression ('true' or 'false')
  - `WS_MAX_PAYLOAD`: Maximum message size in bytes
  - `WS_SKIP_UTF8_VALIDATION`: Skip UTF8 validation ('true' or 'false')

- **Performance and Security**
  - `CORS_ORIGIN`: Allowed CORS origin
  - `RATE_LIMIT_WINDOW_MS`: Rate limiting window in milliseconds
  - `RATE_LIMIT_MAX_REQUESTS`: Maximum requests per window

### Vercel Deployment

This application is configured for deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Configure the following environment variables in your Vercel project settings:
   - `DATABASE_URL`: Your PostgreSQL connection string (preferably using Neon Database)
   - `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`: Database configuration
   - `DEPLOYMENT_URL`: Your Vercel deployment URL (https://your-app-name.vercel.app)
   - `WS_URL`: WebSocket URL (wss://your-app-name.vercel.app/ws)
   - `PUBLIC_URL`: Your public URL (same as DEPLOYMENT_URL)
   - `VITE_API_URL`: API URL (https://your-app-name.vercel.app/api)
   - `VITE_WS_URL`: WebSocket URL for client (wss://your-app-name.vercel.app/ws)
3. Set the build command to `./vercel-build.sh` (this is already configured in vercel.json)
4. Deploy with the default settings

#### WebSocket Support on Vercel

For WebSocket functionality to work properly on Vercel:

1. Vercel Serverless Functions have limitations with long-running connections like WebSockets.
2. For production use, consider using a dedicated WebSocket service like Pusher, Socket.io Cloud, or similar.
3. To implement a WebSocket service with Vercel:
   - Set up a dedicated WebSocket server (e.g., on Heroku, Railway, Render, etc.)
   - Update your WebSocket URLs in environment variables to point to this service
   - Modify the client code to connect to this external WebSocket service

#### Alternative Deployment Options

For full WebSocket support, consider deployment platforms that support persistent connections:

1. Heroku (with appropriate dyno type)
2. Railway
3. Render
4. DigitalOcean App Platform
5. AWS Elastic Beanstalk

### Standard Deployment Steps

For deployment on platforms other than Vercel:

1. Install dependencies with `npm install`
2. Set environment variables (see above)
3. Build the application with `npm run build`
4. Start the production server with `npm start`

## License

MIT