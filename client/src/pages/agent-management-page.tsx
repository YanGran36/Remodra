import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Calendar, User, Phone, Mail, MapPin, Home } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Agent, AgentInsert } from '@shared/schema';
import AgentScheduler from '@/components/agents/AgentScheduler';
import { Link } from 'wouter';

const AgentManagementPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAgentDialog, setShowAgentDialog] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Form state
  const [formData, setFormData] = useState<any>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    employeeId: '',
    role: 'field_agent',
    isActive: true,
    specialties: [],
    hourlyRate: '',
    commissionRate: '',
    hireDate: '',
    notes: '',
    colorCode: '#3B82F6'
  });

  // Predefined color options for agents
  const colorOptions = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Orange', value: '#F59E0B' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Cyan', value: '#06B6D4' },
    { name: 'Lime', value: '#84CC16' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Indigo', value: '#6366F1' },
    { name: 'Yellow', value: '#EAB308' },
    { name: 'Teal', value: '#14B8A6' },
    { name: 'Rose', value: '#F43F5E' }
  ];

  // Fetch agents
  const { data: agents = [], isLoading } = useQuery<Agent[]>({
    queryKey: ['/api/protected/agents'],
  });

  // Create agent mutation
  const createAgentMutation = useMutation({
    mutationFn: async (agentData: Partial<AgentInsert>) => {
      const response = await fetch('/api/protected/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(agentData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create agent');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Agent Created",
        description: "The agent has been successfully created.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/protected/agents'] });
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update agent mutation
  const updateAgentMutation = useMutation({
    mutationFn: async ({ id, ...agentData }: Partial<AgentInsert> & { id: number }) => {
      const response = await fetch(`/api/protected/agents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(agentData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update agent');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Agent Updated",
        description: "The agent has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/protected/agents'] });
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete agent mutation
  const deleteAgentMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/protected/agents/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete agent');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Agent Deleted",
        description: "The agent has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/protected/agents'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Deletion Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      employeeId: '',
      role: 'field_agent',
      isActive: true,
      specialties: [],
      hourlyRate: '',
      commissionRate: '',
      hireDate: '',
      notes: '',
      colorCode: '#3B82F6'
    });
    setEditingAgent(null);
    setShowAgentDialog(false);
  };

  const handleEditAgent = (agent: Agent) => {
    setFormData({
      firstName: agent.firstName,
      lastName: agent.lastName,
      email: agent.email || '',
      phone: agent.phone,
      employeeId: agent.employeeId || '',
      role: agent.role,
      isActive: agent.isActive,
      specialties: agent.specialties as string[],
      hourlyRate: agent.hourlyRate ? agent.hourlyRate.toString() : undefined,
      commissionRate: agent.commissionRate ? agent.commissionRate.toString() : undefined,
      hireDate: agent.hireDate || undefined,
      notes: agent.notes || '',
      colorCode: agent.colorCode || '#3B82F6'
    });
    setEditingAgent(agent);
    setShowAgentDialog(true);
  };

  const handleSubmit = () => {
    if (!formData.firstName || !formData.lastName || !formData.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (editingAgent) {
      updateAgentMutation.mutate({ ...formData, id: editingAgent.id } as any);
    } else {
      createAgentMutation.mutate(formData);
    }
  };

  const handleDeleteAgent = (agent: Agent) => {
    if (window.confirm(`Are you sure you want to delete ${agent.firstName} ${agent.lastName}?`)) {
      deleteAgentMutation.mutate(agent.id);
    }
  };

  const specialtyOptions = [
    'fencing', 'roofing', 'siding', 'gutters', 'windows', 'doors', 
    'flooring', 'painting', 'electrical', 'plumbing', 'hvac'
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Agent Management</h1>
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Home
              </Button>
            </Link>
            <Link href="/calendar">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Calendar
              </Button>
            </Link>
          </div>
        </div>
        <Dialog open={showAgentDialog} onOpenChange={setShowAgentDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Agent
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAgent ? 'Edit Agent' : 'Add New Agent'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="employeeId">Employee ID</Label>
                  <Input
                    id="employeeId"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                    placeholder="EMP001"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({...formData, role: value as any})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="field_agent">Field Agent</SelectItem>
                      <SelectItem value="senior_agent">Senior Agent</SelectItem>
                      <SelectItem value="lead_estimator">Lead Estimator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    step="0.01"
                    value={formData.hourlyRate || ''}
                    onChange={(e) => setFormData({...formData, hourlyRate: e.target.value})}
                    placeholder="25.00"
                  />
                </div>
                <div>
                  <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                  <Input
                    id="commissionRate"
                    type="number"
                    step="0.01"
                    value={formData.commissionRate || ''}
                    onChange={(e) => setFormData({...formData, commissionRate: e.target.value})}
                    placeholder="5.00"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="hireDate">Hire Date</Label>
                <Input
                  id="hireDate"
                  type="date"
                  value={formData.hireDate || ''}
                  onChange={(e) => setFormData({...formData, hireDate: e.target.value || undefined})}
                />
              </div>

              <div>
                <Label htmlFor="colorCode">Calendar Color</Label>
                <div className="grid grid-cols-6 gap-2 mt-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-105 ${
                        formData.colorCode === color.value 
                          ? 'border-gray-900 ring-2 ring-gray-300' 
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setFormData({...formData, colorCode: color.value})}
                      title={color.name}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div 
                    className="w-4 h-4 rounded-full border border-gray-300" 
                    style={{ backgroundColor: formData.colorCode }}
                  />
                  <span className="text-sm text-gray-600">
                    Selected: {colorOptions.find(c => c.value === formData.colorCode)?.name || 'Custom'}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                />
                <Label htmlFor="isActive">Active Agent</Label>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Additional notes about the agent..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={createAgentMutation.isPending || updateAgentMutation.isPending}
                >
                  {editingAgent ? 'Update Agent' : 'Create Agent'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="agents" className="space-y-6">
        <TabsList>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="schedule">Daily Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-6">
          <div className="grid gap-6">
            {agents.map((agent) => (
              <Card key={agent.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div 
                          className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: agent.colorCode || '#3B82F6' }}
                          title="Calendar Color"
                        />
                      </div>
                      <div>
                        <CardTitle className="text-xl">
                          {agent.firstName} {agent.lastName}
                        </CardTitle>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          {agent.phone && (
                            <div className="flex items-center space-x-1">
                              <Phone className="h-3 w-3" />
                              <span>{agent.phone}</span>
                            </div>
                          )}
                          {agent.email && (
                            <div className="flex items-center space-x-1">
                              <Mail className="h-3 w-3" />
                              <span>{agent.email}</span>
                            </div>
                          )}
                          {agent.employeeId && (
                            <Badge variant="outline">ID: {agent.employeeId}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={agent.isActive ? "default" : "secondary"}>
                        {agent.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline">
                        {agent.role.replace('_', ' ')}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditAgent(agent)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteAgent(agent)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {agent.hourlyRate && (
                      <div>
                        <div className="text-muted-foreground">Hourly Rate</div>
                        <div className="font-medium">${Number(agent.hourlyRate).toFixed(2)}/hr</div>
                      </div>
                    )}
                    {agent.commissionRate && (
                      <div>
                        <div className="text-muted-foreground">Commission</div>
                        <div className="font-medium">{Number(agent.commissionRate).toFixed(1)}%</div>
                      </div>
                    )}
                    {agent.hireDate && (
                      <div>
                        <div className="text-muted-foreground">Hire Date</div>
                        <div className="font-medium">{new Date(agent.hireDate).toLocaleDateString()}</div>
                      </div>
                    )}
                    <div>
                      <div className="text-muted-foreground">Created</div>
                      <div className="font-medium">{new Date(agent.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  
                  {agent.notes && (
                    <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Notes</div>
                      <div className="text-sm">{agent.notes}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {agents.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Agents Found</h3>
                <p className="text-muted-foreground mb-4">
                  Get started by adding your first field agent to handle estimates.
                </p>
                <Button onClick={() => setShowAgentDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Agent
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <div className="flex items-center space-x-4">
            <Label htmlFor="scheduleDate">Select Date:</Label>
            <Input
              id="scheduleDate"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
          </div>
          
          <AgentScheduler selectedDate={selectedDate} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgentManagementPage;