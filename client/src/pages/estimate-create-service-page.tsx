import React, { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// UI Components
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, ArrowLeft, Save, Trash, Plus, Minus, Loader2 } from "lucide-react";

// Custom components
import { ServiceItemSelector } from "@/components/estimates/service-item-selector";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useClients } from "@/hooks/use-clients";
import { useEstimates } from "@/hooks/use-estimates";

// Service data and utilities
import { 
  SERVICE_TYPES, 
  MATERIALS_BY_SERVICE, 
  OPTIONS_BY_SERVICE,
  SERVICE_INFO,
  getServiceLabel,
  getMaterial,
  getOption
} from "@/lib/service-options";

// Definición del esquema de validación para el formulario
const estimateFormSchema = z.object({
  clientId: z.coerce.number().positive("Please select a client"),
  projectId: z.coerce.number().optional(),
  estimateNumber: z.string().optional(),
  issueDate: z.date(),
  expiryDate: z.date().optional(),
  status: z.string().default("pending"),
  subtotal: z.coerce.number().min(0).default(0),
  tax: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).default(0),
  total: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
  terms: z.string().optional(),
  serviceType: z.string().min(1, "Please select a service type")
});

type EstimateFormValues = z.infer<typeof estimateFormSchema>;

// Interfaz para ítems seleccionados
interface SelectedItem {
  id: string;
  service: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  type: 'material' | 'option';
}

