import { db } from "@db";
import { clients, Client } from "@shared/schema";
import { eq } from "drizzle-orm";

// Export clients to JSON by contractor
export async function exportClientsToJSON(contractorId: number): Promise<any[]> {
  try {
    // Get all clients for the contractor
    const clientsData = await db.query.clients.findMany({
      where: eq(clients.contractorId, contractorId)
    });

    if (!clientsData || clientsData.length === 0) {
      throw new Error("No clients to export");
    }

    return clientsData;
  } catch (error: any) {
    console.error("Error exporting clients:", error);
    throw new Error(`Error exporting clients: ${error.message}`);
  }
}

// Import clients from JSON data
export async function importClientsFromJSON(clientsData: any[], contractorId: number): Promise<string> {
  try {
    if (!clientsData || clientsData.length === 0) {
      throw new Error("No client data provided");
    }

    // Import clients (omitting IDs to create new records)
    const importedClients = [];
    for (const clientRecord of clientsData) {
      const { id, createdAt, ...clientData } = clientRecord;
      // Ensure client belongs to the correct contractor
      const newClientData = {
        ...clientData,
        contractorId: contractorId
      };
      
      const [newClient] = await db.insert(clients).values(newClientData).returning();
      importedClients.push(newClient);
    }

    return `${importedClients.length} clients imported successfully`;
  } catch (error: any) {
    console.error("Error importing clients:", error);
    throw new Error(`Error importing clients: ${error.message}`);
  }
}