import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus, Trash2, Loader2, Save, Edit, Tool } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEstimates } from "@/hooks/use-estimates";
import { useClients } from "@/hooks/use-clients";
import { useProjects } from "@/hooks/use-projects";
import { formatCurrency } from "@/lib/utils";
import { 
  SERVICE_TYPES, 
  MATERIALS_BY_SERVICE, 
  SERVICE_INFO, 
  LABOR_RATES_BY_SERVICE,
  getMaterial,
  getServiceLabel
} from "@/lib/service-options";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

// Validation schema for the form
const estimateFormSchema = z.object({
  clientId: z.coerce.number().min(1, "Client is required"),
  projectId: z.coerce.number().optional().nullable(), // El proyecto es completamente opcional
  estimateNumber: z.string().optional(),
  issueDate: z.date(),
  expiryDate: z.date().optional(),
  terms: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().optional(),
  // Changed monetary field types to string for backend compatibility
  subtotal: z.string().or(z.number().transform(val => String(val))),
  tax: z.string().or(z.number().transform(val => String(val))),
  discount: z.string().or(z.number().transform(val => String(val))),
  total: z.string().or(z.number().transform(val => String(val))),
});

type EstimateFormValues = z.infer<typeof estimateFormSchema>;

// Schema for estimate items
const estimateItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  // Convert monetary values to string for backend compatibility
  unitPrice: z.string().or(z.number().transform(val => String(val))),
  amount: z.string().or(z.number().transform(val => String(val))),
  notes: z.string().optional(),
});

type EstimateItemValues = z.infer<typeof estimateItemSchema>;

export interface EstimateFormProps {
  clientId?: number;
  projectId?: number;
  onSuccess?: (estimate: any) => void;
  onCancel?: () => void;
  estimateId?: number; // ID of the estimate to edit
}

