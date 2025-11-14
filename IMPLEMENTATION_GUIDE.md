# Smart Wallet Implementation Guide

## 🎯 Overview

This guide explains the complete AI-powered smart wallet system built on top of the Horizon banking platform. The system includes **4 major phases** with tiered subscription features.

---

## 📊 **SUBSCRIPTION TIERS & FEATURE ACCESS**

### Free Tier ($0/month)
✅ **Features:**
- 1 bank account
- 3 budgets
- 2 savings goals
- Basic transaction tracking
- Manual categorization

❌ **Locked:**
- AI insights
- Cashflow forecasting
- Business mode
- VAT calculation
- Advanced reports

### Pro Tier ($9.99/month)
✅ **Everything in Free, PLUS:**
- Up to 5 bank accounts
- Unlimited budgets & goals
- **AI-powered categorization**
- **Smart spending insights**
- **30/60/90 day cashflow forecasting**
- Receipt OCR (50 scans/month)
- Advanced reports & exports
- 100 AI queries/month

### Business Tier ($29.99/month)
✅ **Everything in Pro, PLUS:**
- Unlimited bank accounts
- **Business vs Personal mode**
- **VAT calculation & returns**
- **Invoice generation**
- **Client & project tracking**
- P&L and balance sheets
- Tax optimization insights
- Expense reporting
- 500 AI queries/month
- 200 OCR scans/month
- 100 invoices/month

### Enterprise Tier ($99.99/month)
✅ **Everything in Business, PLUS:**
- Team collaboration
- Role-based permissions
- API access
- Unlimited AI queries
- Unlimited OCR scans
- Custom integrations
- Dedicated support

---

## 🏗️ **PHASE 1: Enhanced Transaction Intelligence**

### Features Implemented:

#### 1. **Smart Transaction Categorization**
**File:** `/lib/actions/categorization.actions.ts`

- **AI-powered auto-categorization** (rule-based + ML ready)
- **Personal vs Business** transaction types
- **40+ categories** including:
  - Income: salary, freelance, investment
  - Expenses: groceries, dining, utilities, rent
  - Business: office_supplies, marketing, software

**Key Functions:**
```typescript
categorizeTransaction() - Manually categorize
autoCategorizeTransaction() - AI categorization
bulkCategorizeTransactions() - Batch processing
getSpendingByCategory() - Category analytics
```

#### 2. **Budget Tracking**
**File:** `/lib/actions/budget.actions.ts`

- Create budgets by category & period (weekly/monthly/quarterly/yearly)
- **Real-time spending tracking**
- **Alert thresholds** (get notified at 80%, 100%)
- Budget vs actual analysis
- Automatic budget updates on new transactions

**Key Functions:**
```typescript
createBudget() - Create new budget
updateBudgetSpending() - Auto-update on transactions
getBudgetSummary() - Overall budget health
```

#### 3. **Savings Goals**
**File:** `/lib/actions/budget.actions.ts`

- Set target amounts & deadlines
- Track progress automatically
- Priority levels (low/medium/high)
- Achievement notifications

#### 4. **Recurring Transaction Detection**
- Identify subscriptions automatically
- Alert on upcoming bills
- Track subscription costs

---

## 🏢 **PHASE 2: Business Features**

### Features Implemented:

#### 1. **Business Entity Management**
**File:** `/lib/actions/business.actions.ts`

- Create multiple business entities
- Track business info (registration, tax ID, VAT number)
- Fiscal year configuration
- Industry classification

#### 2. **VAT/Tax Calculation System**
**File:** `/lib/actions/business.actions.ts`

**Compliant with current UK/EU banking practices:**

- **Standard VAT rate:** 20% (UK)
- **Multiple VAT rates** support (0%, 5%, 20%)
- **VAT schemes:** Standard, Flat Rate, Exempt
- **Automatic VAT calculation** on transactions
- **VAT return generation** (MTD compliant format)

**Key Functions:**
```typescript
calculateVAT() - Calculate VAT on amounts
calculateVATReturn() - Generate VAT return data
```

**VAT Return includes:**
- Total sales
- Total purchases
- VAT due on sales
- VAT reclaimed on purchases
- Net VAT payable

#### 3. **Invoice Management**
**Features:**
- Professional invoice generation
- Automatic invoice numbering (INV-00001)
- Client management
- Item-level VAT calculation
- Invoice status tracking (draft/sent/paid/overdue)
- Payment tracking

#### 4. **Client & Project Tracking**
- Client database with payment terms
- Project budgets vs actuals
- Project profitability analysis
- Client payment history

