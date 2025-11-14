# Database Schema Documentation

## Overview
This document outlines the Appwrite database collections required for the Smart Wallet AI Banking Application.

## Existing Collections

### 1. users
- **Purpose**: User account information
- **Attributes**:
  - userId (string) - Appwrite user ID
  - email (string)
  - firstName (string)
  - lastName (string)
  - address1 (string)
  - city (string)
  - state (string)
  - postalCode (string)
  - dateOfBirth (string)
  - ssn (string)
  - dwollaCustomerUrl (string)
  - dwollaCustomerId (string)

### 2. banks
- **Purpose**: Connected bank account references
- **Attributes**:
  - userId (string) - Reference to users collection
  - accountId (string) - Plaid account ID
  - bankId (string) - Plaid item ID
  - accessToken (string) - Plaid access token
  - fundingSourceUrl (string) - Dwolla funding source
  - sharableId (string) - Encrypted account ID

### 3. transactions
- **Purpose**: Transfer transactions between users
- **Attributes**:
  - name (string)
  - amount (string)
  - senderId (string)
  - senderBankId (string)
  - receiverId (string)
  - receiverBankId (string)
  - email (string)
  - channel (string)
  - category (string)

## New Collections Required

### 4. subscriptions
- **Purpose**: User subscription and tier management
- **Attributes**:
  - userId (string, required, indexed) - Reference to users
  - tier (enum: free|pro|business|enterprise, required)
  - status (enum: active|cancelled|expired|trial, required)
  - startDate (datetime, required)
  - endDate (datetime, required)
  - autoRenew (boolean, default: true)
  - stripeCustomerId (string, optional)
  - stripeSubscriptionId (string, optional)

### 5. budgets
- **Purpose**: User-defined spending budgets
- **Attributes**:
  - userId (string, required, indexed)
  - name (string, required)
  - category (string, required) - TransactionCategory
  - amount (double, required)
  - period (enum: weekly|monthly|quarterly|yearly, required)
  - startDate (datetime, required)
  - endDate (datetime, optional)
  - alertThreshold (integer, required, default: 80)
  - isActive (boolean, default: true)
  - spent (double, default: 0)
  - remaining (double, default: amount)
  - transactionType (enum: personal|business, required)

### 6. savings_goals
- **Purpose**: Financial goals and targets
- **Attributes**:
  - userId (string, required, indexed)
  - name (string, required)
  - targetAmount (double, required)
  - currentAmount (double, default: 0)
  - deadline (datetime, optional)
  - icon (string, optional)
  - color (string, optional)
  - priority (enum: low|medium|high, required)
  - isCompleted (boolean, default: false)
  - linkedAccountId (string, optional)

### 7. business_entities
- **Purpose**: Business information for business mode
- **Attributes**:
  - userId (string, required, indexed)
  - businessName (string, required)
  - businessType (enum, required)
  - registrationNumber (string, optional)
  - taxId (string, required)
  - vatNumber (string, optional)
  - addressStreet (string, required)
  - addressCity (string, required)
  - addressState (string, required)
  - addressPostalCode (string, required)
  - addressCountry (string, required)
  - industry (string, required)
  - currency (string, default: USD)
  - fiscalYearStart (string, required) - MM-DD format
  - logo (string, optional)
  - isActive (boolean, default: true)

### 8. vat_configurations
- **Purpose**: VAT/tax settings per business
- **Attributes**:
  - userId (string, required, indexed)
  - businessEntityId (string, required, indexed)
  - defaultVATRate (double, required)
  - vatRatesJSON (string, required) - JSON array of rate objects
  - vatScheme (enum: standard|flat_rate|exempt, required)
  - registrationDate (datetime, required)
  - reportingPeriod (enum: monthly|quarterly|annual, required)
  - nextFilingDate (datetime, required)

