import { Request, Response, NextFunction } from 'express';

// Session stability middleware
export const sessionStabilityMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Add session timeout handling
  if (req.session) {
    const now = Date.now();
    const sessionAge = req.session.cookie.maxAge || 0;
    
    // Reset session if it's about to expire
    if (sessionAge > 0 && sessionAge < 60000) { // Less than 1 minute left
      req.session.touch();
    }
  }

  // Add connection stability headers
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=5, max=1000');
  
  next();
};

// Database connection retry middleware
export const dbRetryMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // If database error, add retry header
    if (res.statusCode >= 500 && typeof data === 'string' && data.includes('database')) {
      res.setHeader('Retry-After', '5');
    }
    return originalSend.call(this, data);
  };
  
  next();
};