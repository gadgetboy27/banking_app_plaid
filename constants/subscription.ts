// ========================================
// SUBSCRIPTION TIER DEFINITIONS
// ========================================

export const SUBSCRIPTION_TIERS = {
  free: {
    name: "Free",
    price: 0,
    billingPeriod: "forever",
    features: {
      maxBankAccounts: 1,
      maxBudgets: 3,
      maxGoals: 2,
      budgetTracking: true,
      aiInsights: false,
      cashflowForecasting: false,
      businessMode: false,
      vatCalculation: false,
      invoiceManagement: false,
      receiptOCR: false,
      advancedReports: false,
      exportData: false,
      multiCurrency: false,
      teamCollaboration: false,
      apiAccess: false,
      prioritySupport: false,
    },
    limits: {
      aiQueriesPerMonth: 0,
      ocrScansPerMonth: 0,
      invoicesPerMonth: 0,
      reportsPerMonth: 1,
    },
    description: "Perfect for getting started with personal finance tracking",
    highlights: [
      "Connect 1 bank account",
      "Create up to 3 budgets",
      "2 savings goals",
      "Basic transaction tracking",
      "Manual categorization",
    ],
  },
  pro: {
    name: "Pro",
    price: 9.99,
    billingPeriod: "month",
    features: {
      maxBankAccounts: 5,
      maxBudgets: 20,
      maxGoals: 10,
      budgetTracking: true,
      aiInsights: true,
      cashflowForecasting: true,
      businessMode: false,
      vatCalculation: false,
      invoiceManagement: false,
      receiptOCR: true,
      advancedReports: true,
      exportData: true,
      multiCurrency: false,
      teamCollaboration: false,
      apiAccess: false,
      prioritySupport: false,
    },
    limits: {
      aiQueriesPerMonth: 100,
      ocrScansPerMonth: 50,
      invoicesPerMonth: 0,
      reportsPerMonth: -1, // Unlimited
    },
    description: "AI-powered insights for serious personal finance management",
    highlights: [
      "Connect up to 5 bank accounts",
      "Unlimited budgets & goals",
      "AI-powered categorization",
      "Smart spending insights",
      "Cashflow forecasting",
      "Receipt OCR scanning",
      "Advanced reports & exports",
      "30/60/90 day projections",
    ],
  },
  business: {
    name: "Business",
    price: 29.99,
    billingPeriod: "month",
    features: {
      maxBankAccounts: -1, // Unlimited
      maxBudgets: -1,
      maxGoals: -1,
      budgetTracking: true,
      aiInsights: true,
      cashflowForecasting: true,
      businessMode: true,
      vatCalculation: true,
      invoiceManagement: true,
      receiptOCR: true,
      advancedReports: true,
      exportData: true,
      multiCurrency: true,
      teamCollaboration: false,
      apiAccess: false,
      prioritySupport: true,
    },
    limits: {
      aiQueriesPerMonth: 500,
      ocrScansPerMonth: 200,
      invoicesPerMonth: 100,
      reportsPerMonth: -1,
    },
    description: "Complete business financial management with VAT & invoicing",
    highlights: [
      "Everything in Pro, plus:",
      "Unlimited bank accounts",
      "Business vs Personal mode",
      "VAT calculation & returns",
      "Invoice generation",
      "Client & project tracking",
      "P&L and balance sheets",
      "Tax optimization insights",
      "Expense reporting",
      "Priority support",
    ],
  },
  enterprise: {
    name: "Enterprise",
    price: 99.99,
    billingPeriod: "month",
    features: {
      maxBankAccounts: -1,
      maxBudgets: -1,
      maxGoals: -1,
      budgetTracking: true,
      aiInsights: true,
      cashflowForecasting: true,
      businessMode: true,
      vatCalculation: true,
      invoiceManagement: true,
      receiptOCR: true,
      advancedReports: true,
      exportData: true,
      multiCurrency: true,
      teamCollaboration: true,
      apiAccess: true,
      prioritySupport: true,
    },
    limits: {
      aiQueriesPerMonth: -1,
      ocrScansPerMonth: -1,
      invoicesPerMonth: -1,
      reportsPerMonth: -1,
    },
    description: "Enterprise-grade features with team collaboration & API access",
    highlights: [
      "Everything in Business, plus:",
      "Multi-user team access",
      "Role-based permissions",
      "API access for integrations",
      "Unlimited AI queries",
      "Unlimited OCR scans",
      "Custom integrations",
      "Dedicated support",
      "Custom reports",
    ],
  },
} as const;

export type SubscriptionTierType = keyof typeof SUBSCRIPTION_TIERS;

// ========================================
// FEATURE GATE CHECKS
// ========================================

export function canAccessFeature(
  tier: SubscriptionTierType,
  feature: keyof typeof SUBSCRIPTION_TIERS.free.features
): boolean {
  return SUBSCRIPTION_TIERS[tier].features[feature];
}

export function getFeatureLimit(
  tier: SubscriptionTierType,
  limit: keyof typeof SUBSCRIPTION_TIERS.free.limits
): number {
  return SUBSCRIPTION_TIERS[tier].limits[limit];
}

export function checkLimit(
  tier: SubscriptionTierType,
  limit: keyof typeof SUBSCRIPTION_TIERS.free.limits,
  currentUsage: number
): { allowed: boolean; remaining: number } {
  const maxLimit = getFeatureLimit(tier, limit);

  if (maxLimit === -1) {
    return { allowed: true, remaining: -1 };
  }

  const remaining = maxLimit - currentUsage;
  return {
    allowed: remaining > 0,
    remaining: Math.max(0, remaining),
  };
}

