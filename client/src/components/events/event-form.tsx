import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parseISO, addHours } from "date-fns";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, User, Phone, Mail, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { TimePicker } from "@/components/ui/time-picker";
import { AddressInput } from "@/components/ui/address-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEvents, EventInput } from "@/hooks/use-events";
import { apiRequest } from "@/lib/queryClient";
import { AlertCircle } from "lucide-react";
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

// Validation schema for the form - complete for creating/editing events
const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  date: z.date(),
  startTime: z.string().min(1, "Please select a start time"),
  endTime: z.string().min(1, "Please select an end time"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z.string().min(1, "Zip code is required"),
  type: z.enum(["estimate", "meeting", "site-visit", "delivery", "invoice", "other"]),
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]),
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  agentId: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Interfaz para las propiedades del componente
interface EventFormProps {
  eventId?: number;
  defaultClientId?: string;
  defaultProjectId?: string;
  defaultType?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function EventForm({
  eventId,
  defaultClientId,
  defaultProjectId,
  defaultType = "estimate",
  onSuccess,
  onCancel,
}: EventFormProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  const { getEvent, createEventMutation, updateEventMutation } = useEvents();
  
  // Query the event if editing an existing one
  const { data: eventData, isLoading: isLoadingEvent } = useQuery({
    queryKey: ["/api/protected/events", eventId],
    queryFn: async () => {
      if (!eventId) return null;
      const response = await apiRequest("GET", `/api/protected/events/${eventId}`);
      return await response.json();
    },
    enabled: !!eventId,
  });
  
  // Query clients
  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ["/api/protected/clients"],
  });

  // Query projects
  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ["/api/protected/projects"],
  });

  // Query agents
  const { data: agents = [] } = useQuery<any[]>({
    queryKey: ["/api/protected/agents"],
  });

  // Agent colors from database
  const getAgentColor = (agentId: number) => {
    const agent = agents.find(a => a.id === agentId);
    return agent?.colorCode || '#3B82F6';
  };

  // Filter projects by selected client
  const getFilteredProjects = (clientId: string) => {
    if (!clientId) return [];
    return (projects as any[]).filter((project: any) => project.clientId === Number(clientId));
  };

  // Configure the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      date: new Date(),
      startTime: format(new Date(), "h:mm a"),
      endTime: format(addHours(new Date(), 1), "h:mm a"),
      address: "",
      city: "",
      state: "",
      zip: "",
      type: (defaultType as "estimate" | "meeting" | "site-visit" | "delivery" | "invoice" | "other") || "estimate",
      status: "pending",
      clientId: defaultClientId || "",
      projectId: defaultProjectId || "",
      agentId: "",
      notes: "",
    },
  });

  // Update form values when an existing event is loaded
  useEffect(() => {
    if (eventData && !isLoadingEvent && eventData.startTime && eventData.endTime) {
      console.log("Loading event data for form:", eventData);
      console.log("Available clients:", clients);
      console.log("Available agents:", agents);
      
      const startDate = parseISO(eventData.startTime);
      const endDate = parseISO(eventData.endTime);
      
      const formValues = {
        title: eventData.title || "",
        description: eventData.description || "",
        date: startDate,
        startTime: format(startDate, "h:mm a"),
        endTime: format(endDate, "h:mm a"),
        address: eventData.address || "",
        city: eventData.city || "",
        state: eventData.state || "",
        zip: eventData.zip || "",
        type: eventData.type || "estimate",
        status: eventData.status || "pending",
        clientId: eventData.clientId ? String(eventData.clientId) : "",
        projectId: eventData.projectId ? String(eventData.projectId) : "",
        agentId: eventData.agentId ? String(eventData.agentId) : "",
        notes: eventData.notes || "",
      };
      
      console.log("Setting form values:", formValues);
      form.reset(formValues);
      setDate(startDate);
    }
  }, [eventData, isLoadingEvent, form, clients, agents]);

  // Watch changes in clientId to update projects
  const watchClientId = form.watch("clientId");
  const filteredProjects = getFilteredProjects(watchClientId || "");

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    const { date, startTime, endTime, ...rest } = values;
    
    // Format dates and times - parse 12-hour format
    const parseTime = (timeStr: string) => {
      const parts = timeStr.split(/[:\s]/);
      let hour = parseInt(parts[0] || "0");
      const minute = parseInt(parts[1] || "0");
      const period = parts[2]?.toUpperCase();
      
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      
      return { hour, minute };
    };
    
    const startParsed = parseTime(startTime || "10:00 AM");
    const endParsed = parseTime(endTime || "11:00 AM");
    
    const startDate = new Date(date);
    startDate.setHours(startParsed.hour, startParsed.minute, 0);
    
    const endDate = new Date(date);
    endDate.setHours(endParsed.hour, endParsed.minute, 0);
    
    const eventData: EventInput = {
      title: values.title,
      description: values.description,
      address: values.address,
      city: values.city,
      state: values.state,
      zip: values.zip,
      type: values.type as "estimate" | "meeting" | "site-visit" | "delivery" | "invoice" | "other",
      status: values.status as "pending" | "confirmed" | "completed" | "cancelled",
      notes: values.notes,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      clientId: (values.clientId && values.clientId !== "none" && values.clientId !== "new_client") 
        ? Number(values.clientId) 
        : undefined,
      projectId: (values.projectId && values.projectId !== "none") 
        ? Number(values.projectId) 
        : undefined,
      agentId: (values.agentId && values.agentId !== "none") 
        ? Number(values.agentId) 
        : undefined,
    };
    
    if (eventId) {
      // Actualizar evento existente
      await updateEventMutation.mutateAsync({
        id: eventId,
        data: eventData,
      });
    } else {
      // Crear nuevo evento
      await createEventMutation.mutateAsync(eventData);
    }
    
    if (onSuccess) {
      onSuccess();
    }
  };

  // Get the current event from the events array
  const eventIdNum = eventId ? (typeof eventId === 'string' ? parseInt(eventId) : eventId) : 0;
  const currentEvent = eventData && Array.isArray(eventData) 
    ? eventData.find((event: any) => event.id === eventIdNum)
    : null;

  // Get the selected client's information for display
  const selectedClient = currentEvent && currentEvent.clientId 
    ? clients.find((client: any) => client.id === currentEvent.clientId)
    : null;

  // State for cancellation reason
  const [cancellationReason, setCancellationReason] = useState("");
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Handle cancel event with reason
  const handleCancelEvent = async () => {
    if (!eventId || !cancellationReason.trim()) return;

    try {
      // Update event status to cancelled
      await updateEventMutation.mutateAsync({
        id: eventId,
        data: {
          status: "cancelled",
          notes: `Event cancelled. Reason: ${cancellationReason}`
        }
      });

      // If event has a client, add cancellation note to client's cancellation history
      if (eventData?.clientId) {
        const cancellationEntry = `[${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}] Event "${eventData.title}" cancelled. Reason: ${cancellationReason}`;
        
        // Get current client data to append to existing cancellation history
        const clientRes = await apiRequest("GET", `/api/protected/clients/${eventData.clientId}`);
        const client = await clientRes.json();
        
        const existingHistory = client.cancellationHistory || "";
        const updatedHistory = existingHistory 
          ? `${existingHistory}\n${cancellationEntry}`
          : cancellationEntry;
        
        await apiRequest("PATCH", `/api/protected/clients/${eventData.clientId}`, {
          cancellationHistory: updatedHistory
        });
      }

      setShowCancelDialog(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error cancelling event:", error);
    }
  };

  // Show loading while event data is being fetched
  if (eventId && isLoadingEvent) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm text-gray-600">Loading event details...</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Event Loading Confirmation - show when editing */}
        {eventId && eventData && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-green-800">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              <span className="text-sm font-medium">Event details loaded successfully</span>
            </div>
          </div>
        )}

        {/* Client Information Display - only show when editing an existing event with a client */}
        {eventId && selectedClient && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-600" />
                    <span className="font-medium">
                      {selectedClient.firstName} {selectedClient.lastName}
                    </span>
                  </div>
                  {selectedClient.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-600" />
                      <span className="text-sm">{selectedClient.email}</span>
                    </div>
                  )}
                  {selectedClient.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-600" />
                      <span className="text-sm">{selectedClient.phone}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  {selectedClient.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-600 mt-0.5" />
                      <span className="text-sm">{selectedClient.address}</span>
                    </div>
                  )}
                  {selectedClient.notes && (
                    <div className="text-sm text-gray-600">
                      <strong>Notes:</strong> {selectedClient.notes}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Title</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g.: Site visit for measurements" 
                  {...field} 
                />
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
                  placeholder="Event details" 
                  {...field} 
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
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
                      onSelect={(date) => {
                        field.onChange(date);
                        setDate(date);
                      }}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time</FormLabel>
                <FormControl>
                  <TimePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select start time"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Time</FormLabel>
                <FormControl>
                  <TimePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select end time"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Address Fields */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Address</h3>
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Street Address</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter street address"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="City"
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
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="State"
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
              name="zip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zip Code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Zip Code"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Type</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="site-visit">Site Visit</SelectItem>
                    <SelectItem value="delivery">Material Delivery</SelectItem>
                    <SelectItem value="estimate">Estimate</SelectItem>
                    <SelectItem value="invoice">Invoice</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
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
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
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
            name="clientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client or meeting type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">No Client (Internal Meeting)</SelectItem>
                    <SelectItem value="new_client">New/Potential Client</SelectItem>
                    {(clients as any[]).map((client: any) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.firstName} {client.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
                {field.value === "new_client" && (
                  <p className="text-sm text-blue-600 mt-1">
                    For meetings with new potential clients. You can create their client record after the meeting.
                  </p>
                )}
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
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  value={field.value}
                  disabled={!watchClientId}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={watchClientId ? "Select a project" : "First select a client"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {filteredProjects.map((project: any) => (
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
        </div>
        
        {/* Agent Assignment */}
        <FormField
          control={form.control}
          name="agentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assign Agent</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an agent (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-400 border border-white shadow-sm" />
                      <span>No agent assigned</span>
                    </div>
                  </SelectItem>
                  {agents.map((agent: any, index: number) => (
                    <SelectItem key={agent.id} value={agent.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full border border-white shadow-sm" 
                          style={{ backgroundColor: getAgentColor(agent.id) }}
                        />
                        <span>{agent.firstName} {agent.lastName} - {agent.role}</span>
                      </div>
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
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Additional notes about the event" 
                  {...field} 
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-between pt-2">
          <div className="flex gap-3">
            {eventId && currentEvent?.status !== "cancelled" && (
              <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" size="sm">
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Cancel Event
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Event</AlertDialogTitle>
                    <AlertDialogDescription>
                      Please provide a reason for cancelling this event. This information will be added to the client's profile for future reference.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="py-4">
                    <Label htmlFor="cancellation-reason">Cancellation Reason</Label>
                    <Textarea
                      id="cancellation-reason"
                      placeholder="e.g., Client requested reschedule, weather conditions, emergency, etc."
                      value={cancellationReason}
                      onChange={(e) => setCancellationReason(e.target.value)}
                      className="mt-2"
                      rows={3}
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setCancellationReason("")}>
                      Keep Event
                    </AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleCancelEvent} 
                      className="bg-red-600 hover:bg-red-700"
                      disabled={!cancellationReason.trim()}
                    >
                      Cancel Event
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              Close
            </Button>
            <Button 
              type="submit"
              disabled={createEventMutation.isPending || updateEventMutation.isPending}
            >
              {(createEventMutation.isPending || updateEventMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {eventId ? "Update" : "Create"} Event
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}