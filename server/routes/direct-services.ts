import { Express } from 'express';
import { db, pool } from '../../db';
import { servicePricing } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

export function registerDirectServicesRoutes(app: Express) {
  console.log('[DIRECT-SERVICES] Registering direct services routes...');
  // Simple endpoint to get services directly from database
  app.get('/api/direct/services', async (req: any, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      console.log(`[DIRECT] Fetching services for contractor ID: ${req.user.id}`);
      
      const services = await db
        .select({
          id: servicePricing.id,
          name: servicePricing.name,
          serviceType: servicePricing.serviceType,
          unit: servicePricing.unit,
          laborRate: servicePricing.laborRate,
          laborMethod: servicePricing.laborCalculationMethod
        })
        .from(servicePricing)
        .where(eq(servicePricing.contractorId, req.user.id));
      
      console.log(`[DIRECT] Found ${services.length} services:`, services);
      
      res.json(services);
    } catch (error) {
      console.error('[DIRECT] Error fetching services:', error);
      res.status(500).json({ message: 'Error fetching services' });
    }
  });

  // Simple endpoint to create a new service
  app.post('/api/direct/services', async (req: any, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      console.log(`[DIRECT] Creating service for contractor ${req.user.id}:`, req.body);
      
      const serviceData = {
        name: req.body.name || 'New Service',
        serviceType: req.body.serviceType || 'general',
        unit: req.body.unit || 'unit',
        laborRate: (req.body.laborRate || 0).toString(), // Convert to string for database
        laborCalculationMethod: req.body.laborMethod || 'by_area',
        contractorId: req.user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const [newService] = await db
        .insert(servicePricing)
        .values(serviceData)
        .returning();
      
      console.log(`[DIRECT] Created service:`, newService);
      
      // Return in format expected by frontend
      const formattedService = {
        id: newService.id,
        name: newService.name,
        serviceType: newService.serviceType,
        unit: newService.unit,
        laborRate: parseFloat(newService.laborRate),
        laborMethod: newService.laborCalculationMethod
      };
      
      res.status(201).json(formattedService);
    } catch (error) {
      console.error('[DIRECT] Error creating service:', error);
      res.status(500).json({ message: 'Error creating service' });
    }
  });

  // Simple endpoint to update a service (using unique path to avoid conflicts)
  console.log('[DIRECT-SERVICES] Registering PUT /api/services/update/:serviceType');
  app.put('/api/services/update/:serviceType', async (req: any, res) => {
    console.log(`[DIRECT] PUT request received for serviceType: ${req.params.serviceType}`);
    console.log(`[DIRECT] Request body received:`, req.body);
    
    try {
      if (!req.isAuthenticated()) {
        console.log(`[DIRECT] User not authenticated`);
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const { serviceType } = req.params;
      console.log(`[DIRECT] Updating service ${serviceType} for contractor ${req.user.id}`);
      console.log(`[DIRECT] Request body:`, req.body);
      
      const updateData = {
        name: req.body.name || 'Updated Service',
        serviceType: req.body.serviceType || serviceType,
        unit: req.body.unit || 'unit',
        laborRate: (req.body.laborRate || 0).toString(),
        laborCalculationMethod: req.body.laborMethod || 'by_area',
        updatedAt: new Date()
      };
      
      const [updatedService] = await db
        .update(servicePricing)
        .set(updateData)
        .where(and(
          eq(servicePricing.serviceType, serviceType),
          eq(servicePricing.contractorId, req.user.id)
        ))
        .returning();
      
      if (!updatedService) {
        return res.status(404).json({ message: 'Service not found' });
      }
      
      console.log(`[DIRECT] Service updated:`, updatedService);
      
      // Return in format expected by frontend
      const formattedService = {
        id: updatedService.id,
        name: updatedService.name,
        serviceType: updatedService.serviceType,
        unit: updatedService.unit,
        laborRate: parseFloat(updatedService.laborRate),
        laborMethod: updatedService.laborCalculationMethod
      };
      
      res.json(formattedService);
    } catch (error) {
      console.error('[DIRECT] Error updating service:', error);
      res.status(500).json({ message: 'Error updating service' });
    }
  });

  // Simple endpoint to update service via POST (avoiding PUT conflicts)
  app.post('/api/direct/services/update', async (req: any, res) => {
    console.log('[DIRECT] Update service POST request received');
    console.log('[DIRECT] Request body:', req.body);
    
    try {
      if (!req.isAuthenticated()) {
        console.log('[DIRECT] User not authenticated');
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const { originalServiceType, name, serviceType, unit, laborRate, laborMethod } = req.body;
      console.log(`[DIRECT] Updating service ${originalServiceType} for contractor ${req.user.id}`);
      
      const updateData = {
        name: name || 'Updated Service',
        serviceType: serviceType || originalServiceType,
        unit: unit || 'unit',
        laborRate: (laborRate || 0).toString(),
        laborCalculationMethod: laborMethod || 'by_area',
        updatedAt: new Date()
      };
      
      console.log('[DIRECT] Update data:', updateData);
      
      const [updatedService] = await db
        .update(servicePricing)
        .set(updateData)
        .where(and(
          eq(servicePricing.serviceType, originalServiceType || serviceType),
          eq(servicePricing.contractorId, req.user.id)
        ))
        .returning();
      
      if (!updatedService) {
        console.log('[DIRECT] Service not found');
        return res.status(404).json({ message: 'Service not found' });
      }
      
      console.log('[DIRECT] Service updated successfully:', updatedService);
      
      res.json({
        id: updatedService.id,
        name: updatedService.name,
        serviceType: updatedService.serviceType,
        unit: updatedService.unit,
        laborRate: parseFloat(updatedService.laborRate),
        laborMethod: updatedService.laborCalculationMethod
      });
    } catch (error) {
      console.error('[DIRECT] Error updating service:', error);
      res.status(500).json({ message: 'Error updating service' });
    }
  });

  // Simple endpoint to update only the price of a service
  app.patch('/api/direct/services/:serviceType/price', async (req: any, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const { serviceType } = req.params;
      const { laborRate } = req.body;
      
      console.log(`[DIRECT-PRICE] Updating ${serviceType} price to ${laborRate} for contractor ${req.user.id}`);
      
      const [updatedService] = await db
        .update(servicePricing)
        .set({ 
          laborRate: laborRate.toString(),
          updatedAt: new Date()
        })
        .where(and(
          eq(servicePricing.serviceType, serviceType),
          eq(servicePricing.contractorId, req.user.id)
        ))
        .returning();
      
      if (!updatedService) {
        return res.status(404).json({ message: 'Service not found' });
      }
      
      console.log(`[DIRECT-PRICE] Price updated successfully`);
      
      res.json({
        id: updatedService.id,
        serviceType: updatedService.serviceType,
        laborRate: parseFloat(updatedService.laborRate)
      });
    } catch (error) {
      console.error('[DIRECT-PRICE] Error updating price:', error);
      res.status(500).json({ message: 'Error updating price' });
    }
  });

  // Update service price using the same database query pattern that works for CREATE
  app.patch('/api/direct/services/:serviceType/edit', async (req: any, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const { serviceType } = req.params;
      const { laborRate } = req.body;
      
      console.log(`[DIRECT-EDIT] Updating ${serviceType} price to ${laborRate} for contractor ${req.user.id}`);
      
      // First check if the service exists
      const existingService = await db.query.servicePricing.findFirst({
        where: and(
          eq(servicePricing.serviceType, serviceType),
          eq(servicePricing.contractorId, req.user.id)
        )
      });
      
      if (!existingService) {
        return res.status(404).json({ message: 'Service not found' });
      }
      
      // Update using the same pattern as successful operations
      const [updatedService] = await db
        .update(servicePricing)
        .set({ 
          laborRate: laborRate.toString(),
          updatedAt: new Date()
        })
        .where(and(
          eq(servicePricing.serviceType, serviceType),
          eq(servicePricing.contractorId, req.user.id)
        ))
        .returning();
      
      console.log(`[DIRECT-EDIT] Service ${serviceType} updated to ${laborRate} successfully`);
      
      res.json({ 
        message: 'Service updated successfully',
        service: updatedService
      });
    } catch (error) {
      console.error('[DIRECT-EDIT] Error updating service:', error);
      res.status(500).json({ message: 'Error updating service', error: error.message });
    }
  });

  // Simple endpoint to delete a service
  app.delete('/api/direct/services/:serviceType', async (req: any, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const { serviceType } = req.params;
      console.log(`[DIRECT] Deleting service ${serviceType} for contractor ${req.user.id}`);
      
      await db
        .delete(servicePricing)
        .where(and(
          eq(servicePricing.serviceType, serviceType),
          eq(servicePricing.contractorId, req.user.id)
        ));
      
      console.log(`[DIRECT] Service ${serviceType} deleted`);
      res.json({ message: 'Service deleted successfully' });
    } catch (error) {
      console.error('[DIRECT] Error deleting service:', error);
      res.status(500).json({ message: 'Error deleting service' });
    }
  });
}