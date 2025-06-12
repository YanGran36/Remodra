import { useState, useRef } from "react";
import { 
  User, 
  Plus, 
  Search,
  Home,
  Grid3X3,
  List,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  Eye,
  Edit,
  Trash2,
  FileText,
  Download,
  Upload
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Sidebar from "@/components/layout/sidebar";
import MobileSidebar from "@/components/layout/mobile-sidebar";
import PageHeader from "@/components/shared/page-header";
import SearchInput from "@/components/shared/search-input";
import ClientForm from "@/components/clients/client-form";
import ClientCard from "@/components/clients/client-card";
import ClientDetail from "@/components/clients/client-detail";
import { useClients, ClientWithProjects, ClientInput } from "@/hooks/use-clients";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<ClientWithProjects | null>(null);
  const [isClientDetailOpen, setIsClientDetailOpen] = useState(false);
  const [isClientFormOpen, setIsClientFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "list">("list");
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    clients,
    isLoadingClients,
    createClient,
    updateClient,
    deleteClient,
    isCreating,
    isUpdating,
    isDeleting
  } = useClients();

  // Export clients mutation
  const exportClientsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/protected/data/clients/export", {
        method: "GET",
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to export clients");
      }
      
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `clients_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast({
        title: "Export Successful",
        description: "Client data has been exported and downloaded.",
      });
    },
    onError: () => {
      toast({
        title: "Export Failed",
        description: "Failed to export client data. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Import clients mutation
  const importClientsMutation = useMutation({
    mutationFn: async (clientsData: any[]) => {
      const response = await apiRequest("POST", "/api/protected/data/clients/import", {
        clientsData,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/clients"] });
      toast({
        title: "Import Successful",
        description: data.message,
      });
    },
    onError: () => {
      toast({
        title: "Import Failed",
        description: "Failed to import client data. Please check the file format.",
        variant: "destructive",
      });
    },
  });

  // Filter clients based on search criteria
  const filteredClients = clients.filter(client => {
    const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
    const searchQueryLower = searchQuery.toLowerCase();
    
    return fullName.includes(searchQueryLower) ||
      (client.email && client.email.toLowerCase().includes(searchQueryLower)) ||
      (client.phone && client.phone.includes(searchQuery));
  });

  // Abrir diálogo para crear un nuevo cliente
  const handleAddClient = () => {
    setSelectedClient(null);
    setIsEditMode(false);
    setIsClientFormOpen(true);
  };

  // Abrir diálogo para editar un cliente existente
  const handleEditClient = () => {
    if (!selectedClient) return;
    setIsEditMode(true);
    setIsClientDetailOpen(false);
    setIsClientFormOpen(true);
  };

  // Abrir diálogo para ver detalles de un cliente
  const handleViewClientDetails = (client: ClientWithProjects) => {
    setSelectedClient(client);
    setIsClientDetailOpen(true);
  };

  // Manejar la creación o edición de un cliente
  const handleClientFormSubmit = (data: ClientInput) => {
    if (isEditMode && selectedClient) {
      updateClient({
        id: selectedClient.id,
        data
      });
    } else {
      createClient(data);
    }
    setIsClientFormOpen(false);
  };

  // Manejar la eliminación de un cliente
  const handleDeleteClient = () => {
    if (!selectedClient) return;
    deleteClient(selectedClient.id);
    setIsClientDetailOpen(false);
  };

  // Handle creating a new estimate for a client
  const handleNewEstimate = (client?: ClientWithProjects) => {
    const targetClient = client || selectedClient;
    if (!targetClient) return;
    
    setIsClientDetailOpen(false);
    setLocation(`/estimates/create-professional?clientId=${targetClient.id}`);
  };

  // Handle export clients
  const handleExportClients = () => {
    exportClientsMutation.mutate();
  };

  // Handle import clients
  const handleImportClients = () => {
    fileInputRef.current?.click();
  };

  // Handle file selection for import
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const clientsData = JSON.parse(e.target?.result as string);
        if (Array.isArray(clientsData)) {
          importClientsMutation.mutate(clientsData);
        } else {
          toast({
            title: "Invalid File Format",
            description: "Please select a valid JSON file with client data.",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "File Parse Error",
          description: "Unable to read the selected file. Please check the format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <MobileSidebar />
      
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="page-layout">
          <PageHeader 
            title="Clients" 
            description="Manage your client database"
            actions={
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline"
                  onClick={() => setLocation("/")}
                  className="flex items-center"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>

                <Button className="flex items-center" onClick={handleAddClient}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Client
                </Button>
              </div>
            }
          />

          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
                <SearchInput 
                  placeholder="Search clients by name, email or phone..." 
                  onSearch={setSearchQuery}
                  className="w-full sm:w-80"
                />
                <div className="flex gap-2">
                  <div className="flex border rounded-lg p-1 bg-gray-50">
                    <Button
                      variant={viewMode === "cards" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("cards")}
                      className="px-3"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="px-3"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleExportClients}
                    disabled={exportClientsMutation.isPending}
                  >
                    {exportClientsMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Export
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleImportClients}
                    disabled={importClientsMutation.isPending}
                  >
                    {importClientsMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Import
                  </Button>
                </div>
              </div>

              {/* Hidden file input for import */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              {isLoadingClients ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredClients.length > 0 ? (
                viewMode === "cards" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredClients.map((client) => (
                      <ClientCard 
                        key={client.id} 
                        client={client}
                        onViewDetails={handleViewClientDetails}
                        onNewEstimate={() => handleNewEstimate(client)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border overflow-hidden">
                    {/* Table Header */}
                    <div className="bg-gray-50 border-b px-6 py-4">
                      <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
                        <div className="col-span-3">Client</div>
                        <div className="col-span-2">Contact</div>
                        <div className="col-span-3">Address</div>
                        <div className="col-span-2">Projects</div>
                        <div className="col-span-1">Added</div>
                        <div className="col-span-1">Actions</div>
                      </div>
                    </div>
                    
                    {/* Table Body */}
                    <div className="divide-y divide-gray-100">
                      {filteredClients.map((client) => (
                        <div key={client.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                          <div className="grid grid-cols-12 gap-4 items-center">
                            {/* Client Info */}
                            <div className="col-span-3">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                  {client.firstName?.charAt(0)}{client.lastName?.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {client.firstName} {client.lastName}
                                  </div>
                                  {client.notes && (
                                    <div className="text-sm text-gray-500 truncate max-w-32">
                                      {client.notes}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Contact Info */}
                            <div className="col-span-2">
                              <div className="space-y-1">
                                {client.email && (
                                  <div className="flex items-center text-sm text-gray-600">
                                    <Mail className="h-3 w-3 mr-1 text-gray-400" />
                                    <span className="truncate">{client.email}</span>
                                  </div>
                                )}
                                {client.phone && (
                                  <div className="flex items-center text-sm text-gray-600">
                                    <Phone className="h-3 w-3 mr-1 text-gray-400" />
                                    <span>{client.phone}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Address */}
                            <div className="col-span-3">
                              {client.address ? (
                                <div className="flex items-start text-sm text-gray-600">
                                  <MapPin className="h-3 w-3 mr-1 text-gray-400 mt-0.5 flex-shrink-0" />
                                  <div className="truncate">
                                    <div>{client.address}</div>
                                    {(client.city || client.state || client.zip) && (
                                      <div className="text-xs text-gray-500">
                                        {[client.city, client.state, client.zip].filter(Boolean).join(', ')}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400">No address</span>
                              )}
                            </div>
                            
                            {/* Projects */}
                            <div className="col-span-2">
                              <div className="flex items-center space-x-2">
                                <Building className="h-4 w-4 text-gray-400" />
                                <span className="text-sm font-medium text-gray-900">
                                  {client.projects?.length || 0}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {client.projects?.length === 1 ? 'project' : 'projects'}
                                </span>
                              </div>
                            </div>
                            
                            {/* Date Added */}
                            <div className="col-span-1">
                              <div className="flex items-center text-sm text-gray-600">
                                <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                                <span>
                                  {new Date(client.createdAt).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                </span>
                              </div>
                            </div>
                            
                            {/* Actions */}
                            <div className="col-span-1">
                              <div className="flex items-center space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewClientDetails(client)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleNewEstimate(client)}
                                  className="h-8 w-8 p-0"
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ) : (
                <div className="text-center py-12">
                  <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No clients found</h3>
                  <p className="text-sm text-gray-500">
                    Adjust your search or create a new client
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Cliente Detail Dialog */}
      <Dialog open={isClientDetailOpen} onOpenChange={setIsClientDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedClient && (
            <ClientDetail 
              client={selectedClient}
              onEdit={handleEditClient}
              onDelete={handleDeleteClient}
              onNewEstimate={() => handleNewEstimate()}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Cliente Form Dialog */}
      <Dialog open={isClientFormOpen} onOpenChange={setIsClientFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit Client" : "Add New Client"}
            </DialogTitle>
          </DialogHeader>
          <ClientForm 
            client={isEditMode && selectedClient ? {
              id: selectedClient.id,
              firstName: selectedClient.firstName,
              lastName: selectedClient.lastName,
              email: selectedClient.email,
              phone: selectedClient.phone,
              address: selectedClient.address,
              city: selectedClient.city,
              state: selectedClient.state,
              zip: selectedClient.zip,
              notes: selectedClient.notes,
              createdAt: selectedClient.createdAt
            } : undefined}
            onSubmit={handleClientFormSubmit}
            isSubmitting={isEditMode ? isUpdating : isCreating}
            onCancel={() => setIsClientFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}