export default function EstimateForm({ clientId, projectId, estimateId, onSuccess, onCancel }: EstimateFormProps) {
  const [items, setItems] = useState<EstimateItemValues[]>([]);
  const [newItem, setNewItem] = useState<EstimateItemValues>({
    description: "",
    quantity: 1,
    unitPrice: "0",
    amount: "0",
    notes: "",
  });
  
  // Track whether this is a material or labor item
  const [itemType, setItemType] = useState<"material" | "labor" | "other">("material");
  const [selectedService, setSelectedService] = useState<string>("");
  const [selectedMaterial, setSelectedMaterial] = useState<string>("");
  
  const { toast } = useToast();
  const { createEstimateMutation, updateEstimateMutation, getEstimate } = useEstimates();
  const { clients = [], isLoadingClients } = useClients();
  const { projects = [], isLoadingProjects } = useProjects();
  
  // Estado para indicar si es edición o creación
  const [isEditing, setIsEditing] = useState(!!estimateId);
  const [isLoading, setIsLoading] = useState(!!estimateId);
  
  // Main estimate form
  const form = useForm<EstimateFormValues>({
    resolver: zodResolver(estimateFormSchema),
    defaultValues: {
      clientId: clientId || 0,
      projectId: projectId || 0,
      issueDate: new Date(),
      status: "pending", // Default status
      subtotal: "0", // Converted to string for backend compatibility
      tax: "0",      // Converted to string for backend compatibility
      discount: "0", // Converted to string for backend compatibility
      total: "0",    // Converted to string for backend compatibility
    }
  });
  
  // Update the item amount when quantity or unit price changes
  const handleItemChange = (field: keyof EstimateItemValues, value: string | number) => {
    const updatedItem = { ...newItem, [field]: value };
    
    // Recalculate the amount if quantity or unit price changes
    if (field === 'quantity' || field === 'unitPrice') {
      const quantity = Number(updatedItem.quantity);
      const unitPrice = Number(updatedItem.unitPrice);
      
      // Ensure they are valid numbers
      if (!isNaN(quantity) && !isNaN(unitPrice)) {
        // Calcular monto con precisión de 2 decimales
        const amount = quantity * unitPrice;
        const roundedAmount = parseFloat(amount.toFixed(2));
        updatedItem.amount = roundedAmount.toString();
      } else {
        updatedItem.amount = "0";
      }
    }
    
    setNewItem(updatedItem);
  };
  
  // Add item to the list
  const handleAddItem = () => {
    // Validate the item before adding it
    try {
      // Asegurarse de que los valores numéricos sean correctos
      const quantity = Number(newItem.quantity) || 1;
      const unitPrice = Number(newItem.unitPrice) || 0;
      
      // Calcular el monto con precisión de 2 decimales
      const amount = quantity * unitPrice;
      const roundedAmount = parseFloat(amount.toFixed(2));
      
      const itemToValidate = {
        ...newItem,
        quantity: quantity,
        unitPrice: unitPrice.toString(),
        amount: roundedAmount.toString()
      };
      
      const validatedItem = estimateItemSchema.parse(itemToValidate);
      const updatedItems = [...items, validatedItem];
      setItems(updatedItems);
      
      // Clear the form for a new item
      setNewItem({
        description: "",
        quantity: 1,
        unitPrice: "0",
        amount: "0",
        notes: "",
      });
      
      // Recalculate totals
      recalculateTotals(updatedItems);
      
      console.log("Item added:", validatedItem);
      console.log("Current items:", updatedItems);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => `${err.path}: ${err.message}`).join(", ");
        toast({
          title: "Error adding item",
          description: errorMessages,
          variant: "destructive",
        });
      }
    }
  };
  
  // Remove item from the list
  const handleRemoveItem = (index: number) => {
    const updatedItems = [...items];
    updatedItems.splice(index, 1);
    setItems(updatedItems);
    
    // Recalculate totals
    recalculateTotals(updatedItems);
  };
  
  // Recalculate subtotal, taxes and total
  const recalculateTotals = (currentItems: EstimateItemValues[]) => {
    // Calculate subtotal by summing all item amounts
    const subtotal = currentItems.reduce((sum, item) => sum + Number(item.amount), 0);
    
    // Get tax and discount percentages from the form
    const tax = Number(form.getValues("tax") || "0");
    const discount = Number(form.getValues("discount") || "0");
    
    // Calcular montos de impuesto y descuento
    const taxAmount = (subtotal * tax) / 100;
    const discountAmount = (subtotal * discount) / 100;
    
    // Calcular total: subtotal + impuestos - descuento
    const total = subtotal + taxAmount - discountAmount;
    
    // Ensure we use precise numeric values before converting to string
    const subtotalRounded = parseFloat(subtotal.toFixed(2));
    const totalRounded = parseFloat(total.toFixed(2));
    
    // Update values in the form
    form.setValue("subtotal", subtotalRounded.toString(), { shouldValidate: true });
    form.setValue("total", totalRounded.toString(), { shouldValidate: true });
    
    console.log(`Subtotal: ${subtotalRounded}, Tax: ${tax}%, TaxAmount: ${taxAmount.toFixed(2)}, Discount: ${discount}%, DiscountAmount: ${discountAmount.toFixed(2)}, Total: ${totalRounded}`);
  };
  
  // Actualizar totales cuando cambian los impuestos o descuentos
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'tax' || name === 'discount') {
        recalculateTotals(items);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, items]);
  
  // Load estimate data if we are in edit mode
  useEffect(() => {
    if (estimateId) {
      // Query to get estimate data
      setIsLoading(true);
      
      const fetchEstimate = async () => {
        try {
          const response = await fetch(`/api/protected/estimates/${estimateId}`);
          if (!response.ok) {
            throw new Error('Could not load the estimate');
          }
          
          const estimateData = await response.json();
          
          // Convert dates from strings to Date objects
          if (estimateData.issueDate) {
            estimateData.issueDate = new Date(estimateData.issueDate);
          }
          if (estimateData.expiryDate) {
            estimateData.expiryDate = new Date(estimateData.expiryDate);
          }
          
          // Update form with estimate data
          form.reset(estimateData);
          
          // Load estimate items
          if (estimateData.items && Array.isArray(estimateData.items)) {
            setItems(estimateData.items);
          }
          
          setIsEditing(true);
          setIsLoading(false);
        } catch (error) {
          console.error("Error loading estimate:", error);
          toast({
            title: "Error",
            description: "Could not load the estimate",
            variant: "destructive",
          });
          setIsLoading(false);
        }
      };
      
      fetchEstimate();
    }
  }, [estimateId, form]);
  
  // Handle form submission
  const onSubmit = (data: EstimateFormValues) => {
    if (items.length === 0) {
      toast({
        title: "Cannot create estimate",
        description: "You must add at least one item to the estimate.",
        variant: "destructive",
      });
      return;
    }
    
    // Additional validation to ensure totals are not zero
    const currentSubtotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    if (currentSubtotal <= 0) {
      toast({
        title: "Invalid estimate total",
        description: "Estimate total must be greater than $0.00.",
        variant: "destructive",
      });
      return;
    }
    
    // Recalculate totals before submission to ensure accurate amounts
    recalculateTotals(items);
    
    // Get the updated form values after recalculation
    const updatedData = form.getValues();
    
    // Create the estimate number if it does not exist
    if (!updatedData.estimateNumber) {
      const today = new Date();
      const year = today.getFullYear();
      const month = (today.getMonth() + 1).toString().padStart(2, '0');
      const random = Math.floor(Math.random() * 900) + 100;
      updatedData.estimateNumber = `EST-${year}${month}-${random}`;
    }
    
    // Ensure we have valid numeric values
    const subtotal = parseFloat(updatedData.subtotal || "0");
    const tax = parseFloat(updatedData.tax || "0");
    const discount = parseFloat(updatedData.discount || "0");
    const total = parseFloat(updatedData.total || "0");
    
    console.log(`Creating estimate with calculated totals: Subtotal: $${subtotal}, Tax: ${tax}%, Discount: ${discount}%, Total: $${total}`);
    
    // Prepare complete estimate object with its items
    const estimateData = {
      ...updatedData,
      // Ensure numeric fields are properly formatted
      subtotal: subtotal.toString(),
      tax: tax.toString(),
      discount: discount.toString(),
      total: total.toString(),
      // Si proyecto es 0, enviar null para evitar error de clave foránea
      projectId: updatedData.projectId === 0 ? null : updatedData.projectId,
      // If we are editing, maintain the current status, otherwise set as "draft"
      status: isEditing ? form.getValues("status") || "draft" : "draft",
      items: items.map(item => ({
        ...item,
        estimateId: isEditing && estimateId ? estimateId : 0, // Maintain relationship with the estimate if in edit mode
      })),
    };
    
    if (isEditing && estimateId) {
      // Update existing estimate
      updateEstimateMutation.mutate(
        { 
          id: estimateId, 
          data: estimateData
        }, 
        {
          onSuccess: (updatedEstimate) => {
            toast({
              title: "Estimado actualizado",
              description: `Estimate ${updatedEstimate.estimateNumber} has been successfully updated.`,
            });
            
            if (onSuccess) {
              onSuccess(updatedEstimate);
            }
          }
        }
      );
    } else {
      // Create new estimate
      createEstimateMutation.mutate(estimateData, {
        onSuccess: (newEstimate) => {
          toast({
            title: "Estimado creado",
            description: `Estimate ${newEstimate.estimateNumber} has been successfully created.`,
          });
          
          if (onSuccess) {
            onSuccess(newEstimate);
          }
        }
      });
    }
  };

  // Si está cargando, mostrar indicador de carga
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-gray-500">Loading estimate data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">
          {isEditing ? "Edit Estimate" : "Create New Estimate"}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {isEditing 
            ? "Update the estimate details and items. When finished, click 'Save & Close'." 
            : "Complete the estimate details and add the items to include."}
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">General Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Client selector */}
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client*</FormLabel>
                      <Select
                        value={field.value ? field.value.toString() : ""}
                        onValueChange={(value) => {
                          field.onChange(parseInt(value));
                          // Reset project value when client changes
                          form.setValue("projectId", 0);
                        }}
                        disabled={isEditing} // Disable client change in edit mode
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
                        Select the client for this estimate
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Project selector - completely optional */}
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => {
                    // Filter projects by selected client
                    const clientId = form.watch("clientId");
                    const filteredProjects = clientId
                      ? projects.filter((p: any) => p.clientId === clientId)
                      : [];
                    
                    return (
                      <FormItem>
                        <FormLabel>Project (Optional)</FormLabel>
                        <Select
                          value={field.value ? field.value.toString() : "0"}
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          disabled={!clientId || isLoadingProjects || isEditing} // Disable in edit mode
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="No project - Will be created later" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="0">No project - Will be created later</SelectItem>
                            {filteredProjects.length > 0 && (
                              <SelectSeparator />
                            )}
                            {filteredProjects.map((project: any) => (
                              <SelectItem key={project.id} value={project.id.toString()}>
                                {project.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Projects can be associated after the client accepts the estimate
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="estimateNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimate Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Automatically generated" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormDescription>
                        Leave blank to generate automatically
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
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
                                "w-full pl-3 text-left font-normal flex items-center justify-between"
                              }
                            >
                              {field.value ? (
                                format(field.value, "MM/dd/yyyy")
                              ) : (
                                <span>Select a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setDate(new Date().getDate() - 30))
                            }
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
                                "w-full pl-3 text-left font-normal flex items-center justify-between"
                              }
                            >
                              {field.value ? (
                                format(field.value, "MM/dd/yyyy")
                              ) : (
                                <span>Select a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date()
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Terms & Conditions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="terms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Terms</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Estimate terms..."
                          className="min-h-[100px]"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Notes for the client..."
                          className="min-h-[100px]"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estimate Items</CardTitle>
              <CardDescription>
                Add the products or services that will be included in this estimate.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-5">
                    <FormLabel>Description</FormLabel>
                    <Input
                      placeholder="Item description"
                      value={newItem.description}
                      onChange={(e) => handleItemChange('description', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <FormLabel>Quantity</FormLabel>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        min="1"
                        value={newItem.quantity}
                        onChange={(e) => handleItemChange('quantity', e.target.value)}
                        className="w-full"
                      />
                      <div className="flex items-center space-x-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => {
                            const currentQty = Number(newItem.quantity) || 1;
                            handleItemChange('quantity', Math.max(1, currentQty - 1));
                          }}
                        >
                          -
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => {
                            const currentQty = Number(newItem.quantity) || 1;
                            handleItemChange('quantity', currentQty + 1);
                          }}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <FormLabel>Unit Price</FormLabel>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newItem.unitPrice}
                      onChange={(e) => handleItemChange('unitPrice', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <FormLabel>Amount</FormLabel>
                    <Input
                      disabled
                      value={formatCurrency(newItem.amount)}
                    />
                  </div>
                  <div className="col-span-1 flex items-end">
                    <Button
                      type="button"
                      onClick={handleAddItem}
                      size="icon"
                      className="w-full h-10"
                    >
                      <Plus className="h-4 w-4" />
                      <span className="sr-only">Add item</span>
                    </Button>
                  </div>
                </div>
                
                {items.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px]">Description</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell>{formatCurrency(item.amount)}</TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => handleRemoveItem(index)}
                              size="icon"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Remove item</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No items have been added to the estimate.
                  </div>
                )}
                
              </div>
              
              {/* Clearer summary section */}
              <div className="mt-8 border rounded-lg overflow-hidden">
                <div className="bg-muted p-4 border-b">
                  <h3 className="text-lg font-medium">Estimate Summary</h3>
                </div>
                
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Price Adjustments</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <FormField
                            control={form.control}
                            name="tax"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tax (%)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={field.value}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value) || 0;
                                      field.onChange(value.toString());
                                      if (items.length > 0) {
                                        recalculateTotals(items);
                                      }
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
                                <FormLabel>Discount (%)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={field.value}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value) || 0;
                                      field.onChange(value.toString());
                                      if (items.length > 0) {
                                        recalculateTotals(items);
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>
                    </div>
                  
                    <div>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Totals</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Subtotal:</span>
                              <span className="font-medium">{formatCurrency(form.getValues("subtotal"))}</span>
                            </div>
                            
                            {Number(form.getValues("tax")) > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Tax ({form.getValues("tax")}%):</span>
                                <span className="font-medium">{formatCurrency((Number(form.getValues("subtotal")) * Number(form.getValues("tax"))) / 100)}</span>
                              </div>
                            )}
                            
                            {Number(form.getValues("discount")) > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Discount ({form.getValues("discount")}%):</span>
                                <span className="font-medium text-destructive">-{formatCurrency((Number(form.getValues("subtotal")) * Number(form.getValues("discount"))) / 100)}</span>
                              </div>
                            )}
                            
                            <Separator className="my-2" />
                            
                            <div className="flex justify-between pt-1">
                              <span className="font-bold">TOTAL:</span>
                              <span className="font-bold text-lg">{formatCurrency(form.getValues("total"))}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button variant="outline" type="button" onClick={onCancel}>
                Cancel
              </Button>
              {isEditing ? (
                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={updateEstimateMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      // The form will be submitted and onSubmit will handle saving
                      // The onSuccess callback will handle closing the view
                    }}
                  >
                    {updateEstimateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save & Close
                  </Button>
                </div>
              ) : (
                <Button 
                  type="submit" 
                  disabled={createEstimateMutation.isPending}
                >
                  {createEstimateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Estimate
                </Button>
              )}
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}