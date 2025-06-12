import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  ChevronDown, 
  HammerIcon, 
  Plus, 
  Search, 
  FileEdit, 
  Eye, 
  Trash2,
  CheckCircle,
  ClockIcon,
  PlayIcon,
  PauseIcon,
  AlertTriangleIcon,
  MoreHorizontal
} from "lucide-react";
import ProjectDetailView from "@/components/projects/project-detail";
import KanbanBoard from "@/components/projects/kanban-board";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress"; 
import { format } from "date-fns";
import Sidebar from "@/components/layout/sidebar";
import MobileSidebar from "@/components/layout/mobile-sidebar";
import PageHeader from "@/components/shared/page-header";
import SearchInput from "@/components/shared/search-input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Helper function to format currency
const formatCurrency = (amount: number | string | null | undefined) => {
  if (amount === null || amount === undefined) return "—";
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
    .format(typeof amount === 'string' ? parseFloat(amount) : amount);
};

// Helper function to get status badge style
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
    case 'in_progress':
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">In Progress</Badge>;
    case 'on_hold':
      return <Badge variant="outline" className="bg-purple-100 text-purple-800 hover:bg-purple-100">On Hold</Badge>;
    case 'completed':
      return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
    case 'cancelled':
      return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date_desc");
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [activeView, setActiveView] = useState<"list" | "kanban">("kanban");

  // Fetch projects
  const { data: projects, isLoading, error } = useQuery({
    queryKey: ["/api/protected/projects"],
  });

  // Filter and sort projects
  const filteredProjects = projects && Array.isArray(projects)
    ? projects
        .filter((project: any) => {
          // Status filter
          if (statusFilter !== "all" && project.status !== statusFilter) {
            return false;
          }
          
          // Search filter
          if (searchQuery) {
            const lowerCaseQuery = searchQuery.toLowerCase();
            return (
              project.title.toLowerCase().includes(lowerCaseQuery) ||
              (project.description && project.description.toLowerCase().includes(lowerCaseQuery)) ||
              (project.client?.firstName && project.client.firstName.toLowerCase().includes(lowerCaseQuery)) ||
              (project.client?.lastName && project.client.lastName.toLowerCase().includes(lowerCaseQuery))
            );
          }
          
          return true;
        })
        .sort((a: any, b: any) => {
          if (sortBy === "date_desc") {
            const aDate = a.startDate ? new Date(a.startDate).getTime() : 0;
            const bDate = b.startDate ? new Date(b.startDate).getTime() : 0;
            return bDate - aDate;
          } else if (sortBy === "date_asc") {
            const aDate = a.startDate ? new Date(a.startDate).getTime() : 0;
            const bDate = b.startDate ? new Date(b.startDate).getTime() : 0;
            return aDate - bDate;
          } else if (sortBy === "budget_desc") {
            const aBudget = a.budget ? parseFloat(a.budget) : 0;
            const bBudget = b.budget ? parseFloat(b.budget) : 0;
            return bBudget - aBudget;
          } else if (sortBy === "budget_asc") {
            const aBudget = a.budget ? parseFloat(a.budget) : 0;
            const bBudget = b.budget ? parseFloat(b.budget) : 0;
            return aBudget - bBudget;
          } else if (sortBy === "title") {
            return a.title.localeCompare(b.title);
          }
          return 0;
        })
    : [];

  const projectsByStatus = {
    pending: filteredProjects.filter((p: any) => p.status === "pending"),
    in_progress: filteredProjects.filter((p: any) => p.status === "in_progress"),
    on_hold: filteredProjects.filter((p: any) => p.status === "on_hold"),
    completed: filteredProjects.filter((p: any) => p.status === "completed"),
    cancelled: filteredProjects.filter((p: any) => p.status === "cancelled")
  };

  const viewProjectDetails = (project: any) => {
    setSelectedProject(project);
    setIsDetailOpen(true);
  };

  const createNewProject = () => {
    setEditingProject(null);
    setIsFormOpen(true);
  };

  const editProject = (project: any) => {
    setEditingProject(project);
    setIsFormOpen(true);
  };

  const deleteProject = (projectId: number) => {
    // TODO: Implement delete project functionality
    console.log('Delete project:', projectId);
  };

  // Function to get random progress value (in a real app this would come from the backend)
  const getRandomProgress = (project: any) => {
    if (project.status === "completed") return 100;
    if (project.status === "pending") return 0;
    
    // Use the project id to generate a consistent random number
    const seed = parseInt(project.id.toString(), 10);
    return seed % 100;
  };

  // Calculate totals
  const calculateTotals = () => {
    if (!projects || !Array.isArray(projects)) return { total: 0, count: 0, active: 0, completed: 0 };
    
    const totalBudget = projects.reduce((sum: number, project: any) => {
      return project.budget ? sum + parseFloat(project.budget) : sum;
    }, 0);
    
    return {
      total: totalBudget,
      count: projects.length,
      active: projects.filter((p: any) => p.status === "in_progress").length,
      completed: projects.filter((p: any) => p.status === "completed").length
    };
  };

  const totals = calculateTotals();

  // Render a project card for the list view
  const renderProjectCard = (project: any) => (
    <Card key={project.id} className="mb-3 cursor-pointer hover:shadow-md transition-shadow" onClick={() => viewProjectDetails(project)}>
      <CardContent className="p-4">
        <div className="mb-2 flex justify-between items-start">
          <h3 className="font-medium text-base">{project.title}</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                viewProjectDetails(project);
              }}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                editProject(project);
              }}>
                <FileEdit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {project.client && (
          <div className="text-sm text-gray-600 mb-2">
            Client: {project.client.firstName} {project.client.lastName}
          </div>
        )}
        
        <div className="flex justify-between items-center mb-2 text-sm">
          <div>
            {project.startDate && (
              <span>Started: {format(new Date(project.startDate), 'MMM d, yyyy')}</span>
            )}
          </div>
          <div>
            {project.budget && <span className="font-medium">{formatCurrency(project.budget)}</span>}
          </div>
        </div>
        
        <div className="mb-2">
          <div className="flex justify-between mb-1 text-xs">
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
  );

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <MobileSidebar />
      
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="page-layout">
          <PageHeader 
            title="Projects" 
            description="Manage your ongoing and completed projects"
            actions={
              <Button className="flex items-center" onClick={createNewProject}>
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            }
          />
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totals.count}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Active Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{totals.active}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Completed Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{totals.completed}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Budget</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totals.total)}</div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <SearchInput 
                    placeholder="Search projects..." 
                    onSearch={setSearchQuery}
                    className="w-full sm:w-80"
                  />
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date_desc">Newest First</SelectItem>
                      <SelectItem value="date_asc">Oldest First</SelectItem>
                      <SelectItem value="budget_desc">Highest Budget</SelectItem>
                      <SelectItem value="budget_asc">Lowest Budget</SelectItem>
                      <SelectItem value="title">Project Name</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-2">
                  <div className="flex bg-muted p-1 rounded-md">
                    <Button 
                      variant={activeView === "list" ? "default" : "ghost"} 
                      size="sm"
                      onClick={() => setActiveView("list")}
                      className="rounded-sm"
                    >
                      List
                    </Button>
                    <Button 
                      variant={activeView === "kanban" ? "default" : "ghost"} 
                      size="sm"
                      onClick={() => setActiveView("kanban")}
                      className="rounded-sm"
                    >
                      Kanban
                    </Button>
                  </div>
                </div>
              </div>
              
              {activeView === "list" ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project Name</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Budget</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        Array(5).fill(0).map((_, index) => (
                          <TableRow key={index}>
                            <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                          </TableRow>
                        ))
                      ) : filteredProjects.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            <div className="flex flex-col items-center justify-center">
                              <HammerIcon className="h-12 w-12 text-gray-400 mb-4" />
                              <p className="text-gray-500 text-lg font-medium mb-2">No projects found</p>
                              <p className="text-gray-400 mb-4">Get started by creating your first project</p>
                              <Button onClick={createNewProject}>
                                <Plus className="h-4 w-4 mr-2" />
                                New Project
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredProjects.map((project: any) => (
                          <TableRow key={project.id} className="cursor-pointer hover:bg-gray-50" onClick={() => viewProjectDetails(project)}>
                            <TableCell className="font-medium">{project.title}</TableCell>
                            <TableCell>{project.client?.firstName} {project.client?.lastName}</TableCell>
                            <TableCell>{project.startDate ? format(new Date(project.startDate), 'MMM d, yyyy') : '—'}</TableCell>
                            <TableCell>{project.endDate ? format(new Date(project.endDate), 'MMM d, yyyy') : '—'}</TableCell>
                            <TableCell>{project.budget ? formatCurrency(project.budget) : '—'}</TableCell>
                            <TableCell>
                              <div className="w-full flex items-center gap-2">
                                <Progress value={getRandomProgress(project)} className="h-2 flex-grow" />
                                <span className="text-xs font-medium w-8">{getRandomProgress(project)}%</span>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(project.status)}</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <ChevronDown className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    viewProjectDetails(project);
                                  }}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    editProject(project);
                                  }}>
                                    <FileEdit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem>
                                    <PlayIcon className="mr-2 h-4 w-4" />
                                    Start Project
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <PauseIcon className="mr-2 h-4 w-4" />
                                    Pause Project
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Mark Completed
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <KanbanBoard
                  projects={filteredProjects}
                  onViewProject={viewProjectDetails}
                  onEditProject={editProject}
                  onDeleteProject={deleteProject}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      
      {/* Project Detail Dialog */}
      {selectedProject && (
        <ProjectDetailView
          project={selectedProject}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          onEdit={(project) => {
            setIsDetailOpen(false);
            setEditingProject(project);
            setIsFormOpen(true);
          }}
        />
      )}
      
      {/* Project Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">{editingProject ? "Edit Project" : "Create New Project"}</h2>
          <p className="text-gray-500 mb-4">Project form would be here</p>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button>Save Project</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}