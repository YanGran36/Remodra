import { useState, useRef, useCallback, useEffect } from "react";
import SimpleChat from "@/components/SimpleChat";
import { useParams, useLocation } from "wouter";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { 
  FileText, 
  Receipt, 
  Calendar, 
  MessageCircle,
  Clock,
  DollarSign,
  User,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  AlertCircle,
  Download,
  Eye,
  Send,
  ArrowLeft,
  Building,
  Activity
} from "lucide-react";

// Client Portal Component
export default function ClientPortal() {
  const { clientId } = useParams<{ clientId: string }>();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Real client information from database
  const [clientInfo, setClientInfo] = useState<any>(null);
  const [clientProjects, setClientProjects] = useState<any[]>([]);
  const [clientEstimates, setClientEstimates] = useState<any[]>([]);
  const [clientInvoices, setClientInvoices] = useState<any[]>([]);
  const [clientAppointments, setClientAppointments] = useState<any[]>([]);
  const [agentInfo, setAgentInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    const fetchClientData = async () => {
      try {
        const response = await fetch(`/api/client-portal/${clientId}/data`);
        if (response.ok) {
          const data = await response.json();
          setClientInfo(data.client);
          setClientProjects(data.projects || []);
          setClientEstimates(data.estimates || []);
          setClientInvoices(data.invoices || []);
          setClientAppointments(data.appointments || []);
          setAgentInfo(data.agent);
        }
      } catch (error) {
        console.error('Error fetching client data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (clientId) {
      fetchClientData();
    }
  }, [clientId]);

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading...</p>
      </div>
    </div>;
  }

  if (!clientInfo) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Client not found</p>
      </div>
    </div>;
  }

  // Use real data from database
  const projects = clientProjects;
  const estimates = clientEstimates;
  const invoices = clientInvoices;
  const appointments = clientAppointments;

  const handleViewEstimate = (estimateId: string) => {
    window.open(`/public/estimates/${estimateId}`, '_blank');
  };

  const handleViewInvoice = (invoiceId: string) => {
    window.open(`/public/invoices/${invoiceId}`, '_blank');
  };

  const handleApproveEstimate = (estimateId: string) => {
    alert(`Estimate ${estimateId} approved! You will be redirected to contract signing.`);
  };

  const handlePayInvoice = (invoiceId: string) => {
    alert(`Redirecting to payment portal for invoice ${invoiceId}`);
  };

  const handleRescheduleAppointment = (appointmentId: number) => {
    alert(`Rescheduling appointment ${appointmentId}. A calendar will open.`);
  };



  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'paid':
      case 'completed':
        return <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg border-0">{status}</Badge>;
      case 'pending':
      case 'scheduled':
        return <Badge className="bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-lg border-0">{status}</Badge>;
      case 'in progress':
        return <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg border-0">{status}</Badge>;
      default:
        return <Badge className="bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-lg border-0">{status}</Badge>;
    }
  };

  // Overview Tab Component
  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-blue-700 flex items-center gap-2">
              <Building className="h-4 w-4" />
              Active Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {projects.filter(p => p.status === "In Progress").length}
            </div>
            <p className="text-xs text-blue-500 mt-1">In progress</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-orange-700 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Pending Estimates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {estimates.filter(e => e.status === "Pending").length}
            </div>
            <p className="text-xs text-orange-500 mt-1">Awaiting approval</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-lg hover:shadow-xl transition-all duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-red-700 flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Outstanding Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {invoices.filter(i => i.status === "Pending").length}
            </div>
            <p className="text-xs text-red-500 mt-1">Requires payment</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-purple-700 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Upcoming Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {appointments.filter(a => new Date(a.startTime) > new Date()).length}
            </div>
            <p className="text-xs text-purple-500 mt-1">Upcoming</p>
          </CardContent>
        </Card>
      </div>

      {/* Agent Contact Information */}
      {agentInfo && (
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-emerald-100 to-emerald-200 rounded-t-lg">
            <CardTitle className="text-emerald-800 flex items-center gap-2">
              <User className="h-5 w-5 text-emerald-600" />
              Your Assigned Agent
            </CardTitle>
            <CardDescription className="text-emerald-600">Contact your project coordinator</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500 p-2 rounded-full">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-emerald-900">{agentInfo.name}</p>
                  <p className="text-sm text-emerald-600">{agentInfo.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500 p-2 rounded-full">
                  <Mail className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-emerald-900">Email</p>
                  <p className="text-sm text-emerald-600">{agentInfo.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500 p-2 rounded-full">
                  <Phone className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-emerald-900">Phone</p>
                  <p className="text-sm text-emerald-600">{agentInfo.phone}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card className="bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-100 to-gray-100 rounded-t-lg">
          <CardTitle className="text-slate-800 flex items-center gap-2">
            <Activity className="h-5 w-5 text-slate-600" />
            Recent Activity
          </CardTitle>
          <CardDescription className="text-slate-600">Your latest project updates and communications</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {projects.length === 0 && estimates.length === 0 && invoices.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No recent activity</p>
                <p className="text-sm text-gray-400">Activity will appear here when work begins</p>
              </div>
            ) : (
              <>
                {projects.map((project) => (
                  <div key={project.id} className="flex items-start gap-4 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200">
                    <div className="bg-blue-500 p-2 rounded-full">
                      <Activity className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-blue-900">{project.title} updated</p>
                      <p className="text-sm text-blue-700">{project.description}</p>
                      <p className="text-xs text-blue-500 mt-1">{format(new Date(project.updatedAt || project.createdAt), "MMM dd, yyyy 'at' h:mm a")}</p>
                    </div>
                  </div>
                ))}
                {estimates.map((estimate) => (
                  <div key={estimate.id} className="flex items-start gap-4 p-4 rounded-lg bg-gradient-to-r from-green-50 to-green-100 border border-green-200">
                    <div className="bg-green-500 p-2 rounded-full">
                      <Receipt className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-green-900">Estimate {estimate.estimateNumber} created</p>
                      <p className="text-sm text-green-700">{estimate.title}</p>
                      <p className="text-xs text-green-500 mt-1">{format(new Date(estimate.createdAt), "MMM dd, yyyy 'at' h:mm a")}</p>
                    </div>
                  </div>
                ))}
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-start gap-4 p-4 rounded-lg bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200">
                    <div className="bg-purple-500 p-2 rounded-full">
                      <DollarSign className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-purple-900">Invoice {invoice.invoiceNumber} generated</p>
                      <p className="text-sm text-purple-700">${Number(invoice.total).toFixed(2)}</p>
                      <p className="text-xs text-purple-500 mt-1">{format(new Date(invoice.createdAt), "MMM dd, yyyy 'at' h:mm a")}</p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Projects Tab Component
  const ProjectsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Building className="h-6 w-6 text-blue-600" />
          My Projects
        </h2>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {projects.length === 0 ? (
          <Card className="bg-gradient-to-br from-white to-gray-50 border-gray-200">
            <CardContent className="p-12 text-center">
              <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Projects Yet</h3>
              <p className="text-gray-500">Your projects will appear here once work begins.</p>
            </CardContent>
          </Card>
        ) : projects.map((project) => (
          <Card key={project.id} className="bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl text-gray-800">{project.title}</CardTitle>
                  <CardDescription className="text-gray-600 mt-1">{project.description}</CardDescription>
                </div>
                {getStatusBadge(project.status)}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-blue-500 font-medium">Started</p>
                    <p className="text-sm font-semibold text-blue-800">{format(project.startDate, "MMM dd, yyyy")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-xs text-purple-500 font-medium">Est. Completion</p>
                    <p className="text-sm font-semibold text-purple-800">{format(project.estimatedEnd, "MMM dd, yyyy")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-xs text-green-500 font-medium">Budget</p>
                    <p className="text-sm font-semibold text-green-800">${project.budget.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-gray-700">Project Progress</span>
                  <span className="text-gray-900">{project.progress}% Complete</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                  <div 
                    className={`h-3 rounded-full shadow-sm ${
                      project.status === 'Completed' 
                        ? 'bg-gradient-to-r from-green-500 to-green-600' 
                        : 'bg-gradient-to-r from-blue-500 to-blue-600'
                    }`}
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 rounded-b-lg">
              <Button variant="outline" size="sm" className="shadow-sm hover:shadow-md transition-shadow">
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );

  // Estimates Tab Component
  const EstimatesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FileText className="h-6 w-6 text-orange-600" />
          My Estimates
        </h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {estimates.length === 0 ? (
          <div className="col-span-full">
            <Card className="bg-gradient-to-br from-white to-orange-50 border-orange-200">
              <CardContent className="p-12 text-center">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Estimates Yet</h3>
                <p className="text-gray-500">Your estimates will appear here when created.</p>
              </CardContent>
            </Card>
          </div>
        ) : estimates.map((estimate) => (
          <Card key={estimate.id} className="bg-gradient-to-br from-white to-orange-50 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-t-lg">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg text-orange-800">#{estimate.estimateNumber}</CardTitle>
                  <CardDescription className="text-orange-600">Issued: {format(new Date(estimate.createdAt), "MMM dd, yyyy")}</CardDescription>
                </div>
                {getStatusBadge(estimate.status)}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <p className="font-semibold text-gray-800 mb-1">{estimate.title}</p>
                  <p className="text-gray-600 text-sm mb-3">{estimate.description || 'No description provided'}</p>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span className="text-2xl font-bold text-green-800">${Number(estimate.total || 0).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-green-600 font-medium mt-1">Total Estimate</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 bg-gray-50 rounded-b-lg">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleViewEstimate(estimate.id)}
                className="shadow-sm hover:shadow-md transition-shadow"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
              {estimate.status === "Pending" && (
                <Button 
                  size="sm"
                  onClick={() => handleApproveEstimate(estimate.id)}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-sm hover:shadow-md transition-all"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );

  // Invoices Tab Component
  const InvoicesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Receipt className="h-6 w-6 text-red-600" />
          My Invoices
        </h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {invoices.length === 0 ? (
          <div className="col-span-full">
            <Card className="bg-gradient-to-br from-white to-red-50 border-red-200">
              <CardContent className="p-12 text-center">
                <Receipt className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Invoices Yet</h3>
                <p className="text-gray-500">Your invoices will appear here when generated.</p>
              </CardContent>
            </Card>
          </div>
        ) : invoices.map((invoice) => (
          <Card key={invoice.id} className="bg-gradient-to-br from-white to-red-50 border-red-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 rounded-t-lg">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg text-red-800">#{invoice.invoiceNumber}</CardTitle>
                  <CardDescription className="text-red-600">
                    Due: {format(new Date(invoice.dueDate || invoice.createdAt), "MMM dd, yyyy")}
                  </CardDescription>
                </div>
                {getStatusBadge(invoice.status)}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <p className="font-semibold text-gray-800">{invoice.title}</p>
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                    <span className="text-2xl font-bold text-blue-800">${Number(invoice.total || 0).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-blue-600 font-medium mt-1">Amount Due</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 bg-gray-50 rounded-b-lg">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleViewInvoice(invoice.id)}
                className="shadow-sm hover:shadow-md transition-shadow"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
              {invoice.status === "Pending" && (
                <Button 
                  size="sm"
                  onClick={() => handlePayInvoice(invoice.id)}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-sm hover:shadow-md transition-all"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Pay Now
                </Button>
              )}
              {invoice.status === "Paid" && (
                <Button variant="outline" size="sm" className="shadow-sm hover:shadow-md transition-shadow">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );

  // Schedule Tab Component
  const ScheduleTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Calendar className="h-6 w-6 text-purple-600" />
          My Schedule
        </h2>
      </div>
      
      <Card className="bg-gradient-to-br from-white to-purple-50 border-purple-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-t-lg">
          <CardTitle className="text-purple-800 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Appointments
          </CardTitle>
          <CardDescription className="text-purple-600">Scheduled visits and consultations</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {appointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No upcoming appointments</p>
                <p className="text-sm text-gray-400">Appointments will appear here when scheduled</p>
              </div>
            ) : appointments.map((appointment) => (
              <div key={appointment.id} className="bg-gradient-to-r from-white to-gray-50 p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-start gap-4">
                  <div className="bg-purple-500 p-3 rounded-full">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-lg text-gray-800">{appointment.title}</h4>
                      {getStatusBadge(appointment.status)}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <p className="text-xs text-blue-500 font-medium">Date & Time</p>
                        <p className="font-semibold text-blue-800">{format(new Date(appointment.startTime), "EEEE, MMM dd, yyyy")}</p>
                        <p className="text-sm text-blue-600">{format(new Date(appointment.startTime), "h:mm a")} - {format(new Date(appointment.endTime), "h:mm a")}</p>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <p className="text-xs text-green-500 font-medium">Type</p>
                        <p className="font-semibold text-green-800">{appointment.type}</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4">
                      <p className="text-xs text-gray-500 font-medium">Location</p>
                      <p className="text-sm text-gray-700">{appointment.address || clientInfo.address}, {appointment.city || clientInfo.city}, {appointment.state || clientInfo.state} {appointment.zip || clientInfo.zip}</p>
                    </div>
                    {appointment.description && (
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4">
                        <p className="text-xs text-gray-500 font-medium">Description</p>
                        <p className="text-sm text-gray-700">{appointment.description}</p>
                      </div>
                    )}
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRescheduleAppointment(appointment.id)}
                        className="shadow-sm hover:shadow-md transition-shadow"
                      >
                        Reschedule
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 shadow-sm hover:shadow-md transition-all">
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Messages Tab Component
  const MessagesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <MessageCircle className="h-6 w-6 text-blue-600" />
          AI Assistant
        </h2>
        <div className="text-sm text-gray-600">Ask me about your projects, estimates, and invoices</div>
      </div>
      
      <SimpleChat clientId={clientId || '4'} />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Client Portal</h1>
                <p className="text-gray-600">Welcome, {clientInfo.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Client Info Card */}
      <div className="container mx-auto px-4 py-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Client Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{clientInfo.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{clientInfo.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium">{clientInfo.address}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="estimates">Estimates</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6">
            <OverviewTab />
          </TabsContent>
          
          <TabsContent value="projects" className="mt-6">
            <ProjectsTab />
          </TabsContent>
          
          <TabsContent value="estimates" className="mt-6">
            <EstimatesTab />
          </TabsContent>
          
          <TabsContent value="invoices" className="mt-6">
            <InvoicesTab />
          </TabsContent>
          
          <TabsContent value="schedule" className="mt-6">
            <ScheduleTab />
          </TabsContent>
          
          <TabsContent value="messages" className="mt-6">
            <MessagesTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}