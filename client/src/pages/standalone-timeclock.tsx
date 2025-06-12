import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowRightCircle, 
  ArrowLeftCircle,
  Clock,
  FileText,
  MapPin,
  User,
  Calendar,
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar as CalendarIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

// Validation schema for the form
const timeclockFormSchema = z.object({
  employeeName: z.string().min(2, "Name must be at least 2 characters")
});

type TimeclockFormType = z.infer<typeof timeclockFormSchema>;

export default function StandaloneTimeclockPage() {
  const [activeTab, setActiveTab] = useState("clock");
  const [clockMode, setClockMode] = useState("in");
  const [recentEntries, setRecentEntries] = useState([]);
  const [reportData, setReportData] = useState({});
  const [expandedEmployee, setExpandedEmployee] = useState(null);
  const [expandedDate, setExpandedDate] = useState(null);
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState("");
  const [step, setStep] = useState("select-employee"); // "select-employee" or "select-action"
  const { toast } = useToast();
  
  const form = useForm<TimeclockFormType>({
    resolver: zodResolver(timeclockFormSchema),
    defaultValues: {
      employeeName: ""
    }
  });
  
  // Obtener el nombre del empleado de la URL si está presente
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const employeeParam = searchParams.get('employee');
    
    if (employeeParam) {
      setSelectedEmployeeName(employeeParam);
      setStep("select-action");
      // Asignar también al formulario
      form.setValue("employeeName", employeeParam);
    }
  }, [form]);

  const fetchRecentEntries = async () => {
    try {
      const response = await apiRequest("GET", "/api/timeclock/recent");
      const data = await response.json();
      setRecentEntries(data);
    } catch (error) {
      console.error("Error fetching recent entries:", error);
    }
  };

  const fetchReportData = async () => {
    try {
      const response = await apiRequest("GET", "/api/timeclock/report");
      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error("Error fetching report data:", error);
    }
  };

  const toggleEmployee = (employeeName) => {
    if (expandedEmployee === employeeName) {
      setExpandedEmployee(null);
    } else {
      setExpandedEmployee(employeeName);
    }
  };

  const toggleDate = (date) => {
    if (expandedDate === date) {
      setExpandedDate(null);
    } else {
      setExpandedDate(date);
    }
  };

  const getPosition = () => {
    return new Promise<GeolocationPosition>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser"));
      } else {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      }
    });
  };

  useEffect(() => {
    fetchRecentEntries();
    fetchReportData();
  }, []);

  useEffect(() => {
    if (activeTab === "report") {
      fetchReportData();
    }
  }, [activeTab]);

  // Handle selecting an employee
  const handleEmployeeSelect = async (data: TimeclockFormType) => {
    try {
      // Get location in the background
      let locationText = "Location not available";
      try {
        const pos = await getPosition();
        setPosition(pos);
      } catch (error: unknown) {
        console.error("Error getting location:", error);
      }
      
      setSelectedEmployeeName(data.employeeName);
      setStep("select-action");
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while selecting employee",
        variant: "destructive",
      });
    }
  };
  
  // Handle clock in/out
  const onClockInOut = async () => {
    try {
      // Verify that we have location available
      if (!position || !position.coords) {
        toast({
          title: "Location Required",
          description: "Your location is required for Clock In/Out. Please enable location access and try again.",
          variant: "destructive"
        });
        return;
      }
      
      // Obtener texto de ubicación
      const { latitude, longitude } = position.coords;
      let locationText = `${latitude}, ${longitude}`;
      
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
        );
        const data = await response.json();
        if (data.display_name) {
          locationText = data.display_name;
        }
      } catch (error: unknown) {
        // If reverse geocoding fails, use the coordinates we already have
        console.error("Error with reverse geocoding:", error);
      }

      const endpoint = clockMode === "in" ? "/api/timeclock/clock-in" : "/api/timeclock/clock-out";
      
      const payload = {
        employeeName: selectedEmployeeName,
        location: locationText,
        date: format(new Date(), "yyyy-MM-dd"), // Include current date in ISO format
      };

      const response = await apiRequest("POST", endpoint, payload);
      
      if (response.ok) {
        toast({
          title: clockMode === "in" ? "Clocked In" : "Clocked Out",
          description: `${selectedEmployeeName} has been ${clockMode === "in" ? "clocked in" : "clocked out"} successfully.`,
          variant: "default",
        });
        
        // Reset to initial state
        setSelectedEmployeeName("");
        setStep("select-employee");
        fetchRecentEntries();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error processing request");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleTabChange = (value) => {
    setActiveTab(value);
  };

  // Calculate weekly total hours for each employee
  const calculateWeeklyTotals = () => {
    const weeklyTotals = {};
    
    Object.entries(reportData).forEach(([date, employeeData]) => {
      Object.entries(employeeData).forEach(([employee, data]) => {
        if (!weeklyTotals[employee]) {
          weeklyTotals[employee] = 0;
        }
        
        if (data.totalHours) {
          weeklyTotals[employee] += parseFloat(data.totalHours);
        }
      });
    });
    
    return weeklyTotals;
  };

  const weeklyTotals = calculateWeeklyTotals();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 py-6">
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold">Time Clock</CardTitle>
            <CardDescription>Clock in and out to track employee working hours.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="clock" value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="clock" onClick={() => setActiveTab("clock")}>
                  <Clock className="mr-2 h-4 w-4" />
                  Clock In/Out
                </TabsTrigger>
                <TabsTrigger value="report" onClick={() => setActiveTab("report")}>
                  <FileText className="mr-2 h-4 w-4" />
                  Hours Report
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="clock" className="pt-2">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Clock In/Out Form */}
                  <Card>
                    {step === "select-employee" ? (
                      <>
                        <CardHeader className="pb-2 bg-blue-50 dark:bg-blue-900/20">
                          <CardTitle className="flex items-center text-xl font-semibold">
                            <User className="mr-2 h-5 w-5 text-blue-600" />
                            <span className="text-blue-600">Select Employee</span>
                          </CardTitle>
                          <CardDescription>
                            Enter employee name to continue
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleEmployeeSelect)} className="space-y-4">
                              <FormField
                                control={form.control}
                                name="employeeName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <div className="flex">
                                        <div className="relative flex-grow">
                                          <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                          <Input 
                                            placeholder="Enter employee name" 
                                            className="pl-9" 
                                            {...field} 
                                          />
                                        </div>
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <div className="flex justify-between items-center">
                                <div className="text-sm text-muted-foreground">
                                  <Clock className="inline-block mr-1 h-3 w-3" />
                                  <span>{format(new Date(), "h:mm a")} | </span>
                                  <Calendar className="inline-block mx-1 h-3 w-3" />
                                  <span>{format(new Date(), "MMM d, yyyy")}</span>
                                </div>
                                <Button 
                                  type="submit" 
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  Continue
                                </Button>
                              </div>
                            </form>
                          </Form>
                        </CardContent>
                      </>
                    ) : (
                      <>
                        <CardHeader className="pb-2 bg-gray-50 dark:bg-gray-900/20">
                          <CardTitle className="flex items-center text-xl font-semibold">
                            <User className="mr-2 h-5 w-5" />
                            <span>{selectedEmployeeName}</span>
                          </CardTitle>
                          <CardDescription>
                            Select an action for this employee
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="grid grid-cols-2 gap-4">
                            <Button 
                              onClick={() => { setClockMode("in"); onClockInOut(); }}
                              className="bg-green-600 hover:bg-green-700 h-24 flex flex-col items-center justify-center"
                            >
                              <ArrowRightCircle className="h-8 w-8 mb-2" />
                              <span>Clock In</span>
                            </Button>
                            <Button 
                              onClick={() => { setClockMode("out"); onClockInOut(); }}
                              className="bg-amber-600 hover:bg-amber-700 h-24 flex flex-col items-center justify-center"
                            >
                              <ArrowLeftCircle className="h-8 w-8 mb-2" />
                              <span>Clock Out</span>
                            </Button>
                          </div>
                          
                          <div className="mt-4 flex justify-between items-center">
                            <div className="text-sm text-muted-foreground">
                              <Clock className="inline-block mr-1 h-3 w-3" />
                              <span>{format(new Date(), "h:mm a")} | </span>
                              <Calendar className="inline-block mx-1 h-3 w-3" />
                              <span>{format(new Date(), "MMM d, yyyy")}</span>
                            </div>
                            <Button 
                              type="button" 
                              variant="outline"
                              onClick={() => {
                                setSelectedEmployeeName("");
                                setStep("select-employee");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </CardContent>
                      </>
                    )}
                  </Card>
                  
                  {/* Recent Entries */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl font-semibold">Recent Activity</CardTitle>
                      <CardDescription>Recent clock in/out records</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {recentEntries && recentEntries.length > 0 ? (
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                          {recentEntries.map((entry, index) => (
                            <div 
                              key={index}
                              className={cn(
                                "p-3 rounded-lg border",
                                entry.type === "IN" ? "border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-900" : "border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-900"
                              )}
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="font-medium">{entry.employeeName}</div>
                                  <div className="flex items-center mt-1 text-sm">
                                    {entry.type === "IN" ? (
                                      <ArrowRightCircle className="h-3 w-3 text-green-600 mr-1" />
                                    ) : (
                                      <ArrowLeftCircle className="h-3 w-3 text-amber-600 mr-1" />
                                    )}
                                    <span className={entry.type === "IN" ? "text-green-600" : "text-amber-600"}>
                                      {entry.type === "IN" ? "Clock in" : "Clock out"}
                                    </span>
                                    <span className="text-muted-foreground mx-1">•</span>
                                    <span className="text-muted-foreground">{entry.formattedTime}</span>
                                  </div>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {entry.formattedDate}
                                </div>
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
              </TabsContent>
              
              <TabsContent value="report" className="pt-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold">Hours Report</CardTitle>
                    <CardDescription>View employee working hours by date</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {Object.keys(reportData).length > 0 ? (
                      <div className="space-y-4">
                        {/* Summary of weekly totals */}
                        <div className="bg-muted/50 p-4 rounded-lg mb-6">
                          <h3 className="font-medium mb-2 flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            Weekly Hours Summary
                          </h3>
                          <div className="space-y-2">
                            {Object.entries(weeklyTotals).map(([employee, hours]) => (
                              <div key={employee} className="flex justify-between items-center text-sm">
                                <span>{employee}</span>
                                <span className="font-medium">{parseFloat(hours.toString()).toFixed(2)} hours</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Detailed daily records */}
                        <div className="space-y-4">
                          {Object.entries(reportData)
                            .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
                            .map(([date, employeeData]) => (
                              <div key={date} className="border rounded-lg overflow-hidden">
                                <div 
                                  className="bg-muted/50 p-3 cursor-pointer flex justify-between items-center"
                                  onClick={() => toggleDate(date)}
                                >
                                  <span className="font-medium">
                                    {format(new Date(date), "EEEE, MMMM d, yyyy")}
                                  </span>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                    {expandedDate === date ? (
                                      <ArrowUpCircle className="h-5 w-5" />
                                    ) : (
                                      <ArrowDownCircle className="h-5 w-5" />
                                    )}
                                  </Button>
                                </div>
                                
                                {expandedDate === date && (
                                  <div className="p-3 space-y-3">
                                    {Object.entries(employeeData).map(([employee, data]) => (
                                      <div key={employee} className="border-b pb-3 last:border-b-0 last:pb-0">
                                        <div 
                                          className="flex justify-between items-center cursor-pointer py-1"
                                          onClick={() => toggleEmployee(employee + date)}
                                        >
                                          <div className="font-medium">{employee}</div>
                                          <div className="flex items-center space-x-2">
                                            <span className="text-sm text-muted-foreground">
                                              {data.totalHours ? `${data.totalHours} hours` : 'No hours recorded'}
                                            </span>
                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                              {expandedEmployee === employee + date ? (
                                                <ArrowUpCircle className="h-4 w-4" />
                                              ) : (
                                                <ArrowDownCircle className="h-4 w-4" />
                                              )}
                                            </Button>
                                          </div>
                                        </div>
                                        
                                        {expandedEmployee === employee + date && data.entries && (
                                          <div className="mt-2 ml-4 space-y-2">
                                            {data.entries.map((entry, index) => (
                                              <div 
                                                key={index} 
                                                className={cn(
                                                  "text-sm py-1 px-2 rounded flex items-center",
                                                  entry.type === "IN" ? "bg-green-50 text-green-700 dark:bg-green-900/10 dark:text-green-400" : "bg-amber-50 text-amber-700 dark:bg-amber-900/10 dark:text-amber-400"
                                                )}
                                              >
                                                {entry.type === "IN" ? (
                                                  <ArrowRightCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                                                ) : (
                                                  <ArrowLeftCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                                                )}
                                                <span className="mr-1">
                                                  {entry.type === "IN" ? "In:" : "Out:"}
                                                </span>
                                                <span>{entry.formattedTime}</span>
                                                
                                                {entry.hoursWorked && entry.type === "OUT" && (
                                                  <span className="ml-auto font-medium">
                                                    {entry.hoursWorked} hrs
                                                  </span>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        No timeclock records available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}