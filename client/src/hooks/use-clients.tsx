import { 
  useQuery,
  useMutation,
  useQueryClient
} from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export interface Client {
  id: number;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  notes?: string | null;
  cancellationHistory?: string | null;
  createdAt: Date;
}

export interface Project {
  id: number;
  title: string;
  description?: string | null;
  status: string;
  budget?: number | string;
  startDate?: Date;
  endDate?: Date;
  notes?: string | null;
  createdAt?: Date;
}

export interface ClientWithProjects extends Client {
  projects: Project[];
}

export interface ClientInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  notes?: string;
}

export const useClients = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener todos los clientes
  const { 
    data: clients = [], 
    isLoading: isLoadingClients,
    error: clientsError
  } = useQuery<ClientWithProjects[]>({
    queryKey: ["/api/protected/clients"],
  });

  // Obtener un cliente específico
  const useClient = (clientId: number | null) => {
    return useQuery<ClientWithProjects>({
      queryKey: ["/api/protected/clients", clientId],
      enabled: !!clientId,
    });
  };

  // Crear un cliente
  const createClientMutation = useMutation({
    mutationFn: async (data: ClientInput) => {
      const response = await apiRequest("POST", "/api/protected/clients", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/clients"] });
      toast({
        title: "Cliente creado",
        description: "El cliente ha sido creado exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo crear el cliente: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Actualizar un cliente
  const updateClientMutation = useMutation({
    mutationFn: async ({ 
      id, 
      data 
    }: { 
      id: number, 
      data: Partial<ClientInput> 
    }) => {
      const response = await apiRequest("PATCH", `/api/protected/clients/${id}`, data);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/protected/clients", data.id] });
      toast({
        title: "Cliente actualizado",
        description: "El cliente ha sido actualizado exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo actualizar el cliente: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Eliminar un cliente
  const deleteClientMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/protected/clients/${id}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/protected/clients", id] });
      toast({
        title: "Cliente eliminado",
        description: "El cliente ha sido eliminado exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo eliminar el cliente: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  return {
    // Data
    clients,
    
    // Queries
    useClient,
    
    // Loading states
    isLoadingClients,
    
    // Errors
    clientsError,
    
    // Mutations
    createClient: createClientMutation.mutate,
    updateClient: updateClientMutation.mutate,
    deleteClient: deleteClientMutation.mutate,
    
    // Mutation states
    isCreating: createClientMutation.isPending,
    isUpdating: updateClientMutation.isPending,
    isDeleting: deleteClientMutation.isPending,
  };
};