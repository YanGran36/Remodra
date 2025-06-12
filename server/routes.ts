import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import { z } from "zod";
import { db } from "@db";
import { eq, and, sql } from "drizzle-orm";
// Importar middleware de autorización
import { verifyResourceOwnership, verifyRelationship, preventCascadeOperations, EntityType } from "./middleware/authorization";
import { 
  clientInsertSchema, 
  projectInsertSchema, 
  estimateInsertSchema, 
  estimateItemInsertSchema,
  invoiceInsertSchema,
  invoiceItemInsertSchema,
  eventInsertSchema,
  materialInsertSchema,
  followUpInsertSchema,
  propertyMeasurementInsertSchema,
  priceConfigurationInsertSchema,
  contractorCreateSchema,
  contractorInsertSchema,
  agentInsertSchema,
  servicePricing,
  projects,
  aiUsageLog,
  contractors,
  clients,
  agents,
  estimates,
  invoices,
  events
} from "@shared/schema";

import { analyzeProject, generateSharingContent, generateProfessionalJobDescription } from "./ai-service";
import * as achievementService from "./services/achievement-service";
import { registerTimeclockRoutes } from "./routes/timeclock-routes";
import { registerPricingRoutes } from "./routes/pricing";
import { registerDirectServiceRoutes } from "./routes/direct-service";
import { registerDirectServicesRoutes } from "./routes/direct-services";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // Registrar las rutas directas para servicios (COMENTADO - conflicto con nuevo endpoint)
  // registerDirectServiceRoutes(app);
  
  // Register new direct services routes for pricing page
  registerDirectServicesRoutes(app);

  // Simple service price update endpoint
  app.post('/api/update-service-price', async (req: any, res) => {
    console.log('[UPDATE] Service price update request received');
    console.log('[UPDATE] Request body:', req.body);
    
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const { originalServiceType, name, serviceType, unit, laborRate, laborMethod } = req.body;
      
      console.log(`[UPDATE] Updating service ${originalServiceType} for contractor ${req.user.id}`);
      
      const updateData = {
        name: name || 'Updated Service',
        serviceType: serviceType || originalServiceType,
        unit: unit || 'unit',
        laborRate: laborRate.toString(),
        laborCalculationMethod: laborMethod || 'by_area',
        updatedAt: new Date()
      };
      
      console.log('[UPDATE] Update data:', updateData);
      
      const [updatedService] = await db
        .update(servicePricing)
        .set(updateData)
        .where(and(
          eq(servicePricing.serviceType, originalServiceType),
          eq(servicePricing.contractorId, req.user.id)
        ))
        .returning();
      
      if (!updatedService) {
        console.log('[UPDATE] Service not found');
        return res.status(404).json({ message: 'Service not found' });
      }
      
      console.log('[UPDATE] Service updated successfully:', updatedService);
      
      res.json({
        id: updatedService.id,
        name: updatedService.name,
        serviceType: updatedService.serviceType,
        unit: updatedService.unit,
        laborRate: parseFloat(updatedService.laborRate),
        laborMethod: updatedService.laborCalculationMethod
      });
    } catch (error) {
      console.error('[UPDATE] Error updating service:', error);
      res.status(500).json({ message: 'Error updating service', error: error.message });
    }
  });
  
  // Language update route
  app.post("/api/protected/language", async (req, res) => {
    try {
      const { language } = req.body;
      
      // Validate language is supported
      if (!["en", "es", "fr", "pt"].includes(language)) {
        return res.status(400).json({ message: "Unsupported language" });
      }
      
      // Update user's language preference
      const updatedUser = await storage.updateContractor(req.user!.id, { language });
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating language:", error);
      res.status(500).json({ message: "Failed to update language preference" });
    }
  });

  // Clients routes
  app.get("/api/protected/clients", async (req, res) => {
    try {
      const clients = await storage.getClients(req.user!.id);
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  // Export/Import routes (separate from client CRUD routes)
  app.get("/api/protected/data/clients/export", async (req, res) => {
    try {
      const { exportClientsToJSON } = await import("./data-export");
      const clientsData = await exportClientsToJSON(req.user!.id);
      
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `clients_export_${timestamp}.json`;
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.json(clientsData);
    } catch (error) {
      console.error("Error exporting clients:", error);
      res.status(500).json({ message: "Failed to export clients" });
    }
  });

  app.post("/api/protected/data/clients/import", async (req, res) => {
    try {
      const { importClientsFromJSON } = await import("./data-export");
      const { clientsData } = req.body;
      
      if (!clientsData || !Array.isArray(clientsData)) {
        return res.status(400).json({ message: "Invalid client data provided" });
      }
      
      const result = await importClientsFromJSON(clientsData, req.user!.id);
      res.json({ message: result });
    } catch (error) {
      console.error("Error importing clients:", error);
      res.status(500).json({ message: "Failed to import clients" });
    }
  });

  app.get("/api/protected/clients/:id", 
    verifyResourceOwnership('client'),
    async (req, res) => {
      try {
        const client = await storage.getClient(Number(req.params.id), req.user!.id);
        if (!client) {
          return res.status(404).json({ message: "Client not found" });
        }
        res.json(client);
      } catch (error) {
        console.error("Error fetching client:", error);
        res.status(500).json({ message: "Failed to fetch client" });
      }
    }
  );

  app.post("/api/protected/clients", async (req, res) => {
    try {
      const validatedData = clientInsertSchema.parse({
        ...req.body,
        contractorId: req.user!.id
      });
      
      const client = await storage.createClient(validatedData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating client:", error);
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.patch("/api/protected/clients/:id", 
    verifyResourceOwnership('client'),
    async (req, res) => {
      try {
        const clientId = Number(req.params.id);
        
        const validatedData = clientInsertSchema.partial().parse(req.body);
        
        const client = await storage.updateClient(clientId, req.user!.id, validatedData);
        res.json(client);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ errors: error.errors });
        }
        console.error("Error updating client:", error);
        res.status(500).json({ message: "Failed to update client" });
      }
    }
  );

  app.delete("/api/protected/clients/:id", 
    verifyResourceOwnership('client'),
    preventCascadeOperations('client'),
    async (req, res) => {
      try {
        const clientId = Number(req.params.id);
        const success = await storage.deleteClient(clientId, req.user!.id);
        
        if (!success) {
          return res.status(404).json({ message: "Client not found" });
        }
        
        res.status(204).end();
      } catch (error) {
        console.error("Error deleting client:", error);
        res.status(500).json({ message: "Failed to delete client" });
      }
    }
  );

  // Client Messages routes
  app.get("/api/protected/client-messages", async (req, res) => {
    try {
      const { clientId } = req.query;
      const messages = await storage.getClientMessages(req.user!.id, clientId ? Number(clientId) : undefined);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching client messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/protected/client-messages", async (req, res) => {
    try {
      const validatedData = clientMessageInsertSchema.parse({
        ...req.body,
        contractorId: req.user!.id
      });
      
      const message = await storage.createClientMessage(validatedData);
      
      // Send email notification if requested
      if (req.body.sendEmail) {
        await storage.sendMessageEmail(message);
      }
      
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating client message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  app.patch("/api/protected/client-messages/:id/read", async (req, res) => {
    try {
      const messageId = Number(req.params.id);
      await storage.markMessageAsRead(messageId, req.user!.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  app.post("/api/protected/client-messages/:id/reply", async (req, res) => {
    try {
      const messageId = Number(req.params.id);
      const validatedData = messageReplyInsertSchema.parse({
        ...req.body,
        messageId,
        senderType: "contractor",
        senderId: req.user!.id
      });
      
      const reply = await storage.createMessageReply(validatedData);
      res.status(201).json(reply);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating message reply:", error);
      res.status(500).json({ message: "Failed to create reply" });
    }
  });

  // Client Portal Token routes
  app.post("/api/protected/client-portal-token", async (req, res) => {
    try {
      const { clientId } = req.body;
      const token = await storage.generateClientPortalToken(clientId, req.user!.id);
      res.json(token);
    } catch (error) {
      console.error("Error generating portal token:", error);
      res.status(500).json({ message: "Failed to generate portal token" });
    }
  });

  // Public client portal routes (no authentication required)
  app.get("/api/client-portal/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const portalData = await storage.getClientPortalData(token);
      res.json(portalData);
    } catch (error) {
      console.error("Error accessing client portal:", error);
      res.status(404).json({ message: "Invalid or expired portal access" });
    }
  });

  app.post("/api/client-portal/:token/reply/:messageId", async (req, res) => {
    try {
      const { token, messageId } = req.params;
      const { reply } = req.body;
      
      const clientData = await storage.validatePortalToken(token);
      if (!clientData) {
        return res.status(401).json({ message: "Invalid or expired token" });
      }
      
      const validatedData = messageReplyInsertSchema.parse({
        messageId: Number(messageId),
        senderType: "client",
        senderId: clientData.clientId,
        reply
      });
      
      const replyData = await storage.createMessageReply(validatedData);
      res.status(201).json(replyData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating client reply:", error);
      res.status(500).json({ message: "Failed to create reply" });
    }
  });

  // Projects routes
  app.get("/api/protected/projects", async (req, res) => {
    try {
      const projects = await storage.getProjects(req.user!.id);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/protected/projects/:id", 
    verifyResourceOwnership('project'),
    async (req, res) => {
      try {
        const project = await storage.getProject(Number(req.params.id), req.user!.id);
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
        res.json(project);
      } catch (error) {
        console.error("Error fetching project:", error);
        res.status(500).json({ message: "Failed to fetch project" });
      }
    }
  );

  app.post("/api/protected/projects", async (req, res) => {
    try {
      // Procesar las fechas del string ISO a objetos Date si están presentes
      const data = {
        ...req.body,
        contractorId: req.user!.id,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined
      };
      
      const validatedData = projectInsertSchema.parse(data);
      
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.patch("/api/protected/projects/:id", 
    verifyResourceOwnership('project'),
    async (req, res) => {
      try {
        const projectId = Number(req.params.id);
        
        // Procesar las fechas del string ISO a objetos Date si están presentes
        const data = {
          ...req.body,
          startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
          endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
          lastAiUpdate: req.body.lastAiUpdate ? new Date(req.body.lastAiUpdate) : (req.body.aiGeneratedDescription ? new Date() : undefined)
        };
        
        const validatedData = projectInsertSchema.partial().parse(data);
        
        const project = await storage.updateProject(projectId, req.user!.id, validatedData);
        res.json(project);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ errors: error.errors });
        }
        console.error("Error updating project:", error);
        res.status(500).json({ message: "Failed to update project" });
      }
    }
  );

  // PUT route for project updates (for compatibility with frontend)
  app.put("/api/protected/projects/:id", 
    verifyResourceOwnership('project'),
    async (req, res) => {
      try {
        const projectId = Number(req.params.id);
        
        // Process ISO string dates to Date objects if present
        const data = {
          ...req.body,
          startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
          endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
          lastAiUpdate: req.body.lastAiUpdate ? new Date(req.body.lastAiUpdate) : (req.body.aiGeneratedDescription ? new Date() : undefined)
        };
        
        const validatedData = projectInsertSchema.partial().parse(data);
        
        const project = await storage.updateProject(projectId, req.user!.id, validatedData);
        res.json(project);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ errors: error.errors });
        }
        console.error("Error updating project:", error);
        res.status(500).json({ message: "Failed to update project" });
      }
    }
  );

  // Update project positions for drag-and-drop reordering
  app.patch("/api/protected/projects/reorder", 
    async (req, res) => {
      try {
        // Check authentication
        if (!req.user || !req.user.id) {
          return res.status(401).json({ message: "Not authenticated" });
        }

        console.log('Raw request body:', req.body);
        const { projectUpdates } = req.body;
        console.log('Extracted projectUpdates:', projectUpdates);
        
        if (!Array.isArray(projectUpdates)) {
          return res.status(400).json({ message: "Invalid project updates format" });
        }
        
        // Update all projects in a transaction
        for (const update of projectUpdates) {
          console.log('Updating project:', update);
          
          // Validate the update object
          if (!update.id || !update.status || typeof update.position !== 'number') {
            console.error('Invalid update object:', update);
            return res.status(400).json({ 
              message: "Invalid update object", 
              details: update 
            });
          }
          
          await storage.updateProject(update.id, req.user.id, {
            status: update.status,
            position: update.position
          });
        }
        
        res.json({ success: true });
      } catch (error) {
        console.error("Error updating project positions:", error);
        res.status(500).json({ message: "Failed to update project positions" });
      }
    }
  );
  
  // Cancel project
  app.post("/api/protected/projects/:id/cancel", 
    verifyResourceOwnership('project'),
    async (req, res) => {
      try {
        const projectId = Number(req.params.id);
      
        // Obtenemos el proyecto
        const existingProject = await storage.getProject(projectId, req.user!.id);
        if (!existingProject) {
          return res.status(404).json({ message: "Project not found" });
        }
        
        // Verify that the project is not already cancelled
        if (existingProject.status === "cancelled") {
          return res.status(400).json({ message: "Project is already cancelled" });
        }
        
        // Actualizar el estado del proyecto a "cancelled"
        const project = await storage.updateProject(projectId, req.user!.id, { 
          status: "cancelled",
          notes: req.body.notes 
            ? `${existingProject.notes ? existingProject.notes + '\n\n' : ''}Cancelled: ${req.body.notes}`
            : `${existingProject.notes ? existingProject.notes + '\n\n' : ''}Project cancelled`
        });
        
        res.json(project);
      } catch (error) {
        console.error("Error cancelling project:", error);
        res.status(500).json({ message: "Failed to cancel project" });
      }
    }
  );

  app.delete("/api/protected/projects/:id", 
    verifyResourceOwnership('project'),
    async (req, res) => {
      try {
        const projectId = Number(req.params.id);
        const success = await storage.deleteProject(projectId, req.user!.id);
      
      if (!success) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Obtener estimados por proyecto
  app.get("/api/protected/projects/:id/estimates", 
    verifyResourceOwnership('project', 'id'),
    async (req, res) => {
      try {
        const projectId = Number(req.params.id);
        
        // Obtener los estimados que corresponden a este proyecto
        const estimates = await storage.getEstimates(req.user!.id);
        const projectEstimates = estimates.filter(estimate => estimate.projectId === projectId);
        
        res.json(projectEstimates);
      } catch (error) {
        console.error("Error fetching project estimates:", error);
        res.status(500).json({ message: "Failed to fetch project estimates" });
      }
    }
  );

  // Estimates routes
  app.get("/api/protected/estimates", async (req, res) => {
    try {
      const estimates = await storage.getEstimates(req.user!.id);
      res.json(estimates);
    } catch (error) {
      console.error("Error fetching estimates:", error);
      res.status(500).json({ message: "Failed to fetch estimates" });
    }
  });

  app.get("/api/protected/estimates/:id", 
    verifyResourceOwnership('estimate'),
    async (req, res) => {
      try {
      const estimate = await storage.getEstimate(Number(req.params.id), req.user!.id);
      if (!estimate) {
        return res.status(404).json({ message: "Estimate not found" });
      }
      res.json(estimate);
    } catch (error) {
      console.error("Error fetching estimate:", error);
      res.status(500).json({ message: "Failed to fetch estimate" });
    }
  });

  app.post("/api/protected/estimates", async (req, res) => {
    try {
      const estimateData = {
        contractorId: req.user!.id,
        clientId: req.body.clientId,
        estimateNumber: req.body.estimateNumber,
        issueDate: new Date(),
        status: req.body.status || "draft",
        subtotal: req.body.subtotal,
        tax: req.body.tax || 0,
        discount: req.body.discount || 0,
        total: req.body.total,
        notes: req.body.notes || null,
        terms: req.body.terms || null
      };
      
      const estimate = await storage.createEstimate(estimateData);
      
      // Create estimate items if selectedServices exist
      if (req.body.selectedServices && req.body.selectedServices.length > 0) {
        for (const service of req.body.selectedServices) {
          const quantity = service.measurements?.linearFeet || service.measurements?.squareFeet || 1;
          const unitPrice = parseFloat(service.laborRate) || 0;
          const amount = service.laborCost || (quantity * unitPrice);
          
          await storage.createEstimateItem({
            estimateId: estimate.id,
            description: service.professionalDescription || service.name,
            quantity: String(quantity),
            unitPrice: String(unitPrice),
            amount: String(amount),
            notes: service.notes || null
          });
        }
      }
      
      res.status(201).json(estimate);
    } catch (error) {
      console.error("Error creating estimate:", error);
      res.status(500).json({ message: "Failed to create estimate" });
    }
  });

  app.patch("/api/protected/estimates/:id", 
    verifyResourceOwnership('estimate'),
    async (req, res) => {
      try {
        const estimateId = Number(req.params.id);
        
        console.log("updateEstimate -> API - Updating estimate ID:", estimateId);
        console.log("updateEstimate -> API - Data received:", JSON.stringify(req.body, null, 2));
        
        // Obtener el estimado actual para verificar su existencia
        const existingEstimate = await storage.getEstimate(estimateId, req.user!.id);
        if (!existingEstimate) {
          return res.status(404).json({ message: "Estimate not found" });
        }
      
      // Preparar datos con conversión de fechas
      const dataWithDateObjects = { ...req.body };
      
      // Aseguramos que issueDate sea un objeto Date válido
      if (dataWithDateObjects.issueDate && typeof dataWithDateObjects.issueDate === 'string') {
        dataWithDateObjects.issueDate = new Date(dataWithDateObjects.issueDate);
      }
      
      // Aseguramos que expiryDate sea un objeto Date válido si está presente
      if (dataWithDateObjects.expiryDate && typeof dataWithDateObjects.expiryDate === 'string') {
        dataWithDateObjects.expiryDate = new Date(dataWithDateObjects.expiryDate);
      }
      
      // Validamos los items si existen
      if (dataWithDateObjects.items && Array.isArray(dataWithDateObjects.items)) {
        console.log(`updateEstimate -> API - El estimado tiene ${dataWithDateObjects.items.length} items`);
      }
      
      const validatedData = estimateInsertSchema.partial().parse(dataWithDateObjects);
      
      console.log("updateEstimate -> API - Data validated, proceeding to update");
      
      const estimate = await storage.updateEstimate(estimateId, req.user!.id, validatedData);
      
      console.log("updateEstimate -> API - Estimate updated successfully");
      
      res.json(estimate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("updateEstimate -> API - Error de validación:", JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors,
          details: error.format()
        });
      }
      
      console.error("updateEstimate -> API - Error:", error);
      res.status(500).json({ 
        message: "Failed to update estimate", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.delete("/api/protected/estimates/:id", 
    verifyResourceOwnership('estimate'),
    async (req, res) => {
      try {
        const estimateId = Number(req.params.id);
        const success = await storage.deleteEstimate(estimateId, req.user!.id);
        
        if (!success) {
          return res.status(404).json({ message: "Estimate not found" });
        }
        
        res.status(204).end();
      } catch (error) {
        console.error("Error deleting estimate:", error);
        res.status(500).json({ message: "Failed to delete estimate" });
      }
    }
  );
  
  // Accept estimate
  app.post("/api/protected/estimates/:id/accept", 
    verifyResourceOwnership('estimate'),
    async (req, res) => {
      try {
        const estimateId = Number(req.params.id);
        
        // First check if estimate exists and belongs to contractor
        const existingEstimate = await storage.getEstimate(estimateId, req.user!.id);
        if (!existingEstimate) {
          return res.status(404).json({ message: "Estimate not found" });
        }
        
        // Check if estimate can be accepted
        if (existingEstimate.status !== 'draft' && existingEstimate.status !== 'sent') {
          return res.status(400).json({ 
            message: `Estimate cannot be accepted from current status: ${existingEstimate.status}` 
          });
        }
        
        // Update estimate status to 'accepted'
        const updatedEstimate = await storage.updateEstimate(estimateId, req.user!.id, {
          status: 'accepted',
          notes: req.body.notes 
            ? `${existingEstimate.notes ? existingEstimate.notes + '\n\n' : ''}Accepted: ${req.body.notes}`
            : `${existingEstimate.notes ? existingEstimate.notes + '\n\n' : ''}Estimate accepted`
        });
        
        res.json(updatedEstimate);
      } catch (error) {
        console.error("Error accepting estimate:", error);
        res.status(500).json({ message: "Failed to accept estimate" });
      }
  });
  
  // Reject estimate
  app.post("/api/protected/estimates/:id/reject", 
    verifyResourceOwnership('estimate'),
    async (req, res) => {
      try {
        const estimateId = Number(req.params.id);
        
        // Obtener estimado actual
        const existingEstimate = await storage.getEstimate(estimateId, req.user!.id);
        if (!existingEstimate) {
          return res.status(404).json({ message: "Estimate not found" });
        }
      
        // Check if estimate can be rejected
        if (existingEstimate.status !== 'draft' && existingEstimate.status !== 'sent') {
          return res.status(400).json({ 
            message: `Estimate cannot be rejected from current status: ${existingEstimate.status}` 
          });
        }
        
        // Require rejection reason
        if (!req.body.notes) {
          return res.status(400).json({ message: "Rejection reason is required" });
        }
        
        // Update estimate status to 'rejected'
        const updatedEstimate = await storage.updateEstimate(estimateId, req.user!.id, {
          status: 'rejected',
          notes: `${existingEstimate.notes ? existingEstimate.notes + '\n\n' : ''}Rejected: ${req.body.notes}`
        });
        
        res.json(updatedEstimate);
      } catch (error) {
        console.error("Error rejecting estimate:", error);
        res.status(500).json({ message: "Failed to reject estimate" });
      }
  });

  // Convert estimate to invoice
  app.post("/api/protected/estimates/:id/convert-to-invoice", 
    verifyResourceOwnership('estimate'),
    async (req, res) => {
      try {
        const estimateId = Number(req.params.id);
        
        // Obtener el estimado
        const estimate = await storage.getEstimate(estimateId, req.user!.id);
        
        if (!estimate) {
          return res.status(404).json({ message: "Estimate not found" });
        }
        
        // Verify the estimate status allows conversion
        // Solo permitir que estimados con estado 'accepted' puedan ser convertidos
        if (estimate.status !== 'accepted') {
          return res.status(400).json({ message: "Only accepted estimates can be converted to invoices. Please accept the estimate first." });
        }
        
        // Get the estimate items
        const estimateItems = await storage.getEstimateItems(estimateId, req.user!.id);
      
        // Generate an invoice number
        const today = new Date();
        const year = today.getFullYear();
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 900) + 100; // Random 3-digit number
        const invoiceNumber = `OT-${year}${month}-${random}`;
        
        // Create the invoice
        const invoiceData = {
          contractorId: req.user!.id,
          clientId: estimate.clientId,
          projectId: estimate.projectId,
          estimateId: estimate.id,
          invoiceNumber,
          issueDate: new Date(),
          dueDate: new Date(new Date().setDate(new Date().getDate() + 15)), // Due in 15 days
          status: "pending",
          subtotal: estimate.subtotal,
          tax: estimate.tax,
          discount: estimate.discount,
          total: estimate.total,
          amountPaid: "0",
          terms: estimate.terms,
          notes: estimate.notes,
          contractorSignature: estimate.contractorSignature,
        };
      
        const invoice = await storage.createInvoice(invoiceData);
        
        // Create invoice items from estimate items
        if (estimateItems && estimateItems.length > 0) {
          for (const item of estimateItems) {
            await storage.createInvoiceItem({
              invoiceId: invoice.id,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              amount: item.amount,
              notes: item.notes
            });
          }
        }
        
        // Mark the estimate as converted
        await storage.updateEstimate(estimateId, req.user!.id, {
          status: 'converted',
          notes: `${estimate.notes ? estimate.notes + '\n\n' : ''}Converted to Invoice #${invoiceNumber}`
        });
        
        // Return the created invoice with items
        const completeInvoice = await storage.getInvoice(invoice.id, req.user!.id);
        res.status(201).json(completeInvoice);
        
      } catch (error) {
        console.error("Error converting estimate to work order:", error);
        res.status(500).json({ message: "Failed to convert estimate to work order" });
      }
    }
  );

  // Estimate Items routes
  app.get("/api/protected/estimates/:estimateId/items", 
    verifyResourceOwnership('estimate', 'estimateId'),
    async (req, res) => {
      try {
        const estimateId = Number(req.params.estimateId);
        const items = await storage.getEstimateItems(estimateId, req.user!.id);
        res.json(items);
      } catch (error) {
        console.error("Error fetching estimate items:", error);
        res.status(500).json({ message: "Failed to fetch estimate items" });
      }
    }
  );

  app.post("/api/protected/estimates/:estimateId/items", 
    verifyResourceOwnership('estimate', 'estimateId'),
    async (req, res) => {
      try {
        const estimateId = Number(req.params.estimateId);
        
        // Obtener el estimado
        const existingEstimate = await storage.getEstimate(estimateId, req.user!.id);
        if (!existingEstimate) {
          return res.status(404).json({ message: "Estimate not found" });
        }
      
        const validatedData = estimateItemInsertSchema.parse({
          ...req.body,
          estimateId
        });
        
        const item = await storage.createEstimateItem(validatedData);
        res.status(201).json(item);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ errors: error.errors });
        }
        console.error("Error creating estimate item:", error);
        res.status(500).json({ message: "Failed to create estimate item" });
      }
  });

  app.patch("/api/protected/estimates/:estimateId/items/:id", 
    verifyResourceOwnership('estimate', 'estimateId'),
    async (req, res) => {
      try {
        const estimateId = Number(req.params.estimateId);
        const itemId = Number(req.params.id);
      
        const validatedData = estimateItemInsertSchema.partial().parse(req.body);
        
        const item = await storage.updateEstimateItem(itemId, estimateId, req.user!.id, validatedData);
        
        if (!item) {
          return res.status(404).json({ message: "Estimate item not found" });
        }
        
        res.json(item);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ errors: error.errors });
        }
        console.error("Error updating estimate item:", error);
        res.status(500).json({ message: "Failed to update estimate item" });
      }
  });

  app.delete("/api/protected/estimates/:estimateId/items/:id", 
    verifyResourceOwnership('estimate', 'estimateId'),
    async (req, res) => {
      try {
        const estimateId = Number(req.params.estimateId);
        const itemId = Number(req.params.id);
      
        const success = await storage.deleteEstimateItem(itemId, estimateId, req.user!.id);
        
        if (!success) {
          return res.status(404).json({ message: "Estimate item not found" });
        }
        
        res.status(204).end();
      } catch (error) {
        console.error("Error deleting estimate item:", error);
        res.status(500).json({ message: "Failed to delete estimate item" });
      }
  });

  // Invoices routes
  app.get("/api/protected/invoices", async (req, res) => {
    try {
      const invoices = await storage.getInvoices(req.user!.id);
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.get("/api/protected/invoices/:id", 
    verifyResourceOwnership('invoice', 'id'),
    async (req, res) => {
      try {
        const invoice = await storage.getInvoice(Number(req.params.id), req.user!.id);
        if (!invoice) {
          return res.status(404).json({ message: "Invoice not found" });
        }
        res.json(invoice);
      } catch (error) {
        console.error("Error fetching invoice:", error);
        res.status(500).json({ message: "Failed to fetch invoice" });
      }
  });

  app.post("/api/protected/invoices", async (req, res) => {
    try {
      const validatedData = invoiceInsertSchema.parse({
        ...req.body,
        contractorId: req.user!.id
      });
      
      const invoice = await storage.createInvoice(validatedData);
      res.status(201).json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating invoice:", error);
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  app.patch("/api/protected/invoices/:id", 
    verifyResourceOwnership('invoice', 'id'),
    async (req, res) => {
      try {
        const invoiceId = Number(req.params.id);
        
        // El middleware ya verificó que la factura existe y pertenece al contratista
        const validatedData = invoiceInsertSchema.partial().parse(req.body);
        
        const invoice = await storage.updateInvoice(invoiceId, req.user!.id, validatedData);
        res.json(invoice);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ errors: error.errors });
        }
        console.error("Error updating invoice:", error);
        res.status(500).json({ message: "Failed to update invoice" });
      }
  });
  
  // Cancelar factura
  app.post("/api/protected/invoices/:id/cancel", 
    verifyResourceOwnership('invoice', 'id'),
    async (req, res) => {
      try {
        const invoiceId = Number(req.params.id);
        
        // El middleware ya verificó que la factura existe y pertenece al contratista
        const existingInvoice = await storage.getInvoice(invoiceId, req.user!.id);
        
        // Verify that the invoice exists
        if (!existingInvoice) {
          return res.status(404).json({ message: "Invoice not found" });
        }
        
        // Verify that the invoice is not already cancelled
        if (existingInvoice.status === "cancelled") {
          return res.status(400).json({ message: "Invoice is already cancelled" });
        }
        
        // Si la factura está pagada, no se puede cancelar
        if (existingInvoice.status === "paid") {
          return res.status(400).json({ message: "Cannot cancel a paid invoice" });
        }
        
        // Actualizar el estado de la factura a "cancelled"
        const invoice = await storage.updateInvoice(invoiceId, req.user!.id, { 
          status: "cancelled",
          notes: req.body.notes 
            ? `${existingInvoice.notes ? existingInvoice.notes + '\n\n' : ''}Cancelled: ${req.body.notes}`
            : `${existingInvoice.notes ? existingInvoice.notes + '\n\n' : ''}Invoice cancelled`
        });
        
        res.json(invoice);
      } catch (error) {
        console.error("Error cancelling invoice:", error);
        res.status(500).json({ message: "Failed to cancel invoice" });
      }
  });

  app.delete("/api/protected/invoices/:id", 
    verifyResourceOwnership('invoice', 'id'),
    preventCascadeOperations('invoice'),
    async (req, res) => {
      try {
        const invoiceId = Number(req.params.id);
        const success = await storage.deleteInvoice(invoiceId, req.user!.id);
        
        if (!success) {
          return res.status(404).json({ message: "Invoice not found" });
        }
        
        res.status(204).end();
      } catch (error) {
        console.error("Error deleting invoice:", error);
        res.status(500).json({ message: "Failed to delete invoice" });
      }
  });
  
  // Record payment for an invoice with automatic project status updates
  app.post("/api/protected/invoices/:id/payment", 
    verifyResourceOwnership('invoice', 'id'),
    async (req, res) => {
      try {
        const invoiceId = Number(req.params.id);
        const { amount, paymentMethod, notes } = req.body;
        
        if (!amount || isNaN(parseFloat(amount))) {
          return res.status(400).json({ message: "Valid payment amount is required" });
        }
        
        // Get invoice with project information
        const invoice = await storage.getInvoice(invoiceId, req.user!.id);
        
        if (!invoice) {
          return res.status(404).json({ message: "Invoice not found" });
        }
      
        const currentAmountPaid = parseFloat(invoice.amountPaid || "0");
        const paymentAmount = parseFloat(amount);
        const totalAmount = parseFloat(invoice.total);
        const newAmountPaid = currentAmountPaid + paymentAmount;
        const paymentPercentage = (newAmountPaid / totalAmount) * 100;
      
        // Ensure payment doesn't exceed total
        if (newAmountPaid > totalAmount) {
          return res.status(400).json({ 
            message: "Payment amount exceeds the remaining balance",
            currentAmountPaid,
            totalAmount,
            remainingBalance: totalAmount - currentAmountPaid
          });
        }
        
        // Update the invoice with the new amount paid
        let newInvoiceStatus = invoice.status;
        if (newAmountPaid >= totalAmount) {
          newInvoiceStatus = "paid";
        } else if (newAmountPaid > 0) {
          newInvoiceStatus = "partially_paid";
        }
        
        const updatedInvoice = await storage.updateInvoice(invoiceId, req.user!.id, {
          amountPaid: newAmountPaid.toString(),
          status: newInvoiceStatus
        });
        
        // BUSINESS LOGIC: Auto-update project status based on ANY payment received
        let projectStatusUpdated = false;
        let newProjectStatus = null;
        let projectUpdateMessage = "";
        
        if (newAmountPaid > 0) { // ANY payment triggers project logic
          try {
            if (invoice.projectId) {
              // Update existing project
              const currentProject = await storage.getProject(invoice.projectId, req.user!.id);
              
              if (currentProject && currentProject.status === "pending") {
                // Any payment moves project to "in_progress"
                newProjectStatus = "In Progress";
                
                await storage.updateProject(invoice.projectId, req.user!.id, {
                  status: "in_progress"
                });
                
                projectStatusUpdated = true;
                projectUpdateMessage = `Project automatically moved to In Progress status after receiving payment.`;
              }
            } else {
              // Create new project when invoice has no existing project
              const client = await storage.getClient(invoice.clientId, req.user!.id);
              if (client) {
                // Create new project using storage method that handles database properly
                const newProject = await storage.createSimpleProject({
                  contractorId: req.user!.id,
                  clientId: invoice.clientId,
                  title: `Project for Invoice #${invoice.invoiceNumber}`,
                  description: `Automatically created project from invoice #${invoice.invoiceNumber} after receiving payment`,
                  status: "pending",
                  budget: Number(invoice.total),
                  startDate: new Date(),
                  notes: "Project created automatically when invoice payment was received"
                });
                
                // Link the invoice to the new project
                await storage.updateInvoice(invoiceId, req.user!.id, {
                  projectId: newProject.id
                });
                
                projectStatusUpdated = true;
                newProjectStatus = "Pending";
                projectUpdateMessage = `New project created and added to pending status after receiving payment.`;
              }
            }
          } catch (projectError) {
            console.error("Error handling project creation/update:", projectError);
            console.error("Project error details:", {
              invoiceId: invoice.id,
              clientId: invoice.clientId,
              hasProject: !!invoice.projectId,
              errorMessage: projectError instanceof Error ? projectError.message : projectError
            });
            // Don't fail the payment if project operation fails
          }
        }
        
        res.json({ 
          invoice: updatedInvoice,
          payment: {
            amount: paymentAmount,
            method: paymentMethod || "cash",
            notes: notes || "",
            date: new Date().toISOString()
          },
          totals: {
            currentAmountPaid: newAmountPaid,
            totalAmount,
            remainingBalance: totalAmount - newAmountPaid,
            paymentPercentage: Math.round(paymentPercentage)
          },
          projectUpdate: {
            updated: projectStatusUpdated,
            newStatus: newProjectStatus,
            message: projectUpdateMessage
          },
          message: projectStatusUpdated 
            ? `Payment recorded successfully. ${projectUpdateMessage}`
            : "Payment recorded successfully"
        });
      } catch (error) {
        console.error("Error recording payment:", error);
        res.status(500).json({ message: "Failed to record payment" });
      }
    }
  );

  // Invoice Items routes
  app.get("/api/protected/invoices/:invoiceId/items", async (req, res) => {
    try {
      const invoiceId = Number(req.params.invoiceId);
      const items = await storage.getInvoiceItems(invoiceId, req.user!.id);
      res.json(items);
    } catch (error) {
      console.error("Error fetching invoice items:", error);
      res.status(500).json({ message: "Failed to fetch invoice items" });
    }
  });

  app.post("/api/protected/invoices/:invoiceId/items", async (req, res) => {
    try {
      const invoiceId = Number(req.params.invoiceId);
      
      // First check if invoice exists and belongs to contractor
      const existingInvoice = await storage.getInvoice(invoiceId, req.user!.id);
      if (!existingInvoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      const validatedData = invoiceItemInsertSchema.parse({
        ...req.body,
        invoiceId
      });
      
      const item = await storage.createInvoiceItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating invoice item:", error);
      res.status(500).json({ message: "Failed to create invoice item" });
    }
  });

  app.patch("/api/protected/invoices/:invoiceId/items/:id", async (req, res) => {
    try {
      const invoiceId = Number(req.params.invoiceId);
      const itemId = Number(req.params.id);
      
      const validatedData = invoiceItemInsertSchema.partial().parse(req.body);
      
      const item = await storage.updateInvoiceItem(itemId, invoiceId, req.user!.id, validatedData);
      
      if (!item) {
        return res.status(404).json({ message: "Invoice item not found" });
      }
      
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error updating invoice item:", error);
      res.status(500).json({ message: "Failed to update invoice item" });
    }
  });

  app.delete("/api/protected/invoices/:invoiceId/items/:id", async (req, res) => {
    try {
      const invoiceId = Number(req.params.invoiceId);
      const itemId = Number(req.params.id);
      
      const success = await storage.deleteInvoiceItem(itemId, invoiceId, req.user!.id);
      
      if (!success) {
        return res.status(404).json({ message: "Invoice item not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting invoice item:", error);
      res.status(500).json({ message: "Failed to delete invoice item" });
    }
  });

  // Public client routes for estimates
  app.get("/api/public/estimates/:id", async (req, res) => {
    try {
      const estimateId = Number(req.params.id);
      
      const estimate = await storage.getEstimateById(estimateId);
      
      if (!estimate) {
        return res.status(404).json({ message: "Estimate not found" });
      }
      
      res.json(estimate);
    } catch (error) {
      console.error("Error fetching public estimate:", error);
      res.status(500).json({ 
        message: "Failed to fetch estimate", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  app.post("/api/public/estimates/:id/client-action", async (req, res) => {
    try {
      const estimateId = Number(req.params.id);
      const { action, clientId, notes } = req.body;
      
      // Validate required fields
      if (!action || !clientId) {
        return res.status(400).json({ 
          message: "Missing required fields", 
          required: ["action", "clientId"] 
        });
      }
      
      // Validate action type
      if (action !== 'accept' && action !== 'reject') {
        return res.status(400).json({ 
          message: "Invalid action. Must be 'accept' or 'reject'" 
        });
      }
      
      // Get the estimate and verify it's for this client
      const estimate = await storage.getEstimateById(estimateId);
      
      if (!estimate) {
        return res.status(404).json({ message: "Estimate not found" });
      }
      
      // Verify estimate belongs to the specified client
      if (estimate.clientId !== Number(clientId)) {
        return res.status(403).json({ 
          message: "Estimate does not belong to this client" 
        });
      }
      
      // If rejecting, require a reason
      if (action === 'reject' && !notes) {
        return res.status(400).json({ message: "Rejection reason is required" });
      }
      
      if (action === 'accept') {
        // Simply accept the estimate without auto-creating invoice
        const updateData = {
          status: 'accepted',
          acceptedDate: new Date(),
          notes: `${estimate.notes ? estimate.notes + '\n\n' : ''}Estimate accepted by client`
        };
        
        // Update the estimate
        const updatedEstimate = await storage.updateEstimateById(estimateId, updateData);
        
        res.json({
          success: true,
          message: "Estimate has been accepted successfully",
          estimate: updatedEstimate
        });
      } else {
        // Para rechazar, actualizamos el estado a rechazado
        const updateData = {
          status: 'rejected',
          rejectionNotes: notes,
          rejectedDate: new Date(),
          notes: notes 
            ? `${estimate.notes ? estimate.notes + '\n\n' : ''}Client rejected: ${notes}`
            : `${estimate.notes ? estimate.notes + '\n\n' : ''}Estimate rejected by client`
        };
        
        // Actualizar el estimado
        const updatedEstimate = await storage.updateEstimateById(estimateId, updateData);
        
        res.json({
          success: true,
          message: "Estimate has been rejected successfully",
          estimate: updatedEstimate
        });
      }
      
    } catch (error) {
      console.error(`Error processing client ${req.body?.action || 'unknown'} action:`, error);
      res.status(500).json({ 
        message: `Failed to process client action`, 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Agent Management Routes
  app.get("/api/protected/agents", async (req, res) => {
    try {
      const contractorId = req.user!.id;
      const agentsList = await db.query.agents.findMany({
        where: eq(agents.contractorId, contractorId),
        orderBy: [agents.firstName, agents.lastName]
      });
      res.json(agentsList);
    } catch (error) {
      console.error("Error fetching agents:", error);
      res.status(500).json({ message: "Failed to fetch agents" });
    }
  });

  app.post("/api/protected/agents", async (req, res) => {
    try {
      const contractorId = req.user!.id;
      
      // Convert string values to proper types for decimal fields
      const processedData = {
        ...req.body,
        contractorId,
        hourlyRate: req.body.hourlyRate && req.body.hourlyRate !== '' ? req.body.hourlyRate : null,
        commissionRate: req.body.commissionRate && req.body.commissionRate !== '' ? req.body.commissionRate : null,
        hireDate: req.body.hireDate && req.body.hireDate !== '' ? req.body.hireDate : null
      };
      
      const agentData = agentInsertSchema.parse(processedData);
      
      const [newAgent] = await db.insert(agents).values(agentData).returning();
      res.status(201).json(newAgent);
    } catch (error) {
      console.error("Error creating agent:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create agent" });
    }
  });

  app.put("/api/protected/agents/:id", async (req, res) => {
    try {
      const agentId = parseInt(req.params.id);
      const contractorId = req.user!.id;
      
      // Verify agent belongs to contractor
      const existingAgent = await db.query.agents.findFirst({
        where: and(eq(agents.id, agentId), eq(agents.contractorId, contractorId))
      });
      
      if (!existingAgent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      // Convert string values to proper types for decimal fields
      const processedData = {
        ...req.body,
        hourlyRate: req.body.hourlyRate && req.body.hourlyRate !== '' ? req.body.hourlyRate : null,
        commissionRate: req.body.commissionRate && req.body.commissionRate !== '' ? req.body.commissionRate : null,
        hireDate: req.body.hireDate && req.body.hireDate !== '' ? req.body.hireDate : null
      };
      
      const updateData = agentInsertSchema.partial().parse(processedData);
      
      const [updatedAgent] = await db
        .update(agents)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(agents.id, agentId))
        .returning();
        
      res.json(updatedAgent);
    } catch (error) {
      console.error("Error updating agent:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update agent" });
    }
  });

  app.delete("/api/protected/agents/:id", async (req, res) => {
    try {
      const agentId = parseInt(req.params.id);
      const contractorId = req.user!.id;
      
      // Check if agent has active estimates
      const activeEstimates = await db.query.estimates.findMany({
        where: and(
          eq(estimates.agentId, agentId),
          eq(estimates.contractorId, contractorId)
        )
      });
      
      if (activeEstimates.length > 0) {
        return res.status(400).json({ 
          message: "Cannot delete agent with active estimates. Please reassign or complete estimates first." 
        });
      }
      
      await db.delete(agents).where(and(eq(agents.id, agentId), eq(agents.contractorId, contractorId)));
      res.json({ message: "Agent deleted successfully" });
    } catch (error) {
      console.error("Error deleting agent:", error);
      res.status(500).json({ message: "Failed to delete agent" });
    }
  });

  // Agent Schedule Management Routes
  app.get("/api/protected/agents/schedule/:date", async (req, res) => {
    try {
      const contractorId = req.user!.id;
      const date = req.params.date;
      
      // Get all estimates scheduled for this date
      const dayEstimates = await db.query.estimates.findMany({
        where: and(
          eq(estimates.contractorId, contractorId),
          sql`DATE(appointment_date) = ${date}`
        ),
        with: {
          agent: true,
          client: true
        },
        orderBy: [estimates.appointmentDate]
      });
      
      // Get all active agents
      const activeAgents = await db.query.agents.findMany({
        where: and(eq(agents.contractorId, contractorId), eq(agents.isActive, true)),
        orderBy: [agents.firstName, agents.lastName]
      });
      
      // Create schedule overview
      const schedule = activeAgents.map(agent => {
        const agentEstimates = dayEstimates.filter(est => est.agentId === agent.id);
        return {
          agent,
          estimates: agentEstimates,
          totalHours: agentEstimates.reduce((sum, est) => sum + (est.appointmentDuration || 60), 0) / 60,
          isAvailable: agentEstimates.length === 0
        };
      });
      
      res.json({
        date,
        schedule,
        totalEstimates: dayEstimates.length,
        unassignedEstimates: dayEstimates.filter(est => !est.agentId)
      });
    } catch (error) {
      console.error("Error fetching agent schedule:", error);
      res.status(500).json({ message: "Failed to fetch agent schedule" });
    }
  });

  app.post("/api/protected/agents/assign-estimate", async (req, res) => {
    try {
      const contractorId = req.user!.id;
      const { estimateId, agentId, appointmentDate, appointmentDuration } = req.body;
      
      // Verify estimate belongs to contractor
      const estimate = await db.query.estimates.findFirst({
        where: and(eq(estimates.id, estimateId), eq(estimates.contractorId, contractorId)),
        with: { client: true }
      });
      
      if (!estimate) {
        return res.status(404).json({ message: "Estimate not found" });
      }
      
      // Verify agent belongs to contractor
      const agent = await db.query.agents.findFirst({
        where: and(eq(agents.id, agentId), eq(agents.contractorId, contractorId))
      });
      
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      // Parse appointment date and time
      const appointmentDateTime = new Date(appointmentDate);
      const appointmentEndTime = new Date(appointmentDateTime.getTime() + (appointmentDuration || 60) * 60000);
      
      // Check for time-based scheduling conflicts
      const conflictingEstimates = await db.query.estimates.findMany({
        where: and(
          eq(estimates.agentId, agentId),
          eq(estimates.contractorId, contractorId),
          sql`id != ${estimateId}`,
          sql`appointment_date IS NOT NULL`
        )
      });
      
      // Check for overlapping time conflicts
      const hasTimeConflict = conflictingEstimates.some(existing => {
        if (!existing.appointmentDate) return false;
        
        const existingStart = new Date(existing.appointmentDate);
        const existingEnd = new Date(existingStart.getTime() + (existing.appointmentDuration || 60) * 60000);
        
        return (appointmentDateTime < existingEnd && appointmentEndTime > existingStart);
      });
      
      if (hasTimeConflict) {
        return res.status(409).json({ 
          message: "Agent has a scheduling conflict at this time",
          conflict: true,
          conflicts: conflictingEstimates.filter(existing => {
            if (!existing.appointmentDate) return false;
            const existingStart = new Date(existing.appointmentDate);
            const existingEnd = new Date(existingStart.getTime() + (existing.appointmentDuration || 60) * 60000);
            return (appointmentDateTime < existingEnd && appointmentEndTime > existingStart);
          })
        });
      }
      
      // Assign estimate to agent
      const [updatedEstimate] = await db
        .update(estimates)
        .set({
          agentId,
          appointmentDate: appointmentDateTime,
          appointmentDuration: appointmentDuration || 60,
          estimateType: 'agent'
        })
        .where(eq(estimates.id, estimateId))
        .returning();

      // Create calendar event for this appointment
      try {
        const eventTitle = `Agent Estimate - ${estimate.estimateNumber}`;
        const eventDescription = `Estimate appointment assigned to ${agent.firstName} ${agent.lastName}`;
        
        const { events } = await import("@shared/schema");
        await db.insert(events).values({
          contractorId,
          clientId: estimate.clientId,
          title: eventTitle,
          description: eventDescription,
          startTime: appointmentDateTime,
          endTime: appointmentEndTime,
          type: "estimate",
          status: "confirmed",
          location: ""
        });
      } catch (eventError) {
        console.log("Note: Could not create calendar event, but estimate assignment succeeded");
      }
        
      res.json(updatedEstimate);
    } catch (error) {
      console.error("Error assigning estimate to agent:", error);
      res.status(500).json({ message: "Failed to assign estimate to agent" });
    }
  });

  app.get("/api/protected/agents/availability/:agentId/:date", async (req, res) => {
    try {
      const contractorId = req.user!.id;
      const agentId = parseInt(req.params.agentId);
      const date = req.params.date;
      
      // Get agent's estimates for the day
      const dayEstimates = await db.query.estimates.findMany({
        where: and(
          eq(estimates.agentId, agentId),
          eq(estimates.contractorId, contractorId),
          sql`DATE(appointment_date) = ${date}`
        ),
        with: {
          client: true
        },
        orderBy: [estimates.appointmentDate]
      });
      
      res.json({
        agentId,
        date,
        estimates: dayEstimates,
        totalBookedHours: dayEstimates.reduce((sum, est) => sum + (est.appointmentDuration || 60), 0) / 60,
        isAvailable: dayEstimates.length === 0
      });
    } catch (error) {
      console.error("Error checking agent availability:", error);
      res.status(500).json({ message: "Failed to check agent availability" });
    }
  });

  // Events routes
  app.get("/api/protected/events", async (req, res) => {
    try {
      const events = await storage.getEvents(req.user!.id);
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get("/api/protected/events/:id", async (req, res) => {
    try {
      const event = await storage.getEvent(Number(req.params.id), req.user!.id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  app.post("/api/protected/events", async (req, res) => {
    try {
      console.log("Data received from client:", JSON.stringify(req.body, null, 2));
      
      // Preparar datos incluyendo el ID del contratista
      const dataToValidate = {
        ...req.body,
        contractorId: req.user!.id,
      };
      
      console.log("Datos preparados para validación:", JSON.stringify(dataToValidate, null, 2));
      
      // z.coerce.date() convierte automáticamente las strings a objetos Date
      const validatedData = eventInsertSchema.parse(dataToValidate);
      
      console.log("Datos validados:", JSON.stringify({
        ...validatedData,
        startTime: validatedData.startTime instanceof Date ? validatedData.startTime.toISOString() : validatedData.startTime,
        endTime: validatedData.endTime instanceof Date ? validatedData.endTime.toISOString() : validatedData.endTime
      }, null, 2));
      
      const event = await storage.createEvent(validatedData);
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Error de validación ZOD:", JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating event:", error);
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  app.patch("/api/protected/events/:id", async (req, res) => {
    try {
      const eventId = Number(req.params.id);
      
      // First check if event exists and belongs to contractor
      const existingEvent = await storage.getEvent(eventId, req.user!.id);
      if (!existingEvent) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Usar el esquema parcial para validación
      const validatedData = eventInsertSchema.partial().parse({
        ...req.body,
        // Asegurarse de que las fechas se conviertan correctamente si están presentes
        startTime: req.body.startTime ? req.body.startTime : undefined,
        endTime: req.body.endTime ? req.body.endTime : undefined
      });
      
      console.log("Datos validados para actualización:", JSON.stringify({
        ...validatedData,
        startTime: validatedData.startTime instanceof Date ? validatedData.startTime.toISOString() : validatedData.startTime,
        endTime: validatedData.endTime instanceof Date ? validatedData.endTime.toISOString() : validatedData.endTime
      }, null, 2));
      
      const event = await storage.updateEvent(eventId, req.user!.id, validatedData);
      res.json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Error de validación ZOD:", JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error updating event:", error);
      res.status(500).json({ message: "Failed to update event" });
    }
  });

  app.delete("/api/protected/events/:id", async (req, res) => {
    try {
      const eventId = Number(req.params.id);
      const success = await storage.deleteEvent(eventId, req.user!.id);
      
      if (!success) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  // Materials routes
  app.get("/api/protected/materials", async (req, res) => {
    try {
      const materials = await storage.getMaterials(req.user!.id);
      res.json(materials);
    } catch (error) {
      console.error("Error fetching materials:", error);
      res.status(500).json({ message: "Failed to fetch materials" });
    }
  });

  app.get("/api/protected/materials/:id", 
    verifyResourceOwnership('material', 'id'),
    async (req, res) => {
      try {
        // El middleware ya verificó que el material existe y pertenece al contratista
        const material = await storage.getMaterial(Number(req.params.id), req.user!.id);
        if (!material) {
          return res.status(404).json({ message: "Material not found" });
        }
        res.json(material);
      } catch (error) {
        console.error("Error fetching material:", error);
        res.status(500).json({ message: "Failed to fetch material" });
      }
  });

  app.post("/api/protected/materials", async (req, res) => {
    try {
      const validatedData = materialInsertSchema.parse({
        ...req.body,
        contractorId: req.user!.id
      });
      
      const material = await storage.createMaterial(validatedData);
      res.status(201).json(material);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating material:", error);
      res.status(500).json({ message: "Failed to create material" });
    }
  });

  app.patch("/api/protected/materials/:id", 
    verifyResourceOwnership('material', 'id'),
    async (req, res) => {
      try {
        const materialId = Number(req.params.id);
        
        // El middleware ya verificó que el material existe y pertenece al contratista
        const existingMaterial = await storage.getMaterial(materialId, req.user!.id);
        if (!existingMaterial) {
          return res.status(404).json({ message: "Material not found" });
        }
        
        const validatedData = materialInsertSchema.partial().parse(req.body);
        
        const material = await storage.updateMaterial(materialId, req.user!.id, validatedData);
        res.json(material);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ errors: error.errors });
        }
        console.error("Error updating material:", error);
        res.status(500).json({ message: "Failed to update material" });
      }
  });

  app.delete("/api/protected/materials/:id", 
    verifyResourceOwnership('material', 'id'),
    preventCascadeOperations('material'),
    async (req, res) => {
      try {
        const materialId = Number(req.params.id);
        const success = await storage.deleteMaterial(materialId, req.user!.id);
        
        if (!success) {
          return res.status(404).json({ message: "Material not found" });
        }
        
        res.status(204).end();
      } catch (error) {
        console.error("Error deleting material:", error);
        res.status(500).json({ message: "Failed to delete material" });
      }
  });

  // Attachments routes
  app.get("/api/protected/attachments/:entityType/:entityId", 
    (req, res, next) => {
      // Verify that the entity type and ID are valid and belong to the contractor
      const entityType = req.params.entityType;
      const entityId = Number(req.params.entityId);
      
      if (!entityType || !entityId) {
        return res.status(400).json({ message: "Entity type and ID are required" });
      }
      
      // We use a dynamic middleware based on the entity type
      return verifyResourceOwnership(entityType as EntityType, 'entityId')(req, res, next);
    },
    async (req, res) => {
      try {
        const entityType = req.params.entityType;
        const entityId = Number(req.params.entityId);
        
        // The middleware already verified that the entity exists and belongs to the contractor
        const attachments = await storage.getAttachments(req.user!.id, entityType, entityId);
        res.json(attachments);
      } catch (error) {
        console.error("Error fetching attachments:", error);
        res.status(500).json({ message: "Failed to fetch attachments" });
      }
  });

  app.post("/api/protected/attachments", 
    // We verify that the entity to which the file is attached belongs to the contractor
    (req, res, next) => {
      const { entityType, entityId } = req.body;
      
      if (!entityType || !entityId) {
        return res.status(400).json({ message: "Entity type and ID are required" });
      }
      
      // We use a dynamic middleware based on the entity type
      return verifyResourceOwnership(entityType as EntityType, 'entityId')(req, res, next);
    },
    async (req, res) => {
      try {
        // The middleware already verified that the entity exists and belongs to the contractor
        const validatedData = {
          ...req.body,
          contractorId: req.user!.id
        };
        
        const attachment = await storage.createAttachment(validatedData);
        res.status(201).json(attachment);
      } catch (error) {
        console.error("Error creating attachment:", error);
        res.status(500).json({ message: "Failed to create attachment" });
      }
  });

  app.delete("/api/protected/attachments/:id", 
    verifyResourceOwnership('attachment', 'id'),
    async (req, res) => {
      try {
        const attachmentId = Number(req.params.id);
        // El middleware ya verificó que el adjunto existe y pertenece al contratista
        const success = await storage.deleteAttachment(attachmentId, req.user!.id);
        
        if (!success) {
          return res.status(404).json({ message: "Attachment not found" });
        }
        
        res.status(204).end();
      } catch (error) {
        console.error("Error deleting attachment:", error);
        res.status(500).json({ message: "Failed to delete attachment" });
      }
  });

  // Follow-ups routes
  app.get("/api/protected/follow-ups", async (req, res) => {
    try {
      const followUps = await storage.getFollowUps(req.user!.id);
      res.json(followUps);
    } catch (error) {
      console.error("Error fetching follow-ups:", error);
      res.status(500).json({ message: "Failed to fetch follow-ups" });
    }
  });

  app.post("/api/protected/follow-ups", async (req, res) => {
    try {
      const validatedData = followUpInsertSchema.parse({
        ...req.body,
        contractorId: req.user!.id
      });
      
      const followUp = await storage.createFollowUp(validatedData);
      res.status(201).json(followUp);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating follow-up:", error);
      res.status(500).json({ message: "Failed to create follow-up" });
    }
  });

  app.patch("/api/protected/follow-ups/:id", 
    verifyResourceOwnership('follow-up'),
    async (req, res) => {
      try {
        const followUpId = Number(req.params.id);
        const validatedData = followUpInsertSchema.partial().parse(req.body);
        
        // El middleware ya verificó que el follow-up existe y pertenece al contratista
        const followUp = await storage.updateFollowUp(followUpId, req.user!.id, validatedData);
        
        if (!followUp) {
          return res.status(404).json({ message: "Follow-up not found" });
        }
        
        res.json(followUp);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ errors: error.errors });
        }
        console.error("Error updating follow-up:", error);
        res.status(500).json({ message: "Failed to update follow-up" });
      }
  });

  app.delete("/api/protected/follow-ups/:id", 
    verifyResourceOwnership('follow-up'),
    async (req, res) => {
      try {
        const followUpId = Number(req.params.id);
        // El middleware ya verificó que el follow-up existe y pertenece al contratista
        const success = await storage.deleteFollowUp(followUpId, req.user!.id);
        
        if (!success) {
          return res.status(404).json({ message: "Follow-up not found" });
        }
        
        res.status(204).end();
      } catch (error) {
        console.error("Error deleting follow-up:", error);
        res.status(500).json({ message: "Failed to delete follow-up" });
      }
  });

  // Property Measurements routes
  app.get("/api/protected/property-measurements", async (req, res) => {
    try {
      const measurements = await storage.getPropertyMeasurements(req.user!.id);
      res.json(measurements);
    } catch (error) {
      console.error("Error fetching property measurements:", error);
      res.status(500).json({ message: "Failed to fetch property measurements" });
    }
  });

  app.get("/api/protected/property-measurements/:id", 
    verifyResourceOwnership('property-measurement'),
    async (req, res) => {
      try {
        // El middleware ya verificó que la medición existe y pertenece al contratista
        const measurement = await storage.getPropertyMeasurement(Number(req.params.id), req.user!.id);
        if (!measurement) {
          return res.status(404).json({ message: "Property measurement not found" });
        }
        res.json(measurement);
      } catch (error) {
        console.error("Error fetching property measurement:", error);
        res.status(500).json({ message: "Failed to fetch property measurement" });
      }
  });

  app.post("/api/protected/property-measurements", async (req, res) => {
    try {
      const validatedData = propertyMeasurementInsertSchema.parse({
        ...req.body,
        contractorId: req.user!.id,
        measuredAt: new Date(),
      });
      
      const measurement = await storage.createPropertyMeasurement(validatedData);
      res.status(201).json(measurement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating property measurement:", error);
      res.status(500).json({ message: "Failed to create property measurement" });
    }
  });

  app.patch("/api/protected/property-measurements/:id", 
    verifyResourceOwnership('property-measurement'),
    async (req, res) => {
      try {
        const measurementId = Number(req.params.id);
        
        // El middleware ya verificó que la medición existe y pertenece al contratista
        // No necesitamos la siguiente verificación
        // const existingMeasurement = await storage.getPropertyMeasurement(measurementId, req.user!.id);
        // if (!existingMeasurement) {
        //   return res.status(404).json({ message: "Property measurement not found" });
        // }
        
        const validatedData = propertyMeasurementInsertSchema.partial().parse(req.body);
        
        const measurement = await storage.updatePropertyMeasurement(measurementId, req.user!.id, validatedData);
        res.json(measurement);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ errors: error.errors });
        }
        console.error("Error updating property measurement:", error);
        res.status(500).json({ message: "Failed to update property measurement" });
      }
  });

  app.delete("/api/protected/property-measurements/:id", 
    verifyResourceOwnership('property-measurement'),
    async (req, res) => {
      try {
        const measurementId = Number(req.params.id);
        // El middleware ya verificó que la medición existe y pertenece al contratista
        const success = await storage.deletePropertyMeasurement(measurementId, req.user!.id);
        
        if (!success) {
          return res.status(404).json({ message: "Property measurement not found" });
        }
        
        res.status(204).end();
      } catch (error) {
        console.error("Error deleting property measurement:", error);
        res.status(500).json({ message: "Failed to delete property measurement" });
      }
  });

  // AI routes for job cost analysis
  app.post("/api/protected/ai/analyze-job-cost", async (req, res) => {
    try {
      const { analyzeJobCost } = await import("./openai-service");
      const params = req.body;
      
      // Validación detallada
      if (!params) {
        return res.status(400).json({ 
          error: "Datos faltantes", 
          message: "No se recibieron datos para el análisis" 
        });
      }
      
      if (!params.serviceType) {
        return res.status(400).json({ 
          error: "Datos insuficientes", 
          message: "Debe seleccionar un tipo de servicio" 
        });
      }
      
      if (!params.materials || !Array.isArray(params.materials) || params.materials.length === 0) {
        return res.status(400).json({ 
          error: "Datos insuficientes", 
          message: "Debe agregar al menos un material al proyecto" 
        });
      }
      
      // Check if there are materials with invalid data
      const invalidMaterials = params.materials.some(
        (m: {name?: string; quantity?: number; unitPrice?: number}) => !m.name || typeof m.quantity !== 'number' || typeof m.unitPrice !== 'number'
      );
      
      if (invalidMaterials) {
        return res.status(400).json({ 
          error: "Invalid data", 
          message: "Algunos materiales tienen información incompleta o inválida" 
        });
      }
      
      console.log("Iniciando análisis de costos para:", params.serviceType);
      const result = await analyzeJobCost(params);
      console.log("Análisis completado con éxito");
      res.json(result);
    } catch (error) {
      console.error("Error en el análisis de costos:", error);
      res.status(500).json({ 
        error: "Error al procesar el análisis de costos", 
        message: (error as Error).message 
      });
    }
  });
  
  // Route to generate job description with AI
  app.post("/api/protected/ai/generate-job-description", async (req, res) => {
    try {
      const { generateJobDescription } = await import("./openai-service");
      const params = req.body;
      
      // Validación detallada
      if (!params) {
        return res.status(400).json({ 
          error: "Datos faltantes", 
          message: "No se recibieron datos para la descripción" 
        });
      }
      
      if (!params.serviceType) {
        return res.status(400).json({ 
          error: "Datos insuficientes", 
          message: "Debe seleccionar un tipo de servicio" 
        });
      }
      
      if (!params.materials || !Array.isArray(params.materials) || params.materials.length === 0) {
        return res.status(400).json({ 
          error: "Datos insuficientes", 
          message: "Debe agregar al menos un material al proyecto" 
        });
      }
      
      // Check if there are materials with invalid data
      const invalidMaterials = params.materials.some(
        (m: {name?: string; quantity?: number; unitPrice?: number}) => !m.name || typeof m.quantity !== 'number' || typeof m.unitPrice !== 'number'
      );
      
      if (invalidMaterials) {
        return res.status(400).json({ 
          error: "Invalid data", 
          message: "Algunos materiales tienen información incompleta o inválida" 
        });
      }
      
      console.log("Generating description for:", params.serviceType);
      const description = await generateJobDescription(params);
      console.log("Description generated successfully");
      res.json({ description });
    } catch (error) {
      console.error("Error generating description:", error);
      res.status(500).json({ 
        error: "Error generating job description", 
        message: (error as Error).message 
      });
    }
  });
  
  // Generate professional job description from appointment notes
  app.post("/api/protected/ai/generate-professional-description", async (req, res) => {
    try {
      // Validate the incoming data
      const params = req.body;
      
      if (!params) {
        return res.status(400).json({ 
          error: "Missing data", 
          message: "No data received for description" 
        });
      }
      
      if (!params.appointmentNotes) {
        return res.status(400).json({ 
          error: "Insufficient data", 
          message: "You must provide appointment notes" 
        });
      }
      
      console.log("Generating professional description from notes");
      const result = await generateProfessionalJobDescription(params);
      console.log("Professional description generated successfully");
      res.json(result);
    } catch (error) {
      console.error("Error generating professional job description:", error);
      res.status(500).json({ 
        error: "Error generating professional job description", 
        message: (error as Error).message 
      });
    }
  });

  // Price Configuration routes
  app.get("/api/protected/price-configurations", async (req, res) => {
    try {
      const configurations = await storage.getPriceConfigurations(req.user!.id);
      res.json(configurations);
    } catch (error) {
      console.error("Error al obtener configuraciones de precios:", error);
      res.status(500).json({ message: "No se pudieron obtener las configuraciones de precios" });
    }
  });

  // Rutas específicas primero
  app.get("/api/protected/price-configurations/service/:serviceType/default", async (req, res) => {
    try {
      const serviceType = req.params.serviceType;
      const configuration = await storage.getDefaultPriceConfiguration(req.user!.id, serviceType);
      if (!configuration) {
        return res.status(404).json({ message: "No hay configuración predeterminada para este servicio" });
      }
      res.json(configuration);
    } catch (error) {
      console.error("Error al obtener configuración de precios predeterminada:", error);
      res.status(500).json({ message: "No se pudo obtener la configuración de precios predeterminada" });
    }
  });

  app.get("/api/protected/price-configurations/service/:serviceType", async (req, res) => {
    try {
      const serviceType = req.params.serviceType;
      const configurations = await storage.getPriceConfigurationsByService(req.user!.id, serviceType);
      res.json(configurations);
    } catch (error) {
      console.error("Error al obtener configuraciones de precios por servicio:", error);
      res.status(500).json({ message: "No se pudieron obtener las configuraciones de precios para este servicio" });
    }
  });

  // Y después rutas por ID
  app.get("/api/protected/price-configurations/:id([0-9]+)", async (req, res) => {
    try {
      const configuration = await storage.getPriceConfiguration(Number(req.params.id), req.user!.id);
      if (!configuration) {
        return res.status(404).json({ message: "Configuración de precios no encontrada" });
      }
      res.json(configuration);
    } catch (error) {
      console.error("Error al obtener configuración de precios:", error);
      res.status(500).json({ message: "No se pudo obtener la configuración de precios" });
    }
  });

  app.post("/api/protected/price-configurations", async (req, res) => {
    try {
      const validatedData = priceConfigurationInsertSchema.parse({
        ...req.body,
        contractorId: req.user!.id
      });
      
      const configuration = await storage.createPriceConfiguration(validatedData);
      res.status(201).json(configuration);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error al crear configuración de precios:", error);
      res.status(500).json({ message: "No se pudo crear la configuración de precios" });
    }
  });

  app.patch("/api/protected/price-configurations/:id", async (req, res) => {
    try {
      const configId = Number(req.params.id);
      
      // Primero verificar si la configuración existe y pertenece al contratista
      const existingConfig = await storage.getPriceConfiguration(configId, req.user!.id);
      if (!existingConfig) {
        return res.status(404).json({ message: "Configuración de precios no encontrada" });
      }
      
      const validatedData = priceConfigurationInsertSchema.partial().parse(req.body);
      
      const configuration = await storage.updatePriceConfiguration(configId, req.user!.id, validatedData);
      res.json(configuration);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error al actualizar configuración de precios:", error);
      res.status(500).json({ message: "No se pudo actualizar la configuración de precios" });
    }
  });

  app.delete("/api/protected/price-configurations/:id", async (req, res) => {
    try {
      const configId = Number(req.params.id);
      const success = await storage.deletePriceConfiguration(configId, req.user!.id);
      
      if (!success) {
        return res.status(404).json({ message: "Configuración de precios no encontrada" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error al eliminar configuración de precios:", error);
      res.status(500).json({ message: "No se pudo eliminar la configuración de precios" });
    }
  });

  app.post("/api/protected/price-configurations/:id/set-default", async (req, res) => {
    try {
      const configId = Number(req.params.id);
      
      // Obtener la configuración para verificar que existe y determinar su tipo de servicio
      const config = await storage.getPriceConfiguration(configId, req.user!.id);
      if (!config) {
        return res.status(404).json({ message: "Configuración de precios no encontrada" });
      }
      
      // Establecer como predeterminada
      const updatedConfig = await storage.setDefaultPriceConfiguration(configId, req.user!.id, config.serviceType);
      res.json(updatedConfig);
    } catch (error) {
      console.error("Error al establecer configuración predeterminada:", error);
      res.status(500).json({ message: "No se pudo establecer la configuración como predeterminada" });
    }
  });
  
  // Public routes for invoices
  app.get("/api/public/invoices/:id", async (req, res) => {
    try {
      const invoiceId = Number(req.params.id);
      
      // Get invoice by ID
      const invoice = await storage.getInvoiceById(invoiceId);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Get invoice items
      const items = await storage.getInvoiceItemsById(invoiceId, undefined);
      
      // Get contractor info
      const contractor = await storage.getContractor(invoice.contractorId);
      // Get client info
      const client = await storage.getClientById(invoice.clientId, invoice.contractorId);
      
      // Get project info if available
      let project = null;
      if (invoice.projectId) {
        // Usamos el ID del contratista de la factura para garantizar que solo se acceda a proyectos propios
        project = await storage.getProjectById(invoice.projectId, invoice.contractorId);
      }
      
      // Return combined data
      res.json({
        ...invoice,
        items,
        contractor,
        client,
        project
      });
      
    } catch (error) {
      console.error("Error fetching public invoice:", error);
      res.status(500).json({ 
        message: "Failed to fetch invoice", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Public endpoint for clients to sign invoices
  app.post("/api/public/invoices/:id/client-action", async (req, res) => {
    try {
      const invoiceId = Number(req.params.id);
      const { action, signature, notes } = req.body;
      
      if (!action) {
        return res.status(400).json({ message: "Action is required" });
      }
      
      // Get invoice by ID (public endpoint)
      const invoice = await storage.getInvoiceById(invoiceId);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // For now we only support 'sign' action
      if (action !== 'sign') {
        return res.status(400).json({ message: "Invalid action. Only 'sign' is supported." });
      }
      
      // Validate signature is provided
      if (!signature) {
        return res.status(400).json({ message: "Signature is required for signing" });
      }
      
      // Make sure invoice is in a valid state for signing
      if (invoice.status !== 'pending') {
        return res.status(400).json({ 
          message: `Cannot sign invoice in "${invoice.status}" status. Invoice must be in "pending" status.` 
        });
      }
      
      // Update invoice with signature and change status to 'signed'
      const updatedInvoice = await storage.updateInvoiceById(invoiceId, {
        status: 'signed',
        clientSignature: signature,
        notes: notes ? 
          (invoice.notes ? `${invoice.notes}\n\n${notes}` : notes) : 
          invoice.notes
      });
      
      res.json({
        success: true,
        message: "Invoice has been signed successfully",
        invoice: updatedInvoice
      });
      
    } catch (error) {
      console.error("Error processing invoice action:", error);
      res.status(500).json({ 
        message: "Error processing invoice action", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Ruta para crear nuevos contratistas (solo accesible para super admin)
  app.post("/api/super-admin/contractors", async (req, res) => {
    // Temporalmente, comentamos la verificación de autenticación para pruebas
    /*
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Verificar que el usuario es super admin
    if (req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Acceso denegado. Se requieren privilegios de super admin." });
    }
    */
    
    try {
      console.log("Recibiendo solicitud para crear contratista:", JSON.stringify(req.body, null, 2));
      
      // Validar los datos enviados
      const validData = contractorCreateSchema.parse(req.body);
      console.log("Datos validados correctamente");
      
      // Buscar si ya existe un contratista con el mismo correo
      const existingEmail = await storage.getContractorByEmail(validData.email);
      if (existingEmail) {
        console.log("Correo duplicado:", validData.email);
        return res.status(400).json({ message: "Ya existe un contratista con este correo electrónico" });
      }
      
      // Crear el contratista con contraseña hasheada
      const hashedPassword = await hashPassword(validData.password);
      console.log("Contraseña hasheada correctamente");
      
      // Datos para crear el contratista
      const contractorData = {
        companyName: validData.companyName,
        email: validData.email,
        phone: validData.phone || null,
        website: validData.website || null,
        address: validData.address || null,
        city: validData.city || null,
        state: validData.state || null,
        zip: validData.zipCode || null, // Ajustamos el nombre a 'zip' según el esquema
        country: validData.country || "USA",
        firstName: validData.firstName,
        lastName: validData.lastName,
        username: validData.username,
        password: hashedPassword,
        role: "contractor", // Rol por defecto
        plan: validData.plan || "professional",
        language: "en", // Añadimos el campo obligatorio
        settings: JSON.stringify({
          serviceTypes: Array.isArray(validData.serviceTypes) && validData.serviceTypes.length > 0 
            ? validData.serviceTypes 
            : ["deck"],
          allowClientPortal: typeof validData.allowClientPortal === 'boolean' 
            ? validData.allowClientPortal 
            : true,
          useEstimateTemplates: typeof validData.useEstimateTemplates === 'boolean' 
            ? validData.useEstimateTemplates 
            : true,
          enabledAIAssistant: typeof validData.enabledAIAssistant === 'boolean' 
            ? validData.enabledAIAssistant 
            : true,
          primaryColor: validData.primaryColor || "#1E40AF",
          logoUrl: validData.logoUrl || null,
          companyDescription: validData.companyDescription || null
        })
      };
      
      console.log("Intentando guardar contratista con datos:", {
        ...contractorData,
        password: "[REDACTED]" // No mostramos la contraseña en los logs
      });
      
      // Guardar el contratista en la base de datos
      const newContractor = await storage.createContractor(contractorData);
      console.log("Contratista guardado con ID:", newContractor.id);
      
      // Retornar el contratista creado (pero omitimos datos sensibles)
      res.status(201).json({
        id: newContractor.id,
        email: newContractor.email,
        username: newContractor.username,
        companyName: newContractor.companyName,
        firstName: newContractor.firstName,
        lastName: newContractor.lastName,
        message: "Contratista creado exitosamente"
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Error de validación:", JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: error.errors,
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        });
      }
      
      console.error("Error creating contractor:", error);
      res.status(500).json({ 
        message: "Error al crear el contratista",
        details: error instanceof Error ? error.message : "Error desconocido"
      });
    }
  });

  // Create HTTP server
  // Endpoints de IA
  app.post("/api/ai/analyze-project", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ message: "API key de OpenAI no configurada" });
      }
      
      const projectData = req.body;
      const analysis = await analyzeProject(projectData);
      
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing project with AI:", error);
      res.status(500).json({ 
        message: `Error al analizar el proyecto con IA: ${error instanceof Error ? error.message : 'Error desconocido'}` 
      });
    }
  });
  
  app.post("/api/ai/sharing-content/:projectId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ message: "API key de OpenAI no configurada" });
      }
      
      const projectId = parseInt(req.params.projectId);
      const settings = req.body.settings;
      
      // Obtener el proyecto completo
      const project = await storage.getProject(projectId, req.user!.id);
      
      if (!project) {
        return res.status(404).json({ message: "Proyecto no encontrado" });
      }
      
      const sharingContent = await generateSharingContent(project, settings);
      
      res.json(sharingContent);
    } catch (error) {
      console.error("Error generating sharing content:", error);
      res.status(500).json({ 
        message: `Error al generar contenido para compartir: ${error instanceof Error ? error.message : 'Error desconocido'}` 
      });
    }
  });

  // Eliminadas todas las rutas relacionadas con Google Sheets

  // Rutas para el sistema de logros (gamificación)
  app.get("/api/achievements", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const achievements = await achievementService.getAllAchievements();
      res.json(achievements);
    } catch (error) {
      console.error("Error al obtener logros:", error);
      res.status(500).json({
        message: "Error al obtener logros",
        details: error instanceof Error ? error.message : "Error desconocido"
      });
    }
  });

  app.get("/api/contractor/achievements", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const contractorId = req.user?.id;
      if (!contractorId) {
        return res.status(400).json({ message: "ID de contratista no proporcionado" });
      }

      const achievements = await achievementService.getContractorAchievements(contractorId);
      res.json(achievements);
    } catch (error) {
      console.error("Error al obtener logros del contratista:", error);
      res.status(500).json({
        message: "Error al obtener logros del contratista",
        details: error instanceof Error ? error.message : "Error desconocido"
      });
    }
  });

  app.get("/api/contractor/achievements/unread", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const contractorId = req.user?.id;
      if (!contractorId) {
        return res.status(400).json({ message: "ID de contratista no proporcionado" });
      }

      const unreadAchievements = await achievementService.getUnreadAchievements(contractorId);
      res.json(unreadAchievements);
    } catch (error) {
      console.error("Error al obtener logros no leídos:", error);
      res.status(500).json({
        message: "Error al obtener logros no leídos",
        details: error instanceof Error ? error.message : "Error desconocido"
      });
    }
  });

  app.post("/api/contractor/achievements/:achievementId/mark-read", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const contractorId = req.user?.id;
      const achievementId = Number(req.params.achievementId);
      
      if (!contractorId) {
        return res.status(400).json({ message: "ID de contratista no proporcionado" });
      }

      if (!achievementId) {
        return res.status(400).json({ message: "ID de logro no válido" });
      }

      const updated = await achievementService.markAchievementAsNotified(contractorId, achievementId);
      res.json(updated);
    } catch (error) {
      console.error("Error al marcar logro como leído:", error);
      res.status(500).json({
        message: "Error al marcar logro como leído",
        details: error instanceof Error ? error.message : "Error desconocido"
      });
    }
  });

  app.post("/api/contractor/achievements/:achievementId/unlock-reward", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const contractorId = req.user?.id;
      const achievementId = Number(req.params.achievementId);
      
      if (!contractorId) {
        return res.status(400).json({ message: "ID de contratista no proporcionado" });
      }

      if (!achievementId) {
        return res.status(400).json({ message: "ID de logro no válido" });
      }

      const result = await achievementService.unlockReward(contractorId, achievementId);
      res.json(result);
    } catch (error) {
      console.error("Error al desbloquear recompensa:", error);
      res.status(500).json({
        message: "Error al desbloquear recompensa",
        details: error instanceof Error ? error.message : "Error desconocido"
      });
    }
  });

  app.get("/api/contractor/stats", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const contractorId = req.user?.id;
      if (!contractorId) {
        return res.status(400).json({ message: "ID de contratista no proporcionado" });
      }

      const stats = await achievementService.getContractorGameStats(contractorId);
      res.json(stats);
    } catch (error) {
      console.error("Error al obtener estadísticas del contratista:", error);
      res.status(500).json({
        message: "Error al obtener estadísticas del contratista",
        details: error instanceof Error ? error.message : "Error desconocido"
      });
    }
  });

  app.post("/api/contractor/streak/update", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const contractorId = req.user?.id;
      if (!contractorId) {
        return res.status(400).json({ message: "ID de contratista no proporcionado" });
      }

      const streak = await achievementService.updateDailyStreak(contractorId);
      res.json(streak);
    } catch (error) {
      console.error("Error al actualizar racha diaria:", error);
      res.status(500).json({
        message: "Error al actualizar racha diaria",
        details: error instanceof Error ? error.message : "Error desconocido"
      });
    }
  });

  // Ruta para verificar y actualizar un logro 
  // (Llamada internamente por el sistema cuando ocurren acciones relevantes)
  app.post("/api/contractor/achievements/check", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const contractorId = req.user?.id;
      if (!contractorId) {
        return res.status(400).json({ message: "ID de contratista no proporcionado" });
      }

      const { code, category, progress } = req.body;
      
      if (!code || !category || progress === undefined) {
        return res.status(400).json({ 
          message: "Datos incompletos. Se requiere code, category y progress" 
        });
      }

      const result = await achievementService.checkAndUpdateAchievement({
        contractorId,
        code,
        category,
        progress
      });

      res.json(result);
    } catch (error) {
      console.error("Error al verificar logro:", error);
      res.status(500).json({
        message: "Error al verificar logro",
        details: error instanceof Error ? error.message : "Error desconocido"
      });
    }
  });

  // Registrar las rutas del timeclock
  registerTimeclockRoutes(app);

  // Client Messages routes for client communication
  app.get("/api/protected/client-messages", async (req, res) => {
    try {
      const messages = await storage.getClientMessages(req.user!.id);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching client messages:", error);
      res.status(500).json({ message: "Failed to fetch client messages" });
    }
  });

  app.post("/api/protected/client-messages", async (req, res) => {
    try {
      const validatedData = {
        ...req.body,
        contractorId: req.user!.id,
        sentViaEmail: req.body.sendEmail || false,
        emailSentAt: req.body.sendEmail ? new Date() : null
      };
      
      const message = await storage.createClientMessage(validatedData);
      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating client message:", error);
      res.status(500).json({ message: "Failed to create client message" });
    }
  });

  app.patch("/api/protected/client-messages/:id/read", async (req, res) => {
    try {
      const messageId = Number(req.params.id);
      const message = await storage.markMessageAsRead(messageId, req.user!.id);
      
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      res.json(message);
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  // Subscription Management API Routes
  app.get('/api/subscription/status', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const contractor = await storage.getContractor(req.user.id);
      if (!contractor) {
        return res.status(404).json({ error: 'Contractor not found' });
      }

      // Get current usage counts
      const clientCount = await storage.getClientCountByContractor(req.user.id);
      
      // Get current month AI usage
      const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
      const aiUsageCount = await storage.getAiUsageCount(req.user.id, currentMonth);

      const subscriptionStatus = {
        contractor: {
          id: contractor.id,
          email: contractor.email,
          username: contractor.username,
          companyName: contractor.companyName,
          subscriptionPlan: contractor.plan,
          subscriptionStatus: contractor.subscriptionStatus
        },
        plan: {
          planName: contractor.plan,
          priceMonthly: contractor.plan === 'basic' ? 29 : contractor.plan === 'pro' ? 59 : 99,
          maxClients: contractor.plan === 'basic' ? 10 : contractor.plan === 'pro' ? 50 : -1,
          hasAiCostAnalysis: contractor.plan !== 'basic',
          hasTimeClock: contractor.plan !== 'basic',
          hasStripeIntegration: contractor.plan === 'business',
          hasCustomPortal: true,
          hasBrandedPortal: contractor.plan === 'business',
          aiUsageLimit: contractor.plan === 'basic' ? 0 : contractor.plan === 'pro' ? 10 : -1
        },
        usage: {
          currentClientCount: clientCount,
          maxClients: contractor.plan === 'basic' ? 10 : contractor.plan === 'pro' ? 50 : -1,
          clientsRemaining: contractor.plan === 'business' ? 'unlimited' : 
            Math.max(0, (contractor.plan === 'basic' ? 10 : 50) - clientCount),
          currentAiUsage: aiUsageCount,
          maxAiUsage: contractor.plan === 'basic' ? 0 : contractor.plan === 'pro' ? 10 : -1,
          aiUsageRemaining: contractor.plan === 'business' ? 'unlimited' : 
            contractor.plan === 'basic' ? 0 : Math.max(0, 10 - aiUsageCount)
        }
      };

      res.json(subscriptionStatus);
    } catch (error) {
      console.error('Get subscription status error:', error);
      res.status(500).json({ error: 'Failed to get subscription status' });
    }
  });

  // Check subscription feature access
  app.get('/api/subscription/check/:feature', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { feature } = req.params;
      const contractor = await storage.getContractor(req.user.id);
      
      if (!contractor) {
        return res.status(404).json({ error: 'Contractor not found' });
      }

      let hasAccess = false;
      
      switch (feature) {
        case 'hasAiCostAnalysis':
          hasAccess = contractor.plan !== 'basic';
          break;
        case 'hasTimeClock':
          hasAccess = contractor.plan !== 'basic';
          break;
        case 'hasStripeIntegration':
          hasAccess = contractor.plan === 'business';
          break;
        case 'hasCustomPortal':
          hasAccess = true; // All plans have custom portal
          break;
        case 'hasBrandedPortal':
          hasAccess = contractor.plan === 'business';
          break;
        default:
          hasAccess = false;
      }

      res.json({ hasAccess, currentPlan: contractor.plan });
    } catch (error) {
      console.error('Check subscription access error:', error);
      res.status(500).json({ error: 'Failed to check subscription access' });
    }
  });

  // Admin route to update contractor subscription
  app.put('/api/super-admin/contractors/:id/subscription', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      if (req.user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Access denied. Super admin privileges required.' });
      }

      const contractorId = Number(req.params.id);
      const { plan, status } = req.body;

      if (!plan || !status) {
        return res.status(400).json({ message: 'Plan and status are required' });
      }

      const validPlans = ['basic', 'pro', 'business'];
      const validStatuses = ['active', 'inactive', 'cancelled'];

      if (!validPlans.includes(plan)) {
        return res.status(400).json({ message: 'Invalid plan. Must be basic, pro, or business' });
      }

      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status. Must be active, inactive, or cancelled' });
      }

      const updatedContractor = await storage.updateContractorSubscription(contractorId, {
        plan,
        subscriptionStatus: status
      });

      if (!updatedContractor) {
        return res.status(404).json({ message: 'Contractor not found' });
      }

      res.json({ 
        success: true, 
        message: 'Subscription updated successfully',
        contractor: updatedContractor
      });

    } catch (error) {
      console.error('Update contractor subscription error:', error);
      res.status(500).json({ 
        message: 'Failed to update subscription',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Billing and Subscription Management Routes
  app.get('/api/billing/subscription-info', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const contractor = await storage.getContractor(req.user.id);
      if (!contractor) {
        return res.status(404).json({ error: 'Contractor not found' });
      }

      // Get all available plans
      const allPlans = await storage.getAllSubscriptionPlans();
      
      // Get current usage
      const clientCount = await storage.getClientsByContractor(req.user.id);
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      // Count AI usage this month
      const aiUsageEntries = await db.query.aiUsageLog.findMany({
        where: and(
          eq(aiUsageLog.contractorId, req.user.id),
          sql`${aiUsageLog.usageMonth} LIKE ${currentMonth + '%'}`
        )
      });

      const subscriptionInfo = {
        currentPlan: {
          name: contractor.plan || 'basic',
          displayName: contractor.plan === 'basic' ? 'Basic Plan' : 
                      contractor.plan === 'pro' ? 'Pro Plan' : 'Business Plan',
          price: contractor.plan === 'basic' ? '29' : 
                 contractor.plan === 'pro' ? '59' : '99',
          clientLimit: contractor.plan === 'basic' ? 10 : 
                      contractor.plan === 'pro' ? 50 : null,
          aiUsageLimit: contractor.plan === 'basic' ? 0 : 
                       contractor.plan === 'pro' ? 10 : null,
          hasTimeClockAccess: contractor.plan !== 'basic',
          hasStripeIntegration: contractor.plan === 'business',
        },
        subscriptionStatus: contractor.subscriptionStatus || 'trial',
        planStartDate: contractor.planStartDate,
        planEndDate: contractor.planEndDate,
        stripeCustomerId: contractor.stripeCustomerId,
        stripeSubscriptionId: contractor.stripeSubscriptionId,
        usage: {
          clientCount: clientCount.length,
          aiUsageThisMonth: aiUsageEntries.length
        },
        availablePlans: [
          {
            name: 'basic',
            displayName: 'Basic Plan',
            price: '29',
            clientLimit: 10,
            aiUsageLimit: 0,
            hasTimeClockAccess: false,
            hasStripeIntegration: false,
          },
          {
            name: 'pro',
            displayName: 'Pro Plan',
            price: '59',
            clientLimit: 50,
            aiUsageLimit: 10,
            hasTimeClockAccess: true,
            hasStripeIntegration: false,
          },
          {
            name: 'business',
            displayName: 'Business Plan',
            price: '99',
            clientLimit: null,
            aiUsageLimit: null,
            hasTimeClockAccess: true,
            hasStripeIntegration: true,
          }
        ]
      };

      res.json(subscriptionInfo);
    } catch (error) {
      console.error('Get billing info error:', error);
      res.status(500).json({ error: 'Failed to get billing information' });
    }
  });

  app.post('/api/billing/upgrade', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { planName } = req.body;
      if (!planName || !['basic', 'pro', 'business'].includes(planName)) {
        return res.status(400).json({ error: 'Invalid plan name' });
      }

      // Update the contractor's plan
      const [updatedContractor] = await db
        .update(contractors)
        .set({
          plan: planName,
          subscriptionStatus: 'active',
          planStartDate: new Date(),
          planEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          updatedAt: new Date()
        })
        .where(eq(contractors.id, req.user.id))
        .returning();

      res.json({ 
        message: 'Plan updated successfully',
        contractor: {
          id: updatedContractor.id,
          plan: updatedContractor.plan,
          subscriptionStatus: updatedContractor.subscriptionStatus
        }
      });
    } catch (error) {
      console.error('Upgrade plan error:', error);
      res.status(500).json({ error: 'Failed to upgrade plan' });
    }
  });

  app.post('/api/billing/cancel', async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Mark subscription as cancelled but keep active until end of period
      const [updatedContractor] = await db
        .update(contractors)
        .set({
          subscriptionStatus: 'cancelled',
          updatedAt: new Date()
        })
        .where(eq(contractors.id, req.user.id))
        .returning();

      res.json({ 
        message: 'Subscription cancelled successfully',
        contractor: {
          id: updatedContractor.id,
          subscriptionStatus: updatedContractor.subscriptionStatus,
          planEndDate: updatedContractor.planEndDate
        }
      });
    } catch (error) {
      console.error('Cancel subscription error:', error);
      res.status(500).json({ error: 'Failed to cancel subscription' });
    }
  });

  // Client messaging routes - email-based to avoid database storage costs
  app.post("/api/clients/:clientId/send-message", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const { clientId } = req.params;
      const { subject, message } = req.body;
      const contractorId = req.user.id;

      // Get client details
      const client = await db.query.clients.findFirst({
        where: and(eq(clients.id, parseInt(clientId)), eq(clients.contractorId, contractorId))
      });

      if (!client || !client.email) {
        return res.status(404).json({ error: "Client not found or no email address" });
      }

      // Import email service
      const { emailService } = await import('./email-service');
      
      const success = await emailService.sendMessageToClient({
        to: client.email,
        from: req.user.email || 'noreply@remodra.com',
        subject: subject || 'Message from your contractor',
        html: message
      });

      if (success) {
        res.json({ success: true, message: "Message sent successfully" });
      } else {
        res.status(500).json({ error: "Failed to send message" });
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get client data for client portal
  app.get("/api/client-portal/:clientId/data", async (req, res) => {
    try {
      const { clientId } = req.params;

      // Get client with all related data including agent info and schedule
      const [client, clientProjects, clientEstimates, clientInvoices, clientEvents, clientAgent] = await Promise.all([
        db.query.clients.findFirst({
          where: eq(clients.id, parseInt(clientId))
        }),
        db.query.projects.findMany({
          where: eq(projects.clientId, parseInt(clientId))
        }),
        db.query.estimates.findMany({
          where: eq(estimates.clientId, parseInt(clientId)),
          with: { items: true }
        }),
        db.query.invoices.findMany({
          where: eq(invoices.clientId, parseInt(clientId)),
          with: { items: true }
        }),
        db.query.events.findMany({
          where: eq(events.clientId, parseInt(clientId))
        }),
        // Get agent assigned to this client (from the contractor who owns this client)
        db.query.clients.findFirst({
          where: eq(clients.id, parseInt(clientId)),
          with: {
            contractor: {
              with: {
                agents: true
              }
            }
          }
        })
      ]);

      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      // Get the primary agent for this client (first agent from the contractor)
      const primaryAgent = clientAgent?.contractor?.agents?.[0] || null;

      res.json({
        client: {
          id: client.id,
          name: `${client.firstName} ${client.lastName}`,
          firstName: client.firstName,
          lastName: client.lastName,
          email: client.email,
          phone: client.phone,
          address: client.address,
          city: client.city,
          state: client.state,
          zip: client.zip,
          joinDate: client.createdAt
        },
        projects: clientProjects,
        estimates: clientEstimates,
        invoices: clientInvoices,
        appointments: clientEvents,
        agent: primaryAgent ? {
          name: `${primaryAgent.firstName} ${primaryAgent.lastName}`,
          email: primaryAgent.email,
          phone: primaryAgent.phone,
          role: primaryAgent.role || 'Field Agent'
        } : null
      });

    } catch (error: any) {
      console.error("Error fetching client data:", error);
      res.status(500).json({ error: "Failed to fetch client data" });
    }
  });

  // AI Chat for Client Portal - only discusses client's specific data
  app.post("/api/client-portal/:clientId/ai-chat", async (req, res) => {
    try {
      const { clientId } = req.params;
      const { message, conversationHistory = [] } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Get client data
      const client = await db.query.clients.findFirst({
        where: eq(clients.id, parseInt(clientId))
      });

      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      // Get client's projects, estimates, invoices, appointments, and agent info
      const [clientProjects, clientEstimates, clientInvoices, clientEvents, clientAgent] = await Promise.all([
        db.query.projects.findMany({
          where: eq(projects.clientId, parseInt(clientId))
        }),
        db.query.estimates.findMany({
          where: eq(estimates.clientId, parseInt(clientId)),
          with: { items: true }
        }),
        db.query.invoices.findMany({
          where: eq(invoices.clientId, parseInt(clientId)),
          with: { items: true }
        }),
        db.query.events.findMany({
          where: eq(events.clientId, parseInt(clientId))
        }),
        // Get agent assigned to this client
        db.query.clients.findFirst({
          where: eq(clients.id, parseInt(clientId)),
          with: {
            contractor: {
              with: {
                agents: true
              }
            }
          }
        })
      ]);

      // Import OpenAI service
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      // Get the primary agent for this client and contractor info
      const primaryAgent = clientAgent?.contractor?.agents?.[0] || null;
      const contractorCompany = clientAgent?.contractor?.companyName || 'your contractor';

      // Create comprehensive context about client's data
      const clientContext = {
        client: {
          name: `${client.firstName} ${client.lastName}`,
          email: client.email,
          phone: client.phone,
          address: `${client.address || ''} ${client.city || ''} ${client.state || ''} ${client.zip || ''}`.trim()
        },
        contractor: {
          companyName: contractorCompany
        },
        agent: primaryAgent ? {
          name: `${primaryAgent.firstName} ${primaryAgent.lastName}`,
          email: primaryAgent.email,
          phone: primaryAgent.phone,
          role: primaryAgent.role || 'Field Agent'
        } : null,
        projects: clientProjects.map(p => ({
          title: p.title,
          description: p.description,
          status: p.status,
          budget: p.budget,
          startDate: p.startDate,
          endDate: p.endDate
        })),
        estimates: clientEstimates.map(e => ({
          id: e.id,
          estimateNumber: e.estimateNumber,
          title: e.title,
          status: e.status,
          total: e.total,
          createdAt: e.createdAt,
          items: e.items?.map(i => ({ description: i.description, quantity: i.quantity, rate: i.rate, amount: i.amount }))
        })),
        appointments: clientEvents.map(a => ({
          title: a.title,
          description: a.description,
          type: a.type,
          status: a.status,
          startTime: a.startTime,
          endTime: a.endTime,
          address: a.address,
          city: a.city,
          state: a.state,
          zip: a.zip
        })),
        invoices: clientInvoices.map(i => ({
          id: i.id,
          title: i.title,
          status: i.status,
          total: i.total,
          dueDate: i.dueDate,
          items: i.items?.map(item => ({ description: item.description, quantity: item.quantity, rate: item.rate, amount: item.amount }))
        }))
      };

      // Check if this is truly the first message (no conversation history)
      const isFirstMessage = conversationHistory.length === 0;

      const systemPrompt = `You're Sarah, a friendly customer service rep at ${contractorCompany} chatting with ${clientContext.client.name}.

Be warm, conversational, and respectful - like texting a helpful friend.

WHAT YOU CAN DISCUSS:
${JSON.stringify(clientContext, null, 2)}

${clientContext.agent ? `AGENT CONTACT: ${clientContext.agent.name} (${clientContext.agent.role}) - ${clientContext.agent.email}, ${clientContext.agent.phone}` : ''}

CONVERSATION RULES:
- ONLY greet with full introduction if no conversation history exists
- Continue the conversation naturally based on previous messages
- Keep responses SHORT (under 25 words)
- Be specific about their data
- If asked about other topics: "I can only help with your ${contractorCompany} projects!"

Examples:
- First contact: "Hi! I'm Sarah from ${contractorCompany}. I can help you with questions about your projects, estimates, and invoices."
- Follow-up: "Your roof estimate is scheduled for Friday at 2pm!"
- Rescheduling: "Sure! I can help you move that appointment. Let me check what's available."
- Contact info: "Need ${clientContext.agent?.name || 'your agent'}? Call ${clientContext.agent?.phone || 'them'}"

NEVER repeat the full greeting if conversation has already started!`;

      // Add human-like typing delay (1-3 seconds)
      const typingDelay = Math.floor(Math.random() * 2000) + 1000;
      await new Promise(resolve => setTimeout(resolve, typingDelay));

      // Build conversation messages including history
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: message }
      ];

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: messages,
        max_tokens: 50,
        temperature: 0.9
      });

      const aiResponse = response.choices[0].message.content;

      res.json({ 
        response: aiResponse,
        clientName: `${client.firstName} ${client.lastName}`
      });

    } catch (error: any) {
      console.error("Error in AI chat:", error);
      res.status(500).json({ error: "Failed to process message" });
    }
  });

  app.post("/api/clients/:clientId/send-notification", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const { clientId } = req.params;
      const { type, title, message } = req.body;
      const contractorId = req.user.id;

      // Get client details
      const client = await db.query.clients.findFirst({
        where: and(eq(clients.id, parseInt(clientId)), eq(clients.contractorId, contractorId))
      });

      if (!client || !client.email) {
        return res.status(404).json({ error: "Client not found or no email address" });
      }

      const { emailService } = await import('./email-service');
      
      let emailContent = message;
      let emailSubject = title;

      // Customize based on notification type
      switch (type) {
        case 'project_update':
          emailSubject = `Project Update: ${title}`;
          break;
        case 'estimate_ready':
          emailSubject = `Your Estimate is Ready: ${title}`;
          break;
        case 'invoice_generated':
          emailSubject = `New Invoice: ${title}`;
          break;
        case 'appointment_reminder':
          emailSubject = `Appointment Reminder: ${title}`;
          break;
        default:
          emailSubject = title || 'Notification from your contractor';
      }

      const success = await emailService.sendMessageToClient({
        to: client.email,
        from: req.user.email || 'noreply@remodra.com',
        subject: emailSubject,
        html: emailContent
      });

      if (success) {
        res.json({ success: true, message: "Notification sent successfully" });
      } else {
        res.status(500).json({ error: "Failed to send notification" });
      }
    } catch (error: any) {
      console.error("Error sending notification:", error);
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
