import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Building2, Calculator, FileText, User, ArrowLeft, Plus, Trash2 } from "lucide-react";
import FenceMeasurementTool from "@/components/measurement/fence-measurement-tool";

interface SelectedService {
  serviceType: string;
  serviceName: string;
  laborRate: string;
  unit: string;
  measurements: {
    quantity: number;
    squareFeet: number;
    linearFeet: number;
    units: number;
  };
  laborCost: number;
  materialsCost: number;
  notes: string;
}

const formSchema = z.object({
  clientId: z.number().min(1, "Please select a client"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function MultiServiceEstimatePage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("client");
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: 0,
      title: "",
      description: "",
      notes: "",
    },
  });

  // Fetch clients
  const { data: clients } = useQuery({
    queryKey: ["/api/protected/clients"],
  });

  // Fetch services
  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ["/api/direct/services"],
  });

  // Fetch materials
  const { data: materials } = useQuery({
    queryKey: ["/api/pricing/materials"],
  });

  const createEstimateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/protected/estimates", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Estimate created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/protected/estimates"] });
      setLocation("/estimates");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    // Calculate totals from all selected services
    const totalLaborCost = selectedServices.reduce((sum, service) => sum + service.laborCost, 0);
    const totalMaterialsCost = selectedServices.reduce((sum, service) => sum + service.materialsCost, 0);
    const subtotal = totalLaborCost + totalMaterialsCost;
    
    const estimateData = {
      ...values,
      estimateNumber: values.title || generateEstimateNumber(),
      subtotal: subtotal.toString(),
      total: subtotal.toString(),
      serviceType: selectedServices[0]?.serviceType || "",
      laborCost: totalLaborCost,
      materialsCost: totalMaterialsCost,
    };
    
    createEstimateMutation.mutate(estimateData);
  };

  function generateEstimateNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `EST-${year}${month}${day}-${random}`;
  }

  useEffect(() => {
    form.setValue("title", generateEstimateNumber());
  }, [form]);

  const addService = (service: any) => {
    // Check if service is already added
    const isAlreadyAdded = selectedServices.some(s => s.serviceType === service.serviceType);
    if (isAlreadyAdded) {
      toast({
        title: "Service already added",
        description: `${service.name} is already in your estimate`,
        variant: "destructive",
      });
      return;
    }

    const newService: SelectedService = {
      serviceType: service.serviceType,
      serviceName: service.name,
      laborRate: service.laborRate,
      unit: service.unit,
      measurements: {
        quantity: 0,
        squareFeet: 0,
        linearFeet: 0,
        units: 0,
      },
      laborCost: 0,
      materialsCost: 0,
      notes: "",
    };
    setSelectedServices([...selectedServices, newService]);
    
    toast({
      title: "Service added",
      description: `${service.name} has been added to your estimate`,
    });
  };

  const removeService = (index: number) => {
    setSelectedServices(selectedServices.filter((_, i) => i !== index));
  };

  const updateServiceMeasurements = (index: number, measurements: any) => {
    const updatedServices = [...selectedServices];
    updatedServices[index].measurements = measurements;
    
    // Calculate labor cost based on measurements
    const service = updatedServices[index];
    const laborRate = parseFloat(service.laborRate);
    let totalMeasurement = 0;
    
    switch (service.unit) {
      case 'sqft':
        totalMeasurement = measurements.squareFeet;
        break;
      case 'ft':
        totalMeasurement = measurements.linearFeet;
        break;
      case 'unit':
        totalMeasurement = measurements.units;
        break;
      default:
        totalMeasurement = measurements.quantity;
    }
    
    updatedServices[index].laborCost = totalMeasurement * laborRate;
    setSelectedServices(updatedServices);
  };

  const updateServiceMaterials = (index: number, materialsCost: number) => {
    const updatedServices = [...selectedServices];
    updatedServices[index].materialsCost = materialsCost;
    setSelectedServices(updatedServices);
  };

  const updateServiceNotes = (index: number, notes: string) => {
    const updatedServices = [...selectedServices];
    updatedServices[index].notes = notes;
    setSelectedServices(updatedServices);
  };

  const getServiceIcon = (serviceType: string) => {
    switch(serviceType) {
      case 'deck': return '🪵';
      case 'fence': return '🔧';
      case 'roof': return '🏠';
      case 'windows': return '🪟';
      case 'gutters': return '🏘️';
      default: return '🔨';
    }
  };

  const totalEstimateValue = selectedServices.reduce((sum, service) => sum + service.laborCost + service.materialsCost, 0);

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex items-center gap-4 mb-8">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setLocation("/estimates")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Estimates
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Multi-Service Estimate</h1>
          <p className="text-muted-foreground">Office estimate with multiple services</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="client" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Client
              </TabsTrigger>
              <TabsTrigger value="services" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Services
              </TabsTrigger>
              <TabsTrigger value="measurements" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Measurements
              </TabsTrigger>
              <TabsTrigger value="materials" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Materials
              </TabsTrigger>
              <TabsTrigger value="review" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Review
              </TabsTrigger>
            </TabsList>

            {/* Client Tab */}
            <TabsContent value="client" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Client Information</CardTitle>
                  <CardDescription>Select the client for this estimate</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client</FormLabel>
                        <Select onValueChange={(value) => field.onChange(Number(value))}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a client" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clients?.map((client: any) => (
                              <SelectItem key={client.id} value={client.id.toString()}>
                                {client.firstName} {client.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimate Number</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Brief description of the project..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter>
                  <Button 
                    type="button" 
                    onClick={() => setActiveTab("services")}
                    disabled={form.getValues("clientId") === 0 || !form.getValues("clientId")}
                  >
                    Next: Select Services →
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Services Tab */}
            <TabsContent value="services" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Select Services</CardTitle>
                  <CardDescription>
                    Choose multiple services to include in this estimate
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {servicesLoading ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Loading services...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid gap-4">
                        {services?.map((service: any) => (
                          <div 
                            key={service.id}
                            className="p-4 border rounded-lg hover:border-blue-300 transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="text-3xl">{getServiceIcon(service.serviceType)}</div>
                                <div>
                                  <h3 className="text-lg font-bold">{service.name}</h3>
                                  <p className="text-sm text-gray-600">${service.laborRate}/{service.unit}</p>
                                  <p className="text-xs text-gray-500">Professional {service.serviceType} service</p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => addService(service)}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {selectedServices.length > 0 && (
                        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                          <h4 className="font-medium text-green-800 mb-2">Selected Services ({selectedServices.length}):</h4>
                          <div className="space-y-1">
                            {selectedServices.map((service, index) => (
                              <div key={index} className="text-sm text-green-700 flex items-center justify-between">
                                <span>• {service.serviceName} (${service.laborRate}/{service.unit})</span>
                                <Badge variant="secondary">${(service.laborCost + service.materialsCost).toFixed(2)}</Badge>
                              </div>
                            ))}
                          </div>
                          <div className="mt-2 pt-2 border-t border-green-200">
                            <div className="flex justify-between font-medium text-green-800">
                              <span>Total Estimate Value:</span>
                              <span>${totalEstimateValue.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setActiveTab("client")}
                  >
                    ← Previous
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setActiveTab("measurements")}
                    disabled={selectedServices.length === 0}
                  >
                    Next: Measurements →
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Measurements Tab */}
            <TabsContent value="measurements" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Service Measurements</CardTitle>
                  <CardDescription>
                    Add measurements for each selected service
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {selectedServices.map((service, index) => (
                    <div key={index} className="p-6 border rounded-lg space-y-6 bg-gradient-to-r from-slate-50 to-blue-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-3xl">{getServiceIcon(service.serviceType)}</span>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{service.serviceName}</h3>
                            <p className="text-sm text-gray-600">Rate: ${service.laborRate}/{service.unit}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-lg px-3 py-1">
                          Service #{index + 1}
                        </Badge>
                      </div>

                      {/* Visual Measurement Tool for Each Service */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">
                          📐 Visual Measurements & Drawings
                        </h4>
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                          <FenceMeasurementTool
                            serviceType={service.serviceType}
                            onMeasurementsChange={(measurements) => {
                              const updatedServices = [...selectedServices];
                              updatedServices[index] = {
                                ...updatedServices[index],
                                measurements: {
                                  quantity: measurements.quantity || 0,
                                  squareFeet: measurements.squareFeet || 0,
                                  linearFeet: measurements.linearFeet || 0,
                                  units: measurements.units || 0,
                                }
                              };
                              setSelectedServices(updatedServices);
                              
                              // Calculate labor cost based on measurements and labor rate
                              const laborRate = parseFloat(service.laborRate);
                              let laborCost = 0;
                              
                              if (service.unit === "sqft" && measurements.squareFeet) {
                                laborCost = measurements.squareFeet * laborRate;
                              } else if (service.unit === "ft" && measurements.linearFeet) {
                                laborCost = measurements.linearFeet * laborRate;
                              } else if (service.unit === "unit" && measurements.units) {
                                laborCost = measurements.units * laborRate;
                              }
                              
                              updatedServices[index].laborCost = laborCost;
                              setSelectedServices(updatedServices);
                            }}
                          />
                        </div>
                      </div>

                      {/* Display Current Measurements */}
                      {service.measurements && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {service.measurements.squareFeet > 0 && (
                            <div className="text-center p-3 bg-blue-50 rounded-lg border">
                              <div className="text-2xl font-bold text-blue-600">
                                {service.measurements.squareFeet.toFixed(1)}
                              </div>
                              <div className="text-sm text-blue-700">Square Feet</div>
                            </div>
                          )}
                          {service.measurements.linearFeet > 0 && (
                            <div className="text-center p-3 bg-green-50 rounded-lg border">
                              <div className="text-2xl font-bold text-green-600">
                                {service.measurements.linearFeet.toFixed(1)}
                              </div>
                              <div className="text-sm text-green-700">Linear Feet</div>
                            </div>
                          )}
                          {service.measurements.units > 0 && (
                            <div className="text-center p-3 bg-purple-50 rounded-lg border">
                              <div className="text-2xl font-bold text-purple-600">
                                {service.measurements.units}
                              </div>
                              <div className="text-sm text-purple-700">Units</div>
                            </div>
                          )}
                          {service.laborCost > 0 && (
                            <div className="text-center p-3 bg-orange-50 rounded-lg border">
                              <div className="text-2xl font-bold text-orange-600">
                                ${service.laborCost.toFixed(2)}
                              </div>
                              <div className="text-sm text-orange-700">Labor Cost</div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Quantity</label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={service.measurements.quantity}
                            onChange={(e) => updateServiceMeasurements(index, {
                              ...service.measurements,
                              quantity: parseFloat(e.target.value) || 0
                            })}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Square Feet</label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={service.measurements.squareFeet}
                            onChange={(e) => updateServiceMeasurements(index, {
                              ...service.measurements,
                              squareFeet: parseFloat(e.target.value) || 0
                            })}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Linear Feet</label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={service.measurements.linearFeet}
                            onChange={(e) => updateServiceMeasurements(index, {
                              ...service.measurements,
                              linearFeet: parseFloat(e.target.value) || 0
                            })}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Units</label>
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={service.measurements.units}
                            onChange={(e) => updateServiceMeasurements(index, {
                              ...service.measurements,
                              units: parseInt(e.target.value) || 0
                            })}
                            placeholder="0"
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-sm text-muted-foreground">Calculated Labor Cost:</span>
                        <span className="text-lg font-semibold text-blue-600">
                          ${service.laborCost.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setActiveTab("services")}
                  >
                    ← Previous
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setActiveTab("materials")}
                  >
                    Next: Materials →
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Materials Tab */}
            <TabsContent value="materials" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Materials & Labor Costs</CardTitle>
                  <CardDescription>
                    Add material costs and notes for each service
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {selectedServices.map((service, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{getServiceIcon(service.serviceType)}</span>
                        <h3 className="text-lg font-semibold">{service.serviceName}</h3>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Labor Cost</label>
                          <Input
                            type="number"
                            value={service.laborCost.toFixed(2)}
                            readOnly
                            className="bg-gray-50"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Materials Cost</label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={service.materialsCost}
                            onChange={(e) => updateServiceMaterials(index, parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Service Notes</label>
                        <Textarea
                          value={service.notes}
                          onChange={(e) => updateServiceNotes(index, e.target.value)}
                          placeholder="Notes specific to this service..."
                          rows={3}
                        />
                      </div>
                      
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-sm text-muted-foreground">Service Total:</span>
                        <span className="text-lg font-semibold text-green-600">
                          ${(service.laborCost + service.materialsCost).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setActiveTab("measurements")}
                  >
                    ← Previous
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setActiveTab("review")}
                  >
                    Next: Review →
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Review Tab */}
            <TabsContent value="review" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Review & Create Estimate</CardTitle>
                  <CardDescription>
                    Review all details before creating the estimate
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-2">Client Information</h3>
                      <div className="text-sm space-y-1">
                        <p><strong>Estimate #:</strong> {form.getValues("title")}</p>
                        <p><strong>Client:</strong> {clients?.find((c: any) => c.id === form.getValues("clientId"))?.firstName} {clients?.find((c: any) => c.id === form.getValues("clientId"))?.lastName}</p>
                        {form.getValues("description") && (
                          <p><strong>Description:</strong> {form.getValues("description")}</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">Estimate Summary</h3>
                      <div className="text-sm space-y-1">
                        <p><strong>Services:</strong> {selectedServices.length}</p>
                        <p><strong>Total Labor:</strong> ${selectedServices.reduce((sum, s) => sum + s.laborCost, 0).toFixed(2)}</p>
                        <p><strong>Total Materials:</strong> ${selectedServices.reduce((sum, s) => sum + s.materialsCost, 0).toFixed(2)}</p>
                        <p className="text-lg font-bold text-green-600">
                          <strong>Grand Total: ${totalEstimateValue.toFixed(2)}</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-semibold mb-4">Selected Services</h3>
                    <div className="space-y-4">
                      {selectedServices.map((service, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-xl">{getServiceIcon(service.serviceType)}</span>
                              <h4 className="font-medium">{service.serviceName}</h4>
                            </div>
                            <Badge variant="outline">${service.laborRate}/{service.unit}</Badge>
                          </div>
                          
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Measurements:</span>
                              <div>
                                {service.measurements.quantity > 0 && <div>Qty: {service.measurements.quantity}</div>}
                                {service.measurements.squareFeet > 0 && <div>Sq Ft: {service.measurements.squareFeet}</div>}
                                {service.measurements.linearFeet > 0 && <div>Linear Ft: {service.measurements.linearFeet}</div>}
                                {service.measurements.units > 0 && <div>Units: {service.measurements.units}</div>}
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Labor:</span>
                              <div>${service.laborCost.toFixed(2)}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Materials:</span>
                              <div>${service.materialsCost.toFixed(2)}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Service Total:</span>
                              <div className="font-medium">${(service.laborCost + service.materialsCost).toFixed(2)}</div>
                            </div>
                          </div>
                          
                          {service.notes && (
                            <div className="mt-2 pt-2 border-t">
                              <span className="text-muted-foreground text-sm">Notes:</span>
                              <p className="text-sm">{service.notes}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>General Estimate Notes</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Additional notes for this estimate..." rows={4} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setActiveTab("materials")}
                  >
                    ← Previous
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createEstimateMutation.isPending || selectedServices.length === 0}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {createEstimateMutation.isPending ? "Creating..." : "Create Estimate"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </Form>
    </div>
  );
}