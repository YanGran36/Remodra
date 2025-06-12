import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useAiCostAnalysis, MaterialInput, AiAnalysisResult } from "@/hooks/use-ai-cost-analysis";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
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
  Camera,
  BarChart4
} from "lucide-react";

// AI analysis component
import AiAnalysisPanel from "@/components/ai/ai-analysis-panel";

// Digital Measurement Components
import DigitalMeasurement from "@/components/measurement/digital-measurement";
import LiDARScanner from "@/components/measurement/lidar-scanner";

// UI Components
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

// Import service types and data
import { 
  SERVICE_TYPES, 
  MATERIALS_BY_SERVICE, 
  OPTIONS_BY_SERVICE,
  SERVICE_INFO,
  getServiceLabel
} from "@/lib/service-options";

// Define the form validation schema
// Note: The translations will be applied by useForm when rendering the form
const formSchema = z.object({
  clientId: z.string().min(1, { message: "Please select a client" }),
  projectId: z.string().optional(),
  serviceType: z.string().min(1, { message: "Please select a service type" }),
  materialType: z.string().optional(),
  squareFeet: z.string().optional(),
  linearFeet: z.string().optional(),
  units: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "complex"]).default("medium"),
  notes: z.string().optional(),
  additionalInfo: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Interface for selected items
