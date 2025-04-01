import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Connection pool with additional settings for better reliability
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of clients
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 5000, // Return an error after 5 seconds if connection couldn't be established
});

// Log pool errors to prevent app crashes
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  // Don't throw here, just log - prevents server from crashing on connection issues
});

// Create and export the drizzle db instance
export const db = drizzle({ client: pool, schema });

// Helper function to check database connection
export async function checkDatabaseConnection() {
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
