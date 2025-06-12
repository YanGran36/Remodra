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
import PageHeader from "@/components/ui/page-header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Importar tipos y datos de servicio
import { 
  SERVICE_TYPES, 
  MATERIALS_BY_SERVICE, 
  OPTIONS_BY_SERVICE,
  SERVICE_INFO,
  getServiceLabel,
  getMaterialWithConfiguredPrice,
  getServiceBasePrice
} from "@/lib/service-options";

// Importar hook de precios centralizados
import { usePricing } from '@/hooks/use-pricing';

// Importar componentes de formulario especializados
import ServiceEstimateForm from "@/components/estimates/service-estimate-form";

// Define el esquema de validación del formulario
const formSchema = z.object({
  clientId: z.string().min(1, { message: "Por favor seleccione un cliente" }),
  projectId: z.string().optional(),
  serviceType: z.string().min(1, { message: "Por favor seleccione un tipo de servicio" }),
  materialType: z.string().optional(),
  squareFeet: z.string().optional(),
  linearFeet: z.string().optional(),
  units: z.string().optional(),
  notes: z.string().optional()
});

type FormValues = z.infer<typeof formSchema>;

// Interfaz para los elementos seleccionados
interface SelectedItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export default function VendorEstimateFormPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Estados locales
  const [activeTab, setActiveTab] = useState("client");
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [selectedServiceType, setSelectedServiceType] = useState<string>("");
  const [selectedOptions, setSelectedOptions] = useState<SelectedItem[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Usar nuestro hook de precios centralizados
  const { services, materials: configuredMaterials, isLoading: pricesLoading } = usePricing();
  
  // Estados para herramientas de medición
  const [isDigitalMeasurementOpen, setIsDigitalMeasurementOpen] = useState(false);
  const [isLidarScannerOpen, setIsLidarScannerOpen] = useState(false);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [scanResults, setScanResults] = useState<any[]>([]);
  
  // Estado para el formulario especializado
  const [estimateItems, setEstimateItems] = useState<SelectedItem[]>([]);
  
  // Manejar actualización de artículos y total desde el componente especializado
  const handleUpdateTotal = (items: SelectedItem[], total: number) => {
    setEstimateItems(items);
    setTotalAmount(total);
  };
  
  // Limpiar formulario especializado
  const handleClearSpecializedForm = () => {
    setEstimateItems([]);
    setTotalAmount(0);
  };
  
  // Fetch clients
  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ["/api/protected/clients"],
  });
  
  // Fetch projects
  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ["/api/protected/projects"],
  });
  
  // Form definition
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: "",
      projectId: "",
      serviceType: "",
      materialType: "",
      squareFeet: "",
      linearFeet: "",
      units: "",
      notes: ""
    }
  });
  
  // Watch values
  const watchServiceType = form.watch("serviceType");
  const watchMaterialType = form.watch("materialType");
  const watchClientId = form.watch("clientId");
  
  // Filter projects by client
  const filteredProjects = watchClientId
    ? projects.filter((project: any) => project.clientId?.toString() === watchClientId)
    : [];
  
  // Effect for service type change
  useEffect(() => {
    if (watchServiceType !== selectedServiceType) {
      setSelectedServiceType(watchServiceType);
      form.setValue("materialType", "");
      setSelectedMaterial(null);
      setSelectedOptions([]);
      setEstimateItems([]);
      setTotalAmount(0);
    }
  }, [watchServiceType, selectedServiceType, form]);
  
  // Create estimate mutation
  const createEstimateMutation = useMutation({
    mutationFn: async (data: any) => {
      setIsSubmitting(true);
      const res = await apiRequest("POST", "/api/protected/estimates", data);
      return await res.json();
    },
    onSuccess: (data) => {
      setIsSubmitting(false);
      queryClient.invalidateQueries({ queryKey: ["/api/protected/estimates"] });
      toast({
        title: "Estimate created successfully!",
        description: "The estimate has been generated from the captured data.",
      });
      // Redirect to the newly created estimate
      setLocation(`/estimates/${data.id}`);
    },
    onError: (error: Error) => {
      setIsSubmitting(false);
      toast({
        title: "Error creating estimate",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (values: FormValues) => {
    if (totalAmount <= 0) {
      toast({
        title: "Incomplete information",
        description: "Please complete the measurements and select at least one material.",
        variant: "destructive",
      });
      return;
    }
    
    // Build items array for the estimate
    const items: Array<{
      description: string;
      quantity: string;
      unitPrice: string;
      amount: string;
      notes?: string;
    }> = [];
    
    // Add items from specialized form
    estimateItems.forEach(item => {
      items.push({
        description: item.name,
        quantity: item.quantity.toString(),
        unitPrice: item.unitPrice.toString(),
        amount: item.total.toString(),
        notes: item.unit
      });
    });
    
    // Get selected client details
    const selectedClient = clients.find((c: any) => c.id.toString() === values.clientId);
    
    // Prepare estimate data
    const estimateData = {
      clientId: Number(values.clientId),
      projectId: values.projectId && values.projectId !== "none" ? Number(values.projectId) : null,
      estimateNumber: generateEstimateNumber(),
      issueDate: new Date(),
      expiryDate: addDays(new Date(), 30),
      status: "draft",
      subtotal: totalAmount.toString(),
      tax: "0",
      discount: "0",
      total: totalAmount.toString(),
      terms: "1. This estimate is valid for 30 days from the issue date.\n2. A payment of 50% is required to start the work.\n3. The remaining balance will be paid upon completion of the work.\n4. Any modifications to the scope of work may result in additional costs.",
      notes: values.notes || `Estimate for ${SERVICE_TYPES.find(s => s.value === values.serviceType)?.label} generated during client visit on ${format(new Date(), "PPP")}`,
      contractorSignature: user?.firstName + " " + user?.lastName,
      items
    };
    
    // Submit estimate
    createEstimateMutation.mutate(estimateData);
  };
  
  function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
  
  function generateEstimateNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    // Generate a random 3-digit number
    const random = Math.floor(Math.random() * 900) + 100;
    return `EST-${year}-${random}`;
  }
  
  // Funciones para las herramientas de medición
  const handleMeasurementsChange = (newMeasurements: any[]) => {
    setMeasurements(newMeasurements);
    
    toast({
      title: "Measurements updated",
      description: "The measurements have been registered correctly.",
    });
  };
  
  const handleScanComplete = (result: any) => {
    setScanResults(prev => [...prev, result]);
    
    toast({
      title: "Scan completed",
      description: "The scan has been completed. You can use these images to take precise measurements.",
    });
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader 
        title="Vendor Estimate Form" 
        description="Quickly capture information during client appointments to generate accurate estimates"
      />
      
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setLocation('/estimates')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Estimates
        </Button>
        
        <Button 
          variant="default" 
          size="sm" 
          onClick={form.handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting ? "Saving..." : "Save Estimate"}
        </Button>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="client">Client</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="labor">Labor</TabsTrigger>
              <TabsTrigger value="measurements">Measurements</TabsTrigger>
              <TabsTrigger value="summary">Summary & Analysis</TabsTrigger>
            </TabsList>
            
            <TabsContent value="client" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>
                    Select the client and service type for this estimate
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client*</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select client" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clients.map((client: any) => (
                              <SelectItem key={client.id} value={client.id.toString()}>
                                {client.firstName} {client.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The client for whom this estimate will be generated
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                
                  <FormField
                    control={form.control}
                    name="projectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={!watchClientId}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select project (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None / New Project</SelectItem>
                            {filteredProjects.map((project: any) => (
                              <SelectItem key={project.id} value={project.id.toString()}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Associate this estimate with an existing project (optional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter additional notes about the estimate"
                            {...field}
                            rows={4}
                          />
                        </FormControl>
                        <FormDescription>
                          Additional details about the work to be performed
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-end">
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
                  <button 
                    type="button" 
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    onClick={() => setActiveTab("client")}
                  >
                    Previous
                  </button>
                  <button 
                    type="button" 
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                    onClick={() => setActiveTab("labor")}
                    disabled={!form.getValues("serviceType")}
                  >
                    Next: Labor
                  </button>
                </div>
              </div>
            </TabsContent>
                            <ul className="list-disc list-inside space-y-1">
                              <li>Custom deck construction and design</li>
                              <li>Composite, wood, and PVC materials</li>
                              <li>Railings, stairs, and lighting options</li>
                            </ul>
                          </div>
                        </div>
                        {form.getValues("serviceType") === "deck" && (
                          <div className="absolute top-2 right-2">
                            <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                              ✓
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Fence Installation */}
                      <div 
                        className={`transition-all relative overflow-hidden border-2 cursor-pointer hover:shadow-lg rounded-lg p-4 ${
                          form.getValues("serviceType") === "fence" 
                            ? "border-blue-500 bg-blue-50 shadow-lg scale-105" 
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                        onClick={() => form.setValue("serviceType", "fence")}
                      >
                        <div className="flex items-center gap-2 text-lg font-semibold mb-2">
                          <span className="text-2xl">🔧</span>
                          Fence Installation
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm text-gray-600">
                            <strong>Labor Rate:</strong> $38.00/ft
                          </div>
                          <div className="text-sm text-gray-600">
                            <strong>Service Type:</strong> fence
                          </div>
                          <div className="text-sm text-gray-600">
                            <strong>Method:</strong> by_area
                          </div>
                        </div>
                        <div className="mt-3 pt-2 border-t">
                          <div className="text-xs text-gray-500">
                            <ul className="list-disc list-inside space-y-1">
                              <li>Custom fence design and installation</li>
                              <li>Wood, vinyl, aluminum materials available</li>
                              <li>Gate installation and hardware included</li>
                            </ul>
                          </div>
                        </div>
                        {form.getValues("serviceType") === "fence" && (
                          <div className="absolute top-2 right-2">
                            <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                              ✓
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Roof Installation */}
                      <div 
                        className={`transition-all relative overflow-hidden border-2 cursor-pointer hover:shadow-lg rounded-lg p-4 ${
                          form.getValues("serviceType") === "roof" 
                            ? "border-blue-500 bg-blue-50 shadow-lg scale-105" 
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                        onClick={() => form.setValue("serviceType", "roof")}
                      >
                        <div className="flex items-center gap-2 text-lg font-semibold mb-2">
                          <span className="text-2xl">🏠</span>
                          Roof Installation
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm text-gray-600">
                            <strong>Labor Rate:</strong> $15.00/sqft
                          </div>
                          <div className="text-sm text-gray-600">
                            <strong>Service Type:</strong> roof
                          </div>
                          <div className="text-sm text-gray-600">
                            <strong>Method:</strong> by_area
                          </div>
                        </div>
                        <div className="mt-3 pt-2 border-t">
                          <div className="text-xs text-gray-500">
                            <ul className="list-disc list-inside space-y-1">
                              <li>Complete roof installation and replacement</li>
                              <li>Shingle, tile, and metal roofing options</li>
                              <li>Weatherproofing and insulation included</li>
                            </ul>
                          </div>
                        </div>
                        {form.getValues("serviceType") === "roof" && (
                          <div className="absolute top-2 right-2">
                            <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                              ✓
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Windows Installation */}
                      <div 
                        className={`transition-all relative overflow-hidden border-2 cursor-pointer hover:shadow-lg rounded-lg p-4 ${
                          form.getValues("serviceType") === "windows" 
                            ? "border-blue-500 bg-blue-50 shadow-lg scale-105" 
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                        onClick={() => form.setValue("serviceType", "windows")}
                      >
                        <div className="flex items-center gap-2 text-lg font-semibold mb-2">
                          <span className="text-2xl">🪟</span>
                          Windows Installation
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm text-gray-600">
                            <strong>Labor Rate:</strong> $350.00/unit
                          </div>
                          <div className="text-sm text-gray-600">
                            <strong>Service Type:</strong> windows
                          </div>
                          <div className="text-sm text-gray-600">
                            <strong>Method:</strong> by_area
                          </div>
                        </div>
                        <div className="mt-3 pt-2 border-t">
                          <div className="text-xs text-gray-500">
                            <ul className="list-disc list-inside space-y-1">
                              <li>Energy-efficient window installation</li>
                              <li>Double and triple-pane options</li>
                              <li>Custom sizes and styles available</li>
                            </ul>
                          </div>
                        </div>
                        {form.getValues("serviceType") === "windows" && (
                          <div className="absolute top-2 right-2">
                            <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                              ✓
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Helpful message */}
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        💡 <strong>Tip:</strong> Select a service to see pricing details and configure labor calculations for your estimate.
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline" 
                    type="button" 
                    onClick={() => setActiveTab("client")}
                  >
                    Previous
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setActiveTab("labor")}
                    disabled={!form.getValues("serviceType")}
                  >
                    Next: Labor
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="labor" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Labor Configuration</CardTitle>
                  <CardDescription>
                    Configure labor rates and calculations for your selected service
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!form.getValues("serviceType") ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Please select a service in the Services tab first</p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Labor configuration will be implemented here</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline" 
                    type="button" 
                    onClick={() => setActiveTab("services")}
                  >
                    Previous
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setActiveTab("measurements")}
                    disabled={!form.getValues("serviceType")}
                  >
                    Next: Measurements
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="materials" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Estimador Especializado</CardTitle>
                  <CardDescription>
                    Configure los materiales, opciones y medidas para {SERVICE_TYPES.find(s => s.value === watchServiceType)?.label || "el servicio"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!watchServiceType ? (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">Por favor, primero seleccione un tipo de servicio en la pestaña anterior</p>
                    </div>
                  ) : (
                    <>
                      {/* Formulario especializado por tipo de servicio */}
                      <ServiceEstimateForm
                        serviceType={watchServiceType}
                        onUpdateTotal={handleUpdateTotal}
                        onClearForm={handleClearSpecializedForm}
                      />
                      
                      {/* Nueva sección simple */}
                      <div className="text-center py-8">
                        <h3 className="text-lg font-medium mb-4">Services Configuration Complete</h3>
                        <p className="text-muted-foreground">Ready to proceed to summary</p>
                      </div>
                    </>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline" 
                    type="button" 
                    onClick={() => setActiveTab("information")}
                  >
                    Previous
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setActiveTab("summary")}
                    disabled={estimateItems.length === 0}
                  >
                    Next: Measurements
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="summary" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Estimate Summary</CardTitle>
                  <CardDescription>
                    Review the information before generating the estimate
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-md font-medium mb-2">Client Information</h3>
                      <div className="rounded-md bg-muted p-4">
                        {watchClientId ? (
                          <>
                            {clients.find((c: any) => c.id.toString() === watchClientId) && (
                              <div className="space-y-1">
                                <p className="font-medium">
                                  {clients.find((c: any) => c.id.toString() === watchClientId)?.firstName} {clients.find((c: any) => c.id.toString() === watchClientId)?.lastName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {clients.find((c: any) => c.id.toString() === watchClientId)?.email}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {clients.find((c: any) => c.id.toString() === watchClientId)?.phone}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {clients.find((c: any) => c.id.toString() === watchClientId)?.address}
                                </p>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-muted-foreground">No se ha seleccionado un cliente</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-md font-medium mb-2">Detalles del Servicio</h3>
                      <div className="rounded-md bg-muted p-4">
                        {watchServiceType ? (
                          <div className="space-y-2">
                            <p>
                              <span className="font-medium">Service Type:</span>{" "}
                              {SERVICE_TYPES.find(s => s.value === watchServiceType)?.label}
                            </p>
                          </div>
                        ) : (
                          <p className="text-muted-foreground">No se ha seleccionado un servicio</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-md font-medium mb-2">Desglose de Costos</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50%]">Ítem</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Precio Unitario</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {estimateItems.map((item, index) => (
                          <TableRow key={item.id || index}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>
                              {item.quantity} {item.unit}
                            </TableCell>
                            <TableCell>${item.unitPrice.toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                              ${item.total.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                        
                        {estimateItems.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                              No hay ítems en este estimado
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                      <TableFooter>
                        <TableRow>
                          <TableCell colSpan={3}>Estimated Total</TableCell>
                          <TableCell className="text-right font-bold">
                            ${totalAmount.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </div>
                  
                  <div className="rounded-md border p-4">
                    <h3 className="text-md font-medium mb-2">Notes</h3>
                    <p className="text-sm text-muted-foreground">
                      {form.getValues("notes") || "No notes have been added"}
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline" 
                    type="button" 
                    onClick={() => setActiveTab("materials")}
                  >
                    Atrás
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || estimateItems.length === 0}
                  >
                    {isSubmitting ? "Saving..." : "Generate Estimate"}
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