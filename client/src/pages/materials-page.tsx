import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  ChevronDown, 
  Drill, 
  Plus, 
  Search, 
  FileEdit, 
  Eye, 
  Trash2,
  ShoppingBag,
  Package,
  PackageCheck,
  PackageX,
  AlertCircle,
  Filter,
  ArchiveIcon
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
import Sidebar from "@/components/layout/sidebar";
import MobileSidebar from "@/components/layout/mobile-sidebar";
import PageHeader from "@/components/shared/page-header";
import SearchInput from "@/components/shared/search-input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

// Helper function to format currency
const formatCurrency = (amount: number | string | null | undefined) => {
  if (amount === null || amount === undefined) return "—";
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
    .format(typeof amount === 'string' ? parseFloat(amount) : amount);
};

// Helper function to get status badge style
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'in_stock':
      return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">In Stock</Badge>;
    case 'ordered':
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">Ordered</Badge>;
    case 'delivered':
      return <Badge variant="outline" className="bg-purple-100 text-purple-800 hover:bg-purple-100">Delivered</Badge>;
    case 'out_of_stock':
      return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">Out of Stock</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function MaterialsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [supplierFilter, setSupplierFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name_asc");
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<any>(null);

  // Fetch materials
  const { data: materials, isLoading, error } = useQuery({
    queryKey: ["/api/protected/materials"],
  });

  // Filter and sort materials
  const filteredMaterials = materials
    ? materials
        .filter((material: any) => {
          // Status filter
          if (statusFilter !== "all" && material.status !== statusFilter) {
            return false;
          }
          
          // Supplier filter
          if (supplierFilter !== "all" && material.supplier !== supplierFilter) {
            return false;
          }
          
          // Search filter
          if (searchQuery) {
            const lowerCaseQuery = searchQuery.toLowerCase();
            return (
              material.name.toLowerCase().includes(lowerCaseQuery) ||
              (material.description && material.description.toLowerCase().includes(lowerCaseQuery)) ||
              (material.supplier && material.supplier.toLowerCase().includes(lowerCaseQuery)) ||
              (material.orderNumber && material.orderNumber.toLowerCase().includes(lowerCaseQuery))
            );
          }
          
          return true;
        })
        .sort((a: any, b: any) => {
          if (sortBy === "name_asc") {
            return a.name.localeCompare(b.name);
          } else if (sortBy === "name_desc") {
            return b.name.localeCompare(a.name);
          } else if (sortBy === "cost_desc") {
            const aCost = a.cost ? parseFloat(a.cost) : 0;
            const bCost = b.cost ? parseFloat(b.cost) : 0;
            return bCost - aCost;
          } else if (sortBy === "cost_asc") {
            const aCost = a.cost ? parseFloat(a.cost) : 0;
            const bCost = b.cost ? parseFloat(b.cost) : 0;
            return aCost - bCost;
          } else if (sortBy === "quantity_desc") {
            const aQty = a.quantity ? parseFloat(a.quantity) : 0;
            const bQty = b.quantity ? parseFloat(b.quantity) : 0;
            return bQty - aQty;
          } else if (sortBy === "quantity_asc") {
            const aQty = a.quantity ? parseFloat(a.quantity) : 0;
            const bQty = b.quantity ? parseFloat(b.quantity) : 0;
            return aQty - bQty;
          }
          return 0;
        })
    : [];

  const viewMaterialDetails = (material: any) => {
    setSelectedMaterial(material);
    setIsDetailOpen(true);
  };

  const createNewMaterial = () => {
    setEditingMaterial(null);
    setIsFormOpen(true);
  };

  const editMaterial = (material: any) => {
    setEditingMaterial(material);
    setIsFormOpen(true);
  };

  // Calculate totals
  const calculateTotals = () => {
    if (!materials) return { totalValue: 0, count: 0, ordered: 0, outOfStock: 0 };
    
    const totalValue = materials.reduce((sum: number, material: any) => {
      const cost = material.cost ? parseFloat(material.cost) : 0;
      const quantity = material.quantity ? parseFloat(material.quantity) : 0;
      return sum + (cost * quantity);
    }, 0);
    
    return {
      totalValue,
      count: materials.length,
      ordered: materials.filter((m: any) => m.status === "ordered").length,
      outOfStock: materials.filter((m: any) => m.status === "out_of_stock").length
    };
  };

  const totals = calculateTotals();

  // Get unique suppliers for filtering
  const suppliers = materials 
    ? Array.from(new Set(materials.map((m: any) => m.supplier).filter(Boolean)))
    : [];

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <MobileSidebar />
      
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-6">
          <PageHeader 
            title="Materials & Supplies" 
            description="Track materials, supplies, and inventory"
            actions={
              <Button className="flex items-center" onClick={createNewMaterial}>
                <Plus className="h-4 w-4 mr-2" />
                Add Material
              </Button>
            }
          />
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Materials</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totals.count}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totals.totalValue)}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Items Ordered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{totals.ordered}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Out of Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{totals.outOfStock}</div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <SearchInput 
                    placeholder="Search materials..." 
                    onSearch={setSearchQuery}
                    className="w-full sm:w-80"
                  />
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="in_stock">In Stock</SelectItem>
                      <SelectItem value="ordered">Ordered</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Filter by supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Suppliers</SelectItem>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier} value={supplier}>{supplier}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                      <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                      <SelectItem value="cost_desc">Highest Cost</SelectItem>
                      <SelectItem value="cost_asc">Lowest Cost</SelectItem>
                      <SelectItem value="quantity_desc">Highest Quantity</SelectItem>
                      <SelectItem value="quantity_asc">Lowest Quantity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Advanced Filter
                  </Button>
                </div>
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Unit Cost</TableHead>
                      <TableHead>Total Cost</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array(5).fill(0).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-9 w-12 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : error ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-4 text-gray-500">
                          Error loading materials. Please try again.
                        </TableCell>
                      </TableRow>
                    ) : filteredMaterials.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          <div className="flex flex-col items-center">
                            <Drill className="h-12 w-12 text-gray-300 mb-3" />
                            <h3 className="text-lg font-medium text-gray-900 mb-1">No materials found</h3>
                            <p className="text-sm text-gray-500 mb-4">
                              {searchQuery || statusFilter !== "all" || supplierFilter !== "all"
                                ? "Try adjusting your filters"
                                : "Add your first material to get started"}
                            </p>
                            {!searchQuery && statusFilter === "all" && supplierFilter === "all" && (
                              <Button onClick={createNewMaterial}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Material
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMaterials.map((material: any) => (
                        <TableRow key={material.id} className="cursor-pointer hover:bg-gray-50" onClick={() => viewMaterialDetails(material)}>
                          <TableCell className="font-medium">{material.name}</TableCell>
                          <TableCell>{material.supplier || "—"}</TableCell>
                          <TableCell>{material.quantity || "—"}</TableCell>
                          <TableCell>{material.unit || "—"}</TableCell>
                          <TableCell>{material.cost ? formatCurrency(material.cost) : "—"}</TableCell>
                          <TableCell>
                            {material.cost && material.quantity 
                              ? formatCurrency(parseFloat(material.cost) * parseFloat(material.quantity)) 
                              : "—"}
                          </TableCell>
                          <TableCell>{getStatusBadge(material.status)}</TableCell>
                          <TableCell>{material.project?.title || "—"}</TableCell>
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
                                  viewMaterialDetails(material);
                                }}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  editMaterial(material);
                                }}>
                                  <FileEdit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <ShoppingBag className="mr-2 h-4 w-4" />
                                  Place Order
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <PackageCheck className="mr-2 h-4 w-4" />
                                  Mark as Delivered
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
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-4">Material Status Overview</h3>
              <Tabs defaultValue="byStatus">
                <TabsList className="mb-4">
                  <TabsTrigger value="byStatus">By Status</TabsTrigger>
                  <TabsTrigger value="bySupplier">By Supplier</TabsTrigger>
                </TabsList>
                
                <TabsContent value="byStatus">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4 flex items-center">
                        <div className="bg-green-100 rounded-full p-3 mr-3">
                          <Package className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm">In Stock</p>
                          <p className="text-xl font-bold">
                            {materials 
                              ? materials.filter((m: any) => m.status === 'in_stock').length 
                              : 0}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 flex items-center">
                        <div className="bg-blue-100 rounded-full p-3 mr-3">
                          <ShoppingBag className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm">Ordered</p>
                          <p className="text-xl font-bold">
                            {materials 
                              ? materials.filter((m: any) => m.status === 'ordered').length 
                              : 0}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 flex items-center">
                        <div className="bg-purple-100 rounded-full p-3 mr-3">
                          <PackageCheck className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm">Delivered</p>
                          <p className="text-xl font-bold">
                            {materials 
                              ? materials.filter((m: any) => m.status === 'delivered').length 
                              : 0}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 flex items-center">
                        <div className="bg-red-100 rounded-full p-3 mr-3">
                          <PackageX className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm">Out of Stock</p>
                          <p className="text-xl font-bold">
                            {materials 
                              ? materials.filter((m: any) => m.status === 'out_of_stock').length 
                              : 0}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="bySupplier">
                  <div className="h-80 flex items-center justify-center text-gray-500">
                    <p>Supplier breakdown chart would go here</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
      
      {/* Material Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedMaterial && (
            <div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{selectedMaterial.name}</h2>
                  <div className="flex items-center mt-1">
                    {getStatusBadge(selectedMaterial.status)}
                    {selectedMaterial.orderNumber && (
                      <span className="text-sm text-gray-500 ml-3">
                        Order #: {selectedMaterial.orderNumber}
                      </span>
                    )}
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setIsDetailOpen(false);
                    setEditingMaterial(selectedMaterial);
                    setIsFormOpen(true);
                  }}
                >
                  <FileEdit className="h-4 w-4 mr-2" />
                  Edit Material
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Material Details</h3>
                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Supplier:</span>
                          <span>{selectedMaterial.supplier || "Not specified"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Quantity:</span>
                          <span>
                            {selectedMaterial.quantity 
                              ? `${selectedMaterial.quantity} ${selectedMaterial.unit || ''}` 
                              : "Not specified"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Unit Cost:</span>
                          <span>{selectedMaterial.cost ? formatCurrency(selectedMaterial.cost) : "Not specified"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Cost:</span>
                          <span>
                            {selectedMaterial.cost && selectedMaterial.quantity 
                              ? formatCurrency(parseFloat(selectedMaterial.cost) * parseFloat(selectedMaterial.quantity)) 
                              : "Not specified"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span>{getStatusBadge(selectedMaterial.status)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Project Assignment</h3>
                  <Card>
                    <CardContent className="p-4">
                      {selectedMaterial.project ? (
                        <div className="space-y-3">
                          <div className="font-medium">{selectedMaterial.project.title}</div>
                          <div className="text-sm text-gray-600">
                            Status: {getStatusBadge(selectedMaterial.project.status)}
                          </div>
                          {selectedMaterial.project.startDate && (
                            <div className="text-sm text-gray-600">
                              Started: {new Date(selectedMaterial.project.startDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-gray-500 flex flex-col items-center py-4">
                          <ArchiveIcon className="h-8 w-8 mb-2 text-gray-300" />
                          <p>No project assigned</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <Card>
                  <CardContent className="p-4">
                    {selectedMaterial.description ? (
                      <p>{selectedMaterial.description}</p>
                    ) : (
                      <p className="text-gray-500">No description provided</p>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Notes</h3>
                <Card>
                  <CardContent className="p-4">
                    {selectedMaterial.notes ? (
                      <p>{selectedMaterial.notes}</p>
                    ) : (
                      <p className="text-gray-500">No notes available</p>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <div className="flex space-x-3 mt-6">
                {selectedMaterial.status === 'out_of_stock' && (
                  <Button>
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Place Order
                  </Button>
                )}
                
                {selectedMaterial.status === 'ordered' && (
                  <Button>
                    <PackageCheck className="h-4 w-4 mr-2" />
                    Mark as Delivered
                  </Button>
                )}
                
                {(selectedMaterial.status === 'in_stock' || selectedMaterial.status === 'delivered') && (
                  <Button variant="destructive">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Mark as Out of Stock
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Material Form Dialog (This would be a separate component in a real app) */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">{editingMaterial ? "Edit Material" : "Add New Material"}</h2>
          <p className="text-gray-500 mb-4">Material form would be here</p>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button>Save Material</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
