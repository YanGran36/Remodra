import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, addDays } from "date-fns";
import { 
  Calculator, 
  CalendarIcon, 
  MinusCircle, 
  PlusCircle, 
  X 
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

// Helper function to format currency
const formatCurrency = (amount: number | string) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
    .format(typeof amount === 'string' ? parseFloat(amount) : amount);
};

// Define schema for invoiceItem
const invoiceItemSchema = z.object({
  id: z.number().optional(),
  description: z.string().min(1, { message: "Description is required" }),
  quantity: z.string().min(1, { message: "Quantity is required" }),
  unitPrice: z.string().min(1, { message: "Unit price is required" }),
  amount: z.string().min(1, { message: "Amount is required" }),
  notes: z.string().optional(),
});

// Define schema for invoice
const invoiceFormSchema = z.object({
  id: z.number().optional(),
  clientId: z.number({ required_error: "Client is required" }),
  projectId: z.number().optional().nullable(),
  estimateId: z.number().optional().nullable(),
  invoiceNumber: z.string().min(1, { message: "Work order number is required" }),
  issueDate: z.date({ required_error: "Issue date is required" }),
  dueDate: z.date({ required_error: "Due date is required" }),
  status: z.string().min(1, { message: "Status is required" }),
  subtotal: z.string().min(1, { message: "Subtotal is required" }),
  tax: z.string().default("0"),
  discount: z.string().default("0"),
  total: z.string().min(1, { message: "Total is required" }),
  amountPaid: z.string().default("0"),
  terms: z.string().optional(),
  notes: z.string().optional(),
  contractorSignature: z.string().optional(),
  items: z.array(invoiceItemSchema).optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

interface InvoiceFormProps {
  invoiceToEdit?: any;
  isOpen: boolean;
  onClose: () => void;
  fromEstimate?: any;
}

export default function InvoiceForm({ invoiceToEdit, isOpen, onClose, fromEstimate }: InvoiceFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<any[]>([]);
  const [taxRate, setTaxRate] = useState<string>("0");
  const [discountAmount, setDiscountAmount] = useState<string>("0");
  const [useEstimateItems, setUseEstimateItems] = useState(true);
  
  // Fetch clients
  const { data: clients } = useQuery({
    queryKey: ["/api/protected/clients"],
  });
  
  // Fetch projects
  const { data: projects } = useQuery({
    queryKey: ["/api/protected/projects"],
  });
  
  // Fetch estimates if a client is selected
  const currentClientId = useForm().getValues?.("clientId");
  const { data: estimates } = useQuery({
    queryKey: ["/api/protected/estimates", { clientId: currentClientId }],
    enabled: !!currentClientId,
  });
  
  // Form definition
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      clientId: undefined,
      projectId: null,
      estimateId: null,
      invoiceNumber: generateInvoiceNumber(),
      issueDate: new Date(),
      dueDate: addDays(new Date(), 15),
      status: "pending",
      subtotal: "0",
      tax: "0",
      discount: "0",
      total: "0",
      amountPaid: "0",
      terms: "1. Pago completo requerido dentro de 15 días desde la fecha de emisión.\n2. Para pagos con tarjeta de crédito, pueden aplicar cargos adicionales.\n3. Pagos atrasados pueden estar sujetos a un cargo por demora del 2% mensual.",
      notes: "",
      contractorSignature: "",
      items: [],
    }
  });
  
  // Field array for invoice items
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });
  
  // Initialize form with data if editing
  useEffect(() => {
    if (invoiceToEdit) {
      const formattedInvoice = {
        ...invoiceToEdit,
        issueDate: new Date(invoiceToEdit.issueDate),
        dueDate: new Date(invoiceToEdit.dueDate),
        subtotal: invoiceToEdit.subtotal.toString(),
        tax: invoiceToEdit.tax.toString(),
        discount: invoiceToEdit.discount.toString(),
        total: invoiceToEdit.total.toString(),
        amountPaid: invoiceToEdit.amountPaid.toString(),
      };
      
      form.reset(formattedInvoice);
      
      if (invoiceToEdit.items && invoiceToEdit.items.length > 0) {
        setItems(invoiceToEdit.items.map((item: any) => ({
          ...item,
          quantity: item.quantity.toString(),
          unitPrice: item.unitPrice.toString(),
          amount: item.amount.toString(),
        })));
      }
      
      setTaxRate(calculateTaxRate(invoiceToEdit.subtotal, invoiceToEdit.tax).toString());
      setDiscountAmount(invoiceToEdit.discount.toString());
    } else if (fromEstimate) {
      // Initialize form from estimate
      const formattedInvoice = {
        clientId: fromEstimate.clientId,
        projectId: fromEstimate.projectId,
        estimateId: fromEstimate.id,
        invoiceNumber: generateInvoiceNumber(),
        issueDate: new Date(),
        dueDate: addDays(new Date(), 15),
        status: "pending",
        subtotal: fromEstimate.subtotal.toString(),
        tax: fromEstimate.tax.toString(),
        discount: fromEstimate.discount.toString(),
        total: fromEstimate.total.toString(),
        amountPaid: "0",
        terms: "1. Pago completo requerido dentro de 15 días desde la fecha de emisión.\n2. Para pagos con tarjeta de crédito, pueden aplicar cargos adicionales.\n3. Pagos atrasados pueden estar sujetos a un cargo por demora del 2% mensual.",
        notes: fromEstimate.notes || "",
        contractorSignature: fromEstimate.contractorSignature || "",
      };
      
      form.reset(formattedInvoice);
      
      if (fromEstimate.items && fromEstimate.items.length > 0) {
        const estimateItems = fromEstimate.items.map((item: any) => ({
          ...item,
          quantity: item.quantity.toString(),
          unitPrice: item.unitPrice.toString(),
          amount: item.amount.toString(),
        }));
        
        setItems(estimateItems);
        form.setValue("items", estimateItems);
      }
      
      setTaxRate(calculateTaxRate(fromEstimate.subtotal, fromEstimate.tax).toString());
      setDiscountAmount(fromEstimate.discount.toString());
    } else {
      // Clear the form
      form.reset({
        clientId: undefined,
        projectId: null,
        estimateId: null,
        invoiceNumber: generateInvoiceNumber(),
        issueDate: new Date(),
        dueDate: addDays(new Date(), 15),
        status: "pending",
        subtotal: "0",
        tax: "0",
        discount: "0",
        total: "0",
        amountPaid: "0",
        terms: "1. Pago completo requerido dentro de 15 días desde la fecha de emisión.\n2. Para pagos con tarjeta de crédito, pueden aplicar cargos adicionales.\n3. Pagos atrasados pueden estar sujetos a un cargo por demora del 2% mensual.",
        notes: "",
        contractorSignature: "",
        items: [],
      });
      setItems([]);
      setTaxRate("0");
      setDiscountAmount("0");
    }
  }, [invoiceToEdit, fromEstimate, form]);
  
  // Create invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: async (data: InvoiceFormValues) => {
      const res = await apiRequest("POST", "/api/protected/invoices", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/invoices"] });
      toast({
        title: "Orden de trabajo creada",
        description: "La orden de trabajo ha sido creada exitosamente.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error al crear la orden de trabajo",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update invoice mutation
  const updateInvoiceMutation = useMutation({
    mutationFn: async (data: InvoiceFormValues) => {
      const res = await apiRequest("PATCH", `/api/protected/invoices/${data.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/invoices"] });
      toast({
        title: "Orden de trabajo actualizada",
        description: "La orden de trabajo ha sido actualizada exitosamente.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating the work order",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handlers for form fields
  function generateInvoiceNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    // Generate a random 3-digit number
    const random = Math.floor(Math.random() * 900) + 100;
    return `OT-${year}-${random}`;
  }
  
  function calculateTaxRate(subtotal: string | number, tax: string | number): number {
    const subtotalNum = typeof subtotal === 'string' ? parseFloat(subtotal) : subtotal;
    const taxNum = typeof tax === 'string' ? parseFloat(tax) : tax;
    
    if (subtotalNum <= 0 || isNaN(subtotalNum)) return 0;
    return (taxNum / subtotalNum) * 100;
  }
  
  function calculateSubtotal(items: any[]): number {
    return items.reduce((sum, item) => {
      const amount = typeof item.amount === 'string' ? parseFloat(item.amount) : item.amount;
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
  }
  
  function calculateTotal(subtotal: number, tax: number, discount: number): number {
    return subtotal + tax - discount;
  }
  
  function handleEstimateChange(estimateId: string) {
    if (!estimateId || estimateId === "no_estimate") {
      setItems([]);
      form.setValue("items", []);
      return;
    }
    
    // Find the selected estimate
    const selectedEstimate = estimates.find((e: any) => e.id.toString() === estimateId);
    
    if (selectedEstimate && useEstimateItems) {
      // Set project ID
      form.setValue("projectId", selectedEstimate.projectId);
      
      // Set financial fields
      form.setValue("subtotal", selectedEstimate.subtotal.toString());
      form.setValue("tax", selectedEstimate.tax.toString());
      form.setValue("discount", selectedEstimate.discount.toString());
      form.setValue("total", selectedEstimate.total.toString());
      
      // Set tax rate and discount amount for UI
      setTaxRate(calculateTaxRate(selectedEstimate.subtotal, selectedEstimate.tax).toString());
      setDiscountAmount(selectedEstimate.discount.toString());
      
      // Copy items from estimate
      if (selectedEstimate.items && selectedEstimate.items.length > 0) {
        const estimateItems = selectedEstimate.items.map((item: any) => ({
          ...item,
          quantity: item.quantity.toString(),
          unitPrice: item.unitPrice.toString(),
          amount: item.amount.toString(),
        }));
        
        setItems(estimateItems);
        form.setValue("items", estimateItems);
      }
    }
  }
  
  function handleAddItem() {
    const newItem = {
      description: "",
      quantity: "1",
      unitPrice: "0",
      amount: "0",
      notes: "",
    };
    
    setItems([...items, newItem]);
    append(newItem);
  }
  
  function handleRemoveItem(index: number) {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
    remove(index);
    
    // Recalculate subtotal
    const newSubtotal = calculateSubtotal(newItems);
    const newTax = (newSubtotal * parseFloat(taxRate)) / 100;
    const newTotal = calculateTotal(newSubtotal, newTax, parseFloat(discountAmount));
    
    form.setValue("subtotal", newSubtotal.toString());
    form.setValue("tax", newTax.toString());
    form.setValue("total", newTotal.toString());
  }
  
  function handleItemChange(index: number, field: string, value: string) {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // If quantity or unitPrice changed, recalculate amount
    if (field === 'quantity' || field === 'unitPrice') {
      const quantity = field === 'quantity' ? parseFloat(value) : parseFloat(newItems[index].quantity);
      const unitPrice = field === 'unitPrice' ? parseFloat(value) : parseFloat(newItems[index].unitPrice);
      
      if (!isNaN(quantity) && !isNaN(unitPrice)) {
        const amount = quantity * unitPrice;
        newItems[index].amount = amount.toString();
        
        // Update form value
        form.setValue(`items.${index}.amount`, amount.toString());
      }
    }
    
    setItems(newItems);
    form.setValue(`items.${index}.${field}`, value);
    
    // Recalculate subtotal
    const newSubtotal = calculateSubtotal(newItems);
    const newTax = (newSubtotal * parseFloat(taxRate)) / 100;
    const newDiscount = parseFloat(discountAmount);
    const newTotal = calculateTotal(newSubtotal, newTax, newDiscount);
    
    form.setValue("subtotal", newSubtotal.toString());
    form.setValue("tax", newTax.toString());
    form.setValue("total", newTotal.toString());
  }
  
  function handleTaxRateChange(value: string) {
    setTaxRate(value);
    const subtotal = parseFloat(form.getValues("subtotal"));
    const newTax = (subtotal * parseFloat(value)) / 100;
    const discount = parseFloat(form.getValues("discount"));
    const newTotal = calculateTotal(subtotal, newTax, discount);
    
    form.setValue("tax", newTax.toString());
    form.setValue("total", newTotal.toString());
  }
  
  function handleDiscountChange(value: string) {
    setDiscountAmount(value);
    const subtotal = parseFloat(form.getValues("subtotal"));
    const tax = parseFloat(form.getValues("tax"));
    const newTotal = calculateTotal(subtotal, tax, parseFloat(value));
    
    form.setValue("discount", value);
    form.setValue("total", newTotal.toString());
  }
  
  function onSubmit(data: InvoiceFormValues) {
    const formattedData = {
      ...data,
      items: items.map(item => ({
        ...item,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.amount,
      })),
    };
    
    if (invoiceToEdit) {
      updateInvoiceMutation.mutate(formattedData);
    } else {
      createInvoiceMutation.mutate(formattedData);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{invoiceToEdit ? "Editar Orden de Trabajo" : "Crear Nueva Orden de Trabajo"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente*</FormLabel>
                      <Select
                        value={field.value?.toString()}
                        onValueChange={(value) => {
                          field.onChange(parseInt(value));
                          form.setValue("projectId", null);
                          form.setValue("estimateId", null);
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select client" />
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
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proyecto (Opcional)</FormLabel>
                      <Select
                        value={field.value?.toString() || ""}
                        onValueChange={(value) => field.onChange(value && value !== "no_project" ? parseInt(value) : null)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select project" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="no_project">No project</SelectItem>
                          {projects?.filter((project: any) => 
                            project.clientId === parseInt(form.getValues("clientId")?.toString() || "0")
                          ).map((project: any) => (
                            <SelectItem key={project.id} value={project.id.toString()}>
                              {project.title}
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
                  name="estimateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Basado en Estimado (Opcional)</FormLabel>
                      <div className="space-y-2">
                        <Select
                          value={field.value?.toString() || ""}
                          onValueChange={(value) => {
                            field.onChange(value ? parseInt(value) : null);
                            handleEstimateChange(value);
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select estimate" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="no_estimate">No estimate</SelectItem>
                            {estimates?.filter((estimate: any) => 
                              estimate.clientId === parseInt(form.getValues("clientId")?.toString() || "0") &&
                              estimate.status === "accepted"
                            ).map((estimate: any) => (
                              <SelectItem key={estimate.id} value={estimate.id.toString()}>
                                {estimate.estimateNumber} - {formatCurrency(estimate.total)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        {field.value && (
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="use-estimate-items" 
                              checked={useEstimateItems}
                              onCheckedChange={(checked) => {
                                setUseEstimateItems(!!checked);
                                if (checked) {
                                  handleEstimateChange(field.value.toString());
                                }
                              }}
                            />
                            <label
                              htmlFor="use-estimate-items"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Use items from estimate
                            </label>
                          </div>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="invoiceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Orden de Trabajo*</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="issueDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Fecha de Emisión*</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className="pl-3 text-left font-normal"
                              >
                                {field.value ? (
                                  format(field.value, "dd/MM/yyyy")
                                ) : (
                                  <span>Select date</span>
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
                                date < new Date("1900-01-01")
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
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Fecha de Vencimiento*</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className="pl-3 text-left font-normal"
                              >
                                {field.value ? (
                                  format(field.value, "dd/MM/yyyy")
                                ) : (
                                  <span>Select date</span>
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
                                date < new Date() ||
                                date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado*</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pendiente</SelectItem>
                          <SelectItem value="paid">Pagada</SelectItem>
                          <SelectItem value="overdue">Vencida</SelectItem>
                          <SelectItem value="cancelled">Cancelada</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <Separator />
            
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Artículos de la Orden de Trabajo</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Agregar Artículo
                </Button>
              </div>
              
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40%]">Descripción</TableHead>
                        <TableHead className="text-right">Cantidad</TableHead>
                        <TableHead className="text-right">Precio Unitario</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                            No hay artículos en esta orden de trabajo. Haga clic en "Agregar Artículo" para comenzar.
                          </TableCell>
                        </TableRow>
                      ) : (
                        items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Input
                                placeholder="Descripción"
                                value={item.description}
                                onChange={(e) => handleItemChange(index, "description", e.target.value)}
                                className="mb-1"
                              />
                              <Input
                                placeholder="Notas (opcional)"
                                value={item.notes || ""}
                                onChange={(e) => handleItemChange(index, "notes", e.target.value)}
                                className="text-xs"
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                                className="w-20 text-right ml-auto"
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end">
                                <span className="mr-1">$</span>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.unitPrice}
                                  onChange={(e) => handleItemChange(index, "unitPrice", e.target.value)}
                                  className="w-24 text-right"
                                />
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end">
                                <span className="mr-1">$</span>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.amount}
                                  readOnly
                                  className="w-24 text-right bg-muted"
                                />
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveItem(index)}
                                className="h-8 w-8 p-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={3} className="text-right font-medium">
                          Subtotal
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end">
                            <span className="mr-1">$</span>
                            <Input
                              type="number"
                              readOnly
                              value={form.watch("subtotal")}
                              className="w-24 text-right bg-muted"
                            />
                          </div>
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={2} className="text-right font-medium">
                          Impuestos
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={taxRate}
                              onChange={(e) => handleTaxRateChange(e.target.value)}
                              className="w-16 text-right"
                            />
                            <span className="ml-1">%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end">
                            <span className="mr-1">$</span>
                            <Input
                              type="number"
                              readOnly
                              value={form.watch("tax")}
                              className="w-24 text-right bg-muted"
                            />
                          </div>
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={3} className="text-right font-medium">
                          Descuento
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end">
                            <span className="mr-1">$</span>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={discountAmount}
                              onChange={(e) => handleDiscountChange(e.target.value)}
                              className="w-24 text-right"
                            />
                          </div>
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={3} className="text-right font-medium">
                          Total
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end">
                            <span className="mr-1">$</span>
                            <Input
                              type="number"
                              readOnly
                              value={form.watch("total")}
                              className="w-24 text-right bg-muted font-bold"
                            />
                          </div>
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </CardContent>
              </Card>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="terms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Términos y Condiciones</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ingrese los términos y condiciones de la orden de trabajo"
                        className="min-h-[120px]"
                        {...field}
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
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ingrese notas adicionales para el cliente"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="contractorSignature"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Firma del Contratista</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ingrese su nombre para firmar esta orden de trabajo"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Esta firma digital será incluida en la orden de trabajo enviada al cliente.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Separator />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={createInvoiceMutation.isPending || updateInvoiceMutation.isPending}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={createInvoiceMutation.isPending || updateInvoiceMutation.isPending}
              >
                {createInvoiceMutation.isPending || updateInvoiceMutation.isPending
                  ? "Guardando..."
                  : invoiceToEdit
                  ? "Actualizar Orden de Trabajo"
                  : "Crear Orden de Trabajo"
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}