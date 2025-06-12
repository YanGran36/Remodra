import { Request } from "express";

enum AuditEventType {
  AUTHENTICATION_SUCCESS = 'AUTHENTICATION_SUCCESS',
  AUTHENTICATION_FAILURE = 'AUTHENTICATION_FAILURE',
  AUTHORIZATION_FAILURE = 'AUTHORIZATION_FAILURE',
  DATA_ACCESS = 'DATA_ACCESS',
  DATA_MODIFICATION = 'DATA_MODIFICATION',
  DATA_DELETION = 'DATA_DELETION',
  RESOURCE_ACCESS_DENIED = 'RESOURCE_ACCESS_DENIED',
  CROSS_TENANT_ACCESS_ATTEMPT = 'CROSS_TENANT_ACCESS_ATTEMPT'
}

interface AuditEvent {
  timestamp: Date;
  eventType: AuditEventType;
  userId?: number;
  userEmail?: string;
  ipAddress?: string;
  resourceType?: string;
  resourceId?: number;
  action?: string;
  details?: any;
  success: boolean;
}

/**
 * Servicio para registro de auditoría de seguridad
 */
class AuditService {
  private events: AuditEvent[] = [];
  private MAX_EVENTS = 1000; // Número máximo de eventos en memoria

  /**
   * Registra un evento de auditoría
   */
  logEvent(event: Omit<AuditEvent, 'timestamp'>) {
    const fullEvent: AuditEvent = {
      timestamp: new Date(),
      ...event
    };

    // En un entorno de producción, aquí guardaríamos en base de datos
    // Por ahora, sólo guardamos en memoria con un límite
    this.events.push(fullEvent);
    
    // Si excedemos el máximo, eliminamos los más antiguos
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(this.events.length - this.MAX_EVENTS);
    }

    // Registramos en consola para debugging
    console.log(`[AUDIT] ${fullEvent.eventType}: ${JSON.stringify({
      ...fullEvent,
      timestamp: fullEvent.timestamp.toISOString()
    })}`);
  }

  /**
   * Registra un intento de acceso no autorizado entre inquilinos
   */
  logCrossTenantAccessAttempt(req: Request, resourceType: string, resourceId: number, details?: any) {
    if (!req.user) return;

    this.logEvent({
      eventType: AuditEventType.CROSS_TENANT_ACCESS_ATTEMPT,
      userId: req.user.id,
      userEmail: req.user.email,
      ipAddress: req.ip,
      resourceType,
      resourceId,
      action: req.method,
      details,
      success: false
    });
  }

  /**
   * Registra un acceso a datos
   */
  logDataAccess(req: Request, resourceType: string, resourceId: number, success: boolean = true) {
    if (!req.user) return;

    this.logEvent({
      eventType: AuditEventType.DATA_ACCESS,
      userId: req.user.id,
      userEmail: req.user.email,
      ipAddress: req.ip,
      resourceType,
      resourceId,
      action: req.method,
      success
    });
  }

  /**
   * Registra una modificación de datos
   */
  logDataModification(req: Request, resourceType: string, resourceId: number, details?: any, success: boolean = true) {
    if (!req.user) return;

    this.logEvent({
      eventType: AuditEventType.DATA_MODIFICATION,
      userId: req.user.id,
      userEmail: req.user.email,
      ipAddress: req.ip,
      resourceType,
      resourceId,
      action: req.method,
      details,
      success
    });
  }

  /**
   * Registra una eliminación de datos
   */
  logDataDeletion(req: Request, resourceType: string, resourceId: number, success: boolean = true) {
    if (!req.user) return;

    this.logEvent({
      eventType: AuditEventType.DATA_DELETION,
      userId: req.user.id,
      userEmail: req.user.email,
      ipAddress: req.ip,
      resourceType,
      resourceId,
      action: req.method,
      success
    });
  }

  /**
   * Obtiene los eventos de auditoría filtrados
   */
  getEvents(filters: {
    userId?: number;
    resourceType?: string;
    eventType?: AuditEventType;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  } = {}) {
    let filteredEvents = [...this.events];

    if (filters.userId !== undefined) {
      filteredEvents = filteredEvents.filter(e => e.userId === filters.userId);
    }

    if (filters.resourceType) {
      filteredEvents = filteredEvents.filter(e => e.resourceType === filters.resourceType);
    }

    if (filters.eventType) {
      filteredEvents = filteredEvents.filter(e => e.eventType === filters.eventType);
    }

    if (filters.startDate) {
      filteredEvents = filteredEvents.filter(e => e.timestamp >= filters.startDate!);
    }

    if (filters.endDate) {
      filteredEvents = filteredEvents.filter(e => e.timestamp <= filters.endDate!);
    }

    // Ordenar de más reciente a más antiguo
    filteredEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Limitar resultados si es necesario
    if (filters.limit) {
      filteredEvents = filteredEvents.slice(0, filters.limit);
    }

    return filteredEvents;
  }

  /**
   * Obtiene los intentos recientes de acceso no autorizado
   */
  getUnauthorizedAccessAttempts(limit: number = 100) {
    return this.getEvents({
      eventType: AuditEventType.CROSS_TENANT_ACCESS_ATTEMPT,
      limit
    });
  }
}

export const auditService = new AuditService();
export { AuditEventType };