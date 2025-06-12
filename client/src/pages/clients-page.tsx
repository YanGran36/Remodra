import { useState } from "react";
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Plus, 
  Search, 
  Edit, 
  FileText, 
  BanknoteIcon
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Sidebar from "@/components/layout/sidebar";
import MobileSidebar from "@/components/layout/mobile-sidebar";
import PageHeader from "@/components/shared/page-header";
import SearchInput from "@/components/shared/search-input";

// Client interface
interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  clientSince: string;
  projects: {
    title: string;
    status: "In Progress" | "Completed" | "On Hold";
    value: string;
  }[];
  notes: string;
  totalRevenue: string;
}

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isClientDetailOpen, setIsClientDetailOpen] = useState(false);

  // Sample clients data - in a real app, this would come from an API call
  const clients: Client[] = [
    {
      id: "1",
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sarah.johnson@example.com",
      phone: "(555) 123-4567",
      address: "1234 Oak Street",
      city: "Springfield",
      state: "IL",
      zip: "62701",
      clientSince: "April, 2022",
      projects: [
        {
          title: "Kitchen Remodel",
          status: "In Progress",
          value: "$12,450"
        },
        {
          title: "Backyard Patio",
          status: "Completed",
          value: "$2,050"
        }
      ],
      notes: "Client prefers communication via text message rather than calls. Interested in discussing a bathroom remodel next year. Has referred two other clients.",
      totalRevenue: "$14,500"
    },
    {
      id: "2",
      firstName: "Mark",
      lastName: "Taylor",
      email: "mtaylor@example.com",
      phone: "(555) 456-7890",
      address: "567 Maple Drive",
      city: "Springfield",
      state: "IL",
      zip: "62704",
      clientSince: "May, 2023",
      projects: [
        {
          title: "Bathroom Renovation",
          status: "In Progress",
          value: "$8,750"
        }
      ],
      notes: "First-time homeowner, very detail-oriented. Prefers email communication and evening appointments after 6pm.",
      totalRevenue: "$8,750"
    },
    {
      id: "3",
      firstName: "James",
      lastName: "Davis",
      email: "james.davis@example.com",
      phone: "(555) 789-0123",
      address: "789 Pine Road",
      city: "Springfield",
      state: "IL",
      zip: "62702",
      clientSince: "January, 2023",
      projects: [
        {
          title: "Deck Construction",
          status: "In Progress",
          value: "$6,800"
        },
        {
          title: "Fence Installation",
          status: "Completed",
          value: "$3,200"
        }
      ],
      notes: "Repeat customer, prefers quality materials even at higher cost. Has two large dogs that need to be secured during site visits.",
      totalRevenue: "$10,000"
    }
  ];

  // Filter clients based on search query
  const filteredClients = clients.filter(client => {
    const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) ||
           client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
           client.phone.includes(searchQuery);
  });

  // Open client detail modal
  const openClientDetail = (client: Client) => {
    setSelectedClient(client);
    setIsClientDetailOpen(true);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <MobileSidebar />
      
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-6">
          <PageHeader 
            title="Clients" 
            description="Manage your client database"
            actions={
              <Button className="flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            }
          />

          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
                <SearchInput 
                  placeholder="Search clients by name, email, or phone..." 
                  onSearch={setSearchQuery}
                  className="w-full sm:w-80"
                />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Export
                  </Button>
                  <Button variant="outline" size="sm">
                    Import
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredClients.map((client) => (
                  <Card key={client.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-0">
                      <div className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src="" alt={`${client.firstName} ${client.lastName}`} />
                            <AvatarFallback className="bg-primary text-white">
                              {client.firstName[0]}{client.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium">{client.firstName} {client.lastName}</h3>
                            <p className="text-sm text-gray-500">Client since {client.clientSince}</p>
                          </div>
                        </div>

                        <div className="mt-3 space-y-1.5">
                          <div className="flex items-center text-sm">
                            <Phone className="h-3.5 w-3.5 text-gray-500 mr-2" />
                            <span>{client.phone}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Mail className="h-3.5 w-3.5 text-gray-500 mr-2" />
                            <span className="truncate">{client.email}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <MapPin className="h-3.5 w-3.5 text-gray-500 mr-2" />
                            <span className="truncate">{client.address}, {client.city}</span>
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="text-sm font-medium">Projects</div>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {client.projects.map((project, index) => (
                              <Badge key={index} variant="outline" className="font-normal">
                                {project.title}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex border-t border-gray-100">
                        <Button 
                          variant="ghost" 
                          className="flex-1 rounded-none text-xs text-gray-500 h-10"
                          onClick={() => openClientDetail(client)}
                        >
                          View Details
                        </Button>
                        <div className="w-px bg-gray-100" />
                        <Button 
                          variant="ghost" 
                          className="flex-1 rounded-none text-xs text-gray-500 h-10"
                        >
                          <FileText className="h-3.5 w-3.5 mr-1" />
                          New Estimate
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredClients.length === 0 && (
                <div className="text-center py-12">
                  <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No clients found</h3>
                  <p className="text-sm text-gray-500">
                    Try adjusting your search or create a new client
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Client Detail Dialog */}
      <Dialog open={isClientDetailOpen} onOpenChange={setIsClientDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedClient && (
            <>
              <DialogHeader>
                <DialogTitle>Client Details</DialogTitle>
              </DialogHeader>
              
              <div className="flex items-center mb-6">
                <Avatar className="h-16 w-16 mr-4">
                  <AvatarImage src="" alt={`${selectedClient.firstName} ${selectedClient.lastName}`} />
                  <AvatarFallback className="text-lg bg-primary text-white">
                    {selectedClient.firstName[0]}{selectedClient.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="text-lg font-semibold">{selectedClient.firstName} {selectedClient.lastName}</h4>
                  <p className="text-gray-600">{selectedClient.phone}</p>
                  <p className="text-gray-600">{selectedClient.email}</p>
                </div>
              </div>
              
              <Tabs defaultValue="info">
                <TabsList className="mb-4">
                  <TabsTrigger value="info">Contact Info</TabsTrigger>
                  <TabsTrigger value="projects">Projects</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                </TabsList>
                
                <TabsContent value="info">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Contact Information</h5>
                      <div className="space-y-2 text-sm">
                        <p className="flex items-center">
                          <MapPin className="text-gray-400 mr-2 h-4 w-4" />
                          <span>{selectedClient.address}, {selectedClient.city}, {selectedClient.state} {selectedClient.zip}</span>
                        </p>
                        <p className="flex items-center">
                          <Phone className="text-gray-400 mr-2 h-4 w-4" />
                          <span>{selectedClient.phone}</span>
                        </p>
                        <p className="flex items-center">
                          <Mail className="text-gray-400 mr-2 h-4 w-4" />
                          <span>{selectedClient.email}</span>
                        </p>
                        <p className="flex items-center">
                          <User className="text-gray-400 mr-2 h-4 w-4" />
                          <span>Client since: {selectedClient.clientSince}</span>
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Summary</h5>
                      <div className="space-y-2 text-sm">
                        <p className="flex items-center justify-between">
                          <span className="text-gray-600">Projects</span>
                          <span className="font-medium">{selectedClient.projects.length}</span>
                        </p>
                        <p className="flex items-center justify-between">
                          <span className="text-gray-600">Completed</span>
                          <span className="font-medium">
                            {selectedClient.projects.filter(p => p.status === "Completed").length}
                          </span>
                        </p>
                        <p className="flex items-center justify-between">
                          <span className="text-gray-600">In Progress</span>
                          <span className="font-medium">
                            {selectedClient.projects.filter(p => p.status === "In Progress").length}
                          </span>
                        </p>
                        <p className="flex items-center justify-between">
                          <span className="text-gray-600">Total Revenue</span>
                          <span className="font-medium">{selectedClient.totalRevenue}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="projects">
                  <h5 className="font-medium text-gray-900 mb-2">Projects</h5>
                  <div className="divide-y divide-gray-100 border border-gray-200 rounded-md">
                    {selectedClient.projects.map((project, index) => (
                      <div key={index} className="p-3 flex justify-between items-center">
                        <div>
                          <h6 className="font-medium">{project.title}</h6>
                          <p className="text-sm text-gray-600">
                            {project.status === "In Progress" && "In Progress"}
                            {project.status === "Completed" && "Completed"}
                            {project.status === "On Hold" && "On Hold"}
                          </p>
                        </div>
                        <Badge className={
                          project.status === "In Progress" ? "bg-blue-100 text-blue-800 hover:bg-blue-100" :
                          project.status === "Completed" ? "bg-green-100 text-green-800 hover:bg-green-100" :
                          "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                        }>
                          {project.value}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="notes">
                  <h5 className="font-medium text-gray-900 mb-2">Notes</h5>
                  <div className="bg-gray-50 p-3 rounded-md text-sm">
                    <p>{selectedClient.notes}</p>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="flex space-x-3 mt-6">
                <Button className="flex items-center">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Client
                </Button>
                <Button variant="outline" className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  New Estimate
                </Button>
                <Button variant="outline" className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
