"use server";

import { ID, Query } from "node-appwrite";
import { createAdminClient } from "../appwrite";
import { parseStringify } from "../utils";
import { checkUsageLimit, checkFeatureAccess } from "./subscription.actions";

const {
  APPWRITE_DATABASE_ID: DATABASE_ID,
  APPWRITE_BUDGETS_COLLECTION_ID: BUDGETS_COLLECTION_ID,
  APPWRITE_SAVINGS_GOALS_COLLECTION_ID: SAVINGS_GOALS_COLLECTION_ID,
  APPWRITE_ALERTS_COLLECTION_ID: ALERTS_COLLECTION_ID,
} = process.env;

// ========================================
// CREATE BUDGET
// ========================================

export async function createBudget(data: CreateBudgetProps): Promise<Budget | null> {
  try {
    const { database } = await createAdminClient();

    // Check subscription limits
    const userBudgets = await getUserBudgets(data.userId);
    const access = await checkUsageLimit(data.userId, "reportsPerMonth", userBudgets.length);

    // Free tier: 3 budgets, Pro+: unlimited
    const subscription = await checkFeatureAccess(data.userId, "budgetTracking");
    if (subscription.tier === "free" && userBudgets.length >= 3) {
      throw new Error("Budget limit reached. Upgrade to Pro for unlimited budgets.");
    }

    const startDate = new Date();
    const budget = await database.createDocument(
      DATABASE_ID!,
      BUDGETS_COLLECTION_ID!,
      ID.unique(),
      {
        userId: data.userId,
        name: data.name,
        category: data.category,
        amount: data.amount,
        period: data.period,
        startDate: startDate.toISOString(),
        alertThreshold: data.alertThreshold,
        isActive: true,
        spent: 0,
        remaining: data.amount,
        transactionType: data.transactionType,
      }
    );

    return parseStringify(budget);
  } catch (error) {
    console.error("Error creating budget:", error);
    return null;
  }
}

// ========================================
// GET USER BUDGETS
// ========================================

export async function getUserBudgets(
  userId: string,
  filters?: {
    isActive?: boolean;
    transactionType?: TransactionType;
    period?: "weekly" | "monthly" | "quarterly" | "yearly";
  }
): Promise<Budget[]> {
  try {
    const { database } = await createAdminClient();

    const queries = [Query.equal("userId", [userId])];

    if (filters?.isActive !== undefined) {
      queries.push(Query.equal("isActive", [filters.isActive]));
    }

    if (filters?.transactionType) {
      queries.push(Query.equal("transactionType", [filters.transactionType]));
    }

    if (filters?.period) {
      queries.push(Query.equal("period", [filters.period]));
    }

    const budgets = await database.listDocuments(
      DATABASE_ID!,
      BUDGETS_COLLECTION_ID!,
      queries
    );

    return parseStringify(budgets.documents);
  } catch (error) {
    console.error("Error fetching budgets:", error);
    return [];
  }
}

// ========================================
// GET BUDGET BY ID
// ========================================

export async function getBudget(budgetId: string): Promise<Budget | null> {
  try {
    const { database } = await createAdminClient();

    const budget = await database.getDocument(
      DATABASE_ID!,
      BUDGETS_COLLECTION_ID!,
      budgetId
    );

    return parseStringify(budget);
  } catch (error) {
    console.error("Error fetching budget:", error);
    return null;
  }
}

// ========================================
// UPDATE BUDGET
// ========================================

export async function updateBudget(
  budgetId: string,
  data: Partial<Omit<Budget, "$id" | "userId" | "$createdAt" | "$updatedAt">>
): Promise<Budget | null> {
  try {
    const { database } = await createAdminClient();

    const updated = await database.updateDocument(
      DATABASE_ID!,
      BUDGETS_COLLECTION_ID!,
      budgetId,
      data
    );

    return parseStringify(updated);
  } catch (error) {
    console.error("Error updating budget:", error);
    return null;
  }
}

// ========================================
// DELETE BUDGET
// ========================================

export async function deleteBudget(budgetId: string): Promise<boolean> {
  try {
    const { database } = await createAdminClient();

    await database.deleteDocument(
      DATABASE_ID!,
      BUDGETS_COLLECTION_ID!,
      budgetId
    );

    return true;
  } catch (error) {
    console.error("Error deleting budget:", error);
    return false;
  }
}

// ========================================
// UPDATE BUDGET SPENDING
// ========================================

