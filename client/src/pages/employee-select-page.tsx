import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, Clock, Calendar } from "lucide-react";

// Validation schema for the form
const employeeFormSchema = z.object({
  employeeName: z.string().min(2, "Name must be at least 2 characters")
});

type EmployeeFormType = z.infer<typeof employeeFormSchema>;

export default function EmployeeSelectPage() {
  const [, navigate] = useLocation();
  const form = useForm<EmployeeFormType>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      employeeName: ""
    }
  });

  // Función para redirigir al usuario al modo de selección de acción
  const onSubmit = (data: EmployeeFormType) => {
    console.log(data.employeeName);
    // Redirigir a la página de selección de acción (Clock In/Out)
    navigate(`/time-clock-action`);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="w-full max-w-md p-6 bg-blue-50 rounded-lg shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-1 text-blue-600 flex items-center">
            <User className="mr-2 h-6 w-6" />
            Select Employee
          </h1>
          <p className="text-slate-600">Enter employee name to continue</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="employeeName"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                      <Input 
                        placeholder="Enter employee name" 
                        className="pl-10 py-6 text-lg bg-white" 
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-slate-500">
                <Clock className="inline-block mr-1 h-4 w-4" />
                <span>{format(new Date(), "h:mm a")} | </span>
                <Calendar className="inline-block mx-1 h-4 w-4" />
                <span>{format(new Date(), "MMM d, yyyy")}</span>
              </div>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-lg py-6 px-8"
              >
                Continue
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}