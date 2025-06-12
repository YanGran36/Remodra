import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverlay as DragOverlayType,
  closestCorners,
  rectIntersection,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Eye, 
  FileEdit, 
  Trash2, 
  MoreHorizontal,
  CalendarIcon,
  DollarSign
} from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ProjectWithClient {
  id: number;
  title: string;
  description?: string;
  status: string;
  budget?: string | number;
  startDate?: string | Date;
  endDate?: string | Date;
  position?: number;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface KanbanBoardProps {
  projects: ProjectWithClient[];
  onViewProject: (project: ProjectWithClient) => void;
  onEditProject: (project: ProjectWithClient) => void;
  onDeleteProject: (projectId: number) => void;
}

interface Column {
  id: string;
  title: string;
  projects: ProjectWithClient[];
  color: string;
  bgColor: string;
}

// Helper function to format currency
const formatCurrency = (amount: number | string | null | undefined) => {
  if (amount === null || amount === undefined) return "—";
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
    .format(typeof amount === 'string' ? parseFloat(amount) : amount);
};

// Helper function to get random progress value (in a real app this would come from the backend)
const getRandomProgress = (project: ProjectWithClient) => {
  if (project.status === "completed") return 100;
  if (project.status === "pending") return 0;
  
  // Use the project id to generate a consistent random number
  const seed = parseInt(project.id.toString(), 10);
  return Math.max(10, seed % 90);
};

function DroppableColumn({ 
  column, 
  onViewProject, 
  onEditProject, 
  onDeleteProject 
}: {
  column: Column;
  onViewProject: (project: ProjectWithClient) => void;
  onEditProject: (project: ProjectWithClient) => void;
  onDeleteProject: (projectId: number) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: column.id,
  });

  const style = {
    backgroundColor: isOver ? 'rgba(0, 0, 0, 0.1)' : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${column.bgColor} rounded-lg p-4 min-h-96`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            column.id === 'pending' ? 'bg-yellow-500' :
            column.id === 'in_progress' ? 'bg-blue-500' :
            column.id === 'on_hold' ? 'bg-purple-500' :
            column.id === 'completed' ? 'bg-green-500' :
            'bg-red-500'
          }`}></div>
          <h3 className={`font-semibold ${column.color}`}>{column.title}</h3>
          <Badge variant="outline" className="ml-1 text-xs rounded-full">
            {column.projects.length}
          </Badge>
        </div>
      </div>

      <SortableContext
        items={column.projects.map(p => p.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="min-h-32 space-y-2">
          {column.projects.map(project => (
            <SortableProjectCard
              key={project.id}
              project={project}
              onView={onViewProject}
              onEdit={onEditProject}
              onDelete={onDeleteProject}
            />
          ))}
          
          {column.projects.length === 0 && (
            <div className="flex items-center justify-center h-24 border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-sm text-gray-500">
                No {column.title.toLowerCase()} projects
              </p>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

function SortableProjectCard({ 
  project, 
  onView, 
  onEdit, 
  onDelete 
}: { 
  project: ProjectWithClient;
  onView: (project: ProjectWithClient) => void;
  onEdit: (project: ProjectWithClient) => void;
  onDelete: (projectId: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="mb-3 cursor-pointer hover:shadow-md transition-all duration-200 group">
        <CardContent className="p-4">
          <div className="mb-2 flex justify-between items-start">
            <h3 className="font-medium text-base line-clamp-2 flex-1 mr-2">{project.title}</h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onView(project);
                }}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onEdit(project);
                }}>
                  <FileEdit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(project.id);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {project.client && (
            <div className="text-sm text-gray-600 mb-2 flex items-center">
              <span className="font-medium text-gray-800">
                {project.client.firstName} {project.client.lastName}
              </span>
            </div>
          )}
          
          <div className="flex justify-between items-center mb-3 text-sm">
            <div className="flex items-center text-gray-500">
              {project.startDate && (
                <div className="flex items-center">
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  <span>{format(new Date(project.startDate), 'MMM d')}</span>
                </div>
              )}
            </div>
            <div className="flex items-center text-gray-800">
              {project.budget && (
                <div className="flex items-center">
                  <DollarSign className="h-3 w-3 mr-1" />
                  <span className="font-medium">{formatCurrency(project.budget)}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="mb-2">
            <div className="flex justify-between mb-1 text-xs text-gray-500">
              <span>Progress</span>
              <span>{getRandomProgress(project)}%</span>
            </div>
            <Progress value={getRandomProgress(project)} className="h-1.5" />
          </div>
          
          {project.description && (
            <p className="text-xs text-gray-500 mt-2 line-clamp-2">{project.description}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ProjectCardOverlay({ project }: { project: ProjectWithClient }) {
  return (
    <Card className="w-80 shadow-lg border-2 border-blue-500">
      <CardContent className="p-4">
        <h3 className="font-medium text-base mb-2">{project.title}</h3>
        {project.client && (
          <div className="text-sm text-gray-600 mb-2">
            Client: {project.client.firstName} {project.client.lastName}
          </div>
        )}
        <div className="flex justify-between items-center text-sm">
          <div>
            {project.startDate && (
              <span>Started: {format(new Date(project.startDate), 'MMM d, yyyy')}</span>
            )}
          </div>
          <div>
            {project.budget && <span className="font-medium">{formatCurrency(project.budget)}</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function KanbanBoard({ 
  projects, 
  onViewProject, 
  onEditProject, 
  onDeleteProject 
}: KanbanBoardProps) {
  const [activeProject, setActiveProject] = useState<ProjectWithClient | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Mutation to update a single project's status
  const updateProjectStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PATCH", `/api/protected/projects/${id}`, {
        status
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/projects"] });
      toast({
        title: "Project Updated",
        description: "Project status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update project status.",
        variant: "destructive",
      });
    },
  });

  // Define columns with their properties and sort projects by position
  const columns: Column[] = [
    {
      id: "pending",
      title: "Pending",
      color: "text-yellow-700",
      bgColor: "bg-yellow-50",
      projects: projects.filter(p => p.status === "pending").sort((a, b) => (a.position || 0) - (b.position || 0)),
    },
    {
      id: "in_progress",
      title: "In Progress",
      color: "text-blue-700",
      bgColor: "bg-blue-50",
      projects: projects.filter(p => p.status === "in_progress").sort((a, b) => (a.position || 0) - (b.position || 0)),
    },
    {
      id: "on_hold",
      title: "On Hold",
      color: "text-purple-700",
      bgColor: "bg-purple-50",
      projects: projects.filter(p => p.status === "on_hold").sort((a, b) => (a.position || 0) - (b.position || 0)),
    },
    {
      id: "completed",
      title: "Completed",
      color: "text-green-700",
      bgColor: "bg-green-50",
      projects: projects.filter(p => p.status === "completed").sort((a, b) => (a.position || 0) - (b.position || 0)),
    },
    {
      id: "cancelled",
      title: "Cancelled",
      color: "text-red-700",
      bgColor: "bg-red-50",
      projects: projects.filter(p => p.status === "cancelled").sort((a, b) => (a.position || 0) - (b.position || 0)),
    },
  ];

  function handleDragStart(event: DragStartEvent) {
    const project = projects.find(p => p.id === event.active.id);
    setActiveProject(project || null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    
    if (!over) {
      setActiveProject(null);
      return;
    }

    const activeProject = projects.find(p => p.id === active.id);
    if (!activeProject) {
      setActiveProject(null);
      return;
    }

    // Get the target column ID
    let targetColumnId = over.id as string;
    
    // If dropping on a project card, get the column from its status
    if (!columns.find(col => col.id === targetColumnId)) {
      const targetProject = projects.find(p => p.id === over.id);
      if (targetProject) {
        targetColumnId = targetProject.status;
      }
    }

    // Check if we're dropping on a different column
    if (targetColumnId && activeProject.status !== targetColumnId) {
      console.log('Drag end data:', {
        activeProject: activeProject,
        targetColumnId: targetColumnId,
        updateData: {
          id: activeProject.id,
          status: targetColumnId
        }
      });
      
      // Use the simple single project status update
      updateProjectStatusMutation.mutate({
        id: activeProject.id,
        status: targetColumnId
      });
    }

    setActiveProject(null);
  }

  function handleDragOver(event: DragOverEvent) {
    // Handle drag over for better UX feedback
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {columns.map((column) => (
          <DroppableColumn
            key={column.id}
            column={column}
            onViewProject={onViewProject}
            onEditProject={onEditProject}
            onDeleteProject={onDeleteProject}
          />
        ))}
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeProject && (
          <ProjectCardOverlay project={activeProject} />
        )}
      </DragOverlay>
    </DndContext>
  );
}