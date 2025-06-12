import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, User, Plus, MapPin, Phone, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Agent, Estimate, Client } from '@shared/schema';

interface AgentScheduleProps {
  selectedDate: string;
}

interface ScheduleData {
  date: string;
  schedule: {
    agent: Agent;
    estimates: (Estimate & { client: Client })[];
    totalHours: number;
    isAvailable: boolean;
  }[];
  totalEstimates: number;
  unassignedEstimates: (Estimate & { client: Client })[];
}

interface AssignEstimateData {
  estimateId: number;
  agentId: number;
  appointmentDate: string;
  appointmentDuration: number;
}

const AgentScheduler: React.FC<AgentScheduleProps> = ({ selectedDate }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null);
  const [appointmentTime, setAppointmentTime] = useState('09:00');
  const [appointmentDuration, setAppointmentDuration] = useState(60);

  // Fetch agents
  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ['/api/protected/agents'],
  });

  // Fetch schedule for selected date
  const { data: scheduleData, isLoading: isLoadingSchedule } = useQuery<ScheduleData>({
    queryKey: ['/api/protected/agents/schedule', selectedDate],
    enabled: !!selectedDate,
  });

  // Fetch all estimates for assignment
  const { data: estimates = [] } = useQuery<(Estimate & { client: Client })[]>({
    queryKey: ['/api/protected/estimates'],
  });

  // Assign estimate mutation
  const assignEstimateMutation = useMutation({
    mutationFn: async (data: AssignEstimateData) => {
      const response = await fetch('/api/protected/agents/assign-estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...data,
          appointmentDate: `${selectedDate}T${appointmentTime}:00.000Z`
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to assign estimate');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Estimate Assigned",
        description: "The estimate has been successfully assigned to the agent.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/protected/agents/schedule'] });
      queryClient.invalidateQueries({ queryKey: ['/api/protected/estimates'] });
      setShowAssignDialog(false);
      setSelectedEstimate(null);
      setSelectedAgent(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Assignment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAssignEstimate = () => {
    if (!selectedEstimate || !selectedAgent) {
      toast({
        title: "Missing Information",
        description: "Please select both an estimate and an agent.",
        variant: "destructive",
      });
      return;
    }

    assignEstimateMutation.mutate({
      estimateId: selectedEstimate.id,
      agentId: selectedAgent,
      appointmentDate: `${selectedDate}T${appointmentTime}:00.000Z`,
      appointmentDuration,
    });
  };

  // Get unassigned estimates that can be assigned to agents
  const unassignedEstimates = estimates.filter(estimate => 
    !estimate.agentId && 
    (estimate.status === 'draft' || estimate.status === 'sent' || estimate.status === 'pending')
  );

  if (isLoadingSchedule) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Agent Schedule</h2>
          <Badge variant="outline">{new Date(selectedDate).toLocaleDateString()}</Badge>
        </div>
        <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Assign Estimate
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Estimate to Agent</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Debug info */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Available estimates:</strong> {unassignedEstimates.length} unassigned / {estimates.length} total
                </p>
                {estimates.length > 0 && (
                  <div className="mt-2 text-xs text-blue-700">
                    All estimates: {estimates.map(e => `${e.estimateNumber}(${e.status}${e.agentId ? ',assigned' : ',unassigned'})`).join(', ')}
                  </div>
                )}
                {unassignedEstimates.length > 0 && (
                  <div className="mt-1 text-xs text-green-700">
                    Ready to assign: {unassignedEstimates.map(e => e.estimateNumber).join(', ')}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="estimate">Select Estimate</Label>
                <Select
                  value={selectedEstimate?.id.toString() || ''}
                  onValueChange={(value) => {
                    const estimate = unassignedEstimates.find(e => e.id.toString() === value);
                    setSelectedEstimate(estimate || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an estimate" />
                  </SelectTrigger>
                  <SelectContent>
                    {unassignedEstimates.map((estimate) => (
                      <SelectItem key={estimate.id} value={estimate.id.toString()}>
                        {estimate.estimateNumber} - {estimate.client.firstName} {estimate.client.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="agent">Select Agent</Label>
                <Select
                  value={selectedAgent?.toString() || ''}
                  onValueChange={(value) => setSelectedAgent(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.filter(agent => agent.isActive).map((agent) => (
                      <SelectItem key={agent.id} value={agent.id.toString()}>
                        {agent.firstName} {agent.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="time">Appointment Time</Label>
                  <Select
                    value={appointmentTime}
                    onValueChange={(value) => setAppointmentTime(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="08:00">8:00 AM</SelectItem>
                      <SelectItem value="08:30">8:30 AM</SelectItem>
                      <SelectItem value="09:00">9:00 AM</SelectItem>
                      <SelectItem value="09:30">9:30 AM</SelectItem>
                      <SelectItem value="10:00">10:00 AM</SelectItem>
                      <SelectItem value="10:30">10:30 AM</SelectItem>
                      <SelectItem value="11:00">11:00 AM</SelectItem>
                      <SelectItem value="11:30">11:30 AM</SelectItem>
                      <SelectItem value="12:00">12:00 PM</SelectItem>
                      <SelectItem value="12:30">12:30 PM</SelectItem>
                      <SelectItem value="13:00">1:00 PM</SelectItem>
                      <SelectItem value="13:30">1:30 PM</SelectItem>
                      <SelectItem value="14:00">2:00 PM</SelectItem>
                      <SelectItem value="14:30">2:30 PM</SelectItem>
                      <SelectItem value="15:00">3:00 PM</SelectItem>
                      <SelectItem value="15:30">3:30 PM</SelectItem>
                      <SelectItem value="16:00">4:00 PM</SelectItem>
                      <SelectItem value="16:30">4:30 PM</SelectItem>
                      <SelectItem value="17:00">5:00 PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="duration">Duration</Label>
                  <Select
                    value={appointmentDuration.toString()}
                    onValueChange={(value) => setAppointmentDuration(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="90">1.5 hours</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                      <SelectItem value="180">3 hours</SelectItem>
                      <SelectItem value="240">4 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleAssignEstimate} 
                className="w-full"
                disabled={assignEstimateMutation.isPending}
              >
                {assignEstimateMutation.isPending ? 'Assigning...' : 'Assign Estimate'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Schedule Overview */}
      <div className="grid gap-4">
        {scheduleData?.schedule?.map((agentSchedule) => (
          <Card key={agentSchedule.agent.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {agentSchedule.agent.firstName} {agentSchedule.agent.lastName}
                    </CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      {agentSchedule.agent.phone && (
                        <div className="flex items-center space-x-1">
                          <Phone className="h-3 w-3" />
                          <span>{agentSchedule.agent.phone}</span>
                        </div>
                      )}
                      {agentSchedule.agent.email && (
                        <div className="flex items-center space-x-1">
                          <Mail className="h-3 w-3" />
                          <span>{agentSchedule.agent.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={agentSchedule.isAvailable ? "secondary" : "default"}>
                    {agentSchedule.isAvailable ? 'Available' : `${agentSchedule.totalHours.toFixed(1)}h booked`}
                  </Badge>
                  {agentSchedule.agent.role !== 'field_agent' && (
                    <Badge variant="outline">{agentSchedule.agent.role.replace('_', ' ')}</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            
            {agentSchedule.estimates.length > 0 && (
              <CardContent>
                <div className="space-y-3">
                  {agentSchedule.estimates.map((estimate) => (
                    <div key={estimate.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {new Date(estimate.appointmentDate!).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{estimate.estimateNumber}</div>
                          <div className="text-sm text-muted-foreground">
                            {estimate.client.firstName} {estimate.client.lastName}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          {estimate.appointmentDuration || 60} min
                        </Badge>
                        <Badge variant={
                          estimate.status === 'draft' ? 'secondary' : 
                          estimate.status === 'sent' ? 'default' : 
                          estimate.status === 'accepted' ? 'default' : 'secondary'
                        }>
                          {estimate.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Unassigned Estimates */}
      {scheduleData?.unassignedEstimates && scheduleData.unassignedEstimates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-amber-600">Unassigned Estimates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {scheduleData.unassignedEstimates.map((estimate) => (
                <div key={estimate.id} className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div>
                    <div className="font-medium">{estimate.estimateNumber}</div>
                    <div className="text-sm text-muted-foreground">
                      {estimate.client.firstName} {estimate.client.lastName}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{estimate.status}</Badge>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        setSelectedEstimate(estimate);
                        setShowAssignDialog(true);
                      }}
                    >
                      Assign Agent
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{agents.filter(a => a.isActive).length}</div>
              <div className="text-sm text-muted-foreground">Active Agents</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{scheduleData?.totalEstimates || 0}</div>
              <div className="text-sm text-muted-foreground">Scheduled Estimates</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-600">{scheduleData?.unassignedEstimates?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Unassigned</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentScheduler;