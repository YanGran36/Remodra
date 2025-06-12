import { Request, Response, NextFunction } from 'express';
import { db } from '@db';
import { contractors, subscriptionPlans, clients, aiUsageLog } from '@shared/schema';
import { eq, and, count, gte } from 'drizzle-orm';

interface SubscriptionLimits {
  clientLimit: number | null;
  hasAiCostAnalysis: boolean;
  hasTimeClockAccess: boolean;
  hasStripeIntegration: boolean;
  hasCustomPortal: boolean;
  hasBrandedPortal: boolean;
  aiUsageLimit: number | null;
  planName: string;
}

declare global {
  namespace Express {
    interface Request {
      subscriptionLimits?: SubscriptionLimits;
      contractor?: any;
    }
  }
}

export const checkSubscriptionAccess = (requiredFeature: keyof SubscriptionLimits) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const contractor = await db.query.contractors.findFirst({
        where: eq(contractors.id, req.user.id)
      });

      if (!contractor) {
        return res.status(403).json({ error: 'Contractor not found' });
      }

      // Get subscription plan details
      const plan = await db.query.subscriptionPlans.findFirst({
        where: eq(subscriptionPlans.planName, contractor.plan || 'basic')
      });

      if (!plan) {
        return res.status(403).json({ error: 'Subscription plan not found' });
      }

      if (contractor.subscriptionStatus !== 'active') {
        return res.status(403).json({ 
          error: 'Subscription inactive',
          subscriptionStatus: contractor.subscriptionStatus
        });
      }

      const limits: SubscriptionLimits = {
        clientLimit: plan.clientLimit,
        hasAiCostAnalysis: plan.hasAiCostAnalysis,
        hasTimeClockAccess: plan.hasTimeClockAccess,
        hasStripeIntegration: plan.hasStripeIntegration,
        hasCustomPortal: plan.hasCustomPortal,
        hasBrandedPortal: plan.hasBrandedPortal,
        aiUsageLimit: plan.aiUsageLimit,
        planName: plan.planName
      };

      if (!limits[requiredFeature]) {
        return res.status(403).json({ 
          error: `Feature not available in ${contractor.subscriptionPlan} plan`,
          upgradeRequired: true,
          currentPlan: contractor.subscriptionPlan,
          requiredFeature
        });
      }

      req.subscriptionLimits = limits;
      req.contractor = contractor;
      next();
    } catch (error) {
      console.error('Subscription check error:', error);
      res.status(500).json({ error: 'Subscription verification failed' });
    }
  };
};

export const checkClientLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const contractor = await db.query.contractors.findFirst({
      where: eq(contractors.id, req.user.id)
    });

    if (!contractor) {
      return res.status(403).json({ error: 'Contractor not found' });
    }

    const plan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.planName, contractor.subscriptionPlan || 'basic')
    });

    if (!plan) {
      return res.status(403).json({ error: 'Subscription plan not found' });
    }

    // Check current client count
    const clientCountResult = await db.select({ count: count() })
      .from(clients)
      .where(eq(clients.contractorId, req.user.id));

    const currentClientCount = clientCountResult[0]?.count || 0;

    // -1 means unlimited
    if (plan.maxClients !== -1 && currentClientCount >= plan.maxClients) {
      return res.status(403).json({
        error: `Client limit reached (${plan.maxClients} clients max for ${contractor.subscriptionPlan} plan)`,
        upgradeRequired: true,
        currentCount: currentClientCount,
        maxAllowed: plan.maxClients,
        planName: contractor.subscriptionPlan
      });
    }

    // Update contractor's current client count
    await db.update(contractors)
      .set({ currentClientCount })
      .where(eq(contractors.id, req.user.id));

    next();
  } catch (error) {
    console.error('Client limit check error:', error);
    res.status(500).json({ error: 'Client limit verification failed' });
  }
};

