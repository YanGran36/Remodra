import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, ArrowLeft, Calendar } from "lucide-react";
import FenceMeasurementTool from "@/components/measurement/fence-measurement-tool";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";

const formSchema = z.object({
  clientId: z.number(),
  estimateNumber: z.string().min(1, "Estimate number is required"),
  issueDate: z.date().optional(),
  expiryDate: z.date().optional(),
  status: z.string().default("draft"),
  subtotal: z.number().default(0),
  tax: z.number().default(0),
  discount: z.number().default(0),
  total: z.number().default(0),
  terms: z.string().optional(),
  notes: z.string().optional(),
  selectedServices: z.array(z.object({
    serviceType: z.string(),
    name: z.string(),
    laborRate: z.string(),
    unit: z.string(),
    measurements: z.object({
      quantity: z.number().optional(),
      squareFeet: z.number().optional(),
      linearFeet: z.number().optional(),
      units: z.number().optional(),
    }).optional(),
    laborCost: z.number().optional(),
    materialsCost: z.number().optional(),
    notes: z.string().optional(),
  })).optional().default([]),
});

type FormValues = z.infer<typeof formSchema>;

export default function AgentEstimateFormPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("client");
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [selectedServices, setSelectedServices] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [clientsWithAppointments, setClientsWithAppointments] = useState<any[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      estimateNumber: generateEstimateNumber(),
      issueDate: new Date(),
      status: "draft",
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0,
      selectedServices: [],
    },
  });

  function generateEstimateNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `EST-${year}${month}${day}-${random}`;
  }

  // Fetch clients
  const { data: clients } = useQuery({
    queryKey: ["/api/protected/clients"],
  });

  // Fetch available services
  const { data: services } = useQuery({
    queryKey: ["/api/direct/services"],
  });

  // Fetch events for appointments
  const { data: events = [] } = useQuery({
    queryKey: ["/api/protected/events"],
  });

  useEffect(() => {
    if (services) {
      setAvailableServices(services);
    }
  }, [services]);

  // Initialize appointments for today when page loads
  useEffect(() => {
    if (events && clients) {
      const today = new Date();
      updateSelectedDateAndClients(today);
    }
  }, [events, clients]);

  // Function to filter clients with appointments on a specific date
  const getClientsWithAppointmentsForDate = (date: Date) => {
    if (!events.length || !clients.length) return [];
    
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
    
    const eventsForSelectedDate = events.filter((event: any) => {
      const eventDate = new Date(event.startTime);
      return eventDate >= dayStart && eventDate <= dayEnd;
    });
    
    const clientIds = eventsForSelectedDate
      .filter((event: any) => event.clientId)
      .map((event: any) => event.clientId.toString());
      
    const uniqueClientIds = Array.from(new Set(clientIds));
    
    const clientsWithAppointments = clients.filter((client: any) => 
      uniqueClientIds.includes(client.id.toString())
    ).map((client: any) => {
      const clientAppointments = eventsForSelectedDate.filter((event: any) => 
        event.clientId && event.clientId.toString() === client.id.toString()
      );
      
      return {
        ...client,
        appointments: clientAppointments
      };
    });
    
    return clientsWithAppointments;
  };
  
  // Function to update the selected date and clients with appointments
  const updateSelectedDateAndClients = (date: Date) => {
    setSelectedDate(date);
    const clientsForDate = getClientsWithAppointmentsForDate(date);
    setClientsWithAppointments(clientsForDate);
  };

  // Function to handle client selection from appointment card
  const handleSelectClientWithAppointment = (client: any) => {
    form.setValue("clientId", client.id);
    
    toast({
      title: "Client Selected",
      description: `${client.firstName} ${client.lastName} has been selected for this estimate`,
    });
  };

  // Get selected client details
  const selectedClientId = form.watch("clientId");
  const selectedClient = clients?.find((client: any) => client.id === selectedClientId);

  const createEstimateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await fetch("/api/protected/estimates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create estimate");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Estimate created successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/protected/estimates"] });
      window.location.href = "/estimates";
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (values: FormValues) => {
    // Calculate totals from selected services with measurements
    let calculatedSubtotal = 0;
    
    const enhancedServices = selectedServices.map((service: any) => {
      let professionalDescription: string = "";
      let detailedScope: string[] = [];
      let calculatedLaborCost = 0;
      
      const laborRate = parseFloat(service.laborRate) || 0;
      
      if (service.serviceType === "fence") {
        const totalLength = service.measurements?.linearFeet || service.measurements?.quantity || 0;
        const totalGates = service.measurements?.units || 0;
        
        calculatedLaborCost = totalLength * laborRate;
        
        professionalDescription = `FENCE INSTALLATION PROJECT - ${totalLength} Linear Feet

SERVICE OVERVIEW:
Premium fence installation with professional-grade materials and expert craftsmanship.

DETAILED WORK SCOPE:
1. Site Assessment and Planning
   - Property boundary survey and marking
   - Underground utility location and marking
   - Soil condition evaluation for proper post depth

2. Site Preparation
   - Vegetation clearing along fence line
   - Ground leveling and debris removal
   - Access route preparation for materials and equipment

3. Post Installation
   - Hand-digging or machine-drilling post holes (2-3 feet deep)
   - Installation of ${Math.ceil(totalLength / 8)} pressure-treated posts with concrete footings
   - 24-48 hour curing time for concrete before panel installation

4. Fence Panel Installation
   - Installation of ${totalLength} linear feet of premium fence panels
   - Precise alignment and leveling of all panels
   - Secure attachment with galvanized hardware

5. Gate Installation (${totalGates} gates)
   - Professional gate frame construction and installation
   - Heavy-duty hinges and premium latch hardware
   - Gate alignment and swing testing

6. Finishing Work
   - Installation of decorative post caps
   - Final hardware adjustments and tightening
   - Touch-up staining/painting as needed

7. Site Cleanup and Final Inspection
   - Complete debris removal and site restoration
   - Final quality inspection and customer walkthrough
   - Warranty information and maintenance guidelines provided`;
        
        detailedScope = [
          `${totalLength} linear feet of premium fence materials`,
          `${Math.ceil(totalLength / 8)} pressure-treated posts with concrete footings`,
          `${totalGates} complete gate sets with professional hardware`,
          "Post caps and finishing materials",
          "Galvanized fasteners and hardware throughout",
          "Complete site cleanup and restoration"
        ];
      }
      
      if (service.serviceType === "roof") {
        const area = service.measurements?.squareFeet || 0;
        
        calculatedLaborCost = area * laborRate;
        
        professionalDescription = `ROOF RENOVATION PROJECT - ${area} Square Feet

SERVICE OVERVIEW:
Complete roof replacement with premium materials and professional installation techniques.

DETAILED WORK SCOPE:
1. Initial Assessment and Preparation
   - Comprehensive roof inspection and damage assessment
   - Weather protection setup and safety equipment installation
   - Material delivery and staging on property

2. Existing Roof Removal
   - Complete tear-off of ${area} square feet of existing roofing materials
   - Removal of old underlayment and damaged decking
   - Inspection of roof deck and structural components

3. Deck Preparation and Repair
   - Replacement of damaged or rotten decking boards
   - Reinforcement of weak areas and structural repairs
   - Installation of new drip edge around entire perimeter

4. Underlayment Installation
   - Installation of premium synthetic underlayment across entire roof
   - Ice and water shield installation in critical areas
   - Proper overlap and sealing of all seams

5. Roofing Material Installation
   - Installation of ${area} square feet of premium roofing materials
   - Proper alignment, spacing, and pattern consistency
   - Installation of ridge vents and exhaust ventilation

6. Flashing and Detail Work
   - Custom flashing fabrication and installation around chimneys
   - Valley flashing and step flashing installation
   - Pipe boot and vent flashing replacement

7. Final Inspection and Cleanup
   - Complete debris removal and magnetic sweep for nails
   - Final quality inspection and weatherproofing verification
   - Warranty documentation and maintenance guidelines provided`;
        
        detailedScope = [
          `${area} square feet of premium roofing materials`,
          "Complete tear-off and disposal of existing materials",
          "Synthetic underlayment and ice shield installation",
          "Custom flashing fabrication and installation",
          "Ridge vents and ventilation system",
          "Complete debris cleanup and site restoration"
        ];
      }

      if (service.serviceType === "siding") {
        const area = service.measurements?.squareFeet || 0;
        
        calculatedLaborCost = area * laborRate;
        
        professionalDescription = `SIDING RENOVATION PROJECT - ${area} Square Feet

SERVICE OVERVIEW:
Complete exterior siding replacement with premium materials and professional installation techniques.

DETAILED WORK SCOPE:
1. Project Assessment and Preparation
   - Comprehensive exterior evaluation and measurement verification
   - Material selection consultation and color coordination
   - Permit acquisition and inspection scheduling

2. Existing Siding Removal
   - Careful removal of ${area} square feet of existing siding materials
   - Inspection of underlying structure and insulation
   - Removal and disposal of old trim and accessories

3. Structural Preparation
   - Installation of house wrap and moisture barrier system
   - Repair of any damaged sheathing or structural components
   - Installation of new window and door flashing

4. Siding Installation
   - Installation of ${area} square feet of premium siding materials
   - Proper spacing, alignment, and expansion joint placement
   - Installation of corner trim and decorative elements

5. Trim and Detail Work
   - Installation of window and door trim packages
   - Soffit and fascia board installation or replacement
   - Installation of decorative shutters and architectural elements

6. Finishing and Weatherproofing
   - Complete caulking of all joints and penetrations
   - Installation of ventilation accessories and electrical boxes
   - Final paint touch-ups and stain application as needed

7. Final Inspection and Cleanup
   - Complete debris removal and site restoration
   - Final quality inspection and warranty documentation
   - Customer walkthrough and maintenance guidelines provided`;
        
        detailedScope = [
          `${area} square feet of premium siding materials`,
          "House wrap and moisture barrier installation",
          "Window and door trim packages",
          "Soffit and fascia components",
          "Complete weatherproofing and caulking",
          "Site cleanup and debris removal"
        ];
      }
      
      calculatedSubtotal += calculatedLaborCost;
      
      return {
        ...service,
        professionalDescription,
        detailedScope,
        laborCost: calculatedLaborCost,
        notes: service.notes || professionalDescription
      };
    });
    
    const calculatedTotal = calculatedSubtotal + (values.tax || 0) - (values.discount || 0);
    
    const enhancedValues = {
      ...values,
      subtotal: calculatedSubtotal,
      total: calculatedTotal,
      selectedServices: enhancedServices
    };
    
    createEstimateMutation.mutate(enhancedValues);
  };

  const addService = (service: any) => {
    const laborRate = parseFloat(service.laborRate) || 0;
    const defaultQuantity = service.serviceType === "fence" ? 100 : 
                           service.serviceType === "roof" ? 1000 : 
                           service.serviceType === "siding" ? 1200 : 100;
    
    const calculatedCost = defaultQuantity * laborRate;
    
    const newService = {
      serviceType: service.serviceType,
      name: service.name,
      laborRate: service.laborRate,
      unit: service.unit,
      measurements: {
        quantity: defaultQuantity,
        squareFeet: service.serviceType === "roof" || service.serviceType === "siding" ? defaultQuantity : 0,
        linearFeet: service.serviceType === "fence" ? defaultQuantity : 0,
        units: service.serviceType === "fence" ? 2 : 1,
      },
      laborCost: calculatedCost,
      materialsCost: 0,
      notes: "",
    };
    const updatedServices = [...selectedServices, newService];
    setSelectedServices(updatedServices);
    form.setValue("selectedServices", updatedServices);
  };

  const removeService = (index: number) => {
    const updatedServices = selectedServices.filter((_, i) => i !== index);
    setSelectedServices(updatedServices);
    form.setValue("selectedServices", updatedServices);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/estimates">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
            >
              ← Back to Estimates
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Create Agent Estimate</h1>
        </div>
      </div>

      {/* Selected Client Status Bar */}
      {selectedClient && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <span className="font-semibold text-green-800">
                    Creating estimate for: {selectedClient.firstName} {selectedClient.lastName}
                  </span>
                  <div className="text-sm text-green-600">
                    {selectedClient.email && `${selectedClient.email}`}
                    {selectedClient.phone && ` • ${selectedClient.phone}`}
                  </div>
                </div>
              </div>
              <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                Client Selected
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="client">Client</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="measurements">Measurements</TabsTrigger>
              <TabsTrigger value="materials">Materials</TabsTrigger>
            </TabsList>

            {/* Client Tab */}
            <TabsContent value="client" className="space-y-6 pt-4">
              {/* Appointments Section */}
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-800 flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Today's Agent Estimate Appointments
                  </CardTitle>
                  <CardDescription className="text-blue-600">
                    Quick access to clients with scheduled appointments
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-blue-700">Select Date:</span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-48 justify-start text-left font-normal border-blue-300"
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {format(selectedDate, "PPP", { locale: enUS })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => date && updateSelectedDateAndClients(date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {clientsWithAppointments.length > 0 ? (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium mb-2 text-primary">
                        Clients with appointments for {format(selectedDate, "PPP", { locale: enUS })}:
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {clientsWithAppointments.map((client: any) => (
                          <Card key={client.id} className="cursor-pointer hover:border-primary hover:shadow-md transition-all duration-200 border-blue-200"
                            onClick={() => handleSelectClientWithAppointment(client)}
                          >
                            <CardContent className="p-4">
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-blue-600 text-lg">📅</span>
                                  <span className="font-semibold text-gray-900">{client.firstName} {client.lastName}</span>
                                </div>
                                
                                {/* Show appointment details */}
                                {client.appointments && client.appointments.length > 0 && (
                                  <div className="mb-2 p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                                    {client.appointments.map((appointment: any, index: number) => (
                                      <div key={index} className="text-xs text-blue-800">
                                        <div className="font-medium">{appointment.title}</div>
                                        <div>🕒 {format(new Date(appointment.startTime), "h:mm a")}</div>
                                        {appointment.type && (
                                          <div>📋 {appointment.type}</div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                <div className="text-xs text-muted-foreground space-y-1">
                                  {client.email && (
                                    <div className="flex items-center gap-1">
                                      <span>📧</span>
                                      <span>{client.email}</span>
                                    </div>
                                  )}
                                  {client.phone && (
                                    <div className="flex items-center gap-1">
                                      <span>📱</span>
                                      <span>{client.phone}</span>
                                    </div>
                                  )}
                                  {client.address && (
                                    <div className="flex items-start gap-1">
                                      <span>🏠</span>
                                      <span className="line-clamp-2">
                                        {client.address}
                                        {client.city && `, ${client.city}`}
                                        {client.state && `, ${client.state}`}
                                        {client.zip && ` ${client.zip}`}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="mt-2 pt-2 border-t border-gray-200">
                                  <span className="text-xs text-blue-600 font-medium">Click to select this client</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-blue-600 text-center py-4 bg-blue-50 rounded">
                      No appointments scheduled for {format(selectedDate, "PPP", { locale: enUS })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Client Information</CardTitle>
                  <CardDescription>Select client and provide estimate details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value ? field.value.toString() : ""}
                        >
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
                        <FormLabel>Estimate Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter estimate title" {...field} />
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
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter project description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter>
                  <Button type="button" onClick={() => setActiveTab("services")} className="ml-auto">
                    Continue to Services
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Services Tab */}
            <TabsContent value="services" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Select Services</CardTitle>
                  <CardDescription>Choose the services for this estimate</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Available Services */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Available Services</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {availableServices.map((service) => (
                        <div key={service.id} className="border rounded-lg p-4 space-y-3">
                          <div>
                            <h4 className="font-medium">{service.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              ${service.laborRate}/{service.unit}
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => addService(service)}
                            className="w-full"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            ADD
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Selected Services */}
                  {selectedServices.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Selected Services</h3>
                      <div className="space-y-3">
                        {selectedServices.map((service: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <h4 className="font-medium">{service.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                ${service.laborRate}/{service.unit}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removeService(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("client")}>
                    Back to Client
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setActiveTab("measurements")}
                    disabled={selectedServices.length === 0}
                  >
                    Continue to Measurements
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Measurements Tab */}
            <TabsContent value="measurements" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Measurements</CardTitle>
                  <CardDescription>Measure each selected service</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {selectedServices.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Please select services first</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {selectedServices.map((service: any, index: number) => (
                        <div key={`${service.serviceType}-${index}`} className="border rounded-lg p-4">
                          <h3 className="text-lg font-semibold mb-4">{service.name} Measurements</h3>
                          
                          {service.serviceType === "fence" && (
                            <FenceMeasurementTool
                              serviceUnit={service.unit}
                              onMeasurementsChange={(measurements: any) => {
                                // Calculate totals from measurements array
                                const totalLength = measurements.reduce((sum: number, m: any) => sum + (m.length || 0), 0);
                                const totalArea = measurements.reduce((sum: number, m: any) => sum + (m.area || 0), 0);
                                const gateCount = measurements.filter((m: any) => m.isGate).length;
                                
                                const updatedServices = [...selectedServices];
                                updatedServices[index] = {
                                  ...updatedServices[index],
                                  measurements: {
                                    linearFeet: totalLength,
                                    squareFeet: totalArea,
                                    units: gateCount,
                                    quantity: totalLength,
                                  }
                                };
                                setSelectedServices(updatedServices);
                                form.setValue("selectedServices", updatedServices);
                              }}
                            />
                          )}
                          
                          {service.serviceType === "deck" && (
                            <div className="space-y-4">
                              <p className="text-sm text-muted-foreground">Deck Area Measurement</p>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">Width (ft)</label>
                                  <Input type="number" placeholder="Enter width" />
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Length (ft)</label>
                                  <Input type="number" placeholder="Enter length" />
                                </div>
                              </div>
                            </div>
                          )}

                          {service.serviceType === "windows" && (
                            <div className="space-y-4">
                              <p className="text-sm text-muted-foreground">Number of Windows</p>
                              <Input type="number" placeholder="Enter number of windows" />
                            </div>
                          )}

                          {service.serviceType === "gutters" && (
                            <div className="space-y-4">
                              <p className="text-sm text-muted-foreground">Linear Feet of Gutters</p>
                              <Input type="number" placeholder="Enter linear feet" />
                            </div>
                          )}

                          {service.serviceType === "roof" && (
                            <div className="space-y-4">
                              <p className="text-sm text-muted-foreground">Roof Area (sq ft)</p>
                              <Input type="number" placeholder="Enter roof area" />
                            </div>
                          )}

                          {service.serviceType === "siding" && (
                            <div className="space-y-4">
                              <p className="text-sm text-muted-foreground">Siding Measurements</p>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">Height (ft)</label>
                                  <Input type="number" placeholder="Enter height" />
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Perimeter (ft)</label>
                                  <Input type="number" placeholder="Enter perimeter" />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("services")}>
                    Back to Services
                  </Button>
                  <Button type="button" onClick={() => setActiveTab("materials")}>
                    Continue to Materials
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Materials Tab */}
            <TabsContent value="materials" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Materials List</CardTitle>
                  <CardDescription>Basic materials needed for selected services</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!form.getValues("selectedServices") || form.getValues("selectedServices").length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Please select services first</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {form.getValues("selectedServices").map((service: any, index: number) => (
                        <div key={`materials-${service.serviceType}-${index}`} className="border rounded-lg p-4">
                          <h3 className="text-lg font-semibold mb-4">{service.name} - Materials Needed</h3>
                          
                          {service.serviceType === "fence" && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-gray-50 p-3 rounded">
                                <h4 className="font-medium mb-2">Posts & Foundation</h4>
                                <ul className="text-sm space-y-1">
                                  <li>• Pressure treated posts</li>
                                  <li>• Concrete mix</li>
                                  <li>• Post anchors</li>
                                </ul>
                              </div>
                              <div className="bg-gray-50 p-3 rounded">
                                <h4 className="font-medium mb-2">Panels & Hardware</h4>
                                <ul className="text-sm space-y-1">
                                  <li>• Fence panels</li>
                                  <li>• Rails (2x4)</li>
                                  <li>• Screws/nails</li>
                                  <li>• Gate hardware</li>
                                </ul>
                              </div>
                              <div className="bg-gray-50 p-3 rounded">
                                <h4 className="font-medium mb-2">Hardware & Installation</h4>
                                <ul className="text-sm space-y-1">
                                  <li>• Post caps</li>
                                  <li>• Wood stain</li>
                                  <li>• Primer</li>
                                </ul>
                              </div>
                            </div>
                          )}

                          {service.serviceType === "deck" && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-gray-50 p-3 rounded">
                                <h4 className="font-medium mb-2">Structure</h4>
                                <ul className="text-sm space-y-1">
                                  <li>• Joists (2x8, 2x10)</li>
                                  <li>• Beam boards</li>
                                  <li>• Posts (4x4, 6x6)</li>
                                  <li>• Concrete footings</li>
                                </ul>
                              </div>
                              <div className="bg-gray-50 p-3 rounded">
                                <h4 className="font-medium mb-2">Decking</h4>
                                <ul className="text-sm space-y-1">
                                  <li>• Deck boards</li>
                                  <li>• Joist hangers</li>
                                  <li>• Bolts and screws</li>
                                  <li>• Flashing</li>
                                </ul>
                              </div>
                              <div className="bg-gray-50 p-3 rounded">
                                <h4 className="font-medium mb-2">Railing</h4>
                                <ul className="text-sm space-y-1">
                                  <li>• Railing posts</li>
                                  <li>• Balusters</li>
                                  <li>• Top/bottom rails</li>
                                  <li>• Deck stain</li>
                                </ul>
                              </div>
                            </div>
                          )}

                          {service.serviceType === "roof" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-gray-50 p-3 rounded">
                                <h4 className="font-medium mb-2">Roofing</h4>
                                <ul className="text-sm space-y-1">
                                  <li>• Shingles or metal</li>
                                  <li>• Underlayment</li>
                                  <li>• Ice shield</li>
                                  <li>• Drip edge</li>
                                </ul>
                              </div>
                              <div className="bg-gray-50 p-3 rounded">
                                <h4 className="font-medium mb-2">Hardware</h4>
                                <ul className="text-sm space-y-1">
                                  <li>• Roofing nails</li>
                                  <li>• Ridge caps</li>
                                  <li>• Roof vents</li>
                                  <li>• Sealants</li>
                                </ul>
                              </div>
                            </div>
                          )}

                          {service.serviceType === "windows" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-gray-50 p-3 rounded">
                                <h4 className="font-medium mb-2">Windows</h4>
                                <ul className="text-sm space-y-1">
                                  <li>• Window units</li>
                                  <li>• Screens</li>
                                  <li>• Hardware</li>
                                </ul>
                              </div>
                              <div className="bg-gray-50 p-3 rounded">
                                <h4 className="font-medium mb-2">Installation</h4>
                                <ul className="text-sm space-y-1">
                                  <li>• Flashing tape</li>
                                  <li>• Insulation foam</li>
                                  <li>• Caulk</li>
                                  <li>• Trim boards</li>
                                </ul>
                              </div>
                            </div>
                          )}

                          {service.serviceType === "gutters" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-gray-50 p-3 rounded">
                                <h4 className="font-medium mb-2">Gutter System</h4>
                                <ul className="text-sm space-y-1">
                                  <li>• Gutters</li>
                                  <li>• Downspouts</li>
                                  <li>• End caps</li>
                                  <li>• Guards</li>
                                </ul>
                              </div>
                              <div className="bg-gray-50 p-3 rounded">
                                <h4 className="font-medium mb-2">Hardware</h4>
                                <ul className="text-sm space-y-1">
                                  <li>• Hangers</li>
                                  <li>• Screws</li>
                                  <li>• Splash blocks</li>
                                  <li>• Sealants</li>
                                </ul>
                              </div>
                            </div>
                          )}

                          {service.serviceType === "siding" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-gray-50 p-3 rounded">
                                <h4 className="font-medium mb-2">Siding</h4>
                                <ul className="text-sm space-y-1">
                                  <li>• Siding panels</li>
                                  <li>• Starter strips</li>
                                  <li>• J-channel</li>
                                  <li>• Corner posts</li>
                                </ul>
                              </div>
                              <div className="bg-gray-50 p-3 rounded">
                                <h4 className="font-medium mb-2">Installation</h4>
                                <ul className="text-sm space-y-1">
                                  <li>• House wrap</li>
                                  <li>• Fasteners</li>
                                  <li>• Caulk</li>
                                  <li>• Paint/stain</li>
                                </ul>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("measurements")}>
                    Back to Measurements
                  </Button>
                  <Button type="submit" disabled={createEstimateMutation.isPending}>
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