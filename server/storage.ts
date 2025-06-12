import { db } from "@db";
import { 
  contractors, 
  clients, 
  projects, 
  estimates, 
  estimateItems, 
  invoices, 
  invoiceItems, 
  events, 
  materials, 
  attachments, 
  followUps,
  propertyMeasurements,
  priceConfigurations,
  clientMessages,
  clientPortalTokens,
  messageReplies,
  ContractorInsert,
  ClientInsert,
  ProjectInsert,
  EstimateInsert,
  EstimateItemInsert,
  InvoiceInsert,
  InvoiceItemInsert,
  EventInsert,
  MaterialInsert,
  AttachmentInsert,
  FollowUpInsert,
  PropertyMeasurementInsert,
  PriceConfigurationInsert,
  ClientMessageInsert,
  MessageReplyInsert
} from "@shared/schema";
import { eq, and, asc, desc, like, or, isNull, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Contractors
  getContractor: (id: number) => Promise<any>;
  getContractorByEmail: (email: string) => Promise<any>;
  createContractor: (data: Omit<ContractorInsert, "id">) => Promise<any>;
  updateContractor: (id: number, data: Partial<ContractorInsert>) => Promise<any>;
  
  // Clients
  getClients: (contractorId: number) => Promise<any[]>;
  getClient: (id: number, contractorId: number) => Promise<any>;
  getClientById: (id: number, contractorId: number) => Promise<any>; // Método público para client con seguridad
  createClient: (data: Omit<ClientInsert, "id">) => Promise<any>;
  updateClient: (id: number, contractorId: number, data: Partial<ClientInsert>) => Promise<any>;
  deleteClient: (id: number, contractorId: number) => Promise<boolean>;
  
  // Projects
  getProjects: (contractorId: number) => Promise<any[]>;
  getProject: (id: number, contractorId: number) => Promise<any>;
  getProjectById: (id: number, contractorId: number) => Promise<any>; // Método público para projects con seguridad
  createProject: (data: Omit<ProjectInsert, "id">) => Promise<any>;
  createSimpleProject: (data: {
    contractorId: number;
    clientId: number;
    title: string;
    description?: string;
    status: string;
    budget?: number;
    startDate?: Date;
    notes?: string;
  }) => Promise<any>;
  updateProject: (id: number, contractorId: number, data: Partial<ProjectInsert>) => Promise<any>;
  deleteProject: (id: number, contractorId: number) => Promise<boolean>;
  
  // Estimates
  getEstimates: (contractorId: number) => Promise<any[]>;
  getEstimate: (id: number, contractorId: number) => Promise<any>;
  getEstimateById: (id: number, contractorId?: number) => Promise<any>; // Método público para clientes con seguridad
  createEstimate: (data: Omit<EstimateInsert, "id">) => Promise<any>;
  updateEstimate: (id: number, contractorId: number, data: Partial<EstimateInsert>) => Promise<any>;
  updateEstimateById: (id: number, data: Partial<EstimateInsert>) => Promise<any>; // Método público para clientes
  deleteEstimate: (id: number, contractorId: number) => Promise<boolean>;
  
  // Price Configurations
  getPriceConfigurations: (contractorId: number) => Promise<any[]>;
  getPriceConfiguration: (id: number, contractorId: number) => Promise<any>;
  getPriceConfigurationsByService: (contractorId: number, serviceType: string) => Promise<any[]>;
  getDefaultPriceConfiguration: (contractorId: number, serviceType: string) => Promise<any>;
  createPriceConfiguration: (data: Omit<PriceConfigurationInsert, "id">) => Promise<any>;
  updatePriceConfiguration: (id: number, contractorId: number, data: Partial<PriceConfigurationInsert>) => Promise<any>;
  deletePriceConfiguration: (id: number, contractorId: number) => Promise<boolean>;
  setDefaultPriceConfiguration: (id: number, contractorId: number, serviceType: string) => Promise<any>;
  
  // Estimate Items
  getEstimateItems: (estimateId: number, contractorId: number) => Promise<any[]>;
  createEstimateItem: (data: Omit<EstimateItemInsert, "id">) => Promise<any>;
  updateEstimateItem: (id: number, estimateId: number, contractorId: number, data: Partial<EstimateItemInsert>) => Promise<any>;
  deleteEstimateItem: (id: number, estimateId: number, contractorId: number) => Promise<boolean>;
  
  // Invoices
  getInvoices: (contractorId: number) => Promise<any[]>;
  getInvoice: (id: number, contractorId: number) => Promise<any>;
  getInvoiceById: (id: number, contractorId?: number) => Promise<any>; // Método público para clientes con seguridad
  createInvoice: (data: Omit<InvoiceInsert, "id">) => Promise<any>;
  updateInvoice: (id: number, contractorId: number, data: Partial<InvoiceInsert>) => Promise<any>;
  updateInvoiceById: (id: number, data: Partial<InvoiceInsert>) => Promise<any>; // Método público para clientes
  deleteInvoice: (id: number, contractorId: number) => Promise<boolean>;
  
  // Invoice Items
  getInvoiceItems: (invoiceId: number, contractorId: number) => Promise<any[]>;
  getInvoiceItemsById: (invoiceId: number, contractorId?: number) => Promise<any[]>; // Método público para clientes con seguridad
  createInvoiceItem: (data: Omit<InvoiceItemInsert, "id">) => Promise<any>;
  updateInvoiceItem: (id: number, invoiceId: number, contractorId: number, data: Partial<InvoiceItemInsert>) => Promise<any>;
  deleteInvoiceItem: (id: number, invoiceId: number, contractorId: number) => Promise<boolean>;
  
  // Events
  getEvents: (contractorId: number) => Promise<any[]>;
  getEvent: (id: number, contractorId: number) => Promise<any>;
  createEvent: (data: Omit<EventInsert, "id">) => Promise<any>;
  updateEvent: (id: number, contractorId: number, data: Partial<EventInsert>) => Promise<any>;
  deleteEvent: (id: number, contractorId: number) => Promise<boolean>;
  
  // Materials
  getMaterials: (contractorId: number) => Promise<any[]>;
  getMaterial: (id: number, contractorId: number) => Promise<any>;
  createMaterial: (data: Omit<MaterialInsert, "id">) => Promise<any>;
  updateMaterial: (id: number, contractorId: number, data: Partial<MaterialInsert>) => Promise<any>;
  deleteMaterial: (id: number, contractorId: number) => Promise<boolean>;
  
  // Attachments
  getAttachments: (contractorId: number, entityType: string, entityId: number) => Promise<any[]>;
  createAttachment: (data: Omit<AttachmentInsert, "id">) => Promise<any>;
  deleteAttachment: (id: number, contractorId: number) => Promise<boolean>;
  
  // Follow-ups
  getFollowUps: (contractorId: number) => Promise<any[]>;
  createFollowUp: (data: Omit<FollowUpInsert, "id">) => Promise<any>;
  updateFollowUp: (id: number, contractorId: number, data: Partial<FollowUpInsert>) => Promise<any>;
  deleteFollowUp: (id: number, contractorId: number) => Promise<boolean>;
  
  // Property Measurements
  getPropertyMeasurements: (contractorId: number) => Promise<any[]>;
  getPropertyMeasurement: (id: number, contractorId: number) => Promise<any>;
  createPropertyMeasurement: (data: Omit<PropertyMeasurementInsert, "id">) => Promise<any>;
  updatePropertyMeasurement: (id: number, contractorId: number, data: Partial<PropertyMeasurementInsert>) => Promise<any>;
  deletePropertyMeasurement: (id: number, contractorId: number) => Promise<boolean>;
  
  // Subscription Management
  getAllSubscriptionPlans: () => Promise<any[]>;
  getClientsByContractor: (contractorId: number) => Promise<any[]>;
  
  // Client Messages
  getClientMessages: (contractorId: number) => Promise<any[]>;
  getClientMessage: (id: number, contractorId: number) => Promise<any>;
  createClientMessage: (data: Omit<ClientMessageInsert, "id">) => Promise<any>;
  updateClientMessage: (id: number, contractorId: number, data: Partial<ClientMessageInsert>) => Promise<any>;
  markMessageAsRead: (id: number, contractorId: number) => Promise<any>;
  deleteClientMessage: (id: number, contractorId: number) => Promise<boolean>;
  
  // Session store for authentication
  sessionStore: session.Store;
}

