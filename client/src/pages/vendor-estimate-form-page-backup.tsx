import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Pencil, 
  Trash2, 
  Calculator, 
  CalendarIcon, 
  ClipboardCheck,
  Ruler,
  Scan,
  Camera
} from "lucide-react";

// Componentes de Medición Digital
import DigitalMeasurement from "@/components/measurement/digital-measurement";
import LiDARScanner from "@/components/measurement/lidar-scanner";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  clientId: z.number().min(1, "Please select a client"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  serviceType: z.string().min(1, "Please select a service type"),
  laborAmount: z.number().min(0, "Labor amount must be positive").optional(),
  
  // Measurement fields
  squareFeet: z.number().min(0).optional(),
  linearFeet: z.number().min(0).optional(),
  units: z.number().min(0).optional(),
  
  // Date fields
  estimateDate: z.date().optional(),
  expirationDate: z.date().optional(),
  
  // Notes
  notes: z.string().optional(),
  
  // Selected items arrays
  selectedMaterials: z.array(z.object({
    id: z.string(),
    name: z.string(),
    quantity: z.number(),
    unit: z.string(),
    unitPrice: z.number(),
    total: z.number(),
  })).default([]),
  
  selectedServices: z.array(z.object({
    id: z.string(),
    name: z.string(),
    quantity: z.number(),
    unit: z.string(),
    unitPrice: z.number(),
    total: z.number(),
  })).default([]),
});

type FormValues = z.infer<typeof formSchema>;

