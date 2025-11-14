"use server";

import { ID, Query } from "node-appwrite";
import { createAdminClient } from "../appwrite";
import { parseStringify } from "../utils";
import { checkFeatureAccess } from "./subscription.actions";
import { calculateVATReturn } from "./business.actions";
import { getUserCategorizedTransactions } from "./categorization.actions";

const {
  APPWRITE_DATABASE_ID: DATABASE_ID,
  APPWRITE_FINANCIAL_REPORTS_COLLECTION_ID: FINANCIAL_REPORTS_COLLECTION_ID,
} = process.env;

// ========================================
// PROFIT & LOSS STATEMENT
// ========================================

export async function generateProfitLossReport(
  userId: string,
  businessEntityId: string,
  startDate: string,
  endDate: string
): Promise<FinancialReport | null> {
  try {
    const access = await checkFeatureAccess(userId, "advancedReports");
    if (!access.allowed) {
      throw new Error(`Upgrade to ${access.upgrade} to access advanced reports`);
    }

    const { database } = await createAdminClient();

    // Get all business transactions in period
    const transactions = await getUserCategorizedTransactions(userId, {
      transactionType: "business",
      startDate,
      endDate,
    });

    // Filter by business entity
    const businessTransactions = transactions.filter(
      t => t.businessEntityId === businessEntityId
    );

    // Calculate income
    const incomeCategories = ["income", "salary", "freelance", "investment", "other_income"];
    const revenue = businessTransactions
      .filter(t => incomeCategories.includes(t.enhancedCategory))
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    // Calculate cost of goods sold (COGS)
    const cogsCategories = ["inventory"];
    const cogs = businessTransactions
      .filter(t => cogsCategories.includes(t.enhancedCategory))
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    // Gross profit
    const grossProfit = revenue - cogs;
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    // Operating expenses
    const operatingExpenseCategories = [
      "rent",
      "utilities",
      "office_supplies",
      "professional_services",
      "marketing",
      "software",
      "equipment",
    ];
    const operatingExpenses = businessTransactions
      .filter(t => operatingExpenseCategories.includes(t.enhancedCategory))
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    // Operating profit
    const operatingProfit = grossProfit - operatingExpenses;
    const operatingMargin = revenue > 0 ? (operatingProfit / revenue) * 100 : 0;

    // Other expenses
    const otherExpenseCategories = ["taxes", "fees", "insurance"];
    const otherExpenses = businessTransactions
      .filter(t => otherExpenseCategories.includes(t.enhancedCategory))
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    // Net profit
    const netProfit = operatingProfit - otherExpenses;
    const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    const reportData = {
      period: { start: startDate, end: endDate },
      revenue,
      cogs,
      grossProfit,
      grossMargin,
      operatingExpenses,
      operatingProfit,
      operatingMargin,
      otherExpenses,
      netProfit,
      netMargin,
      breakdown: {
        revenueByCategory: groupByCategory(
          businessTransactions.filter(t => incomeCategories.includes(t.enhancedCategory))
        ),
        expensesByCategory: groupByCategory(
          businessTransactions.filter(t => !incomeCategories.includes(t.enhancedCategory))
        ),
      },
    };

    const report = await database.createDocument(
      DATABASE_ID!,
      FINANCIAL_REPORTS_COLLECTION_ID!,
      ID.unique(),
      {
        userId,
        businessEntityId,
        reportType: "profit_loss",
        periodStart: startDate,
        periodEnd: endDate,
        dataJSON: JSON.stringify(reportData),
        format: "json",
        generatedAt: new Date().toISOString(),
      }
    );

    return parseStringify({ ...report, data: reportData });
  } catch (error) {
    console.error("Error generating P&L report:", error);
    return null;
  }
}

// ========================================
// BALANCE SHEET
// ========================================

