/* eslint-disable no-unused-vars */

// ========================================
// SUBSCRIPTION & TIER SYSTEM
// ========================================

declare type SubscriptionTier = "free" | "pro" | "business" | "enterprise";

declare interface SubscriptionFeatures {
  maxBankAccounts: number;
  maxBudgets: number;
  maxGoals: number;
  budgetTracking: boolean;
  aiInsights: boolean;
  cashflowForecasting: boolean;
  businessMode: boolean;
  vatCalculation: boolean;
  invoiceManagement: boolean;
  receiptOCR: boolean;
  advancedReports: boolean;
  exportData: boolean;
  multiCurrency: boolean;
  teamCollaboration: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
}

declare interface Subscription {
  $id: string;
  userId: string;
  tier: SubscriptionTier;
  status: "active" | "cancelled" | "expired" | "trial";
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  features: SubscriptionFeatures;
  $createdAt: string;
  $updatedAt: string;
}

// ========================================
// ENHANCED TRANSACTION TYPES
// ========================================

declare type TransactionCategory =
  | "income"
  | "salary"
  | "freelance"
  | "investment"
  | "other_income"
  | "rent"
  | "mortgage"
  | "utilities"
  | "groceries"
  | "dining"
  | "transportation"
  | "fuel"
  | "insurance"
  | "healthcare"
  | "entertainment"
  | "shopping"
  | "travel"
  | "education"
  | "subscriptions"
  | "office_supplies"
  | "professional_services"
  | "marketing"
  | "software"
  | "equipment"
  | "inventory"
  | "taxes"
  | "fees"
  | "transfer"
  | "other";

declare type TransactionType = "personal" | "business";

declare interface EnhancedTransaction extends Transaction {
  enhancedCategory: TransactionCategory;
  transactionType: TransactionType;
  isRecurring: boolean;
  recurringFrequency?: "daily" | "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly";
  merchantName?: string;
  merchantLogo?: string;
  notes?: string;
  tags?: string[];
  receiptId?: string;
  invoiceId?: string;
  vatAmount?: number;
  vatRate?: number;
  isVatEligible: boolean;
  projectId?: string;
  clientId?: string;
  businessEntityId?: string;
  splitAmount?: number; // For partial business expenses
  splitPercentage?: number;
}

// ========================================
// BUDGET & GOALS
// ========================================

declare interface Budget {
  $id: string;
  userId: string;
  name: string;
  category: TransactionCategory;
  amount: number;
  period: "weekly" | "monthly" | "quarterly" | "yearly";
  startDate: string;
  endDate?: string;
  alertThreshold: number; // Percentage (e.g., 80 means alert at 80%)
  isActive: boolean;
  spent: number;
  remaining: number;
  transactionType: TransactionType;
  $createdAt: string;
  $updatedAt: string;
}

declare interface SavingsGoal {
  $id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  icon?: string;
  color?: string;
  priority: "low" | "medium" | "high";
  isCompleted: boolean;
  linkedAccountId?: string;
  $createdAt: string;
  $updatedAt: string;
}

// ========================================
// BUSINESS FEATURES
// ========================================

declare interface BusinessEntity {
  $id: string;
  userId: string;
  businessName: string;
  businessType: "sole_proprietor" | "partnership" | "llc" | "corporation" | "other";
  registrationNumber?: string;
  taxId: string;
  vatNumber?: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  industry: string;
  currency: string;
  fiscalYearStart: string; // MM-DD format
  logo?: string;
  isActive: boolean;
  $createdAt: string;
  $updatedAt: string;
}

declare interface VATConfiguration {
  $id: string;
  userId: string;
  businessEntityId: string;
  defaultVATRate: number;
  vatRates: {
    name: string;
    rate: number;
    description?: string;
  }[];
  vatScheme: "standard" | "flat_rate" | "exempt";
  registrationDate: string;
  reportingPeriod: "monthly" | "quarterly" | "annual";
  nextFilingDate: string;
  $createdAt: string;
  $updatedAt: string;
}