interface SelectedItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export default function VendorEstimateFormPageNew() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  
  // Get clientId from URL if it exists
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const clientIdFromUrl = urlParams.get('clientId');
  
  // Local states
  const [activeTab, setActiveTab] = useState("information");
  const [selectedMaterials, setSelectedMaterials] = useState<MaterialInput[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<SelectedItem[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [todayEvents, setTodayEvents] = useState<any[]>([]);
  const [clientsWithAppointments, setClientsWithAppointments] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAppointmentCalendar, setShowAppointmentCalendar] = useState(false);
  
  // States for measurement tools
  const [isDigitalMeasurementOpen, setIsDigitalMeasurementOpen] = useState(false);
  const [isLidarScannerOpen, setIsLidarScannerOpen] = useState(false);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [scanResults, setScanResults] = useState<any[]>([]);
  const [selectedProjectFromEvent, setSelectedProjectFromEvent] = useState<string>();
  
  // Helper functions
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
  
  function generateInvoiceNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    // Generate a random 3-digit number
    const random = Math.floor(Math.random() * 900) + 100;
    return `INV-${year}-${random}`;
  }
  
  // Fetch clients
  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ["/api/protected/clients"],
  });
  
  // Fetch projects
  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ["/api/protected/projects"],
  });
  
  // Fetch events (To get scheduled appointments)
  const { data: events = [] } = useQuery<any[]>({
    queryKey: ["/api/protected/events"]
  });
  
  // Form definition
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: clientIdFromUrl || "",
      projectId: "",
      serviceType: "",
      materialType: "",
      squareFeet: "",
      linearFeet: "",
      units: "",
      difficulty: "medium",
      notes: "",
      additionalInfo: ""
    }
  });
  
  // Function to filter clients with appointments on a specific date
  const getClientsWithAppointmentsForDate = (date: Date) => {
    if (!events.length || !clients.length) return [];
    
    // Create limits for the selected date (start and end of day)
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
    
    // Filter events for the selected date - show all appointments, not just estimates
    const eventsForSelectedDate = events.filter((event: any) => {
      const eventDate = new Date(event.startTime);
      return eventDate >= dayStart && eventDate <= dayEnd;
    });
    
    console.log("Events for selected date:", eventsForSelectedDate);
    
    // Extract IDs of clients with appointments on that date
    const clientIds = eventsForSelectedDate
      .filter((event: any) => event.clientId)
      .map((event: any) => event.clientId.toString());
      
    console.log("Client IDs with appointments:", clientIds);
    
    // Remove duplicates
    const uniqueClientIds = Array.from(new Set(clientIds));
    
    // Find clients corresponding to those IDs and include appointment details
    const clientsWithAppointments = clients.filter((client: any) => 
      uniqueClientIds.includes(client.id.toString())
    ).map((client: any) => {
      // Find the appointment details for this client
      const clientAppointments = eventsForSelectedDate.filter((event: any) => 
        event.clientId && event.clientId.toString() === client.id.toString()
      );
      
      return {
        ...client,
        appointments: clientAppointments
      };
    });
    
    console.log("Clients with appointments:", clientsWithAppointments);
    
    return clientsWithAppointments;
  };
  
  // Function to update the selected date and clients with appointments
  const updateSelectedDateAndClients = (date: Date) => {
    setSelectedDate(date);
    const clientsForDate = getClientsWithAppointmentsForDate(date);
    setClientsWithAppointments(clientsForDate);
    
    // Show message with the number of clients found
    if (clientsForDate.length > 0) {
      const formattedDate = format(date, "PPP", { locale: enUS });
      toast({
        title: `Clients with appointments for ${formattedDate}`,
        description: `Found ${clientsForDate.length} clients with scheduled appointments`,
      });
    }
  };

  // Function to handle client selection from appointment card
  const handleSelectClientWithAppointment = (client: any) => {
    // Set the client in the form
    form.setValue("clientId", client.id.toString());
    
    // Find related events for this client
    const clientEvents = events.filter((event: any) => 
      event.clientId && event.clientId.toString() === client.id.toString()
    );
    
    // If there's a related project, set it
    if (clientEvents.length > 0) {
      const eventWithProject = clientEvents.find((event: any) => event.projectId);
      if (eventWithProject && eventWithProject.projectId) {
        form.setValue("projectId", eventWithProject.projectId.toString());
      }
    }
    
    toast({
      title: "Client Selected",
      description: `${client.firstName} ${client.lastName} has been selected from their appointment`,
    });
    
    // Automatically move to the materials tab
    setActiveTab("materials");
  };

  // Process events and filter clients with appointments for today
  useEffect(() => {
    if (events.length > 0 && clients.length > 0) {
      // If there's a clientId in the URL, find that client
      if (clientIdFromUrl) {
        const selectedClient = clients.find((client: any) => 
          client.id.toString() === clientIdFromUrl
        );
        
        if (selectedClient) {
          // If we find the client, look for related events
          const clientEvents = events.filter((event: any) => 
            event.clientId && event.clientId.toString() === clientIdFromUrl
          );
          
          if (clientEvents.length > 0) {
            // Sort events by date (most recent first)
            clientEvents.sort((a: any, b: any) => 
              new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
            );
            
            // Take the most recent event
            const latestEvent = clientEvents[0];
            
            toast({
              title: "Client with scheduled appointment",
              description: `Information for ${selectedClient.firstName} ${selectedClient.lastName} has been loaded from the calendar`,
            });
            
            // Store the project ID to use in another useEffect
            if (latestEvent.projectId) {
              const relatedProject = projects.find((p: any) => p.id === latestEvent.projectId);
              if (relatedProject) {
                setSelectedProjectFromEvent(relatedProject.id.toString());
              }
            }
          }
        }
      }
      
      // Initially, load clients with appointments for today
      const today = new Date();
      updateSelectedDateAndClients(today);
    }
  }, [events, clients, projects, clientIdFromUrl]);
  
  // Watch values
  const watchServiceType = form.watch("serviceType");
  const watchMaterialType = form.watch("materialType");
  const watchClientId = form.watch("clientId");
  const watchProjectId = form.watch("projectId");
  const watchSquareFeet = form.watch("squareFeet");
  const watchLinearFeet = form.watch("linearFeet");
  const watchUnits = form.watch("units");
  const watchDifficulty = form.watch("difficulty");
  const watchNotes = form.watch("notes");
  const watchAdditionalInfo = form.watch("additionalInfo");
  
  // Filter projects by client
  const filteredProjects = watchClientId
    ? projects.filter((project: any) => project.clientId?.toString() === watchClientId)
    : [];
    
  // Effect to notify when a client is automatically loaded from the URL
  useEffect(() => {
    if (clientIdFromUrl && clients.length > 0) {
      const selectedClient = clients.find((c: any) => c.id.toString() === clientIdFromUrl);
      if (selectedClient) {
        toast({
          title: "Client automatically loaded",
          description: `Client ${selectedClient.firstName} ${selectedClient.lastName} has been selected from the scheduled appointment.`,
        });
      }
    }
  }, [clientIdFromUrl, clients]);
  
  // Effect to set the project when selected from an event
  useEffect(() => {
    if (selectedProjectFromEvent && form) {
      form.setValue("projectId", selectedProjectFromEvent);
      toast({
        title: "Project automatically loaded",
        description: "The project associated with the scheduled appointment has been selected."
      });
    }
  }, [selectedProjectFromEvent, form]);
  
  // Effect to load relevant materials when service type changes
  useEffect(() => {
    if (watchServiceType && Object.prototype.hasOwnProperty.call(MATERIALS_BY_SERVICE, watchServiceType)) {
      // Reset selected materials when service changes
      setSelectedMaterials([]);
      setSelectedOptions([]);
      
      // Include ALL basic materials automatically for this type of service
      const allMaterials = MATERIALS_BY_SERVICE[watchServiceType as keyof typeof MATERIALS_BY_SERVICE] || [];
      const initialMaterials: MaterialInput[] = allMaterials.map((material: any) => ({
        name: material.name,
        quantity: 1,
        unit: material.unit,
        unitPrice: material.unitPrice || 0,
      }));
      
      setSelectedMaterials(initialMaterials);
      
      // Calculate initial total
      const initialTotal = initialMaterials.reduce((sum, mat) => sum + (mat.quantity * mat.unitPrice), 0);
      setTotalAmount(initialTotal);
      
      toast({
        title: "Basic materials included",
        description: `${initialMaterials.length} basic materials have been automatically added for ${getServiceLabel(watchServiceType)}`,
      });
    }
  }, [watchServiceType]);

  // Function to handle form submission
  const onSubmit = (data: any) => {
    console.log("Submitting form to create estimate with data:", data);
    
    // Verify that a client has been selected
    if (!data.clientId) {
      toast({
        title: "Error",
        description: "You must select a client before creating an estimate",
        variant: "destructive",
      });
      return;
    }
    
    // Verify that materials have been selected
    if (selectedMaterials.length === 0) {
      toast({
        title: "Error",
        description: "You must add at least one material to the estimate",
        variant: "destructive",
      });
      return;
    }

    // Calculate totals FIRST before preparing estimate data
    const subtotal = selectedMaterials.reduce((sum, mat) => sum + (mat.quantity * mat.unitPrice), 0);
    const taxRate = parseFloat(data.tax || "0");
    const discountRate = parseFloat(data.discount || "0");
    
    // Calculate tax and discount amounts
    const taxAmount = (subtotal * taxRate) / 100;
    const discountAmount = (subtotal * discountRate) / 100;
    const total = subtotal + taxAmount - discountAmount;
    
    console.log(`Calculated totals: Subtotal: $${subtotal}, Tax: ${taxRate}% ($${taxAmount}), Discount: ${discountRate}% ($${discountAmount}), Total: $${total}`);
    
    // Update the totalAmount state
    setTotalAmount(total);

    // Prepare materials for the estimate
    const items = selectedMaterials.map(material => ({
      description: material.name,
      quantity: material.quantity.toString(),
      unitPrice: material.unitPrice.toString(),
      amount: (material.quantity * material.unitPrice).toString(),
      notes: ""
    }));
    
    // Prepare estimate data with calculated totals
    const estimateData = {
      clientId: Number(data.clientId),
      projectId: data.projectId && data.projectId !== "none" ? Number(data.projectId) : null,
      estimateNumber: generateEstimateNumber(),
      issueDate: new Date(),
      expiryDate: addDays(new Date(), 30),
      status: "draft",
      subtotal: subtotal.toFixed(2),
      tax: taxRate.toFixed(2),
      discount: discountRate.toFixed(2),
      total: total.toFixed(2),
      terms: t("estimateTerms"),
      notes: data.notes || "",
      contractorSignature: user?.firstName + " " + user?.lastName,
      items
    };
    
    console.log("Estimate data to create with calculated totals:", estimateData);
    
    // Send request to create estimate
    createEstimateMutation.mutate(estimateData);
  };

  // Create mutation for estimates
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
  
  // Create mutation for invoices
  const createInvoiceMutation = useMutation({
    mutationFn: async (data: any) => {
      setIsSubmitting(true);
      try {
        // Validate minimum required data
        if (!data.clientId) {
          throw new Error("The client ID is required");
        }
        
        // Validar que items sea un array
        if (!Array.isArray(data.items) || data.items.length === 0) {
          throw new Error("You must include at least one item in the invoice");
        }
        
        console.log("Sending invoice data:", JSON.stringify(data, null, 2));
        
        const res = await apiRequest("POST", "/api/protected/invoices", data);
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Error creating the invoice");
        }
        
        return await res.json();
      } catch (error) {
        console.error("Error en createInvoiceMutation:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      setIsSubmitting(false);
      queryClient.invalidateQueries({ queryKey: ["/api/protected/invoices"] });
      toast({
        title: "Invoice created successfully!",
        description: "The invoice has been generated from the captured data.",
      });
      // Redirect to the newly created invoice
      setLocation(`/invoices/${data.id}`);
    },
    onError: (error: Error) => {
      setIsSubmitting(false);
      console.error("Error en createInvoiceMutation.onError:", error);
      toast({
        title: "Error creating invoice",
        description: error.message || "An unexpected error occurred when creating the invoice",
        variant: "destructive",
      });
    },
  });
  
  // Handler to create estimate from AI analysis
  const handleCreateEstimateFromAnalysis = (analysisResult: AiAnalysisResult) => {
    if (!watchClientId) {
      toast({
        title: "Error",
        description: "You must select a client before creating an estimate",
        variant: "destructive",
      });
      return;
    }
    
    // Prepare estimate items from the analysis
    const items = analysisResult.breakdown.materials.items.map(item => ({
      description: item.name,
      quantity: "1",
      unitPrice: item.estimatedCost.toString(),
      amount: item.estimatedCost.toString(),
      notes: item.notes || ""
    }));
    
    // Agregar ítem de mano de obra
    items.push({
      description: `Mano de obra (${analysisResult.breakdown.labor.estimatedHours} horas)`,
      quantity: "1",
      unitPrice: analysisResult.breakdown.labor.total.toString(),
      amount: analysisResult.breakdown.labor.total.toString(),
      notes: analysisResult.breakdown.labor.notes || ""
    });
    
    // Get selected client
    const selectedClient = clients.find((c: any) => c.id.toString() === watchClientId);
    
    // Prepare estimate data
    const estimateData = {
      clientId: Number(watchClientId),
      projectId: watchProjectId && watchProjectId !== "none" ? Number(watchProjectId) : null,
      estimateNumber: generateEstimateNumber(),
      issueDate: new Date(),
      expiryDate: addDays(new Date(), 30),
      status: "draft",
      subtotal: analysisResult.recommendedTotal.toString(),
      tax: "0",
      discount: "0",
      total: analysisResult.recommendedTotal.toString(),
      terms: t("estimateTerms"),
      notes: analysisResult.summary,
      contractorSignature: user?.firstName + " " + user?.lastName,
      items
    };
    
    // Send request to create estimate
    createEstimateMutation.mutate(estimateData);
  };
  
  // Handler to create invoice from AI analysis
  const handleCreateInvoiceFromAnalysis = (analysisResult: AiAnalysisResult) => {
    if (!watchClientId) {
      toast({
        title: "Error",
        description: "You must select a client before creating an invoice",
        variant: "destructive",
      });
      return;
    }
    
    // Prepare invoice items from the analysis
    const items = analysisResult.breakdown.materials.items.map(item => ({
      description: item.name,
      quantity: "1",
      unitPrice: item.estimatedCost.toString(),
      amount: item.estimatedCost.toString(),
      notes: item.notes || ""
    }));
    
    // Agregar ítem de mano de obra
    items.push({
      description: `Mano de obra (${analysisResult.breakdown.labor.estimatedHours} horas)`,
      quantity: "1",
      unitPrice: analysisResult.breakdown.labor.total.toString(),
      amount: analysisResult.breakdown.labor.total.toString(),
      notes: analysisResult.breakdown.labor.notes || ""
    });
    
    // Get selected client
    const selectedClient = clients.find((c: any) => c.id.toString() === watchClientId);
    
    // Prepare invoice data
    const invoiceData = {
      clientId: Number(watchClientId),
      projectId: watchProjectId && watchProjectId !== "none" ? Number(watchProjectId) : null,
      invoiceNumber: generateInvoiceNumber(),
      issueDate: new Date(),
      dueDate: addDays(new Date(), 15),
      status: "pending",
      subtotal: analysisResult.recommendedTotal.toString(),
      tax: "0",
      discount: "0",
      total: analysisResult.recommendedTotal.toString(),
      notes: analysisResult.summary,
      paymentTerms: t("invoicePaymentTerms"),
      items
    };
    
    // Send request to create invoice
    createInvoiceMutation.mutate(invoiceData);
  };
  
  // The helper functions addDays, generateEstimateNumber and generateInvoiceNumber
  // are already defined at the beginning of the component, so they are omitted here.
  
  // Functions for measurement tools
  const handleMeasurementsChange = (newMeasurements: any[]) => {
    setMeasurements(newMeasurements);
    
    // If there are measurements in square feet or linear feet, update the form
    const squareFeetMeasurement = newMeasurements.find(m => m.type === "area");
    const linearFeetMeasurement = newMeasurements.find(m => m.type === "linear");
    
    if (squareFeetMeasurement) {
      form.setValue("squareFeet", squareFeetMeasurement.value.toString());
    }
    
    if (linearFeetMeasurement) {
      form.setValue("linearFeet", linearFeetMeasurement.value.toString());
    }
    
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
  
  // Functions for managing materials
  const handleAddMaterial = () => {
    if (!watchMaterialType) {
      toast({
        title: "Select a material",
        description: "You must select a material type to add it.",
        variant: "destructive",
      });
      return;
    }
    
    if (!watchServiceType || !Object.prototype.hasOwnProperty.call(MATERIALS_BY_SERVICE, watchServiceType)) {
      toast({
        title: "Error",
        description: "Select a valid service type.",
        variant: "destructive",
      });
      return;
    }
    
    const materials = MATERIALS_BY_SERVICE[watchServiceType as keyof typeof MATERIALS_BY_SERVICE];
    const materialInfo = materials.find((m: any) => m.id === watchMaterialType);
    
    if (!materialInfo) return;
    
    const newMaterial: MaterialInput = {
      name: materialInfo.name,
      quantity: 1,
      unit: materialInfo.unit,
      unitPrice: materialInfo.unitPrice || 0,
    };
    
    setSelectedMaterials(prev => [...prev, newMaterial]);
  };
  
  const handleRemoveMaterial = (index: number, e?: React.MouseEvent) => {
    // Prevent the event from propagating and causing a form submission
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Actualizar los materiales seleccionados eliminando el que está en el índice especificado
    setSelectedMaterials(prev => {
      const newMaterials = prev.filter((_, i) => i !== index);
      
      // Update total after removing material
      const newTotal = newMaterials.reduce((sum, mat) => sum + (mat.quantity * mat.unitPrice), 0);
      setTotalAmount(newTotal);
      
      return newMaterials;
    });
    
    // Notify the user that the material has been removed
    toast({
      title: "Material removed",
      description: "The material has been removed from the estimate",
    });
  };
  
  const handleUpdateMaterialQuantity = (index: number, newQuantity: number) => {
    setSelectedMaterials(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity: newQuantity };
      return updated;
    });
  };
  
  // Properties for AI analysis panel
  const aiAnalysisProps = {
    serviceType: watchServiceType,
    materials: selectedMaterials,
    propertySize: {
      squareFeet: watchSquareFeet ? parseFloat(watchSquareFeet) : undefined,
      linearFeet: watchLinearFeet ? parseFloat(watchLinearFeet) : undefined,
      units: watchUnits ? parseFloat(watchUnits) : undefined,
    },
    difficulty: watchDifficulty as "easy" | "medium" | "complex",
    additionalInfo: watchAdditionalInfo,
    onCreateEstimate: handleCreateEstimateFromAnalysis,
    onCreateInvoice: handleCreateInvoiceFromAnalysis,
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader 
        title="Advanced Vendor Form" 
        description="Capture data during appointments and convert them into estimates or invoices with AI assistance"
      />
      
      <div className="flex items-center justify-between">
        <div className="space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setLocation('/')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setLocation('/estimates')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Estimates
          </Button>
        </div>
      </div>
      
      <Form {...form}>
        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)} id="vendor-estimate-form">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="information">Basic Information</TabsTrigger>
              <TabsTrigger value="materials">Materials & Measurements</TabsTrigger>
              <TabsTrigger value="analysis">Analysis & Creation</TabsTrigger>
            </TabsList>
            
            {/* TAB: Basic Information */}
            <TabsContent value="information" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Client and Service</CardTitle>
                  <CardDescription>
                    Select the client and service type for this job
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Today's Estimate Appointments Section */}
                  <div className="mb-6 border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-blue-900">Today's Estimate Appointments</h3>
                        <p className="text-sm text-blue-700">Select a client directly from their scheduled appointment</p>
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            className="ml-auto h-8 w-auto gap-1 border-blue-300 text-blue-700 hover:bg-blue-100"
                          >
                            <CalendarIcon className="h-3.5 w-3.5" />
                            <span>{format(selectedDate, "PPP", { locale: enUS })}</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => {
                              if (date) {
                                updateSelectedDateAndClients(date);
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs font-normal gap-1 py-0 h-6">
                        <span className="text-primary">•</span>
                        {clientsWithAppointments.length === 0 
                          ? "No clients with appointments for this date" 
                          : `${clientsWithAppointments.length} client(s) with scheduled appointments`}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Show clients with appointments as clickable cards */}
                  {clientsWithAppointments.length > 0 && (
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
                      <div className="text-xs text-muted-foreground mt-1">
                        Click on a client to automatically load their data
                      </div>
                    </div>
                  )}
                  
                  {/* Client */}
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
                            {/* Show first the clients with scheduled appointments for the selected date */}
                            {clientsWithAppointments.length > 0 && (
                              <>
                                <div className="px-2 py-1.5 text-sm font-medium text-primary">
                                  Clients with appointments on {format(selectedDate, "PP", { locale: enUS })}
                                </div>
                                {clientsWithAppointments.map((client: any) => (
                                  <SelectItem key={`appointment-${client.id}`} value={client.id.toString()}>
                                    <div className="flex items-center">
                                      <span className="mr-2">📅</span>
                                      <span>{client.firstName} {client.lastName}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                                <Separator className="my-1" />
                                <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                                  All clients
                                </div>
                              </>
                            )}
                            {/* Filter to avoid showing duplicate clients with appointments */}
                            {clients
                              .filter((client: any) => 
                                !clientsWithAppointments.some((c: any) => c.id === client.id)
                              )
                              .map((client: any) => (
                                <SelectItem key={client.id} value={client.id.toString()}>
                                  {client.firstName} {client.lastName}
                                </SelectItem>
                              ))
                            }
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The client for whom this work will be performed
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
                                {project.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Associate this work with an existing project (optional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="serviceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Type*</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select service type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SERVICE_TYPES.map((service) => (
                              <SelectItem key={service.value} value={service.value}>
                                {service.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The type of service to be provided
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="difficulty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Difficulty</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select difficulty level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="easy">Easy (flat terrain, simple access)</SelectItem>
                            <SelectItem value="medium">Medium (some complexity)</SelectItem>
                            <SelectItem value="complex">Complex (difficult terrain, access issues)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The difficulty will affect cost analysis and estimates
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="additionalInfo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Información Adicional</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Incluya cualquier detalle adicional que pueda afectar el trabajo..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Detalles como condiciones del sitio, requisitos especiales, etc.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button
                    type="button"
                    onClick={() => setActiveTab("materials")}
                  >
                    Next: Materials & Measurements
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* TAB: Materials & Measurements */}
            <TabsContent value="materials" className="space-y-6 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Column 1: Materials */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Materials</CardTitle>
                    <CardDescription>
                      Add the necessary materials for this job
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {watchServiceType && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          <FormField
                            control={form.control}
                            name="materialType"
                            render={({ field }) => (
                              <FormItem className="w-full">
                                <div className="flex space-x-2">
                                  <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="w-[300px]">
                                        <SelectValue placeholder="Select material" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {watchServiceType && Object.prototype.hasOwnProperty.call(MATERIALS_BY_SERVICE, watchServiceType) 
                                       ? MATERIALS_BY_SERVICE[watchServiceType as keyof typeof MATERIALS_BY_SERVICE].map((material: any) => (
                                        <SelectItem key={material.id} value={material.id}>
                                          {material.name}
                                        </SelectItem>
                                      ))
                                      : null
                                      }
                                    </SelectContent>
                                  </Select>
                                  <Button type="button" onClick={handleAddMaterial}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Agregar
                                  </Button>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                      
                      {selectedMaterials.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Material</TableHead>
                              <TableHead>Cantidad</TableHead>
                              <TableHead>Unit</TableHead>
                              <TableHead>Precio unitario</TableHead>
                              <TableHead>Total</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedMaterials.map((material, index) => (
                              <TableRow key={index}>
                                <TableCell>{material.name}</TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="1"
                                    className="w-16"
                                    value={material.quantity}
                                    onChange={(e) => handleUpdateMaterialQuantity(index, parseInt(e.target.value) || 1)}
                                  />
                                </TableCell>
                                <TableCell>{material.unit}</TableCell>
                                <TableCell>${material.unitPrice.toFixed(2)}</TableCell>
                                <TableCell>${(material.quantity * material.unitPrice).toFixed(2)}</TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    type="button" 
                                    onClick={(e) => handleRemoveMaterial(index, e)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-center p-4 border border-dashed rounded-md">
                          <p className="text-muted-foreground">
                            No materials selected. Select a service type and add materials.
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Columna 2: Herramientas de Medición */}
                <Card>
                  <CardHeader>
                    <CardTitle>Medidas</CardTitle>
                    <CardDescription>
                      Registre las dimensiones de la propiedad
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="squareFeet"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pies cuadrados</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="0"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="linearFeet"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pies lineales</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="0"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="units"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Units</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="0"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Separator className="my-4" />
                    
                    <div className="flex flex-col space-y-2">
                      <h3 className="text-sm font-medium">Herramientas de medición</h3>
                      
                      <Dialog open={isDigitalMeasurementOpen} onOpenChange={setIsDigitalMeasurementOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full">
                            <Ruler className="h-4 w-4 mr-2" />
                            Medición Digital
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                          <DialogTitle>Herramienta de Medición Digital</DialogTitle>
                          <div className="flex-1 overflow-hidden">
                            <DigitalMeasurement 
                              onMeasurementsChange={handleMeasurementsChange}
                              initialMeasurements={measurements}
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Dialog open={isLidarScannerOpen} onOpenChange={setIsLidarScannerOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full">
                            <Scan className="h-4 w-4 mr-2" />
                            Escáner LiDAR
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl h-[80vh]">
                          <DialogTitle>Escáner LiDAR</DialogTitle>
                          <div className="h-full">
                            <LiDARScanner onScanComplete={handleScanComplete} />
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="md:col-span-3">
                  <CardHeader>
                    <CardTitle>Job Notes</CardTitle>
                    <CardDescription>
                      Record important observations about this job
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              placeholder="Notes and observations about the job..."
                              className="min-h-[150px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Include important details, client preferences, etc.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button
                      type="button"
                      onClick={() => setActiveTab("analysis")}
                      disabled={selectedMaterials.length === 0}
                    >
                      {selectedMaterials.length === 0 
                        ? "Add at least one material" 
                        : "Next: Analysis & Creation"}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>
            
            {/* TAB: Analysis & Creation */}
            <TabsContent value="analysis" className="space-y-6 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Resumen de Datos Capturados</CardTitle>
                      <CardDescription>
                        Review the entered data before continuing
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-semibold">Client:</h3>
                          <p>
                            {watchClientId 
                              ? clients.find((c: any) => c.id.toString() === watchClientId)?.firstName + ' ' + 
                                clients.find((c: any) => c.id.toString() === watchClientId)?.lastName
                              : "Not selected"}
                          </p>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-semibold">Service type:</h3>
                          <p>{getServiceLabel(watchServiceType) || "Not selected"}</p>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-semibold">Project:</h3>
                          <p>
                            {watchProjectId && watchProjectId !== "none"
                              ? projects.find((p: any) => p.id.toString() === watchProjectId)?.title
                              : "New project"}
                          </p>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-semibold">Difficulty:</h3>
                          <p>
                            {watchDifficulty === "easy" ? "Easy" :
                             watchDifficulty === "medium" ? "Medium" :
                             watchDifficulty === "complex" ? "Complex" : "Not specified"}
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-semibold">Medidas:</h3>
                        <div className="grid grid-cols-3 gap-2 mt-1">
                          {watchSquareFeet && (
                            <Badge variant="outline">{watchSquareFeet} pies²</Badge>
                          )}
                          {watchLinearFeet && (
                            <Badge variant="outline">{watchLinearFeet} pies lineales</Badge>
                          )}
                          {watchUnits && (
                            <Badge variant="outline">{watchUnits} unites</Badge>
                          )}
                        </div>
                      </div>
                      
                      <Accordion type="single" collapsible>
                        <AccordionItem value="materials">
                          <AccordionTrigger>
                            Materials ({selectedMaterials.length})
                          </AccordionTrigger>
                          <AccordionContent>
                            <ul className="space-y-1">
                              {selectedMaterials.map((mat, i) => (
                                <li key={i} className="text-sm">
                                  {mat.quantity} {mat.unit} de {mat.name} - ${(mat.quantity * mat.unitPrice).toFixed(2)}
                                </li>
                              ))}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </CardContent>
                  </Card>
                </div>
                
                <div>
                  <AiAnalysisPanel {...aiAnalysisProps} />
                </div>
              </div>
              
              {/* Form submission button */}
              <div className="flex justify-center mt-8">
                <Button 
                  type="submit" 
                  size="lg"
                  className="w-full max-w-md"
                  disabled={isSubmitting}
                  onClick={() => {
                    // Force it to change to the basic information tab if no client is selected
                    if (!watchClientId) {
                      setActiveTab("information");
                      toast({
                        title: "Attention",
                        description: "You must select a client first",
                      });
                      return;
                    }
                    
                    // Make sure the form is submitted correctly
                    console.log("Clicking on Create Estimate from Form");
                    if (selectedMaterials.length === 0) {
                      toast({
                        title: "Attention",
                        description: "You must add at least one material",
                      });
                      return;
                    }
                    
                    // We don't need to call onSubmit here, since the button is of type submit
                    // and the form already has the onSubmit handler associated with it
                  }}
                >
                  <Save className="mr-2 h-5 w-5" />
                  {isSubmitting ? "Creating estimate..." : "Create Estimate from Form"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </form>
      </Form>
    </div>
  );
}