class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // Configuración mejorada para manejar problemas de conexión
    this.sessionStore = new PostgresSessionStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === "production",
        // Configuración robusta para conexiones
        max: 10, // reducido para evitar sobrecarga 
        idleTimeoutMillis: 60000, // incrementado para ser más tolerante con conexiones lentas
        connectionTimeoutMillis: 10000, // tiempo mayor para establecer conexión
        keepAlive: true, // mantener la conexión activa
        keepAliveInitialDelayMillis: 10000, // delay inicial para keepAlive
      },
      createTableIfMissing: true,
      tableName: "session",
      // Mejorar el manejo de sesiones
      pruneSessionInterval: 300, // cada 5 minutos
      // Configuración para sesiones de larga duración
      ttl: 24 * 60 * 60 // sesiones válidas por 24 horas (en segundos)
    });
  }

  // Contractor methods
  async getContractor(id: number) {
    const result = await db.query.contractors.findFirst({
      where: eq(contractors.id, id)
    });
    
    if (!result) {
      return null;
    }
    
    // Don't send password to client
    const { password, ...user } = result;
    return user;
  }

  async getContractorByEmail(email: string) {
    return await db.query.contractors.findFirst({
      where: eq(contractors.email, email)
    });
  }

  async createContractor(data: Omit<ContractorInsert, "id">) {
    const [contractor] = await db.insert(contractors).values(data).returning();
    
    // Don't send password to client
    const { password, ...user } = contractor;
    return user;
  }

  async updateContractor(id: number, data: Partial<ContractorInsert>) {
    const [updated] = await db
      .update(contractors)
      .set(data)
      .where(eq(contractors.id, id))
      .returning();
    
    // Don't send password to client
    const { password, ...user } = updated;
    return user;
  }

  // Client methods
  async getClients(contractorId: number) {
    const clientsList = await db.query.clients.findMany({
      where: eq(clients.contractorId, contractorId),
      orderBy: asc(clients.lastName),
      columns: {
        id: true,
        contractorId: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zip: true,
        notes: true,
        cancellationHistory: true,
        createdAt: true
      },
      with: {
        projects: {
          columns: {
            id: true,
            title: true,
            status: true,
            budget: true,
            startDate: true,
            endDate: true
          },
          orderBy: desc(projects.createdAt)
        }
      }
    });
    
    return clientsList;
  }

  async getClient(id: number, contractorId: number) {
    return await db.query.clients.findFirst({
      where: and(
        eq(clients.id, id),
        eq(clients.contractorId, contractorId)
      ),
      columns: {
        id: true,
        contractorId: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zip: true,
        notes: true,
        cancellationHistory: true,
        createdAt: true
      },
      with: {
        projects: {
          columns: {
            id: true,
            title: true,
            status: true,
            description: true,
            budget: true,
            startDate: true,
            endDate: true,
            notes: true,
            createdAt: true
          },
          orderBy: desc(projects.createdAt)
        }
      }
    });
  }
  
  // Método para obtener un cliente por ID - ahora con verificación del contratista
  async getClientById(id: number, contractorId: number) {
    return await db.query.clients.findFirst({
      where: and(
        eq(clients.id, id),
        eq(clients.contractorId, contractorId)
      )
    });
  }

  async createClient(data: Omit<ClientInsert, "id">) {
    const [client] = await db.insert(clients).values(data).returning();
    return client;
  }

  async updateClient(id: number, contractorId: number, data: Partial<ClientInsert>) {
    const [updated] = await db
      .update(clients)
      .set(data)
      .where(
        and(
          eq(clients.id, id),
          eq(clients.contractorId, contractorId)
        )
      )
      .returning();
    return updated;
  }

  async deleteClient(id: number, contractorId: number) {
    const result = await db
      .delete(clients)
      .where(
        and(
          eq(clients.id, id),
          eq(clients.contractorId, contractorId)
        )
      );
    return result.rowCount! > 0;
  }

  // Project methods
  async getProjects(contractorId: number) {
    return await db.query.projects.findMany({
      where: eq(projects.contractorId, contractorId),
      orderBy: desc(projects.createdAt),
      columns: {
        id: true,
        contractorId: true,
        clientId: true,
        title: true,
        description: true,
        status: true,
        startDate: true,
        endDate: true,
        budget: true,
        notes: true,
        createdAt: true
      },
      with: {
        client: true
      }
    });
  }

  async getProject(id: number, contractorId: number) {
    return await db.query.projects.findFirst({
      where: and(
        eq(projects.id, id),
        eq(projects.contractorId, contractorId)
      ),
      columns: {
        id: true,
        contractorId: true,
        clientId: true,
        title: true,
        description: true,
        status: true,
        startDate: true,
        endDate: true,
        budget: true,
        notes: true,
        createdAt: true
      },
      with: {
        client: true
      }
    });
  }
  
  // Método para obtener un proyecto por ID - ahora con verificación de contratista
  async getProjectById(id: number, contractorId: number) {
    return await db.query.projects.findFirst({
      where: and(
        eq(projects.id, id),
        eq(projects.contractorId, contractorId)
      ),
      columns: {
        id: true,
        contractorId: true,
        clientId: true,
        title: true,
        description: true,
        status: true,
        startDate: true,
        endDate: true,
        budget: true,
        notes: true,
        createdAt: true
      },
      with: {
        client: true
      }
    });
  }

  async createProject(data: Omit<ProjectInsert, "id">) {
    const [project] = await db.insert(projects).values(data).returning();
    return project;
  }

  async createSimpleProject(data: {
    contractorId: number;
    clientId: number;
    title: string;
    description?: string;
    status: string;
    budget?: number;
    startDate?: Date;
    notes?: string;
  }) {
    // Create project using raw SQL to match actual database structure
    const result = await db.execute(sql`
      INSERT INTO projects (contractor_id, client_id, title, description, status, budget, start_date, notes, created_at) 
      VALUES (${data.contractorId}, ${data.clientId}, ${data.title}, ${data.description || null}, ${data.status}, ${data.budget || null}, ${data.startDate || null}, ${data.notes || null}, NOW()) 
      RETURNING *
    `);
    
    return result.rows[0];
  }

  async updateProject(id: number, contractorId: number, data: Partial<ProjectInsert>) {
    const [updated] = await db
      .update(projects)
      .set(data)
      .where(
        and(
          eq(projects.id, id),
          eq(projects.contractorId, contractorId)
        )
      )
      .returning();
    return updated;
  }

  async deleteProject(id: number, contractorId: number) {
    const result = await db
      .delete(projects)
      .where(
        and(
          eq(projects.id, id),
          eq(projects.contractorId, contractorId)
        )
      );
    return result.rowCount! > 0;
  }

  // Estimate methods
  async getEstimates(contractorId: number) {
    return await db.query.estimates.findMany({
      where: eq(estimates.contractorId, contractorId),
      orderBy: desc(estimates.createdAt),
      with: {
        client: true,
        project: {
          columns: {
            id: true,
            title: true,
            status: true,
            contractorId: true,
            clientId: true,
            description: true,
            budget: true,
            startDate: true,
            endDate: true,
            notes: true,
            createdAt: true
          }
        }
      }
    });
  }

  async getEstimate(id: number, contractorId: number) {
    return await db.query.estimates.findFirst({
      where: and(
        eq(estimates.id, id),
        eq(estimates.contractorId, contractorId)
      ),
      with: {
        client: true,
        project: {
          columns: {
            id: true,
            title: true,
            status: true,
            contractorId: true,
            clientId: true,
            description: true,
            budget: true,
            startDate: true,
            endDate: true,
            notes: true,
            createdAt: true
          }
        },
        items: true
      }
    });
  }
  
  // Método para obtener un estimado por ID con verificación de contratista
  async getEstimateById(id: number, contractorId?: number) {
    // Si se proporcionó un ID de contratista, verificamos que el estimado pertenezca a ese contratista
    if (contractorId) {
      return await db.query.estimates.findFirst({
        where: and(
          eq(estimates.id, id),
          eq(estimates.contractorId, contractorId)
        ),
        with: {
          client: true,
          contractor: true,
          project: {
            columns: {
              id: true,
              title: true,
              status: true,
              contractorId: true,
              clientId: true,
              description: true,
              budget: true,
              startDate: true,
              endDate: true,
              notes: true,
              createdAt: true
            }
          },
          items: true
        }
      });
    } else {
      // Si no se proporcionó ID de contratista, buscamos el estimado sin filtro adicional
      // (para uso en rutas públicas donde aún no conocemos el contratista)
      return await db.query.estimates.findFirst({
        where: eq(estimates.id, id),
        with: {
          client: true,
          contractor: true,
          project: {
            columns: {
              id: true,
              title: true,
              status: true,
              contractorId: true,
              clientId: true,
              description: true,
              budget: true,
              startDate: true,
              endDate: true,
              notes: true,
              createdAt: true
            }
          },
          items: true
        }
      });
    }
  }

  async createEstimate(data: Omit<EstimateInsert, "id">) {
    console.log("createEstimate -> Starting creation with data:", JSON.stringify(data, null, 2));
    try {
      // Validar que el cliente pertenece al contratista
      const client = await db.query.clients.findFirst({
        where: and(
          eq(clients.id, data.clientId),
          eq(clients.contractorId, data.contractorId)
        )
      });
      
      if (!client) {
        console.error(`createEstimate -> Error: Cliente ${data.clientId} no pertenece al contratista ${data.contractorId}`);
        throw new Error(`Client ${data.clientId} not found or does not belong to contractor ${data.contractorId}`);
      }
      
      // Si se proporciona projectId, validar que también pertenece al contratista
      if (data.projectId) {
        const project = await db.query.projects.findFirst({
          where: and(
            eq(projects.id, data.projectId),
            eq(projects.contractorId, data.contractorId)
          )
        });
        
        if (!project) {
          console.error(`createEstimate -> Error: Proyecto ${data.projectId} no pertenece al contratista ${data.contractorId}`);
          throw new Error(`Project ${data.projectId} not found or does not belong to contractor ${data.contractorId}`);
        }
      }
      
      // Extraer y eliminar la propiedad items si existe, ya que no es parte del modelo de la tabla
      const { items, ...estimateData } = data as any;
      
      // Server-side validation to prevent zero-total estimates
      const total = parseFloat(estimateData.total || "0");
      if (total <= 0) {
        console.error("createEstimate -> Error: Cannot create estimate with zero or negative total");
        throw new Error("Estimate total must be greater than $0.00");
      }
      
      console.log("createEstimate -> Validation passed, inserting into DB...");
      const [estimate] = await db.insert(estimates).values(estimateData).returning();
      console.log("createEstimate -> Estimate created successfully:", JSON.stringify(estimate, null, 2));
      
      // Si hay items en el parámetro, insertarlos también
      if (items && Array.isArray(items) && items.length > 0) {
        console.log(`createEstimate -> Procesando ${items.length} items...`);
        
        for (const item of items) {
          // Asegurarse de que las cantidades numéricas sean strings para la DB
          const itemData = {
            estimateId: estimate.id,
            description: item.description,
            quantity: String(item.quantity),
            unitPrice: String(item.unitPrice),
            amount: String(item.amount),
            notes: item.notes
          };
          
          console.log("createEstimate -> Insertando item:", JSON.stringify(itemData, null, 2));
          await db.insert(estimateItems).values(itemData);
        }
      }
      
      return estimate;
    } catch (error) {
      console.error("createEstimate -> Error:", error);
      throw error;
    }
  }

  async updateEstimate(id: number, contractorId: number, data: Partial<EstimateInsert>) {
    try {
      console.log("updateEstimate -> Iniciando actualización de estimado:", id);
      
      // Extraer items de data si existen
      const items = data.items;
      delete data.items;
      
      // Actualizar el estimado principal
      const [updated] = await db
        .update(estimates)
        .set(data)
        .where(
          and(
            eq(estimates.id, id),
            eq(estimates.contractorId, contractorId)
          )
        )
        .returning();
      
      // Si hay items en el parámetro, actualizar los items también
      if (items && Array.isArray(items)) {
        console.log(`updateEstimate -> Procesando ${items.length} items...`);
        
        // Primero eliminar todos los items existentes
        await db
          .delete(estimateItems)
          .where(eq(estimateItems.estimateId, id));
        
        // Luego insertar los nuevos items
        for (const item of items) {
          // Asegurarse de que las cantidades numéricas sean strings para la DB
          const itemData = {
            estimateId: id,
            description: item.description,
            quantity: String(item.quantity),
            unitPrice: String(item.unitPrice),
            amount: String(item.amount),
            notes: item.notes
          };
          
          console.log("updateEstimate -> Insertando item:", JSON.stringify(itemData, null, 2));
          await db.insert(estimateItems).values(itemData);
        }
      }
      
      // Retornar el estimado actualizado con sus items
      const updatedEstimate = await this.getEstimate(id, contractorId);
      return updatedEstimate;
    } catch (error) {
      console.error("updateEstimate -> Error:", error);
      throw error;
    }
  }

  // Método público para actualizar un estimado por ID sin verificar el contratista (para clientes)
  async updateEstimateById(id: number, data: Partial<EstimateInsert>) {
    try {
      console.log("updateEstimateById -> Iniciando actualización pública del estimado:", id);
      
      // Actualizar solo los campos permitidos para una acción de cliente
      // (status, clientSignature, notes)
      const allowedFields: Partial<EstimateInsert> = {};
      
      if (data.status) allowedFields.status = data.status;
      if (data.clientSignature) allowedFields.clientSignature = data.clientSignature;
      if (data.notes) allowedFields.notes = data.notes;
      
      // Actualizar el estimado
      const [updated] = await db
        .update(estimates)
        .set(allowedFields)
        .where(eq(estimates.id, id))
        .returning();
      
      // Retornar el estimado actualizado con sus items
      const updatedEstimate = await this.getEstimateById(id);
      return updatedEstimate;
    } catch (error) {
      console.error("updateEstimateById -> Error:", error);
      throw error;
    }
  }

  async deleteEstimate(id: number, contractorId: number) {
    try {
      // Verify the estimate belongs to the contractor
      const estimateCheck = await db.query.estimates.findFirst({
        where: and(
          eq(estimates.id, id),
          eq(estimates.contractorId, contractorId)
        )
      });
      
      if (!estimateCheck) {
        return false;
      }
      
      // First delete all estimate items related to this estimate
      await db
        .delete(estimateItems)
        .where(eq(estimateItems.estimateId, id));
      
      // Then delete the estimate itself
      const result = await db
        .delete(estimates)
        .where(
          and(
            eq(estimates.id, id),
            eq(estimates.contractorId, contractorId)
          )
        );
      
      return result.rowCount! > 0;
    } catch (error) {
      console.error("Error deleting estimate:", error);
      throw error;
    }
  }

  // Estimate Item methods
  async getEstimateItems(estimateId: number, contractorId: number) {
    // First verify the estimate belongs to the contractor
    const estimateCheck = await db.query.estimates.findFirst({
      where: and(
        eq(estimates.id, estimateId),
        eq(estimates.contractorId, contractorId)
      )
    });
    
    if (!estimateCheck) {
      return [];
    }
    
    return await db.query.estimateItems.findMany({
      where: eq(estimateItems.estimateId, estimateId)
    });
  }

  async createEstimateItem(data: Omit<EstimateItemInsert, "id">) {
    const [item] = await db.insert(estimateItems).values(data).returning();
    return item;
  }

  async updateEstimateItem(id: number, estimateId: number, contractorId: number, data: Partial<EstimateItemInsert>) {
    // First verify the estimate belongs to the contractor
    const estimateCheck = await db.query.estimates.findFirst({
      where: and(
        eq(estimates.id, estimateId),
        eq(estimates.contractorId, contractorId)
      )
    });
    
    if (!estimateCheck) {
      return null;
    }
    
    const [updated] = await db
      .update(estimateItems)
      .set(data)
      .where(
        and(
          eq(estimateItems.id, id),
          eq(estimateItems.estimateId, estimateId)
        )
      )
      .returning();
    return updated;
  }

  async deleteEstimateItem(id: number, estimateId: number, contractorId: number) {
    // First verify the estimate belongs to the contractor
    const estimateCheck = await db.query.estimates.findFirst({
      where: and(
        eq(estimates.id, estimateId),
        eq(estimates.contractorId, contractorId)
      )
    });
    
    if (!estimateCheck) {
      return false;
    }
    
    const result = await db
      .delete(estimateItems)
      .where(
        and(
          eq(estimateItems.id, id),
          eq(estimateItems.estimateId, estimateId)
        )
      );
    return result.rowCount! > 0;
  }

  // Invoice methods
  async getInvoices(contractorId: number) {
    return await db.query.invoices.findMany({
      where: eq(invoices.contractorId, contractorId),
      orderBy: desc(invoices.createdAt),
      with: {
        client: true,
        project: {
          columns: {
            id: true,
            title: true,
            status: true,
            contractorId: true,
            clientId: true,
            description: true,
            budget: true,
            startDate: true,
            endDate: true,
            notes: true,
            createdAt: true
          }
        }
      }
    });
  }

  async getInvoice(id: number, contractorId: number) {
    return await db.query.invoices.findFirst({
      where: and(
        eq(invoices.id, id),
        eq(invoices.contractorId, contractorId)
      ),
      with: {
        client: true,
        project: {
          columns: {
            id: true,
            title: true,
            status: true,
            contractorId: true,
            clientId: true,
            description: true,
            budget: true,
            startDate: true,
            endDate: true,
            notes: true,
            createdAt: true
          }
        },
        items: true,
        estimate: {
          columns: {
            id: true,
            estimateNumber: true,
            status: true,
            contractorId: true,
            clientId: true,
            projectId: true,
            subtotal: true,
            tax: true,
            discount: true,
            total: true,
            createdAt: true
          }
        }
      }
    });
  }
  
  // Método para obtener una factura por ID con verificación de contratista
  async getInvoiceById(id: number, contractorId?: number) {
    if (contractorId) {
      // Si se proporciona el ID del contratista, verificamos que la factura le pertenezca
      return await db.query.invoices.findFirst({
        where: and(
          eq(invoices.id, id),
          eq(invoices.contractorId, contractorId)
        ),
      with: {
        client: true,
        contractor: true,
        project: {
          columns: {
            id: true,
            title: true,
            status: true,
            contractorId: true,
            clientId: true,
            description: true,
            budget: true,
            startDate: true,
            endDate: true,
            notes: true,
            createdAt: true
          }
        },
        items: true,
        estimate: {
          columns: {
            id: true,
            estimateNumber: true,
            status: true,
            contractorId: true,
            clientId: true,
            projectId: true,
            subtotal: true,
            tax: true,
            discount: true,
            total: true,
            createdAt: true
          }
        }
      }
    });
    } else {
      // Si no se proporciona ID de contratista, buscamos la factura sin filtro adicional
      // (para uso en rutas públicas donde aún no conocemos el contratista)
      return await db.query.invoices.findFirst({
        where: eq(invoices.id, id),
        with: {
          client: true,
          contractor: true,
          project: {
            columns: {
              id: true,
              title: true,
              status: true,
              contractorId: true,
              clientId: true,
              description: true,
              budget: true,
              startDate: true,
              endDate: true,
              notes: true,
              createdAt: true
            }
          },
          items: true,
          estimate: {
            columns: {
              id: true,
              estimateNumber: true,
              status: true,
              contractorId: true,
              clientId: true,
              projectId: true,
              subtotal: true,
              tax: true,
              discount: true,
              total: true,
              createdAt: true
            }
          }
        }
      });
    }
  }

  async createInvoice(data: Omit<InvoiceInsert, "id">) {
    const [invoice] = await db.insert(invoices).values(data).returning();
    return invoice;
  }

  async updateInvoice(id: number, contractorId: number, data: Partial<InvoiceInsert>) {
    const [updated] = await db
      .update(invoices)
      .set(data)
      .where(
        and(
          eq(invoices.id, id),
          eq(invoices.contractorId, contractorId)
        )
      )
      .returning();
    return updated;
  }
  
  // Método público para actualizar una factura por ID - Solo ciertos campos permitidos
  // Este método es usado para el portal del cliente, donde no se autentica como contratista
  async updateInvoiceById(id: number, data: Partial<InvoiceInsert>) {
    try {
      // Primero obtenemos la factura para verificar que existe
      const invoice = await db.query.invoices.findFirst({
        where: eq(invoices.id, id)
      });
      
      if (!invoice) {
        return null;
      }
      
      // Solo permitimos actualizar campos específicos para el cliente
      const allowedFields: Partial<InvoiceInsert> = {};
      
      // Campos permitidos para actualización pública
      if (data.status) allowedFields.status = data.status;
      if (data.clientSignature) allowedFields.clientSignature = data.clientSignature;
      if (data.notes) allowedFields.notes = data.notes;
      
      // Actualizamos solo los campos permitidos
      const [updated] = await db
        .update(invoices)
        .set(allowedFields)
        .where(eq(invoices.id, id))
        .returning();
        
      return updated;
    } catch (error) {
      console.error("Error en updateInvoiceById:", error);
      return null;
    }
  }

  async deleteInvoice(id: number, contractorId: number) {
    try {
      // Verify the invoice belongs to the contractor
      const invoiceCheck = await db.query.invoices.findFirst({
        where: and(
          eq(invoices.id, id),
          eq(invoices.contractorId, contractorId)
        )
      });
      
      if (!invoiceCheck) {
        return false;
      }
      
      // First delete all invoice items related to this invoice
      await db
        .delete(invoiceItems)
        .where(eq(invoiceItems.invoiceId, id));
      
      // Then delete the invoice itself
      const result = await db
        .delete(invoices)
        .where(
          and(
            eq(invoices.id, id),
            eq(invoices.contractorId, contractorId)
          )
        );
      
      return result.rowCount! > 0;
    } catch (error) {
      console.error("Error deleting invoice:", error);
      throw error;
    }
  }

  // Invoice Item methods
  async getInvoiceItems(invoiceId: number, contractorId: number) {
    // First verify the invoice belongs to the contractor
    const invoiceCheck = await db.query.invoices.findFirst({
      where: and(
        eq(invoices.id, invoiceId),
        eq(invoices.contractorId, contractorId)
      )
    });
    
    if (!invoiceCheck) {
      return [];
    }
    
    return await db.query.invoiceItems.findMany({
      where: eq(invoiceItems.invoiceId, invoiceId)
    });
  }
  
  // Método para obtener items de factura por ID verificando primero que la factura pertenece al contratista
  async getInvoiceItemsById(invoiceId: number, contractorId?: number) {
    // Si se proporciona ID de contratista, verificamos que la factura le pertenezca
    if (contractorId) {
      // Primero verificamos que la factura pertenece al contratista
      const invoice = await db.query.invoices.findFirst({
        where: and(
          eq(invoices.id, invoiceId),
          eq(invoices.contractorId, contractorId)
        ),
        columns: {
          id: true
        }
      });
      
      // Si no encontramos la factura o no pertenece al contratista, devolvemos un arreglo vacío
      if (!invoice) {
        return [];
      }
    }
    
    // Si la factura existe y pertenece al contratista, o no se proporcionó ID de contratista,
    // entonces devolvemos los items (para uso en rutas públicas)
    return await db.query.invoiceItems.findMany({
      where: eq(invoiceItems.invoiceId, invoiceId)
    });
  }

  async createInvoiceItem(data: Omit<InvoiceItemInsert, "id">) {
    const [item] = await db.insert(invoiceItems).values(data).returning();
    return item;
  }

  async updateInvoiceItem(id: number, invoiceId: number, contractorId: number, data: Partial<InvoiceItemInsert>) {
    // First verify the invoice belongs to the contractor
    const invoiceCheck = await db.query.invoices.findFirst({
      where: and(
        eq(invoices.id, invoiceId),
        eq(invoices.contractorId, contractorId)
      )
    });
    
    if (!invoiceCheck) {
      return null;
    }
    
    const [updated] = await db
      .update(invoiceItems)
      .set(data)
      .where(
        and(
          eq(invoiceItems.id, id),
          eq(invoiceItems.invoiceId, invoiceId)
        )
      )
      .returning();
    return updated;
  }

  async deleteInvoiceItem(id: number, invoiceId: number, contractorId: number) {
    // First verify the invoice belongs to the contractor
    const invoiceCheck = await db.query.invoices.findFirst({
      where: and(
        eq(invoices.id, invoiceId),
        eq(invoices.contractorId, contractorId)
      )
    });
    
    if (!invoiceCheck) {
      return false;
    }
    
    const result = await db
      .delete(invoiceItems)
      .where(
        and(
          eq(invoiceItems.id, id),
          eq(invoiceItems.invoiceId, invoiceId)
        )
      );
    return result.rowCount! > 0;
  }

  // Events methods
  async getEvents(contractorId: number) {
    return await db.query.events.findMany({
      where: eq(events.contractorId, contractorId),
      orderBy: asc(events.startTime),
      with: {
        client: true,
        project: {
          columns: {
            id: true,
            title: true,
            status: true,
            contractorId: true,
            clientId: true,
            description: true,
            budget: true,
            startDate: true,
            endDate: true,
            notes: true,
            createdAt: true
          }
        },
        agent: true
      }
    });
  }

  async getEvent(id: number, contractorId: number) {
    return await db.query.events.findFirst({
      where: and(
        eq(events.id, id),
        eq(events.contractorId, contractorId)
      ),
      with: {
        client: true,
        project: {
          columns: {
            id: true,
            title: true,
            status: true,
            contractorId: true,
            clientId: true,
            description: true,
            budget: true,
            startDate: true,
            endDate: true,
            notes: true,
            createdAt: true
          }
        }
      }
    });
  }

  async createEvent(data: Omit<EventInsert, "id">) {
    const [event] = await db.insert(events).values(data).returning();
    return event;
  }

  async updateEvent(id: number, contractorId: number, data: Partial<EventInsert>) {
    const [updated] = await db
      .update(events)
      .set(data)
      .where(
        and(
          eq(events.id, id),
          eq(events.contractorId, contractorId)
        )
      )
      .returning();
    return updated;
  }

  async deleteEvent(id: number, contractorId: number) {
    const result = await db
      .delete(events)
      .where(
        and(
          eq(events.id, id),
          eq(events.contractorId, contractorId)
        )
      );
    return result.rowCount! > 0;
  }

  // Materials methods
  async getMaterials(contractorId: number) {
    return await db.query.materials.findMany({
      where: eq(materials.contractorId, contractorId),
      orderBy: asc(materials.name),
      with: {
        project: {
          columns: {
            id: true,
            title: true,
            status: true,
            contractorId: true,
            clientId: true,
            description: true,
            budget: true,
            startDate: true,
            endDate: true,
            notes: true,
            createdAt: true
          }
        }
      }
    });
  }

  async getMaterial(id: number, contractorId: number) {
    return await db.query.materials.findFirst({
      where: and(
        eq(materials.id, id),
        eq(materials.contractorId, contractorId)
      ),
      with: {
        project: {
          columns: {
            id: true,
            title: true,
            status: true,
            contractorId: true,
            clientId: true,
            description: true,
            budget: true,
            startDate: true,
            endDate: true,
            notes: true,
            createdAt: true
          }
        }
      }
    });
  }

  async createMaterial(data: Omit<MaterialInsert, "id">) {
    const [material] = await db.insert(materials).values(data).returning();
    return material;
  }

  async updateMaterial(id: number, contractorId: number, data: Partial<MaterialInsert>) {
    const [updated] = await db
      .update(materials)
      .set(data)
      .where(
        and(
          eq(materials.id, id),
          eq(materials.contractorId, contractorId)
        )
      )
      .returning();
    return updated;
  }

  async deleteMaterial(id: number, contractorId: number) {
    const result = await db
      .delete(materials)
      .where(
        and(
          eq(materials.id, id),
          eq(materials.contractorId, contractorId)
        )
      );
    return result.rowCount! > 0;
  }

  // Attachment methods
  async getAttachments(contractorId: number, entityType: string, entityId: number) {
    return await db.query.attachments.findMany({
      where: and(
        eq(attachments.contractorId, contractorId),
        eq(attachments.entityType, entityType),
        eq(attachments.entityId, entityId)
      ),
      orderBy: desc(attachments.uploadedAt)
    });
  }

  async createAttachment(data: Omit<AttachmentInsert, "id">) {
    const [attachment] = await db.insert(attachments).values(data).returning();
    return attachment;
  }

  async deleteAttachment(id: number, contractorId: number) {
    const result = await db
      .delete(attachments)
      .where(
        and(
          eq(attachments.id, id),
          eq(attachments.contractorId, contractorId)
        )
      );
    return result.rowCount! > 0;
  }

  // Follow-up methods
  async getFollowUps(contractorId: number) {
    return await db.query.followUps.findMany({
      where: eq(followUps.contractorId, contractorId),
      orderBy: asc(followUps.scheduledDate),
      with: {
        client: true
      }
    });
  }

  async createFollowUp(data: Omit<FollowUpInsert, "id">) {
    const [followUp] = await db.insert(followUps).values(data).returning();
    return followUp;
  }

  async updateFollowUp(id: number, contractorId: number, data: Partial<FollowUpInsert>) {
    const [updated] = await db
      .update(followUps)
      .set(data)
      .where(
        and(
          eq(followUps.id, id),
          eq(followUps.contractorId, contractorId)
        )
      )
      .returning();
    return updated;
  }

  async deleteFollowUp(id: number, contractorId: number) {
    const result = await db
      .delete(followUps)
      .where(
        and(
          eq(followUps.id, id),
          eq(followUps.contractorId, contractorId)
        )
      );
    return result.rowCount! > 0;
  }
  
  // Property Measurements methods
  async getPropertyMeasurements(contractorId: number) {
    return await db.query.propertyMeasurements.findMany({
      where: eq(propertyMeasurements.contractorId, contractorId),
      orderBy: desc(propertyMeasurements.createdAt),
      with: {
        client: true,
        project: true
      }
    });
  }

  async getPropertyMeasurement(id: number, contractorId: number) {
    return await db.query.propertyMeasurements.findFirst({
      where: and(
        eq(propertyMeasurements.id, id),
        eq(propertyMeasurements.contractorId, contractorId)
      ),
      with: {
        client: true,
        project: true
      }
    });
  }

  async createPropertyMeasurement(data: Omit<PropertyMeasurementInsert, "id">) {
    const [measurement] = await db.insert(propertyMeasurements).values(data).returning();
    return measurement;
  }

  async updatePropertyMeasurement(id: number, contractorId: number, data: Partial<PropertyMeasurementInsert>) {
    const [updated] = await db
      .update(propertyMeasurements)
      .set(data)
      .where(
        and(
          eq(propertyMeasurements.id, id),
          eq(propertyMeasurements.contractorId, contractorId)
        )
      )
      .returning();
    return updated;
  }

  async deletePropertyMeasurement(id: number, contractorId: number) {
    const result = await db
      .delete(propertyMeasurements)
      .where(
        and(
          eq(propertyMeasurements.id, id),
          eq(propertyMeasurements.contractorId, contractorId)
        )
      );
    return result.rowCount! > 0;
  }
  
  // Price Configurations methods
  async getPriceConfigurations(contractorId: number) {
    return await db.query.priceConfigurations.findMany({
      where: eq(priceConfigurations.contractorId, contractorId),
      orderBy: [
        asc(priceConfigurations.serviceType),
        desc(priceConfigurations.isDefault),
        asc(priceConfigurations.configName)
      ]
    });
  }

  async getPriceConfiguration(id: number, contractorId: number) {
    return await db.query.priceConfigurations.findFirst({
      where: and(
        eq(priceConfigurations.id, id),
        eq(priceConfigurations.contractorId, contractorId)
      )
    });
  }

  async getPriceConfigurationsByService(contractorId: number, serviceType: string) {
    return await db.query.priceConfigurations.findMany({
      where: and(
        eq(priceConfigurations.contractorId, contractorId),
        eq(priceConfigurations.serviceType, serviceType)
      ),
      orderBy: [
        desc(priceConfigurations.isDefault),
        asc(priceConfigurations.configName)
      ]
    });
  }

  async getDefaultPriceConfiguration(contractorId: number, serviceType: string) {
    return await db.query.priceConfigurations.findFirst({
      where: and(
        eq(priceConfigurations.contractorId, contractorId),
        eq(priceConfigurations.serviceType, serviceType),
        eq(priceConfigurations.isDefault, true)
      )
    });
  }

  async createPriceConfiguration(data: Omit<PriceConfigurationInsert, "id">) {
    // Si esta configuración se marca como predeterminada, primero asegúrese de que ninguna otra configuración para el mismo servicio sea predeterminada
    if (data.isDefault) {
      await db.update(priceConfigurations)
        .set({ isDefault: false })
        .where(
          and(
            eq(priceConfigurations.contractorId, data.contractorId),
            eq(priceConfigurations.serviceType, data.serviceType),
            eq(priceConfigurations.isDefault, true)
          )
        );
    }
    
    const [config] = await db.insert(priceConfigurations).values(data).returning();
    return config;
  }

  async updatePriceConfiguration(id: number, contractorId: number, data: Partial<PriceConfigurationInsert>) {
    // Si esta configuración se marca como predeterminada, primero asegúrese de que ninguna otra configuración para el mismo servicio sea predeterminada
    if (data.isDefault) {
      const currentConfig = await this.getPriceConfiguration(id, contractorId);
      if (currentConfig) {
        await db.update(priceConfigurations)
          .set({ isDefault: false })
          .where(
            and(
              eq(priceConfigurations.contractorId, contractorId),
              eq(priceConfigurations.serviceType, currentConfig.serviceType),
              eq(priceConfigurations.isDefault, true),
              sql`${priceConfigurations.id} != ${id}`
            )
          );
      }
    }
    
    const [updated] = await db
      .update(priceConfigurations)
      .set(data)
      .where(
        and(
          eq(priceConfigurations.id, id),
          eq(priceConfigurations.contractorId, contractorId)
        )
      )
      .returning();
    return updated;
  }

  async deletePriceConfiguration(id: number, contractorId: number) {
    const result = await db
      .delete(priceConfigurations)
      .where(
        and(
          eq(priceConfigurations.id, id),
          eq(priceConfigurations.contractorId, contractorId)
        )
      );
    return result.rowCount! > 0;
  }

  async setDefaultPriceConfiguration(id: number, contractorId: number, serviceType: string) {
    // Primero, eliminar el predeterminado actual
    await db.update(priceConfigurations)
      .set({ isDefault: false })
      .where(
        and(
          eq(priceConfigurations.contractorId, contractorId),
          eq(priceConfigurations.serviceType, serviceType),
          eq(priceConfigurations.isDefault, true)
        )
      );
    
    // Luego, establecer el nuevo predeterminado
    const [updated] = await db
      .update(priceConfigurations)
      .set({ isDefault: true })
      .where(
        and(
          eq(priceConfigurations.id, id),
          eq(priceConfigurations.contractorId, contractorId)
        )
      )
      .returning();
    
    return updated;
  }

  // Subscription Management Methods
  async getAllSubscriptionPlans() {
    // Return hardcoded plan definitions since we're using static plans
    return [
      {
        id: 1,
        planName: 'basic',
        displayName: 'Basic Plan',
        priceMonthly: '29.00',
        clientLimit: 10,
        aiUsageLimit: 0,
        hasTimeClockAccess: false,
        hasStripeIntegration: false,
        hasCustomPortal: false,
        hasBrandedPortal: false,
        features: ['Client Management', 'Basic Estimates', 'Project Tracking'],
        isActive: true
      },
      {
        id: 2,
        planName: 'pro',
        displayName: 'Pro Plan',
        priceMonthly: '59.00',
        clientLimit: 50,
        aiUsageLimit: 10,
        hasTimeClockAccess: true,
        hasStripeIntegration: false,
        hasCustomPortal: true,
        hasBrandedPortal: false,
        features: ['Everything in Basic', 'AI Cost Analysis', 'Time Clock', 'Advanced Reports'],
        isActive: true
      },
      {
        id: 3,
        planName: 'business',
        displayName: 'Business Plan',
        priceMonthly: '99.00',
        clientLimit: null,
        aiUsageLimit: null,
        hasTimeClockAccess: true,
        hasStripeIntegration: true,
        hasCustomPortal: true,
        hasBrandedPortal: true,
        features: ['Everything in Pro', 'Unlimited Clients', 'Unlimited AI', 'Stripe Integration', 'Branded Portal'],
        isActive: true
      }
    ];
  }

  async getClientsByContractor(contractorId: number) {
    return await db.query.clients.findMany({
      where: eq(clients.contractorId, contractorId)
    });
  }

  async getClientCountByContractor(contractorId: number) {
    const clientList = await this.getClientsByContractor(contractorId);
    return clientList.length;
  }

  async getAiUsageCount(contractorId: number, month: string) {
    // For now, return 0 since AI usage tracking is being implemented
    return 0;
  }

  async updateContractorSubscription(contractorId: number, subscriptionData: any) {
    const [updated] = await db
      .update(contractors)
      .set({
        plan: subscriptionData.plan,
        subscriptionStatus: subscriptionData.status,
        stripeCustomerId: subscriptionData.stripeCustomerId,
        stripeSubscriptionId: subscriptionData.stripeSubscriptionId,
        planStartDate: subscriptionData.planStartDate,
        planEndDate: subscriptionData.planEndDate,
        updatedAt: new Date()
      })
      .where(eq(contractors.id, contractorId))
      .returning();
    return updated;
  }

  // Client Messages implementation
  async getClientMessages(contractorId: number) {
    return await db.query.clientMessages.findMany({
      where: eq(clientMessages.contractorId, contractorId),
      with: {
        client: true
      },
      orderBy: desc(clientMessages.createdAt)
    });
  }

  async getClientMessage(id: number, contractorId: number) {
    return await db.query.clientMessages.findFirst({
      where: and(
        eq(clientMessages.id, id),
        eq(clientMessages.contractorId, contractorId)
      ),
      with: {
        client: true
      }
    });
  }

  async createClientMessage(data: Omit<ClientMessageInsert, "id">) {
    const [message] = await db.insert(clientMessages).values(data).returning();
    return message;
  }

  async updateClientMessage(id: number, contractorId: number, data: Partial<ClientMessageInsert>) {
    const [updated] = await db
      .update(clientMessages)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(clientMessages.id, id),
          eq(clientMessages.contractorId, contractorId)
        )
      )
      .returning();
    return updated;
  }

  async markMessageAsRead(id: number, contractorId: number) {
    const [updated] = await db
      .update(clientMessages)
      .set({ 
        isRead: true, 
        readAt: new Date(),
        updatedAt: new Date()
      })
      .where(
        and(
          eq(clientMessages.id, id),
          eq(clientMessages.contractorId, contractorId)
        )
      )
      .returning();
    return updated;
  }

  async deleteClientMessage(id: number, contractorId: number) {
    const result = await db
      .delete(clientMessages)
      .where(
        and(
          eq(clientMessages.id, id),
          eq(clientMessages.contractorId, contractorId)
        )
      );
    return result.rowCount! > 0;
  }
}

export const storage = new DatabaseStorage();
