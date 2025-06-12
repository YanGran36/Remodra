import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useOpenAI } from "@/hooks/use-openai";
import { ProjectWithClient } from "@/hooks/use-projects";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Brain, Clock, Shield, FileWarning, HardHat, User, BarChart3 } from "lucide-react";

// Schema for AI section form
const aiSectionSchema = z.object({
  aiGeneratedDescription: z.string().optional(),
  aiProjectSummary: z.string().optional(),
  aiSharingSettings: z.object({
    installers: z.boolean().default(false),
    clients: z.boolean().default(true),
    estimators: z.boolean().default(true),
  }),
});

interface ProjectAISectionProps {
  project: ProjectWithClient;
  tab: "ai" | "settings";
}

export default function ProjectAISection({ project, tab }: ProjectAISectionProps) {
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { analyzeProject } = useOpenAI();

  // Formulario para la sección de IA
  const form = useForm<z.infer<typeof aiSectionSchema>>({
    resolver: zodResolver(aiSectionSchema),
    defaultValues: {
      aiGeneratedDescription: project?.aiGeneratedDescription || "",
      aiProjectSummary: project?.aiProjectSummary || "",
      aiSharingSettings: project?.aiSharingSettings || {
        installers: false,
        clients: true,
        estimators: true,
      },
    }
  });

  // Mutation para actualizar la sección de IA
  const updateAISectionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof aiSectionSchema>) => {
      const res = await apiRequest("PATCH", `/api/protected/projects/${project.id}`, {
        ...data,
        lastAiUpdate: new Date().toISOString(),
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/protected/projects", project.id] });
      
      toast({
        title: "Información de IA actualizada",
        description: "La sección generada por IA se ha actualizado correctamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al actualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Function to generate AI analysis
  const generateAIAnalysis = async () => {
    if (!project) return;
    
    setIsGeneratingAI(true);
    try {
      // Obtener datos relacionados
      const projectData = {
        title: project.title,
        description: project.description,
        clientName: `${project.client?.firstName} ${project.client?.lastName}`,
        budget: project.budget,
        status: project.status,
        startDate: project.startDate,
        endDate: project.endDate,
        notes: project.notes,
      };
      
      // Call the AI analysis API
      const analysis = await analyzeProject(projectData);
      
      // Actualizar el formulario
      form.setValue('aiGeneratedDescription', analysis.description);
      form.setValue('aiProjectSummary', analysis.summary);
      
      // Guardar los cambios
      const formData = form.getValues();
      await updateAISectionMutation.mutateAsync({
        ...formData,
        aiGeneratedDescription: analysis.description,
        aiProjectSummary: analysis.summary,
      });
      
      toast({
        title: "AI Analysis Generated",
        description: "AI analysis has been generated and saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error generating AI analysis",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Manejar envío del formulario de IA
  const onSubmit = async (data: z.infer<typeof aiSectionSchema>) => {
    await updateAISectionMutation.mutateAsync(data);
  };

  if (tab === "ai") {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Análisis IA del Proyecto</h3>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={generateAIAnalysis}
              disabled={isGeneratingAI}
            >
              {isGeneratingAI && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Brain className="h-4 w-4 mr-2" />
              Generate AI Analysis
            </Button>
            
            <Button 
              type="submit"
              form="ai-form"
              disabled={updateAISectionMutation.isPending}
            >
              {updateAISectionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar cambios
            </Button>
          </div>
        </div>
        
        <Form {...form}>
          <form id="ai-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <FormField
                control={form.control}
                name="aiProjectSummary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Summary (AI Generated)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="A concise summary of the project generated by AI" 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Este resumen será utilizado para compartir información con diferentes roles
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="aiGeneratedDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Description (AI Generated)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="A detailed description of the project generated by AI" 
                        className="min-h-[200px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Detailed description that includes all aspects of the project
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
        
        {project.lastAiUpdate && (
          <div className="mt-4 text-xs text-muted-foreground flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            Última actualización: {format(new Date(project.lastAiUpdate), "dd/MM/yyyy HH:mm")}
          </div>
        )}
      </div>
    );
  }
  
  if (tab === "settings") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuración de Compartir Información</CardTitle>
          <CardDescription>
            Configura qué información se compartirá con cada rol
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertTitle>Sharing Policies</AlertTitle>
                  <AlertDescription>
                    Configure which roles can access the AI-generated information for this project.
                    This configuration controls who can see automatically generated summaries and descriptions.
                  </AlertDescription>
                </Alert>
                
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px]">Rol</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead className="text-right w-[100px]">Acceso</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <HardHat className="h-4 w-4 mr-2" />
                            Instaladores
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            No verán información de precios y presupuestos
                          </span>
                          {form.watch("aiSharingSettings.installers") && (
                            <Alert variant="destructive" className="mt-2 py-2">
                              <FileWarning className="h-4 w-4" />
                              <AlertTitle className="text-xs">Advertencia</AlertTitle>
                              <AlertDescription className="text-xs">
                                No se recomienda compartir información completa con instaladores
                              </AlertDescription>
                            </Alert>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <FormField
                            control={form.control}
                            name="aiSharingSettings.installers"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-end space-x-2">
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </TableCell>
                      </TableRow>
                      
                      <TableRow>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2" />
                            Clientes
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            Verán cuotas, facturas, documentos y el proceso general
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <FormField
                            control={form.control}
                            name="aiSharingSettings.clients"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-end space-x-2">
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </TableCell>
                      </TableRow>
                      
                      <TableRow>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Vendedores/Estimadores
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            Full access to all project information
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <FormField
                            control={form.control}
                            name="aiSharingSettings.estimators"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-end space-x-2">
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={updateAISectionMutation.isPending}
                  >
                    {updateAISectionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar configuración
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  }
  
  return null;
}