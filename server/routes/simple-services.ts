import { Express } from 'express';
import { db } from '@db';
import { servicePricing } from '@shared/schema';
import { eq } from 'drizzle-orm';

export function registerSimpleServicesRoutes(app: Express) {
  // Middleware para verificar autenticación
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    next();
  };

  // Endpoint simple para obtener todos los servicios
  app.get('/api/pricing/services', isAuthenticated, async (req: any, res) => {
    try {
      console.log(`Fetching services for contractor ${req.user.id}`);
      
      const services = await db
        .select()
        .from(servicePricing)
        .where(eq(servicePricing.contractorId, req.user.id));
      
      console.log(`Found ${services.length} services:`, services);
      
      // Formatear para el frontend
      const formattedServices = services.map(service => ({
        id: service.id,
        name: service.name,
        serviceType: service.serviceType,
        unit: service.unit,
        laborRate: service.laborRate,
        laborMethod: service.laborCalculationMethod
      }));
      
      console.log('Sending formatted services:', formattedServices);
      res.json(formattedServices);
    } catch (error) {
      console.error('Error fetching services:', error);
      res.status(500).json({ message: 'Error fetching services' });
    }
  });
}