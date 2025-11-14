"use server";

import { ID, Query } from "node-appwrite";
import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "../appwrite";
import { parseStringify } from "../utils";
import { checkFeatureAccess, checkUsageLimit } from "./subscription.actions";
import { getUserBudgets, getBudgetSummary } from "./budget.actions";
import { getSpendingByCategory } from "./categorization.actions";

const {
  APPWRITE_DATABASE_ID: DATABASE_ID,
  APPWRITE_AI_INSIGHTS_COLLECTION_ID: AI_INSIGHTS_COLLECTION_ID,
  APPWRITE_CASHFLOW_FORECASTS_COLLECTION_ID: CASHFLOW_FORECASTS_COLLECTION_ID,
  ANTHROPIC_API_KEY,
} = process.env;

const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY || "",
});

// ========================================
// AI QUERY HANDLER
// ========================================

export async function queryAIAssistant(request: AIQueryRequest): Promise<string | null> {
  try {
    // Check if user has AI access
    const access = await checkFeatureAccess(request.userId, "aiInsights");
    if (!access.allowed) {
      return `Upgrade to ${access.upgrade} to access AI-powered insights and recommendations.`;
    }

    // Check usage limits
    // TODO: Track actual usage
    const usage = await checkUsageLimit(request.userId, "aiQueriesPerMonth", 0);
    if (!usage.allowed) {
      return "You've reached your AI query limit for this month. Upgrade to get more queries.";
    }

    // Get user's financial context
    const budgets = await getUserBudgets(request.userId);
    const budgetSummary = await getBudgetSummary(request.userId);

    // Build context for AI
    const context = `
User Financial Context:
- Total Budgeted: $${budgetSummary.totalBudgeted.toFixed(2)}
- Total Spent: $${budgetSummary.totalSpent.toFixed(2)}
- Budget Utilization: ${budgetSummary.avgUtilization.toFixed(1)}%
- Active Budgets: ${budgets.length}
- Budgets Exceeded: ${budgetSummary.budgetsExceeded}

User Query Context: ${request.context || "general"}
    `.trim();

    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are a personal financial advisor. Based on the following context, answer the user's question with actionable advice.

${context}

User Question: ${request.query}

Provide a concise, helpful response with specific recommendations.`,
        },
      ],
    });

    const response = message.content[0].type === "text" ? message.content[0].text : "";

    // TODO: Increment usage counter

    return response;
  } catch (error) {
    console.error("Error querying AI:", error);
    return "I'm having trouble processing your request right now. Please try again later.";
  }
}

// ========================================
// GENERATE AI INSIGHTS
// ========================================

export async function generateFinancialInsights(userId: string): Promise<AIInsight[]> {
  try {
    const access = await checkFeatureAccess(userId, "aiInsights");
    if (!access.allowed) {
      return [];
    }

    const { database } = await createAdminClient();
    const insights: AIInsight[] = [];

    // Get budget summary
    const budgetSummary = await getBudgetSummary(userId);

    // Insight 1: Budget warnings
    if (budgetSummary.budgetsExceeded > 0) {
      insights.push({
        $id: "",
        userId,
        type: "budget_warning",
        priority: "high",
        title: "Budget Exceeded",
        description: `You have exceeded ${budgetSummary.budgetsExceeded} budget(s) this period. Consider reviewing your spending.`,
        actionable: true,
        action: {
          label: "Review Budgets",
          type: "review_subscription",
        },
        isRead: false,
        isDismissed: false,
        $createdAt: new Date().toISOString(),
        $updatedAt: new Date().toISOString(),
      });
    }

    // Insight 2: Near limit warnings
    if (budgetSummary.budgetsNearLimit > 0) {
      insights.push({
        $id: "",
        userId,
        type: "spending_alert",
        priority: "medium",
        title: "Approaching Budget Limit",
        description: `${budgetSummary.budgetsNearLimit} budget(s) are close to their limit. You might want to reduce spending in these categories.`,
        actionable: true,
        action: {
          label: "View Budgets",
          type: "adjust_spending",
        },
        isRead: false,
        isDismissed: false,
        $createdAt: new Date().toISOString(),
        $updatedAt: new Date().toISOString(),
      });
    }

    // Insight 3: Savings opportunity
    if (budgetSummary.totalRemaining > 0) {
      const savingsOpportunity = budgetSummary.totalRemaining * 0.5; // Suggest saving 50% of remaining
      insights.push({
        $id: "",
        userId,
        type: "savings_opportunity",
        priority: "low",
        title: "Savings Opportunity",
        description: `You have $${budgetSummary.totalRemaining.toFixed(2)} unspent across your budgets. Consider saving $${savingsOpportunity.toFixed(2)}.`,
        actionable: true,
        action: {
          label: "Create Savings Goal",
          type: "transfer_savings",
        },
        estimatedSavings: savingsOpportunity,
        isRead: false,
        isDismissed: false,
        $createdAt: new Date().toISOString(),
        $updatedAt: new Date().toISOString(),
      });
    }

    // Save insights to database
    for (const insight of insights) {
      try {
        const created = await database.createDocument(
          DATABASE_ID!,
          AI_INSIGHTS_COLLECTION_ID!,
          ID.unique(),
          {
            userId: insight.userId,
            type: insight.type,
            priority: insight.priority,
            title: insight.title,
            description: insight.description,
            actionable: insight.actionable,
            actionJSON: insight.action ? JSON.stringify(insight.action) : null,
            category: insight.category || null,
            estimatedSavings: insight.estimatedSavings || null,
            isRead: false,
            isDismissed: false,
            expiresAt: null,
          }
        );

        insight.$id = created.$id;
      } catch (error) {
        console.error("Error saving insight:", error);
      }
    }

    return insights;
  } catch (error) {
    console.error("Error generating insights:", error);
    return [];
  }
}

export async function getUserInsights(
  userId: string,
  filters?: { isRead?: boolean; priority?: AIInsight["priority"] }
): Promise<AIInsight[]> {
  try {
    const { database } = await createAdminClient();

    const queries = [Query.equal("userId", [userId]), Query.equal("isDismissed", [false])];

    if (filters?.isRead !== undefined) {
      queries.push(Query.equal("isRead", [filters.isRead]));
    }

    if (filters?.priority) {
      queries.push(Query.equal("priority", [filters.priority]));
    }

    const insights = await database.listDocuments(
      DATABASE_ID!,
      AI_INSIGHTS_COLLECTION_ID!,
      queries
    );

    // Parse action JSON
    const parsedInsights = insights.documents.map(insight => ({
      ...insight,
      action: insight.actionJSON ? JSON.parse(insight.actionJSON) : undefined,
    }));

    return parseStringify(parsedInsights);
  } catch (error) {
    console.error("Error fetching insights:", error);
    return [];
  }
}

export async function dismissInsight(insightId: string): Promise<boolean> {
  try {
    const { database } = await createAdminClient();

    await database.updateDocument(
      DATABASE_ID!,
      AI_INSIGHTS_COLLECTION_ID!,
      insightId,
      { isDismissed: true }
    );

    return true;
  } catch (error) {
    console.error("Error dismissing insight:", error);
    return false;
  }
}

// ========================================
// CASHFLOW FORECASTING
// ========================================

export async function generateCashflowForecast(
  request: CashflowForecastRequest
): Promise<CashflowForecast | null> {
  try {
    // Check if user has forecasting access
    const access = await checkFeatureAccess(request.userId, "cashflowForecasting");
    if (!access.allowed) {
      throw new Error(`Upgrade to ${access.upgrade} to access cashflow forecasting`);
    }

    const { database } = await createAdminClient();

    // Simplified forecasting logic
    // In production, this would use actual transaction history and ML models

    const days = getPeriodDays(request.period);
    const dataPoints = [];

    // Get historical averages (simplified)
    const avgMonthlyIncome = 5000; // TODO: Calculate from actual data
    const avgMonthlyExpenses = 3500; // TODO: Calculate from actual data

    const dailyIncome = avgMonthlyIncome / 30;
    const dailyExpenses = avgMonthlyExpenses / 30;

    let cumulativeBalance = 0;

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);

      // Simple projection with some variance
      const variance = (Math.random() - 0.5) * 0.2; // ±10% variance
      const dayIncome = dailyIncome * (1 + variance);
      const dayExpenses = dailyExpenses * (1 + variance);

      cumulativeBalance += dayIncome - dayExpenses;

      dataPoints.push({
        date: date.toISOString(),
        income: dayIncome,
        expenses: dayExpenses,
        balance: cumulativeBalance,
      });
    }

    const projectedIncome = avgMonthlyIncome * (days / 30);
    const projectedExpenses = avgMonthlyExpenses * (days / 30);
    const projectedBalance = projectedIncome - projectedExpenses;

    const forecast = await database.createDocument(
      DATABASE_ID!,
      CASHFLOW_FORECASTS_COLLECTION_ID!,
      ID.unique(),
      {
        userId: request.userId,
        forecastDate: new Date().toISOString(),
        period: request.period,
        projectedIncome,
        projectedExpenses,
        projectedBalance,
        confidence: 75, // Confidence score
        dataPointsJSON: JSON.stringify(dataPoints),
        generatedAt: new Date().toISOString(),
      }
    );

    const result = {
      ...forecast,
      dataPoints,
    };

    return parseStringify(result);
  } catch (error) {
    console.error("Error generating cashflow forecast:", error);
    return null;
  }
}

function getPeriodDays(period: CashflowForecast["period"]): number {
  switch (period) {
    case "30_days":
      return 30;
    case "60_days":
      return 60;
    case "90_days":
      return 90;
    case "6_months":
      return 180;
    case "1_year":
      return 365;
    default:
      return 30;
  }
}

export async function getUserForecasts(userId: string): Promise<CashflowForecast[]> {
  try {
    const { database } = await createAdminClient();

    const forecasts = await database.listDocuments(
      DATABASE_ID!,
      CASHFLOW_FORECASTS_COLLECTION_ID!,
      [Query.equal("userId", [userId]), Query.orderDesc("$createdAt"), Query.limit(10)]
    );

    // Parse dataPoints JSON
    const parsedForecasts = forecasts.documents.map(forecast => ({
      ...forecast,
      dataPoints: JSON.parse(forecast.dataPointsJSON),
    }));

    return parseStringify(parsedForecasts);
  } catch (error) {
    console.error("Error fetching forecasts:", error);
    return [];
  }
}

// ========================================
// SPENDING ANALYSIS
// ========================================

export async function analyzeSpendingPatterns(
  userId: string,
  period: number = 90
): Promise<SpendingPattern[]> {
  try {
    const access = await checkFeatureAccess(userId, "aiInsights");
    if (!access.allowed) {
      return [];
    }

    // Get spending by category
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    const spending = await getSpendingByCategory(
      userId,
      startDate.toISOString(),
      new Date().toISOString()
    );

    // Analyze patterns (simplified)
    const patterns: SpendingPattern[] = spending.map(cat => ({
      category: cat.category,
      avgMonthly: (cat.amount / period) * 30,
      trend: "stable" as const, // TODO: Calculate actual trend
      percentageChange: 0, // TODO: Calculate change
      topMerchants: [], // TODO: Get from transaction data
    }));

    return patterns;
  } catch (error) {
    console.error("Error analyzing spending patterns:", error);
    return [];
  }
}

// ========================================
// TAX OPTIMIZATION INSIGHTS
// ========================================

export async function generateTaxInsights(
  userId: string,
  businessEntityId?: string
): Promise<AIInsight[]> {
  try {
    const access = await checkFeatureAccess(userId, "aiInsights");
    if (!access.allowed) {
      return [];
    }

    const { database } = await createAdminClient();
    const insights: AIInsight[] = [];

    // Get business transactions if business mode
    if (businessEntityId) {
      const access = await checkFeatureAccess(userId, "businessMode");
      if (access.allowed) {
        // Analyze deductible expenses
        // Simplified version
        insights.push({
          $id: ID.unique(),
          userId,
          type: "tax_tip",
          priority: "medium",
          title: "Tax Deduction Opportunity",
          description: "Track your business expenses carefully - office supplies and software are tax deductible.",
          actionable: true,
          action: {
            label: "Review Business Expenses",
            type: "tax_deduction",
          },
          isRead: false,
          isDismissed: false,
          $createdAt: new Date().toISOString(),
          $updatedAt: new Date().toISOString(),
        });
      }
    }

    return insights;
  } catch (error) {
    console.error("Error generating tax insights:", error);
    return [];
  }
}

// ========================================
// ANOMALY DETECTION
// ========================================

export async function detectAnomalies(userId: string): Promise<AIInsight[]> {
  try {
    const access = await checkFeatureAccess(userId, "aiInsights");
    if (!access.allowed) {
      return [];
    }

    // Detect unusual spending patterns
    // This would analyze transaction history for anomalies
    // Simplified version for now

    const insights: AIInsight[] = [];

    // Example: Large transaction alert
    // In production, this would check actual transactions

    return insights;
  } catch (error) {
    console.error("Error detecting anomalies:", error);
    return [];
  }
}

// ========================================
// SMART RECOMMENDATIONS
// ========================================

export async function generateSmartRecommendations(
  userId: string
): Promise<AIInsight[]> {
  try {
    const access = await checkFeatureAccess(userId, "aiInsights");
    if (!access.allowed) {
      return [];
    }

    const budgetSummary = await getBudgetSummary(userId);
    const insights: AIInsight[] = [];

    // Recommendation: Create budgets if none exist
    if (budgetSummary.totalBudgeted === 0) {
      insights.push({
        $id: ID.unique(),
        userId,
        type: "optimization",
        priority: "medium",
        title: "Start Budget Tracking",
        description: "Create budgets to better manage your spending and reach your financial goals faster.",
        actionable: true,
        action: {
          label: "Create Budget",
          type: "create_budget",
        },
        isRead: false,
        isDismissed: false,
        $createdAt: new Date().toISOString(),
        $updatedAt: new Date().toISOString(),
      });
    }

    // More recommendations would be generated based on actual data

    return insights;
  } catch (error) {
    console.error("Error generating recommendations:", error);
    return [];
  }
}
