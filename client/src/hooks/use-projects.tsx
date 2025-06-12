import { 
  useQuery,
  useMutation,
  useQueryClient
} from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Project } from "@/hooks/use-clients";
import { ProjectInput } from "@/components/projects/project-form";
import { ProjectInsert } from "@shared/schema";

export interface ProjectDetail extends Project {
  description: string;
  notes?: string | null;
  createdAt: Date;
  // Campos para sección de trabajadores
  workerInstructions?: string | null;
  workerNotes?: string | null;
  materialsNeeded?: any[] | null;
  safetyRequirements?: string | null;
  // Campos para sección de IA
  aiProjectSummary?: string | null;
  aiAnalysis?: any | null;
  aiGeneratedDescription?: string | null;
  aiSharingSettings?: {
    installers: boolean;
    clients: boolean;
    estimators: boolean;
  } | null;
  lastAiUpdate?: string | Date | null;
}

export interface ProjectWithClient extends ProjectDetail {
  client: {
    id: number;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
  }
}

export const useProjects = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener todos los proyectos
  const { 
    data: projects = [], 
    isLoading: isLoadingProjects,
    error: projectsError
  } = useQuery<ProjectWithClient[]>({
    queryKey: ["/api/protected/projects"],
  });

  // Obtener un proyecto específico
  const useProject = (projectId: number | null) => {
    return useQuery<ProjectDetail>({
      queryKey: ["/api/protected/projects", projectId],
      enabled: !!projectId,
    });
  };

  // Crear un proyecto
  const createProjectMutation = useMutation({
    mutationFn: async (data: ProjectInsert) => {
      // Convertir las fechas a formato ISO string para enviar al servidor
      const formattedData = {
        ...data,
        startDate: data.startDate ? (data.startDate instanceof Date ? data.startDate.toISOString() : data.startDate) : undefined,
        endDate: data.endDate ? (data.endDate instanceof Date ? data.endDate.toISOString() : data.endDate) : undefined
      };
      
      const response = await apiRequest("POST", "/api/protected/projects", formattedData);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/protected/clients"] });
      toast({
        title: "Proyecto creado",
        description: "El proyecto ha sido creado exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo crear el proyecto: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Actualizar un proyecto
  const updateProjectMutation = useMutation({
    mutationFn: async ({ 
      id, 
      data 
    }: { 
      id: number, 
      data: Partial<ProjectInsert> 
    }) => {
      // Convertir las fechas a formato ISO string para enviar al servidor
      const formattedData = {
        ...data,
        startDate: data.startDate ? (data.startDate instanceof Date ? data.startDate.toISOString() : data.startDate) : undefined,
        endDate: data.endDate ? (data.endDate instanceof Date ? data.endDate.toISOString() : data.endDate) : undefined
      };
      
      const response = await apiRequest("PATCH", `/api/protected/projects/${id}`, formattedData);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/protected/projects", data.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/protected/clients"] });
      toast({
        title: "Proyecto actualizado",
        description: "El proyecto ha sido actualizado exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo actualizar el proyecto: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Eliminar un proyecto
  const deleteProjectMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/protected/projects/${id}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/protected/projects", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/protected/clients"] });
      toast({
        title: "Proyecto eliminado",
        description: "El proyecto ha sido eliminado exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo eliminar el proyecto: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Cancelar un proyecto
  const cancelProjectMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number, notes?: string }) => {
      const response = await apiRequest("POST", `/api/protected/projects/${id}/cancel`, { notes });
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/protected/projects", data.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/protected/clients"] });
      toast({
        title: "Proyecto cancelado",
        description: "El proyecto ha sido cancelado exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo cancelar el proyecto: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  return {
    // Data
    projects,
    
    // Queries
    useProject,
    
    // Loading states
    isLoadingProjects,
    
    // Errors
    projectsError,
    
    // Mutations
    createProject: createProjectMutation.mutateAsync,
    updateProject: updateProjectMutation.mutateAsync,
    deleteProject: deleteProjectMutation.mutate,
    cancelProject: cancelProjectMutation.mutate,
    
    // Mutation states
    isCreating: createProjectMutation.isPending,
    isUpdating: updateProjectMutation.isPending,
    isDeleting: deleteProjectMutation.isPending,
    isCancelling: cancelProjectMutation.isPending,
  };
};