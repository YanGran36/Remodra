import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowLeft, Calculator, FileText, Users, Wrench } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  clientId: z.coerce.number().min(1, "Please select a client"),
  title: z.string().min(1, "Title is required"),
  serviceType: z.string().min(1, "Please select a service type"),
  quantity: z.coerce.number().min(0.1, "Quantity must be greater than 0"),
  description: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Service {
  id: number;
  name: string;
  serviceType: string;
  unit: string;
  laborRate: string;
  laborMethod: string;
}

interface Client {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export default function VendorEstimateSimple() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [laborCost, setLaborCost] = useState(0);
  const [materialsCost, setMaterialsCost] = useState(0);
  const [totalCost, setTotalCost] = useState(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: 0,
      title: "",
      serviceType: "",
      quantity: 0,
      description: "",
      notes: "",
    },
  });

  // Fetch clients
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/protected/clients"],
  });

  // Fetch services
  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["/api/direct/services"],
  });

  // Create estimate mutation
  const createEstimateMutation = useMutation({
    mutationFn: async (data: FormValues & { laborCost: number; materialsCost: number; totalAmount: number }) => {
      const response = await apiRequest("POST", "/api/protected/estimates", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Estimate Created",
        description: "The estimate has been created successfully.",
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

  // Watch form values for calculations
  const watchedValues = form.watch();

  useEffect(() => {
    if (watchedValues.serviceType && watchedValues.quantity > 0) {
      const service = services.find(s => s.serviceType === watchedValues.serviceType);
      if (service) {
        setSelectedService(service);
        const laborRate = parseFloat(service.laborRate);
        const calculatedLaborCost = laborRate * watchedValues.quantity;
        setLaborCost(calculatedLaborCost);
        
        // For now, materials cost is estimated at 40% of labor cost
        const estimatedMaterialsCost = calculatedLaborCost * 0.4;
        setMaterialsCost(estimatedMaterialsCost);
        
        const total = calculatedLaborCost + estimatedMaterialsCost;
        setTotalCost(total);
      }
    } else {
      setSelectedService(null);
      setLaborCost(0);
      setMaterialsCost(0);
      setTotalCost(0);
    }
  }, [watchedValues.serviceType, watchedValues.quantity, services]);

  const onSubmit = (values: FormValues) => {
    if (!selectedService) {
      toast({
        title: "Error",
        description: "Please select a service type",
        variant: "destructive",
      });
      return;
    }

    createEstimateMutation.mutate({
      ...values,
      laborCost,
      materialsCost,
      totalAmount: totalCost,
    });
  };

  function generateEstimateNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const time = String(Date.now()).slice(-4);
    return `EST-${year}${month}${day}-${time}`;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/estimates")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create New Estimate</h1>
            <p className="text-muted-foreground">Generate a professional estimate for your client</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Estimate Details</span>
              </CardTitle>
              <CardDescription>
                Fill in the basic information for your estimate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Client Selection */}
                    <FormField
                      control={form.control}
                      name="clientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-2">
                            <Users className="h-4 w-4" />
                            <span>Client</span>
                          </FormLabel>
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
                              {clients.map((client) => (
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

                    {/* Title */}
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estimate Title</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={generateEstimateNumber()}
                              {...field}
                              onFocus={() => {
                                if (!field.value) {
                                  field.onChange(generateEstimateNumber());
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Service Type */}
                    <FormField
                      control={form.control}
                      name="serviceType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-2">
                            <Wrench className="h-4 w-4" />
                            <span>Service Type</span>
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select service type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {services.map((service) => (
                                <SelectItem key={service.id} value={service.serviceType}>
                                  {service.name} (${service.laborRate}/{service.unit})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Quantity */}
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-2">
                            <Calculator className="h-4 w-4" />
                            <span>Quantity {selectedService && `(${selectedService.unit})`}</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Enter quantity"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the work to be performed..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Notes */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any additional notes or special instructions..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createEstimateMutation.isPending}
                  >
                    {createEstimateMutation.isPending ? "Creating..." : "Create Estimate"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Cost Summary */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calculator className="h-5 w-5" />
                <span>Cost Breakdown</span>
              </CardTitle>
              <CardDescription>
                Real-time calculation based on your inputs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedService ? (
                <>
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">{selectedService.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Rate: ${selectedService.laborRate} per {selectedService.unit}
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Labor Cost:</span>
                      <span className="font-semibold">${laborCost.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Materials (est.):</span>
                      <span className="font-semibold">${materialsCost.toFixed(2)}</span>
                    </div>

                    <Separator />

                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-primary">${totalCost.toFixed(2)}</span>
                    </div>
                  </div>

                  {watchedValues.quantity > 0 && (
                    <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Quantity: {watchedValues.quantity} {selectedService.unit}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calculator className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Select a service and enter quantity to see cost breakdown</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}