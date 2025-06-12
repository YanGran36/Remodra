import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangleIcon, RefreshCwIcon } from 'lucide-react';

/**
 * Componente que monitorea el estado de la sesión y muestra una alerta
 * cuando ésta se pierde, permitiendo al usuario intentar reconectarse.
 */
export function SessionRecoveryAlert() {
  const { user, isLoading, isSessionRecoveryActive, refreshSession } = useAuth();
  const { toast } = useToast();
  const [showAlert, setShowAlert] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  // Detectar cuando la sesión se pierde
  useEffect(() => {
    if (!isLoading && !user && localStorage.getItem('lastUserEmail') && reconnectAttempts < 3) {
      setShowAlert(true);
      
      // Intentar reconectar automáticamente en la primera pérdida de sesión
      if (reconnectAttempts === 0) {
        handleReconnect();
      }
    } else if (user) {
      // Reset cuando el usuario está autenticado
      setShowAlert(false);
      setReconnectAttempts(0);
    }
  }, [isLoading, user]);
  
  const handleReconnect = async () => {
    try {
      setReconnectAttempts(prev => prev + 1);
      await refreshSession();
    } catch (error) {
      console.error("Error en reconexión automática:", error);
      toast({
        title: "Error de reconexión",
        description: "No se pudo restablecer la sesión",
        variant: "destructive"
      });
    }
  };
  
  const handleDismiss = () => {
    setShowAlert(false);
    localStorage.removeItem('lastUserEmail');
  };
  
  if (!showAlert) return null;
  
  return (
    <Alert className="fixed bottom-4 right-4 z-50 w-80 bg-white dark:bg-gray-800 shadow-lg border-amber-300 dark:border-amber-700">
      <AlertTriangleIcon className="h-5 w-5 text-amber-500" />
      <AlertTitle className="text-amber-700 dark:text-amber-400">
        Sesión finalizada
      </AlertTitle>
      <AlertDescription className="text-sm">
        <p className="mb-2">Tu sesión ha expirado o se ha perdido la conexión al servidor.</p>
        <div className="flex justify-between mt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDismiss}
            className="text-sm"
          >
            Ignorar
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleReconnect}
            disabled={isSessionRecoveryActive}
            className="bg-amber-500 hover:bg-amber-600 text-white text-sm"
          >
            {isSessionRecoveryActive ? (
              <>
                <RefreshCwIcon className="h-4 w-4 mr-1 animate-spin" />
                Reconectando...
              </>
            ) : (
              <>Reconectar</>
            )}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}