import { useState } from "react";
import { 
  Send, 
  MessageSquare, 
  Clock,
  AlertCircle,
  CheckCircle,
  Mail,
  Plus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface ClientMessage {
  id: number;
  contractorId: number;
  clientId: number;
  subject: string;
  message: string;
  messageType: string;
  priority: string;
  isRead: boolean;
  readAt?: string;
  sentViaEmail: boolean;
  emailSentAt?: string;
  createdAt: string;
  client?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface MessageFormData {
  subject: string;
  message: string;
  messageType: string;
  priority: string;
  sendEmail: boolean;
}

interface ClientMessagingProps {
  clientId: number;
  clientName: string;
}

export default function ClientMessaging({ clientId, clientName }: ClientMessagingProps) {
  const [isMessageFormOpen, setIsMessageFormOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ClientMessage | null>(null);
  const [isMessageDetailOpen, setIsMessageDetailOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch client messages for this specific client
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ["/api/protected/client-messages", clientId],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/protected/client-messages");
      const allMessages = await response.json();
      // Filter messages for this specific client
      return allMessages.filter((message: ClientMessage) => message.clientId === clientId);
    }
  });

  // Create message mutation
  const createMessageMutation = useMutation({
    mutationFn: async (data: MessageFormData) => {
      const response = await apiRequest("POST", "/api/protected/client-messages", {
        ...data,
        clientId: clientId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/client-messages"] });
      setIsMessageFormOpen(false);
      toast({
        title: "Message Sent",
        description: `Message sent to ${clientName} successfully.`,
      });
    },
    onError: () => {
      toast({
        title: "Send Failed",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const response = await apiRequest("PATCH", `/api/protected/client-messages/${messageId}/read`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/client-messages"] });
    },
  });

  const handleSendMessage = (data: MessageFormData) => {
    createMessageMutation.mutate(data);
  };

  const handleViewMessage = (message: ClientMessage) => {
    setSelectedMessage(message);
    setIsMessageDetailOpen(true);
    if (!message.isRead) {
      markAsReadMutation.mutate(message.id);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "normal": return "bg-blue-100 text-blue-800";
      case "low": return "bg-gray-100 text-gray-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case "urgent": return "bg-red-100 text-red-800";
      case "project_update": return "bg-green-100 text-green-800";
      case "estimate": return "bg-blue-100 text-blue-800";
      case "invoice": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Send Message Button */}
      <div className="flex justify-between items-center">
        <div>
          <h5 className="font-medium text-gray-900">Communication with {clientName}</h5>
          <p className="text-sm text-gray-600">Send messages and updates to your client</p>
        </div>
        <Button 
          size="sm" 
          onClick={() => setIsMessageFormOpen(true)}
          className="flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Send Message
        </Button>
      </div>

      {/* Messages List */}
      {isLoadingMessages ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : messages.length > 0 ? (
        <div className="space-y-3">
          {messages.map((message: ClientMessage) => (
            <div
              key={message.id}
              className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                !message.isRead ? "bg-blue-50 border-blue-200" : "bg-white"
              }`}
              onClick={() => handleViewMessage(message)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h6 className="font-medium text-gray-900">{message.subject}</h6>
                    <Badge className={getPriorityColor(message.priority)}>
                      {message.priority}
                    </Badge>
                    <Badge className={getMessageTypeColor(message.messageType)}>
                      {message.messageType.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {message.message}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(message.createdAt).toLocaleDateString()}
                    </span>
                    {message.sentViaEmail && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        Email sent
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {message.isRead ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-blue-500" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border border-dashed rounded-lg">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No messages yet
          </h3>
          <p className="text-gray-500 mb-4">
            Start communicating with {clientName} by sending your first message.
          </p>
          <Button onClick={() => setIsMessageFormOpen(true)}>
            <Send className="h-4 w-4 mr-2" />
            Send First Message
          </Button>
        </div>
      )}

      {/* Send Message Dialog */}
      <Dialog open={isMessageFormOpen} onOpenChange={setIsMessageFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Message to {clientName}</DialogTitle>
          </DialogHeader>
          <MessageForm
            onSubmit={handleSendMessage}
            isLoading={createMessageMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Message Detail Dialog */}
      <Dialog open={isMessageDetailOpen} onOpenChange={setIsMessageDetailOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Message Details</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <MessageDetail message={selectedMessage} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Message Form Component
function MessageForm({ 
  onSubmit, 
  isLoading 
}: { 
  onSubmit: (data: MessageFormData) => void,
  isLoading: boolean
}) {
  const [formData, setFormData] = useState<MessageFormData>({
    subject: "",
    message: "",
    messageType: "general",
    priority: "normal",
    sendEmail: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject || !formData.message) return;
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="messageType">Message Type</Label>
          <Select 
            value={formData.messageType} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, messageType: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="project_update">Project Update</SelectItem>
              <SelectItem value="estimate">Estimate</SelectItem>
              <SelectItem value="invoice">Invoice</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select 
            value={formData.priority} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="subject">Subject</Label>
        <Input
          id="subject"
          value={formData.subject}
          onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
          placeholder="Enter message subject"
          required
        />
      </div>

      <div>
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          value={formData.message}
          onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
          placeholder="Type your message here..."
          rows={6}
          required
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="sendEmail"
          checked={formData.sendEmail}
          onChange={(e) => setFormData(prev => ({ ...prev, sendEmail: e.target.checked }))}
          className="rounded"
        />
        <Label htmlFor="sendEmail">Send email notification to client</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Send Message
        </Button>
      </div>
    </form>
  );
}

// Message Detail Component
function MessageDetail({ message }: { message: ClientMessage }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">{message.subject}</h3>
          <Badge className={getPriorityColor(message.priority)}>
            {message.priority}
          </Badge>
        </div>
        <div className="text-sm text-gray-500">
          {new Date(message.createdAt).toLocaleString()}
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="whitespace-pre-wrap">{message.message}</p>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <MessageSquare className="h-4 w-4" />
          {message.messageType.replace('_', ' ')}
        </span>
        {message.sentViaEmail && (
          <span className="flex items-center gap-1">
            <Mail className="h-4 w-4" />
            Email sent
          </span>
        )}
        {message.isRead && (
          <span className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4" />
            Read
          </span>
        )}
      </div>
    </div>
  );
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case "urgent": return "bg-red-100 text-red-800";
    case "high": return "bg-orange-100 text-orange-800";
    case "normal": return "bg-blue-100 text-blue-800";
    case "low": return "bg-gray-100 text-gray-800";
    default: return "bg-blue-100 text-blue-800";
  }
}