#### 5. **Receipt Management**
**File:** `/lib/actions/business.actions.ts`

- Upload receipts (images/PDF)
- **OCR text extraction** (using Tesseract.js)
- Auto-link to transactions
- Receipt verification

---

## 🤖 **PHASE 3: AI-Powered Insights**

### Features Implemented:

#### 1. **AI Financial Assistant**
**File:** `/lib/actions/ai.actions.ts`

**Powered by:** Anthropic Claude 3.5 Sonnet

**Capabilities:**
- Natural language queries: "Where is my money going?"
- Personalized financial advice
- Context-aware recommendations
- Budget optimization tips

**Key Functions:**
```typescript
queryAIAssistant() - Ask AI anything about your finances
```

#### 2. **Auto-Generated Insights**
**Types of insights:**
- **Budget warnings** - When exceeding budgets
- **Spending alerts** - Unusual patterns detected
- **Savings opportunities** - Where to cut costs
- **Tax tips** - Maximize deductions
- **Cashflow warnings** - Upcoming shortfalls
- **Optimization suggestions** - Better financial habits

#### 3. **Cashflow Forecasting**
**File:** `/lib/actions/ai.actions.ts`

**Periods:**
- 30 days
- 60 days
- 90 days
- 6 months
- 1 year

**Features:**
- Income projections based on history
- Expense predictions with variance
- Balance trajectory
- Confidence scores
- Daily/weekly/monthly breakdowns

#### 4. **Spending Pattern Analysis**
- Category trends (increasing/decreasing/stable)
- Month-over-month comparisons
- Top merchants by spending
- Anomaly detection

---

## 📊 **PHASE 4: Advanced Reporting**

### Features Implemented:

**File:** `/lib/actions/reports.actions.ts`

#### 1. **Profit & Loss Statement**
**Business compliant format:**
- Revenue (by category)
- Cost of Goods Sold (COGS)
- Gross Profit & Margin
- Operating Expenses
- Operating Profit & Margin
- Other Expenses
- Net Profit & Margin

#### 2. **Balance Sheet**
**Standard accounting format:**
- **Assets:** Current (cash, AR) + Fixed (equipment)
- **Liabilities:** Current (AP, taxes) + Long-term (loans)
- **Equity:** Owner equity + Retained earnings

#### 3. **Cashflow Statement**
**Three sections:**
- Operating Activities
- Investing Activities
- Financing Activities
- Net Cash Change

#### 4. **VAT Return Report**
**HMRC MTD compliant:**
- VAT due on sales
- VAT reclaimed on purchases
- Net VAT payable
- Period breakdown

#### 5. **Expense Reports**
- Total expenses by category
- Merchant breakdown
- Largest expenses
- Average transaction size

#### 6. **Income Reports**
- Income sources
- Monthly trends
- Year-over-year comparison

#### 7. **Tax Summary**
**Annual tax preparation:**
- Total income
- Deductible expenses
- Net income
- Quarterly breakdown
- Estimated tax liability

**All reports exportable as:**
- JSON
- PDF (via jsPDF)
- CSV

---

## 💳 **PAYWALL SYSTEM**

### How It Works:

1. **Feature gates** check subscription tier
2. **Usage limits** tracked in real-time
3. **Upgrade prompts** show when hitting limits
4. **Trial periods** available (14-30 days)

### Implementation:
```typescript
// Check feature access
const access = await checkFeatureAccess(userId, "aiInsights");
if (!access.allowed) {
  return `Upgrade to ${access.upgrade} to access this feature`;
}

// Check usage limits
const usage = await checkUsageLimit(userId, "aiQueriesPerMonth", currentUsage);
if (!usage.allowed) {
  return "You've reached your limit for this month";
}
```

### Paywall UI Components:
- **UpgradeModal** - Shows benefits of upgrading
- **FeatureLock** - Displays locked feature with CTA
- **UsageMeter** - Shows remaining quota

---

## 🗄️ **DATABASE STRUCTURE**

### Existing Collections:
1. `users` - User accounts
2. `banks` - Connected bank accounts
3. `transactions` - Transfer transactions

### New Collections (19 total):
4. `subscriptions` - User subscription tiers
5. `budgets` - Budget definitions
6. `savings_goals` - Financial goals
7. `business_entities` - Business information
8. `vat_configurations` - VAT settings
9. `clients` - Business clients
10. `projects` - Project tracking
11. `invoices` - Invoice records
12. `receipts` - Receipt uploads
13. `enhanced_transactions` - Categorized transactions
14. `recurring_transactions` - Subscription patterns
15. `ai_insights` - Generated insights
16. `cashflow_forecasts` - Forecast data
17. `alerts` - User notifications
18. `user_preferences` - Settings
19. `financial_reports` - Generated reports

