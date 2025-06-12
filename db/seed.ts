import { db } from "./index";
import * as schema from "@shared/schema";
import { hashPassword } from "../server/auth";
import { achievementSeedData, rewardSeedData } from "./achievement-seeds";

async function seed() {
  try {
    console.log("Starting database seed...");

    // Check if database already has data
    const existingContractors = await db.query.contractors.findMany({
      limit: 1
    });

    if (existingContractors.length > 0) {
      console.log("Database already has data, skipping seed.");
      return;
    }

    // Create demo contractor
    const hashedPassword = await hashPassword("password123");
    const [contractor] = await db.insert(schema.contractors).values({
      firstName: "John",
      lastName: "Contractor",
      email: "john@abccontracting.com",
      password: hashedPassword,
      companyName: "ABC Contracting",
      phone: "(555) 987-6543",
      address: "123 Contractor Way",
      city: "Springfield",
      state: "IL",
      zip: "62701"
    }).returning();

    console.log(`Created contractor: ${contractor.firstName} ${contractor.lastName}`);

    // Create clients
    const clients = await db.insert(schema.clients).values([
      {
        contractorId: contractor.id,
        firstName: "Sarah",
        lastName: "Johnson",
        email: "sarah.johnson@example.com",
        phone: "(555) 123-4567",
        address: "1234 Oak Street",
        city: "Springfield",
        state: "IL",
        zip: "62701",
        notes: "Client prefers communication via text message rather than calls. Interested in discussing a bathroom remodel next year. Has referred two other clients."
      },
      {
        contractorId: contractor.id,
        firstName: "Mark",
        lastName: "Taylor",
        email: "mtaylor@example.com",
        phone: "(555) 456-7890",
        address: "567 Maple Drive",
        city: "Springfield",
        state: "IL",
        zip: "62704",
        notes: "First-time homeowner, very detail-oriented. Prefers email communication and evening appointments after 6pm."
      },
      {
        contractorId: contractor.id,
        firstName: "James",
        lastName: "Davis",
        email: "james.davis@example.com",
        phone: "(555) 789-0123",
        address: "789 Pine Road",
        city: "Springfield",
        state: "IL",
        zip: "62702",
        notes: "Repeat customer, prefers quality materials even at higher cost. Has two large dogs that need to be secured during site visits."
      },
      {
        contractorId: contractor.id,
        firstName: "Robert",
        lastName: "Wilson",
        email: "rwilson@example.com",
        phone: "(555) 123-4567",
        address: "421 Elm Avenue",
        city: "Springfield",
        state: "IL",
        zip: "62703",
        notes: "New client, referred by Sarah Johnson."
      },
      {
        contractorId: contractor.id,
        firstName: "Luis",
        lastName: "Garcia",
        email: "lgarcia@example.com",
        phone: "(555) 987-6543",
        address: "789 Elm Street",
        city: "Springfield",
        state: "IL",
        zip: "62704",
        notes: "Renovating a newly purchased home. Spanish-speaking, prefers texts for quick communications."
      }
    ]).returning();

    console.log(`Created ${clients.length} clients`);

    // Create projects
    const projects = await db.insert(schema.projects).values([
      {
        contractorId: contractor.id,
        clientId: clients[0].id, // Sarah Johnson
        title: "Kitchen Remodel",
        description: "Complete kitchen renovation including new cabinets, countertops, appliances, and flooring.",
        status: "in_progress",
        startDate: new Date("2023-05-10"),
        endDate: new Date("2023-07-15"),
        budget: "12450",
        notes: "Client requests high-end finishes. Schedule work between 9 AM and 5 PM on weekdays only."
      },
      {
        contractorId: contractor.id,
        clientId: clients[0].id, // Sarah Johnson
        title: "Backyard Patio",
        description: "Construction of a 200 sq ft concrete patio with built-in seating.",
        status: "completed",
        startDate: new Date("2023-03-01"),
        endDate: new Date("2023-03-15"),
        budget: "2050",
        notes: "Completed ahead of schedule. Client very satisfied."
      },
      {
        contractorId: contractor.id,
        clientId: clients[1].id, // Mark Taylor
        title: "Bathroom Renovation",
        description: "Master bathroom renovation with new shower, vanity, toilet, and flooring.",
        status: "in_progress",
        startDate: new Date("2023-05-15"),
        endDate: new Date("2023-06-15"),
        budget: "8750",
        notes: "Client has selected all fixtures. Special order items have 2-week lead time."
      },
      {
        contractorId: contractor.id,
        clientId: clients[2].id, // James Davis
        title: "Deck Construction",
        description: "Construction of a 400 sq ft wooden deck with railings and stairs.",
        status: "in_progress",
        startDate: new Date("2023-04-22"),
        endDate: new Date("2023-06-01"),
        budget: "6800",
        notes: "Material delivery delayed by supplier. Schedule adjusted accordingly."
      },
      {
        contractorId: contractor.id,
        clientId: clients[2].id, // James Davis
        title: "Fence Installation",
        description: "Installation of 150 linear feet of 6-foot privacy fence.",
        status: "completed",
        startDate: new Date("2023-02-15"),
        endDate: new Date("2023-02-28"),
        budget: "3200",
        notes: "Completed on time and on budget."
      },
      {
        contractorId: contractor.id,
        clientId: clients[4].id, // Luis Garcia
        title: "Basement Finishing",
        description: "Finishing 800 sq ft basement with family room, office, and half bath.",
        status: "in_progress",
        startDate: new Date("2023-05-05"),
        endDate: new Date("2023-07-30"),
        budget: "24500",
        notes: "Requires city permits. Electrical and plumbing inspection scheduled for June 15."
      }
    ]).returning();

    console.log(`Created ${projects.length} projects`);

    // Create estimates
    const estimates = await db.insert(schema.estimates).values([
      {
        contractorId: contractor.id,
        clientId: clients[1].id, // Mark Taylor
        projectId: projects[2].id, // Bathroom Renovation
        estimateNumber: "EST-2023-028",
        issueDate: new Date("2023-05-15"),
        expiryDate: new Date("2023-06-15"),
        status: "sent",
        subtotal: "8750",
        tax: "0",
        discount: "0",
        total: "8750",
        terms: "50% deposit required to schedule and begin work.\nBalance due upon completion of project.\nAny modifications to the scope of work may result in additional charges.",
        notes: "Estimate includes all labor and materials as specified.",
        contractorSignature: "John Contractor"
      }
    ]).returning();

    console.log(`Created ${estimates.length} estimates`);

    // Create estimate items
    const estimateItems = await db.insert(schema.estimateItems).values([
      {
        estimateId: estimates[0].id,
        description: "Demo existing bathroom",
        quantity: "1",
        unitPrice: "1200",
        amount: "1200",
        notes: "Removal of existing fixtures, flooring, and wall tile"
      },
      {
        estimateId: estimates[0].id,
        description: "Plumbing work",
        quantity: "1",
        unitPrice: "2800",
        amount: "2800",
        notes: "Install new water lines, drains, and vents"
      },
      {
        estimateId: estimates[0].id,
        description: "Tile installation",
        quantity: "1",
        unitPrice: "3400",
        amount: "3400",
        notes: "Porcelain floor tile and ceramic wall tile with accent strip"
      },
      {
        estimateId: estimates[0].id,
        description: "Fixtures & hardware",
        quantity: "1",
        unitPrice: "1350",
        amount: "1350",
        notes: "Vanity, toilet, shower system, mirror, and accessories"
      }
    ]).returning();

    console.log(`Created ${estimateItems.length} estimate items`);

    // Create invoices
    const invoices = await db.insert(schema.invoices).values([
      {
        contractorId: contractor.id,
        clientId: clients[0].id, // Sarah Johnson
        projectId: projects[0].id, // Kitchen Remodel
        invoiceNumber: "INV-2023-054",
        issueDate: new Date("2023-05-20"),
        dueDate: new Date("2023-06-03"),
        status: "paid",
        subtotal: "2450",
        tax: "0",
        discount: "0",
        total: "2450",
        amountPaid: "2450",
        terms: "Payment due within 14 days of issue date.",
        notes: "First progress payment for kitchen remodel project.",
        contractorSignature: "John Contractor"
      }
    ]).returning();

    console.log(`Created ${invoices.length} invoices`);

    // Create invoice items
    const invoiceItems = await db.insert(schema.invoiceItems).values([
      {
        invoiceId: invoices[0].id,
        description: "Initial project setup and demolition",
        quantity: "1",
        unitPrice: "1200",
        amount: "1200"
      },
      {
        invoiceId: invoices[0].id,
        description: "Plumbing rough-in",
        quantity: "1",
        unitPrice: "950",
        amount: "950"
      },
      {
        invoiceId: invoices[0].id,
        description: "Permit fees",
        quantity: "1",
        unitPrice: "300",
        amount: "300"
      }
    ]).returning();

    console.log(`Created ${invoiceItems.length} invoice items`);

    // Create events
    const today = new Date();
    const events = await db.insert(schema.events).values([
      {
        contractorId: contractor.id,
        title: "Site visit - Johnson Kitchen Remodel",
        description: "Check progress and discuss countertop options",
        startTime: new Date(today.setHours(9, 0, 0, 0)),
        endTime: new Date(today.setHours(10, 0, 0, 0)),
        location: "1234 Oak Street, Springfield",
        type: "site-visit",
        status: "confirmed",
        clientId: clients[0].id, // Sarah Johnson
        projectId: projects[0].id, // Kitchen Remodel
        notes: "Bring countertop samples"
      },
      {
        contractorId: contractor.id,
        title: "Material pickup - Home Supply Co.",
        description: "Pick up ordered materials for Davis Deck project",
        startTime: new Date(today.setHours(11, 30, 0, 0)),
        endTime: new Date(today.setHours(12, 30, 0, 0)),
        location: "520 Industrial Blvd",
        type: "delivery",
        status: "confirmed",
        clientId: clients[2].id, // James Davis
        projectId: projects[3].id, // Deck Construction
        notes: "Order #45622"
      },
      {
        contractorId: contractor.id,
        title: "Estimate Presentation - Taylor Bathroom Renovation",
        description: "Present and discuss bathroom renovation estimate",
        startTime: new Date(today.setHours(14, 0, 0, 0)),
        endTime: new Date(today.setHours(15, 0, 0, 0)),
        location: "567 Maple Drive, Springfield",
        type: "estimate",
        status: "confirmed",
        clientId: clients[1].id, // Mark Taylor
        projectId: projects[2].id, // Bathroom Renovation
        notes: "Bring material samples and estimate"
      },
      {
        contractorId: contractor.id,
        title: "Follow-up call - Wilson Project",
        description: "Discuss project requirements and timeline",
        startTime: new Date(new Date(today).setDate(today.getDate() + 1)),
        endTime: new Date(new Date(today).setDate(today.getDate() + 1)),
        location: "Phone call",
        type: "meeting",
        status: "pending",
        clientId: clients[3].id, // Robert Wilson
        notes: "Potential kitchen renovation project"
      },
      {
        contractorId: contractor.id,
        title: "Final inspection - Garcia Basement",
        description: "Final walkthrough with client before completion",
        startTime: new Date(new Date(today).setDate(today.getDate() + 2)),
        endTime: new Date(new Date(today).setDate(today.getDate() + 2)),
        location: "789 Elm Street, Springfield",
        type: "site-visit",
        status: "confirmed",
        clientId: clients[4].id, // Luis Garcia
        projectId: projects[5].id, // Basement Finishing
        notes: "Bring final invoice and project documentation"
      }
    ]).returning();

    console.log(`Created ${events.length} events`);

    // Create materials
    const materials = await db.insert(schema.materials).values([
      {
        contractorId: contractor.id,
        name: "Quartz Countertop",
        description: "Calacatta Gold quartz countertop",
        supplier: "Luxury Stone Suppliers",
        cost: "2200",
        quantity: "25",
        unit: "sq.ft",
        status: "ordered",
        projectId: projects[0].id, // Kitchen Remodel
        notes: "Special order with 3-week lead time"
      },
      {
        contractorId: contractor.id,
        name: "Pressure-Treated Lumber",
        description: "2x6x12 pressure-treated pine",
        supplier: "Home Supply Co.",
        cost: "1250",
        quantity: "120",
        unit: "each",
        orderNumber: "45622",
        status: "ordered",
        projectId: projects[3].id, // Deck Construction
        notes: "Will be ready for pickup tomorrow"
      },
      {
        contractorId: contractor.id,
        name: "Subway Tile",
        description: "3x6 white ceramic subway tile",
        supplier: "Tile Warehouse",
        cost: "480",
        quantity: "120",
        unit: "sq.ft",
        status: "in_stock",
        projectId: projects[2].id, // Bathroom Renovation
        notes: "In stock at warehouse"
      },
      {
        contractorId: contractor.id,
        name: "Porcelain Floor Tile",
        description: "12x24 gray porcelain floor tile",
        supplier: "Tile Warehouse",
        cost: "580",
        quantity: "80",
        unit: "sq.ft",
        status: "in_stock",
        projectId: projects[2].id, // Bathroom Renovation
        notes: "In stock at warehouse"
      },
      {
        contractorId: contractor.id,
        name: "Custom Vanity",
        description: "36-inch white shaker style vanity with marble top",
        supplier: "Custom Cabinets Inc.",
        cost: "950",
        quantity: "1",
        unit: "each",
        orderNumber: "CV-78923",
        status: "ordered",
        projectId: projects[2].id, // Bathroom Renovation
        notes: "Expected delivery in 2 weeks"
      }
    ]).returning();

    console.log(`Created ${materials.length} materials`);

    // Create follow-ups
    const followUps = await db.insert(schema.followUps).values([
      {
        contractorId: contractor.id,
        clientId: clients[3].id, // Robert Wilson
        type: "estimate",
        status: "pending",
        message: "Following up on our recent conversation about your kitchen renovation project. I'd be happy to provide a free estimate at your convenience. When would be a good time to schedule a site visit?",
        scheduledDate: new Date(new Date().setDate(today.getDate() + 1))
      },
      {
        contractorId: contractor.id,
        clientId: clients[1].id, // Mark Taylor
        type: "estimate",
        status: "pending",
        entityId: estimates[0].id,
        entityType: "estimate",
        message: "I wanted to follow up on the bathroom renovation estimate I sent last week. Do you have any questions I can answer to help you make your decision?",
        scheduledDate: new Date(new Date().setDate(today.getDate() + 3))
      }
    ]).returning();

    console.log(`Created ${followUps.length} follow-ups`);
    
    // Crear logros
    const createdAchievements = await db.insert(schema.achievements).values(
      achievementSeedData
    ).returning();
    
    console.log(`Created ${createdAchievements.length} achievements`);
    
    // Asignar algunos logros iniciales al contratista demo
    const achievementMap = createdAchievements.reduce((map, achievement) => {
      map[achievement.code] = achievement.id;
      return map;
    }, {} as Record<string, number>);
    
    // El contratista ya ha completado algunos logros iniciales
    const contractorAchievements = await db.insert(schema.contractorAchievements).values([
      {
        contractorId: contractor.id,
        achievementId: achievementMap['first_client'],
        progress: 5, // Tiene 5 clientes
        isCompleted: true,
        completedAt: new Date(new Date().setDate(today.getDate() - 5)),
        notified: true,
        unlockedReward: true
      },
      {
        contractorId: contractor.id,
        achievementId: achievementMap['first_project'],
        progress: 6, // Tiene 6 proyectos
        isCompleted: true,
        completedAt: new Date(new Date().setDate(today.getDate() - 4)),
        notified: true,
        unlockedReward: true
      },
      {
        contractorId: contractor.id,
        achievementId: achievementMap['first_estimate'],
        progress: 1, // Tiene 1 estimación
        isCompleted: true,
        completedAt: new Date(new Date().setDate(today.getDate() - 3)),
        notified: true,
        unlockedReward: true
      },
      {
        contractorId: contractor.id,
        achievementId: achievementMap['first_invoice'],
        progress: 1, // Tiene 1 factura
        isCompleted: true,
        completedAt: new Date(new Date().setDate(today.getDate() - 2)),
        notified: true,
        unlockedReward: true
      },
      {
        contractorId: contractor.id,
        achievementId: achievementMap['invoice_paid'],
        progress: 1, // Tiene 1 factura pagada
        isCompleted: true,
        completedAt: new Date(new Date().setDate(today.getDate() - 1)),
        notified: true,
        unlockedReward: true
      },
      {
        contractorId: contractor.id,
        achievementId: achievementMap['client_master'],
        progress: 5, // 5/10 para completar este logro
        isCompleted: false
      },
      // Uno que acaba de completar pero que aún no ha sido notificado
      {
        contractorId: contractor.id,
        achievementId: achievementMap['project_variety'],
        progress: 3, // 3/3 para completar este logro
        isCompleted: true,
        completedAt: new Date(),
        notified: false,
        unlockedReward: false
      }
    ]).returning();
    
    console.log(`Created ${contractorAchievements.length} contractor achievements`);
    
    // Crear recompensas de logros
    const createdRewards = [];
    
    for (const reward of rewardSeedData) {
      const achievement = createdAchievements.find(a => a.code === reward.achievementCode);
      if (achievement) {
        const createdReward = await db.insert(schema.achievementRewards).values({
          achievementId: achievement.id,
          type: reward.type,
          description: reward.description,
          value: reward.value,
          duration: reward.duration
        }).returning();
        
        createdRewards.push(...createdReward);
      }
    }
    
    console.log(`Created ${createdRewards.length} achievement rewards`);
    
    // Crear una racha para el contratista
    const streak = await db.insert(schema.contractorStreaks).values({
      contractorId: contractor.id,
      currentStreak: 3,
      longestStreak: 5,
      lastActivityDate: new Date(),
      level: 2,
      xp: 125,
      nextLevelXp: 200
    }).returning();
    
    console.log(`Created contractor streak record`);

    console.log("Database seed completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();
