import { useQuery } from '@tanstack/react-query';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Star, Zap, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Achievement, ContractorAchievement } from '@shared/schema';

/**
 * Componente que muestra un resumen de los logros en el dashboard
 */
// Tipos para las respuestas de API
interface StatsResponse {
  streak?: {
    id: number;
    contractorId: number;
    currentStreak: number;
    longestStreak: number;
    lastActive: string;
    level: number;
    xp: number;
    nextLevelXp: number;
    createdAt: string;
    updatedAt: string;
  };
  stats?: {
    completedAchievements: number;
    totalAchievements: number;
    bronzeCount: number;
    silverCount: number;
    goldCount: number;
  };
}

interface ContractorAchievementWithDetails extends ContractorAchievement {
  achievement: Achievement;
  progress: number;
  isCompleted: boolean;
}

export function AchievementSummary() {
  // Obtener estadísticas y logros - usando enabled para cargar secuencialmente
  const { data: stats, isLoading: loadingStats } = useQuery<StatsResponse>({
    queryKey: ['/api/contractor/stats'],
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
  });
  
  const { data: achievements, isLoading: loadingAchievements } = useQuery<ContractorAchievementWithDetails[]>({
    queryKey: ['/api/contractor/achievements'],
    enabled: !!stats, // Solo cargar logros después de obtener stats
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
  });

  const isLoading = loadingStats || loadingAchievements;
  
  if (isLoading || !stats) {
    return (
      <Card className="col-span-full lg:col-span-4">
        <CardHeader className="pb-2 space-y-0">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            My Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[120px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate statistics
  const totalAchievements = achievements?.length || 0;
  const completedAchievements = stats?.stats?.completedAchievements || 0;
  const completionPercentage = totalAchievements > 0 
    ? Math.round((completedAchievements / totalAchievements) * 100) 
    : 0;
  
  // Find upcoming achievements (with progress > 0 but not completed)
  const upcomingAchievements = achievements
    ?.filter((a: ContractorAchievementWithDetails) => a.progress > 0 && !a.isCompleted)
    ?.sort((a: ContractorAchievementWithDetails, b: ContractorAchievementWithDetails) => {
      const aProgress = a.progress / a.achievement.requiredCount;
      const bProgress = b.progress / b.achievement.requiredCount;
      return bProgress - aProgress; // Sort by highest progress first
    })
    ?.slice(0, 2) || [];

  return (
    <Card className="col-span-full lg:col-span-4">
      <CardHeader className="pb-2 space-y-0">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          My Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Level and XP */}
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center",
              "bg-gradient-to-br from-primary/20 to-primary/5",
              "border border-primary/20"
            )}>
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-sm text-muted-foreground">Level</span>
                <span className="text-sm font-medium">
                  {stats?.streak?.xp || 0}/{stats?.streak?.nextLevelXp || 100} XP
                </span>
              </div>
              <Progress 
                value={Math.round(((stats?.streak?.xp || 0) / (stats?.streak?.nextLevelXp || 100)) * 100)} 
                className="h-2 mb-1" 
              />
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Current level</span>
                <span className="font-medium text-primary">{stats?.streak?.level || 1}</span>
              </div>
            </div>
          </div>
          
          {/* Streak */}
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center",
              "bg-gradient-to-br from-amber-500/20 to-amber-700/5",
              "border border-amber-500/20"
            )}>
              <Star className="h-6 w-6 text-amber-500" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-sm text-muted-foreground">Current streak</span>
                <span className="text-sm font-medium">{stats?.streak?.currentStreak || 0} days</span>
              </div>
              <Progress 
                value={Math.min(100, (stats?.streak?.currentStreak || 0) * 10)} 
                className="h-2 bg-amber-500/10" 
              />
              <div className="flex justify-between text-xs mt-1">
                <span className="text-muted-foreground">Best streak</span>
                <span className="font-medium text-amber-500">{stats?.streak?.longestStreak || 0} days</span>
              </div>
            </div>
          </div>
          
          {/* Achievement progress */}
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center",
              "bg-gradient-to-br from-slate-400/20 to-slate-500/5",
              "border border-slate-400/20"
            )}>
              <Award className="h-6 w-6 text-slate-400" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-sm text-muted-foreground">Achievements completed</span>
                <span className="text-sm font-medium">{completedAchievements}/{totalAchievements}</span>
              </div>
              <Progress 
                value={completionPercentage} 
                className="h-2 bg-slate-400/10" 
              />
              <div className="flex justify-between text-xs mt-1">
                <div className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-700"></span>
                  <span className="text-muted-foreground">Bronze: {stats?.stats?.bronzeCount || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-slate-400"></span>
                  <span className="text-muted-foreground">Silver: {stats?.stats?.silverCount || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
                  <span className="text-muted-foreground">Gold: {stats?.stats?.goldCount || 0}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Upcoming achievements */}
          {upcomingAchievements.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Upcoming achievements</h4>
              <div className="space-y-3">
                {upcomingAchievements.map((achievement: ContractorAchievementWithDetails) => {
                  const progress = achievement.progress;
                  const required = achievement.achievement.requiredCount;
                  const percentage = Math.round((progress / required) * 100);
                  
                  return (
                    <div key={achievement.achievementId} className="bg-background/50 p-3 rounded-lg border border-border/50">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {achievement.achievement.name}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {progress}/{required}
                        </span>
                      </div>
                      <Progress 
                        value={percentage} 
                        className="h-1.5 mt-1" 
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}