declare interface Invoice {
  $id: string;
  userId: string;
  businessEntityId: string;
  invoiceNumber: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientAddress?: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
    total: number;
  }[];
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  notes?: string;
  terms?: string;
  linkedTransactionId?: string;
  $createdAt: string;
  $updatedAt: string;
}

declare interface Receipt {
  $id: string;
  userId: string;
  transactionId?: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  uploadDate: string;
  ocrData?: {
    merchantName?: string;
    amount?: number;
    date?: string;
    category?: string;
    items?: string[];
    confidence: number;
  };
  verified: boolean;
  notes?: string;
  tags?: string[];
  $createdAt: string;
  $updatedAt: string;
}

declare interface Client {
  $id: string;
  userId: string;
  businessEntityId: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  taxId?: string;
  vatNumber?: string;
  paymentTerms: number; // Days
  notes?: string;
  isActive: boolean;
  totalInvoiced: number;
  totalPaid: number;
  $createdAt: string;
  $updatedAt: string;
}

declare interface Project {
  $id: string;
  userId: string;
  businessEntityId: string;
  name: string;
  clientId?: string;
  status: "active" | "on_hold" | "completed" | "cancelled";
  budget?: number;
  spent: number;
  startDate: string;
  endDate?: string;
  description?: string;
  color?: string;
  $createdAt: string;
  $updatedAt: string;
}

// ========================================
// AI & ANALYTICS
// ========================================

declare interface CashflowForecast {
  $id: string;
  userId: string;
  forecastDate: string;
  period: "30_days" | "60_days" | "90_days" | "6_months" | "1_year";
  projectedIncome: number;
  projectedExpenses: number;
  projectedBalance: number;
  confidence: number; // 0-100
  dataPoints: {
    date: string;
    income: number;
    expenses: number;
    balance: number;
  }[];
  generatedAt: string;
  $createdAt: string;
}

declare interface AIInsight {
  $id: string;
  userId: string;
  type: "spending_alert" | "savings_opportunity" | "budget_warning" | "tax_tip" | "cashflow_warning" | "optimization" | "anomaly";
  priority: "low" | "medium" | "high" | "urgent";
  title: string;
  description: string;
  actionable: boolean;
  action?: {
    label: string;
    type: "create_budget" | "adjust_spending" | "review_subscription" | "tax_deduction" | "transfer_savings";
    data?: any;
  };
  category?: TransactionCategory;
  estimatedSavings?: number;
  isRead: boolean;
  isDismissed: boolean;
  expiresAt?: string;
  $createdAt: string;
  $updatedAt: string;
}

declare interface SpendingPattern {
  category: TransactionCategory;
  avgMonthly: number;
  trend: "increasing" | "decreasing" | "stable";
  percentageChange: number;
  topMerchants: {
    name: string;
    total: number;
    count: number;
  }[];
}

declare interface FinancialReport {
  $id: string;
  userId: string;
  businessEntityId?: string;
  reportType: "profit_loss" | "balance_sheet" | "cashflow_statement" | "vat_return" | "expense_report" | "income_report" | "tax_summary";
  period: {
    start: string;
    end: string;
  };
  data: any; // Report-specific data structure
  format: "json" | "pdf" | "csv";
  fileUrl?: string;
  generatedAt: string;
  $createdAt: string;
}

// ========================================
// RECURRING TRANSACTIONS
// ========================================

declare interface RecurringTransaction {
  $id: string;
  userId: string;
  name: string;
  merchantName: string;
  amount: number;
  category: TransactionCategory;
  transactionType: TransactionType;
  frequency: "daily" | "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly";
  nextExpectedDate: string;
  lastDetectedDate?: string;
  isActive: boolean;
  alertEnabled: boolean;
  notes?: string;
  detectedTransactionIds: string[];
  $createdAt: string;
  $updatedAt: string;
}

// ========================================
// NOTIFICATIONS & ALERTS
// ========================================

declare interface Alert {
  $id: string;
  userId: string;
  type: "budget_threshold" | "goal_milestone" | "bill_due" | "unusual_spending" | "low_balance" | "subscription_renewal" | "vat_filing";
  severity: "info" | "warning" | "error";
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  isDismissed: boolean;
  actionRequired: boolean;
  metadata?: any;
  $createdAt: string;
  $updatedAt: string;
}

