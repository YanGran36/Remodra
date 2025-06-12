import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SimpleEventForm from "@/components/events/simple-event-form";
import EventForm from "@/components/events/event-form";
import { Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface EventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  eventId?: number;
  defaultClientId?: string;
  defaultProjectId?: string;
  defaultType?: string;
}

export default function EventDialog({
  isOpen,
  onClose,
  eventId,
  defaultClientId,
  defaultProjectId,
  defaultType,
}: EventDialogProps) {
  // If there's an eventId, we fetch the event information
  const { isLoading } = useQuery({
    queryKey: ["/api/protected/events", eventId],
    enabled: !!eventId && isOpen,
  });

  const queryClient = useQueryClient();
  
  const handleSuccess = () => {
    // Force refresh events list to ensure cancelled events are removed
    queryClient.invalidateQueries({ queryKey: ["/api/protected/events"] });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{eventId ? "Edit Event" : "New Event"}</DialogTitle>
          <DialogDescription>
            {eventId ? "Edit appointment details, reassign agents, or change event type" : "Create a new appointment"}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <EventForm
            eventId={eventId}
            onSuccess={handleSuccess}
            onCancel={onClose}
            defaultClientId={defaultClientId}
            defaultProjectId={defaultProjectId}
            defaultType={defaultType}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}