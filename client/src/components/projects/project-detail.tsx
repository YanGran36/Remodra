import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { 
  Check, Edit, FileText, Loader2, MapPin, Phone, Mail, User, 
  Trash2, Building, Calendar, FilePlus, BanknoteIcon, 
  BarChart3, X, Plus, Clock, Ban, Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProjectDetail, ProjectWithClient } from "@/hooks/use-projects";
import { formatCurrency } from "@/lib/utils";
import { useLocation } from "wouter";
import { useEstimates } from "@/hooks/use-estimates";

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
  CardDescription,
  CardFooter,
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
import { Textarea } from "@/components/ui/textarea";

interface ProjectDetailProps {
  project: ProjectWithClient;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (project: ProjectWithClient) => void;
}

export default function ProjectDetailView({ project, isOpen, onClose, onEdit }: ProjectDetailProps) {
  const [isConfirmComplete, setIsConfirmComplete] = useState(false);
  const [isConfirmCancel, setIsConfirmCancel] = useState(false);
  const [cancelNotes, setCancelNotes] = useState("");
  const [isCreateEstimateModalOpen, setIsCreateEstimateModalOpen] = useState(false);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Fetch project estimates
  const { data: projectEstimates, isLoading: isLoadingEstimates } = useQuery({
    queryKey: ["/api/protected/projects", project?.id, "estimates"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/protected/projects/${project.id}/estimates`);
      return await res.json();
    },
    enabled: !!project?.id,
  });
  
  // Mutation for cancelling project
  const cancelProjectMutation = useMutation({
    mutationFn: async (notes?: string) => {
      const res = await apiRequest("POST", `/api/protected/projects/${project.id}/cancel`, { notes });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/protected/projects", project.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/protected/clients"] });
      
      toast({
        title: "Project cancelled",
        description: "The project has been cancelled successfully.",
      });
      
      setIsConfirmCancel(false);
      setCancelNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "There was an error cancelling the project.",
        variant: "destructive",
      });
    },
  });
  
  // Mutation for completing project
  const completeProjectMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/protected/projects/${project.id}/complete`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/protected/projects", project.id] });
      
      toast({
        title: "Project completed",
        description: "The project has been marked as completed.",
      });
      
      setIsConfirmComplete(false);
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "There was an error completing the project.",
        variant: "destructive",
      });
    },
  });
  
  const handleCompleteProject = () => {
    completeProjectMutation.mutate();
  };
  
  const handleCancelProject = () => {
    cancelProjectMutation.mutate(cancelNotes);
  };
  
  const handleCreateEstimate = () => {
    setLocation(`/premium-estimate?projectId=${project.id}`);
    onClose();
  };
  
  // Helper function to format dates
  const formatDate = (dateString?: string | Date | null) => {
    if (!dateString) return "Not specified";
    return format(new Date(dateString), "MMMM d, yyyy", { locale: enUS });
  };
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'on_hold':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800">On Hold</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!project) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{project.title}</span>
              {getStatusBadge(project.status)}
            </DialogTitle>
            <DialogDescription>
              {project.description || "No description provided"}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="estimates">Estimates</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Client Information */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Client Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {project.client ? (
                      <>
                        <div>
                          <span className="font-medium">
                            {project.client.firstName} {project.client.lastName}
                          </span>
                        </div>
                        {project.client.email && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="h-3 w-3 mr-2" />
                            {project.client.email}
                          </div>
                        )}
                        {project.client.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-3 w-3 mr-2" />
                            {project.client.phone}
                          </div>
                        )}
                        {project.client.address && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-3 w-3 mr-2" />
                            <span>
                              {project.client.address}
                              {project.client.city && `, ${project.client.city}`}
                              {project.client.state && `, ${project.client.state}`}
                              {project.client.zip && ` ${project.client.zip}`}
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">No client assigned</p>
                    )}
                  </CardContent>
                </Card>

                {/* Project Details */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Project Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Start Date:</span>
                      <span className="text-sm">{formatDate(project.startDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">End Date:</span>
                      <span className="text-sm">{formatDate(project.endDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="text-sm">{formatDate(project.createdAt)}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Financial Information */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center">
                      <BanknoteIcon className="h-4 w-4 mr-2" />
                      Financial
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Budget:</span>
                      <span className="text-sm font-medium">
                        {project.budget ? formatCurrency(project.budget) : "Not specified"}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex flex-col gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => onEdit(project)}
                        className="justify-start"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Project
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleCreateEstimate}
                        className="justify-start"
                      >
                        <FilePlus className="h-4 w-4 mr-2" />
                        Create Estimate
                      </Button>
                      
                      {project.status !== "completed" && project.status !== "cancelled" && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setIsConfirmComplete(true)}
                          className="justify-start text-green-600 border-green-200 hover:bg-green-50"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Mark as Completed
                        </Button>
                      )}
                      
                      {project.status !== "cancelled" && project.status !== "completed" && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setIsConfirmCancel(true)}
                          className="justify-start text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          Cancel Project
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="estimates" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Project Estimates</h3>
                <Button onClick={handleCreateEstimate} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Estimate
                </Button>
              </div>
              
              {isLoadingEstimates ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : projectEstimates && projectEstimates.length > 0 ? (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Estimate #</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projectEstimates.map((estimate: any) => (
                        <TableRow key={estimate.id}>
                          <TableCell className="font-medium">
                            {estimate.estimateNumber || `EST-${estimate.id}`}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {estimate.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatCurrency(estimate.total)}</TableCell>
                          <TableCell>{formatDate(estimate.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setLocation(`/estimates/${estimate.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500 text-center mb-4">No estimates found for this project</p>
                    <Button onClick={handleCreateEstimate}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Estimate
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <h3 className="text-lg font-semibold">Project Timeline</h3>
              <Card>
                <CardContent className="py-6">
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium">Project Created</p>
                        <p className="text-sm text-gray-500">{formatDate(project.createdAt)}</p>
                      </div>
                    </div>
                    
                    {project.startDate && (
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <Clock className="h-4 w-4 text-green-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium">Project Started</p>
                          <p className="text-sm text-gray-500">{formatDate(project.startDate)}</p>
                        </div>
                      </div>
                    )}
                    
                    {project.endDate && (
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <Check className="h-4 w-4 text-purple-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium">Expected Completion</p>
                          <p className="text-sm text-gray-500">{formatDate(project.endDate)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Complete Project Confirmation */}
      <Dialog open={isConfirmComplete} onOpenChange={setIsConfirmComplete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Project as Completed?</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this project as completed? This action will update the project status and notify relevant parties.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmComplete(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCompleteProject}
              disabled={completeProjectMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {completeProjectMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Confirm Completion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Project Confirmation */}
      <Dialog open={isConfirmCancel} onOpenChange={setIsConfirmCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Project?</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this project? This action will update the project status and all associated operations.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label htmlFor="cancelNotes" className="text-sm font-medium">
              Cancellation Reason (Optional)
            </label>
            <Textarea
              id="cancelNotes"
              placeholder="Enter reason for cancellation..."
              value={cancelNotes}
              onChange={(e) => setCancelNotes(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmCancel(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCancelProject}
              disabled={cancelProjectMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelProjectMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Ban className="h-4 w-4 mr-2" />
              )}
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}