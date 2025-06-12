import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Interfaces for pricing data
export interface ServicePrice {
  id: string;
  name: string;
  serviceType: string;
  unit: string;
  laborRate: number;
  laborMethod: string;
}

export interface MaterialPrice {
  id: string;
  name: string;
  category: string;
  unitPrice: number;
  unit: string;
  supplier: string;
}

// No default data - cada contratista configura sus propios servicios y materiales
const defaultServices: ServicePrice[] = [];
const defaultMaterials: MaterialPrice[] = [];

/**
 * Hook personalizado para obtener y utilizar los precios centralizados
 */
export function usePricing() {
  // Consulta para servicios - Usar la API directa que funciona
  const { 
    data: servicePrices, 
    isLoading: servicesLoading,
    error: servicesError
  } = useQuery({
    queryKey: ['/api/direct/services'],
    retry: 1,
  });

  // Consulta para materiales con valores directamente de la API
  const { 
    data: materialPrices, 
    isLoading: materialsLoading,
    error: materialsError
  } = useQuery({
    queryKey: ['/api/pricing/materials'],
    // Usar directamente los valores de la API
    retry: 1,
  });

  // Funciones de utilidad para obtener precios por tipo o categoria
  const getServicePrice = (serviceType: string): ServicePrice | undefined => {
    // Asegurarse de que servicePrices es un array y no un objeto vacío
    const services = Array.isArray(servicePrices) ? servicePrices : [];
    
    // Buscar primero por tipo de servicio (más confiable)
    const serviceByType = services.find((service: any) => 
      service.serviceType === serviceType
    );
    
    if (serviceByType) return serviceByType;
    
    // Si no encuentra por tipo, intentar por ID (como fallback)
    return services.find((service: any) => 
      String(service.id) === serviceType
    );
  };

  const getMaterialPrice = (category: string, materialId?: string): MaterialPrice | undefined => {
    // Asegurarse de que materialPrices es un array y no un objeto vacío
    const materials = Array.isArray(materialPrices) ? materialPrices : [];
    
    // Si hay un ID específico, buscar primero por él
    if (materialId) {
      // Buscar por ID exacto o por nombre que contenga el ID
      const exactMatch = materials.find((material: any) => 
        String(material.id) === materialId
      );
      
      if (exactMatch) return exactMatch;
      
      // Buscar por nombre que contenga el ID
      const nameMatch = materials.find((material: any) => 
        material.name?.toLowerCase().includes(materialId.toLowerCase()) && 
        material.category === category
      );
      
      if (nameMatch) return nameMatch;
    }
    
    // Buscar el primer material de la categoría correcta
    return materials.find((material: any) => 
      material.category === category
    );
  };

  const getMaterialsByCategory = (category: string): MaterialPrice[] => {
    // Asegurarse de que materialPrices es un array y no un objeto vacío
    const materials = Array.isArray(materialPrices) ? materialPrices : [];
    
    // Filtrar materiales por categoría
    return materials.filter((material: any) => 
      material.category === category
    );
  };

  return {
    services: servicePrices || [],
    materials: materialPrices || [],
    isLoading: servicesLoading || materialsLoading,
    hasError: !!servicesError || !!materialsError,
    // Funciones de utilidad
    getServicePrice,
    getMaterialPrice,
    getMaterialsByCategory
  };
}