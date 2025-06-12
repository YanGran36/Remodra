import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useEstimates } from "@/hooks/use-estimates";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save, 
  Calculator,
  User,
  Building2,
  DollarSign,
  Ruler
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Sidebar from "@/components/layout/sidebar";
import MobileSidebar from "@/components/layout/mobile-sidebar";
import FenceMeasurementTool from "@/components/measurement/fence-measurement-tool";

interface ServiceItem {
  id: string;
  serviceType: string;
  serviceName: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

interface EstimateData {
  clientId: number | null;
  projectId: number | null;
  services: ServiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  notes: string;
  terms: string;
}

export default function ProfessionalEstimatePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { createEstimateMutation } = useEstimates();

  // Get clientId from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const clientIdFromUrl = urlParams.get('clientId');

  // Form state
  const [estimateData, setEstimateData] = useState<EstimateData>({
    clientId: clientIdFromUrl ? parseInt(clientIdFromUrl) : null,
    projectId: null,
    services: [],
    subtotal: 0,
    tax: 0,
    discount: 0,
    total: 0,
    notes: "",
    terms: "Payment due within 30 days. Work to begin upon acceptance of estimate."
  });

  const [currentService, setCurrentService] = useState({
    serviceType: "",
    serviceName: "",
    description: "",
    quantity: 1,
    unit: "each",
    unitPrice: 0,
    measurements: {
      length: 0,
      width: 0,
      height: 0,
      pitch: 0,
      count: 1
    }
  });

  const [activeTab, setActiveTab] = useState("client");
  const [showFenceTool, setShowFenceTool] = useState(false);

