# 🚀 Smart Wallet - AI-Powered Banking & Business Management

> **Transform your banking app into an intelligent financial assistant and complete business management platform**

---

## 🌟 **What's New?**

This repository has been enhanced from a basic banking app to a **full-featured AI-powered smart wallet** with:

- 🤖 **AI Financial Assistant** - Your accountant in your pocket
- 💼 **Business Mode** - Separate business & personal finances
- 📊 **Cashflow Forecasting** - Predict your financial future
- 🧾 **VAT Calculation** - Automated tax management (UK/EU compliant)
- 📈 **Advanced Reporting** - P&L, Balance Sheets, Tax Summaries
- 💰 **Smart Budgeting** - AI-powered budget recommendations
- 📸 **Receipt OCR** - Scan receipts automatically
- 📑 **Invoicing** - Professional invoice generation

---

## 💎 **Subscription Tiers**

### 🆓 Free - $0/month
Perfect for getting started
- 1 bank account
- 3 budgets, 2 savings goals
- Basic transaction tracking
- Manual categorization

### ⭐ Pro - $9.99/month
AI-powered personal finance
- 5 bank accounts
- Unlimited budgets & goals
- **AI categorization & insights**
- **Cashflow forecasting (30/60/90 days)**
- Receipt OCR (50/month)
- Advanced reports
- 100 AI queries/month

### 💼 Business - $29.99/month
Complete business management
- **Everything in Pro, PLUS:**
- Unlimited accounts
- **Business vs Personal mode**
- **VAT calculation & returns**
- **Invoice generation (100/month)**
- Client & project tracking
- P&L and balance sheets
- 500 AI queries/month

### 🏢 Enterprise - $99.99/month
Team collaboration & API
- **Everything in Business, PLUS:**
- Team collaboration
- API access
- Unlimited everything
- Dedicated support

---

## 🎯 **Key Features Breakdown**

### PHASE 1: Transaction Intelligence

#### Smart Categorization
```
✅ 40+ categories (income, expenses, business)
✅ AI auto-categorization
✅ Personal vs Business tagging
✅ Recurring transaction detection
✅ Custom tags & notes
```

#### Budget Tracking
```
✅ Weekly/Monthly/Quarterly/Yearly budgets
✅ Real-time spending tracking
✅ Alert thresholds (80%, 100%)
✅ Budget vs actual analysis
✅ Category-level budgets
```

#### Savings Goals
```
✅ Target amounts & deadlines
✅ Progress tracking
✅ Priority levels
✅ Achievement notifications
```

---

### PHASE 2: Business Features

#### Business Mode
```
✅ Create multiple business entities
✅ Separate business/personal transactions
✅ Track business info (Tax ID, VAT number)
✅ Fiscal year configuration
```

#### VAT/Tax Management
```
✅ Automatic VAT calculation (20% UK standard)
✅ Multiple VAT rates (0%, 5%, 20%)
✅ VAT scheme support (Standard/Flat Rate/Exempt)
✅ MTD-compliant VAT returns
✅ Quarterly VAT summaries
```

#### Invoicing System
```
✅ Professional invoice generation
✅ Automatic invoice numbering
✅ Client management
✅ Payment tracking
✅ Status management (draft/sent/paid/overdue)
```

#### Client & Project Tracking
```
✅ Client database
✅ Project budgets vs actuals
✅ Profitability analysis
✅ Payment terms tracking
```

#### Receipt Management
```
✅ Upload receipts (images/PDF)
✅ OCR text extraction
✅ Auto-link to transactions
✅ Receipt verification
```

---

### PHASE 3: AI-Powered Insights

#### AI Financial Assistant
```
Powered by Anthropic Claude 3.5 Sonnet

Ask questions like:
- "Where is my money going this month?"
- "How can I save more money?"
- "Am I on track for my savings goal?"
- "What's my tax liability this quarter?"
- "Should I worry about this expense?"
```

