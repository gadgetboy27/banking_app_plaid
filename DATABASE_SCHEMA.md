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
- **Escrow Transactions**: 7 years (compliance)
- **Escrow Events**: 7 years (audit trail)

---

# STRIPE CONNECT ESCROW SYSTEM

## Collections for Marketplace/Escrow Functionality

### 20. stripe_connected_accounts
- **Purpose**: Seller Stripe Connect account information
- **Attributes**:
  - userId (string, required) - Reference to users collection
  - stripeAccountId (string, required) - Stripe connected account ID
  - accountType (enum, required) - "standard" | "express" | "custom"
  - country (string, required) - Country code (NZ, AU, US, etc.)
  - currency (string, required) - Default currency (nzd, aud, usd)
  - isActive (boolean, required) - Account active status
  - isVerified (boolean, required) - KYC verification complete
  - canReceivePayments (boolean) - Can receive payments
  - canMakePayouts (boolean) - Can make payouts
  - requirementsCurrentlyDueJSON (string) - JSON array of requirements
  - requirementsPastDueJSON (string) - JSON array of past due requirements
  - requirementsEventuallyDueJSON (string) - JSON array of eventual requirements
  - payoutsEnabled (boolean) - Payouts enabled by Stripe
  - chargesEnabled (boolean) - Charges enabled by Stripe
  - detailsSubmitted (boolean) - Onboarding completed
  - onboardingLink (string, optional) - Temporary onboarding URL
  - onboardingExpiresAt (datetime, optional) - Onboarding link expiry
- **Indexes**:
  - userId (unique)
  - stripeAccountId (unique)
  - isActive
- **Relationships**:
  - userId → users.$id

### 21. escrow_transactions
- **Purpose**: Core escrow transaction management
- **Attributes**:
  - buyerId (string, required) - Reference to users collection
  - sellerId (string, required) - Reference to users collection
  - sellerStripeAccountId (string, required) - Stripe connected account ID
  - itemDescription (string, required) - What is being sold
  - itemType (enum, required) - "physical_goods" | "digital_goods" | "service" | "subscription"
  - amount (integer, required) - Total amount in cents
  - platformFee (integer, required) - Platform fee in cents
  - sellerAmount (integer, required) - Amount seller receives
  - currency (string, required) - Currency code (nzd, aud, usd)
  - stripePaymentIntentId (string, required) - Stripe payment intent ID
  - stripeChargeId (string, optional) - Stripe charge ID
  - stripeTransferId (string, optional) - Stripe transfer ID
  - stripePayoutId (string, optional) - Stripe payout ID
  - status (enum, required) - "pending_payment" | "payment_received" | "shipped" | "in_transit" | "delivered" | "confirmed" | "auto_released" | "released" | "disputed" | "refunded" | "cancelled"
  - statusHistoryJSON (string, required) - JSON array of status history
  - settlementConditionsJSON (string, required) - JSON array of settlement conditions
  - allConditionsMet (boolean, required) - All conditions satisfied
  - shippingDetailsJSON (string, optional) - JSON object of shipping data
  - disputeReason (string, optional) - Reason for dispute
  - disputedAt (datetime, optional) - When dispute was opened
  - disputeResolutionJSON (string, optional) - JSON object of resolution
  - disputePeriodDays (integer, required) - Number of days for dispute period
  - disputePeriodEndsAt (datetime, optional) - When dispute period ends
  - metadataJSON (string, optional) - Custom metadata JSON
- **Indexes**:
  - buyerId
  - sellerId
  - status
  - $createdAt (desc)
- **Relationships**:
  - buyerId → users.$id
  - sellerId → users.$id

### 22. escrow_events
- **Purpose**: Audit trail and event log for escrow transactions
- **Attributes**:
  - escrowTransactionId (string, required) - Reference to escrow_transactions
  - eventType (enum, required) - "payment_received" | "shipped" | "tracking_updated" | "delivered" | "confirmed" | "disputed" | "refunded" | "released" | "condition_met" | "condition_failed"
  - description (string, required) - Human-readable description
  - triggeredBy (enum, required) - "buyer" | "seller" | "platform" | "system" | "webhook"
  - dataJSON (string, optional) - Additional event data as JSON
- **Indexes**:
  - escrowTransactionId
  - eventType
  - $createdAt (desc)
- **Relationships**:
  - escrowTransactionId → escrow_transactions.$id

### 23. escrow_platform_config
- **Purpose**: Platform-wide escrow configuration
- **Attributes**:
  - platformFeePercentage (float, required) - Platform fee % (e.g., 2.5)
  - platformFeeFixed (integer, required) - Fixed platform fee in cents
  - stripeFeePercentage (float, required) - Stripe fee % (2.9)
  - stripeFeeFixed (integer, required) - Stripe fixed fee in cents (30)
  - defaultDisputePeriodDays (integer, required) - Default dispute period (7)
  - defaultAutoReleaseDays (integer, required) - Default auto-release days (14)
  - defaultInspectionDays (integer, required) - Default inspection days (3)
  - minTransactionAmount (integer, required) - Minimum transaction in cents
  - maxTransactionAmount (integer, required) - Maximum without manual review
  - requiresTrackingAbove (integer, required) - Require tracking above this amount
  - supportEmail (string, required) - Support contact email
  - supportPhone (string, optional) - Support phone number
  - termsUrl (string, required) - Terms of service URL
  - privacyUrl (string, required) - Privacy policy URL
