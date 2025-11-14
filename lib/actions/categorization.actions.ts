"use server";

import { ID, Query } from "node-appwrite";
import { createAdminClient } from "../appwrite";
import { parseStringify } from "../utils";
import { checkFeatureAccess } from "./subscription.actions";

const {
  APPWRITE_DATABASE_ID: DATABASE_ID,
  APPWRITE_ENHANCED_TRANSACTIONS_COLLECTION_ID: ENHANCED_TRANSACTIONS_COLLECTION_ID,
  APPWRITE_RECURRING_TRANSACTIONS_COLLECTION_ID: RECURRING_TRANSACTIONS_COLLECTION_ID,
} = process.env;

// ========================================
// ENHANCED TRANSACTION CATEGORIZATION
// ========================================

export async function categorizeTransaction(
  userId: string,
  transactionId: string,
  data: CategorizationRequest
): Promise<EnhancedTransaction | null> {
  try {
    const { database } = await createAdminClient();

    // Check if enhanced transaction already exists
    const existing = await database.listDocuments(
      DATABASE_ID!,
      ENHANCED_TRANSACTIONS_COLLECTION_ID!,
      [Query.equal("transactionId", [transactionId])]
    );

    const enhancedData = {
      userId,
      transactionId,
      enhancedCategory: data.category,
      transactionType: data.transactionType,
      isVatEligible: data.isVatEligible || false,
      vatRate: data.vatRate || 0,
      notes: data.notes || "",
      tagsJSON: JSON.stringify(data.tags || []),
      isRecurring: false,
    };

    let enhanced;

    if (existing.total > 0) {
      // Update existing
      enhanced = await database.updateDocument(
        DATABASE_ID!,
        ENHANCED_TRANSACTIONS_COLLECTION_ID!,
        existing.documents[0].$id,
        enhancedData
      );
    } else {
      // Create new
      enhanced = await database.createDocument(
        DATABASE_ID!,
        ENHANCED_TRANSACTIONS_COLLECTION_ID!,
        ID.unique(),
        enhancedData
      );
    }

    return parseStringify(enhanced);
  } catch (error) {
    console.error("Error categorizing transaction:", error);
    return null;
  }
}

// ========================================
// GET ENHANCED TRANSACTION
// ========================================

export async function getEnhancedTransaction(
  transactionId: string
): Promise<EnhancedTransaction | null> {
  try {
    const { database } = await createAdminClient();

    const enhanced = await database.listDocuments(
      DATABASE_ID!,
      ENHANCED_TRANSACTIONS_COLLECTION_ID!,
      [Query.equal("transactionId", [transactionId])]
    );

    if (enhanced.total === 0) return null;

    return parseStringify(enhanced.documents[0]);
  } catch (error) {
    console.error("Error fetching enhanced transaction:", error);
    return null;
  }
}

// ========================================
// BULK CATEGORIZE
// ========================================

export async function bulkCategorizeTransactions(
  userId: string,
  categorizations: { transactionId: string; category: TransactionCategory; transactionType: TransactionType }[]
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const cat of categorizations) {
    const result = await categorizeTransaction(userId, cat.transactionId, {
      transactionId: cat.transactionId,
      category: cat.category,
      transactionType: cat.transactionType,
    });

    if (result) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed };
}

// ========================================
// GET USER CATEGORIZED TRANSACTIONS
// ========================================

export async function getUserCategorizedTransactions(
  userId: string,
  filters?: {
    transactionType?: TransactionType;
    category?: TransactionCategory;
    startDate?: string;
    endDate?: string;
  }
): Promise<EnhancedTransaction[]> {
  try {
    const { database } = await createAdminClient();

    const queries = [Query.equal("userId", [userId])];

    if (filters?.transactionType) {
      queries.push(Query.equal("transactionType", [filters.transactionType]));
    }

    if (filters?.category) {
      queries.push(Query.equal("enhancedCategory", [filters.category]));
    }

    const enhanced = await database.listDocuments(
      DATABASE_ID!,
      ENHANCED_TRANSACTIONS_COLLECTION_ID!,
      queries
    );

    return parseStringify(enhanced.documents);
  } catch (error) {
    console.error("Error fetching categorized transactions:", error);
    return [];
  }
}

// ========================================
// AUTO-CATEGORIZE WITH AI
// ========================================

