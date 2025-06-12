import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, User, Calendar, ArrowRightCircle, ArrowLeftCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function TimeClockSelectAction() {
  const [, navigate] = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [employeeName, setEmployeeName] = useState("Yandeivis Granado");
  const { toast } = useToast();

  // Update the current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Get the user's location
  useEffect(() => {
    const getPosition = () => {
      return new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocation is not supported by your browser"));
        } else {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        }
      });
    };

    const fetchPosition = async () => {
      try {
        const pos = await getPosition();
        setPosition(pos);
      } catch (error: unknown) {
        console.error("Error getting location:", error);
      }
    };

    fetchPosition();
  }, []);

  // Function to handle clock in/out
  const handleClockAction = async (type: "IN" | "OUT") => {
    try {
      if (!position || !position.coords) {
        toast({
          title: "Location Required",
          description: "Your location is required for Clock In/Out. Please enable location access and try again.",
          variant: "destructive"
        });
        return;
      }
      
      let locationString = "";
      
      const { latitude, longitude } = position.coords;
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
        );
        const data = await response.json();
        locationString = data.display_name || `${latitude}, ${longitude}`;
      } catch (error: unknown) {
        locationString = `${latitude}, ${longitude}`;
      }

      const currentDate = format(new Date(), "yyyy-MM-dd");
      
      let endpoint = "/api/timeclock/clock-in";
      let payload: any = {
        employeeName,
        location: locationString,
        type,
        date: currentDate,
        notes: ""
      };

      if (type === "OUT") {
        endpoint = "/api/timeclock/clock-out";
      }

      const response = await apiRequest("POST", endpoint, payload);
      
      if (response.ok) {
        toast({
          title: `Clock ${type.toLowerCase()} successful`,
          description: `You have successfully clocked ${type.toLowerCase()}`,
          variant: "default",
        });
        
        // Redirect back to the dashboard or timeclock page
        navigate("/timeclock");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "An error occurred");
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to clock in/out",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    navigate("/employee-select");
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 p-4">
      <div className="mb-6">
        <h1 className="text-4xl font-bold mb-2">Time Clock</h1>
        <p className="text-slate-600 text-lg">Clock in and out to track employee working hours.</p>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg mb-6 flex items-center justify-center">
        <Clock className="h-6 w-6 mr-2" />
        <span className="text-xl">Clock In/Out</span>
      </div>

      <Card className="w-full bg-slate-50 border border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center mb-4">
            <User className="h-8 w-8 mr-3" />
            <h2 className="text-3xl font-bold">{employeeName}</h2>
          </div>
          
          <p className="text-slate-600 text-lg mb-6">Select an action for this employee</p>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Button 
              onClick={() => handleClockAction("IN")}
              className="h-32 bg-green-500 hover:bg-green-600 flex flex-col items-center justify-center"
            >
              <ArrowRightCircle className="h-8 w-8 mb-2" />
              <span className="text-xl">Clock In</span>
            </Button>
            
            <Button 
              onClick={() => handleClockAction("OUT")}
              className="h-32 bg-amber-500 hover:bg-amber-600 flex flex-col items-center justify-center"
            >
              <ArrowLeftCircle className="h-8 w-8 mb-2" />
              <span className="text-xl">Clock Out</span>
            </Button>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center text-slate-500">
              <Clock className="h-5 w-5 mr-1" />
              <span>{format(currentTime, "h:mm a")} | </span>
              <Calendar className="h-5 w-5 mx-1" />
              <span>{format(currentTime, "MMM d, yyyy")}</span>
            </div>
            
            <Button 
              variant="outline"
              className="px-8"
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}