export default function EstimateCreateServicePage() {
  const [location, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const clientIdParam = params.get("clientId") ? Number(params.get("clientId")) : undefined;
  const projectIdParam = params.get("projectId") ? Number(params.get("projectId")) : undefined;
  
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Estados locales
  const [activeTab, setActiveTab] = useState("client");
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [selectedServiceType, setSelectedServiceType] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);

  // Hooks para datos
  const clientsData = useClients();
  const clients = clientsData.clients || [];
  const { createEstimateMutation } = useEstimates();
  
  // Formulario con react-hook-form y zod
  const form = useForm<EstimateFormValues>({
    resolver: zodResolver(estimateFormSchema),
    defaultValues: {
      clientId: clientIdParam || 0,
      projectId: projectIdParam || 0,
      issueDate: new Date(),
      expiryDate: new Date(new Date().setDate(new Date().getDate() + 30)), // 30 días después
      status: "pending",
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0,
      notes: "",
      terms: "Standard terms and conditions apply.",
      serviceType: ""
    }
  });

  // Efectos para actualizar el estado inicial
  useEffect(() => {
    if (clientIdParam && clients.length > 0) {
      const selectedClient = clients.find((client: any) => client.id === clientIdParam);
      if (selectedClient) {
        form.setValue("clientId", clientIdParam);
      }
    }
    setIsLoading(false);
  }, [clientIdParam, clients, form]);

  // Manejar cambio de tipo de servicio
  const handleServiceTypeChange = (value: string) => {
    setSelectedServiceType(value);
    form.setValue("serviceType", value);
    
    // Reiniciar items seleccionados al cambiar el tipo de servicio
    setSelectedItems([]);
    recalculateTotal([]);
  };

  // Manejar adición de un material al estimado
  const addMaterial = (materialId: string) => {
    const material = getMaterial(selectedServiceType, materialId);
    if (!material) return;
    
    // Verificar si ya existe
    const existingIndex = selectedItems.findIndex(item => 
      item.id === material.id && item.type === 'material'
    );
    
    let updatedItems = [...selectedItems];
    
    if (existingIndex >= 0) {
      // Actualizar cantidad si ya existe
      updatedItems[existingIndex] = {
        ...updatedItems[existingIndex],
        quantity: updatedItems[existingIndex].quantity + 1,
        total: (updatedItems[existingIndex].quantity + 1) * updatedItems[existingIndex].unitPrice
      };
    } else {
      // Agregar nuevo ítem
      updatedItems.push({
        id: material.id,
        service: selectedServiceType,
        name: material.name,
        description: `${getServiceLabel(selectedServiceType)} - ${material.name}`,
        quantity: 1,
        unit: material.unit,
        unitPrice: material.unitPrice,
        total: material.unitPrice,
        type: 'material'
      });
    }
    
    setSelectedItems(updatedItems);
    recalculateTotal(updatedItems);
  };

  // Manejar adición de una opción al estimado
  const addOption = (optionId: string) => {
    const option = getOption(selectedServiceType, optionId);
    if (!option) return;
    
    // Verificar si ya existe
    const existingIndex = selectedItems.findIndex(item => 
      item.id === option.id && item.type === 'option'
    );
    
    let updatedItems = [...selectedItems];
    
    if (existingIndex >= 0) {
      // Actualizar cantidad si ya existe
      updatedItems[existingIndex] = {
        ...updatedItems[existingIndex],
        quantity: updatedItems[existingIndex].quantity + 1,
        total: (updatedItems[existingIndex].quantity + 1) * updatedItems[existingIndex].unitPrice
      };
    } else {
      // Agregar nuevo ítem
      updatedItems.push({
        id: option.id,
        service: selectedServiceType,
        name: option.name,
        description: `Additional - ${option.name}`,
        quantity: 1,
        unit: option.unit,
        unitPrice: option.unitPrice,
        total: option.unitPrice,
        type: 'option'
      });
    }
    
    setSelectedItems(updatedItems);
    recalculateTotal(updatedItems);
  };

  // Eliminar un ítem del estimado
  const removeItem = (index: number) => {
    const updatedItems = [...selectedItems];
    updatedItems.splice(index, 1);
    setSelectedItems(updatedItems);
    recalculateTotal(updatedItems);
  };

  // Actualizar cantidad de un ítem
  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) return;
    
    const updatedItems = [...selectedItems];
    updatedItems[index] = {
      ...updatedItems[index],
      quantity,
      total: quantity * updatedItems[index].unitPrice
    };
    
    setSelectedItems(updatedItems);
    recalculateTotal(updatedItems);
  };

  // Calcular el total del estimado
  const recalculateTotal = (items: SelectedItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    
    // Actualizar valores en el formulario
    form.setValue("subtotal", subtotal);
    
    const taxRate = form.getValues("tax") || 0;
    const discountAmount = form.getValues("discount") || 0;
    
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount - discountAmount;
    
    form.setValue("total", total);
    setTotalAmount(total);
  };

  // Actualizar totales cuando cambian impuestos o descuentos
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "tax" || name === "discount") {
        recalculateTotal(selectedItems);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, selectedItems]);

  // Manejar envío del formulario
  const onSubmit = async (data: EstimateFormValues) => {
    if (selectedItems.length === 0) {
      toast({
        title: "Cannot create estimate",
        description: "Please add at least one item to the estimate",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Crear el número de estimate si no existe
      if (!data.estimateNumber) {
        const today = new Date();
        const year = today.getFullYear();
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 900) + 100; // Número aleatorio de 3 dígitos
        data.estimateNumber = `EST-${year}${month}-${random}`;
      }
      
      // Preparar datos del estimado
      const estimateData = {
        ...data,
        // Si el proyecto es 0, enviar null para evitar error de clave foránea
        projectId: data.projectId === 0 ? null : data.projectId,
        // Convertir valores numéricos a strings para el API
        subtotal: data.subtotal.toString(),
        tax: data.tax.toString(),
        discount: data.discount.toString(),
        total: data.total.toString(),
        // Convertir items seleccionados al formato esperado por la API
        items: selectedItems.map(item => ({
          service: item.service,
          description: item.description || item.name,
          quantity: item.quantity.toString(),
          unitPrice: item.unitPrice.toString(),
          amount: item.total.toString(),
          notes: `${getServiceLabel(item.service)} - ${item.type === 'material' ? 'Material' : 'Option'}`
        }))
      };
      
      // Crear estimado
      await createEstimateMutation.mutateAsync(estimateData, {
        onSuccess: (newEstimate) => {
          toast({
            title: "Estimate Created",
            description: `Estimate ${newEstimate.estimateNumber} has been successfully created.`,
          });
          
          // Redirigir a la página de detalles del estimado
          setLocation(`/estimates/${newEstimate.id}`);
        },
        onError: (error) => {
          console.error("Error creating estimate:", error);
          toast({
            title: "Error Creating Estimate",
            description: "There was an error creating the estimate. Please try again.",
            variant: "destructive",
          });
        }
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: "There was an error creating the estimate",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Create New Estimate</h1>
        <div className="space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setLocation('/')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setLocation('/estimates')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Estimates
          </Button>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="client">Client Information</TabsTrigger>
              <TabsTrigger value="service">Service Selection</TabsTrigger>
              <TabsTrigger value="details">Estimate Details</TabsTrigger>
            </TabsList>
            
            {/* TAB: Client Information */}
            <TabsContent value="client" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Client Information</CardTitle>
                  <CardDescription>
                    Select a client for this estimate
                  </CardDescription>
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
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a client" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clients.map((client) => (
                              <SelectItem 
                                key={client.id} 
                                value={client.id.toString()}
                              >
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
                    name="projectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project (Optional)</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a project (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="0">No Project</SelectItem>
                            {/* Aquí podríamos cargar los proyectos del cliente cuando selecciona uno */}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => setLocation('/estimates')}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setActiveTab("service")}
                  >
                    Next
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* TAB: Service Selection */}
            <TabsContent value="service" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Multi Services</CardTitle>
                  <CardDescription>
                    Select the services you want to include in this estimate
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="serviceType"
                    render={() => (
                      <FormItem>
                        <ServiceItemSelector 
                          value={selectedServiceType} 
                          onChange={handleServiceTypeChange}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {selectedServiceType && (
                    <div className="space-y-6 mt-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Available Materials</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {MATERIALS_BY_SERVICE[selectedServiceType as keyof typeof MATERIALS_BY_SERVICE]?.map((material) => (
                            <Card key={material.id} className="overflow-hidden">
                              <CardContent className="p-3">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <h4 className="font-medium">{material.name}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      ${material.unitPrice.toFixed(2)}/{material.unit}
                                    </p>
                                  </div>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => addMaterial(material.id)}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Additional Options</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {OPTIONS_BY_SERVICE[selectedServiceType as keyof typeof OPTIONS_BY_SERVICE]?.map((option) => (
                            <Card key={option.id} className="overflow-hidden">
                              <CardContent className="p-3">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <h4 className="font-medium">{option.name}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      ${option.unitPrice.toFixed(2)}/{option.unit}
                                    </p>
                                  </div>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => addOption(option.id)}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Selected Items</h3>
                        {selectedItems.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground border rounded-md">
                            No items selected. Add materials or options from above.
                          </div>
                        ) : (
                          <Card>
                            <CardContent className="p-0">
                              <table className="w-full">
                                <thead className="bg-muted/50">
                                  <tr>
                                    <th className="text-left p-3">Item</th>
                                    <th className="text-center p-3">Type</th>
                                    <th className="text-center p-3">Quantity</th>
                                    <th className="text-right p-3">Unit Price</th>
                                    <th className="text-right p-3">Total</th>
                                    <th className="text-center p-3">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {selectedItems.map((item, index) => (
                                    <tr key={`${item.id}-${item.type}-${index}`} className="border-t border-border">
                                      <td className="p-3">
                                        <div>
                                          <div className="font-medium">{item.name}</div>
                                          <div className="text-sm text-muted-foreground">
                                            {getServiceLabel(item.service)}
                                          </div>
                                        </div>
                                      </td>
                                      <td className="p-3 text-center">
                                        <span className="px-2 py-1 rounded-full text-xs bg-primary/10">
                                          {item.type === 'material' ? 'Material' : 'Option'}
                                        </span>
                                      </td>
                                      <td className="p-3 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                          <Button 
                                            size="icon" 
                                            variant="outline" 
                                            className="h-7 w-7" 
                                            onClick={() => updateItemQuantity(index, item.quantity - 1)}
                                            disabled={item.quantity <= 1}
                                          >
                                            <Minus className="h-3 w-3" />
                                          </Button>
                                          <span className="w-8 text-center">{item.quantity}</span>
                                          <Button 
                                            size="icon" 
                                            variant="outline" 
                                            className="h-7 w-7" 
                                            onClick={() => updateItemQuantity(index, item.quantity + 1)}
                                          >
                                            <Plus className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </td>
                                      <td className="p-3 text-right">
                                        ${item.unitPrice.toFixed(2)}/{item.unit}
                                      </td>
                                      <td className="p-3 text-right font-medium">
                                        ${item.total.toFixed(2)}
                                      </td>
                                      <td className="p-3 text-center">
                                        <Button 
                                          size="icon" 
                                          variant="ghost" 
                                          className="h-8 w-8 text-destructive hover:text-destructive/90" 
                                          onClick={() => removeItem(index)}
                                        >
                                          <Trash className="h-4 w-4" />
                                        </Button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot className="bg-muted/20">
                                  <tr>
                                    <td colSpan={4} className="p-3 text-right font-medium">
                                      Subtotal:
                                    </td>
                                    <td className="p-3 text-right font-medium">
                                      ${form.getValues("subtotal").toFixed(2)}
                                    </td>
                                    <td></td>
                                  </tr>
                                </tfoot>
                              </table>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setActiveTab("client")}
                  >
                    Previous
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setActiveTab("details")}
                    disabled={selectedItems.length === 0}
                  >
                    Next
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* TAB: Estimate Details */}
            <TabsContent value="details" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Estimate Details</CardTitle>
                  <CardDescription>
                    Set the final details for this estimate
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="estimateNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estimate Number</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Will be generated automatically"
                              disabled 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="sent">Sent</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="issueDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Issue Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={
                                    "w-full pl-3 text-left font-normal flex justify-between"
                                  }
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="h-4 w-4" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="expiryDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Expiry Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={
                                    "w-full pl-3 text-left font-normal flex justify-between"
                                  }
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="h-4 w-4" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="tax"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax Rate (%)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              {...field}
                              onChange={(e) => {
                                field.onChange(parseFloat(e.target.value) || 0);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="discount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Discount Amount</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              {...field}
                              onChange={(e) => {
                                field.onChange(parseFloat(e.target.value) || 0);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="total"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Amount</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              value={`$${field.value.toFixed(2)}`}
                              disabled
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field}
                            placeholder="Add any additional notes here..."
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="terms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Terms & Conditions</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field}
                            placeholder="Add terms and conditions here..."
                            rows={3}
                          />
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
                    onClick={() => setActiveTab("service")}
                  >
                    Previous
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || selectedItems.length === 0}
                    className="min-w-[140px]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Create Estimate
                      </>
                    )}
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