import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { auditMiddleware } from "./middleware/audit-middleware";
import { sessionStabilityMiddleware, dbRetryMiddleware } from "./middleware/session-middleware";

// Database connection health monitoring
let dbHealthy = true;
const checkDatabaseHealth = async () => {
  try {
    const { db } = await import("@db");
    await db.execute("SELECT 1");
    if (!dbHealthy) {
      console.log("✓ Database connection restored");
      dbHealthy = true;
    }
    return true;
  } catch (error: any) {
    if (dbHealthy) {
      console.error("✗ Database connection failed:", error.message);
      dbHealthy = false;
    }
    return false;
  }
};

// Health check endpoint
const healthCheck = async (req: Request, res: Response) => {
  const isDbHealthy = await checkDatabaseHealth();
  res.status(isDbHealthy ? 200 : 503).json({
    status: isDbHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    database: isDbHealthy
  });
};

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Add health check endpoint
app.get('/api/health', healthCheck);

// Add stability and performance middleware
app.use(sessionStabilityMiddleware);
app.use(dbRetryMiddleware);
app.use(auditMiddleware);

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

  // Enhanced error handling with database monitoring
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log database connection issues
    if (err.message?.includes('connection') || err.code === 'ECONNREFUSED') {
      console.error(`Database connection error on ${req.path}:`, err.message);
      dbHealthy = false;
    }

    res.status(status).json({ message });
  });

  // Periodic database health monitoring
  setInterval(checkDatabaseHealth, 30000);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = process.env.PORT || 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