export const checkAiUsageLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const contractor = await db.query.contractors.findFirst({
      where: eq(contractors.id, req.user.id)
    });

    if (!contractor) {
      return res.status(403).json({ error: 'Contractor not found' });
    }

    const plan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.planName, contractor.subscriptionPlan || 'basic')
    });

    if (!plan) {
      return res.status(403).json({ error: 'Subscription plan not found' });
    }

    // Check if AI features are available for this plan
    if (!plan.hasAiCostAnalysis) {
      return res.status(403).json({
        error: `AI cost analysis not available in ${contractor.subscriptionPlan} plan`,
        upgradeRequired: true,
        currentPlan: contractor.subscriptionPlan
      });
    }

    // -1 means unlimited AI usage
    if (plan.aiUsageLimit !== -1) {
      // Check current month usage
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const usageResult = await db.select({ count: count() })
        .from(aiUsageLog)
        .where(
          and(
            eq(aiUsageLog.contractorId, req.user.id),
            gte(aiUsageLog.createdAt, startOfMonth)
          )
        );

      const currentUsage = usageResult[0]?.count || 0;

      if (currentUsage >= plan.aiUsageLimit) {
        return res.status(403).json({
          error: `AI usage limit reached (${plan.aiUsageLimit} per month for ${contractor.subscriptionPlan} plan)`,
          upgradeRequired: true,
          currentUsage,
          maxAllowed: plan.aiUsageLimit,
          planName: contractor.subscriptionPlan
        });
      }

      // Update contractor's current AI usage
      await db.update(contractors)
        .set({ aiUsageThisMonth: currentUsage })
        .where(eq(contractors.id, req.user.id));
    }

    next();
  } catch (error) {
    console.error('AI usage limit check error:', error);
    res.status(500).json({ error: 'AI usage verification failed' });
  }
};

export const logAiUsage = async (contractorId: number, feature: string, cost?: number) => {
  try {
    await db.insert(aiUsageLog).values({
      contractorId,
      feature,
      cost: cost || 0,
      createdAt: new Date()
    });
  } catch (error) {
    console.error('Failed to log AI usage:', error);
  }
};

export const getSubscriptionStatus = async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const contractor = await db.query.contractors.findFirst({
      where: eq(contractors.id, req.user.id)
    });

    if (!contractor) {
      return res.status(404).json({ error: 'Contractor not found' });
    }

    const plan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.planName, contractor.subscriptionPlan || 'basic')
    });

    if (!plan) {
      return res.status(404).json({ error: 'Subscription plan not found' });
    }

    // Get current usage counts
    const clientCountResult = await db.select({ count: count() })
      .from(clients)
      .where(eq(clients.contractorId, req.user.id));

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const aiUsageResult = await db.select({ count: count() })
      .from(aiUsageLog)
      .where(
        and(
          eq(aiUsageLog.contractorId, req.user.id),
          gte(aiUsageLog.createdAt, startOfMonth)
        )
      );

    const currentClientCount = clientCountResult[0]?.count || 0;
    const currentAiUsage = aiUsageResult[0]?.count || 0;

    res.json({
      contractor: {
        id: contractor.id,
        email: contractor.email,
        username: contractor.username,
        companyName: contractor.companyName,
        subscriptionPlan: contractor.subscriptionPlan,
        subscriptionStatus: contractor.subscriptionStatus,
        stripeCustomerId: contractor.stripeCustomerId,
        stripeSubscriptionId: contractor.stripeSubscriptionId
      },
      plan: {
        planName: plan.planName,
        priceMonthly: plan.priceMonthly,
        maxClients: plan.maxClients,
        hasAiCostAnalysis: plan.hasAiCostAnalysis,
        hasTimeClock: plan.hasTimeClock,
        hasStripeIntegration: plan.hasStripeIntegration,
        hasCustomPortal: plan.hasCustomPortal,
        hasBrandedPortal: plan.hasBrandedPortal,
        aiUsageLimit: plan.aiUsageLimit
      },
      usage: {
        currentClientCount,
        maxClients: plan.maxClients,
        clientsRemaining: plan.maxClients === -1 ? 'unlimited' : Math.max(0, plan.maxClients - currentClientCount),
        currentAiUsage,
        maxAiUsage: plan.aiUsageLimit,
        aiUsageRemaining: plan.aiUsageLimit === -1 ? 'unlimited' : Math.max(0, plan.aiUsageLimit - currentAiUsage)
      }
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
};