export async function updateBudgetSpending(
  userId: string,
  category: TransactionCategory,
  amount: number,
  transactionType: TransactionType
): Promise<void> {
  try {
    const { database } = await createAdminClient();

    // Find active budgets for this category
    const budgets = await database.listDocuments(
      DATABASE_ID!,
      BUDGETS_COLLECTION_ID!,
      [
        Query.equal("userId", [userId]),
        Query.equal("category", [category]),
        Query.equal("transactionType", [transactionType]),
        Query.equal("isActive", [true]),
      ]
    );

    for (const budget of budgets.documents) {
      const newSpent = budget.spent + amount;
      const newRemaining = budget.amount - newSpent;
      const utilization = (newSpent / budget.amount) * 100;

      await database.updateDocument(
        DATABASE_ID!,
        BUDGETS_COLLECTION_ID!,
        budget.$id,
        {
          spent: newSpent,
          remaining: newRemaining,
        }
      );

      // Check if alert threshold reached
      if (utilization >= budget.alertThreshold && utilization < 100) {
        await createAlert(userId, {
          type: "budget_threshold",
          severity: "warning",
          title: `Budget Alert: ${budget.name}`,
          message: `You've used ${utilization.toFixed(0)}% of your ${budget.name} budget.`,
          actionRequired: false,
          metadata: JSON.stringify({ budgetId: budget.$id, utilization }),
        });
      } else if (utilization >= 100) {
        await createAlert(userId, {
          type: "budget_threshold",
          severity: "error",
          title: `Budget Exceeded: ${budget.name}`,
          message: `You've exceeded your ${budget.name} budget by ${Math.abs(newRemaining).toFixed(2)}.`,
          actionRequired: true,
          metadata: JSON.stringify({ budgetId: budget.$id, overage: Math.abs(newRemaining) }),
        });
      }
    }
  } catch (error) {
    console.error("Error updating budget spending:", error);
  }
}

// ========================================
// GET BUDGET SUMMARY
// ========================================

export async function getBudgetSummary(userId: string): Promise<{
  totalBudgeted: number;
  totalSpent: number;
  totalRemaining: number;
  avgUtilization: number;
  budgetsExceeded: number;
  budgetsNearLimit: number;
}> {
  try {
    const budgets = await getUserBudgets(userId, { isActive: true });

    let totalBudgeted = 0;
    let totalSpent = 0;
    let totalRemaining = 0;
    let budgetsExceeded = 0;
    let budgetsNearLimit = 0;

    for (const budget of budgets) {
      totalBudgeted += budget.amount;
      totalSpent += budget.spent;
      totalRemaining += budget.remaining;

      const utilization = (budget.spent / budget.amount) * 100;
      if (utilization >= 100) budgetsExceeded++;
      else if (utilization >= budget.alertThreshold) budgetsNearLimit++;
    }

    const avgUtilization = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

    return {
      totalBudgeted,
      totalSpent,
      totalRemaining,
      avgUtilization,
      budgetsExceeded,
      budgetsNearLimit,
    };
  } catch (error) {
    console.error("Error getting budget summary:", error);
    return {
      totalBudgeted: 0,
      totalSpent: 0,
      totalRemaining: 0,
      avgUtilization: 0,
      budgetsExceeded: 0,
      budgetsNearLimit: 0,
    };
  }
}

// ========================================
// SAVINGS GOALS
// ========================================

export async function createGoal(data: CreateGoalProps): Promise<SavingsGoal | null> {
  try {
    const { database } = await createAdminClient();

    // Check limits for free tier
    const userGoals = await getUserGoals(data.userId);
    const subscription = await checkFeatureAccess(data.userId, "budgetTracking");

    if (subscription.tier === "free" && userGoals.length >= 2) {
      throw new Error("Goal limit reached. Upgrade to Pro for unlimited goals.");
    }

    const goal = await database.createDocument(
      DATABASE_ID!,
      SAVINGS_GOALS_COLLECTION_ID!,
      ID.unique(),
      {
        userId: data.userId,
        name: data.name,
        targetAmount: data.targetAmount,
        currentAmount: 0,
        deadline: data.deadline || null,
        priority: data.priority,
        isCompleted: false,
      }
    );

    return parseStringify(goal);
  } catch (error) {
    console.error("Error creating goal:", error);
    return null;
  }
}

export async function getUserGoals(userId: string): Promise<SavingsGoal[]> {
  try {
    const { database } = await createAdminClient();

    const goals = await database.listDocuments(
      DATABASE_ID!,
      SAVINGS_GOALS_COLLECTION_ID!,
      [Query.equal("userId", [userId])]
    );

    return parseStringify(goals.documents);
  } catch (error) {
    console.error("Error fetching goals:", error);
    return [];
  }
}

