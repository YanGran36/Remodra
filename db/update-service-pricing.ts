import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import { sql } from "drizzle-orm";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function simplifyServicePricingTable() {
  console.log("Starting service pricing table simplification...");
  
  try {
    // Run SQL to simplify the service_pricing table structure
    await db.execute(sql`
      -- First, make sure all needed columns exist with correct defaults
      DO $$
      BEGIN
        -- Make sure unit has a default and is not null
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_pricing' AND column_name = 'unit') THEN
          ALTER TABLE service_pricing ALTER COLUMN unit SET DEFAULT 'ft';
          UPDATE service_pricing SET unit = 'ft' WHERE unit IS NULL;
          ALTER TABLE service_pricing ALTER COLUMN unit SET NOT NULL;
        END IF;
        
        -- Make sure labor_calculation_method has a default and is not null
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_pricing' AND column_name = 'labor_calculation_method') THEN
          ALTER TABLE service_pricing ALTER COLUMN labor_calculation_method SET DEFAULT 'by_length';
          UPDATE service_pricing SET labor_calculation_method = 'by_length' WHERE labor_calculation_method IS NULL;
          ALTER TABLE service_pricing ALTER COLUMN labor_calculation_method SET NOT NULL;
        END IF;
        
        -- Make sure labor_rate is not null
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_pricing' AND column_name = 'labor_rate') THEN
          UPDATE service_pricing SET labor_rate = 0 WHERE labor_rate IS NULL;
          ALTER TABLE service_pricing ALTER COLUMN labor_rate SET NOT NULL;
        END IF;
      END $$;
      
      -- Now drop any unnecessary columns
      DO $$
      BEGIN
        -- Check for and drop unnecessary columns
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
      END $$;
    `);
    
    console.log("Service pricing table structure has been simplified successfully");
  } catch (error) {
    console.error("Error simplifying service pricing table:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the migration
simplifyServicePricingTable()
  .then(() => console.log("Service pricing simplification completed"))
  .catch(error => console.error("Simplification failed:", error));