"use server";

import { ID, Query } from "node-appwrite";
import { createAdminClient } from "../appwrite";
import { parseStringify } from "../utils";
import { SUBSCRIPTION_TIERS, canAccessFeature, checkLimit } from "@/constants/subscription";

const {
  APPWRITE_DATABASE_ID: DATABASE_ID,
  APPWRITE_SUBSCRIPTION_COLLECTION_ID: SUBSCRIPTION_COLLECTION_ID,
} = process.env;

// ========================================
// GET USER SUBSCRIPTION
// ========================================

export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  try {
    const { database } = await createAdminClient();

    const subscriptions = await database.listDocuments(
      DATABASE_ID!,
      SUBSCRIPTION_COLLECTION_ID!,
      [Query.equal("userId", [userId]), Query.equal("status", ["active", "trial"])]
    );

    if (subscriptions.total === 0) {
      // Create free tier subscription if none exists
      return await createSubscription(userId, "free");
    }

    return parseStringify(subscriptions.documents[0]);
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return null;
  }
}

// ========================================
// CREATE SUBSCRIPTION
// ========================================

export async function createSubscription(
  userId: string,
  tier: SubscriptionTier,
  status: "active" | "trial" = "active"
): Promise<Subscription | null> {
  try {
    const { database } = await createAdminClient();

    const features = SUBSCRIPTION_TIERS[tier].features;
    const now = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1); // 1 year from now

    const subscription = await database.createDocument(
      DATABASE_ID!,
      SUBSCRIPTION_COLLECTION_ID!,
      ID.unique(),
      {
        userId,
        tier,
        status,
        startDate: now.toISOString(),
        endDate: endDate.toISOString(),
        autoRenew: true,
        features: JSON.stringify(features),
      }
    );

    return parseStringify(subscription);
  } catch (error) {
    console.error("Error creating subscription:", error);
    return null;
  }
}

// ========================================
// UPDATE SUBSCRIPTION TIER
// ========================================

export async function updateSubscriptionTier(
  userId: string,
  newTier: SubscriptionTier
): Promise<Subscription | null> {
  try {
    const { database } = await createAdminClient();

    const currentSubscription = await getUserSubscription(userId);
    if (!currentSubscription) {
      return await createSubscription(userId, newTier);
    }

    const features = SUBSCRIPTION_TIERS[newTier].features;

    const updated = await database.updateDocument(
      DATABASE_ID!,
      SUBSCRIPTION_COLLECTION_ID!,
      currentSubscription.$id,
      {
        tier: newTier,
        features: JSON.stringify(features),
        status: "active",
      }
    );

    return parseStringify(updated);
  } catch (error) {
    console.error("Error updating subscription:", error);
    return null;
  }
}

// ========================================
// CHECK FEATURE ACCESS
// ========================================

export async function checkFeatureAccess(
  userId: string,
  feature: keyof SubscriptionFeatures
): Promise<{ allowed: boolean; tier: SubscriptionTier; upgrade?: SubscriptionTier }> {
  try {
    const subscription = await getUserSubscription(userId);
    if (!subscription) {
      return { allowed: false, tier: "free", upgrade: "pro" };
    }

    const features: SubscriptionFeatures =
      typeof subscription.features === "string"
        ? JSON.parse(subscription.features)
        : subscription.features;

    const allowed = features[feature] === true;

    if (!allowed) {
      // Find which tier unlocks this feature
      const tiers: SubscriptionTier[] = ["free", "pro", "business", "enterprise"];
      for (const tier of tiers) {
        if (SUBSCRIPTION_TIERS[tier].features[feature]) {
          return { allowed: false, tier: subscription.tier, upgrade: tier };
        }
      }
    }

    return { allowed, tier: subscription.tier };
  } catch (error) {
    console.error("Error checking feature access:", error);
    return { allowed: false, tier: "free", upgrade: "pro" };
  }
}

// ========================================
// CHECK USAGE LIMIT
// ========================================

export async function checkUsageLimit(
  userId: string,
  limitType: "aiQueriesPerMonth" | "ocrScansPerMonth" | "invoicesPerMonth" | "reportsPerMonth",
  currentUsage: number
): Promise<{ allowed: boolean; remaining: number; tier: SubscriptionTier }> {
  try {
    const subscription = await getUserSubscription(userId);
    if (!subscription) {
      return { allowed: false, remaining: 0, tier: "free" };
    }

    const result = checkLimit(subscription.tier, limitType, currentUsage);

    return {
      allowed: result.allowed,
      remaining: result.remaining,
      tier: subscription.tier,
    };
  } catch (error) {
    console.error("Error checking usage limit:", error);
    return { allowed: false, remaining: 0, tier: "free" };
  }
}

