import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ProjectAnalysisRequest {
  title: string;
  description?: string;
  clientName?: string;
  budget?: number | string;
  status?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  notes?: string | null;
  // Otros datos relevantes que puedan ser útiles para el análisis
}

interface ProjectAnalysisResponse {
  summary: string;
  description: string;
  analysis: {
    key_points: string[];
    risks: string[];
    recommendations: string[];
    timeline_assessment?: string;
    budget_assessment?: string;
  };
}

interface SharingContent {
  installers: string;
  clients: string;
  estimators: string;
}

export function useOpenAI() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  /**
   * Analiza un proyecto utilizando IA para generar resúmenes y descripciones
   */
  const analyzeProject = async (projectData: ProjectAnalysisRequest): Promise<ProjectAnalysisResponse> => {
    setIsAnalyzing(true);
    try {
      const response = await apiRequest("POST", "/api/ai/analyze-project", projectData);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al analizar el proyecto");
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      toast({
        title: "Error en el análisis de IA",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Genera contenido personalizado para diferentes roles basado en la configuración de compartir
   */
  const generateSharingContent = async (
    projectId: number,
    settings: { installers: boolean; clients: boolean; estimators: boolean }
  ): Promise<SharingContent> => {
    try {
      const response = await apiRequest("POST", `/api/ai/sharing-content/${projectId}`, { settings });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al generar contenido para compartir");
      }
      
      return await response.json();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      toast({
        title: "Error al generar contenido",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    isAnalyzing,
    analyzeProject,
    generateSharingContent
  };
}