import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export interface MaterialInput {
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

export interface AiAnalysisParams {
  serviceType: string;
  materials: MaterialInput[];
  laborHours?: number;
  propertySize?: {
    squareFeet?: number;
    linearFeet?: number;
    units?: number;
  };
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  difficulty?: "easy" | "medium" | "complex";
  additionalInfo?: string;
}

export interface MaterialCostItem {
  name: string;
  estimatedCost: number;
  notes?: string;
}

export interface AiAnalysisResult {
  recommendedTotal: number;
  breakdown: {
    materials: {
      total: number;
      items: MaterialCostItem[];
    };
    labor: {
      total: number;
      estimatedHours: number;
      hourlyRate: number;
      notes?: string;
    };
    overhead: {
      total: number;
      percentage: number;
      notes?: string;
    };
    profit: {
      total: number;
      percentage: number;
      notes?: string;
    };
    recommendations: string[];
    competitiveAnalysis?: {
      lowRange: number;
      highRange: number;
      notes: string;
      marketPosition?: string;
    };
    potentialIssues: string[];
    salesPoints?: string[];
    objectionHandling?: string[];
    premiumUpgrades?: string[];
    closingStrategy?: string;
    testimonialTemplates?: string[];
    presentationTips?: string[];
  };
  summary: string;
}

export function useAiCostAnalysis() {
  const { toast } = useToast();
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

  // Mutation for cost analysis
  const analysisMutation = useMutation({
    mutationFn: async (params: AiAnalysisParams) => {
      // Minimum data validation
      if (!params.serviceType) {
        throw new Error("You must select a service type");
      }
      
      if (!params.materials || params.materials.length === 0) {
        throw new Error("You must add at least one material");
      }
      
      const response = await apiRequest("POST", "/api/protected/ai/analyze-job-cost", params);
      
      // Verify if the response is successful
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error analyzing costs");
      }
      
      return response.json() as Promise<AiAnalysisResult>;
    },
    onError: (error) => {
      console.error("Error in cost analysis:", error);
      toast({
        title: "Error in cost analysis",
        description: error.message || "Could not complete the analysis. Please verify that you have provided the necessary data.",
        variant: "destructive",
      });
    },
  });

  // Mutation for generating description
  const descriptionMutation = useMutation({
    mutationFn: async (params: AiAnalysisParams) => {
      setIsGeneratingDescription(true);
      try {
        // Minimum data validation
        if (!params.serviceType) {
          throw new Error("You must select a service type");
        }
        
        if (!params.materials || params.materials.length === 0) {
          throw new Error("You must add at least one material");
        }
        
        const response = await apiRequest("POST", "/api/protected/ai/generate-job-description", params);
        
        // Verify if the response is successful
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Error generating the description");
        }
        
        const data = await response.json();
        return data.description as string;
      } finally {
        setIsGeneratingDescription(false);
      }
    },
    onError: (error) => {
      setIsGeneratingDescription(false);
      console.error("Error generating description:", error);
      toast({
        title: "Error generating description",
        description: error.message || "Could not generate the description. Please verify that you have provided the necessary data.",
        variant: "destructive",
      });
    },
  });

  return {
    analyzeJobCost: analysisMutation.mutateAsync,
    generateJobDescription: descriptionMutation.mutateAsync,
    isAnalyzing: analysisMutation.isPending,
    isGeneratingDescription,
    analysisError: analysisMutation.error,
    descriptionError: descriptionMutation.error,
  };
}