  // Fetch data
  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ["/api/protected/clients"],
  });

  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ["/api/protected/projects"],
  });

  const { data: availableServices = [] } = useQuery<any[]>({
    queryKey: ["/api/direct/services"],
  });

  // Professional service types with industry standards
  const serviceTypes = [
    { value: "fence", label: "Fence", unit: "linear ft", type: "linear" },
    { value: "roof", label: "Roofing", unit: "squares", type: "roofing" },
    { value: "siding", label: "Siding", unit: "sq ft", type: "area" },
    { value: "deck", label: "Deck", unit: "sq ft", type: "area" },
    { value: "gutters", label: "Gutters & Downspouts", unit: "linear ft", type: "linear" },
    { value: "windows", label: "Windows", unit: "each", type: "count" },
    { value: "flooring", label: "Flooring", unit: "sq ft", type: "area" },
    { value: "painting", label: "Painting", unit: "sq ft", type: "area" },
    { value: "electrical", label: "Electrical", unit: "each", type: "count" },
    { value: "plumbing", label: "Plumbing", unit: "each", type: "count" },
    { value: "concrete", label: "Concrete", unit: "sq ft", type: "area" },
    { value: "landscaping", label: "Landscaping", unit: "sq ft", type: "area" },
    { value: "hvac", label: "HVAC", unit: "each", type: "count" },
    { value: "other", label: "Other Services", unit: "each", type: "count" }
  ];

  // Calculate totals
  useEffect(() => {
    const subtotal = estimateData.services.reduce((sum, service) => sum + service.total, 0);
    const taxAmount = subtotal * (estimateData.tax / 100);
    const discountAmount = subtotal * (estimateData.discount / 100);
    const total = subtotal + taxAmount - discountAmount;

    setEstimateData(prev => ({
      ...prev,
      subtotal,
      total
    }));
  }, [estimateData.services, estimateData.tax, estimateData.discount]);

  // Show toast when client is pre-selected from URL
  useEffect(() => {
    if (clientIdFromUrl && clients.length > 0) {
      const selectedClient = clients.find((client: any) => client.id.toString() === clientIdFromUrl);
      if (selectedClient) {
        toast({
          title: "Client Selected",
          description: `Creating estimate for ${selectedClient.firstName} ${selectedClient.lastName}`,
        });
      }
    }
  }, [clientIdFromUrl, clients, toast]);

  const handleServiceTypeChange = (serviceType: string) => {
    const selectedType = serviceTypes.find(type => type.value === serviceType);
    const matchingService = (availableServices as any[]).find((s: any) => s.serviceType === serviceType);

    setCurrentService(prev => ({
      ...prev,
      serviceType,
      serviceName: selectedType?.label || "",
      unit: selectedType?.unit || "each",
      unitPrice: matchingService ? parseFloat(matchingService.laborRate) : 0,
      measurements: {
        length: 0,
        width: 0,
        height: 0,
        pitch: 0,
        count: 1
      }
    }));

    setShowFenceTool(serviceType === "fence");
    calculateQuantity(serviceType, currentService.measurements);
  };

  const calculateQuantity = (serviceType: string, measurements: any) => {
    const serviceConfig = serviceTypes.find(s => s.value === serviceType);
    let quantity = 1;

    switch (serviceConfig?.type) {
      case "linear":
        quantity = measurements.length || 0;
        break;
      case "area":
        quantity = (measurements.length || 0) * (measurements.width || measurements.height || 0);
        break;
      case "roofing":
        // Roofing: Calculate squares (100 sq ft units)
        const sqft = (measurements.length || 0) * (measurements.width || 0);
        quantity = Math.ceil(sqft / 100);
        break;
      case "count":
        quantity = measurements.count || 1;
        break;
    }

    setCurrentService(prev => ({ ...prev, quantity: Math.max(quantity, 0.1) }));
  };

  const handleMeasurementChange = (field: string, value: number) => {
    const newMeasurements = { ...currentService.measurements, [field]: value };
    setCurrentService(prev => ({ ...prev, measurements: newMeasurements }));
    calculateQuantity(currentService.serviceType, newMeasurements);
  };

  const handleFenceMeasurements = (measurements: any[]) => {
    if (measurements.length > 0) {
      const totalLinearFeet = measurements.reduce((sum, m) => sum + m.totalLength, 0);
      setCurrentService(prev => ({ ...prev, quantity: totalLinearFeet }));
    }
  };

  const addService = () => {
    if (!currentService.serviceType || !currentService.serviceName) {
      toast({
        title: "Missing Information",
        description: "Please select a service type and provide a name.",
        variant: "destructive",
      });
      return;
    }

    const total = currentService.quantity * currentService.unitPrice;
    
    const newService: ServiceItem = {
      id: Date.now().toString(),
      serviceType: currentService.serviceType,
      serviceName: currentService.serviceName,
      description: currentService.description,
      quantity: currentService.quantity,
      unit: currentService.unit,
      unitPrice: currentService.unitPrice,
      total
    };

    setEstimateData(prev => ({
      ...prev,
      services: [...prev.services, newService]
    }));

    // Reset form
    setCurrentService({
      serviceType: "",
      serviceName: "",
      description: "",
      quantity: 1,
      unit: "each",
      unitPrice: 0,
      measurements: {
        length: 0,
        width: 0,
        height: 0,
        pitch: 0,
        count: 1
      }
    });
    setShowFenceTool(false);
  };

  const removeService = (serviceId: string) => {
    setEstimateData(prev => ({
      ...prev,
      services: prev.services.filter(service => service.id !== serviceId)
    }));
  };

  const generateEstimateNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `EST-${year}${month}${day}-${random}`;
  };

  const saveEstimate = async () => {
    if (!estimateData.clientId) {
      toast({
        title: "Missing Client",
        description: "Please select a client for this estimate.",
        variant: "destructive",
      });
      return;
    }

    if (estimateData.services.length === 0) {
      toast({
        title: "No Services",
        description: "Please add at least one service to the estimate.",
        variant: "destructive",
      });
      return;
    }

    const estimatePayload = {
      clientId: estimateData.clientId,
      projectId: estimateData.projectId,
      estimateNumber: generateEstimateNumber(),
      subtotal: estimateData.subtotal,
      tax: estimateData.tax,
      discount: estimateData.discount,
      total: estimateData.total,
      notes: estimateData.notes,
      terms: estimateData.terms,
      items: estimateData.services.map(service => ({
        description: service.description || service.serviceName,
        quantity: service.quantity.toString(),
        unitPrice: service.unitPrice.toString(),
        amount: service.total.toString(),
        notes: null
      }))
    };

    try {
      await createEstimateMutation.mutateAsync(estimatePayload);
      toast({
        title: "Estimate Created",
        description: "Your professional estimate has been created successfully.",
      });
      setLocation("/estimates");
    } catch (error) {
      console.error("Error creating estimate:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
      .format(amount);
  };

  const renderMeasurementInputs = () => {
    const serviceConfig = serviceTypes.find(s => s.value === currentService.serviceType);
    
    if (!serviceConfig || showFenceTool) return null;

    switch (serviceConfig.type) {
      case "linear":
        return (
          <div>
            <Label>Length (ft)</Label>
            <Input
              type="number"
              step="0.1"
              value={currentService.measurements.length || ""}
              onChange={(e) => handleMeasurementChange("length", parseFloat(e.target.value) || 0)}
              placeholder="Enter length in feet"
            />
          </div>
        );

      case "area":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Length (ft)</Label>
              <Input
                type="number"
                step="0.1"
                value={currentService.measurements.length || ""}
                onChange={(e) => handleMeasurementChange("length", parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label>{serviceConfig.value === "painting" || serviceConfig.value === "siding" ? "Height (ft)" : "Width (ft)"}</Label>
              <Input
                type="number"
                step="0.1"
                value={serviceConfig.value === "painting" || serviceConfig.value === "siding" ? 
                  currentService.measurements.height || "" : currentService.measurements.width || ""}
                onChange={(e) => {
                  const field = serviceConfig.value === "painting" || serviceConfig.value === "siding" ? "height" : "width";
                  handleMeasurementChange(field, parseFloat(e.target.value) || 0);
                }}
              />
            </div>
          </div>
        );

      case "roofing":
        return (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Length (ft)</Label>
              <Input
                type="number"
                step="0.1"
                value={currentService.measurements.length || ""}
                onChange={(e) => handleMeasurementChange("length", parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label>Width (ft)</Label>
              <Input
                type="number"
                step="0.1"
                value={currentService.measurements.width || ""}
                onChange={(e) => handleMeasurementChange("width", parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label>Pitch (optional)</Label>
              <Input
                type="number"
                step="0.1"
                value={currentService.measurements.pitch || ""}
                onChange={(e) => handleMeasurementChange("pitch", parseFloat(e.target.value) || 0)}
                placeholder="e.g., 6/12"
              />
            </div>
          </div>
        );

      case "count":
        return (
          <div>
            <Label>Quantity</Label>
            <Input
              type="number"
              value={currentService.measurements.count || 1}
              onChange={(e) => handleMeasurementChange("count", parseInt(e.target.value) || 1)}
              min="1"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <MobileSidebar />
      
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="page-layout">
          {/* Header */}
          <div className="mobile-header mb-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation("/estimates")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Estimates
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Office Estimate</h1>
                <p className="text-gray-600">For phone or in-office consultations with complete measurements</p>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="client" className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                Client
              </TabsTrigger>
              <TabsTrigger value="services" className="flex items-center">
                <Building2 className="h-4 w-4 mr-2" />
                Services & Measurements
              </TabsTrigger>
              <TabsTrigger value="summary" className="flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                Summary
              </TabsTrigger>
            </TabsList>

            {/* Client Selection */}
            <TabsContent value="client" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Select Client</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="client">Client *</Label>
                    <Select 
                      value={estimateData.clientId?.toString() || ""} 
                      onValueChange={(value) => setEstimateData(prev => ({ ...prev, clientId: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a client" />
                      </SelectTrigger>
                      <SelectContent>
                        {(clients as any[]).map((client: any) => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            {client.firstName} {client.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="project">Associated Project (Optional)</Label>
                    <Select 
                      value={estimateData.projectId?.toString() || "no_project"} 
                      onValueChange={(value) => setEstimateData(prev => ({ 
                        ...prev, 
                        projectId: value && value !== "no_project" ? parseInt(value) : null 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a project" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no_project">No Project</SelectItem>
                        {(projects as any[]).map((project: any) => (
                          <SelectItem key={project.id} value={project.id.toString()}>
                            {project.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {estimateData.clientId && (
                    <div className="mt-4">
                      <Button onClick={() => setActiveTab("services")}>
                        Continue to Services
                        <Building2 className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Services & Measurements */}
            <TabsContent value="services" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Add Services</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="form-grid">
                    <div>
                      <Label>Service Type *</Label>
                      <Select value={currentService.serviceType} onValueChange={handleServiceTypeChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select service type" />
                        </SelectTrigger>
                        <SelectContent>
                          {serviceTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Service Name *</Label>
                      <Input
                        value={currentService.serviceName}
                        onChange={(e) => setCurrentService(prev => ({ ...prev, serviceName: e.target.value }))}
                        placeholder="e.g., Wood Fence Installation"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label>Description</Label>
                      <Textarea
                        value={currentService.description}
                        onChange={(e) => setCurrentService(prev => ({ ...prev, description: e.target.value }))}
                        rows={2}
                        placeholder="Detailed description of the service..."
                      />
                    </div>

                    {/* Measurement Inputs */}
                    {currentService.serviceType && !showFenceTool && (
                      <div className="md:col-span-2">
                        <Label>Measurements</Label>
                        <div className="mt-2 space-y-4">
                          {renderMeasurementInputs()}
                          {currentService.quantity > 0 && (
                            <div className="text-sm text-blue-600">
                              Calculated: {currentService.quantity.toFixed(2)} {currentService.unit}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Fence Measurement Tool */}
                    {showFenceTool && (
                      <div className="md:col-span-2">
                        <Label>Fence Measurements</Label>
                        <div className="mt-2 p-4 border rounded-lg">
                          <FenceMeasurementTool
                            onMeasurementsChange={handleFenceMeasurements}
                            serviceUnit="ft"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <Label>Unit Price ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={currentService.unitPrice}
                        onChange={(e) => setCurrentService(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>

                    <div>
                      <Label>Total: {formatCurrency(currentService.quantity * currentService.unitPrice)}</Label>
                    </div>
                  </div>

                  <Button onClick={addService} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Service
                  </Button>
                </CardContent>
              </Card>

              {/* Services List */}
              {estimateData.services.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Added Services ({estimateData.services.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {estimateData.services.map((service) => (
                        <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline">{service.serviceType}</Badge>
                              <h4 className="font-medium">{service.serviceName}</h4>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">{service.description}</p>
                            <div className="text-sm text-gray-500">
                              {service.quantity.toFixed(2)} {service.unit} × {formatCurrency(service.unitPrice)} = {formatCurrency(service.total)}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeService(service.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    
                    {estimateData.services.length > 0 && (
                      <div className="mt-4">
                        <Button onClick={() => setActiveTab("summary")}>
                          Continue to Summary
                          <DollarSign className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Summary */}
            <TabsContent value="summary" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Estimate Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {estimateData.services.map((service) => (
                          <div key={service.id} className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{service.serviceName}</h4>
                              <p className="text-sm text-gray-600">{service.description}</p>
                              <p className="text-sm text-gray-500">
                                {service.quantity.toFixed(2)} {service.unit} × {formatCurrency(service.unitPrice)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{formatCurrency(service.total)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Terms & Notes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Terms & Conditions</Label>
                        <Textarea
                          value={estimateData.terms}
                          onChange={(e) => setEstimateData(prev => ({ ...prev, terms: e.target.value }))}
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label>Additional Notes</Label>
                        <Textarea
                          value={estimateData.notes}
                          onChange={(e) => setEstimateData(prev => ({ ...prev, notes: e.target.value }))}
                          rows={3}
                          placeholder="Any additional information for the client..."
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Pricing</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(estimateData.subtotal)}</span>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Tax (%)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={estimateData.tax}
                          onChange={(e) => setEstimateData(prev => ({ ...prev, tax: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Discount (%)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={estimateData.discount}
                          onChange={(e) => setEstimateData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>

                      <Separator />
                      
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span>{formatCurrency(estimateData.total)}</span>
                      </div>

                      <Button onClick={saveEstimate} className="w-full" disabled={createEstimateMutation.isPending}>
                        <Save className="h-4 w-4 mr-2" />
                        {createEstimateMutation.isPending ? "Creating..." : "Create Estimate"}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}