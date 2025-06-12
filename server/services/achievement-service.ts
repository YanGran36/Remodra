import { db } from "../../db";
import {
  contractors, 
  achievements, 
  contractorAchievements, 
  achievementRewards, 
  contractorStreaks
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

// Interfaz para los datos necesarios para verificar un logro
export interface AchievementCheckData {
  contractorId: number;
  category: string;
  code: string;
  progress: number;
}

/**
 * Obtiene todos los logros disponibles
 */
export async function getAllAchievements() {
  try {
    const allAchievements = await db.query.achievements.findMany({
      orderBy: [desc(achievements.points)],
      with: {
        rewards: true
      }
    });
    
    return allAchievements;
  } catch (error) {
    console.error("Error al obtener logros:", error);
    throw new Error("No se pudieron obtener los logros");
  }
}

/**
 * Obtiene los logros de un contratista específico
 */
export async function getContractorAchievements(contractorId: number) {
  try {
    const contractorAchievementsList = await db.query.contractorAchievements.findMany({
      where: eq(contractorAchievements.contractorId, contractorId),
      with: {
        achievement: {
          with: {
            rewards: true
          }
        }
      }
    });
    
    return contractorAchievementsList;
  } catch (error) {
    console.error("Error al obtener logros del contratista:", error);
    throw new Error("No se pudieron obtener los logros del contratista");
  }
}

/**
 * Obtiene los logros no leídos (completados pero no notificados)
 */
export async function getUnreadAchievements(contractorId: number) {
  try {
    const unreadAchievements = await db.query.contractorAchievements.findMany({
      where: and(
        eq(contractorAchievements.contractorId, contractorId),
        eq(contractorAchievements.isCompleted, true),
        eq(contractorAchievements.notified, false)
      ),
      with: {
        achievement: {
          with: {
            rewards: true
          }
        }
      }
    });
    
    return unreadAchievements;
  } catch (error) {
    console.error("Error al obtener logros no leídos:", error);
    throw new Error("No se pudieron obtener los logros no leídos");
  }
}

/**
 * Marca un logro como notificado
 */
export async function markAchievementAsNotified(contractorId: number, achievementId: number) {
  try {
    const [updated] = await db
      .update(contractorAchievements)
      .set({ 
        notified: true,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(contractorAchievements.contractorId, contractorId),
          eq(contractorAchievements.achievementId, achievementId)
        )
      )
      .returning();
      
    return updated;
  } catch (error) {
    console.error("Error al marcar logro como notificado:", error);
    throw new Error("No se pudo marcar el logro como notificado");
  }
}

/**
 * Marca una recompensa como desbloqueada
 */
export async function unlockReward(contractorId: number, achievementId: number) {
  try {
    const [updated] = await db
      .update(contractorAchievements)
      .set({ 
        unlockedReward: true,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(contractorAchievements.contractorId, contractorId),
          eq(contractorAchievements.achievementId, achievementId)
        )
      )
      .returning();
      
    // Obtener la recompensa para aplicarla
    const reward = await db.query.achievementRewards.findFirst({
      where: eq(achievementRewards.achievementId, achievementId)
    });
    
    if (reward) {
      // Aquí se podría aplicar la recompensa según su tipo
      // Por ejemplo, si es un descuento, actualizaríamos la suscripción
      // Si es una característica, actualizaríamos las capacidades del contratista
      // Por ahora solo devolvemos la recompensa para mostrarla
      return { updated, reward };
    }
    
    return { updated };
  } catch (error) {
    console.error("Error al desbloquear recompensa:", error);
    throw new Error("No se pudo desbloquear la recompensa");
  }
}

/**
 * Verifica y actualiza el progreso de un logro específico
 */
export async function checkAndUpdateAchievement(data: AchievementCheckData) {
  try {
    // Obtener el logro por código
    const achievement = await db.query.achievements.findFirst({
      where: eq(achievements.code, data.code)
    });
    
    if (!achievement) {
      throw new Error(`Logro con código ${data.code} no encontrado`);
    }
    
    // Check if the contractor already has this achievement
    let contractorAchievement = await db.query.contractorAchievements.findFirst({
      where: and(
        eq(contractorAchievements.contractorId, data.contractorId),
        eq(contractorAchievements.achievementId, achievement.id)
      )
    });
    
    let isNewlyCompleted = false;
    
    if (contractorAchievement) {
      // Si ya existe, actualizamos el progreso
      if (contractorAchievement.isCompleted) {
        // Si ya está completado, no hacemos nada
        return { contractorAchievement, isNewlyCompleted: false };
      }
      
      // Si no está completado, actualizamos el progreso
      const isCompleted = data.progress >= achievement.requiredCount;
      
      const [updated] = await db
        .update(contractorAchievements)
        .set({
          progress: data.progress,
          isCompleted: isCompleted,
          completedAt: isCompleted ? new Date() : null,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(contractorAchievements.contractorId, data.contractorId),
            eq(contractorAchievements.achievementId, achievement.id)
          )
        )
        .returning();
      
      isNewlyCompleted = isCompleted && !contractorAchievement.isCompleted;
      contractorAchievement = updated;
      
    } else {
      // Si no existe, lo creamos
      const isCompleted = data.progress >= achievement.requiredCount;
      
      const [created] = await db
        .insert(contractorAchievements)
        .values({
          contractorId: data.contractorId,
          achievementId: achievement.id,
          progress: data.progress,
          isCompleted: isCompleted,
          completedAt: isCompleted ? new Date() : null,
          notified: false,
          unlockedReward: false
        })
        .returning();
      
      isNewlyCompleted = isCompleted;
      contractorAchievement = created;
    }
    
    // Si el logro se completó, actualizar el XP del contratista
    if (isNewlyCompleted) {
      // Obtener la racha actual del contratista
      const streak = await db.query.contractorStreaks.findFirst({
        where: eq(contractorStreaks.contractorId, data.contractorId)
      });
      
      if (streak) {
        // Actualizar XP
        const newXp = streak.xp + achievement.points;
        const levelUpThreshold = streak.nextLevelXp;
        let newLevel = streak.level;
        let newNextLevelXp = streak.nextLevelXp;
        
        // Check if level increased
        if (newXp >= levelUpThreshold) {
          newLevel += 1;
          newNextLevelXp = Math.round(levelUpThreshold * 1.5); // Incremento del 50% para el siguiente nivel
        }
        
        await db
          .update(contractorStreaks)
          .set({
            xp: newXp,
            level: newLevel,
            nextLevelXp: newNextLevelXp,
            lastActivityDate: new Date(),
            updatedAt: new Date()
          })
          .where(eq(contractorStreaks.contractorId, data.contractorId));
      } else {
        // Crear registro de racha si no existe
        await db
          .insert(contractorStreaks)
          .values({
            contractorId: data.contractorId,
            currentStreak: 1,
            longestStreak: 1,
            lastActivityDate: new Date(),
            level: 1,
            xp: achievement.points,
            nextLevelXp: 100
          });
      }
    }
    
    return { contractorAchievement, isNewlyCompleted };
  } catch (error) {
    console.error("Error al verificar y actualizar logro:", error);
    throw new Error("No se pudo verificar o actualizar el logro");
  }
}

/**
 * Actualiza la racha diaria del contratista
 */
export async function updateDailyStreak(contractorId: number) {
  try {
    // Obtener la racha actual
    const streak = await db.query.contractorStreaks.findFirst({
      where: eq(contractorStreaks.contractorId, contractorId)
    });
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (streak) {
      const lastActivity = new Date(streak.lastActivityDate);
      
      // Formatear fechas para comparar solo día, mes y año
      const formatDate = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      };
      
      const formattedToday = formatDate(today);
      const formattedYesterday = formatDate(yesterday);
      const formattedLastActivity = formatDate(lastActivity);
      
      let newCurrentStreak = streak.currentStreak;
      let newLongestStreak = streak.longestStreak;
      
      // Si la última actividad fue hoy, no hacemos nada
      if (formattedLastActivity === formattedToday) {
        return streak;
      }
      
      // Si la última actividad fue ayer, incrementamos la racha
      if (formattedLastActivity === formattedYesterday) {
        newCurrentStreak += 1;
        if (newCurrentStreak > newLongestStreak) {
          newLongestStreak = newCurrentStreak;
        }
      } else if (formattedLastActivity < formattedYesterday) {
        // Si han pasado más de un día, reiniciamos la racha
        newCurrentStreak = 1;
      }
      
      // Actualizar la racha
      const [updated] = await db
        .update(contractorStreaks)
        .set({
          currentStreak: newCurrentStreak,
          longestStreak: newLongestStreak,
          lastActivityDate: today,
          updatedAt: new Date()
        })
        .where(eq(contractorStreaks.contractorId, contractorId))
        .returning();
      
      // Verificar logros de racha
      if (newCurrentStreak >= 7) {
        await checkAndUpdateAchievement({
          contractorId,
          category: 'system',
          code: 'streak_week',
          progress: 7
        });
      }
      
      if (newCurrentStreak >= 30) {
        await checkAndUpdateAchievement({
          contractorId,
          category: 'system',
          code: 'streak_month',
          progress: 30
        });
      }
      
      return updated;
    } else {
      // Crear registro de racha si no existe
      const [created] = await db
        .insert(contractorStreaks)
        .values({
          contractorId,
          currentStreak: 1,
          longestStreak: 1,
          lastActivityDate: today,
          level: 1,
          xp: 0,
          nextLevelXp: 100
        })
        .returning();
      
      return created;
    }
  } catch (error) {
    console.error("Error al actualizar racha diaria:", error);
    throw new Error("No se pudo actualizar la racha diaria");
  }
}

