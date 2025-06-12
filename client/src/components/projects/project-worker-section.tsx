import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash2 } from "lucide-react";

// Tipo para materiales necesarios
interface MaterialNeeded {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

// Schema for workers section form
const workerSectionSchema = z.object({
  workerInstructions: z.string().optional(),
  workerNotes: z.string().optional(),
  materialsNeeded: z.array(
    z.object({
      id: z.string(),
      name: z.string().min(1, "El nombre es requerido"),
      quantity: z.number().min(0, "La cantidad debe ser mayor o igual a 0"),
      unit: z.string().optional()
    })
  ).optional(),
  safetyRequirements: z.string().optional(),
});

interface ProjectWorkerSectionProps {
  project: ProjectWithClient;
}

export default function ProjectWorkerSection({ project }: ProjectWorkerSectionProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Formulario para la sección de trabajadores
  const form = useForm<z.infer<typeof workerSectionSchema>>({
    resolver: zodResolver(workerSectionSchema),
    defaultValues: {
      workerInstructions: project?.workerInstructions || "",
      workerNotes: project?.workerNotes || "",
      materialsNeeded: (project?.materialsNeeded as MaterialNeeded[] || []),
      safetyRequirements: project?.safetyRequirements || "",
    }
  });

  // Mutation para actualizar la sección de trabajadores
  const updateWorkerSectionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof workerSectionSchema>) => {
      const res = await apiRequest("PATCH", `/api/protected/projects/${project.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/protected/projects", project.id] });
      
      toast({
        title: "Información para trabajadores actualizada",
        description: "La sección para trabajadores se ha actualizado correctamente.",
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

  // Manejar envío del formulario de trabajadores
  const onSubmit = async (data: z.infer<typeof workerSectionSchema>) => {
    await updateWorkerSectionMutation.mutateAsync(data);
  };

  // Añadir un nuevo material
  const addMaterial = () => {
    const currentMaterials = form.getValues("materialsNeeded") || [];
    form.setValue("materialsNeeded", [
      ...currentMaterials,
      { id: `mat-${Date.now()}`, name: "", quantity: 1, unit: "unit" }
    ]);
  };

  // Eliminar un material
  const removeMaterial = (id: string) => {
    const currentMaterials = form.getValues("materialsNeeded") || [];
    form.setValue(
      "materialsNeeded",
      currentMaterials.filter(material => material.id !== id)
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Información para Trabajadores</h3>
          <Button 
            type="submit" 
            disabled={updateWorkerSectionMutation.isPending}
          >
            {updateWorkerSectionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar cambios
          </Button>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <FormField
            control={form.control}
            name="workerInstructions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instrucciones para trabajadores</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Instrucciones detalladas sobre cómo realizar el trabajo" 
                    className="min-h-[120px]"
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Proporciona instrucciones específicas para los trabajadores que estarán en el sitio
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <FormLabel>Materiales necesarios</FormLabel>
              <Button type="button" variant="outline" size="sm" onClick={addMaterial}>
                <Plus className="h-4 w-4 mr-2" />
                Añadir Material
              </Button>
            </div>
            
            <div className="space-y-3">
              {form.watch("materialsNeeded")?.map((material, index) => (
                <div key={material.id} className="flex items-start space-x-2 border p-3 rounded-md">
                  <div className="flex-1 grid grid-cols-5 gap-2">
                    <div className="col-span-3">
                      <FormField
                        control={form.control}
                        name={`materialsNeeded.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Nombre</FormLabel>
                            <FormControl>
                              <Input placeholder="Nombre del material" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div>
                      <FormField
                        control={form.control}
                        name={`materialsNeeded.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Cantidad</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                min="0"
                                step="0.01"
                                {...field}
                                onChange={(e) => {
                                  const value = e.target.value === "" ? "0" : e.target.value;
                                  field.onChange(parseFloat(value));
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div>
                      <FormField
                        control={form.control}
                        name={`materialsNeeded.${index}.unit`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Unit</FormLabel>
                            <FormControl>
                              <Input placeholder="unit" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-6"
                    onClick={() => removeMaterial(material.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              
              {(!form.watch("materialsNeeded") || !form.watch("materialsNeeded")?.length) && (
                <div className="text-center p-4 border border-dashed rounded-md text-muted-foreground">
                  No hay materiales añadidos
                </div>
              )}
            </div>
          </div>
          
          <FormField
            control={form.control}
            name="safetyRequirements"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Requisitos de seguridad</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Requisitos específicos de seguridad para este proyecto" 
                    className="min-h-[100px]"
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Incluye cualquier medida de seguridad específica que deba tomarse en cuenta
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="workerNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notas adicionales para trabajadores</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Información adicional relevante para los trabajadores" 
                    className="min-h-[100px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  );
}