// ========================================
// USER PREFERENCES
// ========================================

declare interface UserPreferences {
  $id: string;
  userId: string;
  defaultView: "personal" | "business" | "combined";
  defaultCurrency: string;
  dateFormat: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
  fiscalYearStart: string; // MM-DD
  notifications: {
    email: boolean;
    push: boolean;
    budgetAlerts: boolean;
    goalMilestones: boolean;
    billReminders: boolean;
    weeklyDigest: boolean;
    monthlyReport: boolean;
  };
  privacy: {
    shareAnonymousData: boolean;
    aiAnalysis: boolean;
  };
  display: {
    theme: "light" | "dark" | "auto";
    compactView: boolean;
    showBalances: boolean;
  };
  $createdAt: string;
  $updatedAt: string;
}

// ========================================
// FEATURE FLAGS
// ========================================

declare interface FeatureAccess {
  tier: SubscriptionTier;
  canAccessBusinessMode: boolean;
  canAccessVAT: boolean;
  canAccessAI: boolean;
  canAccessForecasting: boolean;
  canAccessInvoicing: boolean;
  canAccessOCR: boolean;
  canAccessAdvancedReports: boolean;
  canExportData: boolean;
  remainingAIQueries: number;
  remainingOCRScans: number;
}

// ========================================
// ACTION PROPS
// ========================================

declare interface CreateBudgetProps {
  userId: string;
  name: string;
  category: TransactionCategory;
  amount: number;
  period: "weekly" | "monthly" | "quarterly" | "yearly";
  alertThreshold: number;
  transactionType: TransactionType;
}

declare interface CreateGoalProps {
  userId: string;
  name: string;
  targetAmount: number;
  deadline?: string;
  priority: "low" | "medium" | "high";
}

declare interface CreateInvoiceProps {
  userId: string;
  businessEntityId: string;
  clientId: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
  }[];
  dueDate: string;
  notes?: string;
}

declare interface CategorizationRequest {
  transactionId: string;
  category: TransactionCategory;
  transactionType: TransactionType;
  isVatEligible?: boolean;
  vatRate?: number;
  notes?: string;
  tags?: string[];
}

declare interface AIQueryRequest {
  userId: string;
  query: string;
  context?: "general" | "spending" | "budget" | "tax" | "cashflow";
}

declare interface CashflowForecastRequest {
  userId: string;
  period: "30_days" | "60_days" | "90_days" | "6_months" | "1_year";
  includeProjections?: boolean;
}

declare interface VATReturnData {
  period: {
    start: string;
    end: string;
  };
  vatDue: number;
  vatReclaimed: number;
  netVat: number;
  totalSales: number;
  totalPurchases: number;
  transactions: string[];
}

declare interface ExportDataProps {
  userId: string;
  dataType: "transactions" | "budgets" | "invoices" | "reports";
  format: "csv" | "json" | "pdf";
  dateRange?: {
    start: string;
    end: string;
  };
  filters?: any;
}

// ========================================
// COMPONENT PROPS
// ========================================

declare interface BudgetCardProps {
  budget: Budget;
  onEdit?: (budget: Budget) => void;
  onDelete?: (budgetId: string) => void;
}

declare interface GoalCardProps {
  goal: SavingsGoal;
  onEdit?: (goal: SavingsGoal) => void;
  onDelete?: (goalId: string) => void;
}

declare interface TransactionCategorizerProps {
  transaction: EnhancedTransaction;
  onCategorize: (data: CategorizationRequest) => void;
}

declare interface CashflowChartProps {
  data: CashflowForecast;
  showProjections?: boolean;
}

declare interface InvoiceFormProps {
  businessEntity: BusinessEntity;
  clients: Client[];
  onSubmit: (invoice: CreateInvoiceProps) => void;
}

declare interface VATReportProps {
  businessEntity: BusinessEntity;
  period: {
    start: string;
    end: string;
  };
  transactions: EnhancedTransaction[];
}

