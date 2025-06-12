import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useInvoices() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Obtener todas las facturas
  const {
    data: invoices,
    isLoading: isLoadingInvoices,
    error: invoicesError,
    refetch: refetchInvoices
  } = useQuery({
    queryKey: ["/api/protected/invoices"],
  });

  // Obtener una factura por ID
  const getInvoice = (id: number) => {
    return useQuery({
      queryKey: ["/api/protected/invoices", id],
      queryFn: async () => {
        const res = await apiRequest("GET", `/api/protected/invoices/${id}`);
        return await res.json();
      },
      enabled: !!id,
    });
  };

  // Crear una nueva factura
  const createInvoiceMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/protected/invoices", data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/protected/projects"] });
      toast({
        title: "Factura creada",
        description: "La factura ha sido creada correctamente.",
      });
      return data;
    },
    onError: (error: Error) => {
      toast({
        title: "Error al crear factura",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Actualizar una factura existente
  const updateInvoiceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const res = await apiRequest("PATCH", `/api/protected/invoices/${id}`, data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/protected/invoices", data.id] });
      toast({
        title: "Factura actualizada",
        description: "La factura ha sido actualizada correctamente.",
      });
      return data;
    },
    onError: (error: Error) => {
      toast({
        title: "Error al actualizar factura",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Eliminar una factura
  const deleteInvoiceMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/protected/invoices/${id}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/invoices"] });
      toast({
        title: "Factura eliminada",
        description: "La factura ha sido eliminada correctamente.",
      });
      return id;
    },
    onError: (error: Error) => {
      toast({
        title: "Error al eliminar factura",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Cambiar el estado de una factura
  const updateInvoiceStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await apiRequest("PATCH", `/api/protected/invoices/${id}`, { status });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/protected/invoices", data.id] });
      toast({
        title: "Estado actualizado",
        description: "El estado de la factura ha sido actualizado correctamente.",
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
  
  // Cancelar una factura
  const cancelInvoiceMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number, notes?: string }) => {
      const res = await apiRequest("POST", `/api/protected/invoices/${id}/cancel`, { notes });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/protected/invoices", data.id] });
      toast({
        title: "Factura cancelada",
        description: "La factura ha sido cancelada correctamente.",
      });
      return data;
    },
    onError: (error: Error) => {
      toast({
        title: "Error al cancelar factura",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Registrar un pago para una factura
  const registerPaymentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const res = await apiRequest("POST", `/api/protected/invoices/${id}/payment`, data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/protected/invoices", data.id] });
      toast({
        title: "Payment recorded",
        description: "The payment has been recorded successfully.",
      });
      return data;
    },
    onError: (error: Error) => {
      toast({
        title: "Error al registrar pago",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Obtener facturas por proyecto
  const getInvoicesByProject = (projectId: number) => {
    return useQuery({
      queryKey: ["/api/protected/projects", projectId, "invoices"],
      queryFn: async () => {
        const res = await apiRequest("GET", `/api/protected/projects/${projectId}/invoices`);
        return await res.json();
      },
      enabled: !!projectId,
    });
  };

  return {
    invoices,
    isLoadingInvoices,
    invoicesError,
    refetchInvoices,
    getInvoice,
    createInvoiceMutation,
    updateInvoiceMutation,
    deleteInvoiceMutation,
    updateInvoiceStatusMutation,
    cancelInvoiceMutation,
    registerPaymentMutation,
    getInvoicesByProject,
  };
}