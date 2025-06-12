import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Loader2 } from "lucide-react";
import EstimateForm from "@/components/estimates/estimate-form";
import { useProjects } from "@/hooks/use-projects";
import { useClients } from "@/hooks/use-clients";

export default function EstimateCreatePage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const projectId = params.get("projectId") ? Number(params.get("projectId")) : undefined;
  const clientId = params.get("clientId") ? Number(params.get("clientId")) : undefined;
  
  const [project, setProject] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { useProject } = useProjects();
  const { useClient } = useClients();
  
  // Usando los hooks para obtener datos del proyecto y cliente
  const { data: projectData, isLoading: isLoadingProject } = useProject(projectId || null);
  
  // Extraer el clientId del proyecto si está disponible usando una aserción segura
  let projectClientId: number | undefined;
  if (projectData && typeof projectData === 'object' && projectData !== null && 'clientId' in projectData) {
    projectClientId = Number(projectData.clientId);
  }
  
  const { data: clientData, isLoading: isLoadingClient } = useClient(
    projectClientId || clientId || null
  );

  // Actualiza el estado cuando los datos estén disponibles
  useEffect(() => {
    if (projectData && !isLoadingProject) {
      setProject(projectData);
    }
    
    if (clientData && !isLoadingClient) {
      setClient(clientData);
    }
    
    // Una vez que tenemos todos los datos o confirmamos que no hay datos para cargar
    if (
      (!isLoadingProject && (projectData || !projectId)) &&
      (!isLoadingClient && (clientData || (!clientId && !projectClientId)))
    ) {
      setIsLoading(false);
    }
  }, [projectData, clientData, isLoadingProject, isLoadingClient, projectId, clientId]);

  // Manejar la creación exitosa del estimado
  const handleSuccess = (estimate: any) => {
    console.log("Estimado creado exitosamente:", estimate);
    // Redirigir a la página de detalle del estimado
    window.location.href = `/estimates/${estimate.id}`;
  };

  // Cancelar y volver a la página anterior
  const handleCancel = () => {
    console.log("Cancelando la creación del estimado");
    window.history.back();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center mb-8 gap-3">
        <a href="/projects" className="text-sm text-blue-500 hover:underline">
          Proyectos
        </a>
        <span className="text-gray-400">/</span>
        {project && (
          <>
            <a href={`/projects?id=${project.id}`} className="text-sm text-blue-500 hover:underline">
              {project.title}
            </a>
            <span className="text-gray-400">/</span>
          </>
        )}
        <span className="text-sm">Nuevo estimado</span>
      </div>

      {project && (
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Nuevo estimado para proyecto: {project.title}</h1>
          {client && (
            <p className="text-gray-600">
              Cliente: {client.firstName} {client.lastName}
            </p>
          )}
        </div>
      )}

      {!project && client && (
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Nuevo estimado</h1>
          <p className="text-gray-600">
            Cliente: {client.firstName} {client.lastName}
          </p>
        </div>
      )}

      {!project && !client && (
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Nuevo estimado</h1>
          <p className="text-gray-600 mt-2">Cree un nuevo estimado. Seleccione un cliente y proyecto primero.</p>
        </div>
      )}

      <EstimateForm
        projectId={projectId}
        clientId={client?.id}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}