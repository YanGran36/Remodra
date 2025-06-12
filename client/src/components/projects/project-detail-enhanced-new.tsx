import { useState } from "react";
import { format } from "date-fns";
import { 
  Edit, MapPin, Phone, Mail, User, Calendar, HardHat, Brain, Share2
} from "lucide-react";
import { ProjectWithClient } from "@/hooks/use-projects";
import { formatCurrency } from "@/lib/utils";
import ProjectWorkerSection from "./project-worker-section";
import ProjectAISection from "./project-ai-section";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ProjectDetailEnhancedProps {
  project: ProjectWithClient;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (project: ProjectWithClient) => void;
}

export default function ProjectDetailEnhanced({ project, isOpen, onClose, onEdit }: ProjectDetailEnhancedProps) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-2xl">
                {project.title}
              </DialogTitle>
              <DialogDescription className="mt-1">
                Cliente: {project.client?.firstName} {project.client?.lastName}
              </DialogDescription>
            </div>
            <Badge className="ml-auto">
              {project.status === 'pending' && 'Pendiente'}
              {project.status === 'in_progress' && 'En Progreso'}
              {project.status === 'on_hold' && 'En Pausa'}
              {project.status === 'completed' && 'Completado'}
              {project.status === 'cancelled' && 'Cancelado'}
            </Badge>
          </div>
        </DialogHeader>
        
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
          <div className="px-6">
            <TabsList className="grid grid-cols-4 mb-2">
              <TabsTrigger value="overview">General</TabsTrigger>
              <TabsTrigger value="workers">
                <HardHat className="h-4 w-4 mr-2" />
                Trabajadores
              </TabsTrigger>
              <TabsTrigger value="ai">
                <Brain className="h-4 w-4 mr-2" />
                IA
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Share2 className="h-4 w-4 mr-2" />
                Compartir
              </TabsTrigger>
            </TabsList>
          </div>
          
          <ScrollArea className="flex-grow px-6 py-4">
            {/* Pestaña de vista general */}
            <TabsContent value="overview" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Información del Proyecto</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Estado:</span>
                        <span>{project.status === 'pending' && 'Pendiente'}
                          {project.status === 'in_progress' && 'En Progreso'}
                          {project.status === 'on_hold' && 'En Pausa'}
                          {project.status === 'completed' && 'Completado'}
                          {project.status === 'cancelled' && 'Cancelado'}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Fecha de inicio:</span>
                        <span>{project.startDate ? format(new Date(project.startDate), "dd/MM/yyyy") : "No definida"}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Fecha de finalización:</span>
                        <span>{project.endDate ? format(new Date(project.endDate), "dd/MM/yyyy") : "No definida"}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Presupuesto:</span>
                        <span>{project.budget ? formatCurrency(project.budget) : "No definido"}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Client Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <User className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{project.client?.firstName} {project.client?.lastName}</span>
                      </div>
                      
                      {project.client?.email && (
                        <div className="flex items-center text-sm">
                          <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{project.client.email}</span>
                        </div>
                      )}
                      
                      {project.client?.phone && (
                        <div className="flex items-center text-sm">
                          <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{project.client.phone}</span>
                        </div>
                      )}
                      
                      {project.client?.address && (
                        <div className="flex items-center text-sm">
                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>
                            {project.client.address}
                            {project.client.city && `, ${project.client.city}`}
                            {project.client.state && ` ${project.client.state}`}
                            {project.client.zip && ` ${project.client.zip}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Descripción</CardTitle>
                </CardHeader>
                <CardContent>
                  {project.description ? (
                    <p className="text-sm whitespace-pre-line">{project.description}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No hay descripción para este proyecto.</p>
                  )}
                </CardContent>
              </Card>
              
              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Notas</CardTitle>
                </CardHeader>
                <CardContent>
                  {project.notes ? (
                    <p className="text-sm whitespace-pre-line">{project.notes}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No hay notas para este proyecto.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Pestaña de Trabajadores */}
            <TabsContent value="workers" className="mt-0">
              <ProjectWorkerSection project={project} />
            </TabsContent>
            
            {/* Pestaña de IA */}
            <TabsContent value="ai" className="mt-0">
              <ProjectAISection project={project} tab="ai" />
            </TabsContent>
            
            {/* Pestaña de Configuración de Compartir */}
            <TabsContent value="settings" className="mt-0">
              <ProjectAISection project={project} tab="settings" />
            </TabsContent>
          </ScrollArea>
        </Tabs>
        
        <DialogFooter className="px-6 py-4 border-t">
          <div className="flex justify-between w-full">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
            
            <Button variant="default" onClick={() => onEdit(project)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar Proyecto
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}