import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AchievementOverlay } from '@/components/ui/achievement-overlay';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Achievement, ContractorAchievement, AchievementReward } from '@shared/schema';

/**
 * Componente que gestiona los logros desbloqueados y muestra overlays cuando se desbloquean nuevos logros
 */
export function AchievementManager() {
  const [currentAchievement, setCurrentAchievement] = useState<{
    achievement: Achievement;
    contractorAchievement: ContractorAchievement;
    reward?: AchievementReward;
  } | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener logros no leídos
  const { data: unreadAchievements, isLoading, refetch } = useQuery({
    queryKey: ['/api/contractor/achievements/unread'],
    enabled: true,
    refetchInterval: 30000, // Verificar cada 30 segundos
  });

  // Actualizar racha diaria cuando se carga el componente
  useEffect(() => {
    const updateStreak = async () => {
      try {
        await apiRequest('POST', '/api/contractor/streak/update');
      } catch (error) {
        console.error('Error al actualizar racha diaria:', error);
      }
    };

    updateStreak();
  }, []);

  // Mostrar el primer logro no leído cuando hay nuevos
  useEffect(() => {
    if (!isLoading && unreadAchievements && unreadAchievements.length > 0) {
      const firstUnread = unreadAchievements[0];
      setCurrentAchievement({
        achievement: firstUnread.achievement,
        contractorAchievement: firstUnread,
        reward: firstUnread.achievement.rewards && firstUnread.achievement.rewards.length > 0 
          ? firstUnread.achievement.rewards[0] 
          : undefined
      });
    }
  }, [unreadAchievements, isLoading]);

  // Marcar logro como leído
  const markAsReadMutation = useMutation({
    mutationFn: async (achievementId: number) => {
      return await apiRequest(
        'POST', 
        `/api/contractor/achievements/${achievementId}/mark-read`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contractor/achievements/unread'] });
    },
    onError: (error) => {
      console.error('Error al marcar logro como leído:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo marcar el logro como leído'
      });
    }
  });

  // Desbloquear recompensa
  const unlockRewardMutation = useMutation({
    mutationFn: async (achievementId: number) => {
      return await apiRequest(
        'POST', 
        `/api/contractor/achievements/${achievementId}/unlock-reward`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contractor/achievements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contractor/stats'] });
      
      toast({
        title: '¡Recompensa Desbloqueada!',
        description: 'Has obtenido una nueva recompensa',
      });
    },
    onError: (error) => {
      console.error('Error al desbloquear recompensa:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo desbloquear la recompensa'
      });
    }
  });

  // Manejar cierre del overlay
  const handleClose = async () => {
    if (currentAchievement) {
      try {
        // Marcar como notificado
        await markAsReadMutation.mutateAsync(currentAchievement.achievement.id);
        
        // Si tiene recompensa, desbloquearla automáticamente
        if (currentAchievement.reward && !currentAchievement.contractorAchievement.unlockedReward) {
          await unlockRewardMutation.mutateAsync(currentAchievement.achievement.id);
        }
        
        // Buscar el siguiente logro no leído o cerrar
        setCurrentAchievement(null);
        
        // Refrescar la lista de logros no leídos
        refetch();
      } catch (error) {
        console.error('Error al procesar logro:', error);
        setCurrentAchievement(null);
      }
    }
  };

  // Renderizar overlay solo si hay un logro actual que mostrar
  if (!currentAchievement) {
    return null;
  }

  return (
    <AchievementOverlay
      achievement={currentAchievement.achievement}
      contractorAchievement={currentAchievement.contractorAchievement}
      reward={currentAchievement.reward}
      onClose={handleClose}
    />
  );
}