#### Auto-Generated Insights
```
✅ Budget warnings (exceeded budgets)
✅ Spending alerts (unusual patterns)
✅ Savings opportunities (cost-cutting tips)
✅ Tax optimization (maximize deductions)
✅ Cashflow warnings (upcoming shortfalls)
✅ Subscription detection (cancel unused)
```

#### Cashflow Forecasting
```
✅ 30/60/90 day projections
✅ 6-month & 1-year forecasts
✅ Income pattern analysis
✅ Expense predictions with variance
✅ Balance trajectory
✅ Confidence scores
```

#### Spending Pattern Analysis
```
✅ Category trends (increasing/decreasing/stable)
✅ Month-over-month comparisons
✅ Top merchants by spending
✅ Anomaly detection
```

---

### PHASE 4: Advanced Reporting

#### Business Reports
```
✅ Profit & Loss Statement
  - Revenue by category
  - COGS, Gross Profit
  - Operating Expenses
  - Net Profit & Margins

✅ Balance Sheet
  - Assets (current + fixed)
  - Liabilities (current + long-term)
  - Equity & Retained Earnings

✅ Cashflow Statement
  - Operating Activities
  - Investing Activities
  - Financing Activities
```

#### VAT Reports
```
✅ VAT Return (HMRC MTD compliant)
  - VAT due on sales
  - VAT reclaimed on purchases
  - Net VAT payable
```

#### Personal Reports
```
✅ Expense Reports
  - Total expenses by category
  - Merchant breakdown
  - Largest expenses

✅ Income Reports
  - Income sources
  - Monthly trends
  - Year-over-year comparison

✅ Tax Summary
  - Annual income & deductions
  - Quarterly breakdown
  - Estimated tax liability
```

#### Export Options
```
✅ PDF (professional formatting)
✅ CSV (Excel compatible)
✅ JSON (programmatic access)
```

---

## 🏗️ **Architecture**

### Tech Stack (Enhanced)

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- ShadCN UI
- Recharts (advanced charting)
- React Hook Form + Zod

**Backend:**
- Next.js Server Actions
- Appwrite (Database + Auth)
- Plaid (Bank connections)
- Dwolla (Payments)

**AI & Intelligence:**
- Anthropic Claude 3.5 Sonnet
- Tesseract.js (OCR)
- Custom ML categorization

**Reporting:**
- jsPDF (PDF generation)
- Chart.js (visualizations)

### Database Collections

**Original (3):**
1. users
2. banks
3. transactions

**New (16):**
4. subscriptions
5. budgets
6. savings_goals
7. business_entities
8. vat_configurations
9. clients
10. projects
11. invoices
12. receipts
13. enhanced_transactions
14. recurring_transactions
15. ai_insights
16. cashflow_forecasts
17. alerts
18. user_preferences
19. financial_reports

---

## 🚀 **Quick Start**

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment Variables
Copy `.env.example` to `.env` and add:

**Required:**
- Appwrite credentials (19 collections)
- Plaid API keys
- Dwolla API keys
- Anthropic API key

**Optional:**
- Sentry DSN

### 3. Create Appwrite Collections
Follow `DATABASE_SCHEMA.md` to create all 19 collections with proper attributes and indexes.

### 4. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000`

---

## 📖 **Documentation**

- **Implementation Guide**: `IMPLEMENTATION_GUIDE.md` - Detailed technical documentation
- **Database Schema**: `DATABASE_SCHEMA.md` - Complete database structure
- **Type Definitions**: `types/extended.d.ts` - All TypeScript types
- **Subscription Tiers**: `constants/subscription.ts` - Feature access logic

---

## 🎨 **Feature Access Examples**

### Checking Feature Access
```typescript
import { checkFeatureAccess } from "@/lib/actions/subscription.actions";

const access = await checkFeatureAccess(userId, "aiInsights");
if (!access.allowed) {
  // Show upgrade prompt
  return `Upgrade to ${access.upgrade} to access AI insights`;
}

// Feature is available
const insights = await generateFinancialInsights(userId);
```

