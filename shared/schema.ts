import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, uuid, date } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Sessions table for authentication
export const sessions = pgTable("session", {
  sid: text("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire", { mode: "date" }).notNull()
});

// Contractors (users of the platform)
export const contractors = pgTable("contractors", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  username: text("username").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  companyName: text("company_name").notNull(),
  phone: text("phone"),
  website: text("website"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  country: text("country").default("USA"),
  role: text("role").default("contractor").notNull(),
  plan: text("plan").default("basic").notNull(),
  // Subscription and billing fields
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status").default("active").notNull(), // active, cancelled, past_due, incomplete
  planStartDate: timestamp("plan_start_date").defaultNow(),
  planEndDate: timestamp("plan_end_date"),
  // Usage tracking for plan limits
  currentClientCount: integer("current_client_count").default(0).notNull(),
  aiUsageThisMonth: integer("ai_usage_this_month").default(0).notNull(),
  aiUsageResetDate: timestamp("ai_usage_reset_date").defaultNow().notNull(),
  settings: jsonb("settings").default('{}'),
  language: text("language").default("en").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Agents (field representatives working for contractors)
export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  contractorId: integer("contractor_id").references(() => contractors.id).notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone").notNull(),
  employeeId: text("employee_id"),
  role: text("role").default("field_agent").notNull(), // field_agent, senior_agent, lead_estimator
  isActive: boolean("is_active").default(true).notNull(),
  specialties: jsonb("specialties").default('[]'), // ['roofing', 'fencing', 'siding', etc.]
  colorCode: text("color_code").default("#3B82F6"), // Hex color for calendar display
  hourlyRate: decimal("hourly_rate", { precision: 8, scale: 2 }),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }), // percentage
  hireDate: date("hire_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Clients (belonging to contractors)
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  contractorId: integer("contractor_id").references(() => contractors.id).notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  notes: text("notes"), // General notes about the client
  cancellationHistory: text("cancellation_history"), // Separate field for cancellation records
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Projects
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  contractorId: integer("contractor_id").references(() => contractors.id).notNull(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"), // pending, in_progress, on_hold, completed, cancelled
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  budget: decimal("budget", { precision: 10, scale: 2 }),
  notes: text("notes"),
  // New fields for the workers section
  workerInstructions: text("worker_instructions"),
  workerNotes: text("worker_notes"),
  materialsNeeded: jsonb("materials_needed").default('[]'),
  safetyRequirements: text("safety_requirements"),
  // New fields for the AI section
  aiProjectSummary: text("ai_project_summary"),
  aiAnalysis: jsonb("ai_analysis").default('{}'),
  aiGeneratedDescription: text("ai_generated_description"),
  aiSharingSettings: jsonb("ai_sharing_settings").default('{"installers": false, "clients": true, "estimators": true}'),
  lastAiUpdate: timestamp("last_ai_update"),
  position: integer("position").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Estimates
export const estimates = pgTable("estimates", {
  id: serial("id").primaryKey(),
  contractorId: integer("contractor_id").references(() => contractors.id).notNull(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  projectId: integer("project_id").references(() => projects.id),
  agentId: integer("agent_id").references(() => agents.id), // Which agent is handling this estimate
  estimateNumber: text("estimate_number").notNull(),
  issueDate: timestamp("issue_date").notNull().defaultNow(),
  expiryDate: timestamp("expiry_date"),
  status: text("status").notNull().default("draft"), // draft, sent, accepted, rejected, expired, converted
  estimateType: text("estimate_type").notNull().default("agent"), // office, agent
  appointmentDate: timestamp("appointment_date"), // When the agent appointment is scheduled
  appointmentDuration: integer("appointment_duration").default(60), // Duration in minutes
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull().default("0"),
  discount: decimal("discount", { precision: 10, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  terms: text("terms"),
  notes: text("notes"),
  clientSignature: text("client_signature"),
  contractorSignature: text("contractor_signature"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Estimate line items
export const estimateItems = pgTable("estimate_items", {
  id: serial("id").primaryKey(),
  estimateId: integer("estimate_id").references(() => estimates.id).notNull(),
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes")
});

// Invoices
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  contractorId: integer("contractor_id").references(() => contractors.id).notNull(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  projectId: integer("project_id").references(() => projects.id),
  estimateId: integer("estimate_id").references(() => estimates.id),
  invoiceNumber: text("invoice_number").notNull(),
  issueDate: timestamp("issue_date").notNull().defaultNow(),
  dueDate: timestamp("due_date").notNull(),
  status: text("status").notNull().default("pending"), // pending, paid, overdue, partially_paid, cancelled
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull().default("0"),
  discount: decimal("discount", { precision: 10, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).notNull().default("0"),
  terms: text("terms"),
  notes: text("notes"),
  clientSignature: text("client_signature"),
  contractorSignature: text("contractor_signature"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Invoice line items
export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").references(() => invoices.id).notNull(),
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes")
});

// Events/Calendar
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  contractorId: integer("contractor_id").references(() => contractors.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  type: text("type").notNull(), // meeting, site-visit, delivery, estimate, invoice, other
  status: text("status").notNull().default("pending"), // pending, confirmed, completed, cancelled
  clientId: integer("client_id").references(() => clients.id),
  projectId: integer("project_id").references(() => projects.id),
  agentId: integer("agent_id").references(() => agents.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Materials/Supplies
export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  contractorId: integer("contractor_id").references(() => contractors.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  supplier: text("supplier"),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  quantity: decimal("quantity", { precision: 10, scale: 2 }),
  unit: text("unit"), // e.g., each, ft, m, sq.ft, etc.
  orderNumber: text("order_number"),
  status: text("status").notNull().default("in_stock"), // in_stock, ordered, delivered, out_of_stock
  projectId: integer("project_id").references(() => projects.id),
  serviceType: text("service_type"), // deck, fence, roof, siding, windows, gutters
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Attachments for projects, clients, etc.
export const attachments = pgTable("attachments", {
  id: serial("id").primaryKey(),
  contractorId: integer("contractor_id").references(() => contractors.id).notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size").notNull(),
  entityType: text("entity_type").notNull(), // client, project, estimate, invoice, material
  entityId: integer("entity_id").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  description: text("description")
});

// AI Follow-up Agent settings and messages
export const followUps = pgTable("follow_ups", {
  id: serial("id").primaryKey(),
  contractorId: integer("contractor_id").references(() => contractors.id).notNull(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  type: text("type").notNull(), // estimate, invoice, appointment, general
  status: text("status").notNull().default("pending"), // pending, sent, responded, completed
  entityId: integer("entity_id"), // ID of the estimate, invoice, etc.
  entityType: text("entity_type"), // estimate, invoice, appointment
  message: text("message").notNull(),
  scheduledDate: timestamp("scheduled_date").notNull(),
  sentDate: timestamp("sent_date"),
  responseDate: timestamp("response_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Property measurements
export const propertyMeasurements = pgTable("property_measurements", {
  id: serial("id").primaryKey(),
  contractorId: integer("contractor_id").references(() => contractors.id).notNull(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  projectId: integer("project_id").references(() => projects.id),
  serviceType: text("service_type").notNull(), // deck, fence, roof, siding, windows, gutters
  
  // Common measurements
  totalSquareFeet: decimal("total_square_feet", { precision: 10, scale: 2 }),
  totalLinearFeet: decimal("total_linear_feet", { precision: 10, scale: 2 }),
  notes: text("notes"),
  
  // Service-specific measurements (stored as JSON)
  measurementData: jsonb("measurement_data"), // Store different measurements based on service type
  
  // Image or diagram links
  diagramUrl: text("diagram_url"),
  
  measuredAt: timestamp("measured_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Service pricing configuration - simplified schema
export const servicePricing = pgTable("service_pricing", {
  id: serial("id").primaryKey(),
  contractorId: integer("contractor_id").references(() => contractors.id).notNull(),
  
  // Service information
  name: text("name").notNull(),
  serviceType: text("service_type").notNull(), // fence, roof, gutters, windows, etc.
  
  // Labor rate configuration
  laborRate: decimal("labor_rate", { precision: 10, scale: 2 }).notNull(),
  
  // Unit of measure
  unit: text("unit").default("ft").notNull(), // ft, sqft, unit, etc.
  laborCalculationMethod: text("labor_calculation_method").default("by_length").notNull(), // by_length, by_area, fixed
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const servicePricingSchema = createSelectSchema(servicePricing);
export type ServicePricing = z.infer<typeof servicePricingSchema>;
export const servicePricingInsertSchema = createInsertSchema(servicePricing);
export type ServicePricingInsert = z.infer<typeof servicePricingInsertSchema>;

// NUEVO: Materiales con precios estandarizados por contratista
export const materialPricing = pgTable("material_pricing", {
  id: serial("id").primaryKey(),
  contractorId: integer("contractor_id").references(() => contractors.id).notNull(),
  
  // Datos de material
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // fence, roof, etc. (para asociar con tipo de servicio)
  
  // Campos de identificación adicionales para mapear a los materiales del estimado
  code: text("code"), // Código original (wood_fence, vinyl_fence, etc.)
  materialId: text("material_id"), // ID alternativo para búsqueda
  idString: text("id_string"), // Otra forma de guardar el ID como string
  
  // Precios y unidades
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull(), // ft, sqft, box, unit, etc.
  
  // Metadatos
  supplier: text("supplier"),
  status: text("status").default("active").notNull(), // active, inactive
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Configuración de precios global por contratista (configuración general)
export const priceConfigurations = pgTable("price_configurations", {
  id: serial("id").primaryKey(),
  contractorId: integer("contractor_id").references(() => contractors.id).notNull(),
  
  // Service identification
  serviceType: text("service_type").notNull(), // deck, fence, roof, siding, windows, gutters, etc.
  configName: text("config_name").notNull(), // Friendly name of the configuration
  
  // Base prices per unit of measurement
  baseLinearFootPrice: decimal("base_linear_foot_price", { precision: 10, scale: 2 }),
  baseSquareFootPrice: decimal("base_square_foot_price", { precision: 10, scale: 2 }),
  baseUnitPrice: decimal("base_unit_price", { precision: 10, scale: 2 }),
  
  // Cost and margins configuration
  laborHourlyRate: decimal("labor_hourly_rate", { precision: 10, scale: 2 }).notNull(),
  materialCostMultiplier: decimal("material_cost_multiplier", { precision: 5, scale: 2 }).default("1.00").notNull(),
  overheadPercentage: decimal("overhead_percentage", { precision: 5, scale: 2 }).notNull(),
  profitMarginPercentage: decimal("profit_margin_percentage", { precision: 5, scale: 2 }).notNull(),
  
  // Multiplicadores por dificultad (JSON que almacena valores para fácil, medio, complejo)
  difficultyMultipliers: jsonb("difficulty_multipliers").default('{"easy": 0.8, "medium": 1.0, "complex": 1.3}'),
  
  // Metadatos
  isDefault: boolean("is_default").default(false).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Define relations
export const contractorsRelations = relations(contractors, ({ many }) => ({
  agents: many(agents),
  clients: many(clients),
  projects: many(projects),
  estimates: many(estimates),
  invoices: many(invoices),
  events: many(events),
  materials: many(materials),
  attachments: many(attachments),
  followUps: many(followUps),
  propertyMeasurements: many(propertyMeasurements),
  priceConfigurations: many(priceConfigurations),
  servicePricing: many(servicePricing),
  materialPricing: many(materialPricing),
  achievementProgress: many(contractorAchievements),
  streaks: many(contractorStreaks),
  // Referencia a Google Sheets eliminada
}));

export const agentsRelations = relations(agents, ({ one, many }) => ({
  contractor: one(contractors, { fields: [agents.contractorId], references: [contractors.id] }),
  estimates: many(estimates),
  events: many(events)
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  contractor: one(contractors, { fields: [clients.contractorId], references: [contractors.id] }),
  projects: many(projects),
  estimates: many(estimates),
  invoices: many(invoices),
  events: many(events),
  followUps: many(followUps),
  propertyMeasurements: many(propertyMeasurements)
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  contractor: one(contractors, { fields: [projects.contractorId], references: [contractors.id] }),
  client: one(clients, { fields: [projects.clientId], references: [clients.id] }),
  estimates: many(estimates),
  invoices: many(invoices),
  events: many(events),
  materials: many(materials),
  attachments: many(attachments),
  propertyMeasurements: many(propertyMeasurements)
}));

export const estimatesRelations = relations(estimates, ({ one, many }) => ({
  contractor: one(contractors, { fields: [estimates.contractorId], references: [contractors.id] }),
  client: one(clients, { fields: [estimates.clientId], references: [clients.id] }),
  project: one(projects, { fields: [estimates.projectId], references: [projects.id] }),
  agent: one(agents, { fields: [estimates.agentId], references: [agents.id] }),
  items: many(estimateItems),
  invoices: many(invoices),
  attachments: many(attachments)
}));

export const estimateItemsRelations = relations(estimateItems, ({ one }) => ({
  estimate: one(estimates, { fields: [estimateItems.estimateId], references: [estimates.id] })
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  contractor: one(contractors, { fields: [invoices.contractorId], references: [contractors.id] }),
  client: one(clients, { fields: [invoices.clientId], references: [clients.id] }),
  project: one(projects, { fields: [invoices.projectId], references: [projects.id] }),
  estimate: one(estimates, { fields: [invoices.estimateId], references: [estimates.id] }),
  items: many(invoiceItems),
  attachments: many(attachments)
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, { fields: [invoiceItems.invoiceId], references: [invoices.id] })
}));

export const eventsRelations = relations(events, ({ one }) => ({
  contractor: one(contractors, { fields: [events.contractorId], references: [contractors.id] }),
  client: one(clients, { fields: [events.clientId], references: [clients.id] }),
  project: one(projects, { fields: [events.projectId], references: [projects.id] }),
  agent: one(agents, { fields: [events.agentId], references: [agents.id] })
}));

export const materialsRelations = relations(materials, ({ one, many }) => ({
  contractor: one(contractors, { fields: [materials.contractorId], references: [contractors.id] }),
  project: one(projects, { fields: [materials.projectId], references: [projects.id] }),
  attachments: many(attachments)
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  contractor: one(contractors, { fields: [attachments.contractorId], references: [contractors.id] })
}));

export const followUpsRelations = relations(followUps, ({ one }) => ({
  contractor: one(contractors, { fields: [followUps.contractorId], references: [contractors.id] }),
  client: one(clients, { fields: [followUps.clientId], references: [clients.id] })
}));

// Google Sheets Integration - Eliminada

// Tablas para el sistema de logros (Achievements)
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // Código único para identificar el logro
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // cliente, proyecto, estimación, factura, etc.
  points: integer("points").notNull().default(10),
  icon: text("icon").notNull(), // Nombre del icono de lucide-react o URL a un SVG personalizado
  requiredCount: integer("required_count").notNull().default(1), // Cantidad requerida para completar este logro
  level: text("level").notNull().default("bronze"), // bronze, silver, gold, platinum
  badgeColor: text("badge_color").notNull().default("#CD7F32"), // Color hexadecimal para la insignia
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const contractorAchievements = pgTable("contractor_achievements", {
  id: serial("id").primaryKey(),
  contractorId: integer("contractor_id").references(() => contractors.id).notNull(),
  achievementId: integer("achievement_id").references(() => achievements.id).notNull(),
  progress: integer("progress").notNull().default(0), // Progreso actual hacia el logro
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  notified: boolean("notified").notNull().default(false), // Si se ha mostrado la notificación
  unlockedReward: boolean("unlocked_reward").notNull().default(false), // Si se ha reclamado la recompensa
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const achievementRewards = pgTable("achievement_rewards", {
  id: serial("id").primaryKey(),
  achievementId: integer("achievement_id").references(() => achievements.id).notNull(),
  type: text("type").notNull(), // discount, feature, credit, badge
  description: text("description").notNull(),
  value: text("value").notNull(), // Puede ser un porcentaje, créditos, o nombre de característica
  duration: integer("duration"), // Duración en días (para descuentos temporales)
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const contractorStreaks = pgTable("contractor_streaks", {
  id: serial("id").primaryKey(),
  contractorId: integer("contractor_id").references(() => contractors.id).notNull(),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastActivityDate: date("last_activity_date"),
  level: integer("level").notNull().default(1),
  xp: integer("xp").notNull().default(0),
  nextLevelXp: integer("next_level_xp").notNull().default(100),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Achievement relations
export const achievementsRelations = relations(achievements, ({ many }) => ({
  contractorAchievements: many(contractorAchievements),
  rewards: many(achievementRewards)
}));

export const contractorAchievementsRelations = relations(contractorAchievements, ({ one }) => ({
  contractor: one(contractors, { fields: [contractorAchievements.contractorId], references: [contractors.id] }),
  achievement: one(achievements, { fields: [contractorAchievements.achievementId], references: [achievements.id] })
}));

export const achievementRewardsRelations = relations(achievementRewards, ({ one }) => ({
  achievement: one(achievements, { fields: [achievementRewards.achievementId], references: [achievements.id] })
}));

export const contractorStreaksRelations = relations(contractorStreaks, ({ one }) => ({
  contractor: one(contractors, { fields: [contractorStreaks.contractorId], references: [contractors.id] })
}));

// Property measurements relations
export const propertyMeasurementsRelations = relations(propertyMeasurements, ({ one }) => ({
  contractor: one(contractors, { fields: [propertyMeasurements.contractorId], references: [contractors.id] }),
  client: one(clients, { fields: [propertyMeasurements.clientId], references: [clients.id] }),
  project: one(projects, { fields: [propertyMeasurements.projectId], references: [projects.id] })
}));

// Price configurations relations
export const priceConfigurationsRelations = relations(priceConfigurations, ({ one }) => ({
  contractor: one(contractors, { fields: [priceConfigurations.contractorId], references: [contractors.id] })
}));

// Define schemas for validation
export const contractorInsertSchema = createInsertSchema(contractors, {
  firstName: (schema) => schema.min(2, "First name must be at least 2 characters"),
  lastName: (schema) => schema.min(2, "Last name must be at least 2 characters"),
  email: (schema) => schema.email("Must provide a valid email"),
  password: (schema) => schema.min(6, "Password must be at least 6 characters"),
  companyName: (schema) => schema.min(2, "Company name must be at least 2 characters"),
  language: (schema) => schema.refine(val => ["en", "es", "fr", "pt"].includes(val), "Language must be one of: en, es, fr, pt")
});

// Schema for Super Admin to create contractors with extended fields
export const contractorCreateSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Must provide a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  phone: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  country: z.string().default("USA"),
  plan: z.enum(["free", "basic", "professional", "premium", "enterprise"]).default("basic"),
  // Configuración de servicios y preferencias
  serviceTypes: z.array(z.string()).min(1, "Select at least one service type").default(["deck"]),
  allowClientPortal: z.boolean().default(true),
  useEstimateTemplates: z.boolean().default(true),
  enabledAIAssistant: z.boolean().default(true),
  primaryColor: z.string().default("#2563eb"),
  logoUrl: z.string().optional().nullable(),
  companyDescription: z.string().optional().nullable()
});

export const clientInsertSchema = createInsertSchema(clients, {
  firstName: (schema) => schema.min(2, "First name must be at least 2 characters"),
  lastName: (schema) => schema.min(2, "Last name must be at least 2 characters"),
  email: (schema) => schema.email("Must provide a valid email").nullable().optional()
});

export const projectInsertSchema = createInsertSchema(projects, {
  title: (schema) => schema.min(3, "Title must be at least 3 characters"),
  startDate: (schema) => schema.optional(),
  endDate: (schema) => schema.optional()
});

// Extender el esquema de inserción de estimados para permitir ítems de línea
export const estimateInsertSchema = createInsertSchema(estimates).extend({
  items: z.array(
    z.object({
      description: z.string(),
      quantity: z.number().or(z.string().transform(val => parseFloat(val))),
      unitPrice: z.number().or(z.string().transform(val => parseFloat(val))),
      amount: z.number().or(z.string().transform(val => parseFloat(val))),
      notes: z.string().optional()
    })
  ).optional()
});
export const estimateItemInsertSchema = createInsertSchema(estimateItems);
export const invoiceInsertSchema = createInsertSchema(invoices);
export const invoiceItemInsertSchema = createInsertSchema(invoiceItems);
// Esquema personalizado para eventos en lugar de usar createInsertSchema
export const eventInsertSchema = z.object({
  contractorId: z.number(),
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  type: z.enum(["meeting", "site-visit", "delivery", "estimate", "invoice", "other"], {
    errorMap: () => ({ message: "Tipo de evento inválido" })
  }),
  status: z.enum(["pending", "confirmed", "completed", "cancelled"], {
    errorMap: () => ({ message: "Estado de evento inválido" })
  }),
  clientId: z.number().optional(),
  projectId: z.number().optional(),
  agentId: z.number().optional(),
  notes: z.string().optional()
});
export const materialInsertSchema = createInsertSchema(materials);
export const agentInsertSchema = createInsertSchema(agents, {
  firstName: (schema) => schema.min(2, "First name must be at least 2 characters"),
  lastName: (schema) => schema.min(2, "Last name must be at least 2 characters"),
  phone: (schema) => schema.min(10, "Phone number must be at least 10 characters"),
  hourlyRate: (schema) => schema.nullable().optional(),
  commissionRate: (schema) => schema.nullable().optional()
});
export const attachmentInsertSchema = createInsertSchema(attachments);
export const followUpInsertSchema = createInsertSchema(followUps);
export const propertyMeasurementInsertSchema = createInsertSchema(propertyMeasurements);
export const achievementInsertSchema = createInsertSchema(achievements);
export const contractorAchievementInsertSchema = createInsertSchema(contractorAchievements);
export const achievementRewardInsertSchema = createInsertSchema(achievementRewards);
export const contractorStreakInsertSchema = createInsertSchema(contractorStreaks);
export const priceConfigurationInsertSchema = createInsertSchema(priceConfigurations, {
  configName: (schema) => schema.min(2, "Nombre de configuración debe tener al menos 2 caracteres"),
  serviceType: (schema) => schema.min(1, "Tipo de servicio es requerido")
});

// Select schemas (used for types)
export const contractorSelectSchema = createSelectSchema(contractors);
export const agentSelectSchema = createSelectSchema(agents);
export const clientSelectSchema = createSelectSchema(clients);
export const projectSelectSchema = createSelectSchema(projects);
export const estimateSelectSchema = createSelectSchema(estimates);
export const estimateItemSelectSchema = createSelectSchema(estimateItems);
export const invoiceSelectSchema = createSelectSchema(invoices);
export const invoiceItemSelectSchema = createSelectSchema(invoiceItems);
export const eventSelectSchema = createSelectSchema(events);
export const materialSelectSchema = createSelectSchema(materials);
export const attachmentSelectSchema = createSelectSchema(attachments);
export const followUpSelectSchema = createSelectSchema(followUps);
export const propertyMeasurementSelectSchema = createSelectSchema(propertyMeasurements);
export const priceConfigurationSelectSchema = createSelectSchema(priceConfigurations);
export const achievementSelectSchema = createSelectSchema(achievements);
export const contractorAchievementSelectSchema = createSelectSchema(contractorAchievements);
export const achievementRewardSelectSchema = createSelectSchema(achievementRewards);
export const contractorStreakSelectSchema = createSelectSchema(contractorStreaks);

// Export types
export type Contractor = z.infer<typeof contractorSelectSchema>;
export type ContractorInsert = z.infer<typeof contractorInsertSchema>;
export type Agent = z.infer<typeof agentSelectSchema>;
export type AgentInsert = z.infer<typeof agentInsertSchema>;
export type Client = z.infer<typeof clientSelectSchema>;
export type ClientInsert = z.infer<typeof clientInsertSchema>;
export type Project = z.infer<typeof projectSelectSchema>;
export type ProjectInsert = z.infer<typeof projectInsertSchema>;
export type Estimate = z.infer<typeof estimateSelectSchema>;
export type EstimateInsert = z.infer<typeof estimateInsertSchema>;
export type EstimateItem = z.infer<typeof estimateItemSelectSchema>;
export type EstimateItemInsert = z.infer<typeof estimateItemInsertSchema>;
export type Invoice = z.infer<typeof invoiceSelectSchema>;
export type InvoiceInsert = z.infer<typeof invoiceInsertSchema>;
export type InvoiceItem = z.infer<typeof invoiceItemSelectSchema>;
export type InvoiceItemInsert = z.infer<typeof invoiceItemInsertSchema>;
export type Event = z.infer<typeof eventSelectSchema>;
export type EventInsert = z.infer<typeof eventInsertSchema>;
export type Material = z.infer<typeof materialSelectSchema>;
export type MaterialInsert = z.infer<typeof materialInsertSchema>;
export type Attachment = z.infer<typeof attachmentSelectSchema>;
export type AttachmentInsert = z.infer<typeof attachmentInsertSchema>;
export type FollowUp = z.infer<typeof followUpSelectSchema>;
export type FollowUpInsert = z.infer<typeof followUpInsertSchema>;
export type PropertyMeasurement = z.infer<typeof propertyMeasurementSelectSchema>;
export type PropertyMeasurementInsert = z.infer<typeof propertyMeasurementInsertSchema>;
export type PriceConfiguration = z.infer<typeof priceConfigurationSelectSchema>;
export type PriceConfigurationInsert = z.infer<typeof priceConfigurationInsertSchema>;

export type Achievement = z.infer<typeof achievementSelectSchema>;
export type AchievementInsert = z.infer<typeof achievementInsertSchema>;
export type ContractorAchievement = z.infer<typeof contractorAchievementSelectSchema>;
export type ContractorAchievementInsert = z.infer<typeof contractorAchievementInsertSchema>;
export type AchievementReward = z.infer<typeof achievementRewardSelectSchema>;
export type AchievementRewardInsert = z.infer<typeof achievementRewardInsertSchema>;
export type ContractorStreak = z.infer<typeof contractorStreakSelectSchema>;
export type ContractorStreakInsert = z.infer<typeof contractorStreakInsertSchema>;

// Employee Timeclock - Clock In/Clock Out
export const timeclockEntries = pgTable("timeclock_entries", {
  id: serial("id").primaryKey(),
  contractorId: integer("contractor_id").references(() => contractors.id).notNull(),
  employeeName: text("employee_name").notNull(),
  type: text("type").notNull(), // "IN" or "OUT"
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  date: date("date").notNull(),
  location: text("location"),
  notes: text("notes"),
  // For Clock Out entries, reference the corresponding Clock In entry
  clockInEntryId: integer("clock_in_entry_id").references(() => timeclockEntries.id),
  // Store hours worked (only for Clock Out entries)
  hoursWorked: decimal("hours_worked", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const timeclockEntriesRelations = relations(timeclockEntries, ({ one, many }) => ({
  contractor: one(contractors, { fields: [timeclockEntries.contractorId], references: [contractors.id] }),
  // Self-referential relationship for IN/OUT entries
  clockInEntry: one(timeclockEntries, { 
    fields: [timeclockEntries.clockInEntryId], 
    references: [timeclockEntries.id] 
  }),
  clockOutEntries: many(timeclockEntries, { relationName: "clockInOutPair" })
}));

// Actualizamos las relaciones de contractors para incluir timeclockEntries
export const timeclockContractorsRelations = relations(contractors, ({ many }) => ({
  timeclockEntries: many(timeclockEntries)
}));

// Schemas for timeclockEntries
export const timeclockEntryInsertSchema = createInsertSchema(timeclockEntries, {
  employeeName: z.string().min(2, "Employee name must be at least 2 characters"),
  type: z.string().refine(val => ["IN", "OUT"].includes(val), {
    message: "Type must be either 'IN' or 'OUT'"
  })
});
export type TimeclockEntryInsert = z.infer<typeof timeclockEntryInsertSchema>;

export const timeclockEntrySelectSchema = createSelectSchema(timeclockEntries);
export type TimeclockEntry = z.infer<typeof timeclockEntrySelectSchema>;

// Client Portal Messages
export const clientMessages = pgTable("client_messages", {
  id: serial("id").primaryKey(),
  contractorId: integer("contractor_id").references(() => contractors.id).notNull(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  messageType: text("message_type").default("general").notNull(), // general, project_update, estimate, invoice, urgent
  priority: text("priority").default("normal").notNull(), // low, normal, high, urgent
  isRead: boolean("is_read").default(false).notNull(),
  readAt: timestamp("read_at"),
  attachments: jsonb("attachments").default('[]'), // Array of file URLs/paths
  sentViaEmail: boolean("sent_via_email").default(false).notNull(),
  emailSentAt: timestamp("email_sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Client Portal Access Tokens (for secure access without login)
export const clientPortalTokens = pgTable("client_portal_tokens", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Message Replies (for two-way communication)
export const messageReplies = pgTable("message_replies", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").references(() => clientMessages.id).notNull(),
  senderType: text("sender_type").notNull(), // "contractor" or "client"
  senderId: integer("sender_id").notNull(), // contractor_id or client_id
  reply: text("reply").notNull(),
  attachments: jsonb("attachments").default('[]'),
  isRead: boolean("is_read").default(false).notNull(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Relations for client messaging system
export const clientMessagesRelations = relations(clientMessages, ({ one, many }) => ({
  contractor: one(contractors, { fields: [clientMessages.contractorId], references: [contractors.id] }),
  client: one(clients, { fields: [clientMessages.clientId], references: [clients.id] }),
  replies: many(messageReplies)
}));

export const clientPortalTokensRelations = relations(clientPortalTokens, ({ one }) => ({
  client: one(clients, { fields: [clientPortalTokens.clientId], references: [clients.id] })
}));

export const messageRepliesRelations = relations(messageReplies, ({ one }) => ({
  message: one(clientMessages, { fields: [messageReplies.messageId], references: [clientMessages.id] })
}));

// Schemas for client messaging
export const clientMessageInsertSchema = createInsertSchema(clientMessages, {
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
  messageType: z.enum(["general", "project_update", "estimate", "invoice", "urgent"]),
  priority: z.enum(["low", "normal", "high", "urgent"])
});
export type ClientMessageInsert = z.infer<typeof clientMessageInsertSchema>;

export const clientMessageSelectSchema = createSelectSchema(clientMessages);
export type ClientMessage = z.infer<typeof clientMessageSelectSchema>;

export const clientPortalTokenInsertSchema = createInsertSchema(clientPortalTokens);
export type ClientPortalTokenInsert = z.infer<typeof clientPortalTokenInsertSchema>;

export const clientPortalTokenSelectSchema = createSelectSchema(clientPortalTokens);
export type ClientPortalToken = z.infer<typeof clientPortalTokenSelectSchema>;

export const messageReplyInsertSchema = createInsertSchema(messageReplies, {
  reply: z.string().min(1, "Reply is required"),
  senderType: z.enum(["contractor", "client"])
});
export type MessageReplyInsert = z.infer<typeof messageReplyInsertSchema>;

export const messageReplySelectSchema = createSelectSchema(messageReplies);
export type MessageReply = z.infer<typeof messageReplySelectSchema>;

// AI Usage Tracking for subscription limits
export const aiUsageLog = pgTable("ai_usage_log", {
  id: serial("id").primaryKey(),
  contractorId: integer("contractor_id").references(() => contractors.id).notNull(),
  usageType: text("usage_type").notNull(), // "estimate_generation", "cost_analysis", "job_description", etc.
  entityType: text("entity_type"), // "estimate", "project", "invoice"
  entityId: integer("entity_id"), // ID of the related entity
  tokensUsed: integer("tokens_used"),
  costUsd: decimal("cost_usd", { precision: 8, scale: 4 }),
  requestData: jsonb("request_data"), // Store request parameters for audit
  responseData: jsonb("response_data"), // Store response for audit
  usageMonth: text("usage_month").notNull(), // Format: "2024-01" for easy monthly counting
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Subscription Plans Definition (for plan limits reference)
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  planName: text("plan_name").notNull().unique(), // "basic", "pro", "business"
  displayName: text("display_name").notNull(), // "Basic Plan", "Pro Plan", "Business Plan"
  priceMonthly: decimal("price_monthly", { precision: 8, scale: 2 }).notNull(),
  clientLimit: integer("client_limit"), // null means unlimited
  aiUsageLimit: integer("ai_usage_limit"), // null means unlimited
  hasTimeClockAccess: boolean("has_time_clock_access").default(false).notNull(),
  hasStripeIntegration: boolean("has_stripe_integration").default(false).notNull(),
  hasCustomPortal: boolean("has_custom_portal").default(false).notNull(),
  hasBrandedPortal: boolean("has_branded_portal").default(false).notNull(),
  features: jsonb("features").default('[]'), // Array of feature strings
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Relations for new tables
export const aiUsageLogRelations = relations(aiUsageLog, ({ one }) => ({
  contractor: one(contractors, { fields: [aiUsageLog.contractorId], references: [contractors.id] })
}));

// Schemas for new tables
export const aiUsageLogInsertSchema = createInsertSchema(aiUsageLog);
export type AiUsageLogInsert = z.infer<typeof aiUsageLogInsertSchema>;

export const aiUsageLogSelectSchema = createSelectSchema(aiUsageLog);
export type AiUsageLog = z.infer<typeof aiUsageLogSelectSchema>;

export const subscriptionPlansInsertSchema = createInsertSchema(subscriptionPlans);
export type SubscriptionPlansInsert = z.infer<typeof subscriptionPlansInsertSchema>;

export const subscriptionPlansSelectSchema = createSelectSchema(subscriptionPlans);
export type SubscriptionPlans = z.infer<typeof subscriptionPlansSelectSchema>;
