import { db } from ".";
import { achievements, contractorAchievements, achievementRewards, contractorStreaks } from "../shared/schema";

async function migrateAchievementTables() {
  console.log("Iniciando la migración de tablas para el sistema de logros...");
  
  try {
    // Crear tabla de logros
    await db.execute(`
      CREATE TABLE IF NOT EXISTS achievements (
        id SERIAL PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        points INTEGER NOT NULL DEFAULT 10,
        icon TEXT NOT NULL,
        required_count INTEGER NOT NULL DEFAULT 1,
        level TEXT NOT NULL DEFAULT 'bronze',
        badge_color TEXT NOT NULL DEFAULT '#CD7F32',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    
    // Crear tabla de logros por contratista
    await db.execute(`
      CREATE TABLE IF NOT EXISTS contractor_achievements (
        id SERIAL PRIMARY KEY,
        contractor_id INTEGER NOT NULL REFERENCES contractors(id),
        achievement_id INTEGER NOT NULL REFERENCES achievements(id),
        progress INTEGER NOT NULL DEFAULT 0,
        is_completed BOOLEAN NOT NULL DEFAULT FALSE,
        completed_at TIMESTAMP,
        notified BOOLEAN NOT NULL DEFAULT FALSE,
        unlocked_reward BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(contractor_id, achievement_id)
      );
    `);
    
    // Crear tabla de recompensas
    await db.execute(`
      CREATE TABLE IF NOT EXISTS achievement_rewards (
        id SERIAL PRIMARY KEY,
        achievement_id INTEGER NOT NULL REFERENCES achievements(id),
        type TEXT NOT NULL,
        description TEXT NOT NULL,
        value TEXT NOT NULL,
        duration INTEGER,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    
    // Crear tabla de rachas
    await db.execute(`
      CREATE TABLE IF NOT EXISTS contractor_streaks (
        id SERIAL PRIMARY KEY,
        contractor_id INTEGER NOT NULL REFERENCES contractors(id),
        current_streak INTEGER NOT NULL DEFAULT 0,
        longest_streak INTEGER NOT NULL DEFAULT 0,
        last_activity_date DATE,
        level INTEGER NOT NULL DEFAULT 1,
        xp INTEGER NOT NULL DEFAULT 0,
        next_level_xp INTEGER NOT NULL DEFAULT 100,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(contractor_id)
      );
    `);

    console.log("Migración de tablas para el sistema de logros completada con éxito.");
  } catch (error) {
    console.error("Error al migrar las tablas del sistema de logros:", error);
    throw error;
  }
}

// Execute the migration function
migrateAchievementTables()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Migración fallida:", error);
    process.exit(1);
  });