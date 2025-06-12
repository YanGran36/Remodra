import { useState, useRef } from "react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ClientWithProjects } from "@/hooks/use-clients";
import { 
  Edit, 
  FileText, 
  Phone, 
  Mail, 
  MapPin, 
  User, 
  Trash2, 
  Plus, 
  Share2, 
  Copy,
  AlertCircle, 
  ExternalLink, 
  FileSignature, 
  ClipboardCheck 
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import ProjectForm, { ProjectInput } from "@/components/projects/project-form";
import { useProjects } from "@/hooks/use-projects";
import { Project } from "@/hooks/use-clients";
import { ProjectInsert } from "@shared/schema";


type ClientDetailProps = {
  client: ClientWithProjects;
  onEdit: () => void;
  onDelete: () => void;
  onNewEstimate: () => void;
};

export default function ClientDetail({ 
  client, 
  onEdit, 
  onDelete, 
  onNewEstimate 
}: ClientDetailProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const portalLinkRef = useRef<HTMLInputElement>(null);
  
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`;
  };

  const getProjectStatusClass = (status: string) => {
    switch (status) {
      case "completed":
      case "Completed":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "in_progress":
      case "In Progress":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "on_hold":
      case "On Hold":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      case "cancelled":
      case "Cancelled":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };
  
  // Generar la URL del portal del cliente
  const getClientPortalUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/client-portal/${client.id}`;
  };
  
  // Function to copy portal link to clipboard
  const copyPortalLink = () => {
    navigator.clipboard.writeText(getClientPortalUrl())
      .then(() => {
        toast({
          title: "Link copied",
          description: "The portal link has been copied to clipboard.",
        });
      })
      .catch(err => {
        console.error("Error copying:", err);
        toast({
          title: "Copy failed",
          description: "Could not copy link, please try again.",
          variant: "destructive",
        });
      });
  };
  
  // Función para abrir el portal del cliente en una nueva pestaña
  const openClientPortal = () => {
    window.open(getClientPortalUrl(), '_blank');
  };

  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Calcular total de ingresos de todos los proyectos
  const totalRevenue = client.projects && client.projects.length > 0
    ? client.projects.reduce((total, project) => {
        const budget = typeof project.budget === 'string' 
          ? parseFloat(project.budget.replace(/[$,]/g, ''))
          : (project.budget || 0);
        return total + budget;
      }, 0)
    : 0;

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    onDelete();
    setIsDeleteDialogOpen(false);
  };
  
  // Estado y manejo para el formulario de nuevo proyecto
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { createProject, updateProject, deleteProject, isCreating, isUpdating } = useProjects();
  
  const handleAddProject = () => {
    setSelectedProject(null);
    setIsProjectFormOpen(true);
  };
  
  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setIsProjectFormOpen(true);
  };
  
  const handleProjectFormSubmit = (data: ProjectInput & { clientId: number }) => {
    if (selectedProject) {
      updateProject({
        id: selectedProject.id,
        data: {
          ...data,
          contractorId: 1 // Estamos usando el ID 1 para el contratista logueado
        }
      }, {
        onSuccess: () => {
          // Cerrar el formulario después de actualizar exitosamente
          setIsProjectFormOpen(false);
          setSelectedProject(null);
        }
      });
    } else {
      // Asegurarse de que el objeto tenga todos los campos requeridos
      const projectData: ProjectInsert = {
        ...data,
        contractorId: 1, // ID del contratista logueado
        status: data.status || "pending"
      };
      createProject(projectData, {
        onSuccess: () => {
          // Cerrar el formulario después de crear exitosamente
          setIsProjectFormOpen(false);
          setSelectedProject(null);
        }
      });
    }
  };

  return (
    <div>
      <div className="flex items-center mb-6">
        <Avatar className="h-16 w-16 mr-4">
          <AvatarFallback className="text-lg bg-primary text-white">
            {getInitials(client.firstName, client.lastName)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h4 className="text-lg font-semibold">{client.firstName} {client.lastName}</h4>
          <p className="text-gray-600">{client.phone}</p>
          <p className="text-gray-600">{client.email}</p>
        </div>
      </div>
      
      <Tabs defaultValue="info">
        <TabsList className="mb-4">
          <TabsTrigger value="info">Contact Information</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="portal">Client Portal</TabsTrigger>
        </TabsList>
        
        <TabsContent value="info">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h5 className="font-medium text-gray-900 mb-2">Contact Information</h5>
              <div className="space-y-2 text-sm">
                {(client.address || client.city || client.state) && (
                  <p className="flex items-center">
                    <MapPin className="text-gray-400 mr-2 h-4 w-4" />
                    <span>
                      {client.address && `${client.address}, `}
                      {client.city && `${client.city}, `}
                      {client.state && client.state} 
                      {client.zip && client.zip}
                    </span>
                  </p>
                )}
                {client.phone && (
                  <p className="flex items-center">
                    <Phone className="text-gray-400 mr-2 h-4 w-4" />
                    <span>{client.phone}</span>
                  </p>
                )}
                {client.email && (
                  <p className="flex items-center">
                    <Mail className="text-gray-400 mr-2 h-4 w-4" />
                    <span>{client.email}</span>
                  </p>
                )}
                <p className="flex items-center">
                  <User className="text-gray-400 mr-2 h-4 w-4" />
                  <span>Client since: {formatDate(client.createdAt)}</span>
                </p>
              </div>
            </div>
            
            <div>
              <h5 className="font-medium text-gray-900 mb-2">Summary</h5>
              <div className="space-y-2 text-sm">
                <p className="flex items-center justify-between">
                  <span className="text-gray-600">Projects</span>
                  <span className="font-medium">{client.projects ? client.projects.length : 0}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-gray-600">Completed</span>
                  <span className="font-medium">
                    {client.projects ? client.projects.filter(p => 
                      p.status === "completed" || p.status === "Completed"
                    ).length : 0}
                  </span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-gray-600">In Progress</span>
                  <span className="font-medium">
                    {client.projects ? client.projects.filter(p => 
                      p.status === "in_progress" || p.status === "In Progress"
                    ).length : 0}
                  </span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-gray-600">Total Revenue</span>
                  <span className="font-medium">{formatCurrency(totalRevenue)}</span>
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="projects">
          <div className="flex justify-between items-center mb-4">
            <h5 className="font-medium text-gray-900">Projects</h5>
            <Button 
              size="sm" 
              variant="outline" 
              className="flex items-center"
              onClick={handleAddProject}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
          
          {!client.projects || client.projects.length === 0 ? (
            <div className="text-center py-6 border border-dashed rounded-md">
              <p className="text-gray-500">No projects for this client.</p>
              <div className="flex justify-center space-x-3 mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center"
                  onClick={handleAddProject}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Project
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center"
                  onClick={onNewEstimate}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Create Estimate
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {client.projects.map((project) => (
                <div 
                  key={project.id} 
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow cursor-pointer"
                  onClick={() => handleEditProject(project)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h6 className="font-medium text-lg">{project.title}</h6>
                      {project.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{project.description}</p>
                      )}
                    </div>
                    <Badge className={getProjectStatusClass(project.status)}>
                      {typeof project.budget === 'number' 
                        ? formatCurrency(project.budget)
                        : (project.budget ? formatCurrency(parseFloat(project.budget.toString())) : '-')}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center mt-3 text-sm text-gray-500">
                    <div className="flex items-center">
                      <span className="capitalize">
                        {project.status === "in_progress" && "In Progress"}
                        {project.status === "In Progress" && "In Progress"}
                        {project.status === "completed" && "Completed"}
                        {project.status === "Completed" && "Completed"}
                        {project.status === "on_hold" && "On Hold"}
                        {project.status === "On Hold" && "On Hold"}
                        {project.status === "cancelled" && "Cancelled"}
                        {project.status === "Cancelled" && "Cancelled"}
                        {!["in_progress", "In Progress", "completed", "Completed", "on_hold", "On Hold", "cancelled", "Cancelled"].includes(project.status) && project.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      {project.startDate && (
                        <span>Start: {formatDate(project.startDate)}</span>
                      )}
                      {project.endDate && (
                        <span>End: {formatDate(project.endDate)}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        

        <TabsContent value="notes">
          <div className="space-y-6">
            {/* General Notes Section */}
            <div>
              <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                General Notes
              </h5>
              <p className="text-sm text-gray-600 mb-3">
                General information about the client, preferences, special instructions, access details, etc.
              </p>
              <div className="bg-gray-50 p-3 rounded-md text-sm">
                {client.notes ? (
                  <p className="whitespace-pre-wrap">{client.notes}</p>
                ) : (
                  <p className="text-gray-500 italic">No general notes for this client.</p>
                )}
              </div>
            </div>

            {/* Cancellation History Section */}
            <div>
              <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                Cancellation History
              </h5>
              <p className="text-sm text-gray-600 mb-3">
                Record of cancelled appointments and events with reasons for cancellation.
              </p>
              <div className="bg-orange-50 border border-orange-200 p-3 rounded-md text-sm">
                {client.cancellationHistory ? (
                  <div className="space-y-1">
                    {client.cancellationHistory.split('\n').map((entry, index) => (
                      <p key={index} className="text-orange-800">{entry}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-orange-600 italic">No cancellation history for this client.</p>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="portal">
          <div className="space-y-6">
            <h5 className="font-medium text-gray-900 mb-4">Client Portal</h5>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-primary" />
                  Share access with client
                </CardTitle>
                <CardDescription>
                  Provide the client with the following link so they can access their personalized portal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Input 
                    ref={portalLinkRef}
                    value={getClientPortalUrl()}
                    readOnly
                    className="bg-gray-50 pr-20"
                  />
                  <Button variant="outline" size="sm" onClick={copyPortalLink} className="absolute right-12">
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4">
                <div className="text-sm text-gray-500">
                  <p className="flex items-center gap-1">
                    <ClipboardCheck className="h-4 w-4 text-green-500" />
                    <span>Access to estimates and invoices</span>
                  </p>
                  <p className="flex items-center gap-1">
                    <FileSignature className="h-4 w-4 text-green-500" />
                    <span>Digital document signing</span>
                  </p>
                </div>
                <Button onClick={openClientPortal} className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Open Portal
                </Button>
              </CardFooter>
            </Card>
            
            <div className="text-sm text-gray-500 p-3 border border-blue-100 bg-blue-50 rounded-md">
              <p className="font-medium text-blue-600 mb-1">Tip:</p>
              <p>Share this link with your client so they can access their project information, view and approve estimates, sign invoices, and track their work in progress.</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="flex space-x-3 mt-6">
        <Button className="flex items-center" onClick={onEdit}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Client
        </Button>
        <Button variant="outline" className="flex items-center" onClick={onNewEstimate}>
          <FileText className="h-4 w-4 mr-2" />
          New Estimate
        </Button>
        <Button 
          variant="outline" 
          className="flex items-center text-red-600 hover:text-red-600 hover:bg-red-50"
          onClick={handleDeleteClick}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {client.firstName} {client.lastName}? 
              This action cannot be undone and will remove all data associated with this client.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Project Form Dialog */}
      <Dialog open={isProjectFormOpen} onOpenChange={setIsProjectFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedProject ? "Edit Project" : "New Project"}
            </DialogTitle>
            <DialogDescription>
              {selectedProject 
                ? "Update the project information"
                : "Enter the details for the new project"}
            </DialogDescription>
          </DialogHeader>
          <ProjectForm
            project={selectedProject || undefined}
            clientId={client.id}
            onSubmit={handleProjectFormSubmit}
            isSubmitting={isCreating || isUpdating}
            onCancel={() => setIsProjectFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}