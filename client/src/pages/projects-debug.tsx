import React from "react";
import { Button } from "@/components/ui/button";
import { useProjects, type ProjectWithClient } from "@/hooks/use-projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProjectsDebugPage() {
  const { projects, isLoadingProjects } = useProjects();

  const handleCreateEstimateClick = (projectId: number) => {
    // Abrir en una nueva pestaña
    window.open(`/estimates/new?projectId=${projectId}`, "_blank");
  };

  if (isLoadingProjects) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Cargando proyectos...</h1>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Página de Diagnóstico de Proyectos</h1>
      <p className="mb-6 text-red-500">Esta es una página de diagnóstico para probar la navegación.</p>

      <div className="grid gap-6">
        {projects && projects.length > 0 ? (
          projects.map((project: any) => (
            <Card key={project.id} className="overflow-hidden">
              <CardHeader className="bg-slate-50">
                <CardTitle>Proyecto #{project.id}: {project.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="mb-4">
                  <p><strong>Cliente:</strong> {project.client?.firstName} {project.client?.lastName}</p>
                  <p><strong>Estado:</strong> {project.status}</p>
                </div>
                
                <div className="flex gap-2">
                  <a href={`/estimates/new?projectId=${project.id}`} target="_blank" rel="noopener noreferrer">
                    <Button>Crear Estimado (Enlace directo)</Button>
                  </a>
                  
                  <Button onClick={() => handleCreateEstimateClick(project.id)}>
                    Crear Estimado (JavaScript click)
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p>No hay proyectos disponibles.</p>
        )}
      </div>
    </div>
  );
}