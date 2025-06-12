import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, PencilIcon, SaveIcon, PlusIcon, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { usePricing, type ServicePrice, type MaterialPrice } from "@/hooks/use-pricing";

// Extendemos la interfaz ServicePrice para añadir campos adicionales que necesitamos en la UI
interface Service extends ServicePrice {
  originalServiceType?: string; // Para mantener referencia al tipo original durante la edición
}

// Extendemos la interfaz MaterialPrice para añadir campos adicionales que necesitamos
interface Material extends MaterialPrice {
  // Campos adicionales si los necesitáramos
}



const PricingConfigPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Usar nuestro hook de precios para obtener datos del servidor
  const { 
    services: configuredServices, 
    materials: configuredMaterials, 
    isLoading: isLoadingPrices 
  } = usePricing();
  
  // Estados para edición y carga
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Convertimos directamente los datos de la API para mostrarlos
  const services: Service[] = Array.isArray(configuredServices) 
    ? configuredServices.map((service: any) => ({
        id: String(service.id || service.serviceType),
        name: service.name || 'Unnamed Service',
        serviceType: service.serviceType || '',
        unit: service.unit || 'ft',
        laborRate: typeof service.laborRate === 'string' ? parseFloat(service.laborRate) : (service.laborRate || 0),
        laborMethod: service.laborCalculationMethod || service.laborMethod || 'by_length'
      }))
    : [];

  const materials: Material[] = Array.isArray(configuredMaterials) 
    ? configuredMaterials.map((material: any) => ({
        id: String(material.id || material.material_id || material.code),
        name: material.name || 'Unnamed Material',
        category: material.category || 'General',
        unitPrice: typeof material.unitPrice === 'string' ? parseFloat(material.unitPrice) : (material.unitPrice || 0),
        unit: material.unit || 'ft',
        supplier: material.supplier || 'No especificado'
      }))
    : [];
  
  // Registramos datos recibidos para depuración - solo una vez
  useEffect(() => {
    if (configuredServices && Array.isArray(configuredServices) && configuredServices.length > 0) {
      console.log('Datos de servicios cargados:', configuredServices.length, 'servicios');
    }
  }, []);

  // Para editar un servicio
  const handleEditService = (service: Service) => {
    // Crear una copia del servicio y agregar el serviceType original
    const serviceToEdit = {
      ...service
    };
    // Almacenar el serviceType original como una propiedad normal
    (serviceToEdit as any).originalServiceType = service.serviceType;
    setEditingService(serviceToEdit);
  };

  // Add a new service
  const handleAddService = () => {
    const timestamp = Date.now();
    const serviceId = `service-${timestamp}`;
    const newService: Service = {
      id: serviceId,
      name: 'New Service',
      serviceType: '',
      unit: 'ft',
      laborRate: 0,
      laborMethod: 'by_length',
    };
    setEditingService(newService);
  };

  // Save service changes
  const handleSaveService = async () => {
    if (!editingService) return;

    setIsLoading(true);
    
    try {
      // Convert prices to numerical format
      const numericLaborRate = parseFloat(String(editingService.laborRate));
      
      // Prepare data with only the necessary fields
      const serviceData = {
        id: editingService.id,
        name: editingService.name,
        serviceType: editingService.serviceType || editingService.id,
        laborRate: numericLaborRate,
        unit: editingService.unit || 'ft',
        laborMethod: editingService.laborMethod || 'by_length',
        contractorId: 1,
        // Incluir el ID original para poder encontrar el servicio si se está cambiando el serviceType
        originalServiceType: editingService.originalServiceType || editingService.serviceType || editingService.id
      };
      
      console.log("Saving service:", serviceData);
      
      // Usar la nueva API directa para servicios
      const response = await fetch(`/api/pricing/direct-service`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData)
      });
      
      console.log("Server response status:", response.status);
      
      // Usamos directamente los datos que enviamos sin depender de la respuesta
      const updatedService = {
        id: serviceData.serviceType,
        name: serviceData.name,
        serviceType: serviceData.serviceType,
        unit: serviceData.unit,
        laborRate: serviceData.laborRate,
        laborMethod: serviceData.laborMethod
      };
      
      // Update the services array
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error al guardar servicio:", errorText);
        throw new Error("No se pudo guardar el servicio");
      }
      
      // Invalidate cache to refresh data
      await queryClient.invalidateQueries({ queryKey: ['/api/pricing/services'] });
      
      // Success message
      toast({
        title: "Service saved",
        description: "Labor rates have been updated successfully"
      });
      
      // Close form
      setEditingService(null);
    } catch (error) {
      console.error('Error saving service:', error);
      toast({
        title: "Error saving",
        description: "Changes could not be saved. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Delete a service
  const handleDeleteService = async (serviceId: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    
    setIsLoading(true);
    
    try {
      // Delete from database usando la nueva API directa para servicios
      const response = await fetch(`/api/pricing/direct-service/${serviceId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error deleting service:", errorText);
        throw new Error("Could not delete from database");
      }
      
      // Update local list - fix the undefined setServices error
      if (typeof setServices === 'function') {
        const updatedServices = services.filter(s => s.id !== serviceId);
        setServices(updatedServices);
      }
      
      // Invalidate cache to refresh data
      await queryClient.invalidateQueries({ queryKey: ['/api/pricing/services'] });
      
      // Success message
      toast({
        title: "Service deleted",
        description: "The service has been removed successfully"
      });
      
      // If we're editing this service, close the form
      if (editingService?.id === serviceId) {
        setEditingService(null);
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        title: "Error deleting",
        description: "Service could not be deleted. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Para editar un material
  const handleEditMaterial = (material: Material) => {
    setEditingMaterial({...material});
  };

  // Para añadir un nuevo material
  const handleAddMaterial = () => {
    const newMaterial: Material = {
      id: `material-${Date.now()}`,
      name: 'Nuevo Material',
      category: 'fence',
      unitPrice: 0,
      unit: 'ft',
      supplier: '',
    };
    setEditingMaterial(newMaterial);
  };

  // Para guardar cambios en un material
  const handleSaveMaterial = async () => {
    if (!editingMaterial) return;

    setIsLoading(true);
    
    try {
      // Convertir el precio a un número para asegurar formato correcto
      const numericPrice = parseFloat(String(editingMaterial.unitPrice));
      
      console.log(`Guardando material ${editingMaterial.id} con precio: ${numericPrice}`);
      
      // Simplificar los datos para evitar problemas de tipo
      const materialData = {
        name: editingMaterial.name,
        category: editingMaterial.category || 'fence',
        unitPrice: numericPrice,
        unit: editingMaterial.unit || 'ft',
        supplier: editingMaterial.supplier || '',
        code: editingMaterial.id,
        id_string: editingMaterial.id,
        material_id: editingMaterial.id,
        status: 'active',
        description: `${editingMaterial.name} para ${editingMaterial.category}`,
        contractorId: 1
      };
      
      // Llamada directa a la API
      const response = await fetch(`/api/pricing/materials/${editingMaterial.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(materialData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error guardando material:", errorText);
        throw new Error("No se pudo guardar en la base de datos");
      }
      
      const updatedMaterialData = await response.json();
      console.log("Respuesta del servidor:", updatedMaterialData);
      
      // Actualizar la lista local con el material actualizado
      const updatedMaterial = {
        ...editingMaterial,
        unitPrice: numericPrice
      };
      
      const existingIndex = materials.findIndex(m => m.id === editingMaterial.id);
      let updatedMaterialsList;
      
      if (existingIndex >= 0) {
        // Si el material ya existe, lo actualizamos en la lista
        updatedMaterialsList = [...materials];
        updatedMaterialsList[existingIndex] = updatedMaterial;
      } else {
        // Si es nuevo, lo añadimos a la lista
        updatedMaterialsList = [...materials, updatedMaterial];
      }
      
      // Actualizamos la lista de materiales en la UI
      setMaterials(updatedMaterialsList);
      
      // Mensaje de éxito
      toast({
        title: "Material guardado",
        description: "Los precios se han actualizado correctamente"
      });
      
      // Forzar actualización de datos en todas partes
      queryClient.invalidateQueries();
      
      // Recargar directamente los datos más recientes
      try {
        const freshResponse = await fetch('/api/pricing/materials');
        if (freshResponse.ok) {
          const freshData = await freshResponse.json();
          
          if (Array.isArray(freshData) && freshData.length > 0) {
            const processedMaterials = freshData.map((material: any) => ({
              ...material,
              id: material.id_string || material.code || material.material_id,
              unitPrice: typeof material.unitPrice === 'string' ? 
                parseFloat(material.unitPrice) : 
                (typeof material.unit_price === 'string' ? 
                  parseFloat(material.unit_price) : material.unit_price || 0)
            }));
            setMaterials(processedMaterials);
          }
        }
      } catch (refreshError) {
        console.warn("Error al recargar datos:", refreshError);
      }
    } catch (error) {
      console.error('Error al guardar material:', error);
      toast({
        title: "Error al guardar",
        description: "No se pudieron guardar los cambios. Intente nuevamente.",
        variant: "destructive"
      });
    } finally {
      setEditingMaterial(null);
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-8">
      <Helmet>
        <title>Price Configuration | ContractorHub</title>
        <meta name="description" content="Centralized price management" />
      </Helmet>

      {/* Top navigation bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Price Configuration</h1>
          <p className="text-muted-foreground">
            Manage service and material prices for your entire business
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="outline">
              <Home className="mr-2 h-4 w-4" /> Dashboard
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="services" className="space-y-6">
        <TabsList>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
        </TabsList>

        <TabsContent value="services">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Service Labor Rates</CardTitle>
                <CardDescription>
                  Configure labor rates for all your services
                </CardDescription>
              </div>
              <Button onClick={handleAddService}>
                <PlusIcon className="mr-2 h-4 w-4" /> Add Service
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Labor Rate</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">{service.name}</TableCell>
                      <TableCell>{service.serviceType}</TableCell>
                      <TableCell>${service.laborRate.toFixed(2)} / {service.unit}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEditService(service)}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteService(service.id)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-100"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18"></path>
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                              <line x1="10" y1="11" x2="10" y2="17"></line>
                              <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {editingService && (
                <div className="mt-6 border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4">
                    {editingService.id.startsWith('service-') ? 'New Service' : 'Edit Service'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="service-name">Service Name</Label>
                      <Input 
                        id="service-name"
                        value={editingService.name}
                        onChange={(e) => setEditingService({...editingService, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="service-type">Service Type</Label>
                      <Select 
                        value={editingService.serviceType}
                        onValueChange={(value) => setEditingService({...editingService, serviceType: value})}
                        disabled={!editingService.id.startsWith('service-')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose your service type" />
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
                    <div className="space-y-2">
                      <Label htmlFor="labor-rate">Labor Rate (per unit)</Label>
                      <Input 
                        id="labor-rate"
                        type="number"
                        value={editingService.laborRate}
                        onChange={(e) => setEditingService({
                          ...editingService, 
                          laborRate: parseFloat(e.target.value) || 0
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unit">Unit of Measure</Label>
                      <Select
                        value={editingService.unit}
                        onValueChange={(value) => setEditingService({...editingService, unit: value})}
                      >
                        <SelectTrigger id="unit">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ft">Linear Foot (ft)</SelectItem>
                          <SelectItem value="sqft">Square Foot (sqft)</SelectItem>
                          <SelectItem value="unit">Unit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="labor-method">Labor Calculation Method</Label>
                      <Select
                        value={editingService.laborMethod}
                        onValueChange={(value) => setEditingService({...editingService, laborMethod: value})}
                      >
                        <SelectTrigger id="labor-method">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="by_length">By Length</SelectItem>
                          <SelectItem value="by_area">By Area</SelectItem>
                          <SelectItem value="fixed">Fixed Amount</SelectItem>
                          <SelectItem value="hourly">Hourly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setEditingService(null)}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSaveService}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span>Saving...</span>
                      ) : (
                        <>
                          <SaveIcon className="mr-2 h-4 w-4" /> Save
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Precios de Materiales</CardTitle>
                <CardDescription>
                  Configura los precios para todos los materiales que utilizas
                </CardDescription>
              </div>
              <Button onClick={handleAddMaterial}>
                <PlusIcon className="mr-2 h-4 w-4" /> Añadir Material
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Precio por Unit</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell className="font-medium">{material.name}</TableCell>
                      <TableCell>{material.category}</TableCell>
                      <TableCell>${(typeof material.unitPrice === 'number' ? material.unitPrice.toFixed(2) : parseFloat(String(material.unitPrice)).toFixed(2))} / {material.unit}</TableCell>
                      <TableCell>{material.supplier}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditMaterial(material)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {editingMaterial && (
                <div className="mt-6 border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4">
                    {editingMaterial.id.startsWith('material-') ? 'Nuevo Material' : 'Editar Material'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="material-name">Nombre del Material</Label>
                      <Input 
                        id="material-name"
                        value={editingMaterial.name}
                        onChange={(e) => setEditingMaterial({...editingMaterial, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="material-category">Categoría</Label>
                      <Select
                        value={editingMaterial.category}
                        onValueChange={(value) => setEditingMaterial({...editingMaterial, category: value})}
                      >
                        <SelectTrigger id="material-category">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fence">Cerca</SelectItem>
                          <SelectItem value="roof">Techo</SelectItem>
                          <SelectItem value="gutters">Canaletas</SelectItem>
                          <SelectItem value="windows">Ventanas</SelectItem>
                          <SelectItem value="deck">Deck</SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="material-price">Precio por Unit</Label>
                      <Input 
                        id="material-price"
                        type="number" 
                        value={editingMaterial.unitPrice}
                        onChange={(e) => setEditingMaterial({
                          ...editingMaterial, 
                          unitPrice: parseFloat(e.target.value) || 0
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="material-unit">Unit</Label>
                      <Select
                        value={editingMaterial.unit}
                        onValueChange={(value) => setEditingMaterial({...editingMaterial, unit: value})}
                      >
                        <SelectTrigger id="material-unit">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ft">Pie Lineal (ft)</SelectItem>
                          <SelectItem value="sqft">Pie Cuadrado (sqft)</SelectItem>
                          <SelectItem value="unit">Unit</SelectItem>
                          <SelectItem value="box">Caja</SelectItem>
                          <SelectItem value="roll">Rollo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="material-supplier">Proveedor</Label>
                      <Input 
                        id="material-supplier"
                        value={editingMaterial.supplier || ''}
                        onChange={(e) => setEditingMaterial({...editingMaterial, supplier: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setEditingMaterial(null)}
                      disabled={isLoading}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleSaveMaterial}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span>Guardando...</span>
                      ) : (
                        <>
                          <SaveIcon className="mr-2 h-4 w-4" /> Guardar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PricingConfigPage;