export async function generateBalanceSheet(
  userId: string,
  businessEntityId: string,
  asOfDate: string
): Promise<FinancialReport | null> {
  try {
    const access = await checkFeatureAccess(userId, "advancedReports");
    if (!access.allowed) {
      throw new Error(`Upgrade to ${access.upgrade} to access advanced reports`);
    }

    const { database } = await createAdminClient();

    // Simplified balance sheet
    // In production, this would track actual assets, liabilities, and equity

    const reportData = {
      asOfDate,
      assets: {
        currentAssets: {
          cash: 0, // From bank accounts
          accountsReceivable: 0, // From unpaid invoices
          inventory: 0,
          total: 0,
        },
        fixedAssets: {
          equipment: 0,
          total: 0,
        },
        totalAssets: 0,
      },
      liabilities: {
        currentLiabilities: {
          accountsPayable: 0,
          taxesPayable: 0,
          total: 0,
        },
        longTermLiabilities: {
          loans: 0,
          total: 0,
        },
        totalLiabilities: 0,
      },
      equity: {
        ownerEquity: 0,
        retainedEarnings: 0,
        totalEquity: 0,
      },
      totalLiabilitiesAndEquity: 0,
    };

    const report = await database.createDocument(
      DATABASE_ID!,
      FINANCIAL_REPORTS_COLLECTION_ID!,
      ID.unique(),
      {
        userId,
        businessEntityId,
        reportType: "balance_sheet",
        periodStart: asOfDate,
        periodEnd: asOfDate,
        dataJSON: JSON.stringify(reportData),
        format: "json",
        generatedAt: new Date().toISOString(),
      }
    );

    return parseStringify({ ...report, data: reportData });
  } catch (error) {
    console.error("Error generating balance sheet:", error);
    return null;
  }
}

// ========================================
// CASHFLOW STATEMENT
// ========================================

export async function generateCashflowStatement(
  userId: string,
  businessEntityId: string,
  startDate: string,
  endDate: string
): Promise<FinancialReport | null> {
  try {
    const access = await checkFeatureAccess(userId, "advancedReports");
    if (!access.allowed) {
      throw new Error(`Upgrade to ${access.upgrade} to access advanced reports`);
    }

    const { database } = await createAdminClient();

    // Get all business transactions
    const transactions = await getUserCategorizedTransactions(userId, {
      transactionType: "business",
      startDate,
      endDate,
    });

    const businessTransactions = transactions.filter(
      t => t.businessEntityId === businessEntityId
    );

    // Operating activities
    const operatingInflows = businessTransactions
      .filter(t => ["income", "salary", "freelance"].includes(t.enhancedCategory))
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const operatingOutflows = businessTransactions
      .filter(t =>
        [
          "rent",
          "utilities",
          "office_supplies",
          "marketing",
          "professional_services",
        ].includes(t.enhancedCategory)
      )
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const netOperatingCashflow = operatingInflows - operatingOutflows;

    // Investing activities
    const investingOutflows = businessTransactions
      .filter(t => ["equipment", "software"].includes(t.enhancedCategory))
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const netInvestingCashflow = -investingOutflows;

    // Financing activities
    const financingInflows = 0; // Loans, capital injections
    const financingOutflows = 0; // Loan payments, distributions

    const netFinancingCashflow = financingInflows - financingOutflows;

    // Net change in cash
    const netCashChange =
      netOperatingCashflow + netInvestingCashflow + netFinancingCashflow;

    const reportData = {
      period: { start: startDate, end: endDate },
      operatingActivities: {
        inflows: operatingInflows,
        outflows: operatingOutflows,
        net: netOperatingCashflow,
      },
      investingActivities: {
        inflows: 0,
        outflows: investingOutflows,
        net: netInvestingCashflow,
      },
      financingActivities: {
        inflows: financingInflows,
        outflows: financingOutflows,
        net: netFinancingCashflow,
      },
      netCashChange,
      beginningCash: 0, // From previous period
      endingCash: netCashChange,
    };

    const report = await database.createDocument(
      DATABASE_ID!,
      FINANCIAL_REPORTS_COLLECTION_ID!,
      ID.unique(),
      {
        userId,
        businessEntityId,
        reportType: "cashflow_statement",
        periodStart: startDate,
        periodEnd: endDate,
        dataJSON: JSON.stringify(reportData),
        format: "json",
        generatedAt: new Date().toISOString(),
      }
    );

    return parseStringify({ ...report, data: reportData });
  } catch (error) {
    console.error("Error generating cashflow statement:", error);
    return null;
  }
}

// ========================================
// VAT RETURN REPORT
// ========================================

export async function generateVATReturnReport(
  userId: string,
  businessEntityId: string,
  startDate: string,
  endDate: string
): Promise<FinancialReport | null> {
  try {
    const access = await checkFeatureAccess(userId, "vatCalculation");
    if (!access.allowed) {
      throw new Error(`Upgrade to ${access.upgrade} to access VAT reports`);
    }

    const vatReturn = await calculateVATReturn(userId, businessEntityId, startDate, endDate);

    if (!vatReturn) {
      throw new Error("Failed to calculate VAT return");
    }

    const { database } = await createAdminClient();

    const report = await database.createDocument(
      DATABASE_ID!,
      FINANCIAL_REPORTS_COLLECTION_ID!,
      ID.unique(),
      {
        userId,
        businessEntityId,
        reportType: "vat_return",
        periodStart: startDate,
        periodEnd: endDate,
        dataJSON: JSON.stringify(vatReturn),
        format: "json",
        generatedAt: new Date().toISOString(),
      }
    );

    return parseStringify({ ...report, data: vatReturn });
  } catch (error) {
    console.error("Error generating VAT return report:", error);
    return null;
  }
}