export async function autoCategorizeTransaction(
  userId: string,
  transaction: Transaction
): Promise<{ category: TransactionCategory; transactionType: TransactionType; confidence: number }> {
  // Check if user has AI access
  const access = await checkFeatureAccess(userId, "aiInsights");
  if (!access.allowed) {
    return {
      category: "other",
      transactionType: "personal",
      confidence: 0,
    };
  }

  try {
    // Simple rule-based categorization (can be enhanced with actual AI)
    const name = transaction.name.toLowerCase();
    let category: TransactionCategory = "other";
    let transactionType: TransactionType = "personal";
    let confidence = 0.5;

    // Income detection
    if (name.includes("salary") || name.includes("payroll") || name.includes("deposit")) {
      category = "salary";
      transactionType = "personal";
      confidence = 0.9;
    }

    // Food
    else if (
      name.includes("restaurant") ||
      name.includes("cafe") ||
      name.includes("grocery") ||
      name.includes("food") ||
      name.includes("uber eats") ||
      name.includes("doordash")
    ) {
      category = name.includes("grocery") ? "groceries" : "dining";
      transactionType = "personal";
      confidence = 0.85;
    }

    // Transportation
    else if (
      name.includes("uber") ||
      name.includes("lyft") ||
      name.includes("gas") ||
      name.includes("fuel") ||
      name.includes("parking") ||
      name.includes("metro") ||
      name.includes("transit")
    ) {
      category = name.includes("gas") || name.includes("fuel") ? "fuel" : "transportation";
      transactionType = "personal";
      confidence = 0.8;
    }

    // Utilities
    else if (
      name.includes("electric") ||
      name.includes("water") ||
      name.includes("internet") ||
      name.includes("phone") ||
      name.includes("utility")
    ) {
      category = "utilities";
      transactionType = "personal";
      confidence = 0.9;
    }

    // Subscriptions
    else if (
      name.includes("netflix") ||
      name.includes("spotify") ||
      name.includes("subscription") ||
      name.includes("monthly")
    ) {
      category = "subscriptions";
      transactionType = "personal";
      confidence = 0.95;
    }

    // Business indicators
    else if (
      name.includes("office") ||
      name.includes("supplies") ||
      name.includes("software") ||
      name.includes("saas") ||
      name.includes("aws") ||
      name.includes("hosting")
    ) {
      category = name.includes("software") ? "software" : "office_supplies";
      transactionType = "business";
      confidence = 0.75;
    }

    return { category, transactionType, confidence };
  } catch (error) {
    console.error("Error auto-categorizing:", error);
    return {
      category: "other",
      transactionType: "personal",
      confidence: 0,
    };
  }
}

// ========================================
// DETECT RECURRING TRANSACTIONS
// ========================================

export async function detectRecurringTransactions(userId: string): Promise<RecurringTransaction[]> {
  try {
    const { database } = await createAdminClient();

    // This would analyze transaction patterns to detect recurring payments
    // For now, return existing recurring transactions

    const recurring = await database.listDocuments(
      DATABASE_ID!,
      RECURRING_TRANSACTIONS_COLLECTION_ID!,
      [Query.equal("userId", [userId]), Query.equal("isActive", [true])]
    );

    return parseStringify(recurring.documents);
  } catch (error) {
    console.error("Error detecting recurring transactions:", error);
    return [];
  }
}

// ========================================
// CREATE RECURRING TRANSACTION PATTERN
// ========================================

export async function createRecurringPattern(
  userId: string,
  data: {
    name: string;
    merchantName: string;
    amount: number;
    category: TransactionCategory;
    transactionType: TransactionType;
    frequency: "daily" | "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly";
    nextExpectedDate: string;
  }
): Promise<RecurringTransaction | null> {
  try {
    const { database } = await createAdminClient();

    const recurring = await database.createDocument(
      DATABASE_ID!,
      RECURRING_TRANSACTIONS_COLLECTION_ID!,
      ID.unique(),
      {
        userId,
        name: data.name,
        merchantName: data.merchantName,
        amount: data.amount,
        category: data.category,
        transactionType: data.transactionType,
        frequency: data.frequency,
        nextExpectedDate: data.nextExpectedDate,
        isActive: true,
        alertEnabled: true,
        detectedTransactionIdsJSON: JSON.stringify([]),
      }
    );

    return parseStringify(recurring);
  } catch (error) {
    console.error("Error creating recurring pattern:", error);
    return null;
  }
}

// ========================================
// GET SPENDING BY CATEGORY
// ========================================

export async function getSpendingByCategory(
  userId: string,
  startDate: string,
  endDate: string,
  transactionType?: TransactionType
): Promise<{ category: TransactionCategory; amount: number; count: number }[]> {
  try {
    const { database } = await createAdminClient();

    const queries = [Query.equal("userId", [userId])];

    if (transactionType) {
      queries.push(Query.equal("transactionType", [transactionType]));
    }

    const enhanced = await database.listDocuments(
      DATABASE_ID!,
      ENHANCED_TRANSACTIONS_COLLECTION_ID!,
      queries
    );

    // Group by category and sum amounts
    const categoryMap = new Map<TransactionCategory, { amount: number; count: number }>();

    for (const transaction of enhanced.documents) {
      const category = transaction.enhancedCategory as TransactionCategory;
      const current = categoryMap.get(category) || { amount: 0, count: 0 };

      // Note: You'd need to join with actual transaction data to get the amount
      // This is a simplified version
      categoryMap.set(category, {
        amount: current.amount,
        count: current.count + 1,
      });
    }

    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      amount: data.amount,
      count: data.count,
    }));
  } catch (error) {
    console.error("Error getting spending by category:", error);
    return [];
  }
}

// ========================================
// GET CATEGORY INSIGHTS
// ========================================

export async function getCategoryInsights(
  userId: string,
  category: TransactionCategory,
  period: number = 90 // days
): Promise<{
  avgMonthly: number;
  trend: "increasing" | "decreasing" | "stable";
  percentageChange: number;
  topMerchants: { name: string; total: number; count: number }[];
}> {
  try {
    // This would analyze historical spending patterns
    // Simplified version for now

    return {
      avgMonthly: 0,
      trend: "stable",
      percentageChange: 0,
      topMerchants: [],
    };
  } catch (error) {
    console.error("Error getting category insights:", error);
    return {
      avgMonthly: 0,
      trend: "stable",
      percentageChange: 0,
      topMerchants: [],
    };
  }
}
