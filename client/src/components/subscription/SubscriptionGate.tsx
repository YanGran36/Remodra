import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Crown, Zap, Clock, CreditCard, Palette, Users, AlertTriangle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface SubscriptionStatus {
  contractor: {
    subscriptionPlan: string;
    subscriptionStatus: string;
  };
  plan: {
    planName: string;
    priceMonthly: number;
    maxClients: number;
    hasAiCostAnalysis: boolean;
    hasTimeClock: boolean;
    hasStripeIntegration: boolean;
    hasCustomPortal: boolean;
    hasBrandedPortal: boolean;
    aiUsageLimit: number;
  };
  usage: {
    currentClientCount: number;
    maxClients: number;
    clientsRemaining: string | number;
    currentAiUsage: number;
    maxAiUsage: number;
    aiUsageRemaining: string | number;
  };
}

interface SubscriptionGateProps {
  feature: 'hasAiCostAnalysis' | 'hasTimeClock' | 'hasStripeIntegration' | 'hasCustomPortal' | 'hasBrandedPortal';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const SubscriptionGate: React.FC<SubscriptionGateProps> = ({ 
  feature, 
  children, 
  fallback 
}) => {
  const [hasAccess, setHasAccess] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const response = await apiRequest('GET', '/api/subscription/status');
        const data = await response.json();
        setSubscriptionStatus(data);
        setHasAccess(data.plan[feature] === true);
      } catch (error) {
        console.error('Failed to check subscription access:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [feature]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!hasAccess) {
    return fallback || (
      <UpgradePrompt 
        feature={feature} 
        currentPlan={subscriptionStatus?.contractor.subscriptionPlan || 'basic'}
        subscriptionStatus={subscriptionStatus}
      />
    );
  }

  return <>{children}</>;
};

interface ClientLimitGateProps {
  children: React.ReactNode;
  onLimitReached?: () => void;
}

export const ClientLimitGate: React.FC<ClientLimitGateProps> = ({ 
  children, 
  onLimitReached 
}) => {
  const [canAddClient, setCanAddClient] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);

  useEffect(() => {
    const checkClientLimit = async () => {
      try {
        const response = await apiRequest('GET', '/api/subscription/status');
        const data = await response.json();
        setSubscriptionStatus(data);
        
        const { currentClientCount, maxClients } = data.usage;
        setCanAddClient(maxClients === -1 || currentClientCount < maxClients);
      } catch (error) {
        console.error('Failed to check client limit:', error);
        setCanAddClient(false);
      }
    };

    checkClientLimit();
  }, []);

  if (!canAddClient) {
    if (onLimitReached) {
      onLimitReached();
    }
    return (
      <ClientLimitPrompt 
        subscriptionStatus={subscriptionStatus}
      />
    );
  }

  return <>{children}</>;
};

