import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEstimates } from "@/hooks/use-estimates";
import { useToast } from "@/hooks/use-toast";
import { 
  ChevronDown, 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Printer, 
  FileEdit, 
  Mail, 
  Download, 
  Eye, 
  Trash2,
  BanknoteIcon,
  Calendar, 
  CheckCircle,
  Calculator,
  XCircle,
  Clock,
  Check
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import Sidebar from "@/components/layout/sidebar";
import MobileSidebar from "@/components/layout/mobile-sidebar";
import PageHeader from "@/components/shared/page-header";
import SearchInput from "@/components/shared/search-input";
import EstimateDetail from "@/components/estimates/estimate-detail";
import EstimateForm from "@/components/estimates/estimate-form";
import { 
  Dialog, 
  DialogContent,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

// Helper function to format currency
const formatCurrency = (amount: number | string) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
    .format(typeof amount === 'string' ? parseFloat(amount) : amount);
};

// Helper function to get status badge style
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'draft':
      return <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">Draft</Badge>;
    case 'sent':
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">Sent</Badge>;
    case 'accepted':
      return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Accepted</Badge>;
    case 'rejected':
      return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>;
    case 'expired':
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Expired</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function EstimatesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date_desc");
  const [selectedEstimate, setSelectedEstimate] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEstimate, setEditingEstimate] = useState<any>(null);
  
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Use the estimates hook for all estimate-related operations
  const { 
    deleteEstimateMutation, 
    convertToInvoiceMutation,
    updateEstimateStatusMutation 
  } = useEstimates();

  // Fetch estimates
  const { data: estimates = [], isLoading, error } = useQuery({
    queryKey: ["/api/protected/estimates"],
  });

  // Filter and sort estimates
  const filteredEstimates = estimates && Array.isArray(estimates)
    ? estimates
        .filter((estimate: any) => {
          // Status filter
          if (statusFilter !== "all" && estimate.status !== statusFilter) {
            return false;
          }
          
          // Search filter
          if (searchQuery) {
            const lowerCaseQuery = searchQuery.toLowerCase();
            return (
              estimate.estimateNumber.toLowerCase().includes(lowerCaseQuery) ||
              estimate.client?.firstName.toLowerCase().includes(lowerCaseQuery) ||
              estimate.client?.lastName.toLowerCase().includes(lowerCaseQuery) ||
              (estimate.project?.title && estimate.project.title.toLowerCase().includes(lowerCaseQuery))
            );
          }
          
          return true;
        })
        .sort((a: any, b: any) => {
          if (sortBy === "date_desc") {
            return new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime();
          } else if (sortBy === "date_asc") {
            return new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime();
          } else if (sortBy === "amount_desc") {
            return parseFloat(b.total) - parseFloat(a.total);
          } else if (sortBy === "amount_asc") {
            return parseFloat(a.total) - parseFloat(b.total);
          }
          return 0;
        })
    : [];

  const viewEstimateDetails = (estimate: any) => {
    setSelectedEstimate(estimate);
    setIsDetailOpen(true);
  };

  const createNewEstimate = () => {
    setEditingEstimate(null);
    setIsFormOpen(true);
  };

  const editEstimate = (estimate: any) => {
    setEditingEstimate(estimate);
    setIsFormOpen(true);
  };

  const calculateTotal = () => {
    if (!estimates || !Array.isArray(estimates)) return { total: 0, count: 0 };
    
    const total = estimates.reduce((sum: number, estimate: any) => {
      return sum + parseFloat(estimate.total || 0);
    }, 0);
    
    return { total, count: estimates.length };
  };

  const { total, count } = calculateTotal();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <MobileSidebar />
      
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="page-layout">
          <PageHeader 
            title="Estimates" 
            description="Create and manage customer estimates"
            actions={
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="flex items-center">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Estimate
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => setLocation("/estimates/create-professional")}>
                    <Calculator className="mr-2 h-4 w-4" />
                    Office Estimate
                    <div className="text-xs text-gray-500 mt-1">For phone or in-office consultations</div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation("/agent-estimate-form")}>
                    <FileEdit className="mr-2 h-4 w-4" />
                    Agent Estimate
                    <div className="text-xs text-gray-500 mt-1">For home appointments with agents</div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            }
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Estimates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(total)}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Acceptance Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {estimates && Array.isArray(estimates)
                    ? Math.round((estimates.filter((e: any) => e.status === "accepted").length / (count || 1)) * 100) + "%"
                    : "0%"
                  }
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <SearchInput 
                    placeholder="Search estimates..." 
                    onSearch={setSearchQuery}
                    className="w-full sm:w-80"
                  />
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date_desc">Newest First</SelectItem>
                      <SelectItem value="date_asc">Oldest First</SelectItem>
                      <SelectItem value="amount_desc">Highest Amount</SelectItem>
                      <SelectItem value="amount_asc">Lowest Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
              
              <div className="table-responsive rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Estimate #</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array(5).fill(0).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-9 w-12 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : error ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                          Error loading estimates. Please try again.
                        </TableCell>
                      </TableRow>
                    ) : filteredEstimates.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex flex-col items-center">
                            <FileText className="h-12 w-12 text-gray-300 mb-3" />
                            <h3 className="text-lg font-medium text-gray-900 mb-1">No estimates found</h3>
                            <p className="text-sm text-gray-500 mb-4">
                              {searchQuery || statusFilter !== "all" 
                                ? "Try adjusting your filters"
                                : "Create your first estimate to get started"}
                            </p>
                            {!searchQuery && statusFilter === "all" && (
                              <Button onClick={createNewEstimate}>
                                <Plus className="h-4 w-4 mr-2" />
                                New Estimate
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEstimates.map((estimate: any) => (
                        <TableRow key={estimate.id} className="cursor-pointer hover:bg-gray-50" onClick={() => viewEstimateDetails(estimate)}>
                          <TableCell className="font-medium">{estimate.estimateNumber}</TableCell>
                          <TableCell>{estimate.client?.firstName} {estimate.client?.lastName}</TableCell>
                          <TableCell>{estimate.project?.title || "—"}</TableCell>
                          <TableCell>{format(new Date(estimate.issueDate), 'MMM d, yyyy')}</TableCell>
                          <TableCell>{formatCurrency(estimate.total)}</TableCell>
                          <TableCell>{getStatusBadge(estimate.status)}</TableCell>
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
                                  viewEstimateDetails(estimate);
                                }}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Standard
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = `/estimates/${estimate.id}`;
                                }} className="text-primary">
                                  <FileText className="mr-2 h-4 w-4" />
                                  View Premium
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  editEstimate(estimate);
                                }}>
                                  <FileEdit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm("Are you sure you want to send this estimate to the client?")) {
                                    updateEstimateStatusMutation.mutate({
                                      id: estimate.id,
                                      status: "sent"
                                    });
                                  }
                                }}>
                                  <Mail className="mr-2 h-4 w-4" />
                                  Send
                                </DropdownMenuItem>
                                {estimate.status === 'sent' && (
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm("Are you sure you want to accept this estimate?")) {
                                      updateEstimateStatusMutation.mutate({
                                        id: estimate.id,
                                        status: "accepted"
                                      });
                                    }
                                  }} className="text-green-600">
                                    <Check className="mr-2 h-4 w-4" />
                                    Accept Estimate
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  // Check if estimate is accepted
                                  if (estimate.status !== "accepted") {
                                    toast({
                                      title: "Cannot convert",
                                      description: "Only estimates with 'Accepted' status can be converted to invoices.",
                                      variant: "destructive"
                                    });
                                    return;
                                  }
                                  
                                  // Confirm before converting
                                  if (confirm("Are you sure you want to convert this estimate to an invoice?")) {
                                    convertToInvoiceMutation.mutate(estimate.id, {
                                      onSuccess: (invoice) => {
                                        // Redirect to created invoice
                                        setLocation(`/invoices/${invoice.id}`);
                                      }
                                    });
                                  }
                                }}>
                                  <BanknoteIcon className="mr-2 h-4 w-4" />
                                  Convert to Invoice
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Download className="mr-2 h-4 w-4" />
                                  Download PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Printer className="mr-2 h-4 w-4" />
                                  Print
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm(`Are you sure you want to delete estimate ${estimate.estimateNumber}?`)) {
                                      deleteEstimateMutation.mutate(estimate.id);
                                    }
                                  }}
                                >
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
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-4">Estimate Status Overview</h3>
              <Tabs defaultValue="byStatus">
                <TabsList className="mb-4">
                  <TabsTrigger value="byStatus">By Status</TabsTrigger>
                  <TabsTrigger value="byMonth">By Month</TabsTrigger>
                </TabsList>
                
                <TabsContent value="byStatus">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4 flex items-center">
                        <div className="bg-yellow-100 rounded-full p-3 mr-3">
                          <Clock className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm">Draft</p>
                          <p className="text-xl font-bold">
                            {estimates && Array.isArray(estimates)
                              ? estimates.filter((e: any) => e.status === 'draft').length 
                              : 0}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 flex items-center">
                        <div className="bg-blue-100 rounded-full p-3 mr-3">
                          <Mail className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm">Sent</p>
                          <p className="text-xl font-bold">
                            {estimates && Array.isArray(estimates)
                              ? estimates.filter((e: any) => e.status === 'sent').length 
                              : 0}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 flex items-center">
                        <div className="bg-green-100 rounded-full p-3 mr-3">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm">Accepted</p>
                          <p className="text-xl font-bold">
                            {estimates && Array.isArray(estimates)
                              ? estimates.filter((e: any) => e.status === 'accepted').length 
                              : 0}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 flex items-center">
                        <div className="bg-red-100 rounded-full p-3 mr-3">
                          <XCircle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm">Rejected</p>
                          <p className="text-xl font-bold">
                            {estimates && Array.isArray(estimates)
                              ? estimates.filter((e: any) => e.status === 'rejected').length 
                              : 0}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="byMonth">
                  <div className="h-80 flex items-center justify-center text-gray-500">
                    <p>Monthly breakdown chart would go here</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
      
      {/* Estimate Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          {selectedEstimate && (
            <EstimateDetail 
              estimateId={selectedEstimate.id} 
              isOpen={true}
              onClose={() => setIsDetailOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Estimate Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(open) => {
        setIsFormOpen(open);
        if (!open) setEditingEstimate(null); // Limpiar el estimado en edición si se cierra
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <div className="sr-only">
            <DialogTitle>
              {editingEstimate ? "Editar estimado" : "Crear nuevo estimado"}
            </DialogTitle>
            <DialogDescription>
              {editingEstimate 
                ? "Actualice los detalles del estimado existente" 
                : "Complete el formulario para crear un nuevo estimado"
              }
            </DialogDescription>
          </div>
          <EstimateForm 
            clientId={editingEstimate?.clientId}
            projectId={editingEstimate?.projectId}
            estimateId={editingEstimate?.id} // Pasar el ID del estimado para edición
            onCancel={() => {
              setIsFormOpen(false);
              setEditingEstimate(null); // Limpiar el estimado en edición
            }}
            onSuccess={() => {
              setIsFormOpen(false);
              setEditingEstimate(null); // Limpiar el estimado en edición
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