// ========================================
// START TRIAL
// ========================================

export async function startTrial(
  userId: string,
  tier: "pro" | "business" | "enterprise"
): Promise<Subscription | null> {
  try {
    const { database } = await createAdminClient();

    // Check if user already had a trial
    const previousTrials = await database.listDocuments(
      DATABASE_ID!,
      SUBSCRIPTION_COLLECTION_ID!,
      [Query.equal("userId", [userId]), Query.equal("status", ["trial"])]
    );

    if (previousTrials.total > 0) {
      throw new Error("Trial already used");
    }

    // End current subscription
    const currentSubscription = await getUserSubscription(userId);
    if (currentSubscription && currentSubscription.tier !== "free") {
      await database.updateDocument(
        DATABASE_ID!,
        SUBSCRIPTION_COLLECTION_ID!,
        currentSubscription.$id,
        { status: "cancelled" }
      );
    }

    // Create trial subscription
    const trialDays = tier === "enterprise" ? 30 : 14;
    const now = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + trialDays);

    const features = SUBSCRIPTION_TIERS[tier].features;

    const trialSubscription = await database.createDocument(
      DATABASE_ID!,
      SUBSCRIPTION_COLLECTION_ID!,
      ID.unique(),
      {
        userId,
        tier,
        status: "trial",
        startDate: now.toISOString(),
        endDate: endDate.toISOString(),
        autoRenew: false,
        features: JSON.stringify(features),
      }
    );

    return parseStringify(trialSubscription);
  } catch (error) {
    console.error("Error starting trial:", error);
    return null;
  }
}

// ========================================
// CANCEL SUBSCRIPTION
// ========================================

export async function cancelSubscription(userId: string): Promise<boolean> {
  try {
    const { database } = await createAdminClient();

    const subscription = await getUserSubscription(userId);
    if (!subscription) return false;

    await database.updateDocument(
      DATABASE_ID!,
      SUBSCRIPTION_COLLECTION_ID!,
      subscription.$id,
      {
        status: "cancelled",
        autoRenew: false,
      }
    );

    // Create free tier subscription
    await createSubscription(userId, "free");

    return true;
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    return false;
  }
}

// ========================================
// GET FEATURE ACCESS SUMMARY
// ========================================

export async function getFeatureAccessSummary(userId: string): Promise<FeatureAccess | null> {
  try {
    const subscription = await getUserSubscription(userId);
    if (!subscription) {
      return {
        tier: "free",
        canAccessBusinessMode: false,
        canAccessVAT: false,
        canAccessAI: false,
        canAccessForecasting: false,
        canAccessInvoicing: false,
        canAccessOCR: false,
        canAccessAdvancedReports: false,
        canExportData: false,
        remainingAIQueries: 0,
        remainingOCRScans: 0,
      };
    }

    const features: SubscriptionFeatures =
      typeof subscription.features === "string"
        ? JSON.parse(subscription.features)
        : subscription.features;

    // TODO: Get actual usage from database
    const aiUsage = 0;
    const ocrUsage = 0;

    const tier = subscription.tier;
    const limits = SUBSCRIPTION_TIERS[tier].limits;

    return {
      tier,
      canAccessBusinessMode: features.businessMode,
      canAccessVAT: features.vatCalculation,
      canAccessAI: features.aiInsights,
      canAccessForecasting: features.cashflowForecasting,
      canAccessInvoicing: features.invoiceManagement,
      canAccessOCR: features.receiptOCR,
      canAccessAdvancedReports: features.advancedReports,
      canExportData: features.exportData,
      remainingAIQueries: limits.aiQueriesPerMonth === -1 ? -1 : Math.max(0, limits.aiQueriesPerMonth - aiUsage),
      remainingOCRScans: limits.ocrScansPerMonth === -1 ? -1 : Math.max(0, limits.ocrScansPerMonth - ocrUsage),
    };
  } catch (error) {
    console.error("Error getting feature access summary:", error);
    return null;
  }
}
