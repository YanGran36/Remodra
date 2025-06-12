import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parseISO, addHours } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { TimePicker } from "@/components/ui/time-picker";
import { useEvents } from "@/hooks/use-events";
import { apiRequest } from "@/lib/queryClient";
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

// Simple validation schema for rescheduling only
const formSchema = z.object({
  date: z.date(),
  startTime: z.string().min(1, "Please select a start time"),
  endTime: z.string().min(1, "Please select an end time"),
});

type FormValues = z.infer<typeof formSchema>;

interface SimpleEventFormProps {
  eventId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function SimpleEventForm({
  eventId,
  onSuccess,
  onCancel,
}: SimpleEventFormProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  const { updateEventMutation, cancelEventMutation } = useEvents();
  
  // Query the specific event
  const { data: eventData, isLoading: isLoadingEvent } = useQuery({
    queryKey: ["/api/protected/events", eventId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/protected/events/${eventId}`);
      return await response.json();
    },
    enabled: !!eventId,
  });

  // Configure the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      startTime: format(new Date(), "h:mm a"),
      endTime: format(addHours(new Date(), 1), "h:mm a"),
    },
  });

  // Update form values when event data is loaded
  useEffect(() => {
    if (eventData && !isLoadingEvent && eventData.startTime && eventData.endTime) {
      const startDate = parseISO(eventData.startTime);
      const endDate = parseISO(eventData.endTime);
      
      form.reset({
        date: startDate,
        startTime: format(startDate, "h:mm a"),
        endTime: format(endDate, "h:mm a"),
      });
      
      setDate(startDate);
    }
  }, [eventData, isLoadingEvent, form]);

  // Handle form submission (reschedule)
  const onSubmit = async (values: FormValues) => {
    const { date, startTime, endTime } = values;
    
    // Parse time strings
    const parseTime = (timeStr: string) => {
      const parts = timeStr.split(/[:\s]/);
      let hour = parseInt(parts[0] || "0");
      const minute = parseInt(parts[1] || "0");
      const period = parts[2]?.toUpperCase();
      
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      
      return { hour, minute };
    };
    
    const startParsed = parseTime(startTime);
    const endParsed = parseTime(endTime);
    
    const startDate = new Date(date);
    startDate.setHours(startParsed.hour, startParsed.minute, 0);
    
    const endDate = new Date(date);
    endDate.setHours(endParsed.hour, endParsed.minute, 0);
    
    const updateData = {
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
    };
    
    try {
      await updateEventMutation.mutateAsync({ id: eventId, data: updateData });
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error updating event:", error);
    }
  };

  // Handle cancel event
  const handleCancelEvent = async () => {
    try {
      await cancelEventMutation.mutateAsync(eventId);
      // Close dialog immediately after cancellation
      onCancel?.();
    } catch (error) {
      console.error("Error cancelling event:", error);
    }
  };

  if (isLoadingEvent) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading event...</span>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Event info display */}
        {eventData && (
          <div className="text-sm text-gray-600 mb-4">
            <div className="font-medium text-gray-900">{eventData.title}</div>
            {eventData.client && (
              <div>Client: {eventData.client.firstName} {eventData.client.lastName}</div>
            )}
            {eventData.location && <div>Location: {eventData.location}</div>}
          </div>
        )}

        {/* Date picker */}
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Reschedule Date</FormLabel>
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
        
        {/* Time pickers */}
        <div className="grid grid-cols-2 gap-4">
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
        
        {/* Action buttons */}
        <div className="flex justify-between pt-4">
          <div className="flex gap-3">
            {eventData?.status !== "cancelled" && (
              <AlertDialog>
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
                      Are you sure you want to cancel this event? This action cannot be undone and the event will be removed from the calendar.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>No, Keep Event</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancelEvent}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Yes, Cancel Event
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
              disabled={updateEventMutation.isPending}
            >
              {updateEventMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Reschedule Event
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}