declare interface AIAssistantProps {
  user: User;
  subscription: Subscription;
  onQuery: (query: string) => void;
}

declare interface ReceiptUploadProps {
  onUpload: (file: File) => void;
  onOCRComplete?: (data: Receipt["ocrData"]) => void;
}

declare interface BusinessSwitcherProps {
  entities: BusinessEntity[];
  currentEntity?: BusinessEntity;
  onSwitch: (entityId: string) => void;
}

declare interface SubscriptionUpgradeProps {
  currentTier: SubscriptionTier;
  onUpgrade: (newTier: SubscriptionTier) => void;
}

// ========================================
// ANALYTICS & METRICS
// ========================================

declare interface DashboardMetrics {
  totalIncome: number;
  totalExpenses: number;
  netCashflow: number;
  savingsRate: number;
  budgetUtilization: number;
  topSpendingCategories: {
    category: TransactionCategory;
    amount: number;
    percentage: number;
  }[];
  monthOverMonthChange: {
    income: number;
    expenses: number;
    savings: number;
  };
  upcomingBills: {
    name: string;
    amount: number;
    dueDate: string;
  }[];
  goalProgress: {
    goalId: string;
    name: string;
    progress: number;
    targetDate?: string;
  }[];
}

declare interface BusinessMetrics extends DashboardMetrics {
  revenue: number;
  profit: number;
  profitMargin: number;
  outstandingInvoices: number;
  avgPaymentTime: number; // Days
  vatLiability: number;
  topClients: {
    clientId: string;
    name: string;
    revenue: number;
  }[];
  projectProfitability: {
    projectId: string;
    name: string;
    budget: number;
    spent: number;
    margin: number;
  }[];
}

// ========================================
// STRIPE CONNECT ESCROW SYSTEM
// ========================================

declare type StripeAccountType = "standard" | "express" | "custom";

declare interface StripeConnectedAccount {
  $id: string;
  userId: string;
  stripeAccountId: string; // Stripe connected account ID
  accountType: StripeAccountType;
  country: string;
  currency: string;
  isActive: boolean;
  isVerified: boolean;
  canReceivePayments: boolean;
  canMakePayouts: boolean;
  requirementsCurrentlyDue: string[]; // Stripe verification requirements
  requirementsPastDue: string[];
  requirementsEventuallyDue: string[];
  payoutsEnabled: boolean;
  chargesEnabled: boolean;
  detailsSubmitted: boolean;
  onboardingLink?: string; // Temporary onboarding URL
  onboardingExpiresAt?: string;
  $createdAt: string;
  $updatedAt: string;
}

declare type EscrowStatus =
  | "pending_payment"      // Waiting for buyer to pay
  | "payment_received"     // Payment captured, waiting for shipment
  | "shipped"              // Seller marked as shipped, waiting for delivery
  | "in_transit"           // Tracking shows in transit
  | "delivered"            // Tracking shows delivered, waiting for confirmation
  | "confirmed"            // Buyer confirmed receipt
  | "auto_released"        // Auto-released after timer
  | "released"             // Funds released to seller
  | "disputed"             // Buyer raised a dispute
  | "refunded"             // Refunded to buyer
  | "cancelled";           // Transaction cancelled

declare type SettlementConditionType =
  | "tracking_confirmation"  // Requires tracking number verification
  | "time_based"             // Auto-release after X days
  | "buyer_confirmation"     // Requires buyer explicit confirmation
  | "delivery_confirmation"  // Requires delivery scan from carrier
  | "milestone_based"        // Service projects - milestone completion
  | "inspection_period"      // Physical goods - inspection period
  | "dual_signature"         // Both parties must confirm
  | "smart_contract";        // Programmable conditions