interface UpgradePromptProps {
  feature: string;
  currentPlan: string;
  subscriptionStatus: SubscriptionStatus | null;
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({ 
  feature, 
  currentPlan, 
  subscriptionStatus 
}) => {
  const featureNames = {
    hasAiCostAnalysis: 'AI Cost Analysis',
    hasTimeClock: 'Time Clock',
    hasStripeIntegration: 'Stripe Integration',
    hasCustomPortal: 'Custom Client Portal',
    hasBrandedPortal: 'Branded Client Portal'
  };

  const getRecommendedPlan = () => {
    if (feature === 'hasStripeIntegration' || feature === 'hasBrandedPortal') {
      return 'business';
    }
    if (currentPlan === 'basic') {
      return 'pro';
    }
    return 'business';
  };

  const recommendedPlan = getRecommendedPlan();
  const planPrices = { basic: 29, pro: 59, business: 99 };

  return (
    <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-amber-600" />
          <CardTitle className="text-lg">Upgrade Required</CardTitle>
          <Badge variant="outline" className="text-amber-700 border-amber-300">
            {currentPlan.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-700 dark:text-gray-300">
          <strong>{featureNames[feature as keyof typeof featureNames]}</strong> requires a higher subscription plan.
        </p>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">
            Recommended: {recommendedPlan.toUpperCase()} Plan
          </h4>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-green-700 dark:text-green-400">
              ${planPrices[recommendedPlan as keyof typeof planPrices]}/month
            </span>
            <Button className="bg-green-600 hover:bg-green-700">
              Upgrade Now
            </Button>
          </div>
        </div>

        {subscriptionStatus && (
          <SubscriptionUsageCard subscriptionStatus={subscriptionStatus} />
        )}
      </CardContent>
    </Card>
  );
};

interface ClientLimitPromptProps {
  subscriptionStatus: SubscriptionStatus | null;
}

const ClientLimitPrompt: React.FC<ClientLimitPromptProps> = ({ subscriptionStatus }) => {
  if (!subscriptionStatus) return null;

  const { currentClientCount, maxClients } = subscriptionStatus.usage;
  const currentPlan = subscriptionStatus.contractor.subscriptionPlan;

  return (
    <Card className="border-red-200 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950 dark:to-pink-950">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <CardTitle className="text-lg">Client Limit Reached</CardTitle>
          <Badge variant="outline" className="text-red-700 border-red-300">
            {currentPlan.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-700 dark:text-gray-300">
          You've reached your limit of <strong>{maxClients} clients</strong> for the {currentPlan} plan.
        </p>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <span>Clients Used</span>
            <span className="font-semibold">{currentClientCount} / {maxClients}</span>
          </div>
          <Progress value={100} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border text-center">
            <h4 className="font-semibold text-blue-700 dark:text-blue-400">PRO Plan</h4>
            <p className="text-lg font-bold">$59/month</p>
            <p className="text-sm text-gray-600">Up to 50 clients</p>
            <Button size="sm" className="mt-2 w-full">Upgrade</Button>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border text-center">
            <h4 className="font-semibold text-green-700 dark:text-green-400">BUSINESS Plan</h4>
            <p className="text-lg font-bold">$99/month</p>
            <p className="text-sm text-gray-600">Unlimited clients</p>
            <Button size="sm" className="mt-2 w-full bg-green-600 hover:bg-green-700">Upgrade</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface SubscriptionUsageCardProps {
  subscriptionStatus: SubscriptionStatus;
}

export const SubscriptionUsageCard: React.FC<SubscriptionUsageCardProps> = ({ 
  subscriptionStatus 
}) => {
  const { plan, usage } = subscriptionStatus;

  const getUsagePercentage = (current: number, max: number | string) => {
    if (max === 'unlimited' || max === -1) return 0;
    return Math.min((current / (max as number)) * 100, 100);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Current Usage</CardTitle>
          <Badge variant="outline" className="text-blue-700 border-blue-300">
            {plan.planName.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Clients Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span>Clients</span>
            </div>
            <span className="font-semibold">
              {usage.currentClientCount} / {usage.maxClients === -1 ? '∞' : usage.maxClients}
            </span>
          </div>
          {usage.maxClients !== -1 && (
            <Progress 
              value={getUsagePercentage(usage.currentClientCount, usage.maxClients)} 
              className="h-2" 
            />
          )}
        </div>

        {/* AI Usage */}
        {plan.hasAiCostAnalysis && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-600" />
                <span>AI Analysis (This Month)</span>
              </div>
              <span className="font-semibold">
                {usage.currentAiUsage} / {usage.maxAiUsage === -1 ? '∞' : usage.maxAiUsage}
              </span>
            </div>
            {usage.maxAiUsage !== -1 && (
              <Progress 
                value={getUsagePercentage(usage.currentAiUsage, usage.maxAiUsage)} 
                className="h-2" 
              />
            )}
          </div>
        )}

        {/* Features */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
          <div className="flex items-center gap-2 text-sm">
            <Clock className={`h-4 w-4 ${plan.hasTimeClock ? 'text-green-600' : 'text-gray-400'}`} />
            <span className={plan.hasTimeClock ? 'text-green-700' : 'text-gray-500'}>
              Time Clock
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CreditCard className={`h-4 w-4 ${plan.hasStripeIntegration ? 'text-green-600' : 'text-gray-400'}`} />
            <span className={plan.hasStripeIntegration ? 'text-green-700' : 'text-gray-500'}>
              Stripe
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Palette className={`h-4 w-4 ${plan.hasCustomPortal ? 'text-green-600' : 'text-gray-400'}`} />
            <span className={plan.hasCustomPortal ? 'text-green-700' : 'text-gray-500'}>
              Custom Portal
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Crown className={`h-4 w-4 ${plan.hasBrandedPortal ? 'text-green-600' : 'text-gray-400'}`} />
            <span className={plan.hasBrandedPortal ? 'text-green-700' : 'text-gray-500'}>
              Branded Portal
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};