### 9. enhanced_transactions
- **Purpose**: Extended transaction data with categorization
- **Attributes**:
  - userId (string, required, indexed)
  - transactionId (string, required, indexed) - Original Plaid transaction ID
  - enhancedCategory (string, required)
  - transactionType (enum: personal|business, required)
  - isRecurring (boolean, default: false)
  - recurringFrequency (enum, optional)
  - merchantName (string, optional)
  - merchantLogo (string, optional)
  - notes (string, optional)
  - tagsJSON (string, optional) - JSON array
  - receiptId (string, optional)
  - invoiceId (string, optional)
  - vatAmount (double, optional)
  - vatRate (double, optional)
  - isVatEligible (boolean, default: false)
  - projectId (string, optional)
  - clientId (string, optional)
  - businessEntityId (string, optional)
  - splitAmount (double, optional)
  - splitPercentage (double, optional)

### 10. invoices
- **Purpose**: Business invoicing system
- **Attributes**:
  - userId (string, required, indexed)
  - businessEntityId (string, required, indexed)
  - invoiceNumber (string, required, unique)
  - status (enum: draft|sent|paid|overdue|cancelled, required)
  - clientId (string, required, indexed)
  - clientName (string, required)
  - clientEmail (string, required)
  - clientAddress (string, optional)
  - itemsJSON (string, required) - JSON array of line items
  - subtotal (double, required)
  - vatAmount (double, required)
  - totalAmount (double, required)
  - currency (string, required)
  - issueDate (datetime, required)
  - dueDate (datetime, required)
  - paidDate (datetime, optional)
  - notes (string, optional)
  - terms (string, optional)
  - linkedTransactionId (string, optional)

### 11. receipts
- **Purpose**: Receipt storage and OCR data
- **Attributes**:
  - userId (string, required, indexed)
  - transactionId (string, optional, indexed)
  - fileName (string, required)
  - fileUrl (string, required)
  - fileType (string, required)
  - uploadDate (datetime, required)
  - ocrDataJSON (string, optional) - JSON object
  - verified (boolean, default: false)
  - notes (string, optional)
  - tagsJSON (string, optional) - JSON array

### 12. clients
- **Purpose**: Business client management
- **Attributes**:
  - userId (string, required, indexed)
  - businessEntityId (string, required, indexed)
  - name (string, required)
  - email (string, required)
  - phone (string, optional)
  - address (string, optional)
  - taxId (string, optional)
  - vatNumber (string, optional)
  - paymentTerms (integer, default: 30) - Days
  - notes (string, optional)
  - isActive (boolean, default: true)
  - totalInvoiced (double, default: 0)
  - totalPaid (double, default: 0)

### 13. projects
- **Purpose**: Project tracking for businesses
- **Attributes**:
  - userId (string, required, indexed)
  - businessEntityId (string, required, indexed)
  - name (string, required)
  - clientId (string, optional, indexed)
  - status (enum: active|on_hold|completed|cancelled, required)
  - budget (double, optional)
  - spent (double, default: 0)
  - startDate (datetime, required)
  - endDate (datetime, optional)
  - description (string, optional)
  - color (string, optional)

### 14. cashflow_forecasts
- **Purpose**: AI-generated cashflow predictions
- **Attributes**:
  - userId (string, required, indexed)
  - forecastDate (datetime, required)
  - period (enum: 30_days|60_days|90_days|6_months|1_year, required)
  - projectedIncome (double, required)
  - projectedExpenses (double, required)
  - projectedBalance (double, required)
  - confidence (integer, required) - 0-100
  - dataPointsJSON (string, required) - JSON array
  - generatedAt (datetime, required)

### 15. ai_insights
- **Purpose**: AI-generated financial insights
- **Attributes**:
  - userId (string, required, indexed)
  - type (enum, required)
  - priority (enum: low|medium|high|urgent, required)
  - title (string, required)
  - description (string, required)
  - actionable (boolean, default: false)
  - actionJSON (string, optional) - JSON object
  - category (string, optional)
  - estimatedSavings (double, optional)
  - isRead (boolean, default: false)
  - isDismissed (boolean, default: false)
  - expiresAt (datetime, optional)

