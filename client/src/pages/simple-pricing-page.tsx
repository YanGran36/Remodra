import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface Service {
  id: string;
  name: string;
  serviceType: string;
  unit: string;
  laborRate: number;
  laborMethod: string;
}

export default function SimplePricingPage() {
  const [newService, setNewService] = useState({
    name: "",
    serviceType: "",
    unit: "sqft",
    laborRate: 0,
    laborMethod: "by_area"
  });

  const [editingService, setEditingService] = useState<Service | null>(null);

  // Get services from database using direct endpoint
  const { data: services = [], refetch, isLoading } = useQuery<Service[]>({
    queryKey: ['/api/direct/services'],
  });

  console.log('Services from DIRECT API:', services);
  console.log('Services loading:', isLoading);

  const { toast } = useToast();

  const handleSaveService = async () => {
    try {
      const serviceData = editingService ? newService : newService;
      
      if (!serviceData.name || !serviceData.serviceType) {
        toast({
          title: "Missing Information",
          description: "Please fill in service name and type",
          variant: "destructive",
        });
        return;
      }

      if (editingService) {
        // Update existing service using a completely different approach
        console.log(`Updating ${editingService.serviceType} price to ${serviceData.laborRate}`);
        
        // First delete the old service
        const deleteResponse = await fetch(`/api/direct/services/${editingService.serviceType}`, {
          method: 'DELETE'
        });
        
        if (!deleteResponse.ok) {
          throw new Error('Failed to delete old service');
        }
        
        // Then create a new one with updated price
        const response = await fetch('/api/direct/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: serviceData.name,
            serviceType: serviceData.serviceType,
            unit: serviceData.unit,
            laborRate: serviceData.laborRate,
            laborMethod: serviceData.laborMethod
          })
        });

        if (response.ok) {
          setEditingService(null);
          resetForm();
          refetch();
          toast({
            title: "Service Updated",
            description: "Service has been updated successfully",
          });
        } else {
          throw new Error('Failed to update service');
        }
      } else {
        // Create new service
        const response = await fetch('/api/direct/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(serviceData)
        });

        if (response.ok) {
          resetForm();
          refetch();
          toast({
            title: "Service Added",
            description: "New service has been saved successfully",
          });
        } else {
          throw new Error('Failed to save service');
        }
      }
    } catch (error) {
      console.error('Error saving service:', error);
      toast({
        title: "Error",
        description: "Could not save service. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setNewService({
      name: "",
      serviceType: "",
      unit: "sqft",
      laborRate: 0,
      laborMethod: "by_area"
    });
    setEditingService(null);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setNewService({
      name: service.name,
      serviceType: service.serviceType,
      unit: service.unit,
      laborRate: Number(service.laborRate),
      laborMethod: service.laborMethod
    });
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      const response = await fetch(`/api/direct/services/${serviceId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        refetch();
        toast({
          title: "Service Deleted",
          description: "Service has been removed successfully",
        });
      } else {
        throw new Error('Failed to delete service');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        title: "Error",
        description: "Could not delete service. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Service Labor Rates</h1>
        <Link href="/">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
      
      {/* Add New Service Form */}
      <Card>
        <CardHeader>
          <CardTitle>
            {editingService ? 'Edit Service' : 'Add New Service'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Service Name</label>
              <Input 
                value={newService.name}
                onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Roof Installation"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Service Type</label>
              <Select value={newService.serviceType} onValueChange={(value) => setNewService(prev => ({ ...prev, serviceType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fence">Fence Installation</SelectItem>
                  <SelectItem value="deck">Deck Construction</SelectItem>
                  <SelectItem value="roof">Roofing</SelectItem>
                  <SelectItem value="windows">Windows Installation</SelectItem>
                  <SelectItem value="gutters">Gutters & Downspouts</SelectItem>
                  <SelectItem value="siding">Siding Installation</SelectItem>
                  <SelectItem value="flooring">Flooring Installation</SelectItem>
                  <SelectItem value="painting">Painting Services</SelectItem>
                  <SelectItem value="electrical">Electrical Work</SelectItem>
                  <SelectItem value="plumbing">Plumbing Services</SelectItem>
                  <SelectItem value="concrete">Concrete Work</SelectItem>
                  <SelectItem value="landscaping">Landscaping</SelectItem>
                  <SelectItem value="hvac">HVAC Services</SelectItem>
                  <SelectItem value="other">Other Services</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Unit</label>
              <Select value={newService.unit} onValueChange={(value) => setNewService(prev => ({ ...prev, unit: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sqft">Square Feet</SelectItem>
                  <SelectItem value="ft">Linear Feet</SelectItem>
                  <SelectItem value="unit">Per Unit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Labor Rate ($)</label>
              <Input 
                type="number"
                value={newService.laborRate}
                onChange={(e) => setNewService(prev => ({ ...prev, laborRate: Number(e.target.value) }))}
                placeholder="15.00"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSaveService} className="flex-1">
              {editingService ? 'Update Service' : 'Save Service'}
            </Button>
            {editingService && (
              <Button onClick={resetForm} variant="outline" className="flex-1">
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Services Table */}
      <Card>
        <CardHeader>
          <CardTitle>Current Services ({services.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service Type</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Labor Rate</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500">
                    Loading services...
                  </TableCell>
                </TableRow>
              ) : services.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500">
                    No services configured yet. Add your first service above.
                    <br />
                    <small>API Response: {JSON.stringify(services)}</small>
                  </TableCell>
                </TableRow>
              ) : (
                services.map((service, index) => (
                  <TableRow key={service.id || service.serviceType || index}>
                    <TableCell className="font-medium">{service.name || 'Unknown Service'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{service.serviceType || service.id}</Badge>
                    </TableCell>
                    <TableCell>${service.laborRate || 0}/{service.unit || 'unit'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditService(service)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteService(service.serviceType || service.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}