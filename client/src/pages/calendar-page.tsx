import { useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Loader2, Home, UserPlus, Users } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, getDay, startOfWeek, endOfWeek, startOfDay, endOfDay, isWithinInterval, addWeeks, subWeeks, addDays, subDays } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import Sidebar from "@/components/layout/sidebar";
import MobileSidebar from "@/components/layout/mobile-sidebar";
import PageHeader from "@/components/shared/page-header";
import SearchInput from "@/components/shared/search-input";
import ScheduleItem from "@/components/dashboard/schedule-item";
import { useLocation } from "wouter";
import { useEvents } from "@/hooks/use-events";
import EventDialog from "@/components/events/event-dialog";
import AgentScheduler from "@/components/agents/AgentScheduler";
import { useQuery } from "@tanstack/react-query";

// Event interface
interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  time: string;
  timeColor: string;
  location: string;
  type: "meeting" | "site-visit" | "delivery" | "estimate" | "invoice" | "other";
  status: "confirmed" | "pending" | "completed" | "cancelled";
  contact?: {
    name: string;
    avatar?: string;
    initials?: string;
    id?: number;
  };
  orderNumber?: string;
  clientId?: number;
  projectId?: number;
  description?: string;
  agentId?: number;
  agentName?: string | null;
  estimateId?: number;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "day" | "week">("month");
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [, setLocation] = useLocation();
  const [isNewEventDialogOpen, setIsNewEventDialogOpen] = useState(false);
  const [isEditEventDialogOpen, setIsEditEventDialogOpen] = useState(false);
  const [currentEventId, setCurrentEventId] = useState<number | undefined>(undefined);
  const [defaultClientId, setDefaultClientId] = useState<string | undefined>(undefined);
  const [defaultEventType, setDefaultEventType] = useState<string | undefined>("estimate");
  
  // Obtener eventos reales desde la API
  const { getEvents, formatEvent } = useEvents();
  const { data: apiEvents = [], isLoading } = getEvents();
  
  // Fetch agents for color coding
  const { data: agents = [] } = useQuery<any[]>({
    queryKey: ['/api/protected/agents'],
  });

  // Agent color mapping - using database colors
  const getAgentColor = (agentId?: number) => {
    if (!agentId) return '#6B7280'; // Gray for unassigned
    const agent = agents.find(agent => agent.id === agentId);
    return agent?.colorCode || '#3B82F6'; // Default to blue if no color set
  };

  const getAgentName = (agentId?: number) => {
    if (!agentId) return null;
    const agent = agents.find(a => a.id === agentId);
    return agent ? `${agent.firstName} ${agent.lastName}` : null;
  };
  
  // Convertir los eventos de la API al formato que espera el calendario
  // Force refresh to ensure cancelled events are filtered out
  const events: CalendarEvent[] = isLoading ? [] : apiEvents
    .filter(event => event.status !== "cancelled")
    .map(event => {
      const agentId = (event as any).agentId;
      const agentName = agentId ? getAgentName(agentId) : null;
      
      return {
        ...formatEvent(event),
        // Override timeColor with agent color if available
        timeColor: getAgentColor(agentId),
        // Add agent info if available
        agentId: agentId,
        agentName: agentName || undefined,
      };
    });

  // Get date range based on current view
  const getDateRange = () => {
    switch (view) {
      case "day":
        return {
          start: startOfDay(currentDate),
          end: endOfDay(currentDate)
        };
      case "week":
        return {
          start: startOfWeek(currentDate),
          end: endOfWeek(currentDate)
        };
      case "month":
      default:
        return {
          start: startOfMonth(currentDate),
          end: endOfMonth(currentDate)
        };
    }
  };

  const dateRange = getDateRange();

  // Filter events based on view, selected date, search term, and type
  const filteredEvents = events.filter(event => {
    // Hide cancelled events
    if (event.status === "cancelled") {
      return false;
    }
    
    // Date filter based on view
    let dateMatches = false;
    
    if (selectedDate) {
      // If a specific date is selected, show only events for that date
      dateMatches = isSameDay(event.date, selectedDate);
    } else {
      // Filter by current view range (month/week/day)
      dateMatches = isWithinInterval(event.date, dateRange);
    }
    
    // Search filter
    const searchMatches = search === "" || 
      event.title.toLowerCase().includes(search.toLowerCase()) ||
      (event.location && event.location.toLowerCase().includes(search.toLowerCase())) ||
      (event.contact?.name && event.contact.name.toLowerCase().includes(search.toLowerCase()));
    
    // Type filter - when "all" is selected, show all types
    const typeMatches = filter === "all" || event.type === filter;
    
    return dateMatches && searchMatches && typeMatches;
  });

  // Get days to display in the calendar
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get the day of the week for the first of the month (0 = Sunday, 6 = Saturday)
  const startDay = getDay(monthStart);

  // Generate calendar grid with empty cells for proper alignment
  const calendarDays = Array(startDay).fill(null).concat(daysInMonth);

  // Handle navigation based on current view
  const navigateNext = () => {
    switch (view) {
      case "day":
        setCurrentDate(addDays(currentDate, 1));
        break;
      case "week":
        setCurrentDate(addWeeks(currentDate, 1));
        break;
      case "month":
      default:
        setCurrentDate(addMonths(currentDate, 1));
        break;
    }
  };

  const navigatePrev = () => {
    switch (view) {
      case "day":
        setCurrentDate(subDays(currentDate, 1));
        break;
      case "week":
        setCurrentDate(subWeeks(currentDate, 1));
        break;
      case "month":
      default:
        setCurrentDate(subMonths(currentDate, 1));
        break;
    }
  };
  
  // Function to check if a date has events (excluding cancelled events)
  const hasEvents = (date: Date) => {
    return events.some(event => isSameDay(event.date, date) && event.status !== "cancelled");
  };
  
  // Handler para crear un estimado desde una cita
  const handleCreateEstimate = (clientId: number) => {
    setLocation(`/vendor-estimate-form-new?clientId=${clientId}`);
  };

  // Manejadores para crear nuevos eventos
  const handleOpenNewEventDialog = () => {
    setCurrentEventId(undefined);
    setIsNewEventDialogOpen(true);
  };

  const handleCloseNewEventDialog = () => {
    setIsNewEventDialogOpen(false);
    setCurrentEventId(undefined);
  };

  // Manejadores para editar eventos existentes
  const handleOpenEditEventDialog = (eventId: number) => {
    setCurrentEventId(eventId);
    setIsEditEventDialogOpen(true);
  };

  const handleCloseEditEventDialog = () => {
    setIsEditEventDialogOpen(false);
    setCurrentEventId(undefined);
  };

  // Handler para editar un evento existente
  const handleEditEvent = (eventId: string) => {
    handleOpenEditEventDialog(Number(eventId));
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <MobileSidebar />
      
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-6">
          <PageHeader 
            title="Calendar & Scheduling" 
            description="Manage your schedule, appointments, and field agents"
            actions={
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline"
                  onClick={() => setLocation("/")}
                  className="flex items-center"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setLocation("/lead-capture")}
                  className="flex items-center"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  New Lead
                </Button>
                <Button 
                  className="flex items-center"
                  onClick={() => handleOpenNewEventDialog()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Event
                </Button>
              </div>
            }
          />

          <Tabs defaultValue="calendar" className="space-y-4">
            <TabsList>
              <TabsTrigger value="calendar" className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="agents" className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Agent Management
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calendar" className="space-y-4">
              {/* Agent Color Legend */}
              {agents.length > 0 && (
                <Card className="mb-4">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="text-sm font-medium text-gray-700">Agent Assignments:</span>
                      {agents.map((agent: any, index: number) => (
                        <div key={agent.id} className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full border-2 border-white shadow-sm" 
                            style={{ backgroundColor: agent.colorCode || '#3B82F6' }}
                          />
                          <span className="text-sm text-gray-600">
                            {agent.firstName} {agent.lastName}
                          </span>
                        </div>
                      ))}
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-gray-400 border-2 border-white shadow-sm" />
                        <span className="text-sm text-gray-600">Unassigned</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <div className="flex flex-col xl:flex-row gap-4 lg:gap-6">
            {/* Main Calendar Section */}
            <div className="w-full xl:w-2/3">
              <Card className="mb-4 lg:mb-6">
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  {/* Calendar Header - Responsive */}
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4 lg:mb-6">
                    {/* Navigation Controls */}
                    <div className="flex items-center gap-2 order-2 sm:order-1">
                      <Button variant="outline" size="sm" onClick={navigatePrev}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <h2 className="text-base sm:text-lg lg:text-xl font-semibold min-w-[180px] sm:min-w-[200px] text-center px-2">
                        {view === "day" 
                          ? format(currentDate, "MMM d, yyyy")
                          : view === "week"
                            ? `${format(startOfWeek(currentDate), "MMM d")} - ${format(endOfWeek(currentDate), "MMM d")}`
                            : format(currentDate, "MMMM yyyy")
                        }
                      </h2>
                      <Button variant="outline" size="sm" onClick={navigateNext}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* View Toggle Buttons */}
                    <div className="flex gap-1 sm:gap-2 order-1 sm:order-2">
                      <Button 
                        variant={view === "month" ? "default" : "outline"} 
                        size="sm"
                        onClick={() => setView("month")}
                        className="text-xs sm:text-sm px-2 sm:px-3"
                      >
                        Month
                      </Button>
                      <Button 
                        variant={view === "week" ? "default" : "outline"} 
                        size="sm"
                        onClick={() => setView("week")}
                        className="text-xs sm:text-sm px-2 sm:px-3"
                      >
                        Week
                      </Button>
                      <Button 
                        variant={view === "day" ? "default" : "outline"} 
                        size="sm"
                        onClick={() => setView("day")}
                        className="text-xs sm:text-sm px-2 sm:px-3"
                      >
                        Day
                      </Button>
                    </div>
                  </div>



                  {/* Loading indicator */}
                  {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="ml-2 text-gray-500">Loading events...</span>
                    </div>
                  ) : (
                    <div>
                      {/* Month View - Responsive */}
                      {view === "month" && (
                        <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                          {/* Day headers */}
                          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
                            <div key={day} className="text-center text-xs sm:text-sm font-medium py-1 sm:py-2 text-gray-500">
                              <span className="hidden sm:inline">{day}</span>
                              <span className="sm:hidden">{day.charAt(0)}</span>
                            </div>
                          ))}
                          
                          {/* Calendar days */}
                          {calendarDays.map((day, index) => {
                            if (!day) {
                              return <div key={`empty-${index}`} className="p-1 sm:p-2 border border-transparent" />;
                            }
                            
                            const isCurrentMonth = isSameMonth(day, currentDate);
                            const isSelected = selectedDate && isSameDay(day, selectedDate);
                            const dayHasEvents = hasEvents(day);
                            
                            return (
                              <div
                                key={day.toISOString()}
                                className={`min-h-[60px] sm:min-h-[80px] lg:min-h-[100px] p-0.5 sm:p-1 border rounded cursor-pointer transition ${
                                  isCurrentMonth ? "bg-white" : "bg-gray-50 text-gray-400"
                                } ${
                                  isSelected ? "border-primary" : "border-gray-100 hover:border-gray-300"
                                } ${
                                  isToday(day) ? "font-bold" : ""
                                }`}
                                onClick={() => setSelectedDate(day)}
                              >
                                <div className="flex justify-between items-center mb-1">
                                  <span className={`text-xs sm:text-sm p-0.5 sm:p-1 rounded-full w-4 h-4 sm:w-6 sm:h-6 flex items-center justify-center ${
                                    isToday(day) ? "bg-primary text-white" : ""
                                  }`}>
                                    {format(day, "d")}
                                  </span>
                                  {dayHasEvents && (
                                    <div className="flex gap-0.5">
                                      {events.filter(event => isSameDay(event.date, day)).slice(0, 3).map((event, idx) => (
                                        <span 
                                          key={`${event.id}-${idx}`}
                                          className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full border border-white shadow-sm" 
                                          style={{ backgroundColor: event.timeColor }}
                                          title={event.agentName ? `${event.title} - ${event.agentName}` : `${event.title} - Unassigned`}
                                        />
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="space-y-0.5 sm:space-y-1 hidden sm:block">
                                  {events.filter(event => isSameDay(event.date, day)).slice(0, window.innerWidth < 640 ? 1 : 2).map((event) => (
                                    <div 
                                      key={event.id} 
                                      className="text-xs px-1 py-0.5 truncate rounded bg-primary/10 text-primary cursor-pointer hover:bg-primary/20"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditEvent(event.id);
                                      }}
                                      title={`${event.title} - ${event.contact?.name || 'No client'} - ${event.time}`}
                                    >
                                      {event.contact?.name || event.title.substring(0, window.innerWidth < 1024 ? 8 : 14) + "..."}
                                    </div>
                                  ))}
                                  {events.filter(event => isSameDay(event.date, day)).length > (window.innerWidth < 640 ? 1 : 2) && (
                                    <div className="text-xs text-gray-500 pl-1">
                                      +{events.filter(event => isSameDay(event.date, day)).length - (window.innerWidth < 640 ? 1 : 2)} more
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Week View - Responsive */}
                      {view === "week" && (
                        <div className="space-y-3 sm:space-y-4">
                          {/* Week header */}
                          <div className="grid grid-cols-7 gap-1 sm:gap-2">
                            {eachDayOfInterval({ 
                              start: startOfWeek(currentDate), 
                              end: endOfWeek(currentDate) 
                            }).map(date => {
                              const isTodayDate = isToday(date);
                              const isSelected = selectedDate && isSameDay(date, selectedDate);
                              const dayHasEvents = hasEvents(date);
                              
                              return (
                                <div
                                  key={date.toString()}
                                  className={`p-2 sm:p-3 lg:p-4 border rounded-lg cursor-pointer transition-colors text-center ${
                                    isSelected ? 'bg-primary/10 border-primary' : 'bg-white hover:bg-gray-50 border-gray-200'
                                  } ${isTodayDate ? 'bg-blue-50 border-blue-300' : ''}`}
                                  onClick={() => setSelectedDate(date)}
                                >
                                  <div className="text-xs text-gray-500 mb-1">
                                    <span className="hidden sm:inline">{format(date, 'EEE')}</span>
                                    <span className="sm:hidden">{format(date, 'E')}</span>
                                  </div>
                                  <div className={`font-semibold text-sm sm:text-base lg:text-lg ${isTodayDate ? 'text-blue-600' : ''}`}>
                                    {format(date, 'd')}
                                  </div>
                                  {dayHasEvents && (
                                    <div className="mt-1 sm:mt-2 flex justify-center gap-0.5">
                                      {events.filter(event => isSameDay(event.date, date)).slice(0, 3).map((event, idx) => (
                                        <div 
                                          key={`${event.id}-${idx}`}
                                          className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full border border-white shadow-sm" 
                                          style={{ backgroundColor: event.timeColor }}
                                          title={event.agentName ? `${event.title} - ${event.agentName}` : `${event.title} - Unassigned`}
                                        />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          
                          {/* Week events by day */}
                          <div className="space-y-3">
                            {eachDayOfInterval({ 
                              start: startOfWeek(currentDate), 
                              end: endOfWeek(currentDate) 
                            }).map(date => {
                              const dayEvents = events.filter(event => 
                                isSameDay(event.date, date) && event.status !== "cancelled"
                              );
                              
                              if (dayEvents.length === 0) return null;
                              
                              return (
                                <div key={date.toString()} className="border rounded-lg p-4 bg-gray-50">
                                  <h4 className="font-medium text-sm text-gray-700 mb-3">
                                    {format(date, 'EEEE, MMMM d')}
                                  </h4>
                                  <div className="space-y-2">
                                    {dayEvents.map(event => (
                                      <div 
                                        key={event.id}
                                        className="flex items-center gap-3 text-sm cursor-pointer hover:bg-white p-2 rounded transition-colors"
                                        onClick={() => handleEditEvent(event.id)}
                                      >
                                        <div 
                                          className="w-4 h-4 rounded-full flex-shrink-0 border-2 border-white shadow-sm"
                                          style={{ backgroundColor: event.timeColor }}
                                        />
                                        <span className="font-medium text-gray-900">{event.contact?.name || "No Client"}</span>
                                        <div className="flex-1">
                                          <span className="text-gray-600">{event.title}</span>
                                          <div className="text-xs text-gray-500 mt-1">
                                            {event.time} {event.agentName && `• Agent: ${event.agentName}`}
                                          </div>
                                        </div>
                                        <Badge variant="outline" className="text-xs">{event.type}</Badge>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Day View - Responsive */}
                      {view === "day" && (
                        <div className="space-y-4 sm:space-y-6">
                          {/* Day header */}
                          <div className="text-center p-4 sm:p-6 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                            <div className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2">
                              {format(currentDate, 'EEEE')}
                            </div>
                            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                              {format(currentDate, 'MMMM d, yyyy')}
                            </div>
                            {isToday(currentDate) && (
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs sm:text-sm">Today</Badge>
                            )}
                          </div>
                          
                          {/* Day events */}
                          <div className="space-y-3">
                            {events
                              .filter(event => isSameDay(event.date, currentDate) && event.status !== "cancelled")
                              .sort((a, b) => a.time.localeCompare(b.time))
                              .map(event => (
                                <Card 
                                  key={event.id}
                                  className="cursor-pointer hover:shadow-lg transition-shadow border-l-4"
                                  style={{ borderLeftColor: event.timeColor }}
                                  onClick={() => handleEditEvent(event.id)}
                                >
                                  <CardContent className="p-4 sm:p-6">
                                    <div className="flex items-start gap-3 sm:gap-4">
                                      <div className="flex-shrink-0">
                                        <div className="text-lg font-bold text-gray-900">{event.contact?.name || "No Client"}</div>
                                        <div className="text-xs text-gray-500 uppercase tracking-wide">{event.time} • {event.type}</div>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                          <h3 className="font-semibold text-lg sm:text-xl text-gray-900 truncate">{event.title}</h3>
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <Badge 
                                              variant={
                                                event.status === "confirmed" ? "default" :
                                                event.status === "pending" ? "secondary" :
                                                event.status === "completed" ? "secondary" : "destructive"
                                              }
                                            >
                                              {event.status}
                                            </Badge>
                                            {/* Agent Assignment Display */}
                                            {event.agentName && event.agentId ? (
                                              <div className="flex items-center gap-2 bg-blue-50 px-2 py-1 rounded-full">
                                                <div 
                                                  className="w-3 h-3 rounded-full border border-white shadow-sm" 
                                                  style={{ backgroundColor: getAgentColor(event.agentId) }}
                                                />
                                                <span className="text-xs font-medium text-blue-700">
                                                  {event.agentName}
                                                </span>
                                              </div>
                                            ) : (
                                              <div className="flex items-center gap-2 bg-gray-100 px-2 py-1 rounded-full">
                                                <div className="w-3 h-3 rounded-full bg-gray-400 border border-white shadow-sm" />
                                                <span className="text-xs font-medium text-gray-600">Unassigned</span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        {event.location && (
                                          <p className="text-gray-600 mb-2 text-sm">{event.location}</p>
                                        )}
                                        {event.contact && (
                                          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                                            <span>with {event.contact.name}</span>
                                          </div>
                                        )}
                                        {event.description && (
                                          <p className="text-gray-700 text-sm leading-relaxed">{event.description}</p>
                                        )}
                                        {event.orderNumber && (
                                          <div className="mt-2">
                                            <Badge variant="outline">Order #{event.orderNumber}</Badge>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))
                            }
                            
                            {events.filter(event => isSameDay(event.date, currentDate) && event.status !== "cancelled").length === 0 && (
                              <div className="text-center py-12 text-gray-500">
                                <CalendarIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No events scheduled</h3>
                                <p className="text-gray-500 mb-4">You have a free day ahead!</p>
                                <Button 
                                  variant="outline" 
                                  onClick={() => handleOpenNewEventDialog()}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Schedule Event
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Event list - Responsive Sidebar */}
            <div className="w-full xl:w-1/3">
              <Card>
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <div className="flex flex-col sm:flex-row xl:flex-col items-start sm:items-center xl:items-start justify-between gap-2 sm:gap-4 xl:gap-2 mb-4">
                    <h3 className="font-semibold text-base sm:text-lg">
                      {selectedDate 
                        ? format(selectedDate, "MMM d, yyyy")
                        : view === "day" 
                          ? format(currentDate, "MMM d, yyyy")
                          : view === "week"
                            ? `${format(startOfWeek(currentDate), "MMM d")} - ${format(endOfWeek(currentDate), "MMM d")}`
                            : format(currentDate, "MMMM yyyy")
                      }
                    </h3>
                    {selectedDate && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setSelectedDate(null)}
                        className="text-xs sm:text-sm"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row xl:flex-col gap-2 sm:gap-4 xl:gap-2 mb-4">
                    <SearchInput 
                      placeholder="Search events..." 
                      onSearch={setSearch} 
                      className="flex-1"
                    />
                    <Select value={filter} onValueChange={setFilter}>
                      <SelectTrigger className="w-full sm:w-[140px] xl:w-full">
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="meeting">Meetings</SelectItem>
                        <SelectItem value="site-visit">Site Visits</SelectItem>
                        <SelectItem value="delivery">Deliveries</SelectItem>
                        <SelectItem value="estimate">Estimates</SelectItem>
                        <SelectItem value="invoice">Invoices</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {isLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[400px] sm:max-h-[500px] lg:max-h-[600px] overflow-y-auto">
                      {filteredEvents.length === 0 ? (
                        <div className="text-center py-6 sm:py-8 text-gray-500">
                          <p className="text-sm sm:text-base">No events found for the selected criteria</p>
                        </div>
                      ) : (
                        filteredEvents.map(event => (
                          <Card 
                            key={event.id} 
                            className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => handleEditEvent(event.id)}
                          >
                            <CardContent className="p-3 sm:p-4">
                              <div className="flex items-start gap-3">
                                <div 
                                  className="w-3 h-3 sm:w-4 sm:h-4 rounded-full mt-1 flex-shrink-0"
                                  style={{ backgroundColor: event.timeColor }}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                                    <span className="font-semibold text-sm sm:text-base">{event.time}</span>
                                    <Badge variant="outline" className="text-xs w-fit">{event.type}</Badge>
                                  </div>
                                  <h4 className="font-medium text-sm sm:text-base text-gray-900 mb-1 truncate">
                                    {event.title}
                                  </h4>
                                  {event.location && (
                                    <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">{event.location}</p>
                                  )}
                                  {event.contact && (
                                    <p className="text-xs sm:text-sm text-gray-500 truncate">
                                      with {event.contact.name}
                                    </p>
                                  )}
                                  {/* Agent Assignment Display */}
                                  {event.agentName && event.agentId ? (
                                    <div className="flex items-center gap-1 mt-1">
                                      <div 
                                        className="w-2 h-2 rounded-full border border-white shadow-sm" 
                                        style={{ backgroundColor: getAgentColor(event.agentId) }}
                                      />
                                      <span className="text-xs text-gray-600">
                                        Agent: {event.agentName}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1 mt-1">
                                      <div className="w-2 h-2 rounded-full bg-gray-400 border border-white shadow-sm" />
                                      <span className="text-xs text-gray-500">Unassigned</span>
                                    </div>
                                  )}
                                  {event.orderNumber && (
                                    <Badge variant="secondary" className="text-xs mt-1 w-fit">
                                      Order #{event.orderNumber}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
              </div>
            </TabsContent>

            <TabsContent value="agents" className="space-y-4">
              {/* Mobile-Friendly Agent Management */}
              <div className="space-y-4">
                <div className="flex flex-col gap-4">
                  <h2 className="text-lg font-semibold">Agent Assignments</h2>
                  
                  {/* Agent List - Mobile Optimized */}
                  {agents.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-8">
                        <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Agents Available</h3>
                        <p className="text-gray-600 mb-4">Add agents to assign them to appointments and estimates.</p>
                        <Button onClick={() => setLocation("/agents")}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Agents
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {agents.map((agent: any, index: number) => (
                        <Card key={agent.id} className="overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-6 h-6 rounded-full border-2 border-white shadow-sm flex-shrink-0" 
                                style={{ backgroundColor: agent.colorCode || '#3B82F6' }}
                              />
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-gray-900 truncate">
                                  {agent.firstName} {agent.lastName}
                                </h3>
                                <p className="text-sm text-gray-600">{agent.role}</p>
                                {agent.phone && (
                                  <p className="text-xs text-gray-500">{agent.phone}</p>
                                )}
                              </div>
                              <Badge variant="outline" className="flex-shrink-0">
                                {agent.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                  
                  {/* Quick Actions Section */}
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-medium mb-3">Quick Actions</h3>
                      <div className="space-y-3">
                        {agents.length > 0 && (
                          <Button 
                            variant="outline" 
                            className="w-full justify-start"
                            onClick={() => setLocation("/agent-estimate-form")}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Agent Estimate
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => setLocation("/agents")}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          {agents.length > 0 ? 'Manage Agents' : 'Add Agents'}
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => handleOpenNewEventDialog()}
                        >
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          Schedule New Event
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Dialog para crear nuevos eventos (formulario completo) */}
      <EventDialog
        isOpen={isNewEventDialogOpen}
        onClose={handleCloseNewEventDialog}
        eventId={undefined}
        defaultClientId={defaultClientId}
        defaultType={defaultEventType}
      />

      {/* Dialog para editar eventos existentes (solo reagendar/cancelar) */}
      <EventDialog
        isOpen={isEditEventDialogOpen}
        onClose={handleCloseEditEventDialog}
        eventId={currentEventId}
        defaultClientId={defaultClientId}
        defaultType={defaultEventType}
      />
    </div>
  );
}