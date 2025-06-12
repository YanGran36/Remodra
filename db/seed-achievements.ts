import { db } from '.';
import { achievementSeedData, rewardSeedData } from './achievement-seeds';
import { achievements, achievementRewards, contractors, contractorAchievements } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function seedAchievements() {
  console.log('Comenzando la siembra de logros...');
  
  try {
    // Insertar logros
    for (const achievement of achievementSeedData) {
      // Verificar si el logro ya existe
      const existingAchievement = await db.query.achievements.findFirst({
        where: eq(achievements.name, achievement.name)
      });
      
      if (!existingAchievement) {
        await db.insert(achievements).values({
          code: achievement.code,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          category: achievement.category,
          points: achievement.points,
          requiredCount: achievement.requiredCount,
          level: achievement.level,
          badgeColor: achievement.badgeColor
        });
        
        console.log(`✅ Logro insertado: ${achievement.name}`);
      } else {
        console.log(`⚠️ Logro ya existe: ${achievement.name}`);
      }
    }
    
    // Insertar recompensas
    for (const reward of rewardSeedData) {
      // Obtener el ID del logro relacionado
      const relatedAchievement = await db.query.achievements.findFirst({
        where: eq(achievements.code, reward.achievementCode)
      });
      
      if (relatedAchievement) {
        // Verificar si la recompensa ya existe
        const existingReward = await db.query.achievementRewards.findFirst({
          where: eq(achievementRewards.description, reward.description)
        });
        
        if (!existingReward) {
          await db.insert(achievementRewards).values({
            achievementId: relatedAchievement.id,
            type: reward.type,
            description: reward.description,
            value: reward.value,
            duration: reward.duration,
          });
          
          console.log(`✅ Recompensa insertada para: ${relatedAchievement.name}`);
        } else {
          console.log(`⚠️ Recompensa ya existe para: ${relatedAchievement.name}`);
        }
      } else {
        console.log(`❌ No se encontró el logro relacionado para la recompensa: ${reward.achievementCode}`);
      }
    }
    
    // Inicializar logros para contratistas existentes
    console.log('Inicializando logros para contratistas existentes...');
    
    const allContractors = await db.query.contractors.findMany();
    const allAchievements = await db.query.achievements.findMany();
    
    for (const contractor of allContractors) {
      console.log(`Inicializando logros para contratista: ${contractor.firstName} ${contractor.lastName}`);
      
      for (const achievement of allAchievements) {
        // Verificar si el contratista ya tiene este logro inicializado
        const existingProgress = await db.query.contractorAchievements.findFirst({
          where: (ca) => 
            eq(ca.contractorId, contractor.id) && 
            eq(ca.achievementId, achievement.id)
        });
        
        if (!existingProgress) {
          await db.insert(contractorAchievements).values({
            contractorId: contractor.id,
            achievementId: achievement.id,
            progress: 0,
            isCompleted: false,
            notified: false,
            unlockedReward: false
          });
          
          console.log(`  ✅ Logro inicializado: ${achievement.name}`);
        } else {
          console.log(`  ⚠️ Logro ya inicializado: ${achievement.name}`);
        }
      }
    }
    
    console.log('✅ Siembra de logros completada con éxito');
  } catch (error) {
    console.error('❌ Error al sembrar los logros:', error);
    throw error;
  }
}

// Ejecutar la función de siembra
seedAchievements()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Falló la siembra de logros:', error);
    process.exit(1);
  });