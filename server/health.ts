import { Request, Response } from 'express';
import { checkDatabaseConnection, pool } from './db';

/**
 * Checks if database tables exist
 * Returns an object with table names as keys and boolean values indicating existence
 */
async function checkDatabaseTables(): Promise<{
  connected: boolean;
  tables: Record<string, boolean>;
  missingTables: string[];
  error: string | null;
}> {
  if (!pool) {
    return { 
      connected: false, 
      tables: {}, 
      missingTables: [],
      error: "Database pool not initialized" 
    };
  }

  const requiredTables = [
    'users', 'posts', 'comments', 'categories', 'post_categories', 
    'conversations', 'conversation_participants', 'messages',
    'post_likes', 'bookmarks'
  ];
  
  const tableStatus: Record<string, boolean> = {};
  let client;
  
  try {
    client = await pool.connect();
    
    // Check each table
    for (const table of requiredTables) {
      try {
        const result = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          );
        `, [table]);
        
        tableStatus[table] = result.rows[0].exists;
      } catch (err) {
        console.error(`Error checking table ${table}:`, err);
        tableStatus[table] = false;
      }
    }
    
    return { 
      connected: true, 
      tables: tableStatus,
      missingTables: Object.entries(tableStatus)
        .filter(([_, exists]) => !exists)
        .map(([name]) => name),
      error: null
    };
  } catch (error) {
    console.error('Error checking database tables:', error);
    return { 
      connected: false, 
      tables: {},
      missingTables: requiredTables,
      error: error instanceof Error ? error.message : 'Unknown database error' 
    };
  } finally {
    if (client) client.release();
  }
}

/**
 * Health check endpoint handler 
 * Used to verify the application status, particularly database connectivity and schema
 */
export async function healthCheckHandler(req: Request, res: Response) {
  try {
    // Check database connection
    const dbStatus = await checkDatabaseConnection();
    
    // If connected, check tables
    let tableStatus: { 
      connected?: boolean; 
      tables: Record<string, boolean>;
      missingTables: string[];
      error?: string | null;
    } = { 
      tables: {}, 
      missingTables: [] 
    };
    
    if (dbStatus.connected) {
      tableStatus = await checkDatabaseTables();
    }
    
    // Get environment info (excluding sensitive values)
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      hasDbUrl: !!process.env.DATABASE_URL,
      hasPgHost: !!process.env.PGHOST,
      hasPgPort: !!process.env.PGPORT,
      hasPgUser: !!process.env.PGUSER,
      hasPgDb: !!process.env.PGDATABASE,
      hasWsUrl: !!process.env.WS_URL,
      hasDeploymentUrl: !!process.env.DEPLOYMENT_URL,
      hasPublicUrl: !!process.env.PUBLIC_URL,
      // Add other non-sensitive environment checks as needed
    };

    // Send detailed health status response
    res.json({
      status: dbStatus.connected && tableStatus.missingTables.length === 0 ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'not set',
      version: process.env.npm_package_version || 'unknown',
      deployment: {
        url: process.env.DEPLOYMENT_URL || 'not set',
        wsUrl: process.env.WS_URL || 'not set'
      },
      database: {
        connected: dbStatus.connected,
        error: dbStatus.error || null,
        tables: tableStatus.tables,
        missingTables: tableStatus.missingTables,
        schemaValid: tableStatus.missingTables.length === 0
      },
      environment_variables: envInfo,
      recommendations: generateRecommendations(dbStatus, tableStatus, envInfo)
    });
  } 
  catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error during health check'
    });
  }
}

/**
 * Generates troubleshooting recommendations based on health check results
 */
function generateRecommendations(
  dbStatus: { connected: boolean; error: string | null },
  tableStatus: { missingTables: string[] },
  envInfo: Record<string, any> // Changed from Record<string, boolean> to allow for string values
): string[] {
  const recommendations: string[] = [];
  
  // Database connection issues
  if (!dbStatus.connected) {
    recommendations.push("Database connection failed. Check your DATABASE_URL and PostgreSQL credentials.");
    recommendations.push("Ensure your database is running and accessible from your deployment environment.");
    
    if (dbStatus.error?.includes('ENOTFOUND') || dbStatus.error?.includes('ETIMEDOUT')) {
      recommendations.push("Database host not found. Verify the hostname in your connection string.");
    }
    
    if (dbStatus.error?.includes('password authentication failed')) {
      recommendations.push("Database authentication failed. Check your PostgreSQL username and password.");
    }
  }
  
  // Missing tables
  if (tableStatus.missingTables.length > 0) {
    recommendations.push(`Database tables missing: ${tableStatus.missingTables.join(', ')}`);
    recommendations.push("Run 'npm run db:push' to create missing database tables.");
  }
  
  // Environment variables
  const missingEnvVars = Object.entries(envInfo)
    .filter(([_, exists]) => !exists)
    .map(([name]) => name);
  
  if (missingEnvVars.length > 0) {
    recommendations.push(`Missing environment variables: ${missingEnvVars.join(', ')}`);
    recommendations.push("Set all required environment variables in your deployment platform.");
  }
  
  // WebSocket specific recommendations
  if (!envInfo.hasWsUrl && envInfo.hasDeploymentUrl) {
    recommendations.push("WS_URL not set. Set it to 'wss://' + your deployment URL + '/ws'");
  }
  
  // If all looks good
  if (dbStatus.connected && tableStatus.missingTables.length === 0 && missingEnvVars.length === 0) {
    recommendations.push("All systems operational. No issues detected.");
  }
  
  return recommendations;
}