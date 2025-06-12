import { useState } from "react";
import { 
  Send, 
  Mail, 
  MessageSquare, 
  User, 
  Calendar, 
  AlertCircle,
  CheckCircle,
  Eye,
  Reply
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
import Sidebar from "@/components/layout/sidebar";
import MobileSidebar from "@/components/layout/mobile-sidebar";
import PageHeader from "@/components/shared/page-header";
import { useClients } from "@/hooks/use-clients";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  clientId: string;
  subject: string;
  message: string;
  messageType: string;
  priority: string;
  sendEmail: boolean;
}

export default function ClientMessagesPage() {
  const [isMessageFormOpen, setIsMessageFormOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ClientMessage | null>(null);
  const [isMessageDetailOpen, setIsMessageDetailOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { clients } = useClients();

  // Fetch client messages
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ["/api/protected/client-messages"],
  });

  // Create message mutation
  const createMessageMutation = useMutation({
    mutationFn: async (data: MessageFormData) => {
      const response = await apiRequest("POST", "/api/protected/client-messages", {
        ...data,
        clientId: Number(data.clientId),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/client-messages"] });
      setIsMessageFormOpen(false);
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully.",
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
      case "urgent": return "text-red-600 bg-red-50";
      case "high": return "text-orange-600 bg-orange-50";
      case "normal": return "text-blue-600 bg-blue-50";
      case "low": return "text-gray-600 bg-gray-50";
      default: return "text-blue-600 bg-blue-50";
    }
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case "urgent": return "text-red-600 bg-red-50";
      case "project_update": return "text-green-600 bg-green-50";
      case "estimate": return "text-blue-600 bg-blue-50";
      case "invoice": return "text-purple-600 bg-purple-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <MobileSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          <PageHeader 
            title="Client Messages"
            subtitle="Send messages and communicate with your clients"
            actions={
              <Button onClick={() => setIsMessageFormOpen(true)}>
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            }
          />

          <div className="grid grid-cols-1 gap-6">
            {/* Messages List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Recent Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingMessages ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : messages.length > 0 ? (
                  <div className="space-y-4">
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
                              <User className="h-4 w-4 text-gray-500" />
                              <span className="font-medium">
                                {message.client?.firstName} {message.client?.lastName}
                              </span>
                              <Badge className={getPriorityColor(message.priority)}>
                                {message.priority}
                              </Badge>
                              <Badge className={getMessageTypeColor(message.messageType)}>
                                {message.messageType.replace('_', ' ')}
                              </Badge>
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {message.subject}
                            </h3>
                            <p className="text-gray-600 text-sm line-clamp-2">
                              {message.message}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
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
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-blue-500" />
                            )}
                            <Eye className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No messages yet
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Start communicating with your clients by sending your first message.
                    </p>
                    <Button onClick={() => setIsMessageFormOpen(true)}>
                      <Send className="h-4 w-4 mr-2" />
                      Send First Message
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Send Message Dialog */}
      <Dialog open={isMessageFormOpen} onOpenChange={setIsMessageFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Message to Client</DialogTitle>
          </DialogHeader>
          <MessageForm
            clients={clients}
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
  clients, 
  onSubmit, 
  isLoading 
}: { 
  clients: any[], 
  onSubmit: (data: MessageFormData) => void,
  isLoading: boolean
}) {
  const [formData, setFormData] = useState<MessageFormData>({
    clientId: "",
    subject: "",
    message: "",
    messageType: "general",
    priority: "normal",
    sendEmail: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId || !formData.subject || !formData.message) return;
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="client">Select Client</Label>
        <Select 
          value={formData.clientId} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, clientId: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose a client" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id.toString()}>
                {client.firstName} {client.lastName} - {client.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
          <User className="h-5 w-5 text-gray-500" />
          <span className="font-semibold">
            {message.client?.firstName} {message.client?.lastName}
          </span>
          <Badge className={getPriorityColor(message.priority)}>
            {message.priority}
          </Badge>
        </div>
        <div className="text-sm text-gray-500">
          {new Date(message.createdAt).toLocaleString()}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-lg mb-2">{message.subject}</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="whitespace-pre-wrap">{message.message}</p>
        </div>
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
    case "urgent": return "text-red-600 bg-red-50";
    case "high": return "text-orange-600 bg-orange-50";
    case "normal": return "text-blue-600 bg-blue-50";
    case "low": return "text-gray-600 bg-gray-50";
    default: return "text-blue-600 bg-blue-50";
  }
}