// ========================================
// EXPENSE REPORT
// ========================================

export async function generateExpenseReport(
  userId: string,
  startDate: string,
  endDate: string,
  transactionType: TransactionType = "personal"
): Promise<FinancialReport | null> {
  try {
    const access = await checkFeatureAccess(userId, "advancedReports");
    if (!access.allowed) {
      throw new Error(`Upgrade to ${access.upgrade} to access expense reports`);
    }

    const { database } = await createAdminClient();

    const transactions = await getUserCategorizedTransactions(userId, {
      transactionType,
      startDate,
      endDate,
    });

    // Exclude income categories
    const incomeCategories = ["income", "salary", "freelance", "investment", "other_income"];
    const expenses = transactions.filter(
      t => !incomeCategories.includes(t.enhancedCategory)
    );

    const totalExpenses = expenses.reduce((sum, t) => sum + (t.amount || 0), 0);

    const byCategory = groupByCategory(expenses);
    const byMerchant = groupByMerchant(expenses);

    const reportData = {
      period: { start: startDate, end: endDate },
      transactionType,
      totalExpenses,
      transactionCount: expenses.length,
      averageTransaction: expenses.length > 0 ? totalExpenses / expenses.length : 0,
      byCategory,
      byMerchant,
      largestExpenses: expenses
        .sort((a, b) => (b.amount || 0) - (a.amount || 0))
        .slice(0, 10)
        .map(t => ({
          date: t.date,
          merchant: t.merchantName || t.name,
          amount: t.amount,
          category: t.enhancedCategory,
        })),
    };

    const report = await database.createDocument(
      DATABASE_ID!,
      FINANCIAL_REPORTS_COLLECTION_ID!,
      ID.unique(),
      {
        userId,
        businessEntityId: null,
        reportType: "expense_report",
        periodStart: startDate,
        periodEnd: endDate,
        dataJSON: JSON.stringify(reportData),
        format: "json",
        generatedAt: new Date().toISOString(),
      }
    );

    return parseStringify({ ...report, data: reportData });
  } catch (error) {
    console.error("Error generating expense report:", error);
    return null;
  }
}

// ========================================
// INCOME REPORT
// ========================================

export async function generateIncomeReport(
  userId: string,
  startDate: string,
  endDate: string,
  transactionType: TransactionType = "personal"
): Promise<FinancialReport | null> {
  try {
    const access = await checkFeatureAccess(userId, "advancedReports");
    if (!access.allowed) {
      throw new Error(`Upgrade to ${access.upgrade} to access income reports`);
    }

    const { database } = await createAdminClient();

    const transactions = await getUserCategorizedTransactions(userId, {
      transactionType,
      startDate,
      endDate,
    });

    const incomeCategories = ["income", "salary", "freelance", "investment", "other_income"];
    const income = transactions.filter(t => incomeCategories.includes(t.enhancedCategory));

    const totalIncome = income.reduce((sum, t) => sum + (t.amount || 0), 0);

    const reportData = {
      period: { start: startDate, end: endDate },
      transactionType,
      totalIncome,
      transactionCount: income.length,
      averageIncome: income.length > 0 ? totalIncome / income.length : 0,
      byCategory: groupByCategory(income),
      monthlyBreakdown: groupByMonth(income, startDate, endDate),
    };

    const report = await database.createDocument(
      DATABASE_ID!,
      FINANCIAL_REPORTS_COLLECTION_ID!,
      ID.unique(),
      {
        userId,
        businessEntityId: null,
        reportType: "income_report",
        periodStart: startDate,
        periodEnd: endDate,
        dataJSON: JSON.stringify(reportData),
        format: "json",
        generatedAt: new Date().toISOString(),
      }
    );

    return parseStringify({ ...report, data: reportData });
  } catch (error) {
    console.error("Error generating income report:", error);
    return null;
  }
}

// ========================================
// TAX SUMMARY
// ========================================

