import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus } from "lucide-react";
import { FenceMeasurementTool } from "@/components/measurement/fence-measurement-tool";

const formSchema = z.object({
  clientId: z.number(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
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
  })),
  totalLaborCost: z.number().optional(),
  totalMaterialsCost: z.number().optional(),
  totalAmount: z.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function VendorEstimateFormPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("client");
  const [availableServices, setAvailableServices] = useState<any[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      selectedServices: [],
      totalLaborCost: 0,
      totalMaterialsCost: 0,
      totalAmount: 0,
    },
  });

  // Fetch clients
  const { data: clients } = useQuery({
    queryKey: ["/api/protected/clients"],
  });

  // Fetch available services
  const { data: services } = useQuery({
    queryKey: ["/api/direct/services"],
  });

  useEffect(() => {
    if (services) {
      setAvailableServices(services);
    }
  }, [services]);

  const createEstimateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await fetch("/api/estimates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create estimate");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Estimate created successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/estimates"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (values: FormValues) => {
    createEstimateMutation.mutate(values);
  };

  const addService = (service: any) => {
    const currentServices = form.getValues("selectedServices");
    const newService = {
      serviceType: service.serviceType,
      name: service.name,
      laborRate: service.laborRate,
      unit: service.unit,
      measurements: {},
      laborCost: 0,
      materialsCost: 0,
      notes: "",
    };
    form.setValue("selectedServices", [...currentServices, newService]);
  };

  const removeService = (index: number) => {
    const currentServices = form.getValues("selectedServices");
    currentServices.splice(index, 1);
    form.setValue("selectedServices", currentServices);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Create New Estimate</h1>
      </div>

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
                        <Select onValueChange={(value) => field.onChange(parseInt(value))}>
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
                  {form.getValues("selectedServices").length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Selected Services</h3>
                      <div className="space-y-3">
                        {form.getValues("selectedServices").map((service: any, index: number) => (
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
                    disabled={form.getValues("selectedServices").length === 0}
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
                  {form.getValues("selectedServices").length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Please select services first</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {form.getValues("selectedServices").map((service: any, index: number) => (
                        <div key={`${service.serviceType}-${index}`} className="border rounded-lg p-4">
                          <h3 className="text-lg font-semibold mb-4">{service.name} Measurements</h3>
                          
                          {service.serviceType === "fence" && (
                            <FenceMeasurementTool
                              serviceUnit={service.unit}
                              onMeasurementsChange={(measurements) => {
                                const currentServices = form.getValues("selectedServices");
                                // Calculate totals from measurements array
                                const totalLength = measurements.reduce((sum, m) => sum + (m.length || 0), 0);
                                const totalArea = measurements.reduce((sum, m) => sum + (m.area || 0), 0);
                                const gateCount = measurements.filter(m => m.isGate).length;
                                
                                currentServices[index] = {
                                  ...currentServices[index],
                                  measurements: {
                                    linearFeet: totalLength,
                                    squareFeet: totalArea,
                                    units: gateCount,
                                    quantity: totalLength,
                                  }
                                };
                                form.setValue("selectedServices", currentServices);
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
                                  <li>• Gravel</li>
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
                                <h4 className="font-medium mb-2">Finishing</h4>
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