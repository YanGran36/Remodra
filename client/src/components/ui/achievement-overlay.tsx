import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from './badge';
import { Button } from './button';
import { Progress } from './progress';
import { X, Award, Trophy, Star, Gift, Calendar, Brain, Zap, Check } from 'lucide-react';
import { Achievement, ContractorAchievement, AchievementReward } from '@shared/schema';
import { cn } from '@/lib/utils';

interface AchievementOverlayProps {
  achievement: Achievement;
  contractorAchievement: ContractorAchievement;
  reward?: AchievementReward;
  onClose: () => void;
}

export function AchievementOverlay({ achievement, contractorAchievement, reward, onClose }: AchievementOverlayProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [showConfetti, setShowConfetti] = useState(true);

  // Effect to auto-close after 15 seconds if the user does not interact
  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, 15000);

    // Ocultar el confeti después de 3 segundos
    const confettiTimer = setTimeout(() => {
      setShowConfetti(false);
    }, 3000);

    return () => {
      clearTimeout(timer);
      clearTimeout(confettiTimer);
    };
  }, []);

  // Elegir el ícono según la categoría
  const renderIcon = () => {
    switch (achievement.category) {
      case 'client':
        return <Award className="h-16 w-16 stroke-1" />;
      case 'project':
        return <Trophy className="h-16 w-16 stroke-1" />;
      case 'estimate':
        return <Star className="h-16 w-16 stroke-1" />;
      case 'invoice':
        return <Zap className="h-16 w-16 stroke-1" />;
      case 'system':
        return <Calendar className="h-16 w-16 stroke-1" />;
      case 'ai':
        return <Brain className="h-16 w-16 stroke-1" />;
      default:
        return <Award className="h-16 w-16 stroke-1" />;
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    // Permitir tiempo para la animación de salida
    setTimeout(() => {
      onClose();
    }, 500);
  };

  // Colores para los diferentes niveles de logro
  const getLevelColors = (level: string) => {
    switch (level) {
      case 'gold':
        return {
          bgFrom: 'from-amber-500/30',
          bgTo: 'to-amber-700/10',
          text: 'text-amber-500',
          border: 'border-amber-500/50',
          iconGlow: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.6))',
        };
      case 'silver':
        return {
          bgFrom: 'from-slate-400/30',
          bgTo: 'to-slate-500/10',
          text: 'text-slate-400',
          border: 'border-slate-400/50',
          iconGlow: 'drop-shadow(0 0 8px rgba(148, 163, 184, 0.6))',
        };
      case 'bronze':
      default:
        return {
          bgFrom: 'from-amber-700/30',
          bgTo: 'to-amber-800/10',
          text: 'text-amber-700',
          border: 'border-amber-700/50',
          iconGlow: 'drop-shadow(0 0 8px rgba(180, 83, 9, 0.6))',
        };
    }
  };

  const levelColors = getLevelColors(achievement.level || 'bronze');

  // Calcular el progreso actual
  const progress = contractorAchievement?.progress || 0;
  const progressPercent = Math.min(100, Math.round((progress / achievement.requiredCount) * 100));

  // Varios confeti para animar
  const Confetti = () => {
    if (!showConfetti) return null;

    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => {
          const randomX = Math.random() * 100;
          const randomY = Math.random() * 100;
          const size = Math.random() * 10 + 5;
          const color = `hsl(${Math.random() * 360}, 80%, 60%)`;
          const delay = Math.random() * 0.5;
          const duration = Math.random() * 1 + 0.5;

          return (
            <motion.div
              key={i}
              initial={{ 
                x: `${50}%`, 
                y: `${50}%`,
                opacity: 1,
                scale: 0
              }}
              animate={{ 
                x: `${randomX}%`, 
                y: `${randomY}%`,
                opacity: [1, 1, 0],
                scale: [0, 1, 1]
              }}
              transition={{ 
                duration, 
                delay,
                ease: 'easeOut'
              }}
              style={{
                position: 'absolute',
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: color,
                borderRadius: '50%',
              }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
          />
          
          <Confetti />
          
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className={cn(
              "relative z-50 flex flex-col items-center justify-center w-full max-w-md p-8 mx-4 overflow-hidden",
              "rounded-xl shadow-2xl border-2",
              "bg-gradient-to-b from-background/95 to-background/90",
              levelColors.border
            )}
          >
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground" 
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex flex-col items-center text-center"
            >
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                  scale: [0.8, 1.1, 1],
                  opacity: 1,
                  rotate: [0, -10, 10, 0]
                }}
                transition={{ 
                  duration: 0.6,
                  times: [0, 0.5, 0.8, 1],
                  ease: "easeInOut" 
                }}
                className={cn(
                  "flex items-center justify-center w-36 h-36 mb-5 rounded-full", 
                  "bg-gradient-to-br", levelColors.bgFrom, levelColors.bgTo,
                  "border-2", levelColors.border,
                  "shadow-lg"
                )}
              >
                <div 
                  className={cn(
                    "flex items-center justify-center w-24 h-24 rounded-full",
                    levelColors.text,
                    levelColors.iconGlow
                  )}
                >
                  {renderIcon()}
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Badge 
                  className={cn(
                    "mb-3 px-4 py-1.5 text-sm font-semibold",
                    levelColors.bgFrom.replace('/30', '/10'),
                    levelColors.text,
                    levelColors.border,
                  )}
                >
                  {achievement.level?.toUpperCase()}
                </Badge>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <h2 className="text-2xl font-bold text-primary mb-2">
                  ¡Logro Desbloqueado!
                </h2>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <h3 className="text-xl font-semibold mb-2">
                  {achievement.name}
                </h3>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <p className="text-muted-foreground mb-5">
                  {achievement.description}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
                className="bg-primary/5 rounded-lg p-4 w-full mb-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Progreso</span>
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-primary">
                      {progress}/{achievement.requiredCount}
                    </span>
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <Progress 
                  value={progressPercent} 
                  className={cn(
                    "h-2.5 bg-primary/10"
                  )} 
                />
                
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="flex justify-center mt-3"
                >
                  <div className="flex items-center gap-1 text-primary font-medium">
                    <Zap className="h-4 w-4" />
                    <span>+{achievement.points} XP</span>
                  </div>
                </motion.div>
              </motion.div>

              {reward && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}
                  className={cn(
                    "bg-gradient-to-r from-amber-500/20 to-amber-700/10 border border-amber-500/30",
                    "rounded-lg p-4 w-full mt-1 mb-4"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="w-5 h-5 text-amber-500" />
                    <h4 className="font-semibold text-amber-500">¡Recompensa Desbloqueada!</h4>
                  </div>
                  <p className="text-sm">{reward.description}</p>
                </motion.div>
              )}
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1 }}
                className="w-full flex justify-center mt-3"
              >
                <Button 
                  onClick={handleClose} 
                  className="w-full"
                  size="lg"
                >
                  Continuar
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}