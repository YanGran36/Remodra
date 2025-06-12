// Importamos los tipos primero
import { ServicePrice, MaterialPrice } from '@/hooks/use-pricing';

// Define available service types
export const SERVICE_TYPES = [];

// Define labor rates by service type
export const LABOR_RATES_BY_SERVICE = {};

// Define materials by service type (sin datos predeterminados)
export const MATERIALS_BY_SERVICE = {};

// Define additional options by service type (sin datos predeterminados)
export const OPTIONS_BY_SERVICE = {};

// General information by service type (sin datos predeterminados)
export const SERVICE_INFO = {};

// Helper functions simplificadas para trabajar sin datos predeterminados
export function getServiceLabel(serviceType: string): string {
  return serviceType || '';
}

// Versión simple que solo busca en los materiales configurados
export function getMaterial(serviceType: string, materialId: string) {
  // Sin datos predeterminados, devolvemos null
  return null;
}

// Versión que solo usa los precios configurados
export function getMaterialWithConfiguredPrice(
  serviceType: string, 
  materialId: string, 
  configuredMaterials: MaterialPrice[]
) {
  // Primero buscamos en los materiales configurados por coincidencia exacta de ID
  let configuredMaterial = configuredMaterials.find(m => 
    m.id === materialId
  );

  // Si no encontramos coincidencia exacta, buscamos por categoría
  if (!configuredMaterial) {
    configuredMaterial = configuredMaterials.find(m => 
      m.category === serviceType && 
      (m.name.toLowerCase().includes(materialId.replace(/_/g, ' ')) || 
       materialId.includes(m.id))
    );
  }
  
  // Si encontramos un precio configurado, lo usamos
  if (configuredMaterial) {
    console.log('Material configurado encontrado:', configuredMaterial.name, configuredMaterial.unitPrice);
    return {
      id: configuredMaterial.id,
      name: configuredMaterial.name,
      unit: configuredMaterial.unit,
      unitPrice: configuredMaterial.unitPrice
    };
  }
  
  // Si no, devolvemos null
  return null;
}

export function getOption(serviceType: string, optionId: string) {
  // Sin datos predeterminados, devolvemos null
  return null;
}

// Versión que solo usa los precios configurados para opciones
export function getOptionWithConfiguredPrice(
  serviceType: string, 
  optionId: string, 
  configuredMaterials: MaterialPrice[] | undefined
) {
  // Protección contra materiales no definidos
  if (!configuredMaterials || configuredMaterials.length === 0) {
    return null;
  }
  
  try {
    // Buscamos en los materiales configurados que puedan ser opciones
    let configuredOption = configuredMaterials.find(m => 
      m.id === optionId && m.category === serviceType
    );
    
    // Si encontramos un precio configurado, lo usamos
    if (configuredOption) {
      console.log('Opción configurada encontrada:', configuredOption.name, configuredOption.unitPrice);
      return {
        id: configuredOption.id || optionId,
        name: configuredOption.name || 'Opción',
        unit: configuredOption.unit || 'unit',
        unitPrice: configuredOption.unitPrice || 0
      };
    }
  } catch (error) {
    console.warn('Error al buscar precio configurado:', error);
  }
  
  // Si no hay configuración o hubo un error, devolvemos null
  return null;
}

export function getServiceInfo(serviceType: string) {
  // Sin datos predeterminados, devolvemos un objeto genérico
  return {
    description: "Estimate for service installation or repair.",
    helpText: "Enter the necessary dimensions to calculate total cost.",
    recommendedMaterials: [],
    recommendedOptions: [],
    unitType: "unit",
    icon: "📋",
    color: "#6b7280",
    benefits: ["Professional service", "Quality materials", "Customer satisfaction"]
  };
}

// Función para obtener el precio base de un servicio usando solo los precios configurados
export function getServiceBasePrice(
  serviceType: string, 
  configuredServices: ServicePrice[]
) {
  // Buscamos en los servicios configurados
  const configuredService = configuredServices.find(s => 
    s.serviceType === serviceType
  );
  
  // Si encontramos un precio configurado, lo usamos
  if (configuredService && configuredService.laborRate !== undefined) {
    return {
      unitPrice: configuredService.unitPrice || 0,
      unit: configuredService.unit || 'unit',
      laborRate: configuredService.laborRate || 0,
      laborMethod: configuredService.laborMethod || 'by_length'
    };
  }
  
  // Sin valores predeterminados, simplemente devolvemos valores genéricos
  return { unitPrice: 0, unit: 'unit', laborRate: 0, laborMethod: 'by_length' };
}

// Funciones de cálculo básicas para cotizaciones
export function calculateArea(length: number, width: number): number {
  return length * width;
}

export function calculatePerimeter(length: number, width: number): number {
  return 2 * (length + width);
}