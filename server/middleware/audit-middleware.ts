import { Request, Response, NextFunction } from "express";
import { auditService, AuditEventType } from "../services/audit-service";

/**
 * Middleware para auditar todas las peticiones y especialmente las que involucran
 * acceso a datos entre diferentes contratistas
 */
export const auditMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Guardamos una referencia al método original para interceptar después
  const originalSend = res.send;
  const originalJson = res.json;
  const originalStatus = res.status;
  
  let currentStatus = 200;

  // Sobrescribimos res.status para capturar el código
  res.status = function(code: number) {
    currentStatus = code;
    return originalStatus.apply(res, [code]);
  };

  // Sobrescribimos res.send
  res.send = function(body: any) {
    // Registrar eventos basados en el código de estado y la ruta
    logBasedOnRequestAndStatus(req, currentStatus, body);
    // Llamar al método original
    return originalSend.apply(res, [body]);
  };

  // Sobrescribimos res.json
  res.json = function(body: any) {
    // Registrar eventos basados en el código de estado y la ruta
    logBasedOnRequestAndStatus(req, currentStatus, body);
    // Llamar al método original
    return originalJson.apply(res, [body]);
  };

  // Continuamos con el siguiente middleware
  next();
};

/**
 * Registra eventos de auditoría basados en la petición y el código de estado
 */
function logBasedOnRequestAndStatus(req: Request, statusCode: number, responseBody: any) {
  const path = req.path;
  const method = req.method;
  
  // No auditamos rutas de recursos estáticos o healthchecks
  if (path.startsWith('/static') || path === '/health' || path === '/api/health') {
    return;
  }

  // Identificar el tipo de recurso y su ID si es posible
  const resourceInfo = extractResourceInfo(path);
  
  // Si no hay usuario, sólo registramos intentos de autenticación
  if (!req.user) {
    if (path === '/api/login' || path.includes('/auth')) {
      auditService.logEvent({
        eventType: statusCode >= 200 && statusCode < 300 ? 
          AuditEventType.AUTHENTICATION_SUCCESS : 
          AuditEventType.AUTHENTICATION_FAILURE,
        ipAddress: req.ip,
        action: method,
        details: { path },
        success: statusCode >= 200 && statusCode < 300
      });
    }
    return;
  }

  // Para rutas protegidas
  if (path.startsWith('/api/protected/')) {
    if (resourceInfo.resourceType && resourceInfo.resourceId) {
      // Determinar el tipo de operación basado en el método HTTP
      switch(method) {
        case 'GET':
          auditService.logDataAccess(
            req, 
            resourceInfo.resourceType, 
            resourceInfo.resourceId,
            statusCode >= 200 && statusCode < 300
          );
          break;
        case 'POST':
        case 'PATCH':
        case 'PUT':
          auditService.logDataModification(
            req, 
            resourceInfo.resourceType, 
            resourceInfo.resourceId,
            { body: req.body },
            statusCode >= 200 && statusCode < 300
          );
          break;
        case 'DELETE':
          auditService.logDataDeletion(
            req, 
            resourceInfo.resourceType, 
            resourceInfo.resourceId,
            statusCode >= 200 && statusCode < 300
          );
          break;
      }
    }
  }
  
  // Registrar intentos de acceso no autorizado
  if (statusCode === 403) {
    if (resourceInfo.resourceType && resourceInfo.resourceId) {
      auditService.logCrossTenantAccessAttempt(
        req,
        resourceInfo.resourceType,
        resourceInfo.resourceId,
        { path, responseBody }
      );
    }
  }
}

/**
 * Extrae información del recurso desde la URL
 */
function extractResourceInfo(path: string): { resourceType?: string; resourceId?: number } {
  // Patrones para extraer tipo de recurso e ID
  const protectedPattern = /\/api\/protected\/([a-z-]+)(?:\/(\d+))?/;
  const publicPattern = /\/api\/public\/([a-z-]+)\/(\d+)/;
  
  let matches = path.match(protectedPattern) || path.match(publicPattern);
  
  if (!matches) {
    return {};
  }
  
  const resourceType = matches[1]; // clients, projects, etc.
  const resourceId = matches[2] ? parseInt(matches[2], 10) : undefined;
  
  return { resourceType, resourceId };
}