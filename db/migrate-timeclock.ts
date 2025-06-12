import { db } from "./index";
import { sql } from "drizzle-orm";

async function migrateTimeclockTable() {
  console.log("Starting timeclock table migration...");

  try {
    // Check if columns clock_in_entry_id and hours_worked exist
    const columnExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='timeclock_entries' AND column_name='clock_in_entry_id'
      );
    `);
    
    // Create table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS timeclock_entries (
        id SERIAL PRIMARY KEY,
        contractor_id INTEGER NOT NULL REFERENCES contractors(id),
        employee_name TEXT NOT NULL,
        type TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
        date DATE NOT NULL,
        location TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    
    // Add new columns if they don't exist
    if (!columnExists.rows[0].exists) {
      console.log("Adding new columns to timeclock_entries...");
      
      await db.execute(sql`
        ALTER TABLE timeclock_entries 
        ADD COLUMN IF NOT EXISTS clock_in_entry_id INTEGER REFERENCES timeclock_entries(id),
        ADD COLUMN IF NOT EXISTS hours_worked DECIMAL(5,2);
      `);
      
      console.log("✅ New columns added to timeclock_entries table");
    }

    console.log("✅ Timeclock_entries table migrated successfully");
  } catch (error) {
    console.error("❌ Error migrating timeclock_entries table:", error);
    throw error;
  }
}

// Execute migration
migrateTimeclockTable()
  .then(() => {
    console.log("✅ Timeclock migration completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error during timeclock migration:", error);
    process.exit(1);
  });