- **Note**: Usually only 1 document in this collection (singleton pattern)

## Settlement Condition Examples

### Physical Goods (E-commerce):
```json
[
  {
    "type": "tracking_confirmation",
    "description": "Seller must provide tracking and item must be delivered",
    "priority": 1,
    "config": { "requireTracking": true }
  },
  {
    "type": "buyer_confirmation",
    "description": "Buyer must confirm receipt OR",
    "priority": 2,
    "config": { "confirmationRequired": true }
  },
  {
    "type": "time_based",
    "description": "Auto-release after 14 days if no dispute",
    "priority": 3,
    "config": {
      "autoReleaseDays": 14,
      "autoReleaseAt": "2025-12-01T00:00:00Z"
    }
  }
]
```

### Digital Goods:
```json
[
  {
    "type": "buyer_confirmation",
    "description": "Buyer must confirm receipt OR",
    "priority": 1,
    "config": { "confirmationRequired": true }
  },
  {
    "type": "time_based",
    "description": "Auto-release after 48 hours if no dispute",
    "priority": 2,
    "config": {
      "autoReleaseDays": 2,
      "autoReleaseAt": "2025-11-17T00:00:00Z"
    }
  }
]
```

### Service/Freelance Project:
```json
[
  {
    "type": "milestone_based",
    "description": "All project milestones must be completed",
    "priority": 1,
    "config": {
      "milestones": [
        {
          "id": "1",
          "description": "Design mockups delivered",
          "percentage": 30,
          "completed": false
        },
        {
          "id": "2",
          "description": "Development complete",
          "percentage": 60,
          "completed": false
        },
        {
          "id": "3",
          "description": "Final delivery and handoff",
          "percentage": 10,
          "completed": false
        }
      ]
    }
  },
  {
    "type": "buyer_confirmation",
    "description": "Buyer must approve final deliverable",
    "priority": 2,
    "config": { "confirmationRequired": true }
  }
]
```

### High-Value Items (with Inspection):
```json
[
  {
    "type": "delivery_confirmation",
    "description": "Item must be delivered with signature",
    "priority": 1,
    "config": { "requireSignature": true }
  },
  {
    "type": "inspection_period",
    "description": "3-day inspection period for buyer",
    "priority": 2,
    "config": {
      "inspectionDays": 3,
      "inspectionDeadline": "2025-11-20T00:00:00Z"
    }
  },
  {
    "type": "buyer_confirmation",
    "description": "Buyer must confirm item condition",
    "priority": 3,
    "config": { "confirmationRequired": true }
  }
]
```

## Escrow Transaction Lifecycle

```
1. PENDING_PAYMENT
   ↓ (buyer pays)
2. PAYMENT_RECEIVED
   ↓ (seller ships with tracking)
3. SHIPPED
   ↓ (carrier updates)
4. IN_TRANSIT
   ↓ (carrier confirms delivery)
5. DELIVERED
   ↓ (buyer confirms OR timer expires)
6. CONFIRMED
   ↓ (conditions evaluated)
7. RELEASED (funds to seller's bank)

Alternate paths:
- DISPUTED → REFUNDED (buyer gets money back)
- DISPUTED → RELEASED (seller wins dispute)
- CANCELLED (before payment)
```

## Stripe Connect Setup Notes

### Account Type: CUSTOM
- **Why Custom?** Sellers cannot access Stripe dashboard
- **Benefit:** Seller never sees Stripe balance - only sees balance in YOUR app
- **Control:** Platform has full control over when payouts occur
- **Branding:** Completely white-labeled experience

### Payout Strategy: MANUAL with Immediate Transfer
```typescript
1. Payment captured → Funds in platform Stripe account
2. Conditions met → Transfer to seller's Connect account
3. IMMEDIATELY trigger payout → Funds go to seller's bank
4. Seller never sees/accesses Stripe balance
5. Payout typically takes 2-5 business days to bank
```

### Multi-Region Support
- NZ: Stripe Connect supports NZD
- AU: Stripe Connect supports AUD
- US: Stripe Connect supports USD
- 40+ countries supported

## Cron Job Setup

### Auto-Release Job
- **Frequency:** Every hour
- **Purpose:** Check and release funds when time-based conditions are met
- **Route:** `/api/cron/escrow-auto-release`
- **Security:** Protected by CRON_SECRET

### Vercel Cron Configuration
Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/escrow-auto-release",
    "schedule": "0 * * * *"
  }]
}
```

## Storage Buckets for Escrow

### 4. dispute-evidence
- **Purpose:** Store dispute evidence (photos, documents)
- Max file size: 10MB
- Allowed types: image/*, application/pdf
- Permissions: Platform read, user write own files

### 5. delivery-proofs
- **Purpose:** Store delivery confirmation photos
- Max file size: 5MB
- Allowed types: image/*
- Permissions: Platform read, seller write

## Compliance & Legal

- **Data Retention:** 7 years for all escrow transactions (financial compliance)
- **Audit Trail:** All events logged permanently
- **Dispute Records:** Must be retained with evidence
- **Payment Records:** Stripe automatically retains for 7 years
- **Tax Reporting:** Platform fees are taxable income
- **Know Your Customer (KYC):** Handled by Stripe Connect verification

## Total Collections Summary

**Original:** 3 collections (users, banks, transactions)
**Smart Wallet:** 16 collections (subscriptions through reports)
**Escrow System:** 4 collections (stripe_accounts through config)

**Grand Total:** 23 Collections