export async function generateTaxSummary(
  userId: string,
  businessEntityId: string | null,
  year: number
): Promise<FinancialReport | null> {
  try {
    const access = await checkFeatureAccess(userId, "advancedReports");
    if (!access.allowed) {
      throw new Error(`Upgrade to ${access.upgrade} to access tax summaries`);
    }

    const { database } = await createAdminClient();

    const startDate = `${year}-01-01T00:00:00.000Z`;
    const endDate = `${year}-12-31T23:59:59.999Z`;

    const transactions = await getUserCategorizedTransactions(userId, {
      transactionType: businessEntityId ? "business" : "personal",
      startDate,
      endDate,
    });

    // Calculate tax-relevant totals
    const incomeCategories = ["income", "salary", "freelance", "investment"];
    const totalIncome = transactions
      .filter(t => incomeCategories.includes(t.enhancedCategory))
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    // Deductible expenses (business)
    const deductibleCategories = [
      "office_supplies",
      "professional_services",
      "software",
      "equipment",
      "marketing",
      "utilities",
      "rent",
    ];
    const deductibleExpenses = transactions
      .filter(t => deductibleCategories.includes(t.enhancedCategory))
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const reportData = {
      year,
      totalIncome,
      deductibleExpenses,
      netIncome: totalIncome - deductibleExpenses,
      vatPaid: 0, // From VAT calculations
      estimatedTaxLiability: (totalIncome - deductibleExpenses) * 0.2, // Simplified 20% rate
      quarterlyBreakdown: getQuarterlyBreakdown(transactions, year),
    };

    const report = await database.createDocument(
      DATABASE_ID!,
      FINANCIAL_REPORTS_COLLECTION_ID!,
      ID.unique(),
      {
        userId,
        businessEntityId,
        reportType: "tax_summary",
        periodStart: startDate,
        periodEnd: endDate,
        dataJSON: JSON.stringify(reportData),
        format: "json",
        generatedAt: new Date().toISOString(),
      }
    );

    return parseStringify({ ...report, data: reportData });
  } catch (error) {
    console.error("Error generating tax summary:", error);
    return null;
  }
}

// ========================================
// GET USER REPORTS
// ========================================

export async function getUserReports(
  userId: string,
  reportType?: FinancialReport["reportType"]
): Promise<FinancialReport[]> {
  try {
    const { database } = await createAdminClient();

    const queries = [Query.equal("userId", [userId]), Query.orderDesc("$createdAt")];

    if (reportType) {
      queries.push(Query.equal("reportType", [reportType]));
    }

    const reports = await database.listDocuments(
      DATABASE_ID!,
      FINANCIAL_REPORTS_COLLECTION_ID!,
      queries
    );

    // Parse data JSON
    const parsedReports = reports.documents.map(report => ({
      ...report,
      data: JSON.parse(report.dataJSON),
    }));

    return parseStringify(parsedReports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    return [];
  }
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function groupByCategory(transactions: EnhancedTransaction[]): { [key: string]: number } {
  return transactions.reduce((acc, t) => {
    const category = t.enhancedCategory;
    acc[category] = (acc[category] || 0) + (t.amount || 0);
    return acc;
  }, {} as { [key: string]: number });
}

function groupByMerchant(transactions: EnhancedTransaction[]): { [key: string]: number } {
  return transactions.reduce((acc, t) => {
    const merchant = t.merchantName || t.name || "Unknown";
    acc[merchant] = (acc[merchant] || 0) + (t.amount || 0);
    return acc;
  }, {} as { [key: string]: number });
}

function groupByMonth(
  transactions: EnhancedTransaction[],
  startDate: string,
  endDate: string
): { month: string; amount: number }[] {
  const months: { [key: string]: number } = {};

  transactions.forEach(t => {
    const date = new Date(t.date || t.$createdAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    months[monthKey] = (months[monthKey] || 0) + (t.amount || 0);
  });

  return Object.entries(months).map(([month, amount]) => ({ month, amount }));
}

function getQuarterlyBreakdown(
  transactions: EnhancedTransaction[],
  year: number
): { quarter: string; income: number; expenses: number }[] {
  const quarters = ["Q1", "Q2", "Q3", "Q4"];
  const incomeCategories = ["income", "salary", "freelance", "investment"];

  return quarters.map((quarter, index) => {
    const startMonth = index * 3;
    const endMonth = startMonth + 3;

    const quarterTransactions = transactions.filter(t => {
      const date = new Date(t.date || t.$createdAt);
      const month = date.getMonth();
      return month >= startMonth && month < endMonth;
    });

    const income = quarterTransactions
      .filter(t => incomeCategories.includes(t.enhancedCategory))
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const expenses = quarterTransactions
      .filter(t => !incomeCategories.includes(t.enhancedCategory))
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    return { quarter, income, expenses };
  });
}
