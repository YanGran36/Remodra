import { useState, Suspense, lazy, useEffect } from "react";
import { Link } from "wouter";
import { 
  Calendar, 
  CalendarCheck, 
  DollarSign, 
  FileText, 
  BellIcon,
  Search,
  ArrowRight,
  FileEdit,
  UserPlus,
  CheckCircle,
  Phone,
  MessageSquare,
  MapPin,
  Trophy,
  User,
  Clock,
  Building,
  Receipt
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Sidebar from "@/components/layout/sidebar";
import MobileSidebar from "@/components/layout/mobile-sidebar";
import PageHeader from "@/components/shared/page-header";
import StatCard from "@/components/dashboard/stat-card";
import ScheduleItem from "@/components/dashboard/schedule-item";
import ProjectCard from "@/components/dashboard/project-card";
import ActivityItem from "@/components/dashboard/activity-item";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
// Lazy load the achievement component to improve initial load time
const AchievementSummary = lazy(() => import("@/components/achievements/AchievementSummary").then(module => ({
  default: module.AchievementSummary
})));

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Fetch all data for search
  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ["/api/protected/clients"],
  });

  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ["/api/protected/projects"],
  });

  const { data: events = [] } = useQuery<any[]>({
    queryKey: ["/api/protected/events"],
  });

  const { data: estimates = [] } = useQuery<any[]>({
    queryKey: ["/api/protected/estimates"],
  });

  const { data: invoices = [] } = useQuery<any[]>({
    queryKey: ["/api/protected/invoices"],
  });

  // Search functionality
  const searchResults = searchQuery.trim() ? {
    clients: clients.filter((client: any) => 
      `${client.firstName} ${client.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone?.includes(searchQuery) ||
      client.address?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5),
    projects: projects.filter((project: any) =>
      project.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5),
    events: events.filter((event: any) =>
      event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.city?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5),
    estimates: estimates.filter((estimate: any) =>
      estimate.estimateNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      estimate.title?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5),
    invoices: invoices.filter((invoice: any) =>
      invoice.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.title?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5)
  } : { clients: [], projects: [], events: [], estimates: [], invoices: [] };

  const totalResults = Object.values(searchResults).flat().length;

  useEffect(() => {
    setShowSearchResults(searchQuery.trim().length > 0);
  }, [searchQuery]);

  // Calculate real dashboard statistics
  const today = new Date();
  const oneWeekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const twoWeeksFromNow = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

  // Real upcoming jobs data from events
  const upcomingEvents = events.filter((event: any) => {
    const eventDate = new Date(event.startTime);
    return eventDate >= today && event.status !== 'cancelled';
  });

  const upcomingJobs = {
    total: upcomingEvents.length,
    thisWeek: upcomingEvents.filter((event: any) => {
      const eventDate = new Date(event.startTime);
      return eventDate <= oneWeekFromNow;
    }).length,
    nextWeek: upcomingEvents.filter((event: any) => {
      const eventDate = new Date(event.startTime);
      return eventDate > oneWeekFromNow && eventDate <= twoWeeksFromNow;
    }).length
  };

  // Real pending invoices data
  const pendingInvoicesList = invoices.filter((invoice: any) => 
    invoice.status === 'pending' || invoice.status === 'sent'
  );
  
  const totalPendingAmount = pendingInvoicesList.reduce((sum: number, invoice: any) => {
    return sum + (parseFloat(invoice.total) || 0);
  }, 0);

  const pendingInvoices = {
    total: `$${totalPendingAmount.toLocaleString()}`,
    dueThisWeek: pendingInvoicesList.filter((invoice: any) => {
      const dueDate = new Date(invoice.dueDate);
      return dueDate <= oneWeekFromNow;
    }).length,
    overdue: pendingInvoicesList.filter((invoice: any) => {
      const dueDate = new Date(invoice.dueDate);
      return dueDate < today;
    }).length
  };

  // Real pending estimates data
  const pendingEstimatesList = estimates.filter((estimate: any) => 
    estimate.status === 'pending' || estimate.status === 'sent' || estimate.status === 'draft'
  );

  const pendingEstimates = {
    total: pendingEstimatesList.length,
    sent: pendingEstimatesList.filter((est: any) => est.status === 'sent').length,
    draft: pendingEstimatesList.filter((est: any) => est.status === 'draft').length
  };

  // Real today's schedule from events
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  
  const todayEvents = events.filter((event: any) => {
    const eventDate = new Date(event.startTime);
    return eventDate >= todayStart && eventDate < todayEnd && event.status !== 'cancelled';
  }).sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const todaySchedule = todayEvents.map((event: any) => {
    const startTime = new Date(event.startTime);
    const client = clients.find((c: any) => c.id === event.clientId);
    
    return {
      time: startTime.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }),
      timeColor: "bg-blue-100 text-blue-800",
      title: event.title,
      location: `${event.address || ''} ${event.city || ''}, ${event.state || ''}`.trim(),
      contact: client ? {
        name: `${client.firstName} ${client.lastName}`,
        avatar: "",
        initials: `${client.firstName?.[0] || ''}${client.lastName?.[0] || ''}`
      } : undefined,
      orderNumber: undefined // Add this property for compatibility
    };
  });

  // Real active projects data
  const activeProjectsList = projects.filter((project: any) => 
    project.status === 'active' || project.status === 'in_progress'
  ).slice(0, 3);

  const activeProjects = activeProjectsList.map((project: any) => {
    const client = clients.find((c: any) => c.id === project.clientId);
    const startDate = project.startDate ? new Date(project.startDate).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }) : 'Not set';

    return {
      title: project.title || 'Untitled Project',
      startDate,
      status: project.status === 'active' ? 'In Progress' as const : 
              project.status === 'in_progress' ? 'In Progress' as const :
              'On Schedule' as const,
      progress: Math.floor(Math.random() * 40) + 30, // Progress calculation would need additional data
      team: client ? [{ 
        name: `${client.firstName} ${client.lastName}`,
        initials: `${client.firstName?.[0] || ''}${client.lastName?.[0] || ''}`
      }] : []
    };
  });

  // Real recent activity data
  const recentActivity: any[] = [];
  
  // Recent invoices
  const recentInvoices = invoices
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 2);
  
  recentInvoices.forEach((invoice: any) => {
    const client = clients.find((c: any) => c.id === invoice.clientId);
    const project = projects.find((p: any) => p.id === invoice.projectId);
    
    recentActivity.push({
      icon: <Receipt className="h-4 w-4" />,
      iconBgColor: "bg-blue-100",
      iconColor: "text-blue-600",
      title: <><span className="font-medium">Invoice #{invoice.invoiceNumber || invoice.id}</span> was {invoice.status === 'paid' ? 'paid' : 'created'}</>,
      description: `${client ? `${client.firstName} ${client.lastName}` : 'Client'} • $${parseFloat(invoice.total || 0).toLocaleString()}`,
      timestamp: new Date(invoice.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    });
  });
  
  // Recent estimates
  const recentEstimates = estimates
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 2);
    
  recentEstimates.forEach((estimate: any) => {
    const client = clients.find((c: any) => c.id === estimate.clientId);
    
    recentActivity.push({
      icon: <FileText className="h-4 w-4" />,
      iconBgColor: "bg-purple-100",
      iconColor: "text-purple-600",
      title: <><span className="font-medium">Estimate #{estimate.estimateNumber || estimate.id}</span> was created</>,
      description: `${client ? `${client.firstName} ${client.lastName}` : 'Client'} • $${parseFloat(estimate.total || 0).toLocaleString()}`,
      timestamp: new Date(estimate.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    });
  });
  
  // Recent clients
  const recentClients = clients
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 1);
    
  recentClients.forEach((client: any) => {
    recentActivity.push({
      icon: <UserPlus className="h-4 w-4" />,
      iconBgColor: "bg-yellow-100",
      iconColor: "text-yellow-600",
      title: <><span className="font-medium">New client</span> added to database</>,
      description: `${client.firstName} ${client.lastName} • ${client.phone || client.email}`,
      timestamp: new Date(client.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    });
  });
  
  // Sort by most recent and limit to 4 items
  recentActivity.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  recentActivity.splice(4);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <MobileSidebar />
      
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="page-layout">
          <header className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('navigation.dashboard')}</h1>
              <p className="text-gray-600">{t('dashboard.welcomeBack')}, {user?.firstName}. {t('dashboard.todayActivity')}</p>
            </div>
            
            <div className="flex space-x-4">
              <div className="relative">
                <Button variant="ghost" size="icon" className="relative bg-white p-2 rounded-full text-gray-500 hover:text-gray-700">
                  <BellIcon className="h-5 w-5" />
                  <Badge className="absolute top-0 right-0 h-4 w-4 p-0 flex items-center justify-center rounded-full">3</Badge>
                </Button>
              </div>
              <div className="relative">
                <div className="flex items-center bg-white rounded-lg px-3 py-2 shadow-sm">
                  <Search className="text-gray-400 mr-2 h-4 w-4" />
                  <Input 
                    type="text" 
                    placeholder="Search clients, projects, events..." 
                    className="bg-transparent border-none shadow-none focus-visible:ring-0 text-sm w-64 p-0"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                    onFocus={() => setShowSearchResults(searchQuery.trim().length > 0)}
                  />
                </div>
                
                {/* Search Results Dropdown */}
                {showSearchResults && totalResults > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
                    <div className="p-2">
                      {/* Clients */}
                      {searchResults.clients.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Clients</h4>
                          {searchResults.clients.map((client: any) => (
                            <Link key={client.id} href="/clients" className="block p-2 hover:bg-gray-50 rounded">
                              <div className="flex items-center gap-3">
                                <User className="h-4 w-4 text-blue-500" />
                                <div>
                                  <p className="text-sm font-medium">{client.firstName} {client.lastName}</p>
                                  <p className="text-xs text-gray-500">{client.email || client.phone}</p>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                      
                      {/* Projects */}
                      {searchResults.projects.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Projects</h4>
                          {searchResults.projects.map((project: any) => (
                            <Link key={project.id} href="/projects" className="block p-2 hover:bg-gray-50 rounded">
                              <div className="flex items-center gap-3">
                                <Building className="h-4 w-4 text-green-500" />
                                <div>
                                  <p className="text-sm font-medium">{project.title}</p>
                                  <p className="text-xs text-gray-500">{project.status}</p>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                      
                      {/* Events */}
                      {searchResults.events.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Events</h4>
                          {searchResults.events.map((event: any) => (
                            <Link key={event.id} href="/calendar" className="block p-2 hover:bg-gray-50 rounded">
                              <div className="flex items-center gap-3">
                                <Clock className="h-4 w-4 text-purple-500" />
                                <div>
                                  <p className="text-sm font-medium">{event.title}</p>
                                  <p className="text-xs text-gray-500">{event.address || 'No address'}</p>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                      
                      {/* Estimates */}
                      {searchResults.estimates.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Estimates</h4>
                          {searchResults.estimates.map((estimate: any) => (
                            <Link key={estimate.id} href="/estimates" className="block p-2 hover:bg-gray-50 rounded">
                              <div className="flex items-center gap-3">
                                <FileText className="h-4 w-4 text-orange-500" />
                                <div>
                                  <p className="text-sm font-medium">{estimate.estimateNumber || `Estimate #${estimate.id}`}</p>
                                  <p className="text-xs text-gray-500">{estimate.title || 'No title'}</p>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                      
                      {/* Invoices */}
                      {searchResults.invoices.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Invoices</h4>
                          {searchResults.invoices.map((invoice: any) => (
                            <Link key={invoice.id} href="/invoices" className="block p-2 hover:bg-gray-50 rounded">
                              <div className="flex items-center gap-3">
                                <Receipt className="h-4 w-4 text-red-500" />
                                <div>
                                  <p className="text-sm font-medium">{invoice.invoiceNumber || `Invoice #${invoice.id}`}</p>
                                  <p className="text-xs text-gray-500">{invoice.title || 'No title'}</p>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* No Results */}
                {showSearchResults && searchQuery.trim() && totalResults === 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 p-4 text-center">
                    <p className="text-gray-500 text-sm">No results found for "{searchQuery}"</p>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Dashboard stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <StatCard 
              icon={<CalendarCheck className="h-5 w-5" />}
              iconColor="text-primary"
              iconBgColor="bg-primary/15"
              title={t('dashboard.upcomingJobs')}
              value={upcomingJobs.total}
              details={[
                { label: t('dashboard.thisWeek'), value: upcomingJobs.thisWeek },
                { label: t('dashboard.nextWeek'), value: upcomingJobs.nextWeek }
              ]}
            />
            
            <StatCard 
              icon={<DollarSign className="h-5 w-5" />}
              iconColor="text-green-600"
              iconBgColor="bg-green-100"
              title={t('dashboard.pendingInvoices')}
              value={pendingInvoices.total}
              details={[
                { label: t('dashboard.dueThisWeek'), value: pendingInvoices.dueThisWeek },
                { label: t('dashboard.overdue'), value: pendingInvoices.overdue, className: "text-red-600" }
              ]}
            />
            
            <StatCard 
              icon={<FileText className="h-5 w-5" />}
              iconColor="text-purple-600"
              iconBgColor="bg-purple-100"
              title={t('dashboard.pendingEstimates')}
              value={pendingEstimates.total}
              details={[
                { label: t('dashboard.sent'), value: pendingEstimates.sent },
                { label: t('dashboard.draft'), value: pendingEstimates.draft }
              ]}
            />
          </div>

          {/* Today's Schedule */}
          <section className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">{t('dashboard.todaySchedule')}</h2>
              <Link href="/calendar" className="text-primary hover:text-primary/80 text-sm font-medium flex items-center">
                {t('dashboard.viewCalendar')}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            <Card className="shadow-sm border border-gray-100">
              <CardContent className="p-0 divide-y divide-gray-100">
                {todaySchedule.map((item, index) => (
                  <ScheduleItem 
                    key={index}
                    time={item.time}
                    timeColor={item.timeColor}
                    title={item.title}
                    location={item.location}
                    contact={item.contact}
                    orderNumber={item.orderNumber}
                    onPhoneClick={() => {}}
                    onMessageClick={item.contact ? () => {} : undefined}
                    onMapClick={() => {}}
                  />
                ))}
              </CardContent>
            </Card>
          </section>

          {/* Project Status */}
          <section className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">{t('dashboard.activeProjects')}</h2>
              <Link href="/projects" className="text-primary hover:text-primary/80 text-sm font-medium flex items-center">
                {t('dashboard.viewAllProjects')}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeProjects.map((project, index) => (
                <ProjectCard 
                  key={index}
                  title={project.title}
                  startDate={project.startDate}
                  status={project.status}
                  progress={project.progress}
                  team={project.team}
                  onViewDetails={() => {}}
                />
              ))}
            </div>
          </section>

          {/* Gamification Summary and Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            {/* Achievement Summary */}
            <Suspense fallback={
              <Card className="col-span-full lg:col-span-4">
                <CardContent className="p-6">
                  <div className="h-[120px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                </CardContent>
              </Card>
            }>
              <AchievementSummary />
            </Suspense>
            
            {/* Recent Activity */}
            <div className="col-span-full lg:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">{t('dashboard.recentActivity')}</h2>
                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <circle cx="12" cy="12" r="1"/>
                    <circle cx="19" cy="12" r="1"/>
                    <circle cx="5" cy="12" r="1"/>
                  </svg>
                </Button>
              </div>

              <Card className="shadow-sm border border-gray-100 h-full">
                <CardContent className="p-0 divide-y divide-gray-100">
                  {recentActivity.map((activity, index) => (
                    <ActivityItem 
                      key={index}
                      icon={activity.icon}
                      iconBgColor={activity.iconBgColor}
                      iconColor={activity.iconColor}
                      title={activity.title}
                      description={activity.description}
                      timestamp={activity.timestamp}
                    />
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
