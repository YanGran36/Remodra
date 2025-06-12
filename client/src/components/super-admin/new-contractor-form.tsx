import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArchitecturalCard } from "@/components/ui/architectural-card";
import { 
  Building, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  CreditCard,
  Briefcase,
  Package,
  Users,
  AlertCircle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Validation schema with Zod
const contractorFormSchema = z.object({
  // Información de la empresa
  companyName: z.string().min(2, "El nombre de la empresa debe tener al menos 2 caracteres"),
  email: z.string().email("Introduce un email válido"),
  phone: z.string().min(6, "Introduce un número de teléfono válido").or(z.literal('')),
  website: z.string().optional().or(z.literal('')),
  address: z.string().min(5, "La dirección debe tener al menos 5 caracteres").or(z.literal('')),
  city: z.string().min(2, "La ciudad debe tener al menos 2 caracteres").or(z.literal('')),
  state: z.string().min(2, "El estado/provincia debe tener al menos 2 caracteres").or(z.literal('')),
  zip: z.string().min(3, "Zip code must be at least 3 characters").or(z.literal('')),
  country: z.string().min(2, "El país debe tener al menos 2 caracteres").default("USA"),
  
  // Información del usuario principal
  firstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  username: z.string().min(3, "El nombre de usuario debe tener al menos 3 caracteres"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  
  // Información de suscripción
  plan: z.enum(["free", "basic", "professional", "premium", "enterprise"]).default("professional"),
  
  // Servicios ofrecidos
  serviceTypes: z.array(z.string()).min(1, "Selecciona al menos un tipo de servicio"),
  
  // Configuración adicional
  allowClientPortal: z.boolean().default(true),
  useEstimateTemplates: z.boolean().default(true),
  enabledAIAssistant: z.boolean().default(true),
  
  // Datos de configuración visual
  primaryColor: z.string().default("#1E40AF"),
  logoUrl: z.string().optional().or(z.literal('')),
  companyDescription: z.string().max(500, "La descripción no debe exceder los 500 caracteres").optional().or(z.literal('')),
});

type ContractorFormValues = z.infer<typeof contractorFormSchema>;

interface NewContractorFormProps {
  onSuccess?: (data: any) => void;
}

export function NewContractorForm({ onSuccess }: NewContractorFormProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Definir los valores por defecto del formulario - importante definir TODOS los campos
  const defaultValues: Partial<ContractorFormValues> = {
    // Información de la empresa
    companyName: "",
    email: "",
    phone: "",
    website: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "USA",
    
    // Información del usuario
    firstName: "",
    lastName: "",
    username: "",
    password: "",
    
    // Plan y servicios
    plan: "professional",
    serviceTypes: ["deck"],
    
    // Configuración
    allowClientPortal: true,
    useEstimateTemplates: true,
    enabledAIAssistant: true,
    primaryColor: "#1E40AF",
    logoUrl: "",
    companyDescription: ""
  };
  
  // Configurar el formulario con React Hook Form
  const form = useForm<ContractorFormValues>({
    resolver: zodResolver(contractorFormSchema),
    defaultValues,
    mode: "onChange",
  });
  
  // Opciones para los servicios
  const serviceTypeOptions = [
    { id: "deck", label: "Instalación/Reparación de Deck" },
    { id: "fence", label: "Instalación/Reparación de Verja" },
    { id: "roof", label: "Instalación/Reparación de Techo" },
    { id: "siding", label: "Siding Installation/Repair" },
    { id: "windows", label: "Windows Installation/Repair" },
    { id: "gutters", label: "Instalación/Reparación de Canalones" },
  ];
  
  // Mutación para crear un nuevo contratista
  const createContractorMutation = useMutation({
    mutationFn: async (data: ContractorFormValues) => {
      console.log("Datos a enviar:", JSON.stringify(data, null, 2));
      
      // Establecemos un timeout de 10 segundos para la solicitud
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      try {
        const response = await apiRequest(
          "POST", 
          "/api/super-admin/contractors", 
          data, 
          { signal: controller.signal }
        );
        
        // Limpiar el timeout
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Error al crear el contratista");
        }
        
        return response.json();
      } catch (error: any) { // Tipar como 'any' para acceder a las propiedades
        if (error.name === 'AbortError') {
          throw new Error("La solicitud ha tomado demasiado tiempo. Intente nuevamente.");
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Contratista creado con éxito",
        description: `Se ha creado la cuenta para ${data.companyName}`,
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/contractors"] });
      if (onSuccess) onSuccess(data);
    },
    onError: (error: Error) => {
      toast({
        title: "Error al crear el contratista",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Manejar el envío del formulario
  const onSubmit = async (data: ContractorFormValues) => {
    setIsSubmitting(true);
    try {
      console.log("Enviando datos:", data);
      
      // Aseguramos que los campos tengan valores válidos
      const formattedData = {
        ...data,
        // Aseguramos que estos campos son strings no vacíos
        website: data.website || '',
        logoUrl: data.logoUrl || '',
        companyDescription: data.companyDescription || '',
        // Aseguramos que serviceTypes es un array
        serviceTypes: Array.isArray(data.serviceTypes) && data.serviceTypes.length > 0 
          ? data.serviceTypes 
          : ['deck'] // valor por defecto
      };
      
      await createContractorMutation.mutateAsync(formattedData);
    } catch (error: any) {
      console.error("Error en el envío del formulario:", error);
      toast({
        title: "Error al crear el contratista",
        description: error instanceof Error ? error.message : "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Función para avanzar al siguiente paso
  const nextStep = () => {
    // Validar campos del paso actual antes de avanzar
    if (step === 1) {
      const companyFields = ["companyName", "email", "phone", "address", "city", "state", "zip", "country"];
      const isValid = companyFields.every(field => form.getFieldState(field as any).invalid !== true);
      
      if (!isValid) {
        form.trigger(companyFields as any);
        return;
      }
    } else if (step === 2) {
      const userFields = ["firstName", "lastName", "username", "password"];
      const isValid = userFields.every(field => form.getFieldState(field as any).invalid !== true);
      
      if (!isValid) {
        form.trigger(userFields as any);
        return;
      }
    }
    
    setStep(step + 1);
  };
  
  // Función para retroceder al paso anterior
  const prevStep = () => {
    setStep(step - 1);
  };
  
  return (
    <div className="space-y-8">
      <div className="relative flex items-center justify-center mb-8">
        <div className="absolute left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 z-0"></div>
        {[1, 2, 3, 4].map((stepNumber) => (
          <div key={stepNumber} className="relative z-10 mx-4">
            <div 
              className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 
                ${stepNumber === step 
                  ? "bg-primary text-white" 
                  : stepNumber < step 
                    ? "bg-green-500 text-white" 
                    : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"}`}
            >
              {stepNumber < step ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                stepNumber
              )}
            </div>
            <div className="text-xs text-center mt-2">
              {stepNumber === 1 && "Empresa"}
              {stepNumber === 2 && "Usuario"}
              {stepNumber === 3 && "Plan"}
              {stepNumber === 4 && "Servicios"}
            </div>
          </div>
        ))}
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Paso 1: Información de la Empresa */}
          {step === 1 && (
            <ArchitecturalCard className="p-6">
              <div className="space-y-6">
                <div className="flex items-center space-x-2 text-blue-gradient">
                  <Building className="h-5 w-5" />
                  <h2 className="text-xl font-semibold">Información de la Empresa</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre de la Empresa</FormLabel>
                        <FormControl>
                          <Input placeholder="Empresa Contratista S.A." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Correo Electrónico</FormLabel>
                        <FormControl>
                          <Input placeholder="info@empresa.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input placeholder="555-123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sitio Web</FormLabel>
                        <FormControl>
                          <Input placeholder="https://www.empresa.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dirección</FormLabel>
                        <FormControl>
                          <Input placeholder="Calle Principal 123" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ciudad</FormLabel>
                          <FormControl>
                            <Input placeholder="Ciudad" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado/Provincia</FormLabel>
                          <FormControl>
                            <Input placeholder="Estado" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="zip"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zip Code</FormLabel>
                          <FormControl>
                            <Input placeholder="12345" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>País</FormLabel>
                        <FormControl>
                          <Input placeholder="País" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="flex justify-end mt-8">
                <Button type="button" onClick={nextStep}>
                  Siguiente
                </Button>
              </div>
            </ArchitecturalCard>
          )}
          
          {/* Paso 2: Información del Usuario */}
          {step === 2 && (
            <ArchitecturalCard className="p-6">
              <div className="space-y-6">
                <div className="flex items-center space-x-2 text-blue-gradient">
                  <User className="h-5 w-5" />
                  <h2 className="text-xl font-semibold">Información del Usuario Principal</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input placeholder="Juan" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apellido</FormLabel>
                        <FormControl>
                          <Input placeholder="Pérez" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre de Usuario</FormLabel>
                        <FormControl>
                          <Input placeholder="juanperez" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contraseña</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="flex justify-between mt-8">
                <Button type="button" variant="outline" onClick={prevStep}>
                  Anterior
                </Button>
                <Button type="button" onClick={nextStep}>
                  Siguiente
                </Button>
              </div>
            </ArchitecturalCard>
          )}
          
          {/* Paso 3: Plan de Suscripción */}
          {step === 3 && (
            <ArchitecturalCard className="p-6">
              <div className="space-y-6">
                <div className="flex items-center space-x-2 text-blue-gradient">
                  <Package className="h-5 w-5" />
                  <h2 className="text-xl font-semibold">Plan de Suscripción</h2>
                </div>
                
                <FormField
                  control={form.control}
                  name="plan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Selecciona un Plan</FormLabel>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                        <div 
                          className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                            field.value === "basic" 
                              ? "border-primary bg-primary/5" 
                              : "border-border hover:border-primary/50"
                          }`}
                          onClick={() => form.setValue("plan", "basic")}
                        >
                          <h3 className="text-lg font-semibold">Básico</h3>
                          <p className="text-2xl font-bold my-2">$24.99 <span className="text-sm font-normal text-muted-foreground">/mes</span></p>
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-start">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              <span>Hasta 10 clientes</span>
                            </li>
                            <li className="flex items-start">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              <span>Estimaciones y facturas ilimitadas</span>
                            </li>
                            <li className="flex items-start">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              <span>Portal de cliente</span>
                            </li>
                          </ul>
                        </div>
                        
                        <div 
                          className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 relative overflow-hidden ${
                            field.value === "professional" 
                              ? "border-primary bg-primary/5" 
                              : "border-border hover:border-primary/50"
                          }`}
                          onClick={() => form.setValue("plan", "professional")}
                        >
                          <div className="absolute top-0 right-0 bg-secondary text-black text-xs py-1 px-3 rounded-bl-lg">
                            Popular
                          </div>
                          <h3 className="text-lg font-semibold">Profesional</h3>
                          <p className="text-2xl font-bold my-2">$49.99 <span className="text-sm font-normal text-muted-foreground">/mes</span></p>
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-start">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              <span>Hasta 50 clientes</span>
                            </li>
                            <li className="flex items-start">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              <span>Estimaciones y facturas ilimitadas</span>
                            </li>
                            <li className="flex items-start">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              <span>Portal de cliente personalizable</span>
                            </li>
                            <li className="flex items-start">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              <span>Análisis de costos con IA (10/mes)</span>
                            </li>
                          </ul>
                        </div>
                        
                        <div 
                          className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                            field.value === "premium" 
                              ? "border-primary bg-primary/5" 
                              : "border-border hover:border-primary/50"
                          }`}
                          onClick={() => form.setValue("plan", "premium")}
                        >
                          <h3 className="text-lg font-semibold">Premium</h3>
                          <p className="text-2xl font-bold my-2">$99.99 <span className="text-sm font-normal text-muted-foreground">/mes</span></p>
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-start">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              <span>Clientes ilimitados</span>
                            </li>
                            <li className="flex items-start">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              <span>Estimaciones y facturas ilimitadas</span>
                            </li>
                            <li className="flex items-start">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              <span>Portal de cliente con marca personalizada</span>
                            </li>
                            <li className="flex items-start">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              <span>Análisis de costos con IA ilimitado</span>
                            </li>
                            <li className="flex items-start">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              <span>Integración con Stripe</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-between mt-8">
                <Button type="button" variant="outline" onClick={prevStep}>
                  Anterior
                </Button>
                <Button type="button" onClick={nextStep}>
                  Siguiente
                </Button>
              </div>
            </ArchitecturalCard>
          )}
          
          {/* Paso 4: Configuración de Servicios */}
          {step === 4 && (
            <ArchitecturalCard className="p-6">
              <div className="space-y-6">
                <div className="flex items-center space-x-2 text-blue-gradient">
                  <Briefcase className="h-5 w-5" />
                  <h2 className="text-xl font-semibold">Configuración de Servicios</h2>
                </div>
                
                <FormField
                  control={form.control}
                  name="serviceTypes"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel>Tipos de Servicios Ofrecidos</FormLabel>
                        <FormDescription>
                          Selecciona los servicios que ofrece la empresa contratista
                        </FormDescription>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {serviceTypeOptions.map((option) => (
                          <FormField
                            key={option.id}
                            control={form.control}
                            name="serviceTypes"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={option.id}
                                  className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(option.id)}
                                      onCheckedChange={(checked) => {
                                        const updatedValue = checked
                                          ? [...field.value, option.id]
                                          : field.value?.filter(
                                              (value) => value !== option.id
                                            );
                                        field.onChange(updatedValue);
                                      }}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel className="text-sm font-medium">
                                      {option.label}
                                    </FormLabel>
                                  </div>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                  <FormField
                    control={form.control}
                    name="allowClientPortal"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Habilitar Portal de Clientes</FormLabel>
                          <FormDescription>
                            Permite a los clientes ver estimaciones y facturas
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="useEstimateTemplates"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Usar Plantillas de Estimación</FormLabel>
                          <FormDescription>
                            Utilizar plantillas predefinidas para servicios
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="enabledAIAssistant"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Habilitar Asistente IA</FormLabel>
                          <FormDescription>
                            Usar IA para análisis de costos y recomendaciones
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="space-y-4 mt-6">
                  <FormField
                    control={form.control}
                    name="primaryColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color Primario</FormLabel>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-8 h-8 rounded border"
                            style={{ backgroundColor: field.value }}
                          ></div>
                          <FormControl>
                            <Input type="text" {...field} />
                          </FormControl>
                        </div>
                        <FormDescription>
                          Código hexadecimal del color principal para la marca
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="logoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL del Logo</FormLabel>
                        <FormControl>
                          <Input placeholder="https://ejemplo.com/logo.png" {...field} />
                        </FormControl>
                        <FormDescription>
                          URL de la imagen del logo de la empresa (opcional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="companyDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción de la Empresa</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Breve descripción de los servicios y especialidades de la empresa..." 
                            {...field} 
                            className="min-h-[100px]"
                          />
                        </FormControl>
                        <FormDescription>
                          Descripción breve que se mostrará en el portal del cliente
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="flex justify-between mt-8">
                <Button type="button" variant="outline" onClick={prevStep}>
                  Anterior
                </Button>
                <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creando...
                    </div>
                  ) : (
                    'Crear Contratista'
                  )}
                </Button>
              </div>
            </ArchitecturalCard>
          )}
        </form>
      </Form>
    </div>
  );
}