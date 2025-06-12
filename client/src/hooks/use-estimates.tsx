import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useEstimates() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Obtener todos los estimados
  const {
    data: estimates,
    isLoading: isLoadingEstimates,
    error: estimatesError,
    refetch: refetchEstimates
  } = useQuery({
    queryKey: ["/api/protected/estimates"],
  });

  // Obtener un estimado por ID
  const getEstimate = (id: number) => {
    return useQuery({
      queryKey: ["/api/protected/estimates", id],
      queryFn: async () => {
        const res = await apiRequest("GET", `/api/protected/estimates/${id}`);
        return await res.json();
      },
      enabled: !!id,
    });
  };

  // Crear un nuevo estimado
  const createEstimateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/protected/estimates", data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/estimates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/protected/projects"] });
      toast({
        title: "Estimado creado",
        description: "El estimado ha sido creado correctamente.",
      });
      return data;
    },
    onError: (error: Error) => {
      toast({
        title: "Error al crear estimado",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Actualizar un estimado existente
  const updateEstimateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const res = await apiRequest("PATCH", `/api/protected/estimates/${id}`, data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/estimates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/protected/estimates", data.id] });
      toast({
        title: "Estimado actualizado",
        description: "El estimado ha sido actualizado correctamente.",
      });
      return data;
    },
    onError: (error: Error) => {
      toast({
        title: "Error al actualizar estimado",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Eliminar un estimado
  const deleteEstimateMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/protected/estimates/${id}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/estimates"] });
      toast({
        title: "Estimado eliminado",
        description: "El estimado ha sido eliminado correctamente.",
      });
      return id;
    },
    onError: (error: Error) => {
      toast({
        title: "Error al eliminar estimado",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Cambiar el estado de un estimado
  const updateEstimateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await apiRequest("PATCH", `/api/protected/estimates/${id}`, { status });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/estimates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/protected/estimates", data.id] });
      toast({
        title: "Estado actualizado",
        description: "El estado del estimado ha sido actualizado correctamente.",
      });
      return data;
    },
    onError: (error: Error) => {
      toast({
        title: "Error al actualizar estado",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Convertir estimado a factura/orden de trabajo
  const convertToInvoiceMutation = useMutation({
    mutationFn: async (estimateId: number) => {
      const res = await apiRequest("POST", `/api/protected/estimates/${estimateId}/convert-to-invoice`, {});
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/estimates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/protected/invoices"] });
      toast({
        title: "Work Order Created",
        description: "The estimate has been successfully converted to a work order.",
      });
      return data;
    },
    onError: (error: Error) => {
      toast({
        title: "Error Creating Work Order",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Obtener estimados por proyecto
  const getEstimatesByProject = (projectId: number) => {
    return useQuery({
      queryKey: ["/api/protected/projects", projectId, "estimates"],
      queryFn: async () => {
        const res = await apiRequest("GET", `/api/protected/projects/${projectId}/estimates`);
        return await res.json();
      },
      enabled: !!projectId,
    });
  };

  return {
    estimates,
    isLoadingEstimates,
    estimatesError,
    refetchEstimates,
    getEstimate,
    createEstimateMutation,
    updateEstimateMutation,
    deleteEstimateMutation,
    updateEstimateStatusMutation,
    convertToInvoiceMutation,
    getEstimatesByProject,
  };
}