declare interface SettlementCondition {
  type: SettlementConditionType;
  description: string;
  isMet: boolean;
  metAt?: string;
  config: {
    // For tracking_confirmation
    requireTracking?: boolean;
    carrierName?: string;
    trackingNumber?: string;
    deliveryConfirmed?: boolean;

    // For time_based
    autoReleaseDays?: number;
    autoReleaseAt?: string;

    // For buyer_confirmation
    confirmationRequired?: boolean;
    confirmationDeadline?: string;

    // For milestone_based
    milestones?: {
      id: string;
      description: string;
      percentage: number;
      completed: boolean;
      completedAt?: string;
    }[];

    // For inspection_period
    inspectionDays?: number;
    inspectionDeadline?: string;

    // For dual_signature
    buyerSigned?: boolean;
    sellerSigned?: boolean;
  };
  priority: number; // 1 = highest, determines order of evaluation
}

declare interface EscrowTransaction {
  $id: string;

  // Parties
  buyerId: string;
  sellerId: string;
  sellerStripeAccountId: string;

  // Transaction details
  itemDescription: string;
  itemType: "physical_goods" | "digital_goods" | "service" | "subscription";
  amount: number; // Total amount in cents
  platformFee: number; // Platform fee in cents
  sellerAmount: number; // Amount seller receives (amount - platformFee)
  currency: string;

  // Payment
  stripePaymentIntentId: string;
  stripeChargeId?: string;
  stripeTransferId?: string; // Transfer to connected account
  stripePayoutId?: string; // Payout to seller's bank

  // Status & Timeline
  status: EscrowStatus;
  statusHistory: {
    status: EscrowStatus;
    timestamp: string;
    triggeredBy: "buyer" | "seller" | "platform" | "system";
    note?: string;
  }[];

  // Settlement Conditions
  settlementConditions: SettlementCondition[];
  allConditionsMet: boolean;

  // Shipping & Tracking
  shippingDetails?: {
    carrier: string;
    trackingNumber: string;
    trackingUrl?: string;
    shippedAt?: string;
    estimatedDelivery?: string;
    actualDelivery?: string;
    deliverySignature?: string;
    deliveryPhoto?: string;
  };

  // Dispute Management
  disputeReason?: string;
  disputedAt?: string;
  disputeResolution?: {
    resolvedBy: "buyer" | "seller" | "platform";
    resolution: "refund_full" | "refund_partial" | "release_to_seller" | "split";
    refundAmount?: number;
    resolvedAt: string;
    notes: string;
  };

  // Protection Periods
  disputePeriodDays: number; // Default: 7 days after delivery
  disputePeriodEndsAt?: string;

  // Metadata
  metadata?: {
    orderId?: string;
    invoiceId?: string;
    projectId?: string;
    customFields?: Record<string, any>;
  };

  $createdAt: string;
  $updatedAt: string;
}

declare interface EscrowEvent {
  $id: string;
  escrowTransactionId: string;
  eventType:
    | "payment_received"
    | "shipped"
    | "tracking_updated"
    | "delivered"
    | "confirmed"
    | "disputed"
    | "refunded"
    | "released"
    | "condition_met"
    | "condition_failed";
  description: string;
  triggeredBy: "buyer" | "seller" | "platform" | "system" | "webhook";
  data?: Record<string, any>;
  $createdAt: string;
}

// Settlement Rule Templates
declare interface SettlementRuleTemplate {
  $id: string;
  name: string;
  description: string;
  itemType: "physical_goods" | "digital_goods" | "service" | "subscription";
  conditions: Omit<SettlementCondition, "isMet" | "metAt">[];
  isDefault: boolean;
  isActive: boolean;
  $createdAt: string;
  $updatedAt: string;
}

// Platform Configuration
declare interface EscrowPlatformConfig {
  $id: string;
  platformFeePercentage: number; // e.g., 2.5 for 2.5%
  platformFeeFixed: number; // Fixed fee in cents
  stripeFeePercentage: number; // 2.9%
  stripeFeeFixed: number; // 30 cents
  defaultDisputePeriodDays: number; // 7 days
  defaultAutoReleaseDays: number; // 14 days
  defaultInspectionDays: number; // 3 days
  minTransactionAmount: number; // Minimum transaction in cents
  maxTransactionAmount: number; // Maximum without manual review
  requiresTrackingAbove: number; // Require tracking for amounts above this
  supportEmail: string;
  supportPhone?: string;
  termsUrl: string;
  privacyUrl: string;
  $createdAt: string;
  $updatedAt: string;
}
