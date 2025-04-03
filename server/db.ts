import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// For Vercel deployment, check if we're in production and handle database connection differently
const isProduction = process.env.NODE_ENV === 'production';

// Log database connection attempt for debugging
console.log(`Connecting to database in ${isProduction ? 'production' : 'development'} mode`);

// Check for DATABASE_URL environment variable
if (!process.env.DATABASE_URL) {
  // In production, log more information for troubleshooting
  if (isProduction) {
    console.error("DATABASE_URL environment variable is not set!");
    console.error("Available environment variables:", Object.keys(process.env)
      .filter(key => !key.includes("SECRET") && !key.includes("PASSWORD") && !key.includes("KEY"))
      .join(", "));
    
    // Don't throw in production, just log the error
    console.error("Continuing without database connection in production. Some features will not work.");
  } else {
    // In development, throw an error to fail fast
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }
}

// Create pool only if database URL is provided
export const pool: Pool | null = process.env.DATABASE_URL 
  ? new Pool({ 
      connectionString: process.env.DATABASE_URL,
      max: 20, // Maximum number of clients
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 5000, // Return an error after 5 seconds if connection couldn't be established
    })
  : null;

// Log pool errors to prevent app crashes if pool exists
if (pool) {
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    // Don't throw here, just log - prevents server from crashing on connection issues
  });
}

// Create and export the drizzle db instance if pool is available
export const db = pool 
  ? drizzle({ client: pool, schema }) 
  : null;

// Helper function to check database connection
export async function checkDatabaseConnection() {
  // If pool is not initialized, return not connected
  if (!pool) {
    return { 
      connected: false, 
      error: "Database pool not initialized - DATABASE_URL may be missing" 
    };
  }
  
  let client;
  try {
    client = await pool.connect();
    await client.query('SELECT NOW()');
    return { connected: true, error: null };
  } catch (error) {
    console.error('Database connection error:', error);
    return { 
      connected: false, 
      error: error instanceof Error ? error.message : 'Unknown database error' 
    };
  } finally {
    if (client) client.release();
  }
}
