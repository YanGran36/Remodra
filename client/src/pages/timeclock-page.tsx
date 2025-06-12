import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Clock, ArrowLeft, ArrowRight, MapPin, Loader2, 
  ChevronDown, ChevronUp, Info 
} from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import MobileSidebar from "@/components/layout/mobile-sidebar";
import { useLanguage } from "@/hooks/use-language";

// Validation schema for the form
const timeclockFormSchema = z.object({
  employeeName: z.string().min(2, "Name must be at least 2 characters")
});

type TimeclockFormType = z.infer<typeof timeclockFormSchema>;

export default function TimeclockPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("clock");
  const [clockMode, setClockMode] = useState("in");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentLocation, setCurrentLocation] = useState<string>("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [expandedEmployees, setExpandedEmployees] = useState<{[key: string]: boolean}>({});
  const { data: user } = useQuery<any>({
    queryKey: ["/api/user"],
  });

  // Get current location
  useEffect(() => {
    const getLocation = async () => {
      if ("geolocation" in navigator) {
        setIsLoadingLocation(true);
        try {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              try {
                // Try to get the location name
                const response = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
                );
                const data = await response.json();
                const locationName = data.display_name || `Lat: ${latitude}, Lng: ${longitude}`;
                setCurrentLocation(locationName);
              } catch (error) {
                // If reverse geocoding fails, use coordinates
                setCurrentLocation(`Lat: ${latitude}, Lng: ${longitude}`);
              }
            },
            (error) => {
              console.error("Error getting location:", error);
              setCurrentLocation("Not available");
            }
          );
        } catch (error) {
          console.error("Error in geolocation:", error);
          setCurrentLocation("Not available");
        } finally {
          setIsLoadingLocation(false);
        }
      } else {
        setCurrentLocation("Not supported by browser");
      }
    };

    getLocation();
  }, []);

  // Get recent entries
  const { data: recentEntries = [], isLoading: loadingEntries } = useQuery<any[]>({
    queryKey: ["/api/timeclock/recent"],
  });
  
  // Get hours report (only for business owners)
  const { data: hoursReportData, isLoading: loadingReport } = useQuery<any>({
    queryKey: ["/api/timeclock/report"],
    enabled: activeTab === "report" && !!user,
  });
  
  // Extract daily and weekly report from response
  const hoursReport = hoursReportData?.dailyReport || {};
  const weeklyReport = hoursReportData?.weeklyReport || {};

  // Configure form
  const form = useForm<TimeclockFormType>({
    resolver: zodResolver(timeclockFormSchema),
    defaultValues: {
      employeeName: ""
    }
  });

  // Mutations for clock in and clock out registration
  const clockInMutation = useMutation({
    mutationFn: async (data: TimeclockFormType) => {
      if (!currentLocation || currentLocation === "Not available" || currentLocation === "Not supported by browser") {
        throw new Error("Location is required for Clock In. Please enable location access and try again.");
      }
      
      return await apiRequest("POST", "/api/timeclock/clock-in", {
        ...data,
        location: currentLocation, // Always use current location
        date: format(new Date(), "yyyy-MM-dd"),
        notes: "" // Empty as it's not requested
      });
    },
    onSuccess: () => {
      toast({
        title: "Clock In Registered",
        description: "Your clock in has been successfully registered",
        variant: "default"
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/timeclock/recent"] });
    },
    onError: (error) => {
      toast({
        title: "Error Registering Clock In",
        description: error.message || "An error occurred while registering your clock in",
        variant: "destructive"
      });
    }
  });

  const clockOutMutation = useMutation({
    mutationFn: async (data: TimeclockFormType) => {
      if (!currentLocation || currentLocation === "Not available" || currentLocation === "Not supported by browser") {
        throw new Error("Location is required for Clock Out. Please enable location access and try again.");
      }
      
      return await apiRequest("POST", "/api/timeclock/clock-out", {
        ...data,
        location: currentLocation, // Always use current location
        date: format(new Date(), "yyyy-MM-dd"),
        notes: "" // Empty as it's not requested
      });
    },
    onSuccess: () => {
      toast({
        title: "Clock Out Registered",
        description: "Your clock out has been successfully registered",
        variant: "default"
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/timeclock/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/timeclock/report"] });
    },
    onError: (error) => {
      toast({
        title: "Error Registering Clock Out",
        description: error.message || "An error occurred while registering your clock out",
        variant: "destructive"
      });
    }
  });

  // Handle form submission
  const onSubmit = (data: TimeclockFormType) => {
    if (clockMode === "in") {
      clockInMutation.mutate(data);
    } else {
      clockOutMutation.mutate(data);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <MobileSidebar />

      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="container py-8">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold">Time Clock</h1>
            <p className="text-gray-600 mt-2">
              Record employee clock in and clock out times quickly and easily.
            </p>
          </div>
          
          <div className="mb-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="clock">Time Clock</TabsTrigger>
                {user && <TabsTrigger value="report">Hours Report</TabsTrigger>}
              </TabsList>
            </Tabs>
          </div>

          {activeTab === "clock" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        Time Clock
                      </CardTitle>
                      <CardDescription>
                        {format(new Date(), "EEEE, MMMM dd, yyyy, h:mm a")}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <Tabs defaultValue="in" value={clockMode} onValueChange={setClockMode} className="w-full mb-4">
                        <TabsList className="grid grid-cols-2 w-full">
                          <TabsTrigger value="in" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
                            <ArrowRight className="h-4 w-4 mr-2" />
                            Clock In
                          </TabsTrigger>
                          <TabsTrigger value="out" className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Clock Out
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>

                      <FormField
                        control={form.control}
                        name="employeeName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Employee Name</FormLabel>
                            <FormControl>
                              <Input placeholder="First and last name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Location is captured automatically in the background but not displayed */}

                      <Button 
                        type="submit" 
                        className={`w-full ${
                          clockMode === "in" ? "bg-green-600 hover:bg-green-700" : "bg-amber-600 hover:bg-amber-700"
                        }`}
                        disabled={clockInMutation.isPending || clockOutMutation.isPending}
                      >
                        {(clockInMutation.isPending || clockOutMutation.isPending) && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {clockMode === "in" ? "Clock In" : "Clock Out"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Recent Records</CardTitle>
                  <CardDescription>
                    Latest clock in and clock out entries
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingEntries ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : recentEntries && recentEntries.length > 0 ? (
                    <div className="space-y-4">
                      {recentEntries.map((entry) => (
                        <div key={entry.id} className="border rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{entry.employeeName}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(entry.timestamp), "MM/dd/yyyy h:mm a")}
                              </p>
                            </div>
                            <Badge
                              className={
                                entry.type === "IN"
                                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                                  : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                              }
                            >
                              {entry.type === "IN" ? "Clock In" : "Clock Out"}
                            </Badge>
                          </div>
                          {entry.hoursWorked && entry.type === "OUT" && (
                            <div className="mt-2 flex items-start gap-1">
                              <Clock className="h-3 w-3 text-muted-foreground mt-0.5" />
                              <p className="text-xs text-green-600 font-medium">
                                {entry.hoursWorked} hours worked
                              </p>
                            </div>
                          )}
                          {entry.location && (
                            <div className="mt-2 flex items-start gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground mt-0.5" />
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {entry.location}
                              </p>
                            </div>
                          )}
                          {entry.notes && <p className="mt-1 text-sm">{entry.notes}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No recent records
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-0">
                  <Button variant="outline" className="w-full" onClick={() => setActiveTab("report")}>
                    View all records
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}
          
          {activeTab === "report" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
Hours Report by Employee
                  </CardTitle>
                  <CardDescription>
View hours worked by each employee daily
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingReport ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : Object.keys(hoursReport).length > 0 ? (
                    <div className="space-y-6">
                      {/* Weekly Summary */}
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                        <h3 className="text-blue-800 font-medium mb-2 text-sm">Weekly Summary</h3>
                        <div className="space-y-1">
                          {(() => {
                            // Sort weeks by most recent date (year and week number)
                            const sortedWeeks = Object.entries(weeklyReport)
                              .sort(([weekKeyA], [weekKeyB]) => weekKeyB.localeCompare(weekKeyA))
                              .map(([weekKey, weekData]: [string, any]) => ({
                                weekKey,
                                startDate: weekData.startDate,
                                year: weekData.year,
                                weekNumber: weekData.weekNumber,
                                employees: weekData.employees || {}
                              }));
                            
                            // Render week data
                            return sortedWeeks.length > 0 ? (
                              sortedWeeks.map((week: any) => (
                                <div key={week.weekKey} className="border-b pb-2 mb-2 last:border-0">
                                  <div className="font-medium text-sm text-blue-700">
                                    Week {week.weekNumber}, {week.year} (starts {format(new Date(week.startDate), "MM/dd/yyyy")})
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 mt-1">
                                    {Object.entries(week.employees).map(([name, hours]: [string, any]) => (
                                      <div key={name} className="flex justify-between text-xs">
                                        <span>{name}:</span>
                                        <span className="font-medium">{parseFloat(String(hours || '0')).toFixed(2)} Hours</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-gray-500">No weekly data available</p>
                            );
                          })()}
                        </div>
                      </div>
                      {Object.keys(hoursReport).sort().reverse().map((date) => (
                        <div key={date} className="space-y-3">
                          <h3 className="font-semibold text-md">{format(new Date(date), "EEEE, MMMM dd, yyyy")}</h3>
                          <div className="bg-slate-50 rounded-lg p-4">
                            <div className="grid grid-cols-3 gap-4 font-medium text-sm mb-2 px-2">
                              <div>Employee</div>
                              <div className="text-center">Hours</div>
                              <div className="text-right">Records</div>
                            </div>
                            <Separator className="my-2" />
                            {Object.keys(hoursReport[date]).map((employeeName) => {
                              const employeeData = hoursReport[date][employeeName];
                              const totalHours = employeeData.totalHours.toFixed(2);
                              const entries = employeeData.entries.length;
                              const rowKey = `${date}-${employeeName}`;
                              const isExpanded = expandedEmployees[rowKey] || false;
                              
                              return (
                                <div key={rowKey} className="border-b border-gray-100 last:border-0">
                                  <div 
                                    className="grid grid-cols-3 gap-4 py-2 px-2 cursor-pointer hover:bg-gray-50 transition-colors"
                                    onClick={() => setExpandedEmployees({
                                      ...expandedEmployees,
                                      [rowKey]: !isExpanded
                                    })}
                                  >
                                    <div className="font-medium flex items-center">
                                      {isExpanded ? (
                                        <ChevronUp className="h-4 w-4 mr-1 text-gray-500" />
                                      ) : (
                                        <ChevronDown className="h-4 w-4 mr-1 text-gray-500" />
                                      )}
                                      {employeeName}
                                    </div>
                                    <div className="text-center flex flex-col">
                                      <div>{totalHours}</div>
                                      {employeeData.weeklyHours > 0 && (
                                        <div className="text-xs font-medium text-blue-600">
                                          {employeeData.weeklyHours.toFixed(2)} this week
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-right text-gray-500 text-sm">{entries} {entries === 1 ? 'record' : 'records'}</div>
                                  </div>
                                  
                                  {isExpanded && (
                                    <div className="bg-gray-50 px-4 py-3 mb-2 rounded-b-lg">
                                      <h4 className="text-sm font-medium mb-2 flex items-center">
                                        <Info className="h-3 w-3 mr-1" />
                                        Record Details
                                      </h4>
                                      <div className="space-y-3">
                                        {employeeData.entries.map((entry, index) => (
                                          <div 
                                            key={entry.id} 
                                            className={`bg-white rounded p-2 text-sm border ${
                                              entry.isClockIn ? 'border-l-4 border-l-green-500' : 
                                              entry.isClockOut ? 'border-l-4 border-l-amber-500' : ''
                                            }`}
                                          >
                                            <div className="flex justify-between mb-1">
                                              <div className="flex items-center gap-1">
                                                {entry.type === "IN" ? (
                                                  <ArrowRight className="h-3 w-3 text-green-600" />
                                                ) : (
                                                  <ArrowLeft className="h-3 w-3 text-amber-600" />
                                                )}
                                                <span className="font-medium">
                                                  {format(new Date(entry.entryTime || entry.timestamp), "h:mm a")}
                                                </span>
                                                <Badge 
                                                  className={entry.type === "IN" ? 
                                                    "bg-green-100 text-green-800 hover:bg-green-100 ml-2 h-5" : 
                                                    "bg-amber-100 text-amber-800 hover:bg-amber-100 ml-2 h-5"
                                                  }
                                                >
                                                  {entry.type === "IN" ? "Clock In" : "Clock Out"}
                                                </Badge>
                                              </div>
                                              {entry.hoursWorked && (
                                                <span className="text-green-600 font-medium">
                                                  {parseFloat(String(entry.hoursWorked || '0')).toFixed(2)} Hours
                                                </span>
                                              )}
                                            </div>
                                            {entry.location && (
                                              <div className="flex items-start gap-1 text-xs text-gray-600 mt-1">
                                                <MapPin className="h-3 w-3 shrink-0 mt-0.5" />
                                                <span>{entry.location}</span>
                                              </div>
                                            )}
                                            {entry.notes && entry.notes.trim() !== "" && (
                                              <div className="text-xs text-gray-600 mt-1 pl-4">
                                                {entry.notes}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
No hours recorded yet
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-0">
                  <Button variant="outline" className="w-full" onClick={() => setActiveTab("clock")}>
Back to time clock
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}