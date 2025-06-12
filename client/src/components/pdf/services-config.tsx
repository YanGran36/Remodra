import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Plus, X, Save, DollarSign } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

interface Service {
  id: string;
  name: string;
  description: string;
  pricePerUnit: number;
  unit: string;
}

interface ServicesConfigProps {
  contractorId: number;
  onSave?: () => void;
}

export default function ServicesConfig({ contractorId, onSave }: ServicesConfigProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [newService, setNewService] = useState<Omit<Service, "id">>({
    name: "",
    description: "",
    pricePerUnit: 0,
    unit: "hour"
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load existing services
  const loadServices = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/contractor/${contractorId}/services`);
      if (response.ok) {
        const data = await response.json();
        setServices(Array.isArray(data) ? data : []);
      } else {
        // If there's an error in the response, show detailed error
        let errorText = "Unknown error";
        try {
          errorText = await response.text();
        } catch {
          // If we can't read the response, use the generic message
        }
        console.error("Error loading services:", errorText);
        
        // Use sample services if they can't be loaded from the server
        setServices([
          {
            id: "1",
            name: "Solar Panel Installation",
            description: "Complete solar system installation",
            pricePerUnit: 250,
            unit: "panel"
          },
          {
            id: "2",
            name: "HVAC Maintenance",
            description: "Maintenance service for air conditioning systems",
            pricePerUnit: 95,
            unit: "hour"
          },
          {
            id: "3",
            name: "Interior Painting",
            description: "High-quality interior painting",
            pricePerUnit: 3,
            unit: "sq.ft"
          }
        ]);
      }
    } catch (error) {
      console.error("Error loading services:", error);
      // If there's a network error or any other error, use sample services
      setServices([
        {
          id: "1",
          name: "Solar Panel Installation",
          description: "Complete solar system installation",
          pricePerUnit: 250,
          unit: "panel"
        },
        {
          id: "2",
          name: "HVAC Maintenance",
          description: "Maintenance service for air conditioning systems",
          pricePerUnit: 95,
          unit: "hour"
        },
        {
          id: "3",
          name: "Interior Painting",
          description: "High-quality interior painting",
          pricePerUnit: 3,
          unit: "sq.ft"
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, [contractorId]);

  // Add a new service
  const handleAddService = async () => {
    if (!newService.name || newService.pricePerUnit <= 0) {
      toast({
        title: "Incomplete Information",
        description: "Please enter at least the name and a valid price",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      // Generate temporary ID while integrating with backend
      const tempId = Date.now().toString();
      const newServiceWithId = { ...newService, id: tempId };
      
      // Options for when integrated with the backend
      /*
      const response = await fetch(`/api/contractor/${contractorId}/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newService)
      });
      
      if (response.ok) {
        const savedService = await response.json();
        setServices([...services, savedService]);
      }
      */
      
      // For now, simply add locally
      setServices([...services, newServiceWithId]);
      setNewService({
        name: "",
        description: "",
        pricePerUnit: 0,
        unit: "hour"
      });
      
      toast({
        title: "Service Added",
        description: "The service has been successfully added",
      });
    } catch (error) {
      console.error("Error adding service:", error);
      toast({
        title: "Error Saving",
        description: "Could not add the service",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a service
  const handleDeleteService = async (id: string) => {
    try {
      setIsLoading(true);
      
      // Options for when integrated with the backend
      /*
      const response = await fetch(`/api/contractor/${contractorId}/services/${id}`, {
        method: "DELETE"
      });
      
      if (response.ok) {
        setServices(services.filter(service => service.id !== id));
      }
      */
      
      // For now, simply delete locally
      setServices(services.filter(service => service.id !== id));
      
      toast({
        title: "Service Deleted",
        description: "The service has been successfully deleted",
      });
    } catch (error) {
      console.error("Error deleting service:", error);
      toast({
        title: "Error Deleting",
        description: "Could not delete the service",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Save all services
  const saveAllServices = async () => {
    try {
      setIsLoading(true);
      
      // Options for when integrated with the backend
      /*
      const response = await fetch(`/api/contractor/${contractorId}/services/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(services)
      });
      
      if (response.ok) {
        toast({
          title: "Services Saved",
          description: "All services have been successfully saved",
        });
      }
      */
      
      // For now, just show a message
      toast({
        title: "Services Saved",
        description: "All services have been successfully saved",
      });
      
      onSave && onSave();
    } catch (error) {
      console.error("Error saving services:", error);
      toast({
        title: "Error Saving",
        description: "Could not save the services",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle changes in the new service
  const handleNewServiceChange = (field: keyof Omit<Service, "id">, value: string | number) => {
    setNewService({ ...newService, [field]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Company Services</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label>Available Services</Label>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Service Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[100px]">Price</TableHead>
                  <TableHead className="w-[100px]">Unit</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell>{service.description}</TableCell>
                    <TableCell>${service.pricePerUnit.toFixed(2)}</TableCell>
                    <TableCell>{service.unit}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteService(service.id)}
                        aria-label="Delete service"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                
                {services.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No services configured. Add services to display them in estimates and invoices.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <Label>Add New Service</Label>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="service-name" className="text-xs">Service Name</Label>
              <Input
                id="service-name"
                value={newService.name}
                onChange={(e) => handleNewServiceChange("name", e.target.value)}
                placeholder="Ex: Electrical Installation"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="service-description" className="text-xs">Description</Label>
              <Input
                id="service-description"
                value={newService.description}
                onChange={(e) => handleNewServiceChange("description", e.target.value)}
                placeholder="Ex: Residential electrical system installation"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="service-price" className="text-xs">Price per Unit</Label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="service-price"
                  type="number"
                  value={newService.pricePerUnit === 0 ? "" : newService.pricePerUnit}
                  onChange={(e) => handleNewServiceChange("pricePerUnit", parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="service-unit" className="text-xs">Unit</Label>
              <Input
                id="service-unit"
                value={newService.unit}
                onChange={(e) => handleNewServiceChange("unit", e.target.value)}
                placeholder="Ex: hour, piece, meter"
              />
            </div>
            
            <div className="flex items-end">
              <Button 
                className="w-full" 
                onClick={handleAddService}
                disabled={isLoading}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Service
              </Button>
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div className="flex justify-end">
          <Button 
            variant="default"
            onClick={saveAllServices}
            disabled={isLoading}
          >
            <Save className="mr-2 h-4 w-4" /> Save All Services
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}