// ========================================
// UPGRADE RECOMMENDATIONS
// ========================================

export function getUpgradeRecommendation(
  currentTier: SubscriptionTierType,
  blockedFeature: string
): {
  recommendedTier: SubscriptionTierType | null;
  reason: string;
} {
  const tierOrder: SubscriptionTierType[] = ["free", "pro", "business", "enterprise"];
  const currentIndex = tierOrder.indexOf(currentTier);

  // Check which tier unlocks the feature
  for (let i = currentIndex + 1; i < tierOrder.length; i++) {
    const tier = tierOrder[i];
    const tierFeatures = SUBSCRIPTION_TIERS[tier].features;

    if (
      (tierFeatures as any)[blockedFeature] === true ||
      (SUBSCRIPTION_TIERS[tier].limits as any)[blockedFeature] === -1
    ) {
      return {
        recommendedTier: tier,
        reason: `Upgrade to ${SUBSCRIPTION_TIERS[tier].name} to access ${blockedFeature}`,
      };
    }
  }

  return {
    recommendedTier: null,
    reason: "This feature is not available in any tier",
  };
}

// ========================================
// PRICING DISPLAY
// ========================================

export function formatTierPrice(tier: SubscriptionTierType): string {
  const { price, billingPeriod } = SUBSCRIPTION_TIERS[tier];

  if (price === 0) {
    return "Free";
  }

  return `$${price.toFixed(2)}/${billingPeriod}`;
}

export function getAnnualSavings(tier: SubscriptionTierType): number {
  const monthlyPrice = SUBSCRIPTION_TIERS[tier].price;
  if (monthlyPrice === 0) return 0;

  const annualPrice = monthlyPrice * 12 * 0.8; // 20% discount
  const savings = (monthlyPrice * 12) - annualPrice;

  return savings;
}

// ========================================
// TRIAL PERIODS
// ========================================

export const TRIAL_CONFIG = {
  pro: {
    duration: 14, // days
    features: SUBSCRIPTION_TIERS.pro.features,
  },
  business: {
    duration: 14,
    features: SUBSCRIPTION_TIERS.business.features,
  },
  enterprise: {
    duration: 30,
    features: SUBSCRIPTION_TIERS.enterprise.features,
  },
};

// ========================================
// PAYWALL MESSAGES
// ========================================

export const PAYWALL_MESSAGES = {
  aiInsights: {
    title: "Unlock AI-Powered Insights",
    description: "Get personalized financial recommendations, spending alerts, and optimization tips powered by advanced AI.",
    requiredTier: "pro" as SubscriptionTierType,
    cta: "Upgrade to Pro",
  },
  cashflowForecasting: {
    title: "Predict Your Financial Future",
    description: "See 30, 60, and 90-day cashflow projections based on your spending patterns and income history.",
    requiredTier: "pro" as SubscriptionTierType,
    cta: "Upgrade to Pro",
  },
  businessMode: {
    title: "Separate Business & Personal",
    description: "Track business expenses, calculate VAT, generate invoices, and create professional financial reports.",
    requiredTier: "business" as SubscriptionTierType,
    cta: "Upgrade to Business",
  },
  vatCalculation: {
    title: "Automated VAT Tracking",
    description: "Automatically calculate VAT on transactions, track reclaims, and generate VAT return reports.",
    requiredTier: "business" as SubscriptionTierType,
    cta: "Upgrade to Business",
  },
  invoiceManagement: {
    title: "Professional Invoicing",
    description: "Create, send, and track invoices with automatic payment reminders and client management.",
    requiredTier: "business" as SubscriptionTierType,
    cta: "Upgrade to Business",
  },
  receiptOCR: {
    title: "Scan Receipts Automatically",
    description: "Upload receipts and let AI extract merchant, amount, and categorize automatically.",
    requiredTier: "pro" as SubscriptionTierType,
    cta: "Upgrade to Pro",
  },
  advancedReports: {
    title: "Advanced Financial Reports",
    description: "Generate P&L statements, balance sheets, cashflow reports, and export to PDF or CSV.",
    requiredTier: "pro" as SubscriptionTierType,
    cta: "Upgrade to Pro",
  },
  teamCollaboration: {
    title: "Team Collaboration",
    description: "Add team members, set permissions, and collaborate on business finances together.",
    requiredTier: "enterprise" as SubscriptionTierType,
    cta: "Upgrade to Enterprise",
  },
  maxBankAccounts: {
    title: "Connect More Bank Accounts",
    description: "Track all your financial accounts in one place. Upgrade to connect more accounts.",
    requiredTier: "pro" as SubscriptionTierType,
    cta: "Upgrade to Pro",
  },
  maxBudgets: {
    title: "Create More Budgets",
    description: "Stay on top of your spending with unlimited budgets and goals.",
    requiredTier: "pro" as SubscriptionTierType,
    cta: "Upgrade to Pro",
  },
};

// ========================================
// USAGE TRACKING
// ========================================

export interface UsageMetrics {
  aiQueriesUsed: number;
  ocrScansUsed: number;
  invoicesCreated: number;
  reportsGenerated: number;
  periodStart: string;
  periodEnd: string;
}

export function getUsagePercentage(
  tier: SubscriptionTierType,
  metric: keyof UsageMetrics,
  used: number
): number {
  const limits = SUBSCRIPTION_TIERS[tier].limits;
  const limitKey = `${metric}PerMonth` as keyof typeof limits;
  const maxLimit = limits[limitKey];

  if (maxLimit === -1) return 0; // Unlimited
  if (maxLimit === 0) return 100; // Not allowed

  return (used / maxLimit) * 100;
}