**See `DATABASE_SCHEMA.md` for detailed schema**

---

## 🔄 **DATA FLOW**

### Transaction Flow:
1. **Plaid** syncs transactions from bank
2. User categorizes (or AI auto-categorizes)
3. **Enhanced transaction** record created
4. **Budgets** automatically updated
5. **Insights** generated if patterns detected
6. **Alerts** sent if thresholds exceeded

### Invoice Flow:
1. Create invoice with line items
2. VAT calculated automatically
3. Invoice sent to client
4. Status tracked (draft → sent → paid)
5. Client totals updated
6. Transaction linked when paid

---

## 🎨 **UI/UX FEATURES**

### Consistent Design:
- **TailwindCSS** for styling
- **ShadCN UI** components
- **Lucide** icons
- **Responsive** design (mobile-first)

### Key UI Components to Build:
1. **BudgetCard** - Budget progress display
2. **GoalProgress** - Savings goal tracker
3. **AIInsightCard** - Insight display
4. **CashflowChart** - Forecast visualization
5. **TransactionCategorizer** - Quick categorize UI
6. **InvoiceForm** - Invoice creator
7. **VATReport** - VAT summary display
8. **SubscriptionUpgrade** - Pricing tiers

---

## 🚀 **GETTING STARTED**

### 1. Setup Appwrite Collections

Run this script to create all collections:

```javascript
// Create all 19 collections in Appwrite
// See DATABASE_SCHEMA.md for attributes
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in:
- Appwrite credentials
- Plaid keys
- Dwolla keys
- Anthropic API key

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

---

## 🔐 **SECURITY & COMPLIANCE**

### Data Protection:
- **HTTP-only cookies** for sessions
- **Encrypted** sensitive data
- **No client-side secrets**

### Banking Compliance:
- **PSD2 compliant** (via Plaid)
- **Open Banking** standards
- **GDPR compliant** data handling

### VAT Compliance:
- **MTD (Making Tax Digital)** ready
- Accurate VAT calculations
- Proper record keeping

---

## 📈 **ANALYTICS & TRACKING**

### Metrics to Track:
- Daily Active Users (DAU)
- Subscription conversion rates
- Feature usage per tier
- AI query volume
- OCR accuracy rates
- Invoice generation volume

### Recommended Tools:
- **Sentry** - Error tracking (already integrated)
- **Posthog** - Product analytics
- **Stripe** - Payment processing (to be added)

---

## 🛣️ **ROADMAP**

### Next Steps:
1. ✅ Core features complete
2. 🔄 UI component development
3. 📱 Mobile app (React Native)
4. 🔌 API for third-party integrations
5. 💰 Stripe payment integration
6. 📊 Enhanced AI models (fine-tuned)
7. 🌍 Multi-currency support
8. 👥 Team collaboration features
9. 🔗 Accounting software integrations (Xero, QuickBooks)
10. 📱 Mobile receipt scanning

---

## 🎯 **SUCCESS METRICS**

### Free → Pro Conversion:
- Target: 10-15%
- Trigger: AI insights, cashflow forecasting

### Pro → Business Conversion:
- Target: 20-30%
- Trigger: VAT calculation, invoicing

### Retention:
- Monthly churn target: <5%
- Annual retention: >85%

---

## 💡 **TIPS FOR DEVELOPERS**

### Best Practices:
1. Always check subscription tier before feature access
2. Track usage limits in real-time
3. Provide clear upgrade paths
4. Test with sandbox APIs (Plaid, Dwolla)
5. Cache AI responses to save costs
6. Implement rate limiting on AI queries
7. Validate VAT numbers against government databases

### Common Pitfalls:
- ❌ Don't skip subscription checks
- ❌ Don't hard-code tier limits
- ❌ Don't forget to handle expired subscriptions
- ❌ Don't mix personal and business transactions without user consent

---

## 📞 **SUPPORT**

For questions or issues:
- GitHub Issues: [Report here]
- Documentation: See README.md
- Database Schema: See DATABASE_SCHEMA.md
- API Reference: See code comments

---

## 📄 **LICENSE**

This project is private and proprietary.

---

**Built with ❤️ using Next.js, Anthropic Claude AI, Plaid, and Dwolla**
