import { Express } from 'express';
import { db } from '../../db';
import { servicePricing, materialPricing } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Registra las rutas para la gestión de precios centralizados
 */
export function registerPricingRoutes(app: Express) {
  // Verificar que el contratista tiene acceso a sus propios datos
  const verifyContractorOwnership = async (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    // El usuario autenticado ya incluye el ID del contratista
    next();
  };

  // SERVICIOS
  // =========

  // Get all services with pricing for the contractor - redirect to direct services API
  app.get('/api/pricing/services', verifyContractorOwnership, async (req: any, res) => {
    try {
      // Use the direct services API that's already working
      const response = await fetch(`http://localhost:5000/api/direct/services`, {
        headers: {
          'Cookie': req.headers.cookie || ''
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch from direct services API');
      }
      
      const services = await response.json();
      
      console.log(`[PRICING-SERVICES] Found ${services.length} services for contractor ${req.user.id}`);
      console.log('[PRICING-SERVICES] Services from direct API:', services);
      
      res.json(services);
    } catch (error) {
      console.error('Error fetching services:', error);
      res.status(500).json({ message: 'Error fetching services' });
    }
  });

  // Obtener un servicio específico
  app.get('/api/pricing/services/:id', verifyContractorOwnership, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      const [service] = await db
        .select()
        .from(servicePricing)
        .where(
          and(
            eq(servicePricing.id, parseInt(id)),
            eq(servicePricing.contractorId, req.user.id)
          )
        );
      
      if (!service) {
        return res.status(404).json({ message: 'Servicio no encontrado' });
      }
      
      res.json(service);
    } catch (error) {
      console.error('Error al obtener servicio:', error);
      res.status(500).json({ message: 'Error al obtener servicio' });
    }
  });

  // Crear un nuevo servicio
  app.post('/api/pricing/services', verifyContractorOwnership, async (req: any, res) => {
    try {
      const serviceData = { 
        ...req.body,
        contractorId: req.user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const [newService] = await db.insert(servicePricing).values(serviceData).returning();
      
      res.status(201).json(newService);
    } catch (error) {
      console.error('Error al crear servicio:', error);
      res.status(500).json({ message: 'Error al crear servicio' });
    }
  });

  // Update or create a service
  app.put('/api/pricing/services/:id', verifyContractorOwnership, async (req: any, res) => {
    try {
      const { id } = req.params;
      console.log(`Updating service with ID: ${id}`, req.body);
      
      // Convert laborRate to number with better error handling
      let laborRateValue = 0;
      if (req.body.laborRate !== undefined) {
        if (typeof req.body.laborRate === 'string') {
          laborRateValue = parseFloat(req.body.laborRate) || 0;
        } else if (typeof req.body.laborRate === 'number') {
          laborRateValue = req.body.laborRate;
        }
      }
      
      // Si estamos editando un servicio y cambiando su serviceType
      const isEditing = req.body.originalServiceType && req.body.originalServiceType !== req.body.serviceType;
      const searchId = isEditing ? req.body.originalServiceType : id;
      
      console.log("Searching for service with ID:", searchId);
      
      // Buscar el servicio por el ID original
      const [existingService] = await db
        .select()
        .from(servicePricing)
        .where(
          and(
            eq(servicePricing.serviceType, searchId),
            eq(servicePricing.contractorId, req.user.id)
          )
        );
      
      console.log("Existing service found:", existingService ? "Yes" : "No");
      
      // Prepare data with safety defaults, asegurando concordancia con los campos de la tabla
      const serviceData = { 
        name: req.body.name || 'New Service',
        serviceType: req.body.serviceType || id, // Usar el nuevo serviceType si está siendo editado
        unit: req.body.unit || 'ft',
        laborRate: laborRateValue, // Ya es string desde la conversión previa
        // Usamos laborMethod del frontend y lo asignamos al campo laborCalculationMethod
        laborCalculationMethod: req.body.laborMethod || 'by_length',
        contractorId: req.user.id,
        updatedAt: new Date()
      };
      
      console.log("Raw ServiceData:", JSON.stringify(serviceData));
      
      // Verificar que los tipos de datos correspondan con la tabla
      // La tabla espera que laborRate sea numeric/decimal
      if (typeof serviceData.laborRate === 'string') {
        serviceData.laborRate = parseFloat(serviceData.laborRate) || 0;
      }
      
      console.log("Service data prepared:", serviceData);
      
      let result;
      
      if (existingService) {
        // Update existing service
        console.log("Updating existing service with ID:", searchId);
        
        // Si estamos editando un servicio existente
        [result] = await db
          .update(servicePricing)
          .set(serviceData)
          .where(
            and(
              eq(servicePricing.serviceType, searchId),
              eq(servicePricing.contractorId, req.user.id)
            )
          )
          .returning();
          
        console.log("Service updated successfully:", result);
      } else {
        // Create new service
        console.log("Creating new service with data:", JSON.stringify(serviceData));
        try {
          // Creamos un objeto que respete exactamente los campos de la tabla
          const insertData = {
            name: serviceData.name,
            serviceType: serviceData.serviceType,
            unit: serviceData.unit,
            laborRate: serviceData.laborRate,
            laborCalculationMethod: serviceData.laborCalculationMethod,
            contractorId: serviceData.contractorId,
            createdAt: new Date(),
            updatedAt: serviceData.updatedAt
          };
          
          console.log("Inserting new service with data:", insertData);
          
          [result] = await db
            .insert(servicePricing)
            .values(insertData)
            .returning();
          
          console.log("New service created successfully:", result);
        } catch (insertError) {
          console.error("Error creating new service:", insertError);
          return res.status(500).json({ 
            message: 'Error creating service', 
            error: insertError instanceof Error ? insertError.message : 'Unknown error' 
          });
        }
      }
      
      // Guardar en la DB y luego hacer SELECT para verificar
      await new Promise(r => setTimeout(r, 100));
      const [checkResult] = await db
        .select()
        .from(servicePricing)
        .where(
          and(
            eq(servicePricing.serviceType, serviceData.serviceType),
            eq(servicePricing.contractorId, req.user.id)
          )
        );
      
      console.log("Verification query result:", checkResult);
      
      // Format response to match frontend expectations
      const formattedService = {
        id: serviceData.serviceType,
        name: serviceData.name,
        serviceType: serviceData.serviceType,
        unit: serviceData.unit,
        laborRate: Number(serviceData.laborRate),
        laborMethod: serviceData.laborCalculationMethod
      };
      
      console.log("Returning formatted service:", formattedService);
      res.status(existingService ? 200 : 201).json(formattedService);
    } catch (error) {
      console.error('Error with service operation:', error);
      res.status(500).json({ 
        message: 'Error processing service',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Delete a service
  app.delete('/api/pricing/services/:id', verifyContractorOwnership, async (req: any, res) => {
    try {
      const { id } = req.params;
      console.log(`Deleting service with ID/serviceType: ${id}`);
      
      // Verify the service belongs to the contractor (using serviceType instead of numeric id)
      const [existingService] = await db
        .select()
        .from(servicePricing)
        .where(
          and(
            eq(servicePricing.serviceType, id),
            eq(servicePricing.contractorId, req.user.id)
          )
        );
      
      if (!existingService) {
        return res.status(404).json({ message: 'Service not found' });
      }
      
      console.log(`Found service to delete:`, existingService);
      
      // Delete using the service's primary key id from the database
      const result = await db
        .delete(servicePricing)
        .where(
          and(
            eq(servicePricing.serviceType, id),
            eq(servicePricing.contractorId, req.user.id)
          )
        );
      
      console.log(`Service ${id} deleted successfully with result:`, result);
      res.status(200).json({ message: 'Service deleted successfully' });
    } catch (error) {
      console.error('Error deleting service:', error);
      res.status(500).json({ message: 'Error deleting service' });
    }
  });

  // MATERIALES
  // ==========

  // Obtener todos los materiales con precios del contratista
  app.get('/api/pricing/materials', verifyContractorOwnership, async (req: any, res) => {
    try {
      const materials = await db
        .select()
        .from(materialPricing)
        .where(eq(materialPricing.contractorId, req.user.id));
      
      // Si no hay materiales configurados, devolver datos predeterminados
      if (materials.length === 0) {
        // Datos iniciales para materiales comunes con los IDs exactos que se usan en los estimados
        const defaultMaterials = [
          // Materiales para cercas (fence)
          {
            id: 'wood_fence',
            name: 'Wood Fence',
            description: 'Madera tratada para construcción de cercas',
            category: 'fence',
            unitPrice: 0,
            unit: 'ln.ft',
            supplier: 'Lumber Yard',
            status: 'active'
          },
          {
            id: 'vinyl_fence',
            name: 'Vinyl Fence',
            description: 'Cercas de vinilo duraderas',
            category: 'fence',
            unitPrice: 0,
            unit: 'ln.ft',
            supplier: 'Modern Materials',
            status: 'active'
          },
          {
            id: 'chain_link',
            name: 'Chain Link Fence',
            description: 'Cercas de malla ciclónica',
            category: 'fence',
            unitPrice: 0,
            unit: 'ln.ft',
            supplier: 'Metal Supply Co.',
            status: 'active'
          },
          {
            id: 'aluminum_fence',
            name: 'Aluminum Fence',
            description: 'Cercas de aluminio elegantes',
            category: 'fence',
            unitPrice: 0,
            unit: 'ln.ft',
            supplier: 'Metal Supply Co.',
            status: 'active'
          },
          {
            id: 'fence_gate',
            name: 'Fence Gate',
            description: 'Puertas para cercas residenciales',
            category: 'fence',
            unitPrice: 0,
            unit: 'unit',
            supplier: 'Hardware Supply',
            status: 'active'
          },
          {
            id: 'post_caps',
            name: 'Post Caps',
            description: 'Tapas decorativas para postes',
            category: 'fence',
            unitPrice: 0,
            unit: 'unit',
            supplier: 'Hardware Supply',
            status: 'active'
          },
          
          // Materiales para techos (roof)
          {
            id: 'asphalt_shingles',
            name: 'Asphalt Shingles',
            description: 'Tejas asfálticas estándar',
            category: 'roof',
            unitPrice: 0,
            unit: 'sq.ft',
            supplier: 'Roofing Supply',
            status: 'active'
          },
          {
            id: 'metal_roofing',
            name: 'Metal Roofing',
            description: 'Láminas de metal para techos',
            category: 'roof',
            unitPrice: 0,
            unit: 'sq.ft',
            supplier: 'Metal Supply Co.',
            status: 'active'
          },
          {
            id: 'tile_roofing',
            name: 'Tile Roofing',
            description: 'Tejas de cerámica para techos',
            category: 'roof',
            unitPrice: 0,
            unit: 'sq.ft',
            supplier: 'Premium Materials',
            status: 'active'
          },
          
          // Materiales para canaletas (gutters)
          {
            id: 'aluminum_gutters',
            name: 'Aluminum Gutters',
            description: 'Canaletas de aluminio de 5 pulgadas',
            category: 'gutters',
            unitPrice: 0,
            unit: 'ln.ft',
            supplier: 'Gutter Supply',
            status: 'active'
          },
          {
            id: 'vinyl_gutters',
            name: 'Vinyl Gutters',
            description: 'Canaletas de vinilo resistentes',
            category: 'gutters',
            unitPrice: 0,
            unit: 'ln.ft',
            supplier: 'Modern Materials',
            status: 'active'
          },
          {
            id: 'downspouts',
            name: 'Downspouts',
            description: 'Tubos de bajada para canaletas',
            category: 'gutters',
            unitPrice: 0,
            unit: 'unit',
            supplier: 'Gutter Supply',
            status: 'active'
          }
        ];
        
        return res.json(defaultMaterials);
      }
      
      res.json(materials);
    } catch (error) {
      console.error('Error al obtener materiales:', error);
      res.status(500).json({ message: 'Error al obtener materiales' });
    }
  });

  // Obtener un material específico
  app.get('/api/pricing/materials/:id', verifyContractorOwnership, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      const [material] = await db
        .select()
        .from(materialPricing)
        .where(eq(materialPricing.id, parseInt(id)))
        .where(eq(materialPricing.contractorId, req.user.id));
      
      if (!material) {
        return res.status(404).json({ message: 'Material no encontrado' });
      }
      
      res.json(material);
    } catch (error) {
      console.error('Error al obtener material:', error);
      res.status(500).json({ message: 'Error al obtener material' });
    }
  });

  // Crear un nuevo material
  app.post('/api/pricing/materials', verifyContractorOwnership, async (req: any, res) => {
    try {
      const materialData = { 
        ...req.body,
        contractorId: req.user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const [newMaterial] = await db.insert(materialPricing).values(materialData).returning();
      
      res.status(201).json(newMaterial);
    } catch (error) {
      console.error('Error al crear material:', error);
      res.status(500).json({ message: 'Error al crear material' });
    }
  });

  // Actualizar un material existente
  app.put('/api/pricing/materials/:id', verifyContractorOwnership, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Buscar material exactamente por el ID que se pasa
      const materials = await db
        .select()
        .from(materialPricing)
        .where(eq(materialPricing.contractorId, req.user.id));
      
      // Primero buscar por ID exacto entre code, materialId o idString
      let existingMaterial = materials.find(m => 
        m.code === id || 
        (m.materialId && m.materialId === id) || 
        (m.idString && m.idString === id)
      );
      
      // Si no lo encontramos así, buscar por nombre
      if (!existingMaterial) {
        existingMaterial = materials.find(m => 
          m.name === req.body.name || 
          (m.category === req.body.category && m.name?.toLowerCase().includes(id.toLowerCase()))
        );
      }
      
      // Preparar los datos de actualización con los campos correctos
      const updateData = { 
        ...req.body,
        contractorId: req.user.id,
        category: req.body.category,
        // Asegurarse de guardar el ID original para poder identificarlo luego
        code: id,
        materialId: id,
        idString: id,
        updatedAt: new Date()
      };
      
      console.log(`Material a actualizar/crear: ${id}`, updateData);
      
      if (existingMaterial) {
        // Si existe, actualizar
        const [updatedMaterial] = await db
          .update(materialPricing)
          .set(updateData)
          .where(eq(materialPricing.id, existingMaterial.id))
          .returning();
        
        console.log('Material actualizado exitosamente en la base de datos');
        res.json(updatedMaterial);
      } else {
        // Si no existe, crear uno nuevo
        const newData = {
          ...updateData,
          createdAt: new Date()
        };
        
        const [newMaterial] = await db
          .insert(materialPricing)
          .values(newData)
          .returning();
        
        res.status(201).json(newMaterial);
      }
    } catch (error) {
      console.error('Error al actualizar material:', error);
      res.status(500).json({ message: 'Error al actualizar material' });
    }
  });

  // Eliminar un material
  app.delete('/api/pricing/materials/:id', verifyContractorOwnership, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Verificar que el material pertenece al contratista
      const [existingMaterial] = await db
        .select()
        .from(materialPricing)
        .where(eq(materialPricing.id, parseInt(id)))
        .where(eq(materialPricing.contractorId, req.user.id));
      
      if (!existingMaterial) {
        return res.status(404).json({ message: 'Material no encontrado' });
      }
      
      await db
        .delete(materialPricing)
        .where(eq(materialPricing.id, parseInt(id)));
      
      res.status(204).send();
    } catch (error) {
      console.error('Error al eliminar material:', error);
      res.status(500).json({ message: 'Error al eliminar material' });
    }
  });
}