import { useState } from "react";
import { 
  useQuery, 
  useMutation,
  useQueryClient
} from "@tanstack/react-query";
import { PriceConfiguration, PriceConfigurationInsert } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export const usePriceConfigurations = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedService, setSelectedService] = useState<string | null>(null);

  // Obtener todas las configuraciones de precios
  const { 
    data: priceConfigurations, 
    isLoading: isLoadingConfigurations,
    error: configurationsError
  } = useQuery({
    queryKey: ["/api/protected/price-configurations"],
    enabled: true,
  });

  // Obtener configuraciones de un servicio específico
  const {
    data: serviceConfigurations = [],
    isLoading: isLoadingServiceConfigurations,
    error: serviceConfigurationsError,
    refetch: refetchServiceConfigurations
  } = useQuery<any[]>({
    queryKey: ["/api/protected/price-configurations/service", selectedService],
    enabled: !!selectedService,
  });

  // Obtener la configuración predeterminada para un servicio
  const {
    data: defaultConfiguration,
    isLoading: isLoadingDefaultConfiguration,
    error: defaultConfigurationError,
    refetch: refetchDefaultConfiguration
  } = useQuery({
    queryKey: ["/api/protected/price-configurations/service", selectedService, "default"],
    enabled: !!selectedService,
  });

  // Crear una configuración de precios
  const createConfigurationMutation = useMutation({
    mutationFn: async (data: Omit<PriceConfigurationInsert, "id" | "contractorId">) => {
      const response = await apiRequest("POST", "/api/protected/price-configurations", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/price-configurations"] });
      if (selectedService) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/protected/price-configurations/service", selectedService] 
        });
        toast({
          title: "Configuración creada",
          description: "La configuración de precios ha sido creada exitosamente.",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo crear la configuración: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Actualizar una configuración
  const updateConfigurationMutation = useMutation({
    mutationFn: async ({ 
      id, 
      data 
    }: { 
      id: number, 
      data: Partial<Omit<PriceConfigurationInsert, "id" | "contractorId">> 
    }) => {
      const response = await apiRequest("PATCH", `/api/protected/price-configurations/${id}`, data);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/price-configurations"] });
      if (data.serviceType) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/protected/price-configurations/service", data.serviceType] 
        });
        toast({
          title: "Configuración actualizada",
          description: "La configuración de precios ha sido actualizada exitosamente.",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo actualizar la configuración: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Eliminar una configuración
  const deleteConfigurationMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/protected/price-configurations/${id}`);
      return id;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/price-configurations"] });
      if (selectedService) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/protected/price-configurations/service", selectedService] 
        });
        toast({
          title: "Configuración eliminada",
          description: "La configuración de precios ha sido eliminada exitosamente.",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo eliminar la configuración: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Establecer una configuración como predeterminada
  const setDefaultConfigurationMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/protected/price-configurations/${id}/set-default`, {});
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/price-configurations"] });
      if (data.serviceType) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/protected/price-configurations/service", data.serviceType] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ["/api/protected/price-configurations/service", data.serviceType, "default"] 
        });
        toast({
          title: "Configuración predeterminada",
          description: "La configuración ha sido establecida como predeterminada.",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo establecer la configuración como predeterminada: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  return {
    // Data
    priceConfigurations,
    serviceConfigurations,
    defaultConfiguration,
    selectedService,
    
    // Loading states
    isLoadingConfigurations,
    isLoadingServiceConfigurations,
    isLoadingDefaultConfiguration,
    
    // Errors
    configurationsError,
    serviceConfigurationsError,
    defaultConfigurationError,
    
    // Actions
    setSelectedService,
    createConfiguration: createConfigurationMutation.mutate,
    updateConfiguration: updateConfigurationMutation.mutate,
    deleteConfiguration: deleteConfigurationMutation.mutate,
    setDefaultConfiguration: setDefaultConfigurationMutation.mutate,
    
    // Mutation states
    isCreating: createConfigurationMutation.isPending,
    isUpdating: updateConfigurationMutation.isPending,
    isDeleting: deleteConfigurationMutation.isPending,
    isSettingDefault: setDefaultConfigurationMutation.isPending,
    
    // Refetch
    refetchServiceConfigurations,
    refetchDefaultConfiguration
  };
};