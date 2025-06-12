import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format, parseISO } from "date-fns";

// Tipos para los eventos
export interface Event {
  id: number;
  contractorId: number;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  type: "meeting" | "site-visit" | "delivery" | "estimate" | "invoice" | "other";
  status: "pending" | "confirmed" | "completed" | "cancelled";
  clientId?: number;
  projectId?: number;
  agentId?: number;
  notes?: string;
  client?: {
    id: number;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  project?: {
    id: number;
    title: string;
  };
  agent?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

export interface EventInput {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  type: "meeting" | "site-visit" | "delivery" | "estimate" | "invoice" | "other";
  status: "pending" | "confirmed" | "completed" | "cancelled";
  clientId?: number;
  projectId?: number;
  agentId?: number;
  notes?: string;
}

export function useEvents() {
  // Obtener todos los eventos
  const getEvents = () => {
    return useQuery<Event[]>({
      queryKey: ["/api/protected/events"],
      staleTime: 30000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes (renamed from cacheTime in v5)
      refetchOnWindowFocus: false,
      retry: 2,
    });
  };

  // Obtener un evento específico
  const getEvent = (id: number) => {
    return useQuery<Event>({
      queryKey: ["/api/protected/events", id],
      queryFn: async () => {
        const res = await apiRequest("GET", `/api/protected/events/${id}`);
        return await res.json();
      },
      enabled: !!id,
    });
  };

  // Crear un nuevo evento
  const createEventMutation = useMutation({
    mutationFn: async (data: EventInput) => {
      try {
        console.log("Sending data to create event:", JSON.stringify(data, null, 2));
        const res = await apiRequest("POST", "/api/protected/events", data);
        if (!res.ok) {
          const error = await res.json();
          console.error("Error creating event:", error);
          throw new Error(
            error.errors ? 
              JSON.stringify(error.errors, null, 2) : 
              (error.message || "Error creating event")
          );
        }
        return await res.json();
      } catch (error: any) {
        console.error("Exception creating event:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Event created",
        description: "The event has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/protected/events"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Could not create the event: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update an existing event
  const updateEventMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<EventInput> }) => {
      const res = await apiRequest("PATCH", `/api/protected/events/${id}`, data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error updating the event");
      }
      return await res.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Event updated",
        description: "The event has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/protected/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/protected/events", variables.id] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Could not update the event: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete an event
  const deleteEventMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/protected/events/${id}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error deleting the event");
      }
      return id;
    },
    onSuccess: () => {
      toast({
        title: "Event deleted",
        description: "The event has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/protected/events"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Could not delete the event: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Cancel an event (set status to cancelled)
  const cancelEventMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/protected/events/${id}`, { status: "cancelled" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error cancelling the event");
      }
      return await res.json();
    },
    onSuccess: (updatedEvent, id) => {
      toast({
        title: "Event cancelled",
        description: "The event has been cancelled successfully",
      });
      
      // Remove the cancelled event from cache immediately
      queryClient.setQueryData(["/api/protected/events"], (oldData: Event[]) => {
        if (!oldData) return oldData;
        return oldData.filter(event => event.id !== id);
      });
      
      // Remove individual event cache
      queryClient.removeQueries({ queryKey: ["/api/protected/events", id] });
      
      // Force refresh to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["/api/protected/events"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Could not cancel the event: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Search events for today
  const getTodayEvents = () => {
    const { data: events = [] } = getEvents();
    
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    return events.filter(event => {
      const eventDate = parseISO(event.startTime);
      return eventDate >= todayStart && eventDate <= todayEnd;
    });
  };

  // Formatear un evento para la visualización
  const formatEvent = (event: Event) => {
    const startTime = parseISO(event.startTime);
    const formattedTime = format(startTime, "h:mm a");
    
    let timeColor = "bg-blue-100 text-blue-800";
    switch (event.type) {
      case "site-visit":
        timeColor = "bg-blue-100 text-blue-800";
        break;
      case "delivery":
        timeColor = "bg-green-100 text-green-800";
        break;
      case "estimate":
        timeColor = "bg-purple-100 text-purple-800";
        break;
      case "invoice":
        timeColor = "bg-yellow-100 text-yellow-800";
        break;
      case "meeting":
        timeColor = "bg-indigo-100 text-indigo-800";
        break;
      default:
        timeColor = "bg-gray-100 text-gray-800";
    }
    
    return {
      id: String(event.id),
      title: event.title,
      date: startTime,
      time: formattedTime,
      timeColor,
      location: [event.address, event.city, event.state, event.zip].filter(Boolean).join(', ') || "Not specified",
      type: event.type,
      status: event.status,
      contact: event.client ? {
        name: `${event.client.firstName} ${event.client.lastName}`,
        initials: `${event.client.firstName[0]}${event.client.lastName[0]}`,
        id: event.client.id
      } : undefined,
      clientId: event.clientId,
      projectId: event.projectId,
      description: event.description
    };
  };

  return {
    getEvents,
    getEvent,
    createEventMutation,
    updateEventMutation,
    deleteEventMutation,
    cancelEventMutation,
    getTodayEvents,
    formatEvent,
    createEvent: createEventMutation.mutateAsync,
    updateEvent: updateEventMutation.mutateAsync,
    deleteEvent: deleteEventMutation.mutateAsync
  };
}