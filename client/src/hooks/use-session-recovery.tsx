import { useEffect, useState } from 'react';
import { useAuth } from './use-auth';
import { queryClient } from '@/lib/queryClient';

// Este hook detecta cuándo la sesión se ha perdido y 
// maneja el proceso de reconexión o redirección según sea necesario
export function useSessionRecovery() {
  const { user, isLoading, loginMutation } = useAuth();
  const [isRecovering, setIsRecovering] = useState(false);
  const [sessionLost, setSessionLost] = useState(false);
  
  // Detectar pérdida de sesión
  useEffect(() => {
    // Cuando termina de cargar y no hay usuario, asumimos que la sesión se perdió
    if (!isLoading && !user && !isRecovering && localStorage.getItem('userEmail')) {
      setSessionLost(true);
    }
    
    // Si hay usuario, resetear el estado
    if (user) {
      setSessionLost(false);
      setIsRecovering(false);
      
      // Guardar email del usuario para posible reconexión futura
      localStorage.setItem('userEmail', user.email);
    }
  }, [user, isLoading, isRecovering]);
  
  // Intentar reconectar cuando se pierde la sesión
  useEffect(() => {
    if (sessionLost && !isRecovering) {
      const attemptReconnect = async () => {
        try {
          setIsRecovering(true);
          
          // Intentar obtener datos de usuario del localStorage
          const email = localStorage.getItem('userEmail');
          
          if (!email) {
            console.warn('No hay información de usuario para reconectar automáticamente');
            return;
          }
          
          // Mostrar mensaje en consola
          console.log('La sesión se ha perdido. Intentando reconectar...');
          
          // Aquí podríamos intentar reconectar usando información guardada
          // Por ahora, simplemente invalidamos la cache para forzar una nueva petición
          await queryClient.invalidateQueries({ queryKey: ['/api/user'] });
          
          // Nota: Para reconexión real necesitaríamos credenciales guardadas de forma segura
          // lo cual está fuera del alcance de esta implementación
          
          // Finalizar recuperación
          setIsRecovering(false);
        } catch (error) {
          console.error('Error al intentar recuperar sesión:', error);
          setIsRecovering(false);
        }
      };
      
      attemptReconnect();
    }
  }, [sessionLost, isRecovering]);
  
  return {
    isSessionLost: sessionLost,
    isRecovering,
    clearSessionData: () => {
      localStorage.removeItem('userEmail');
      setSessionLost(false);
    }
  };
}