/**
 * Obtiene las estadísticas de gamificación del contratista
 */
export async function getContractorGameStats(contractorId: number) {
  try {
    // Obtener la racha
    const streak = await db.query.contractorStreaks.findFirst({
      where: eq(contractorStreaks.contractorId, contractorId)
    });
    
    // Contar logros completados
    const achievements = await db.query.contractorAchievements.findMany({
      where: and(
        eq(contractorAchievements.contractorId, contractorId),
        eq(contractorAchievements.isCompleted, true)
      ),
      with: {
        achievement: true
      }
    });
    
    const completedCount = achievements.length;
    
    // Calcular total de XP
    const totalXp = achievements.reduce((sum, a) => sum + (a.achievement?.points || 0), 0);
    
    // Contar logros por nivel
    const bronzeCount = achievements.filter(a => a.achievement?.level === 'bronze').length;
    const silverCount = achievements.filter(a => a.achievement?.level === 'silver').length;
    const goldCount = achievements.filter(a => a.achievement?.level === 'gold').length;
    
    return {
      streak: streak || null,
      stats: {
        completedAchievements: completedCount,
        totalXp,
        bronzeCount,
        silverCount,
        goldCount
      }
    };
  } catch (error) {
    console.error("Error al obtener estadísticas de gamificación:", error);
    throw new Error("No se pudieron obtener las estadísticas de gamificación");
  }
}