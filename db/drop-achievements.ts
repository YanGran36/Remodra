import { db } from ".";

async function dropAchievementTables() {
  console.log("Dropping achievement system tables...");
  
  try {
    // Drop tables in reverse order to respect foreign key dependencies
    await db.execute(`DROP TABLE IF EXISTS contractor_streaks CASCADE;`);
    await db.execute(`DROP TABLE IF EXISTS achievement_rewards CASCADE;`);
    await db.execute(`DROP TABLE IF EXISTS contractor_achievements CASCADE;`);
    await db.execute(`DROP TABLE IF EXISTS achievements CASCADE;`);
    
    console.log("Achievement system tables dropped successfully.");
  } catch (error) {
    console.error("Error dropping tables:", error);
    throw error;
  }
}

// Execute the drop function
dropAchievementTables()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Drop failed:", error);
    process.exit(1);
  });