import { achievements, achievementRewards } from '@shared/schema';

// Achievement sample data
export const achievementSeedData = [
  // Client achievements
  {
    code: 'first_client',
    name: 'First Client',
    description: 'You added your first client to the system',
    category: 'client',
    points: 10,
    icon: 'UserPlus',
    requiredCount: 1,
    level: 'bronze',
    badgeColor: '#CD7F32'
  },
  {
    code: 'client_master',
    name: 'Client Master',
    description: 'You manage 10 active clients in the system',
    category: 'client',
    points: 50,
    icon: 'Users',
    requiredCount: 10,
    level: 'silver',
    badgeColor: '#C0C0C0'
  },
  {
    code: 'client_empire',
    name: 'Client Empire',
    description: 'Your network has grown to 25 clients',
    category: 'client',
    points: 100,
    icon: 'Building',
    requiredCount: 25,
    level: 'gold',
    badgeColor: '#FFD700'
  },
  
  // Project achievements
  {
    code: 'first_project',
    name: 'First Project',
    description: 'You created your first project in ContractorHub',
    category: 'project',
    points: 15,
    icon: 'Hammer',
    requiredCount: 1,
    level: 'bronze',
    badgeColor: '#CD7F32'
  },
  {
    code: 'project_master',
    name: 'Project Master',
    description: 'You have successfully completed 5 projects',
    category: 'project',
    points: 75,
    icon: 'Trophy',
    requiredCount: 5,
    level: 'silver',
    badgeColor: '#C0C0C0'
  },
  {
    code: 'project_variety',
    name: 'Project Variety',
    description: 'You have worked on 3 different types of services',
    category: 'project',
    points: 60,
    icon: 'Layers',
    requiredCount: 3,
    level: 'silver',
    badgeColor: '#C0C0C0'
  },
  
  // Estimate achievements
  {
    code: 'first_estimate',
    name: 'First Estimate',
    description: 'You created your first estimate for a client',
    category: 'estimate',
    points: 15,
    icon: 'Calculator',
    requiredCount: 1,
    level: 'bronze',
    badgeColor: '#CD7F32'
  },
  {
    code: 'estimate_accepted',
    name: 'Proposal Accepted',
    description: 'A client has accepted your estimate',
    category: 'estimate',
    points: 25,
    icon: 'CheckCircle',
    requiredCount: 1,
    level: 'bronze',
    badgeColor: '#CD7F32'
  },
  {
    code: 'estimate_master',
    name: 'Expert Estimator',
    description: 'You have converted 10 estimates into projects',
    category: 'estimate',
    points: 100,
    icon: 'TrendingUp',
    requiredCount: 10,
    level: 'gold',
    badgeColor: '#FFD700'
  },
  
  // Invoice achievements
  {
    code: 'first_invoice',
    name: 'First Invoice',
    description: 'You created your first invoice in the system',
    category: 'invoice',
    points: 15,
    icon: 'FileText',
    requiredCount: 1,
    level: 'bronze',
    badgeColor: '#CD7F32'
  },
  {
    code: 'invoice_paid',
    name: 'First Payment',
    description: 'You received payment for your first invoice',
    category: 'invoice',
    points: 20,
    icon: 'DollarSign',
    requiredCount: 1,
    level: 'bronze',
    badgeColor: '#CD7F32'
  },
  {
    code: 'invoice_master',
    name: 'Financial Master',
    description: 'You have received payments for 10 invoices',
    category: 'invoice',
    points: 75,
    icon: 'TrendingUp',
    requiredCount: 10,
    level: 'silver',
    badgeColor: '#C0C0C0'
  },
  
  // System usage achievements
  {
    code: 'streak_week',
    name: 'Weekly Consistency',
    description: 'You have logged in for 7 consecutive days',
    category: 'system',
    points: 30,
    icon: 'Calendar',
    requiredCount: 7,
    level: 'bronze',
    badgeColor: '#CD7F32'
  },
  {
    code: 'streak_month',
    name: 'Monthly Consistency',
    description: 'You have maintained a streak of 30 consecutive days',
    category: 'system',
    points: 100,
    icon: 'Award',
    requiredCount: 30,
    level: 'gold',
    badgeColor: '#FFD700'
  },
  {
    code: 'feature_explorer',
    name: 'Feature Explorer',
    description: 'You have used all the main features of ContractorHub',
    category: 'system',
    points: 50,
    icon: 'Compass',
    requiredCount: 1,
    level: 'silver',
    badgeColor: '#C0C0C0'
  },
  
  // AI achievements
  {
    code: 'ai_assistant',
    name: 'AI Assistant',
    description: 'You have used your first AI analysis for a project',
    category: 'ai',
    points: 20,
    icon: 'Brain',
    requiredCount: 1,
    level: 'bronze',
    badgeColor: '#CD7F32'
  },
  {
    code: 'ai_master',
    name: 'AI Master',
    description: 'You have used AI to analyze 10 projects',
    category: 'ai',
    points: 75,
    icon: 'Cpu',
    requiredCount: 10,
    level: 'silver',
    badgeColor: '#C0C0C0'
  }
];

// Achievement reward sample data
export const rewardSeedData = [
  {
    achievementCode: 'client_empire',
    type: 'feature',
    description: 'Access to advanced client analytics tools',
    value: 'advanced_client_analytics',
    duration: null
  },
  {
    achievementCode: 'estimate_master',
    type: 'feature',
    description: 'Access to premium estimate templates',
    value: 'premium_estimate_templates',
    duration: null
  },
  {
    achievementCode: 'invoice_master',
    type: 'discount',
    description: '10% discount on your plan for 3 months',
    value: '10',
    duration: 90
  },
  {
    achievementCode: 'streak_month',
    type: 'feature',
    description: 'Dark mode unlocked',
    value: 'dark_mode',
    duration: null
  },
  {
    achievementCode: 'ai_master',
    type: 'credit',
    description: '50 additional credits for AI analysis',
    value: '50',
    duration: null
  }
];