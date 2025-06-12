import { db } from "./index";
import { servicePricing, materialPricing } from "../shared/schema";
import { eq } from "drizzle-orm";
import { pool } from "./index";

/**
 * Script to delete all default service and material data
 * This will allow each contractor to add their own services and materials
 * Using direct SQL to avoid issues with table structure
 */
async function clearDefaultData() {
  try {
    console.log("Starting default data cleanup...");

    // Get direct client to execute SQL
    const client = await pool.connect();

    try {
      // Delete all default services
      console.log("Deleting default services...");
      const servicesResult = await client.query('DELETE FROM "service_pricing" RETURNING *');
      console.log(`Services deleted: ${servicesResult.rowCount}`);

      // Delete all default materials
      console.log("Deleting default materials...");
      const materialsResult = await client.query('DELETE FROM "material_pricing" RETURNING *');
      console.log(`Materials deleted: ${materialsResult.rowCount}`);

      console.log("Default data cleanup completed successfully.");
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error al limpiar datos predeterminados:", error);
    process.exit(1);
  }
}

// Ejecutar el script inmediatamente
clearDefaultData()
  .then(() => {
    console.log("Proceso completado. Saliendo...");
    setTimeout(() => process.exit(0), 500);
  })
  .catch((err) => {
    console.error("Error al ejecutar el proceso:", err);
    process.exit(1);
  });

export { clearDefaultData };