### Usage Limits
```typescript
import { checkUsageLimit } from "@/lib/actions/subscription.actions";

const usage = await checkUsageLimit(userId, "aiQueriesPerMonth", currentCount);
if (!usage.allowed) {
  return "You've reached your AI query limit for this month";
}

// Show remaining quota
console.log(`Remaining: ${usage.remaining} queries`);
```

---

## 💰 **Monetization Strategy**

### Conversion Funnels

**Free → Pro (10-15% target):**
- Trigger: AI insights, cashflow forecasting
- Hook: "See where your money is really going"

**Pro → Business (20-30% target):**
- Trigger: VAT calculation, invoicing
- Hook: "Run your business like a pro"

**Business → Enterprise:**
- Trigger: Team collaboration, API access
- Hook: "Scale with your team"

### Retention Strategy
- Monthly churn target: <5%
- Annual retention: >85%
- Feature engagement tracking
- Proactive upgrade suggestions

---

## 🔒 **Security & Compliance**

### Data Protection
- HTTP-only secure cookies
- Encrypted sensitive data
- No client-side secrets
- GDPR compliant

### Banking Compliance
- PSD2 compliant (via Plaid)
- Open Banking standards
- Secure API connections

### VAT Compliance
- MTD (Making Tax Digital) ready
- Accurate VAT calculations
- Proper record keeping
- HMRC submission format

---

## 📊 **Analytics & Metrics**

Track these metrics for success:

**User Metrics:**
- Daily/Monthly Active Users
- Subscription conversion rates
- Feature usage per tier
- Churn rate by tier

**Technical Metrics:**
- AI query volume & cost
- OCR accuracy rates
- API response times
- Error rates (via Sentry)

**Business Metrics:**
- MRR (Monthly Recurring Revenue)
- Customer Lifetime Value (CLV)
- Customer Acquisition Cost (CAC)

---

## 🛠️ **Development Tips**

### Best Practices
1. Always check subscription tier before feature access
2. Track usage limits in real-time
3. Provide clear upgrade paths in UI
4. Test with sandbox APIs
5. Cache AI responses to save costs
6. Validate VAT numbers
7. Implement rate limiting

### Common Pitfalls
❌ Don't skip subscription checks
❌ Don't hard-code tier limits
❌ Don't forget to handle expired subscriptions
❌ Don't mix personal/business without consent

---

## 🗺️ **Roadmap**

### Completed ✅
- [x] Transaction categorization
- [x] Budget tracking
- [x] Business mode
- [x] VAT calculation
- [x] AI insights
- [x] Cashflow forecasting
- [x] Advanced reporting
- [x] Subscription tiers

### In Progress 🔄
- [ ] UI component development
- [ ] Stripe payment integration
- [ ] PDF export optimization

### Planned 📅
- [ ] Mobile app (React Native)
- [ ] Multi-currency support
- [ ] Team collaboration
- [ ] Accounting software integrations (Xero, QuickBooks)
- [ ] Advanced AI models (fine-tuned)
- [ ] API for third-party developers
- [ ] Mobile receipt scanning

---

## 📞 **Support**

Need help? Check these resources:

- 📖 **Documentation**: See `IMPLEMENTATION_GUIDE.md`
- 🗄️ **Database**: See `DATABASE_SCHEMA.md`
- 💬 **Issues**: Create a GitHub issue
- 🐛 **Bugs**: Report via Sentry integration

---

## 📜 **License**

This project is proprietary and private.

---

## 🙏 **Credits**

**Original Banking App:**
- JavaScript Mastery tutorial

**Smart Wallet Enhancements:**
- AI: Anthropic Claude 3.5
- Banking: Plaid & Dwolla
- Database: Appwrite
- Framework: Next.js 14

---

**Built with ❤️ for the future of personal & business finance**

*Your AI-powered accountant in your pocket* 🤖💼
