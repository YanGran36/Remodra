import { Express, Request, Response } from "express";
import { db } from "@db";
import { timeclockEntries, timeclockEntryInsertSchema } from "@shared/schema";
import { eq, desc, and, sql, asc, inArray } from "drizzle-orm";
import { z } from "zod";
import { differenceInHours, differenceInMinutes } from "date-fns";

export function registerTimeclockRoutes(app: Express) {
  // Register Clock In
  app.post("/api/timeclock/clock-in", async (req: Request, res: Response) => {
    try {
      // Verify user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const contractorId = req.user.id;

      // Validate received data
      const validatedData = timeclockEntryInsertSchema.parse({
        ...req.body,
        contractorId,
        type: "IN", // Fixed type as clock in
      });

      // Insert into database
      const [entry] = await db
        .insert(timeclockEntries)
        .values(validatedData)
        .returning();

      return res.status(201).json(entry);
    } catch (error) {
      console.error("Error registering clock in:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Register Clock Out
  app.post("/api/timeclock/clock-out", async (req: Request, res: Response) => {
    try {
      // Verify user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const contractorId = req.user.id;
      const { employeeName, date } = req.body;

      // Find the most recent clock in entry for this employee
      const [latestClockIn] = await db
        .select()
        .from(timeclockEntries)
        .where(
          and(
            eq(timeclockEntries.contractorId, contractorId),
            eq(timeclockEntries.employeeName, employeeName),
            eq(timeclockEntries.type, "IN"),
            // Look for clock-in entries without an associated clock-out
            sql`NOT EXISTS (
              SELECT 1 FROM timeclock_entries t2 
              WHERE t2.clock_in_entry_id = timeclock_entries.id
            )`
          )
        )
        .orderBy(desc(timeclockEntries.timestamp))
        .limit(1);

      // Calculate hours worked if found a clock in entry
      let hoursWorked = null;
      let clockInEntryId = null;
      
      if (latestClockIn) {
        const clockInTime = new Date(latestClockIn.timestamp);
        const clockOutTime = new Date();
        
        // Calculate hours worked (with 2 decimal precision)
        const totalMinutes = differenceInMinutes(clockOutTime, clockInTime);
        hoursWorked = parseFloat((totalMinutes / 60).toFixed(2));
        clockInEntryId = latestClockIn.id;
      }

      // Prepare data for insertion
      const dataToInsert = {
        ...req.body,
        contractorId,
        type: "OUT", // Fixed type as clock out
        clockInEntryId, // Link to the corresponding clock in entry
        hoursWorked: hoursWorked ? hoursWorked.toString() : null, // Convert to string for validation
      };
      
      console.log("Clock out data:", dataToInsert);
      
      // Validate received data
      const validatedData = timeclockEntryInsertSchema.parse(dataToInsert);

      // Insert into database
      const [entry] = await db
        .insert(timeclockEntries)
        .values(validatedData)
        .returning();

      return res.status(201).json(entry);
    } catch (error) {
      console.error("Error registering clock out:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get recent entries (last 10)
  app.get("/api/timeclock/recent", async (req: Request, res: Response) => {
    try {
      // Verify user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const contractorId = req.user.id;

      // Get last 10 entries with enhanced information
      const entries = await db
        .select()
        .from(timeclockEntries)
        .where(eq(timeclockEntries.contractorId, contractorId))
        .orderBy(desc(timeclockEntries.timestamp))
        .limit(10);

      // For each OUT entry, include hours worked information
      const enhancedEntries = entries.map(entry => {
        // Only show hours worked to the contractor (who is authenticated here)
        return entry;
      });

      return res.status(200).json(enhancedEntries);
    } catch (error) {
      console.error("Error getting recent entries:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get all entries (paginated)
  app.get("/api/timeclock/entries", async (req: Request, res: Response) => {
    try {
      // Verify user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const contractorId = req.user.id;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;
      const offset = (page - 1) * pageSize;

      // Get paginated entries
      const entries = await db
        .select()
        .from(timeclockEntries)
        .where(eq(timeclockEntries.contractorId, contractorId))
        .orderBy(desc(timeclockEntries.timestamp))
        .limit(pageSize)
        .offset(offset);
      
      // Add working hours information where available
      const enhancedEntries = entries.map(entry => {
        return entry;
      });

      // Get total count for pagination
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(timeclockEntries)
        .where(eq(timeclockEntries.contractorId, contractorId));

      // Return data with pagination info
      return res.status(200).json({
        entries: enhancedEntries,
        pagination: {
          total: count,
          page,
          pageSize,
          totalPages: Math.ceil(count / pageSize),
        },
      });
    } catch (error) {
      console.error("Error getting entries:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get hours summary report by employee and day (for business owner only)
  app.get("/api/timeclock/report", async (req: Request, res: Response) => {
    try {
      // Verify user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const contractorId = req.user.id;
      
      // Get ALL entries for this contractor
      const allEntries = await db
        .select({
          id: timeclockEntries.id,
          employeeName: timeclockEntries.employeeName,
          date: timeclockEntries.date,
          clockInEntryId: timeclockEntries.clockInEntryId,
          hoursWorked: timeclockEntries.hoursWorked,
          timestamp: timeclockEntries.timestamp,
          location: timeclockEntries.location,
          notes: timeclockEntries.notes,
          type: timeclockEntries.type,
        })
        .from(timeclockEntries)
        .where(
          eq(timeclockEntries.contractorId, contractorId)
        )
        .orderBy(timeclockEntries.date, desc(timeclockEntries.timestamp));
      
      // Separate entries into clock-in and clock-out
      const clockOutEntries = allEntries.filter(entry => entry.type === "OUT");
      const clockInEntriesAll = allEntries.filter(entry => entry.type === "IN");
      
      // Create a map of all clock-in entries for easy lookup
      const clockInMap = {};
      clockInEntriesAll.forEach(entry => {
        clockInMap[entry.id] = entry;
      });
      
      // Get all clockInEntryIds referenced from clock-out entries
      const clockInIdsReferenced = clockOutEntries
        .map(entry => entry.clockInEntryId)
        .filter(Boolean);
      
      // Find clock-in entries that don't have a corresponding clock-out (still clocked in)
      const standaloneClockIns = clockInEntriesAll.filter(entry => 
        !clockInIdsReferenced.includes(entry.id)
      );

      // Recalcular horas para todas las entradas de clock-out
      for (const outEntry of clockOutEntries) {
        if (outEntry.clockInEntryId) {
          const inEntry = clockInMap[outEntry.clockInEntryId];
          if (inEntry) {
            const clockInTime = new Date(inEntry.timestamp);
            const clockOutTime = new Date(outEntry.timestamp);
            
            // Calcular minutos y convertir a horas (con 2 decimales)
            const totalMinutes = differenceInMinutes(clockOutTime, clockInTime);
            const hoursWorked = parseFloat((totalMinutes / 60).toFixed(2));
            
            // Actualizar entrada con horas calculadas
            outEntry.hoursWorked = hoursWorked;
            console.log(`Recalculated hours for ${outEntry.employeeName}: ${hoursWorked} hours (${totalMinutes} minutes)`);
          }
        }
      }
      
      // Combine all entries for processing - including standalone clock-ins
      const entries = [...clockOutEntries, ...standaloneClockIns];
      
      console.log(`Found ${entries.length} total entries for report (${clockOutEntries.length} clock-outs and ${standaloneClockIns.length} active clock-ins)`);
      
      // Group by date and employee name to get daily totals
      const dailyReport = {};
      
      // Track weekly hours by employee (reset each Monday)
      const weeklyHours = {};
      
      // Function to get the week start date (Monday) for a given date
      const getWeekStartDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const day = date.getDay(); // 0 for Sunday, 1 for Monday, etc.
        const diff = day === 0 ? 6 : day - 1; // Adjust for Monday as start of week
        const monday = new Date(date);
        monday.setDate(date.getDate() - diff);
        return monday.toISOString().split('T')[0];
      };
      
      // Function to get the ISO week number for a date
      const getWeekNumber = (dateStr: string) => {
        const date = new Date(dateStr);
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
        const week1 = new Date(date.getFullYear(), 0, 4);
        return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
      };
      
      // Función para asegurar que un valor es numérico
      const ensureNumber = (value: any): number => {
        if (value === null || value === undefined) return 0;
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
          const parsed = parseFloat(value);
          return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
      };
      
      for (const entry of entries) {
        // Formato de fecha compatible con ambos tipos de datos (Date o string)
        const dateKey = typeof entry.date === 'string' ? entry.date : entry.date.toISOString().split('T')[0];
        const employeeName = entry.employeeName;
        const weekStartDate = getWeekStartDate(dateKey);
        const weekNumber = getWeekNumber(dateKey);
        const yearWeekKey = `${new Date(dateKey).getFullYear()}-W${weekNumber}`;
        
        // Initialize daily report structure
        if (!dailyReport[dateKey]) {
          dailyReport[dateKey] = {};
        }
        
        if (!dailyReport[dateKey][employeeName]) {
          dailyReport[dateKey][employeeName] = {
            totalHours: 0,
            entries: [],
            weeklyHours: 0,
            weekStartDate,
            yearWeekKey,
            weekNumber
          };
        }
        
        // Initialize weekly hours tracking
        if (!weeklyHours[yearWeekKey]) {
          weeklyHours[yearWeekKey] = {
            startDate: weekStartDate,
            year: new Date(dateKey).getFullYear(),
            weekNumber,
            employees: {}
          };
        }
        
        if (!weeklyHours[yearWeekKey].employees[employeeName]) {
          weeklyHours[yearWeekKey].employees[employeeName] = 0;
        }
        
        // Si es una entrada de tipo OUT
        if (entry.type === "OUT") {
          // Debug de la entrada completa para ver qué contiene
          console.log("PROCESSING ENTRY:", JSON.stringify(entry, null, 2));
          
          // Parse hours worked using our safe ensureNumber function
          const hoursWorked = ensureNumber(entry.hoursWorked);
          
          console.log(`Processing entry for ${employeeName}: hours worked = ${hoursWorked}`);
          
          // Get corresponding clock in entry
          const clockInEntry = entry.clockInEntryId ? clockInMap[entry.clockInEntryId] : null;
          
          // Add clock in entry first with matching timestamps
          if (clockInEntry) {
            const timestamp = clockInEntry.timestamp;
            dailyReport[dateKey][employeeName].entries.push({
              id: clockInEntry.id,
              type: 'IN',
              timestamp: timestamp,
              location: clockInEntry.location,
              notes: clockInEntry.notes || "",
              isClockIn: true,
              // Incluir hora exacta para mostrar en detalles
              entryTime: timestamp
            });
          }
          
          // Siempre actualizar las horas totales, incluso si es 0
          const safeHoursWorked = ensureNumber(hoursWorked);
          
          // Actualizar con precaución, asegurando que los valores son numéricos
          dailyReport[dateKey][employeeName].totalHours = ensureNumber(dailyReport[dateKey][employeeName].totalHours) + safeHoursWorked;
          
          // Update weekly hours total - siempre actualizar
          // Nos aseguramos de que el valor en weeklyHours también sea numérico antes de sumar
          const currentWeeklyHours = ensureNumber(weeklyHours[yearWeekKey].employees[employeeName]);
          weeklyHours[yearWeekKey].employees[employeeName] = currentWeeklyHours + safeHoursWorked;
          
          console.log(`Updated weekly hours for ${employeeName} to ${weeklyHours[yearWeekKey].employees[employeeName]} (+${safeHoursWorked})`);
          dailyReport[dateKey][employeeName].weeklyHours = weeklyHours[yearWeekKey].employees[employeeName];
          
          // Guardar hora del Clock Out
          const outTimestamp = entry.timestamp;
          
          dailyReport[dateKey][employeeName].entries.push({
            id: entry.id,
            type: 'OUT',
            clockInEntryId: entry.clockInEntryId,
            hoursWorked,
            timestamp: outTimestamp,
            entryTime: outTimestamp, // Incluir hora exacta para mostrar
            location: entry.location,
            notes: entry.notes || "",
            isClockOut: true
          });
        } 
        // Si es una entrada de tipo IN que no tiene salida
        else {
          // Agregar la entrada directamente (todavía está en clock-in)
          const inTimestamp = entry.timestamp;
          
          dailyReport[dateKey][employeeName].entries.push({
            id: entry.id,
            type: 'IN',
            timestamp: inTimestamp,
            entryTime: inTimestamp, // Incluir hora exacta para mostrar
            location: entry.location,
            notes: entry.notes || "",
            isClockIn: true
          });
        }
      }
      
      // Debug para ver qué está pasando con los datos
      console.log("Weekly hours data:", JSON.stringify(weeklyHours, null, 2));
      
      // Format the response with additional weekly summary
      const formattedResponse = {
        dailyReport,
        weeklyReport: weeklyHours
      };
      
      return res.status(200).json(formattedResponse);
    } catch (error) {
      console.error("Error generating hours report:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
}