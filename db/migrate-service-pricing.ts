import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { servicePricing } from "../shared/schema";
import { sql } from "drizzle-orm";

// Create a PostgreSQL connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema: { servicePricing } });

async function migrateServicePricingTable() {
  console.log("Starting service pricing table migration...");
  
  try {
    // Check if any columns need to be dropped
    await db.execute(sql`
      DO $$
      BEGIN
        -- Drop columns we don't need anymore while preserving essential data
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_pricing' AND column_name = 'description') THEN
          ALTER TABLE service_pricing DROP COLUMN description;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_pricing' AND column_name = 'status') THEN
          ALTER TABLE service_pricing DROP COLUMN status;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_pricing' AND column_name = 'is_default') THEN
          ALTER TABLE service_pricing DROP COLUMN is_default;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_pricing' AND column_name = 'overhead_percentage') THEN
          ALTER TABLE service_pricing DROP COLUMN overhead_percentage;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_pricing' AND column_name = 'profit_margin_percentage') THEN
          ALTER TABLE service_pricing DROP COLUMN profit_margin_percentage;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_pricing' AND column_name = 'difficulty_multipliers') THEN
          ALTER TABLE service_pricing DROP COLUMN difficulty_multipliers;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_pricing' AND column_name = 'notes') THEN
          ALTER TABLE service_pricing DROP COLUMN notes;
        END IF;
        
        -- Set unit to be NOT NULL with default 'ft'
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_pricing' AND column_name = 'unit') THEN
          ALTER TABLE service_pricing ALTER COLUMN unit SET DEFAULT 'ft';
          UPDATE service_pricing SET unit = 'ft' WHERE unit IS NULL;
          ALTER TABLE service_pricing ALTER COLUMN unit SET NOT NULL;
        END IF;
        
        -- Set labor_calculation_method to be NOT NULL with default 'by_length'
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_pricing' AND column_name = 'labor_calculation_method') THEN
          ALTER TABLE service_pricing ALTER COLUMN labor_calculation_method SET DEFAULT 'by_length';
          UPDATE service_pricing SET labor_calculation_method = 'by_length' WHERE labor_calculation_method IS NULL;
          ALTER TABLE service_pricing ALTER COLUMN labor_calculation_method SET NOT NULL;
        END IF;
        
        -- Set labor_rate to be NOT NULL
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_pricing' AND column_name = 'labor_rate') THEN
          UPDATE service_pricing SET labor_rate = 0 WHERE labor_rate IS NULL;
          ALTER TABLE service_pricing ALTER COLUMN labor_rate SET NOT NULL;
        END IF;
      END $$;
    `);
    
    console.log("Service pricing table migration complete.");
  } catch (error) {
    console.error("Error during service pricing migration:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the migration
migrateServicePricingTable()
  .then(() => console.log("Service pricing migration completed successfully"))
  .catch(error => console.error("Migration failed:", error));