### 16. recurring_transactions
- **Purpose**: Detected recurring payment patterns
- **Attributes**:
  - userId (string, required, indexed)
  - name (string, required)
  - merchantName (string, required)
  - amount (double, required)
  - category (string, required)
  - transactionType (enum: personal|business, required)
  - frequency (enum, required)
  - nextExpectedDate (datetime, required)
  - lastDetectedDate (datetime, optional)
  - isActive (boolean, default: true)
  - alertEnabled (boolean, default: true)
  - notes (string, optional)
  - detectedTransactionIdsJSON (string, required) - JSON array

### 17. alerts
- **Purpose**: User notifications and alerts
- **Attributes**:
  - userId (string, required, indexed)
  - type (enum, required)
  - severity (enum: info|warning|error, required)
  - title (string, required)
  - message (string, required)
  - link (string, optional)
  - isRead (boolean, default: false)
  - isDismissed (boolean, default: false)
  - actionRequired (boolean, default: false)
  - metadataJSON (string, optional) - JSON object

### 18. user_preferences
- **Purpose**: User settings and preferences
- **Attributes**:
  - userId (string, required, unique indexed)
  - defaultView (enum: personal|business|combined, default: personal)
  - defaultCurrency (string, default: USD)
  - dateFormat (enum, default: MM/DD/YYYY)
  - fiscalYearStart (string, default: 01-01)
  - notificationsJSON (string, required) - JSON object
  - privacyJSON (string, required) - JSON object
  - displayJSON (string, required) - JSON object

### 19. financial_reports
- **Purpose**: Generated reports and exports
- **Attributes**:
  - userId (string, required, indexed)
  - businessEntityId (string, optional, indexed)
  - reportType (enum, required)
  - periodStart (datetime, required)
  - periodEnd (datetime, required)
  - dataJSON (string, required) - JSON object
  - format (enum: json|pdf|csv, required)
  - fileUrl (string, optional)
  - generatedAt (datetime, required)

## Indexes

### Recommended Indexes:
- **budgets**: userId, isActive
- **enhanced_transactions**: userId, transactionType, enhancedCategory, businessEntityId
- **invoices**: userId, businessEntityId, status, clientId
- **subscriptions**: userId, status
- **ai_insights**: userId, isRead, isDismissed
- **alerts**: userId, isRead
- **recurring_transactions**: userId, isActive
- **cashflow_forecasts**: userId, period

## Relationships

1. **users** → **subscriptions** (1:1)
2. **users** → **business_entities** (1:many)
3. **business_entities** → **vat_configurations** (1:1)
4. **business_entities** → **clients** (1:many)
5. **business_entities** → **projects** (1:many)
6. **business_entities** → **invoices** (1:many)
7. **users** → **budgets** (1:many)
8. **users** → **savings_goals** (1:many)
9. **users** → **enhanced_transactions** (1:many)
10. **enhanced_transactions** → **receipts** (1:1 optional)
11. **enhanced_transactions** → **invoices** (1:1 optional)
12. **clients** → **invoices** (1:many)
13. **clients** → **projects** (1:many optional)

## Migration Notes

### For Existing Transactions:
- Plaid transactions continue to be fetched via API
- Create `enhanced_transactions` records when user categorizes
- Default all existing to `personal` type, `other` category
- Background job can run AI categorization

### Initial Setup:
1. Create free tier subscription for all existing users
2. Create default user preferences
3. Set up trial period for Pro features (14 days)

## Storage Requirements

### Buckets Needed:
1. **receipts** - For receipt image uploads
   - Max file size: 10MB
   - Allowed types: image/*, application/pdf
   - Permissions: User read/write own files

2. **reports** - For generated PDF reports
   - Max file size: 50MB
   - Allowed types: application/pdf, text/csv
   - Permissions: User read own files

3. **business-logos** - For business entity logos
   - Max file size: 2MB
   - Allowed types: image/*
   - Permissions: User read/write own files

## Data Retention

- **Transactions**: Indefinite (user controlled)
- **Forecasts**: 6 months
- **Insights**: 90 days (unless saved)
- **Alerts**: 30 days (unless unread)
- **Reports**: 2 years
- **Receipts**: Indefinite (user controlled)
