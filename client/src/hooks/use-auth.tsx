import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { Contractor, ContractorInsert } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: Contractor | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<Contractor, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<Contractor, Error, RegisterData>;
  isSessionRecoveryActive: boolean;
  refreshSession: () => Promise<void>;
};

type LoginData = {
  email: string;
  password: string;
};

type RegisterData = {
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  password: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [isSessionRecoveryActive, setIsSessionRecoveryActive] = useState(false);
  
  const {
    data: user,
    error,
    isLoading,
    refetch
  } = useQuery<Contractor | null>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  // Almacenar información del usuario para posible recuperación
  useEffect(() => {
    if (user) {
      // Guardar email para posible reconexión
      localStorage.setItem('lastUserEmail', user.email);
    }
  }, [user]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: Contractor) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.firstName}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (user: Contractor) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Registration successful",
        description: `Welcome to ContractorHub, ${user.firstName}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Función para intentar refrescar la sesión del usuario
  const refreshSession = async (): Promise<void> => {
    try {
      setIsSessionRecoveryActive(true);
      
      // Refrescar datos del usuario
      await refetch();
      
      // Verificar si la sesión se recuperó
      const currentUser = queryClient.getQueryData<Contractor | null>(["/api/user"]);
      
      if (currentUser) {
        toast({
          title: "Sesión restaurada",
          description: "Se ha restablecido la conexión"
        });
      } else {
        // Si no hay usuario, puede que se necesite iniciar sesión de nuevo
        toast({
          title: "La sesión expiró",
          description: "Por favor inicia sesión nuevamente",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error al refrescar la sesión:", error);
    } finally {
      setIsSessionRecoveryActive(false);
    }
  };
  
  // Monitorear si la sesión se pierde inesperadamente
  useEffect(() => {
    if (!isLoading && !user && localStorage.getItem('lastUserEmail')) {
      // Si teníamos un usuario pero ahora no, mostrar alerta de sesión expirada
      toast({
        title: "Sesión expirada",
        description: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
        variant: "destructive"
      });
    }
  }, [isLoading, user, toast]);

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        isSessionRecoveryActive,
        refreshSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