interface SelectedItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export default function VendorEstimateFormPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("client");
  const [measurementMode, setMeasurementMode] = useState<"digital" | "lidar" | "manual">("manual");
  const [measurements, setMeasurements] = useState({
    squareFeet: 0,
    linearFeet: 0,
    units: 0
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: 0,
      title: "",
      description: "",
      serviceType: "",
      laborAmount: 0,
      squareFeet: 0,
      linearFeet: 0,
      units: 0,
      notes: "",
      selectedMaterials: [],
      selectedServices: [],
    },
  });

  // Fetch clients
  const { data: clients } = useQuery({
    queryKey: ["/api/protected/clients"],
  });

  // Create estimate mutation
  const createEstimateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("POST", "/api/protected/estimates", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Estimate created successfully",
      });
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
    createEstimateMutation.mutate(values);
  };

  function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

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

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex items-center gap-4 mb-8">
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => setLocation("/estimates")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create New Estimate</h1>
          <p className="text-muted-foreground">
            Build a professional estimate for your client
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="client">Client</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="materials">Materials</TabsTrigger>
              <TabsTrigger value="labor">Labor</TabsTrigger>
              <TabsTrigger value="measurements">Measurements</TabsTrigger>
              <TabsTrigger value="review">Review</TabsTrigger>
            </TabsList>

            <TabsContent value="client" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Client Information</CardTitle>
                  <CardDescription>
                    Select the client for this estimate
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
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
                          <Textarea 
                            placeholder="Enter project description" 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div></div>
                  <Button 
                    type="button" 
                    onClick={() => setActiveTab("services")}
                    disabled={!form.getValues("clientId")}
                  >
                    Next: Services
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="services" className="space-y-6 pt-4">
              <div className="p-6 bg-white rounded-lg border">
                <h1 className="text-3xl font-bold text-center mb-8">Select Your Service</h1>
                
                <div className="grid grid-cols-2 gap-6">
                  {/* Deck Installation */}
                  <div 
                    className={`p-6 border-2 rounded-lg cursor-pointer transition-all hover:shadow-lg ${
                      form.getValues("serviceType") === "deck" 
                        ? "border-blue-500 bg-blue-50" 
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                    onClick={() => form.setValue("serviceType", "deck")}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-4">🪵</div>
                      <h3 className="text-xl font-bold mb-2">Deck Installation</h3>
                      <p className="text-sm text-gray-600 mb-2">$40.00/sqft</p>
                      <p className="text-xs text-gray-500">Custom deck construction and design</p>
                    </div>
                  </div>

                  {/* Fence Installation */}
                  <div 
                    className={`p-6 border-2 rounded-lg cursor-pointer transition-all hover:shadow-lg ${
                      form.getValues("serviceType") === "fence" 
                        ? "border-blue-500 bg-blue-50" 
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                    onClick={() => form.setValue("serviceType", "fence")}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-4">🔧</div>
                      <h3 className="text-xl font-bold mb-2">Fence Installation</h3>
                      <p className="text-sm text-gray-600 mb-2">$38.00/ft</p>
                      <p className="text-xs text-gray-500">Custom fence design and installation</p>
                    </div>
                  </div>

                  {/* Roof Installation */}
                  <div 
                    className={`p-6 border-2 rounded-lg cursor-pointer transition-all hover:shadow-lg ${
                      form.getValues("serviceType") === "roof" 
                        ? "border-blue-500 bg-blue-50" 
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                    onClick={() => form.setValue("serviceType", "roof")}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-4">🏠</div>
                      <h3 className="text-xl font-bold mb-2">Roof Installation</h3>
                      <p className="text-sm text-gray-600 mb-2">$15.00/sqft</p>
                      <p className="text-xs text-gray-500">Complete roof installation and replacement</p>
                    </div>
                  </div>

                  {/* Windows Installation */}
                  <div 
                    className={`p-6 border-2 rounded-lg cursor-pointer transition-all hover:shadow-lg ${
                      form.getValues("serviceType") === "windows" 
                        ? "border-blue-500 bg-blue-50" 
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                    onClick={() => form.setValue("serviceType", "windows")}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-4">🪟</div>
                      <h3 className="text-xl font-bold mb-2">Windows Installation</h3>
                      <p className="text-sm text-gray-600 mb-2">$350.00/unit</p>
                      <p className="text-xs text-gray-500">Energy-efficient window installation</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setActiveTab("client")}
                  >
                    Previous
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setActiveTab("materials")}
                    disabled={!form.getValues("serviceType")}
                  >
                    Next: Materials
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="materials" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Materials Selection</CardTitle>
                  <CardDescription>
                    Choose materials for your project
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Materials selection will be available here</p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setActiveTab("services")}
                  >
                    Previous
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setActiveTab("labor")}
                  >
                    Next: Labor
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="labor" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Labor Calculation</CardTitle>
                  <CardDescription>
                    Configure labor costs for your estimate
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Labor calculation will be available here</p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setActiveTab("materials")}
                  >
                    Previous
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setActiveTab("measurements")}
                  >
                    Next: Measurements
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="measurements" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Measurements</CardTitle>
                  <CardDescription>
                    Take measurements for your project
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Measurement tools will be available here</p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setActiveTab("labor")}
                  >
                    Previous
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setActiveTab("review")}
                  >
                    Next: Review
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="review" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Review & Create Estimate</CardTitle>
                  <CardDescription>
                    Review your estimate before creating
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="font-semibold">Client:</Label>
                        <p className="text-sm text-muted-foreground">
                          {clients?.find((c: any) => c.id === form.getValues("clientId"))?.firstName} {clients?.find((c: any) => c.id === form.getValues("clientId"))?.lastName}
                        </p>
                      </div>
                      <div>
                        <Label className="font-semibold">Service Type:</Label>
                        <p className="text-sm text-muted-foreground capitalize">
                          {form.getValues("serviceType")}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="font-semibold">Title:</Label>
                      <p className="text-sm text-muted-foreground">
                        {form.getValues("title")}
                      </p>
                    </div>
                    
                    {form.getValues("description") && (
                      <div>
                        <Label className="font-semibold">Description:</Label>
                        <p className="text-sm text-muted-foreground">
                          {form.getValues("description")}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setActiveTab("measurements")}
                  >
                    Previous
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createEstimateMutation.isPending}
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