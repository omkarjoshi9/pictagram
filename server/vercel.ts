import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { log } from "./vite";
import path from "path";
import fs from "fs";
import { checkDatabaseConnection } from "./db";

// Log all environment variables for debugging (without sensitive values)
console.log("Environment setup:");
Object.keys(process.env).forEach(key => {
  if (key.includes("DATABASE") || key.includes("PG")) {
    console.log(`${key}: [REDACTED VALUE]`);
  } else if (!key.includes("SECRET") && !key.includes("PASSWORD") && !key.includes("KEY")) {
    console.log(`${key}: ${process.env[key]}`);
  }
});

// Initialize Express application
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Setup health check route for Vercel
app.get("/api/health", async (req, res) => {
  try {
    const dbStatus = await checkDatabaseConnection();
    res.json({
      status: "ok",
      environment: process.env.NODE_ENV,
      database: dbStatus.connected ? "connected" : "disconnected",
      dbError: dbStatus.error,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Health check error:", error);
    res.status(500).json({
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    });
  }
});

// Serve static files from public directory
const publicDir = path.resolve(process.cwd(), "public");
app.use(express.static(publicDir));

// For Vercel deployment - serve static files from client dist folder
const clientDistPath = path.resolve(process.cwd(), "client/dist");
if (fs.existsSync(clientDistPath)) {
  console.log(`Serving static files from ${clientDistPath}`);
  app.use(express.static(clientDistPath));
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    // Enhanced error logging for debugging
    console.error("Server error:", {
      message: err.message,
      stack: err.stack,
      code: err.code,
      detail: err.detail, // PostgreSQL specific
      name: err.name,
      path: _req.path,
      method: _req.method,
      query: _req.query,
      body: _req.body ? JSON.stringify(_req.body).substring(0, 200) : null,
    });
    
    // Send detailed error in development, generic in production
    if (process.env.NODE_ENV === 'development') {
      res.status(status).json({ 
        message, 
        stack: err.stack,
        code: err.code,
        detail: err.detail,
        path: _req.path
      });
    } else {
      res.status(status).json({ message });
    }
  });

  // Fallback route for client-side routing
  app.use("*", (_req, res) => {
    const indexPath = path.resolve(clientDistPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Not Found");
    }
  });

  // Use PORT environment variable or fallback to 5000
  // this serves both the API and the client
  const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
  server.listen(port, "0.0.0.0", () => {
    log(`Server running at http://0.0.0.0:${port} in ${app.get('env')} mode`);
  });
})();

// Export for Vercel serverless functions
export default app;