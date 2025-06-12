import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { 
  CreditCard, 
  Crown, 
  Users, 
  Zap, 
  Calendar, 
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowUpCircle,
  ArrowDownCircle,
  Home
} from "lucide-react";
import { Redirect } from "wouter";

interface SubscriptionInfo {
  currentPlan: {
    name: string;
    displayName: string;
    price: string;
    clientLimit: number | null;
    aiUsageLimit: number | null;
    hasTimeClockAccess: boolean;
    hasStripeIntegration: boolean;
  };
  subscriptionStatus: string;
  planStartDate: string | null;
  planEndDate: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  usage: {
    clientCount: number;
    aiUsageThisMonth: number;
  };
  availablePlans: Array<{
    name: string;
    displayName: string;
    price: string;
    clientLimit: number | null;
    aiUsageLimit: number | null;
    hasTimeClockAccess: boolean;
    hasStripeIntegration: boolean;
  }>;
}

const BillingPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUpgrading, setIsUpgrading] = useState(false);

  if (!user) {
    return <Redirect to="/auth" />;
  }

  const { data: subscriptionInfo, isLoading } = useQuery<SubscriptionInfo>({
    queryKey: ['/api/billing/subscription-info'],
  });

  const upgradeMutation = useMutation({
    mutationFn: async (planName: string) => {
      const response = await apiRequest('POST', '/api/billing/upgrade', { planName });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        toast({
          title: "Plan Updated",
          description: "Your subscription plan has been updated successfully.",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/billing/subscription-info'] });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Upgrade Failed",
        description: error.message || "Failed to upgrade plan. Please try again.",
        variant: "destructive",
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/billing/cancel');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription will remain active until the end of your billing period.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/billing/subscription-info'] });
    },
    onError: (error: any) => {
      toast({
        title: "Cancellation Failed",
        description: error.message || "Failed to cancel subscription. Please contact support.",
        variant: "destructive",
      });
    },
  });

  const handleUpgrade = (planName: string) => {
    setIsUpgrading(true);
    upgradeMutation.mutate(planName);
  };

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to cancel your subscription? You'll lose access to premium features at the end of your billing period.")) {
      cancelMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!subscriptionInfo) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Unable to Load Billing Information</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Please try refreshing the page or contact support if the problem persists.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'trial':
        return <Calendar className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'trial':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header with Home Button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Billing & Subscription
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your Remodra subscription and billing information
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Home
          </Button>
        </div>

        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">{subscriptionInfo.currentPlan.displayName}</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  ${subscriptionInfo.currentPlan.price}/month
                </p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(subscriptionInfo.subscriptionStatus)}
                <Badge className={getStatusColor(subscriptionInfo.subscriptionStatus)}>
                  {subscriptionInfo.subscriptionStatus.charAt(0).toUpperCase() + 
                   subscriptionInfo.subscriptionStatus.slice(1)}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Plan Details */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Plan Features</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Client Limit</span>
                    <span className="font-medium">
                      {subscriptionInfo.currentPlan.clientLimit || 'Unlimited'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>AI Analysis</span>
                    <span className="font-medium">
                      {subscriptionInfo.currentPlan.aiUsageLimit ? 
                        `${subscriptionInfo.currentPlan.aiUsageLimit}/month` : 
                        subscriptionInfo.currentPlan.aiUsageLimit === null ? 'Unlimited' : 'Not included'
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Time Clock</span>
                    <span className="font-medium">
                      {subscriptionInfo.currentPlan.hasTimeClockAccess ? 'Included' : 'Not included'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Stripe Integration</span>
                    <span className="font-medium">
                      {subscriptionInfo.currentPlan.hasStripeIntegration ? 'Included' : 'Not included'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Current Usage</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Active Clients</span>
                    <span className="font-medium">
                      {subscriptionInfo.usage.clientCount}
                      {subscriptionInfo.currentPlan.clientLimit && 
                        ` / ${subscriptionInfo.currentPlan.clientLimit}`
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>AI Usage This Month</span>
                    <span className="font-medium">
                      {subscriptionInfo.usage.aiUsageThisMonth}
                      {subscriptionInfo.currentPlan.aiUsageLimit && 
                        ` / ${subscriptionInfo.currentPlan.aiUsageLimit}`
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Billing Dates */}
            {subscriptionInfo.planStartDate && (
              <div>
                <h4 className="font-semibold mb-3">Billing Information</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Current Period Started</span>
                    <p className="font-medium">
                      {new Date(subscriptionInfo.planStartDate).toLocaleDateString()}
                    </p>
                  </div>
                  {subscriptionInfo.planEndDate && (
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {subscriptionInfo.subscriptionStatus === 'cancelled' ? 'Access Ends' : 'Next Billing Date'}
                      </span>
                      <p className="font-medium">
                        {new Date(subscriptionInfo.planEndDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Plans */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpCircle className="h-5 w-5 text-blue-500" />
              Available Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              {subscriptionInfo.availablePlans.map((plan) => {
                const isCurrent = plan.name === subscriptionInfo.currentPlan.name;
                const isUpgrade = parseInt(plan.price) > parseInt(subscriptionInfo.currentPlan.price);
                
                return (
                  <Card key={plan.name} className={`relative ${isCurrent ? 'ring-2 ring-blue-500' : ''}`}>
                    {isCurrent && (
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-blue-500 text-white">Current Plan</Badge>
                      </div>
                    )}
                    
                    <CardHeader className="text-center">
                      <CardTitle>{plan.displayName}</CardTitle>
                      <div className="text-3xl font-bold">${plan.price}<span className="text-sm font-normal">/month</span></div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span>Clients</span>
                          <span>{plan.clientLimit || 'Unlimited'}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>AI Analysis</span>
                          <span>
                            {plan.aiUsageLimit ? `${plan.aiUsageLimit}/month` : 
                             plan.aiUsageLimit === null ? 'Unlimited' : 'None'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Time Clock</span>
                          <span>{plan.hasTimeClockAccess ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Stripe</span>
                          <span>{plan.hasStripeIntegration ? 'Yes' : 'No'}</span>
                        </div>
                      </div>
                      
                      {!isCurrent && (
                        <Button 
                          onClick={() => handleUpgrade(plan.name)}
                          disabled={upgradeMutation.isPending}
                          className="w-full"
                          variant={isUpgrade ? "default" : "outline"}
                        >
                          {isUpgrade ? (
                            <>
                              <ArrowUpCircle className="h-4 w-4 mr-2" />
                              Upgrade to {plan.displayName}
                            </>
                          ) : (
                            <>
                              <ArrowDownCircle className="h-4 w-4 mr-2" />
                              Downgrade to {plan.displayName}
                            </>
                          )}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Billing Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Billing Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subscriptionInfo.stripeCustomerId && (
                <Button variant="outline" className="w-full">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Manage Payment Methods
                </Button>
              )}
              
              <Button variant="outline" className="w-full">
                Download Invoice History
              </Button>
              
              {subscriptionInfo.subscriptionStatus === 'active' && (
                <Button 
                  variant="destructive" 
                  onClick={handleCancel}
                  disabled={cancelMutation.isPending}
                  className="w-full"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Subscription
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BillingPage;