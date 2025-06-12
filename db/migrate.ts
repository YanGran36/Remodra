import { db } from "./index";
import { sql } from "drizzle-orm";

async function migrate() {
  try {
    console.log("Starting database migration...");
    
    // Create propertyMeasurements table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS property_measurements (
        id SERIAL PRIMARY KEY,
        contractor_id INTEGER NOT NULL REFERENCES contractors(id),
        client_id INTEGER NOT NULL REFERENCES clients(id),
        project_id INTEGER REFERENCES projects(id),
        service_type TEXT NOT NULL,
        total_square_feet DECIMAL(10, 2),
        total_linear_feet DECIMAL(10, 2),
        notes TEXT,
        measurement_data JSONB,
        diagram_url TEXT,
        measured_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Add serviceType to materials table if it doesn't exist
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'materials' AND column_name = 'service_type'
        ) THEN
          ALTER TABLE materials ADD COLUMN service_type TEXT;
        END IF;
      END $$;
    `);
    
    console.log("Database migration completed successfully!");
  } catch (error) {
    console.error("Error migrating database:", error);
  }
}

migrate();