export async function updateGoal(
  goalId: string,
  data: Partial<Omit<SavingsGoal, "$id" | "userId" | "$createdAt" | "$updatedAt">>
): Promise<SavingsGoal | null> {
  try {
    const { database } = await createAdminClient();

    const updated = await database.updateDocument(
      DATABASE_ID!,
      SAVINGS_GOALS_COLLECTION_ID!,
      goalId,
      data
    );

    // Check if goal completed
    if (data.currentAmount && data.currentAmount >= updated.targetAmount && !updated.isCompleted) {
      await database.updateDocument(
        DATABASE_ID!,
        SAVINGS_GOALS_COLLECTION_ID!,
        goalId,
        { isCompleted: true }
      );

      await createAlert(updated.userId, {
        type: "budget_threshold",
        severity: "info",
        title: "Goal Achieved!",
        message: `Congratulations! You've reached your goal: ${updated.name}`,
        actionRequired: false,
        metadata: JSON.stringify({ goalId }),
      });
    }

    return parseStringify(updated);
  } catch (error) {
    console.error("Error updating goal:", error);
    return null;
  }
}

export async function deleteGoal(goalId: string): Promise<boolean> {
  try {
    const { database } = await createAdminClient();

    await database.deleteDocument(
      DATABASE_ID!,
      SAVINGS_GOALS_COLLECTION_ID!,
      goalId
    );

    return true;
  } catch (error) {
    console.error("Error deleting goal:", error);
    return false;
  }
}

// ========================================
// ALERTS
// ========================================

async function createAlert(
  userId: string,
  data: {
    type: Alert["type"];
    severity: Alert["severity"];
    title: string;
    message: string;
    link?: string;
    actionRequired: boolean;
    metadata?: string;
  }
): Promise<Alert | null> {
  try {
    const { database } = await createAdminClient();

    // Check if similar alert exists in last 24 hours
    const existingAlerts = await database.listDocuments(
      DATABASE_ID!,
      ALERTS_COLLECTION_ID!,
      [
        Query.equal("userId", [userId]),
        Query.equal("type", [data.type]),
        Query.equal("isDismissed", [false]),
      ]
    );

    // Prevent duplicate alerts
    if (existingAlerts.total > 0) {
      const lastAlert = existingAlerts.documents[0];
      const lastAlertTime = new Date(lastAlert.$createdAt).getTime();
      const now = new Date().getTime();
      const hoursSinceLastAlert = (now - lastAlertTime) / (1000 * 60 * 60);

      if (hoursSinceLastAlert < 24) {
        return null; // Don't create duplicate alert
      }
    }

    const alert = await database.createDocument(
      DATABASE_ID!,
      ALERTS_COLLECTION_ID!,
      ID.unique(),
      {
        userId,
        type: data.type,
        severity: data.severity,
        title: data.title,
        message: data.message,
        link: data.link || null,
        isRead: false,
        isDismissed: false,
        actionRequired: data.actionRequired,
        metadataJSON: data.metadata || null,
      }
    );

    return parseStringify(alert);
  } catch (error) {
    console.error("Error creating alert:", error);
    return null;
  }
}

export async function getUserAlerts(
  userId: string,
  filters?: {
    isRead?: boolean;
    isDismissed?: boolean;
    severity?: Alert["severity"];
  }
): Promise<Alert[]> {
  try {
    const { database } = await createAdminClient();

    const queries = [Query.equal("userId", [userId])];

    if (filters?.isRead !== undefined) {
      queries.push(Query.equal("isRead", [filters.isRead]));
    }

    if (filters?.isDismissed !== undefined) {
      queries.push(Query.equal("isDismissed", [filters.isDismissed]));
    }

    if (filters?.severity) {
      queries.push(Query.equal("severity", [filters.severity]));
    }

    const alerts = await database.listDocuments(
      DATABASE_ID!,
      ALERTS_COLLECTION_ID!,
      queries
    );

    return parseStringify(alerts.documents);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return [];
  }
}

export async function markAlertRead(alertId: string): Promise<boolean> {
  try {
    const { database } = await createAdminClient();

    await database.updateDocument(
      DATABASE_ID!,
      ALERTS_COLLECTION_ID!,
      alertId,
      { isRead: true }
    );

    return true;
  } catch (error) {
    console.error("Error marking alert as read:", error);
    return false;
  }
}

export async function dismissAlert(alertId: string): Promise<boolean> {
  try {
    const { database } = await createAdminClient();

    await database.updateDocument(
      DATABASE_ID!,
      ALERTS_COLLECTION_ID!,
      alertId,
      { isDismissed: true }
    );

    return true;
  } catch (error) {
    console.error("Error dismissing alert:", error);
    return false;
  }
}
